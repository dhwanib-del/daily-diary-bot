// Anonymous, one-time study survey. Do not collect phone numbers or identifiers.
export const SURVEY_CHOICES = Object.freeze({
  activity: ['went','tried','wanted','chose'],
  mood: ['1','2','3','4','5'],
  main_factor: ['work_class','social','errands','fresh_air','energy','getting_ready','weather_transport','lost_time','prefer_home','other'],
  perceived_mood_effect: ['better','same','worse','unsure'],
  plan_impact: ['yes','somewhat','no','no_plans'],
  reminder_help: ['yes','maybe','no','not_sure'],
  reminder_timing: ['before_plans','after_time_inside','on_request','never','not_sure'],
});
export function parseSurveyResponse(form) {
  if (form.get('website')) return {spam:true};
  if (form.get('consent') !== 'yes') return null;
  const answer={consented:true};
  for(const [field, values] of Object.entries(SURVEY_CHOICES)) {
    const raw=form.get(field);
    if(field==='reminder_timing' && (raw===null || raw==='')) {
      answer[field]=null;
      continue;
    }
    if(typeof raw!=='string' || !values.includes(raw)) return null;
    answer[field]=field==='mood'?Number(raw):raw;
  }
  for(const field of ['feelings_note','support_note']) {
    const raw=form.get(field)??'';
    if(typeof raw!=='string' || raw.length>600) return null;
    answer[field]=raw.trim()||null;
  }
  return answer;
}
