const crypto = require('crypto');
const User = require('../models/User');
const Employee = require('../models/Employee');
const { templates } = require('../utils/emailService');
const { dispatchNotification } = require('../services/notificationOrchestrator');

exports.handleSocialLogin = async ({ provider, providerId, email, firstName, lastName, emailVerified }) => {
  if (!email) {
    const err = new Error(`${provider} did not return an email address.`);
    err.statusCode = 400;
    throw err;
  }

  // 1. Already linked -> straight login
  let user = await User.findOne({
    linkedAccounts: { $elemMatch: { provider, providerId } },
  });
  if (user) return { status: 'LOGIN', user };

  // 2. Email collides with an existing account -> do NOT auto-link.
  //    Require confirmation from the existing account's own inbox ("verify from that end"),
  //    on top of the provider already having verified the email ("verify from this end").
  const existing = await User.findOne({ email });
  if (existing) {
    const rawToken = existing.createPendingLinkToken(provider, providerId);
    await existing.save({ validateBeforeSave: false });

    const confirmURL = `${process.env.CLIENT_URL}/confirm-link/${rawToken}`;
    const tpl = templates.confirmSocialLink(existing.fullName, provider, confirmURL);
    try {
      await dispatchNotification({
        recipient: existing._id,
        channels: ['inApp', 'email'],
        type: 'social',
        title: 'Confirm your account link',
        message: `Someone tried to sign in with ${provider} using this email. If that was you, confirm the link to enable ${provider} sign-in.`,
        email: existing.email,
        emailContent: { subject: tpl.subject, html: tpl.html },
        link: '/settings/linked-accounts',
        priority: 'high',
        data: { provider },
      });
    } catch (notifyErr) {
      console.error('Failed to notify pending social link:', notifyErr);
    }

    return {
      status: 'PENDING_LINK',
      message: `An account already exists with this email. We've sent a confirmation link to ${email} — approve it to link your ${provider} sign-in.`,
    };
  }

  // 3. Brand-new user. Only auto-create if the provider itself verified the email;
  //    otherwise fall back to PENDING_LINK-style manual review isn't needed since there's
  //    nothing to collide with — but we still don't trust an unverified email.
  if (!emailVerified) {
    const err = new Error('Your email could not be verified by the provider. Please use email/password registration instead.');
    err.statusCode = 400;
    throw err;
  }

  const userCount = await User.countDocuments();
  const isFirstUser = userCount === 0;

  const created = await User.create({
    firstName: firstName || 'New',
    lastName: lastName || 'User',
    email,
    role: isFirstUser ? 'admin' : 'employee',
    status: isFirstUser ? 'APPROVED' : 'PENDING',
    isSystem: isFirstUser,
    protectedAccount: isFirstUser,
    emailVerified: true,
    linkedAccounts: [{ provider, providerId, email }],
  });

  await Employee.create({ user: created._id });

  if (!isFirstUser) {
    try {
      const admins = await User.find({
        role: { $in: ['superuser', 'admin', 'hr'] },
        status: 'APPROVED',
      }). select('_id email');

      await Promise.allSettled(
        admins.map((admin) =>
          dispatchNotification({
            recipient: admin._id,
            channels: ['inApp', 'email'],
            type: 'account',
            title: 'New registration awaiting approval',
            message: `${created.fullName} (${created.email}) signed up via ${provider} and is awaiting approval.`,
            email: admin.email,
            link: '/admin/users',
            priority: 'medium',
            data: { userId: created._id, provider },
          })
        )
      );
    } catch (notifyErr) {
      console.error('Failed to notify admins of social registration:', notifyErr);
    }
  }

  return { status: created.status === 'APPROVED' ? 'LOGIN' : 'PENDING_APPROVAL', user: created };
};

exports.confirmPendingLink = async (rawToken) => {
  const hashed = crypto.createHash('sha256').update(rawToken).digest('hex');

  const user = await User.findOne({
    'pendingLink.token': hashed,
    'pendingLink.expires': { $gt: Date.now() },
  }).select('+pendingLink.provider +pendingLink.providerId +pendingLink.token +pendingLink.expires');

  if (!user) {
    const err = new Error('This link confirmation is invalid or has expired.');
    err.statusCode = 400;
    throw err;
  }

  user.linkedAccounts.push({
    provider: user.pendingLink.provider,
    providerId: user.pendingLink.providerId,
    email: user.email,
  });
  const linkedProvider = user.pendingLink.provider;
  user.pendingLink = undefined;

  await user.save({ validateBeforeSave: false });

  try {
    await dispatchNotification({
      recipient: user._id,
      channels: ['inApp', 'email'],
      type: 'social',
      title: 'Account linked successfully',
      message: `Your ${linkedProvider} sign-in has been linked to your account.`,
      email: user.email,
      priority: 'low',
      data: { provider: linkedProvider },
    });
  } catch (notifyErr) {
    console.error('Failed to notify user of successful social link:', notifyErr);
  }

  return user;
};