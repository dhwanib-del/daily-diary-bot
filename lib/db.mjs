import pg from 'pg';
import {WELCOME,QUESTIONS,FINISH,parseAnswer,dueNow,isNote,getNote} from './diary.mjs';

const {Pool} = pg;
// The database user needs access to the private "diary" schema.
// Also places Chat SDK's automatically created state tables in the private schema.
let pool;
export function getPool() {
  if (!pool) {
    if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
    pool = new Pool({connectionString:process.env.DATABASE_URL, options:'-c search_path=diary,public', max:4});
  }
  return pool;
}
function isoDate(v) { return typeof v === 'string' ? v.slice(0,10) : v.toISOString().slice(0,10); }
async function queue(client,id,content,sessionId=null,kind='question') {
  await client.query('insert into diary.outbox(participant_id,session_id,kind,content) values($1,$2,$3,$4)',[id,sessionId,kind,content]);
}
async function tx(fn) {
  const c=await getPool().connect();
  try {await c.query('begin');const output=await fn(c);await c.query('commit');return output;}
  catch(e){await c.query('rollback');throw e;}
  finally{c.release();}
}
/** Schedule a new Day N conversation only if it hasn't already been created. */
export async function scheduleToday(now=new Date()) {
  const {rows}=await getPool().query('select id,timezone,start_on from diary.participants where opted_in=true and consent_at is not null');
  let created=0;
  for(const p of rows){
    let due;
    try { due=dueNow(isoDate(p.start_on),p.timezone,now); }
    catch { continue; } // invalid IANA timezone; fix during enrollment.
    if(!due) continue;
    const did=await tx(async c=>{
      const inserted=await c.query(
        `insert into diary.sessions(participant_id,study_day,diary_date)
         select $1,$2,$3 where exists
         (select 1 from diary.participants where id=$1 and opted_in=true)
         on conflict(participant_id,study_day) do nothing returning id`,
        [p.id,due.day,due.date]);
      if(!inserted.rowCount)return false;
      // One-time introduction before the first question. The unique Day 1
      // session guarantees this cannot be queued again by another cron run.
      if (due.day === 1) await queue(c,p.id,WELCOME,inserted.rows[0].id,'system');
      await queue(c,p.id,QUESTIONS[1](due.day),inserted.rows[0].id);
      return true;
    });
    if(did)created++;
  }
  return created;
}
const FIELDS_BY_STEP={1:['activity'],2:['mood_earlier','mood_now'],3:['main_reason'],4:['perceived_mood_effect'],5:['functioning']};

