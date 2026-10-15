# Daily Diary Bot — Photon + Supabase

A working pilot implementation for a **seven-day, five-question conversational iMessage diary study**. It asks one question per text and saves responses in a dedicated private Supabase Postgres schema. It does **not** call a generative AI API. Study replies are parsed using a deterministic answer key, so questions remain comparable.

**State:** This bot is deployed for a controlled single-device pilot on Vercel with Photon and Supabase. Automatic recurring dispatch must remain disabled until the full inbound-reply test is verified. Do not enroll real research participants without the approved consent and testing checklist below.

## Daily flow (five numbered questions)

| # | Prompt | Stored fields |
|---|---|---|
| 1 | Did you get outside? Went / tried / wanted but stayed / chose to stay | `activity` |
| 2 | Current mood, one number from 1-5 | `mood_now` (`mood_earlier` is legacy only) |
| 3 | Main reason for going out or staying in (branching) | `main_reason` |
| 4 | Perceived effect of outing/staying home on mood | `perceived_mood_effect` |
| 5 | How much of the day's intended activities got done? | `functioning` |

After Q5 participants see a thank-you and can optionally send `NOTE: ...` to add one sentence of context. They may reply `SKIP` to questions 2–5 (including mood) or `STOP` at any time. The bot supports `HELP` and does not accept messages from unrecognized, unconsented phone numbers.

One check-in is sent between **8:30–9:15 p.m. in each participant's local timezone** on each of seven consecutive local calendar dates, with default timezone `America/Detroit`. The scheduler is invoked every 15 minutes and uses date calculations robust to daylight-saving changes. If it fails throughout the entire delivery window, a diary day may be missed (not silently backfilled); check cron/outbox status during the pilot.

## Architecture

```
Supabase Cron (every 15 min) ──authenticated POST──> Next.js /api/cron/diary
                                                       |    └─ creates daily session + queues outgoing message
Photon Spectrum Cloud <--messages via Chat SDK adapter--+    └─ retries outbox
       |
       +── signed webhook POST --> Next.js /api/imessage/webhook
                                      └─ verify signature via Photon adapter
                                         └─ dedupe inbound event
                                            └─ update session fields (Postgres transaction)
                                               └─ queue next question
                                                  └─ send via Photon

Supabase PostgreSQL: diary.participants + diary.contacts + diary.sessions
                    diary.inbound_events + diary.outbox
```

The Chat SDK uses a durable PostgreSQL state adapter and the same pool set to `search_path=diary,public`; ensure its state tables also land in the **private diary schema**, not in `public`. The app does not expose a participant-facing API to read records.

## 1. Make a dedicated Supabase project

Use a **new** Supabase project for the diary rather than an unrelated app's database. Set it to a region appropriate for your research participants and review institutional research/data-sharing policy.

