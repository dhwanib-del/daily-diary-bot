export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function POST(request) {
  // Fail closed until a real study-contact address is configured for HELP replies.
  const studyContact = process.env.STUDY_CONTACT_EMAIL;
  if (!studyContact || !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(studyContact))
    return new Response('Study contact not configured', {status:503});
  const secret = process.env.CRON_SECRET;
  if (!secret) return new Response('Scheduler not configured', { status: 503 });
  if (request.headers.get('authorization') !== `Bearer ${secret}`)
    return new Response('Unauthorized', { status: 401 });
  if (!process.env.DATABASE_URL || !process.env.IMESSAGE_PROJECT_ID || !process.env.IMESSAGE_PROJECT_SECRET)
    return new Response('Messaging/database not configured', { status: 503 });
  const [{bot}, {scheduleToday, flushOutbox}] = await Promise.all([
    import('../../../../lib/bot.mjs'),
    import('../../../../lib/db.mjs')
  ]);
  const started = await scheduleToday();
  const attempted = await flushOutbox(bot,120);
  return Response.json({started,attempted});
}
