import {getPool} from '../lib/db.mjs';
const args=Object.fromEntries(process.argv.slice(2).map(x=>x.replace(/^--/,'').split('=')));
const code=args.code,phone=process.env.DIARY_PHONE,start=args.start,timezone=args.timezone??'America/Detroit',consent=args.consent;
if(!code||!/^P[0-9]{3,8}$/.test(code)||!/^\+[1-9]\d{7,14}$/.test(phone??'')||!/^\d{4}-\d{2}-\d{2}$/.test(start??'')||!consent||isNaN(Date.parse(consent))){
 console.error('Use DIARY_PHONE=+1... npm run enroll -- --code=P001 --start=2026-10-15 --timezone=America/Detroit --consent=2026-10-14T18:00:00Z');process.exit(1);
}
try{new Intl.DateTimeFormat('en',{timeZone:timezone});}catch{console.error('Invalid IANA timezone');process.exit(1);}
const db=getPool(),c=await db.connect();
try{
 await c.query('begin');
 const r=await c.query(`insert into diary.participants(participant_code,timezone,start_on,consent_at,opted_in)
 values($1,$2,$3,$4,true) returning id`,[code,timezone,start,consent]);
 await c.query('insert into diary.contacts(participant_id,phone_e164) values($1,$2)',[r.rows[0].id,phone]);
 await c.query('commit');console.log(`Enrolled ${code}; no message sent until scheduled first evening.`);
}catch(e){await c.query('rollback');console.error('Enrollment failed. Check duplicate code/phone and schema.');process.exitCode=1;}
finally{c.release();await db.end();}
