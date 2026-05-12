import { io } from 'socket.io-client';

let socket = null;

export const connectSocket = (
  token
) => {
  if (!token) {
    return null;
  }

  if (socket) {
    return socket;
  }

  socket = io(
    'http://localhost:5000',
    {
      auth: {
        token,
      },

      transports: ['websocket'],

      reconnection: true,

      reconnectionAttempts: 5,

      reconnectionDelay: 1000,

      autoConnect: true,
    }
  );

  socket.on('connect', () => {
    console.log(
      '✅ Socket connected'
    );
  });

  socket.on('disconnect', (reason) => {
    console.log(
      '❌ Socket disconnected:',
      reason
    );
  });

  socket.on('connect_error', (err) => {
    console.error(
      'Socket error:',
      err.message
    );
  });

  return socket;
};

export const getSocket = () =>
  socket;

export const disconnectSocket =
  () => {
    if (socket) {
      socket.removeAllListeners();

      socket.disconnect();

      socket = null;
    }
  };