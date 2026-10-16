-- PRIVATE LAUNCH CHECK; read-only. Displays no phone numbers or diary answers.
-- 20 participants, codes P002-P021, 2026-10-16 start date.
with roster as (
  select
    p.participant_code,p.start_on,p.timezone,p.opted_in,p.consent_at,
    exists (
      select 1 from diary.contacts c
      where c.participant_id=p.id
      and c.phone_e164 ~ '^\+[1-9][0-9]{7,14}$'
    ) as valid_phone
  from diary.participants p
  where p.participant_code <> 'P001'
),
summary as (
  select
    count(*) as enrolled,
    count(*) filter(where participant_code between 'P002' and 'P021') as correct_code_range,
    count(*) filter(where opted_in and consent_at is not null
      and consent_at<=now()) as consented_and_active,
    count(*) filter(where start_on = date '2026-10-16') as correct_start,
    count(*) filter(where exists(select 1 from pg_timezone_names t
      where t.name=roster.timezone)) as valid_timezones,
    count(*) filter(where valid_phone) as valid_phone_contacts
  from roster
)
select
  enrolled,correct_code_range,consented_and_active,correct_start,
  valid_timezones,valid_phone_contacts,
  (select not opted_in from diary.participants where participant_code='P001') as pilot_excluded,
  (select active from cron.job where jobname='daily-diary-dispatch-every-15m' limit 1) as scheduler_enabled,
  (enrolled=20 and correct_code_range=20 and consented_and_active=20
    and correct_start=20 and valid_timezones=20 and valid_phone_contacts=20
    and coalesce((select not opted_in from diary.participants
      where participant_code='P001'),false)
  ) as roster_ready
from summary;
