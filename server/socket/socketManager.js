let ioInstance = null;

const onlineUsers = new Map();

const setIO = (io) => {
  ioInstance = io;
};

const getIO = () => {
  if (!ioInstance) {
    throw new Error(
      'Socket.IO not initialized.'
    );
  }

  return ioInstance;
};

const getUserSocket = (userId) => {
  return onlineUsers.get(
    userId.toString()
  );
};

const getUserSockets = (userId) => {
  const socketId = onlineUsers.get(
    userId.toString()
  );

  return socketId
    ? [socketId]
    : [];
};

module.exports = {
  setIO,
  getIO,
  onlineUsers,
  getUserSocket,
  getUserSockets,
};