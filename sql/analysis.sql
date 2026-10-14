-- Research-team-only descriptive queries, execute in the dedicated Supabase SQL Editor.
-- Interpret differences as associations, NOT causal effects of leaving home.

-- Seven-day diary completion rate per participant, without contact information.
select p.participant_code,
       count(s.id) as diaries_opened,
       count(s.id) filter (where s.status='complete') as diaries_completed,
       round(100.0*count(s.id) filter (where s.status='complete')/7,1) as completion_pct_of_7
from diary.participants p
left join diary.sessions s on s.participant_id=p.id
group by p.participant_code order by p.participant_code;

-- Patterns of outside/staying choices and average self-reported mood change.
-- Skipped mood ratings are naturally excluded from the average.
select activity,
       count(*) as n_entries,
       count(distinct participant_id) as n_participants,
       round(avg((mood_now-mood_earlier)::numeric),2) as avg_reported_mood_change,
       count(*) filter (where perceived_mood_effect='better') as perceived_better,
       count(*) filter (where functioning='struggled') as struggled_with_tasks
from diary.sessions where status='complete'
group by activity order by activity;

-- Facilitates qualitative within-participant comparison across days.
select p.participant_code,s.study_day,s.activity,s.main_reason,s.mood_earlier,s.mood_now,
       s.perceived_mood_effect,s.functioning,s.optional_note
from diary.sessions s join diary.participants p on p.id=s.participant_id
order by p.participant_code,s.study_day;
