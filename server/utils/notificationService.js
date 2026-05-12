const Notification =
  require('../models/Notification');

const logger =
  require('./logger');

const {
  getIO,
  getUserSockets,
} = require('../socket/socketManager');

const createNotification =
  async ({
    recipient,
    sender = null,

    type = 'system',

    title,
    message,

    data = {},
    link = '',

    priority = 'medium',
  }) => {
    try {
      const notification =
        await Notification.create({
          recipient,
          sender,

          type,

          title,
          message,

          data,
          link,

          priority,
        });

      try {
        const io = getIO();

        const sockets =
          getUserSockets(
            recipient.toString()
          );

        for (const socketId of sockets) {
          io.to(socketId).emit(
            'notification:new',
            notification
          );
        }
      } catch (socketErr) {
        logger.error(
          `Socket delivery failed: ${socketErr.message}`
        );
      }

      return notification;
    } catch (err) {
      logger.error(
        `Notification creation failed: ${err.message}`
      );

      throw err;
    }
  };

const markRead = async (
  notificationId,
  userId
) => {
  return Notification.findOneAndUpdate(
    {
      _id: notificationId,
      recipient: userId,
    },

    {
      read: true,
      readAt: new Date(),
    },

    {
      new: true,
    }
  ).lean();
};

const getUserNotifications =
  async (
    userId,
    {
      unreadOnly = false,
      archived = false,

      type = null,
      priority = null,

      search = '',

      page = 1,
      limit = 20,

      sort = 'desc',
    } = {}
  ) => {
    const filter = {
      recipient: userId,
      archived,
    };

    if (unreadOnly) {
      filter.read = false;
    }

    if (type) {
      filter.type = type;
    }

    if (priority) {
      filter.priority = priority;
    }

    if (search) {
      filter.$or = [
        {
          title: {
            $regex: search,
            $options: 'i',
          },
        },

        {
          message: {
            $regex: search,
            $options: 'i',
          },
        },
      ];
    }

    const skip =
      (page - 1) * limit;

    const sortDirection =
      sort === 'asc'
        ? 1
        : -1;

    const [
      notifications,
      total,
    ] = await Promise.all([
      Notification.find(filter)
        .sort({
          createdAt:
            sortDirection,
        })
        .skip(skip)
        .limit(limit)
        .lean(),

      Notification.countDocuments(
        filter
      ),
    ]);

    return {
      notifications,

      pagination: {
        total,
        page,
        limit,

        pages: Math.ceil(
          total / limit
        ),

        hasNext:
          page <
          Math.ceil(
            total / limit
          ),

        hasPrev:
          page > 1,
      },
    };
  };

module.exports = {
  createNotification,
  markRead,
  getUserNotifications,
};