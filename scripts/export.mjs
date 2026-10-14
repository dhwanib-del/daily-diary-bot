import fs from 'node:fs';
import {getPool} from '../lib/db.mjs';
const dest=process.argv[2]||'diary-export.csv';
const db=getPool();
const {rows}=await db.query(`select p.participant_code,s.study_day,s.diary_date,s.activity,s.mood_earlier,
  s.mood_now,s.main_reason,s.perceived_mood_effect,s.functioning,s.optional_note,
  s.status,s.completed_at from diary.sessions s join diary.participants p on p.id=s.participant_id
  order by p.participant_code,s.study_day`);
const keys=['participant_code','study_day','diary_date','activity','mood_earlier','mood_now','main_reason','perceived_mood_effect','functioning','optional_note','status','completed_at'];
function csvCell(x){
  if(x==null)return '';
  const str=x instanceof Date?x.toISOString():String(x);
  // Prevent CSV spreadsheet formula injection.
  const clean=/^[=+@\-\t\r]/.test(str)?`'${str}`:str;
  return `"${clean.replaceAll('"','""')}"`;
}
fs.writeFileSync(dest,[keys.join(','),...rows.map(r=>keys.map(k=>csvCell(r[k])).join(','))].join('\n'));
console.log(`Exported ${rows.length} pseudonymous diary rows to ${dest}. No phone numbers included.`);
await db.end();
