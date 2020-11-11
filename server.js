const express = require('express');
const socketio = require('socket.io');
const http = require('http');

// Create server
const app = express();
const server = http.Server(app);

// Init Socket IO Server
const io = socketio(server);

// Called whend a client start a socket connection
io.on('connection', (socket) => {

});

// Start server in port 3000 or the port passed at "PORT" env variable
server.listen(process.env.PORT || 3000,
  () => console.log('Server Listen On: *:', process.env.PORT || 3000));
