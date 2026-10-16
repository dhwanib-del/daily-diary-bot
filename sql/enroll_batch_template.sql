-- Daily Diary Study: private batch enrollment template
-- Run ONLY in your project's Supabase SQL Editor.
-- DO NOT fill this file with real phone numbers in GitHub or ChatGPT.
--
-- BEFORE RUNNING
-- 1. Replace every +1REPLACE... with a consented participant's number in E.164.
-- 2. Replace consent timestamps with the ACTUAL recorded opt-in timestamps.
--    Keep written/recorded consent evidence in your approved university storage.
-- 3. Pick start_on for each participant. Each receives five short questions
--    starting October 16 at 9:00 PM local time for seven days (through October 22).
-- 4. Replace the timezone if needed (e.g. America/Detroit).
-- 5. Duplicate/delete VALUES rows as required. For 20 participants use P002 through P021.
-- 6. Verify the scheduler is still OFF before you finish reviewing the roster.
-- No messages are sent when this SQL runs.

BEGIN;

WITH roster(participant_code, phone_e164, timezone, start_on, consent_at) AS (
  VALUES
    ('P002', '+1REPLACE_NUMBER_1', 'America/Detroit', DATE '2026-10-16', 'REPLACE_ACTUAL_CONSENT_TIMESTAMP_1'::timestamptz),
    ('P003', '+1REPLACE_NUMBER_2', 'America/Detroit', DATE '2026-10-16', 'REPLACE_ACTUAL_CONSENT_TIMESTAMP_2'::timestamptz)
),
created AS (
  INSERT INTO diary.participants
    (participant_code, timezone, start_on, consent_at, opted_in)
  SELECT participant_code, timezone, start_on, consent_at, true
  FROM roster
  RETURNING id, participant_code
)
INSERT INTO diary.contacts (participant_id, phone_e164)
SELECT created.id, roster.phone_e164
FROM created JOIN roster USING (participant_code);

COMMIT;

-- Verify enrollment WITHOUT displaying phone numbers:
SELECT
  p.participant_code,
  p.start_on,
  p.timezone,
  (p.consent_at IS NOT NULL) AS consent_recorded,
  EXISTS (SELECT 1 FROM diary.contacts c WHERE c.participant_id = p.id) AS contact_registered,
  p.opted_in
FROM diary.participants p
WHERE p.participant_code <> 'P001'
ORDER BY p.participant_code;

-- Notes:
-- - If any row fails, the transaction should roll back; review your roster
--   before rerunning. Never rerun successful inserts with duplicate codes.
-- - Participants may text STOP to unsubscribe.
-- - To change an enrolled participant's start date before the first prompt,
--   update the row using their participant_code in the private SQL Editor.
