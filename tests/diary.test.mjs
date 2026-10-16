import test from 'node:test';
import assert from 'node:assert/strict';
import {parseAnswer, dayOfStudy, dueNow, localMoment,QUESTIONS,WELCOME,getNote} from '../lib/diary.mjs';
test('activity codes and incomplete answers',()=>{
 assert.deepEqual(parseAnswer(1,' 2 '),{activity:'tried'});
 assert.equal(parseAnswer(1,'8'),null);
 assert.equal(parseAnswer(1,'SKIP'),null);
});
test('simple one-number mood reply and backwards compatibility',()=>{
 assert.deepEqual(parseAnswer(2,'4'),{mood_now:4});
 assert.deepEqual(parseAnswer(2,' 1 '),{mood_now:1});
 assert.deepEqual(parseAnswer(2,'2 4'),{mood_earlier:2,mood_now:4});
 assert.deepEqual(parseAnswer(2,'2/4'),{mood_earlier:2,mood_now:4});
 assert.equal(parseAnswer(2,'9'),null);
 assert.equal(parseAnswer(2,'9 4'),null);
 assert.deepEqual(parseAnswer(2,'SKIP'),{skipped:true});
 assert.match(QUESTIONS[2](),/Reply 1-5/);
});
test('branching reasons are different',()=>{
 assert.deepEqual(parseAnswer(3,'1','went'),{main_reason:'work_class'});
 assert.deepEqual(parseAnswer(3,'1','wanted'),{main_reason:'energy'});
 assert.equal(parseAnswer(3,'6','went'),null);
 assert.match(QUESTIONS[3](2,'went'),/reason for going out/);
 assert.match(QUESTIONS[3](2,'chose'),/reason for staying in/);
});
test('effects, functioning and note',()=>{
 assert.deepEqual(parseAnswer(4,'4','went'),{perceived_mood_effect:'unsure'});
 assert.deepEqual(parseAnswer(5,'3'),{functioning:'struggled'});
 assert.equal(getNote(' NOTE: Just walked by the park '),'Just walked by the park');
});
test('study day boundaries and timezone incl DST',()=>{
 assert.equal(dayOfStudy('2026-10-14','2026-10-20'),7);
 assert.equal(dayOfStudy('2026-10-14','2026-10-21'),8);
 assert.deepEqual(localMoment(new Date('2026-10-15T00:35:00Z'),'America/Detroit'),{date:'2026-10-14',minutes:20*60+35});
 assert.deepEqual(dueNow('2026-10-14','America/Detroit',new Date('2026-10-15T00:35:00Z')),{date:'2026-10-14',day:1});
 assert.equal(dueNow('2026-10-14','America/Detroit',new Date('2026-10-15T02:35:00Z')),null);
 assert.deepEqual(dueNow('2026-10-31','America/Detroit',new Date('2026-11-02T01:35:00Z')),{date:'2026-11-01',day:2});
 assert.equal(dueNow('2026-10-14','America/Detroit',new Date('2026-10-22T00:35:00Z')),null);
});

test('texts are short and do not contain emoji',()=>{
 for(let i=1;i<=5;i++){
  const variants=i===3||i===4?['went','chose']:[undefined];
  for(const activity of variants){
   const message=QUESTIONS[i](1,activity);
   assert.ok(message.length<270,'SMS step '+i+' should stay brief');
   assert.doesNotMatch(message,/\p{Extended_Pictographic}/u);
   assert.match(message,/Reply /);
  }
 }
});

test('neutral mood wording and response codes stay comparable',()=>{
 assert.doesNotMatch(QUESTIONS[4](1,'went'),/affect your mood|made you feel/i);
 assert.doesNotMatch(QUESTIONS[4](1,'chose'),/affect your mood|made you feel/i);
 assert.match(QUESTIONS[4](1,'went'),/noticed no difference/);
 assert.match(QUESTIONS[4](1,'chose'),/Hard to say/);
 assert.deepEqual(parseAnswer(1,'3'),{activity:'wanted'});
 assert.deepEqual(parseAnswer(3,'5','chose'),{main_reason:'preferred_home'});
 assert.deepEqual(parseAnswer(4,'2','went'),{perceived_mood_effect:'same'});
 assert.deepEqual(parseAnswer(5,'4'),{functioning:'little_planned'});
});

test('one-time welcome text introduces the research team and opt-out',()=>{
 assert.match(WELCOME,/Dhwani, Muffi, and Ashley/);
 assert.match(WELCOME,/7-day diary study/);
 assert.match(WELCOME,/5 short questions/);
 assert.match(WELCOME,/STOP/);
 assert.match(WELCOME,/HELP/);
 assert.doesNotMatch(WELCOME,/\p{Extended_Pictographic}/u);
 assert.ok(WELCOME.length<310);
});
