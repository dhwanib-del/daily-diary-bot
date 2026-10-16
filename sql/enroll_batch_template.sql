-- PRIVATE BATCH ENROLLMENT TEMPLATE (PLACEHOLDERS ONLY).
-- IMPORTANT: Do not add real phone numbers to GitHub or ChatGPT.
-- Paste and edit this SQL ONLY in the private Supabase SQL Editor.
--
-- The user has confirmed that all participants consented to receive study texts.
-- This script sets consent_at=now() WHEN THE RESEARCH TEAM RECORDS THAT
-- CONFIRMATION IN THE DATABASE. It is NOT the original time of consent.
-- Retain actual consent records separately in institution-approved storage.
--
-- IMPORTANT BEFORE RUNNING
-- 1. Enter only consented, iMessage-capable participants.
-- 2. Replace every +1REPLACE... placeholder with a unique, valid
--    E.164 phone number. Do not use duplicate numbers.
-- 3. Use participant codes P002-P021. P001 is the retired pilot record.
-- 4. Check each participant's true IANA time zone.
-- 5. October 16, 2026 is the chosen launch date. The bot sends
--    at 9 PM local time daily for seven days (through October 22).
-- 6. Do not run after 9:15 PM local time expecting an October 16
--    Day 1 delivery; it will not automatically backfill missed days.
-- 7. Automatic sending remains OFF until the launch checklist is complete.
-- No messages are sent by executing this SQL.

BEGIN;

WITH roster(participant_code, phone_e164, timezone, start_on) AS (
  VALUES
    ('P002', '+1REPLACE_WITH_CONSENTED_NUMBER_1', 'America/Detroit', DATE '2026-10-16'),
    ('P003', '+1REPLACE_WITH_CONSENTED_NUMBER_2', 'America/Detroit', DATE '2026-10-16'),
    ('P004', '+1REPLACE_WITH_CONSENTED_NUMBER_3', 'America/Detroit', DATE '2026-10-16'),
    ('P005', '+1REPLACE_WITH_CONSENTED_NUMBER_4', 'America/Detroit', DATE '2026-10-16'),
    ('P006', '+1REPLACE_WITH_CONSENTED_NUMBER_5', 'America/Detroit', DATE '2026-10-16'),
    ('P007', '+1REPLACE_WITH_CONSENTED_NUMBER_6', 'America/Detroit', DATE '2026-10-16'),
    ('P008', '+1REPLACE_WITH_CONSENTED_NUMBER_7', 'America/Detroit', DATE '2026-10-16'),
    ('P009', '+1REPLACE_WITH_CONSENTED_NUMBER_8', 'America/Detroit', DATE '2026-10-16'),
    ('P010', '+1REPLACE_WITH_CONSENTED_NUMBER_9', 'America/Detroit', DATE '2026-10-16'),
    ('P011', '+1REPLACE_WITH_CONSENTED_NUMBER_10', 'America/Detroit', DATE '2026-10-16'),
    ('P012', '+1REPLACE_WITH_CONSENTED_NUMBER_11', 'America/Detroit', DATE '2026-10-16'),
    ('P013', '+1REPLACE_WITH_CONSENTED_NUMBER_12', 'America/Detroit', DATE '2026-10-16'),
    ('P014', '+1REPLACE_WITH_CONSENTED_NUMBER_13', 'America/Detroit', DATE '2026-10-16'),
    ('P015', '+1REPLACE_WITH_CONSENTED_NUMBER_14', 'America/Detroit', DATE '2026-10-16'),
    ('P016', '+1REPLACE_WITH_CONSENTED_NUMBER_15', 'America/Detroit', DATE '2026-10-16'),
    ('P017', '+1REPLACE_WITH_CONSENTED_NUMBER_16', 'America/Detroit', DATE '2026-10-16'),
    ('P018', '+1REPLACE_WITH_CONSENTED_NUMBER_17', 'America/Detroit', DATE '2026-10-16'),
    ('P019', '+1REPLACE_WITH_CONSENTED_NUMBER_18', 'America/Detroit', DATE '2026-10-16'),
    ('P020', '+1REPLACE_WITH_CONSENTED_NUMBER_19', 'America/Detroit', DATE '2026-10-16'),
    ('P021', '+1REPLACE_WITH_CONSENTED_NUMBER_20', 'America/Detroit', DATE '2026-10-16')
),
created AS (
  INSERT INTO diary.participants
    (participant_code, timezone, start_on, consent_at, opted_in)
  SELECT participant_code, timezone, start_on, now(), true
  FROM roster
  RETURNING id, participant_code
)
INSERT INTO diary.contacts (participant_id, phone_e164)
SELECT created.id, roster.phone_e164
FROM created JOIN roster USING (participant_code);

COMMIT;

-- Enrollment verification; does not reveal phone numbers or answers:
SELECT
  p.participant_code, p.start_on, p.timezone,
  (p.consent_at IS NOT NULL) AS enrollment_consent_confirmation_recorded,
  EXISTS (SELECT 1 FROM diary.contacts c WHERE c.participant_id=p.id)
    AS contact_registered,
  p.opted_in
FROM diary.participants p
WHERE p.participant_code <> 'P001'
ORDER BY p.participant_code;

-- If this was already run successfully, do NOT rerun unchanged.
-- To re-enroll or change a participant, review the existing record first.
