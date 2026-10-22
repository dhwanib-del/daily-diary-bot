import {getPool} from '../../../lib/db.mjs';
import {parseSurveyResponse} from '../../../lib/survey.mjs';

export const runtime='nodejs';
export const dynamic='force-dynamic';

function textError(message,status=400){
  return new Response(message+'. Please go back and check your answers.',{
    status,headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'}
  });
}
export async function POST(request) {
  const len=Number(request.headers.get('content-length')||0);
  if(len>18000) return textError('That response was too long',413);
  let form;
  try {form=await request.formData();}
  catch {return textError('We could not read that submission');}
  const answer=parseSurveyResponse(form);
  if(!answer) return textError('Please fill in all required questions and check the consent box');
  if(answer.spam) return Response.redirect(new URL('/survey/thanks',request.url),303);
  try {
    const sql=[
      'insert into diary.web_survey_responses',
      '(consented,activity,mood,main_factor,perceived_mood_effect,',
      'plan_impact,reminder_help,reminder_timing,feelings_note,support_note)',
      'values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)'
    ].join(' ');
    await getPool().query(sql,[
      answer.consented,answer.activity,answer.mood,answer.main_factor,
      answer.perceived_mood_effect,answer.plan_impact,answer.reminder_help,
      answer.reminder_timing,answer.feelings_note,answer.support_note
    ]);
    return Response.redirect(new URL('/survey/thanks',request.url),303);
  } catch {
    // Don't leak survey answers, credentials or database diagnostics.
    return textError('We could not save your response right now',503);
  }
}
