import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

export const getEnv = (key) => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing env var: ${key}`);
  }
  return value;
};

export const getOptionalEnv = (key, fallback = '') => {
  return process.env[key] || fallback;
};

export const getMailer = () => {
  return nodemailer.createTransport({
    host: getEnv('SMTP_HOST'),
    port: Number(getEnv('SMTP_PORT')),
    secure: String(getOptionalEnv('SMTP_SECURE', 'true')) === 'true',
    auth: {
      user: getEnv('SMTP_USER'),
      pass: getEnv('SMTP_PASS')
    }
  });
};

export const sendEmail = async ({ to, subject, text, html }) => {
  const from = getEnv('SMTP_FROM');
  const mailer = getMailer();
  return mailer.sendMail({ from, to, subject, text, html });
};

export const getSupabase = () => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase not configured');
  }
  return createClient(supabaseUrl, supabaseKey);
};

export const getTodayInTz = (timeZone) => {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return formatter.format(new Date());
};
