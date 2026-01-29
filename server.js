const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs');
const path = require('path');

// ==================== INITIALIZATION ====================
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: '*' }
});

// ==================== CONFIGURATION ====================
const PORT = process.env.PORT || 3000;
const SONGS_FOLDER = path.join(__dirname, 'songs');
const ROUND_DURATION = 180; // 3 minutes in seconds

// ==================== MIDDLEWARE ====================
app.use(express.static(__dirname));
app.use(express.json());

// ==================== DATA STRUCTURES ====================
const rooms = {};
const roomTimers = {};
const userSockets = {};

// ==================== UTILITY FUNCTIONS ====================
function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function getSongsFromFolder() {
  try {
    if (!fs.existsSync(SONGS_FOLDER)) {
      fs.mkdirSync(SONGS_FOLDER, { recursive: true });
    }

    const files = fs.readdirSync(SONGS_FOLDER);
    const songs = files
      .filter(file => /\.(mp3|wav|ogg|m4a|aac)$/i.test(file))
      .map((file, index) => ({
        id: index,
        name: path.parse(file).name.replace(/[-_]/g, ' '),
        filename: file,
        path: `/songs/${file}`
      }));

    return songs.length > 0 ? songs : [];
  } catch (error) {
    console.error('❌ Error reading songs folder:', error);
    return [];
  }
}

function startRoundTimer(roomCode) {
  if (roomTimers[roomCode]) {
    clearInterval(roomTimers[roomCode]);
  }

  let timeRemaining = ROUND_DURATION;
  roomTimers[roomCode] = setInterval(() => {
    timeRemaining--;
    
    // Emit timer update to all players
    io.to(roomCode).emit('timerUpdate', { timeRemaining });

    if (timeRemaining <= 0) {
      clearInterval(roomTimers[roomCode]);
      delete roomTimers[roomCode];
      const room = rooms[roomCode];
      if (room) {
        console.log(`⏰ [${roomCode}] Round timer expired! Moving to next host...`);
        moveToNextHost(roomCode);
      }
    }
  }, 1000);
}

function moveToNextHost(roomCode) {
  const room = rooms[roomCode];
  if (!room || room.players.length < 2) return;

  const currentHostIndex = room.players.findIndex(p => p.isHost);
  const nextHostIndex = (currentHostIndex + 1) % room.players.length;
  const newHost = room.players[nextHostIndex];

  // Update host role
  room.players.forEach(p => p.isHost = false);
  room.players[nextHostIndex].isHost = true;
  room.currentRound = (room.currentRound || 1) + 1;

  console.log(`🎵 [${roomCode}] New host: ${newHost.username} (Round ${room.currentRound})`);

  // Restart timer
  startRoundTimer(roomCode);

  // Notify all clients
  io.to(roomCode).emit('hostChanged', {
    newHostId: newHost.id,
    newHostName: newHost.username,
    players: room.players,
    round: room.currentRound
  });
}

