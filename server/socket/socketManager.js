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

module.exports = {
  setIO,
  getIO,
  onlineUsers,
};