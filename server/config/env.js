require('dotenv').config();

const required = [
  'PORT',
  'MONGO_URI',
  'JWT_SECRET',
  'JWT_EXPIRES_IN',
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASS',
];

const missing = required.filter(
  key => !process.env[key]
);

if (missing.length) {
  throw new Error(
    `Missing environment variables:\n${missing.join('\n')}`
  );
}

const NODE_ENV = process.env.NODE_ENV || 'development';

/* Weak JWT secrets let anyone forge admin tokens. Block the
   placeholder outright, and enforce a minimum length in production. */
const JWT_SECRET = process.env.JWT_SECRET;

if (
  !JWT_SECRET ||
  JWT_SECRET === 'change_this_to_a_long_random_secret_key' ||
  JWT_SECRET.length < 32
) {
  if (NODE_ENV === 'production') {
    throw new Error(
      'JWT_SECRET must be set to a strong random value (32+ chars) in production.'
    );
  }
  console.warn(
    '[env] WARNING: JWT_SECRET is weak or a placeholder — set a strong random value before deploying.'
  );
}

/* Email links and OAuth redirects are built from CLIENT_URL. */
if (NODE_ENV === 'production' && !process.env.CLIENT_URL) {
  throw new Error('CLIENT_URL is required in production (used for email links and CORS).');
}

module.exports = {
  PORT: process.env.PORT,
  NODE_ENV: process.env.NODE_ENV || 'development',

  MONGO_URI: process.env.MONGO_URI,

  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,

  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: process.env.SMTP_PORT,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
};