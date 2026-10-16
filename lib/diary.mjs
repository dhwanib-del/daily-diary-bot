export const WELCOME = "Hi! We're Dhwani, Muffi, and Ashley. Thanks for joining our 7-day diary study!\n\nWe're studying what influences people to go outside or stay in, and how their daily experiences relate to mood and getting things done.\n\nA diary study is a series of quick check-ins about your own day. Sharing experiences as they happen helps us learn more than asking you to remember everything later. There are no right or wrong answers.\n\nEvery evening around 9 PM, we'll text 5 short questions, one at a time. Just reply with the number that fits best. You can reply SKIP when offered, STOP to opt out, or HELP for contact details.\n\nThanks for helping us with this research! Here's Day 1.";

export const QUESTIONS = Object.freeze({
  1: day => `Day ${day} of 7
Which best describes today?
1 I went outside
2 I tried to go out, but didn't
3 I wanted to go out, but stayed in
4 I chose to stay in
Reply 1-4. Text STOP to opt out.`,
  2: () => `How would you rate your mood right now?
1 Very low
2 Low
3 Okay
4 Good
5 Very good
Reply 1-5, or SKIP.`,
  3: (_day, activity) => activity === 'went'
    ? `What best describes your reason for going out?
1 Class or work
2 Seeing people
3 Errands
4 Fresh air or exercise
5 Something else
6 Wanted a break or change
Reply 1-6, or SKIP.`
    : `What best describes your reason for staying in?
1 Energy level
2 Work or study at home
3 Weather or transport
4 No plans
5 Preferred staying in
6 Something else
7 Getting ready felt like effort
8 Lost track of time
Reply 1-8, or SKIP.`,
  4: (_day, activity) => `Thinking about ${activity === 'went' ? 'going outside' : 'staying inside'} today, which fits best?
1 My mood felt better
2 I noticed no difference
3 My mood felt worse
4 Hard to say
Reply 1-4, or SKIP.`,
  5: () => `How much of what you planned did you do today?
1 Most of it
2 Some of it
3 Not much
4 I didn't have much planned
Reply 1-4, or SKIP.`
});
// Optional free-text prompts are rotated so we can learn about mood, barriers,
 // and potential reminders without adding mandatory questions to the diary.
export const REFLECTIONS = Object.freeze({
  1: 'What was on your mind when you chose to go out or stay in today?',
  2: 'Was leaving home easy or difficult at any point today? What made it that way?',
  3: 'Did your mood or energy shape your plans today, if at all? How?',
  4: 'Would a reminder or gentle nudge have been helpful today, or not? Why?',
  5: 'Did preparing to leave or remembering things affect your plans today?',
  6: "If you'd wanted support to leave home, what timing or type would feel right, if any?",
  7: 'Looking back on the week, what did you notice about going out, staying in, and how you felt?'
});
export const FINISH = (day) => `Thanks for sharing today! Day ${day} saved.\n\nOptional reflection: ${REFLECTIONS[day] ?? REFLECTIONS[1]}\nReply NOTE: with a short thought (no names). You can also leave it here.\n\nWith love,\nDhwani, Muffi & Ashley`;
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
      ? {1:'work_class',2:'social',3:'errands',4:'fresh_air_exercise',5:'other',6:'break_or_change'}
      : {1:'energy',2:'work_study',3:'weather_transport',4:'no_plan_or_company',5:'preferred_home',6:'other',7:'getting_ready_effort',8:'lost_track_of_time'};
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
  return day>=1 && day<=7 && moment.minutes >= 21*60 && moment.minutes < 21*60+15 ? {day,date:moment.date} : null;
}
export function isNote(text) {return /^note\s*:/i.test(text.trim());}
export function getNote(text) {return text.trim().replace(/^note\s*:/i,'').trim().slice(0,280);}
