export const QUESTIONS = Object.freeze({
  1: (day) => `🌷 Day ${day}/7 · Your 1-minute diary! Did you get outside today? (Dorm: outside your building.)\n1 Went out\n2 Tried but didn't\n3 Wanted to, stayed in\n4 Chose to stay home\nReply 1–4. Text STOP anytime.`,
  2: () => 'Mood check 💛 How did you feel EARLIER today, and how do you feel NOW? Reply TWO numbers (1 very low 😞 → 5 very good 😄). Example: 2 4. Reply SKIP if you prefer.',
  3: (_day,activity) => activity === 'went'
    ? 'What was the main reason you went out?\n1 Class/work\n2 Friends/people\n3 Errands\n4 Fresh air/exercise\n5 Other\nReply 1–5 or SKIP.'
    : 'What most influenced staying in?\n1 Energy/motivation\n2 Class/work\n3 Weather/transport\n4 No plan/people available\n5 Preferred staying home\n6 Other\nReply 1–6 or SKIP.',
  4: (_day,activity) => `Thinking about ${activity === 'went' ? 'going out' : 'staying home'}, how did it affect your mood, if at all?\n1 Felt better\n2 No real change\n3 Felt worse\n4 Not sure\nReply 1–4 or SKIP.`,
  5: () => 'Last one ✨ How did today go with the things you wanted to get done?\n1 Got most done\n2 Got some done\n3 Struggled to get things done\n4 Didn’t have much planned\nReply 1–4 or SKIP.'
});
export const FINISH = 'Saved 💗 Thank you! You’re done for today. If you want, reply NOTE: followed by one sentence about your day. See you tomorrow 🌷';
const choice = (raw, values) => values[raw.trim()] ?? null;
export function parseAnswer(step, body, activity) {
  const x = body.trim().toLowerCase();
  if (step !== 1 && ['skip','pass','prefer not'].includes(x)) return { skipped:true };
  if(step === 1) {
    const val = choice(x, {1:'went',2:'tried',3:'wanted',4:'chose',yes:'went',went:'went',tried:'tried',wanted:'wanted',chose:'chose'});
    return val ? {activity:val} : null;
  }
  if(step === 2) {
    const m = x.match(/^([1-5])\s*[,/\-\s]\s*([1-5])$/);
    return m ? { mood_earlier:Number(m[1]), mood_now:Number(m[2]) } : null;
  }
  if(step === 3) {
    const values = activity === 'went'
      ? {1:'work_class',2:'social',3:'errands',4:'fresh_air_exercise',5:'other'}
      : {1:'energy',2:'work_study',3:'weather_transport',4:'no_plan_or_company',5:'preferred_home',6:'other'};
    const val = choice(x,values);
    return val ? {main_reason:val} : null;
  }
  if(step === 4) {
    const val=choice(x,{1:'better',2:'same',3:'worse',4:'unsure'});
    return val ? {perceived_mood_effect:val} : null;
  }
  if(step === 5) {
    const val=choice(x,{1:'most',2:'some',3:'struggled',4:'little_planned'});
    return val ? {functioning:val} : null;
  }
  return null;
}
export function localMoment(date, timezone) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone, year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'
  }).formatToParts(date);
  const p = Object.fromEntries(parts.map(({type,value})=>[type,value]));
  return {date:`${p.year}-${p.month}-${p.day}`, minutes:Number(p.hour)*60+Number(p.minute)};
}
export function dayOfStudy(startISO, todayISO) {
  const ms=(iso)=>Date.parse(`${iso}T00:00:00Z`);
  return Math.round((ms(todayISO)-ms(startISO))/86400000)+1;
}
export function dueNow(startOn, timeZone, now=new Date()) {
  const moment=localMoment(now,timeZone);
  const day=dayOfStudy(startOn,moment.date);
  return day>=1 && day<=7 && moment.minutes >= 20*60+30 && moment.minutes < 21*60+15 ? {day,date:moment.date} : null;
}
export function isNote(text) {return /^note\s*:/i.test(text.trim());}
export function getNote(text) {return text.trim().replace(/^note\s*:/i,'').trim().slice(0,280);}