1. In the project's **SQL Editor**, run `sql/schema.sql`.
2. Verify the five `diary.*` tables exist, and `diary` is **not exposed** through Supabase Data API settings. The schema enables RLS and revokes public/anonymous access.
3. In **Database → Connect**, obtain a server-side Postgres connection string with SSL. Add it to `DATABASE_URL` in your local `.env.local` and to your Vercel project's server-side environment variables. Never expose this URL in browser code or GitHub.
4. Use the Supabase pooler connection URL where appropriate for serverless deployments. Check that the connection role can create the Chat SDK state tables under `diary` (or pre-create them using the adapter's migration path) and does not expose new tables in `public`.

### Participant enrollment / consent

**Do not put real participant phone numbers in the repository.** After your study's approved consent procedure, you can enroll a participant locally:

```bash
# Copy .env.example to .env.local and fill in server-only values first.
DIARY_PHONE='+17345550123' npm run enroll -- \
  --code=P001 \
  --start=2026-10-15 \
  --timezone=America/Detroit \
  --consent=2026-10-14T18:00:00Z
```

These are EXAMPLE numbers and dates. `--consent` must be the real recorded opt-in time. Store participant ID/code separately from consent records if required by your university. Enrolling does **not** send a message immediately; the Day 1 prompt is sent at the configured evening window. A participant has a single 7-day period; after Day 7, no more daily prompts are generated.

## 2. Configure Photon Spectrum Cloud

1. Set up a Photon Spectrum Cloud project at https://app.photon.codes. Acquire its `IMESSAGE_PROJECT_ID` and `IMESSAGE_PROJECT_SECRET` in Photon's dashboard; **never paste secrets into a public conversation or repo**.
2. Add both as **server-only** Vercel environment variables.
3. After deploying to Vercel, register a Photon webhook pointing to:
   `https://YOUR-DEPLOYED-APP.vercel.app/api/imessage/webhook`
4. Store the resulting per-webhook signing secret as `IMESSAGE_WEBHOOK_SECRET`. The Photon adapter verifies the HMAC and rejects bad or stale deliveries.
5. Configure one iMessage sender/line for the study and test a real opt-in device. This kit uses the **Photon cloud** adapter, not an archived/legacy Photon webhook package and not a local Mac relay.

Docs: https://github.com/photon-hq/vercel-chat-adapter-imessage ; https://chat-sdk.dev/docs/direct-messages

If participants use non-iMessage phones, do not assume automatic SMS/RCS fallback: configure and test a supported separate Photon channel or recruit iMessage-capable users only. Check Photon pricing/quota and messaging compliance before recruitment.

## 3. Deploy Next.js on Vercel

Run `npm install` (commit the generated lockfile to your repo), `npm test`, then `npm run build`. Deploy this **new** repository as a Next.js project on Vercel, and configure:

| Env variable | Purpose |
|---|---|
| `DATABASE_URL` | Server-only Supabase Postgres URL |
| `IMESSAGE_PROJECT_ID` | Photon project ID |
| `IMESSAGE_PROJECT_SECRET` | Photon project secret |
| `IMESSAGE_WEBHOOK_SECRET` | Inbound Photon HMAC signing secret |
| `CRON_SECRET` | Long, random bearer token for scheduler endpoint |
| `STUDY_CONTACT_EMAIL` | Human contact for `HELP` |

Do not use a `NEXT_PUBLIC_` prefix. Use Production env for the production deployment. Limit Vercel log retention to the needs of the study and avoid logging messages or phone numbers.

## 4. Turn on the Supabase Scheduler

After deployment and secrets are configured:

1. Enable **pg_cron** (Supabase Cron) and **pg_net** in your dedicated Supabase project.
2. Store the deployed cron endpoint URL and matching `CRON_SECRET` in **Supabase Vault** (see placeholders in `sql/scheduler.sql`).
3. Run the `cron.schedule(...)` statement from `sql/scheduler.sql` after replacing placeholders.
4. Confirm a run in the Supabase Cron run history and verify the Vercel function returns 200.

This avoids a Vercel Hobby limitation: Vercel cron jobs on Hobby plans only run once per day, which is insufficient for the local-time 15-minute scheduling window. Supabase Cron provides the 15-minute cadence.

## 5. Run a controlled end-to-end pilot

**First, with a consenting teammate/test number only:**

1. `npm test` validates the question parser, day bounds, branching, and Detroit daylight-saving behavior.
2. `node scripts/demo.mjs` displays a complete sample conversation without sending messages.
3. Deploy, configure Photon webhook and secrets, and enroll **one** test participant.
4. Make Day 1 `start_on` today's local calendar date. Test within the evening window, or temporarily change `dueNow()` in a nonproduction test copy to send the opening question now.
5. Reply `1`, `4`, `4`, `1`, `2`. Check the saved fields and `status='complete'` in `diary.sessions`.
6. Reply with an invalid value, `SKIP`, and `NOTE: ...`; verify behavior and no duplicates with repeated webhook delivery.
7. Check `HELP`, and finally `STOP`; confirm `opted_in=false` and no future prompts.
8. Check `diary.outbox` for `failed` messages, retries, unexpected duplicates or unsent prompts. Check Supabase Cron logs and Vercel Function logs.

**Reliability note:** The inbound webhook is deduplicated by provider message ID and session creation is unique by participant/day. Outbound delivery is **at least once**, not guaranteed exactly once; an outage just after Photon accepts a message but before Postgres records success can create a duplicate. Spot-check this behavior before the study and reconcile exceptions. Maximum five send attempts are configured.

## 6. Export response data

```bash
npm run export -- ./diary-export.csv
```

Additionally, run `sql/analysis.sql` for basic completion and descriptive pattern queries. Export contains one row per participant/day, day 1–7, mood ratings, reasons, functioning, optional note, and completion status. Phone numbers are not exported. Store exported CSVs in your university-approved restricted research storage; avoid uploading identifying or free-text research entries to public projects.

## Privacy and research notes

- Use explicit, documented opt-in for text reminders and messaging-provider processing; verify research/IRB/course/institutional privacy approvals.
- The contact phone number is kept in `diary.contacts`, separate from pseudonymous coded diary responses in `diary.sessions`.
- The questionnaire uses **fixed response categories** and **does not send participant mood entries to ChatGPT or any LLM**. Photon necessarily processes messaging metadata/content to deliver texts, and Vercel/Supabase process or store study data as configured.
- Sent messages and replies may remain visible in participants' messaging apps and in messaging-provider systems; never promise anonymity in transit.
- `STOP` stops future texts but retains existing coded entries until study-policy deletion. Set a retention/deletion schedule before collecting real data.
- Compare outcomes within participant over time; this brief diary does **not** establish that going out caused mood changes.
- Provide a human study contact and don't use the chatbot to diagnose, evaluate or treat mental health. Avoid praise that frames outings as better than staying home.

## Files

- `lib/diary.mjs` — five questions, branching, answers, timezone logic.
- `lib/db.mjs` — transactional state updates, dedupe, scheduler and reliable outbox.
- `lib/bot.mjs` — Photon Chat SDK adapter and DM handler.
- `app/api/imessage/webhook/route.js` — authenticated Photon webhook.
- `app/api/cron/diary/route.js` — authenticated dispatcher.
- `sql/schema.sql` — private Supabase database schema.
- `sql/scheduler.sql` — hourly-independent Supabase Cron setup.
- `scripts/enroll.mjs` — opt-in CLI enrollment; no contacts in git.
- `scripts/export.mjs` — pseudonymous CSV export.
- `scripts/demo.mjs` — offline sample chat.
- `tests/diary.test.mjs` — deterministic flow tests.

### Current build verification limitations

The deterministic JavaScript tests pass, but this environment cannot reach the npm package registry (`EAI_AGAIN`), so package installation, lockfile generation, a Next.js production build, live webhook signature verification, and actual Supabase SQL execution **have not been verified here**. After obtaining credentials, run `npm install` to produce and commit `package-lock.json`, then `npm test`, `npm run build`, and the opt-in pilot. Do not treat this starter as a fully activated service until those pass.
