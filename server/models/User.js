const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require("crypto");

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },

    lastName: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      minlength: 8,
      select: false,
      required: function () {
        return this.linkedAccounts.length === 0;
      },
    },

    linkedAccounts: [
      {
        provider: {
          type: String,
          enum: ['google', 'facebook', 'github', 'linkedin', 'microsoft'],
          required: true,
        },
        providerId: {
          type: String,
          required: true,
        },
        email: String,
        linkedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Pending cross-account link, awaiting confirmation from the EXISTING account's inbox
    pendingLink: {
      provider: { type: String, select: false },
      providerId: { type: String, select: false },
      token: { type: String, select: false },
      expires: { type: Date, select: false },
    },

    role: {
      type: String,
      enum: [
        'employee',
        'manager',
        'hr',
        'admin',
      ],
      default: 'employee',
    },

    // ENTERPRISE ACCOUNT APPROVAL / LIFECYCLE
    status: {
      type: String,
      enum: [
        'PENDING',
        'APPROVED',
        'REJECTED',
        'SUSPENDED',
        'TERMINATED',
      ],
      default: 'PENDING',
    },

    // Set only when status transitions to TERMINATED.
    terminatedAt: {
      type: Date,
    },

    terminatedReason: {
      type: String,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    // Protected enterprise/system account
    isSystem: {
      type: Boolean,
      default: false,
      immutable: true,
    },

    // Prevents deletion/deactivation
    protectedAccount: {
      type: Boolean,
      default: false,
    },

    lastLogin: {
      type: Date,
    },

    passwordChangedAt: {
      type: Date,
    },

    passwordResetToken: {
      type: String,
      select: false,
    },

    passwordResetExpires: {
      type: Date,
      select: false,
    },

    emailVerificationToken: {
      type: String,
      select: false,
    },

    emailVerificationExpires: {
      type: Date,
      select: false,
    },

    emailVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
    },
    toObject: {
      virtuals: true,
    },
  }
);

userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  this.password = await bcrypt.hash(this.password, 12);

  this.passwordChangedAt = Date.now() - 1000;

  next();
});

userSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.createPasswordResetToken = function () {

    const resetToken =
        crypto.randomBytes(32).toString("hex");

    this.passwordResetToken =
        crypto
            .createHash("sha256")
            .update(resetToken)
            .digest("hex");

    this.passwordResetExpires =
        Date.now() + 15 * 60 * 1000;

    return resetToken;

};

userSchema.methods.clearPasswordReset = function () {

    this.passwordResetToken = undefined;

    this.passwordResetExpires = undefined;

};

userSchema.methods.createEmailVerificationToken = function () {

    const token =
        crypto.randomBytes(32).toString("hex");

    this.emailVerificationToken =
        crypto
            .createHash("sha256")
            .update(token)
            .digest("hex");

    this.emailVerificationExpires =
        Date.now() + 24 * 60 * 60 * 1000;

    return token;

};

userSchema.methods.changedPasswordAfter = function (jwtTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );

    return jwtTimestamp < changedTimestamp;
  }

  return false;
};

userSchema.methods.createPendingLinkToken = function (provider, providerId) {
  const raw = crypto.randomBytes(32).toString('hex');
  this.pendingLink = {
    provider,
    providerId,
    token: crypto.createHash('sha256').update(raw).digest('hex'),
    expires: Date.now() + 30 * 60 * 1000,
  };
  return raw;
};

/*
|--------------------------------------------------------------------------
| ACCOUNT LIFECYCLE HELPERS
|--------------------------------------------------------------------------
| Used by admin-controlled status transitions (suspend / terminate /
| reinstate). Kept on the model so every caller applies the same rules
| instead of setting `status` directly in controllers.
*/

userSchema.methods.terminate = function (reason) {
  this.status = 'TERMINATED';
  this.terminatedAt = new Date();
  this.terminatedReason = reason || undefined;
};

userSchema.methods.reinstate = function () {
  this.status = 'APPROVED';
  this.terminatedAt = undefined;
  this.terminatedReason = undefined;
};

userSchema.index({
    passwordResetToken: 1,
    passwordResetExpires: 1,
});

userSchema.index({ 'linkedAccounts.provider': 1, 'linkedAccounts.providerId': 1 });
userSchema.index({ 'pendingLink.token': 1 });

module.exports = mongoose.model('User', userSchema);