// ==================== SOCKET.IO EVENTS ====================
io.on('connection', (socket) => {
  console.log(`\n✅ User connected: ${socket.id}`);

  // ==================== ROOM CREATION ====================
  socket.on('createRoom', (data) => {
    try {
      const roomCode = generateRoomCode();
      const newRoom = {
        code: roomCode,
        host: { id: socket.id, username: data.username, phone: data.phone },
        players: [{ id: socket.id, username: data.username, phone: data.phone, isHost: true }],
        isStarted: false,
        scores: {},
        chatMessages: [],
        currentRound: 1
      };

      rooms[roomCode] = newRoom;
      userSockets[socket.id] = roomCode;
      socket.join(roomCode);
      socket.data.roomCode = roomCode;
      socket.data.username = data.username;

      console.log(`🏠 [${roomCode}] Room created by ${data.username}`);
      socket.emit('roomCreated', {
        roomCode: roomCode,
        players: newRoom.players
      });
    } catch (error) {
      console.error('❌ Error creating room:', error);
      socket.emit('error', { message: 'Failed to create room' });
    }
  });

  // ==================== ROOM JOIN ====================
  socket.on('joinRoom', (data) => {
    try {
      const roomCode = data.roomCode.toUpperCase();
      const room = rooms[roomCode];

      if (!room) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      if (room.isStarted) {
        socket.emit('error', { message: 'Game already started' });
        return;
      }

      // Check if player already exists
      const existingPlayer = room.players.find(p => p.username === data.username);
      if (existingPlayer) {
        socket.emit('error', { message: 'Username already taken in this room' });
        return;
      }

      // Add player to room
      room.players.push({
        id: socket.id,
        username: data.username,
        phone: data.phone,
        isHost: false
      });

      userSockets[socket.id] = roomCode;
      socket.join(roomCode);
      socket.data.roomCode = roomCode;
      socket.data.username = data.username;

      console.log(`👤 [${roomCode}] ${data.username} joined (Total: ${room.players.length})`);

      io.to(roomCode).emit('playersUpdated', { players: room.players });
      socket.emit('joinedRoom', {
        roomCode: roomCode,
        isHost: false,
        players: room.players
      });
    } catch (error) {
      console.error('❌ Error joining room:', error);
      socket.emit('error', { message: 'Failed to join room' });
    }
  });

  // ==================== START GAME ====================
  socket.on('startGame', (data) => {
    try {
      const room = rooms[data.roomCode];
      if (!room) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      if (room.players.length < 2) {
        socket.emit('error', { message: 'Need at least 2 players to start' });
        return;
      }

      // Only host can start
      const isHost = room.players.find(p => p.id === socket.id && p.isHost);
      if (!isHost) {
        socket.emit('error', { message: 'Only host can start game' });
        return;
      }

      room.isStarted = true;
      room.scores = {};
      room.chatMessages = [];
      room.currentRound = 1;

      const songs = getSongsFromFolder();
      if (songs.length === 0) {
        socket.emit('error', { message: 'No songs found in songs folder' });
        return;
      }

      console.log(`🎮 [${data.roomCode}] Game started with ${room.players.length} players`);

      startRoundTimer(data.roomCode);

      io.to(data.roomCode).emit('gameStarted', {
        songs: songs,
        scores: room.scores,
        hostName: room.host.username,
        players: room.players,
        round: room.currentRound
      });
    } catch (error) {
      console.error('❌ Error starting game:', error);
      socket.emit('error', { message: 'Failed to start game' });
    }
  });

  // ==================== SONG PLAYING ====================
  socket.on('playSong', (data) => {
    try {
      const room = rooms[data.roomCode];
      if (!room) return;

      // Verify host is playing
      const isHost = room.players.find(p => p.id === socket.id && p.isHost);
      if (!isHost) {
        socket.emit('error', { message: 'Only host can play songs' });
        return;
      }

      console.log(`🎵 [${data.roomCode}] Now playing: ${data.songName}`);

      io.to(data.roomCode).emit('songPlaying', {
        songPath: data.songPath,
        songName: data.songName,
        hostName: room.players.find(p => p.isHost).username
      });
    } catch (error) {
      console.error('❌ Error playing song:', error);
    }
  });

  socket.on('stopSong', (data) => {
    try {
      const room = rooms[data.roomCode];
      if (!room) return;

      const isHost = room.players.find(p => p.id === socket.id && p.isHost);
      if (!isHost) return;

      io.to(data.roomCode).emit('songStopped');
      console.log(`⏹️ [${data.roomCode}] Song stopped`);
    } catch (error) {
      console.error('❌ Error stopping song:', error);
    }
  });

  // ==================== WINNER DECLARATION ====================
  socket.on('declareWinner', (data) => {
    try {
      const room = rooms[data.roomCode];
      if (!room) return;

      // Verify host is declaring
      const isHost = room.players.find(p => p.id === socket.id && p.isHost);
      if (!isHost) {
        socket.emit('error', { message: 'Only host can declare winner' });
        return;
      }

      // Update scores
      if (!room.scores[data.winnerName]) {
        room.scores[data.winnerName] = 0;
      }
      room.scores[data.winnerName]++;

      console.log(`✅ [${data.roomCode}] ${data.winnerName} guessed: ${data.songName}`);

      io.to(data.roomCode).emit('winnerDeclared', {
        winnerName: data.winnerName,
        songName: data.songName,
        scores: room.scores
      });

      // Auto move to next host after 3 seconds
      setTimeout(() => {
        moveToNextHost(data.roomCode);
      }, 3000);
    } catch (error) {
      console.error('❌ Error declaring winner:', error);
    }
  });

  // ==================== ROOM CHAT ====================
  socket.on('sendMessage', (data) => {
    try {
      const room = rooms[data.roomCode];
      if (!room) return;

      const message = {
        username: socket.data.username,
        text: data.message,
        timestamp: new Date().toISOString()
      };

      room.chatMessages.push(message);

      // Keep chat history to 100 messages max
      if (room.chatMessages.length > 100) {
        room.chatMessages.shift();
      }

      io.to(data.roomCode).emit('messageReceived', {
        username: socket.data.username,
        message: data.message,
        timestamp: message.timestamp
      });

      console.log(`💬 [${data.roomCode}] ${socket.data.username}: ${data.message}`);
    } catch (error) {
      console.error('❌ Error sending message:', error);
    }
  });

  // ==================== LEAVE ROOM ====================
  socket.on('leaveRoom', (data) => {
    try {
      const roomCode = data.roomCode;
      const room = rooms[roomCode];
      if (!room) return;

      const playerIndex = room.players.findIndex(p => p.id === socket.id);
      if (playerIndex !== -1) {
        const leftPlayer = room.players[playerIndex];
        room.players.splice(playerIndex, 1);

        console.log(`👋 [${roomCode}] ${leftPlayer.username} left (Remaining: ${room.players.length})`);

        // Clear timer if room empty
        if (room.players.length === 0) {
          if (roomTimers[roomCode]) {
            clearInterval(roomTimers[roomCode]);
            delete roomTimers[roomCode];
          }
          delete rooms[roomCode];
          console.log(`🗑️ [${roomCode}] Room deleted (empty)`);
          return;
        }

        // If host left, assign new host
        if (leftPlayer.isHost && room.players.length > 0) {
          room.players[0].isHost = true;
          console.log(`🎵 [${roomCode}] New host: ${room.players[0].username}`);

          io.to(roomCode).emit('hostChanged', {
            newHostId: room.players[0].id,
            newHostName: room.players[0].username,
            players: room.players
          });
        }

        io.to(roomCode).emit('playersUpdated', { players: room.players });
      }

      delete userSockets[socket.id];
      socket.leave(roomCode);
      socket.data.roomCode = null;
    } catch (error) {
      console.error('❌ Error leaving room:', error);
    }
  });

  // ==================== DISCONNECT ====================
  socket.on('disconnect', () => {
    try {
      const roomCode = socket.data.roomCode;
      if (roomCode && rooms[roomCode]) {
        const room = rooms[roomCode];
        const playerIndex = room.players.findIndex(p => p.id === socket.id);

        if (playerIndex !== -1) {
          const leftPlayer = room.players[playerIndex];
          room.players.splice(playerIndex, 1);

          console.log(`👋 [${roomCode}] ${leftPlayer.username} disconnected`);

          if (room.players.length === 0) {
            if (roomTimers[roomCode]) {
              clearInterval(roomTimers[roomCode]);
              delete roomTimers[roomCode];
            }
            delete rooms[roomCode];
          } else {
            if (leftPlayer.isHost && room.players.length > 0) {
              room.players[0].isHost = true;
              io.to(roomCode).emit('hostChanged', {
                newHostId: room.players[0].id,
                newHostName: room.players[0].username,
                players: room.players
              });
            }
            io.to(roomCode).emit('playersUpdated', { players: room.players });
          }
        }
      }

      delete userSockets[socket.id];
      console.log(`❌ User disconnected: ${socket.id}`);
    } catch (error) {
      console.error('❌ Error on disconnect:', error);
    }
  });
});

