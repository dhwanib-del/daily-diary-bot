import test from 'node:test';
import assert from 'node:assert/strict';
import {parseSurveyResponse,SURVEY_CHOICES} from '../lib/survey.mjs';
const valid=()=>{
 const f=new FormData();
 f.set('consent','yes');
 for(const [k,options] of Object.entries(SURVEY_CHOICES))f.set(k,options[0]);
 return f;
};
test('valid anonymous answers and reflection',()=>{
 const f=valid();f.set('mood','5');f.set('feelings_note','Took a short walk.');
 const parsed=parseSurveyResponse(f);
 assert.equal(parsed.consented,true);
 assert.equal(parsed.mood,5);
 assert.equal(parsed.feelings_note,'Took a short walk.');
 assert.equal(Object.hasOwn(parsed,'phone_e164'),false);
});
test('consent and required choices',()=>{
 const f=valid();f.delete('consent');assert.equal(parseSurveyResponse(f),null);
 const g=valid();g.delete('activity');assert.equal(parseSurveyResponse(g),null);
});
test('invalid codes and oversized free text',()=>{
 const f=valid();f.set('mood','9');assert.equal(parseSurveyResponse(f),null);
 const g=valid();g.set('support_note','x'.repeat(601));assert.equal(parseSurveyResponse(g),null);
});
test('optional timing and spam trap',()=>{
 const f=valid();f.delete('reminder_timing');
 assert.equal(parseSurveyResponse(f).reminder_timing,null);
 f.set('website','spam');assert.deepEqual(parseSurveyResponse(f),{spam:true});
});
