const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const MicrosoftStrategy = require('passport-microsoft').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const LinkedInStrategy = require('passport-linkedin-oauth2').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const { handleSocialLogin } = require('../services/socialAuthService');

const BASE_CALLBACK = `${process.env.API_URL || 'http://localhost:5000'}/api/auth`;

function register(StrategyClass, provider, options, profileMapper) {
    const hasCredentials = options.clientID && options.clientSecret;

    if (!hasCredentials) {
        console.warn(
        `[passport] Skipping "${provider}" — missing client ID/secret in .env`
        );
        return;
    }


  passport.use(
    provider,
    new StrategyClass(
      {
        ...options,
        callbackURL: `${BASE_CALLBACK}/${provider}/callback`,
        passReqToCallback: true,
      },
      async (req, accessToken, refreshToken, profile, done) => {
        try {
          const mapped = profileMapper(profile);
          const result = await handleSocialLogin({ provider, ...mapped });
          done(null, result);
        } catch (err) {
          done(err);
        }
      }
    )
  );
}

register(
  GoogleStrategy,
  'google',
  { clientID: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET, scope: ['profile', 'email'] },
  (p) => ({
    providerId: p.id,
    email: p.emails?.[0]?.value,
    emailVerified: p.emails?.[0]?.verified ?? true,
    firstName: p.name?.givenName,
    lastName: p.name?.familyName,
  })
);

register(
  MicrosoftStrategy,
  'microsoft',
  { clientID: process.env.MS_CLIENT_ID, clientSecret: process.env.MS_CLIENT_SECRET, scope: ['user.read'] },
  (p) => ({
    providerId: p.id,
    email: p.emails?.[0]?.value || p._json?.mail || p._json?.userPrincipalName,
    emailVerified: true, // MS org/consumer accounts are pre-verified
    firstName: p.name?.givenName,
    lastName: p.name?.familyName,
  })
);

register(
  FacebookStrategy,
  'facebook',
  { clientID: process.env.FB_CLIENT_ID, clientSecret: process.env.FB_CLIENT_SECRET, profileFields: ['id', 'emails', 'name'] },
  (p) => ({
    providerId: p.id,
    email: p.emails?.[0]?.value,
    emailVerified: Boolean(p.emails?.[0]?.value), // FB only returns email if verified
    firstName: p.name?.givenName,
    lastName: p.name?.familyName,
  })
);

register(
  LinkedInStrategy,
  'linkedin',
  { clientID: process.env.LINKEDIN_CLIENT_ID, clientSecret: process.env.LINKEDIN_CLIENT_SECRET, scope: ['r_emailaddress', 'r_liteprofile'] },
  (p) => ({
    providerId: p.id,
    email: p.emails?.[0]?.value,
    emailVerified: true,
    firstName: p.name?.givenName,
    lastName: p.name?.familyName,
  })
);

register(
  GitHubStrategy,
  'github',
  { clientID: process.env.GITHUB_CLIENT_ID, clientSecret: process.env.GITHUB_CLIENT_SECRET, scope: ['user:email'] },
  (p) => ({
    providerId: p.id,
    email: p.emails?.find((e) => e.verified)?.value || p.emails?.[0]?.value,
    emailVerified: Boolean(p.emails?.find((e) => e.verified)),
    firstName: p.displayName?.split(' ')[0] || p.username,
    lastName: p.displayName?.split(' ').slice(1).join(' ') || '',
  })
);

module.exports = passport;