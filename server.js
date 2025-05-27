// server.js
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*', // Laat tijdelijk alles toe, zodat Vite mag verbinden
  },
});

io.on('connection', socket => {
  console.log(`✅ Nieuwe speler verbonden: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`❌ Speler weg: ${socket.id}`);
  });
});

const players = {};

io.on('connection', socket => {
  console.log(`✅ Nieuwe speler verbonden: ${socket.id}`);

  players[socket.id] = {
    position: { x: 0, y: 1.5, z: 0 },
    rotation: { y: 0 },
  };

  socket.emit('currentPlayers', players);

  socket.broadcast.emit('newPlayer', { id: socket.id, ...players[socket.id] });

  socket.on('playerMovement', data => {
    if (players[socket.id]) {
      players[socket.id].position = data.position;
      players[socket.id].rotation = data.rotation;
      socket.broadcast.emit('playerMoved', { id: socket.id, ...data });
    }
  });

  socket.on('disconnect', () => {
    console.log(`❌ Speler weg: ${socket.id}`);
    delete players[socket.id];
    socket.broadcast.emit('playerDisconnected', socket.id);
  });
});

server.listen(3000, () => {
  console.log('🚀 Socket.io-server draait op http://localhost:3000');
});
