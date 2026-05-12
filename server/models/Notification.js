const mongoose =
  require('mongoose');

const notificationSchema =
  new mongoose.Schema(
    {
      recipient: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
      },

      sender: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
      },

      type: {
        type: String,

        enum: [
          'leave',
          'payroll',
          'performance',
          'compliance',
          'onboarding',
          'attendance',
          'wellness',
          'engagement',
          'system',
        ],

        default: 'system',

        index: true,
      },

      title: {
        type: String,
        required: true,
        trim: true,
      },

      message: {
        type: String,
        required: true,
        trim: true,
      },

      read: {
        type: Boolean,
        default: false,
        index: true,
      },

      readAt: {
        type: Date,
        default: null,
      },

      archived: {
        type: Boolean,
        default: false,
        index: true,
      },

      archivedAt: {
        type: Date,
        default: null,
      },

      priority: {
        type: String,

        enum: [
          'low',
          'medium',
          'high',
          'critical',
        ],

        default: 'medium',

        index: true,
      },

      link: {
        type: String,
        default: '',
      },

      data: {
        type:
          mongoose.Schema.Types.Mixed,

        default: {},
      },

      deliveryStatus: {
        inApp: {
          type: String,

          enum: [
            'pending',
            'sent',
            'failed',
          ],

          default: 'sent',
        },

        email: {
          type: String,

          enum: [
            'pending',
            'sent',
            'failed',
            'skipped',
          ],

          default: 'skipped',
        },

        sms: {
          type: String,

          enum: [
            'pending',
            'sent',
            'failed',
            'skipped',
          ],

          default: 'skipped',
        },
      },
    },

    {
      timestamps: true,
    }
  );

notificationSchema.index({
  recipient: 1,
  read: 1,
  createdAt: -1,
});

notificationSchema.index({
  recipient: 1,
  archived: 1,
  createdAt: -1,
});

module.exports =
  mongoose.model(
    'Notification',
    notificationSchema
  );