// ==================== HTTP ROUTES ====================
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/api/songs', (req, res) => {
  try {
    const songs = getSongsFromFolder();
    res.json(songs);
  } catch (error) {
    console.error('❌ Error fetching songs:', error);
    res.status(500).json({ error: 'Failed to fetch songs' });
  }
});

app.use('/songs', express.static(SONGS_FOLDER, {
  maxAge: '1h',
  etag: false
}));

// ==================== ERROR HANDLING ====================
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ==================== SERVER START ====================
server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║ 🎵 GUESS SONG v3.3.0 - Server        ║
║ Started Successfully ✅               ║
╠════════════════════════════════════════╣
║ 🌐 URL: http://localhost:${PORT}       ║
║ 📁 Songs: ${SONGS_FOLDER}     ║
║ ⏱️ Round Duration: ${ROUND_DURATION}s        ║
╚════════════════════════════════════════╝
  `);

  console.log('📝 Features:');
  console.log(' ✅ Real-time multiplayer with Socket.IO');
  console.log(' ✅ Room-specific chat (isolated per room)');
  console.log(' ✅ Auto-move to next host when timer ends');
  console.log(' ✅ Live timer updates for all players');
  console.log(' ✅ Only host can start & play songs');
  console.log(' ✅ Automatic player cleanup on disconnect');

  console.log('\n🎼 Setup Instructions:');
  console.log(' 1. Create a "songs" folder in project root');
  console.log(' 2. Add MP3/WAV files to ./songs folder');
  console.log(' 3. Run: npm install');
  console.log(' 4. Run: node server.js');
  console.log(' 5. Open: http://localhost:3000');

  console.log('\n🎮 Gameplay:');
  console.log(' 1. Player creates or joins room');
  console.log(' 2. Host starts game (min 2 players)');
  console.log(' 3. Host plays songs');
  console.log(' 4. Other players guess in chat');
  console.log(' 5. Host declares correct answer');
  console.log(' 6. Host role auto-rotates each round\n');
});

module.exports = app;