/** Durable webhook processing; response content is reduced to coded fields. */
export async function processIncoming({phone,messageId,text}) {
  if(!/^\+[1-9]\d{7,14}$/.test(phone??'') || !messageId || typeof text !== 'string')return 'ignored';
  return tx(async c=>{
    const {rows}=await c.query(
      `select p.* from diary.participants p join diary.contacts x on x.participant_id=p.id
       where x.phone_e164=$1 for update of p`,[phone]);
    const person=rows[0];
    if(!person)return 'unknown';
    const inserted=await c.query(
      'insert into diary.inbound_events(provider_message_id,participant_id) values($1,$2) on conflict do nothing returning provider_message_id',
      [messageId,person.id]);
    if(!inserted.rowCount)return 'duplicate';
    const cleaned=text.trim();
    if(/^stop(?:\s+all)?$/i.test(cleaned)||/^unsubscribe$/i.test(cleaned)){
      await c.query('update diary.participants set opted_in=false where id=$1',[person.id]);
      await c.query("update diary.outbox set status='cancelled' where participant_id=$1 and status in ('pending','sending')",[person.id]);
      await queue(c,person.id,"You've been unsubscribed from diary texts. You won't receive more study prompts.",null,'system');
      return 'stopped';
    }
    if(!person.opted_in)return 'not_opted_in';
    if(/^help$/i.test(cleaned)){
      const contact=process.env.STUDY_CONTACT_EMAIL || 'your research team';
      await queue(c,person.id,`This is the 7-day diary study. Each day takes about 1 minute. Reply STOP to opt out. Questions? Contact ${contact}.`,null,'system');
      return 'help';
    }
    const {rows:sessions}=await c.query(
      `select * from diary.sessions where participant_id=$1 order by study_day desc limit 1 for update`,[person.id]);
    const s=sessions[0];
    if(isNote(cleaned)){
      const note=getNote(cleaned);
      if(s?.status==='complete' && note && Date.now()-new Date(s.completed_at).getTime()<36*3600000){
        await c.query('update diary.sessions set optional_note=$1 where id=$2',[note,s.id]);
        await queue(c,person.id,'Added your note.',s.id,'system');
        return 'noted';
      }
      await queue(c,person.id,'Notes can be added just after completing a daily diary. Reply NOTE: followed by one sentence.',null,'system');
      return 'noted_invalid';
    }
    if(!s || s.status!=='active'){
      await queue(c,person.id,"No diary question is open right now. Text STOP anytime.",null,'system');
      return 'not_open';
    }
    const answer=parseAnswer(s.step,cleaned,s.activity);
    if(!answer){
      await queue(c,person.id,`Please reply with one of the numbers listed below.\n${QUESTIONS[s.step](s.study_day,s.activity)}`,s.id,'system');
      return 'invalid';
    }
    const keys=FIELDS_BY_STEP[s.step];
    const values=keys.map(k=>answer.skipped?null:answer[k]??null);
    const assignments=keys.map((key,i)=>`${key}=$${i+1}`);
    if(s.step===5){
      await c.query(
        `update diary.sessions set ${assignments.join(',')},step=6,status='complete',completed_at=now() where id=$${keys.length+1}`,
        [...values,s.id]);
      await queue(c,person.id,FINISH,s.id);
      return 'completed';
    }
    await c.query(`update diary.sessions set ${assignments.join(',')},step=$${keys.length+1} where id=$${keys.length+2}`,
      [...values,s.step+1,s.id]);
    const nextActivity=s.step===1?answer.activity:s.activity;
    await queue(c,person.id,QUESTIONS[s.step+1](s.study_day,nextActivity),s.id);
    return 'advanced';
  });
}

/** Outbox delivers at-least-once. Retries are bounded; a crash after provider send can duplicate a prompt. */
export async function flushOutbox(bot,max=30) {
  let processed=0;
  for(let i=0;i<max;i++){
    const work=await tx(async c=>{
      const pick=await c.query(
        `with picked as (
          select o.id from diary.outbox o join diary.participants p on p.id=o.participant_id
          where (o.status='pending' or (o.status='sending' and o.claimed_at<now()-interval '10 minutes'))
            and o.available_at<=now() and o.attempts<5
            and (p.opted_in=true or o.kind='system')
          order by o.id for update of o skip locked limit 1
        )
        update diary.outbox o set status='sending',claimed_at=now(),attempts=attempts+1
        from picked where o.id=picked.id returning o.*`);
      if(!pick.rowCount)return null;
      const {rows}=await c.query('select phone_e164 from diary.contacts where participant_id=$1',[pick.rows[0].participant_id]);
      return {...pick.rows[0],phone:rows[0]?.phone_e164};
    });
    if(!work)break;
    try {
      if(!work.phone)throw new Error('Missing contact');
      // Photon Chat SDK adapter: cold-start DM by phone number.
      const adapter=bot.getAdapter('imessage');
      const dmId=await adapter.openDM(work.phone);
      await bot.thread(dmId).post(work.content);
      await getPool().query("update diary.outbox set status='sent',delivered_at=now(),last_error=null where id=$1",[work.id]);
    } catch {
      // Do not log phone numbers or provider error messages, which may contain personal data.
      await getPool().query(
        `update diary.outbox set status=case when attempts>=5 then 'failed' else 'pending' end,
          available_at=now()+interval '2 minutes',last_error='provider_send_failed' where id=$1`,[work.id]);
    }
    processed++;
  }
  return processed;
}
