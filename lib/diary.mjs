export const QUESTIONS = Object.freeze({
  1: (day) => `Day ${day} of 7
Did you go outside today?
1 Yes
2 I tried, but didn't
3 I wanted to, but stayed in
4 No, I chose to stay in
Reply 1-4. Text STOP to opt out.`,
  2: () => `How are you feeling right now?
1 Not great
2 A little low
3 Okay
4 Good
5 Great
Reply 1-5, or SKIP.`,
  3: (_day,activity) => activity === 'went'
    ? `What made you go outside?
1 Class or work
2 Seeing people
3 Errands
4 Fresh air or exercise
5 Something else
Reply 1-5, or SKIP.`
    : `Why did you stay inside?
1 Low energy
2 Busy at home
3 Weather or travel
4 No plans
5 Wanted to stay in
6 Something else
Reply 1-6, or SKIP.`,
  4: (_day,activity) => `Did ${activity === 'went' ? 'going outside' : 'staying inside'} affect your mood?
1 Felt better
2 About the same
3 Felt worse
4 Not sure
Reply 1-4, or SKIP.`,
  5: () => `Did you get done what you wanted to today?
1 Most of it
2 Some of it
3 Not much
4 I didn't have much planned
Reply 1-4, or SKIP.`
});
export const FINISH = 'Thanks! Your answers are saved for today. If you want to add anything, reply NOTE: and a short sentence.';
const choice = (raw, values) => values[raw.trim()] ?? null;
export function parseAnswer(step, body, activity) {
  const x = body.trim().toLowerCase();
  if (step !== 1 && ['skip','pass','prefer not'].includes(x)) return { skipped:true };
  if(step === 1) {
    const val = choice(x, {1:'went',2:'tried',3:'wanted',4:'chose',yes:'went',went:'went',tried:'tried',wanted:'wanted',chose:'chose'});
    return val ? {activity:val} : null;
  }
  if(step === 2) {
    // One-tap replies are easier. Keep older two-number replies valid for sessions
    // that were already sent the previous wording before this update.
    if (/^[1-5]$/.test(x)) return {mood_now:Number(x)};
    const legacy = x.match(/^([1-5])\s*[,/\-\s]\s*([1-5])$/);
    return legacy ? {mood_earlier:Number(legacy[1]),mood_now:Number(legacy[2])} : null;
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
