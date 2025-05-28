import express from 'express';
import http from 'http';
import { Server } from 'socket.io';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

const players = {};

io.on('connection', socket => {
  console.log(`✅ Nieuwe speler verbonden: ${socket.id}`);

  // Voeg nieuwe speler toe
  players[socket.id] = {
    id: socket.id,
    position: { x: 0, y: 1.5, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
  };

  // Stuur huidige spelers naar de nieuwe speler
  socket.emit('currentPlayers', players);

  // Informeer anderen over de nieuwe speler
  socket.broadcast.emit('newPlayer', players[socket.id]);

  // Ontvang bewegingen van speler
  socket.on('playerMovement', data => {
    if (players[socket.id]) {
      players[socket.id].position = data.position;
      players[socket.id].rotation = data.rotation;
      socket.broadcast.emit('playerMoved', {
        id: socket.id,
        position: data.position,
        rotation: data.rotation,
      });
    }
  });

  // Verwijder speler bij disconnect
  socket.on('disconnect', () => {
    console.log(`❌ Speler weg: ${socket.id}`);
    delete players[socket.id];
    socket.broadcast.emit('playerDisconnected', socket.id);
  });
});

server.listen(3000, () => {
  console.log('🚀 Socket.io-server draait op http://localhost:3000');
});
