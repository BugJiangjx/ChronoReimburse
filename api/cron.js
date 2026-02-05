import { getOptionalEnv, getSupabase, getTodayInTz, sendEmail } from './_shared.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ ok: false, message: 'Method Not Allowed' });
  }

  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    const querySecret = req.query?.secret;
    if (token !== cronSecret && querySecret !== cronSecret) {
      return res.status(401).json({ ok: false, message: 'Unauthorized' });
    }
  }

  try {
    const timeZone = getOptionalEnv('CRON_TIMEZONE', 'Asia/Shanghai');
    const today = getTodayInTz(timeZone);
    const nowIso = new Date().toISOString();
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('alarm_requests')
      .select('id, email, remind_date, status')
      .eq('status', 'pending')
      .eq('remind_date', today)
      .lte('scheduled_at', nowIso);

    if (error) {
      console.error('Cron load error:', error);
      return res.status(500).json({ ok: false, message: error.message });
    }

    for (const item of data || []) {
      try {
        if (!item.email) {
          await supabase
            .from('alarm_requests')
            .update({ status: 'failed' })
            .eq('id', item.id);
          continue;
        }
        const subject = `提醒：${item.remind_date} 09:00`;
        const text = `这是您的出差提醒：${item.remind_date} 09:00。`;
        await sendEmail({ to: item.email, subject, text });
        await supabase
          .from('alarm_requests')
          .update({ status: 'sent' })
          .eq('id', item.id);
      } catch (err) {
        console.error('Send email failed:', err);
        await supabase
          .from('alarm_requests')
          .update({ status: 'failed' })
          .eq('id', item.id);
      }
    }

    return res.json({ ok: true, processed: (data || []).length });
  } catch (err) {
    console.error('Cron error:', err);
    return res.status(500).json({ ok: false, message: err.message });
  }
}
