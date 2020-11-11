const express = require('express');
const socketio = require('socket.io');
const http = require('http');

// Create server
const app = express();
const server = http.Server(app);

// Map HTML and Javascript files as static
app.use(express.static('public'));

// Init Socket IO Server
const io = socketio(server);

// Array to map all clients connected in socket
let connectedUsers = [];

// Called whend a client start a socket connection
io.on('connection', (socket) => {
  // It's necessary to socket knows all clients connected
  connectedUsers.push(socket.id);

  // Emit to myself the other users connected array to start a connection with each them
  const otherUsers = connectedUsers.filter(socketId => socketId !== socket.id);
  socket.emit('other-users', otherUsers);

  // Send Offer To Start Connection
  socket.on('offer', (socketId, description) => {
    socket.to(socketId).emit('offer', socket.id, description);
  });

  // Send Answer From Offer Request
  socket.on('answer', (socketId, description) => {
    socket.to(socketId).emit('answer', socket.id, description);
  });

  // Send Signals to Establish the Communication Channel
  socket.on('candidate', (socketId, signal) => {
    socket.to(socketId).emit('candidate', socket.id, signal);
  });

  // Remove client when socket is disconnected
  socket.on('disconnect', () => {
    connectedUsers = connectedUsers.filter(socketId => socketId !== socket.id);
  });
});

// Return Index HTML when access root route
app.get('/', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'public', 'index.html'));
});

// Start server in port 3000 or the port passed at "PORT" env variable
server.listen(process.env.PORT || 3000,
  () => console.log('Server Listen On: *:', process.env.PORT || 3000));
