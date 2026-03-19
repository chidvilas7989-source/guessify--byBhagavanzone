const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs');
const path = require('path');

// ==================== INITIALIZATION ====================
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: '*' },
  pingTimeout: 60000,
  pingInterval: 25000,
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000,
    skipMiddlewares: true,
  }
});

// ==================== CONFIGURATION ====================
const PORT = process.env.PORT || 3000;
const SONGS_FOLDER = path.join(__dirname, 'songs');
const ROUND_DURATION = 180;      // 3 minutes per round (seconds)
const TRACK_DURATION = 60;       // 60-second song clip
const HOST_GRACE_PERIOD = 30;    // 30-second grace after timer expires before auto-skip

// ==================== DATA STRUCTURES ====================
// rooms[code] = { code, players[], isStarted, scores{}, chatMessages[], currentRound,
//                 usedSongs[], currentSongInfo, hostQueue[], hostQueueIndex, cycleCount }
const rooms = {};

// timers[code] = { roundTimer: intervalId, graceTimer: timeoutId }
const roomTimers = {};

const userSockets = {};
const serverStart = Date.now();

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
    return files
      .filter(file => /\.(mp3|wav|ogg|m4a|aac|webm|mp4)$/i.test(file))
      .map((file, index) => ({
        id: index,
        name: path.parse(file).name.replace(/[-_]/g, ' '),
        filename: file,
        path: `/songs/${file}`
      }));
  } catch (error) {
    console.error('❌ Error reading songs folder:', error);
    return [];
  }
}

// ==================== TIMER HELPERS ====================

function clearAllTimers(roomCode) {
  if (roomTimers[roomCode]) {
    if (roomTimers[roomCode].roundTimer) {
      clearInterval(roomTimers[roomCode].roundTimer);
    }
    if (roomTimers[roomCode].graceTimer) {
      clearTimeout(roomTimers[roomCode].graceTimer);
    }
  }
  roomTimers[roomCode] = {};
}

/**
 * Start the 3-minute round countdown.
 * When it hits 0, start a 30-second grace period for the host.
 * If the grace period expires without a winner/manual skip → auto-move to next host.
 */
function startRoundTimer(roomCode) {
  clearAllTimers(roomCode);

  let timeRemaining = ROUND_DURATION;
  roomTimers[roomCode] = {};

  roomTimers[roomCode].roundTimer = setInterval(() => {
    timeRemaining--;

    // Broadcast tick to all players in room
    io.to(roomCode).emit('timerUpdate', { timeRemaining, phase: 'round' });

    if (timeRemaining <= 0) {
      clearInterval(roomTimers[roomCode].roundTimer);
      roomTimers[roomCode].roundTimer = null;

      const room = rooms[roomCode];
      if (!room) return;

      console.log(`⏰ [${roomCode}] Round timer expired → Starting 30s grace period`);

      // Notify all clients grace period started
      io.to(roomCode).emit('graceperiodStarted', { graceDuration: HOST_GRACE_PERIOD });

      // Start grace period countdown
      let graceRemaining = HOST_GRACE_PERIOD;
      const graceTick = setInterval(() => {
        graceRemaining--;
        io.to(roomCode).emit('timerUpdate', { timeRemaining: graceRemaining, phase: 'grace' });

        if (graceRemaining <= 0) {
          clearInterval(graceTick);
          roomTimers[roomCode].graceTimer = null;
          console.log(`⚡ [${roomCode}] Grace expired → Auto-moving to next host`);
          moveToNextHost(roomCode, false);
        }
      }, 1000);

      roomTimers[roomCode].graceTimer = graceTick;
    }
  }, 1000);
}

// ==================== HOST ROTATION ====================

/**
 * Build ordered host queue from players list.
 * Order: original join order, all players get one turn per cycle.
 * On cycle completion → repeat same order (cycle 2, 3, ...).
 */
function buildHostQueue(players) {
  return players.map(p => p.id);
}

/**
 * Move to next host in the strict ordered queue.
 * Queue index advances; wraps around to start a new cycle.
 */
function moveToNextHost(roomCode, manualMove = false) {
  const room = rooms[roomCode];
  if (!room || room.players.length < 1) return;

  // Cancel any active timers so grace/round don't double-fire
  clearAllTimers(roomCode);

  room.songPlayedThisRound = false;

  // If only 1 player remains, they stay host
  if (room.players.length === 1) {
    room.players[0].isHost = true;
    startRoundTimer(roomCode);
    io.to(roomCode).emit('hostChanged', {
      newHostId: room.players[0].id,
      newHostName: room.players[0].username,
      players: room.players,
      round: room.currentRound,
      cycleCount: room.cycleCount,
      songs: getSongsFromFolder()
    });
    return;
  }

  // Advance queue index
  room.hostQueueIndex = (room.hostQueueIndex + 1) % room.hostQueue.length;

  // Check if the player at this index still exists; skip if not
  let attempts = 0;
  while (attempts < room.hostQueue.length) {
    const targetId = room.hostQueue[room.hostQueueIndex];
    const targetPlayer = room.players.find(p => p.id === targetId);
    if (targetPlayer) break; // found a valid player
    // Player left — advance further
    room.hostQueueIndex = (room.hostQueueIndex + 1) % room.hostQueue.length;
    attempts++;
  }

  // Detect cycle wrap-around
  if (room.hostQueueIndex === 0) {
    room.cycleCount = (room.cycleCount || 1) + 1;
    console.log(`🔄 [${roomCode}] Full cycle complete → Starting Cycle ${room.cycleCount}`);
    io.to(roomCode).emit('cycleComplete', { cycle: room.cycleCount });
  }

  const nextPlayerId = room.hostQueue[room.hostQueueIndex];
  const nextPlayer = room.players.find(p => p.id === nextPlayerId);

  if (!nextPlayer) {
    // Fallback: pick first available player
    const fallback = room.players[0];
    room.players.forEach(p => p.isHost = false);
    fallback.isHost = true;
    room.currentRound++;
    room.currentSongInfo = null;
    startRoundTimer(roomCode);
    io.to(roomCode).emit('hostChanged', {
      newHostId: fallback.id,
      newHostName: fallback.username,
      players: room.players,
      round: room.currentRound,
      cycleCount: room.cycleCount,
      songs: getSongsFromFolder()
    });
    return;
  }

  // Set new host
  room.players.forEach(p => p.isHost = false);
  nextPlayer.isHost = true;
  room.currentRound++;
  room.currentSongInfo = null;

  console.log(`🎵 [${roomCode}] New host: ${nextPlayer.username} | Round ${room.currentRound} | Cycle ${room.cycleCount}${manualMove ? ' [MANUAL]' : ''}`);

  // Start fresh round timer
  startRoundTimer(roomCode);

  const availableSongs = getSongsFromFolder().filter(s => !room.usedSongs.includes(s.name));

  io.to(roomCode).emit('hostChanged', {
    newHostId: nextPlayer.id,
    newHostName: nextPlayer.username,
    players: room.players,
    round: room.currentRound,
    cycleCount: room.cycleCount,
    songs: availableSongs
  });
}

// ==================== SOCKET.IO EVENTS ====================

io.on('connection', (socket) => {
  console.log(`\n✅ User connected: ${socket.id}`);

  // ==================== ROOM CREATION ====================
  socket.on('createRoom', (data) => {
    try {
      const roomCode = generateRoomCode();
      const creator = { id: socket.id, username: data.username, phone: data.phone || '', isHost: true };
      const newRoom = {
        code: roomCode,
        players: [creator],
        isStarted: false,
        scores: {},
        chatMessages: [],
        currentRound: 1,
        usedSongs: [],
        currentSongInfo: null,
        songPlayedThisRound: false,
        hostQueue: [socket.id],
        hostQueueIndex: 0,
        cycleCount: 1
      };

      rooms[roomCode] = newRoom;
      userSockets[socket.id] = roomCode;

      socket.join(roomCode);
      socket.data.roomCode = roomCode;
      socket.data.username = data.username;

      console.log(`🏠 [${roomCode}] Room created by ${data.username}`);

      socket.emit('roomCreated', {
        roomCode,
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
      const existingPlayer = room.players.find(p => p.username === data.username);
      if (existingPlayer) {
        socket.emit('error', { message: 'Username already taken in this room' });
        return;
      }

      const newPlayer = {
        id: socket.id,
        username: data.username,
        phone: data.phone || '',
        isHost: false
      };

      room.players.push(newPlayer);
      room.hostQueue.push(socket.id); // Add to rotation queue in join order

      userSockets[socket.id] = roomCode;
      socket.join(roomCode);
      socket.data.roomCode = roomCode;
      socket.data.username = data.username;

      console.log(`👤 [${roomCode}] ${data.username} joined (Total: ${room.players.length})`);

      io.to(roomCode).emit('playersUpdated', { players: room.players });
      socket.emit('joinedRoom', {
        roomCode,
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
      if (!room) { socket.emit('error', { message: 'Room not found' }); return; }
      if (room.players.length < 2) { socket.emit('error', { message: 'Need at least 2 players to start' }); return; }

      const isHost = room.players.find(p => p.id === socket.id && p.isHost);
      if (!isHost) { socket.emit('error', { message: 'Only host can start game' }); return; }

      room.isStarted = true;
      room.scores = {};
      room.chatMessages = [];
      room.currentRound = 1;
      room.usedSongs = [];
      room.currentSongInfo = null;
      room.songPlayedThisRound = false;
      room.cycleCount = 1;

      // (Re-)build hostQueue from current player order, starting with the creator/host
      room.hostQueue = buildHostQueue(room.players);
      room.hostQueueIndex = 0; // Current host is index 0

      const availableSongs = getSongsFromFolder();
      if (availableSongs.length === 0) {
        socket.emit('error', { message: 'No songs found in songs folder' });
        return;
      }

      console.log(`🎮 [${data.roomCode}] Game started | ${room.players.length} players | Rotation order: ${room.players.map(p => p.username).join(' → ')}`);

      startRoundTimer(data.roomCode);

      io.to(data.roomCode).emit('gameStarted', {
        songs: availableSongs,
        scores: room.scores,
        hostName: room.players.find(p => p.isHost).username,
        players: room.players,
        round: room.currentRound,
        trackDuration: TRACK_DURATION,
        hostQueue: room.players.map(p => p.username), // send rotation order
        cycleCount: room.cycleCount
      });
    } catch (error) {
      console.error('❌ Error starting game:', error);
      socket.emit('error', { message: 'Failed to start game' });
    }
  });

  // ==================== MANUAL HOST MOVE ====================
  socket.on('moveHostManual', (data) => {
    try {
      const room = rooms[data.roomCode];
      if (!room) { socket.emit('error', { message: 'Room not found' }); return; }

      const isHost = room.players.find(p => p.id === socket.id && p.isHost);
      if (!isHost) { socket.emit('error', { message: 'Only host can move host role' }); return; }

      console.log(`🔄 [${data.roomCode}] Manual host move by ${isHost.username}`);
      moveToNextHost(data.roomCode, true);
      socket.emit('success', { message: 'Host role moved successfully' });
    } catch (error) {
      console.error('❌ Error moving host:', error);
      socket.emit('error', { message: 'Failed to move host' });
    }
  });

  // ==================== SONG SELECTED (preload signal) ====================
  socket.on('songSelected', (data) => {
    try {
      const room = rooms[data.roomCode];
      if (!room) return;

      const isHost = room.players.find(p => p.id === socket.id && p.isHost);
      if (!isHost) return;

      // Broadcast to members so they can preload audio instantly
      io.to(data.roomCode).emit('songPreload', {
        songPath: data.songPath,
        songName: data.songName
      });

      console.log(`📡 [${data.roomCode}] Song pre-selected: ${data.songName}`);
    } catch (error) {
      console.error('❌ Error on songSelected:', error);
    }
  });

  // ==================== PLAY SONG ====================
  socket.on('playSong', (data) => {
    try {
      const room = rooms[data.roomCode];
      if (!room) return;

      const isHost = room.players.find(p => p.id === socket.id && p.isHost);
      if (!isHost) {
        socket.emit('error', { message: 'Only host can play songs' });
        return;
      }

      // Enforce one play per round
      if (room.songPlayedThisRound) {
        socket.emit('error', { message: 'You have already played a clip this round! Declare a winner or move to the next host.' });
        return;
      }

      // Enforce one song per round
      if (room.currentSongInfo && room.currentSongInfo.name !== data.songName) {
        socket.emit('error', { message: 'Only one song allowed per round!' });
        return;
      }

      room.currentSongInfo = { name: data.songName, path: data.songPath, startTime: data.startTime };
      room.songPlayedThisRound = true;
      if (!room.usedSongs.includes(data.songName)) {
        room.usedSongs.push(data.songName);
      }

      console.log(`🎵 [${data.roomCode}] Playing: ${data.songName} | ${data.startTime}s–${data.startTime + TRACK_DURATION}s`);

      io.to(data.roomCode).emit('songPlaying', {
        songPath: data.songPath,
        songName: data.songName,
        hostName: isHost.username,
        startTime: data.startTime,
        duration: TRACK_DURATION
      });
    } catch (error) {
      console.error('❌ Error playing song:', error);
    }
  });

  // ==================== STOP SONG ====================
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

  // ==================== DECLARE WINNER ====================
  socket.on('declareWinner', (data) => {
    try {
      const room = rooms[data.roomCode];
      if (!room) return;

      const isHost = room.players.find(p => p.id === socket.id && p.isHost);
      if (!isHost) {
        socket.emit('error', { message: 'Only host can declare winner' });
        return;
      }

      if (!room.scores[data.winnerName]) room.scores[data.winnerName] = 0;
      room.scores[data.winnerName]++;

      console.log(`✅ [${data.roomCode}] Winner: ${data.winnerName} | Song: ${data.songName}`);

      io.to(data.roomCode).emit('winnerDeclared', {
        winnerName: data.winnerName,
        songName: data.songName,
        scores: room.scores,
        players: room.players
      });

      // Cancel timers and auto-advance to next host after 3s
      clearAllTimers(data.roomCode);
      setTimeout(() => {
        if (rooms[data.roomCode]) {
          moveToNextHost(data.roomCode, false);
        }
      }, 3000);
    } catch (error) {
      console.error('❌ Error declaring winner:', error);
    }
  });

  // ==================== CHAT ====================
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
      if (room.chatMessages.length > 100) room.chatMessages.shift();

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
    handlePlayerLeave(socket, data.roomCode);
  });

  // ==================== DISCONNECT ====================
  socket.on('disconnect', (reason) => {
    const roomCode = socket.data.roomCode || userSockets[socket.id];
    console.log(`📡 Disconnected: ${socket.id} (${reason})`);
    if (roomCode) handlePlayerLeave(socket, roomCode);
    delete userSockets[socket.id];
  });
});

// ==================== SHARED LEAVE LOGIC ====================
function handlePlayerLeave(socket, roomCode) {
  try {
    const room = rooms[roomCode];
    if (!room) return;

    const playerIndex = room.players.findIndex(p => p.id === socket.id);
    if (playerIndex === -1) return;

    const leftPlayer = room.players[playerIndex];
    room.players.splice(playerIndex, 1);

    // Remove from hostQueue
    const queueIndex = room.hostQueue.indexOf(socket.id);
    if (queueIndex !== -1) {
      room.hostQueue.splice(queueIndex, 1);
      // Adjust hostQueueIndex if removed item was behind or at current index
      if (queueIndex <= room.hostQueueIndex && room.hostQueueIndex > 0) {
        room.hostQueueIndex--;
      }
      if (room.hostQueueIndex >= room.hostQueue.length) {
        room.hostQueueIndex = 0;
      }
    }

    console.log(`👋 [${roomCode}] ${leftPlayer.username} left (Remaining: ${room.players.length})`);

    if (room.players.length === 0) {
      clearAllTimers(roomCode);
      delete rooms[roomCode];
      console.log(`🗑️ [${roomCode}] Room deleted (empty)`);
      return;
    }

    // If host left, assign next in queue immediately
    if (leftPlayer.isHost) {
      clearAllTimers(roomCode);

      if (room.hostQueue.length > 0) {
        const nextId = room.hostQueue[room.hostQueueIndex % room.hostQueue.length];
        const nextPlayer = room.players.find(p => p.id === nextId) || room.players[0];
        room.players.forEach(p => p.isHost = false);
        nextPlayer.isHost = true;
        room.currentSongInfo = null;
        room.songPlayedThisRound = false;
        room.currentRound++;

        if (room.isStarted) startRoundTimer(roomCode);

        io.to(roomCode).emit('hostChanged', {
          newHostId: nextPlayer.id,
          newHostName: nextPlayer.username,
          players: room.players,
          round: room.currentRound,
          cycleCount: room.cycleCount,
          songs: getSongsFromFolder()
        });
      }
    }

    delete userSockets[socket.id];
    socket.leave(roomCode);
    socket.data.roomCode = null;

    io.to(roomCode).emit('playersUpdated', { players: room.players });
  } catch (error) {
    console.error('❌ Error on leave:', error);
  }
}

// ==================== HTTP REST API ====================

app.use(express.static(__dirname));
app.use(express.json());

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Health endpoint
app.get('/api/health', (req, res) => {
  const activeRooms = Object.keys(rooms).length;
  const activePlayers = Object.values(rooms).reduce((sum, r) => sum + r.players.length, 0);
  res.json({
    status: 'ok',
    uptime: Math.floor((Date.now() - serverStart) / 1000),
    activeRooms,
    activePlayers,
    version: '5.0.0'
  });
});

// All rooms listing
app.get('/api/rooms', (req, res) => {
  const roomList = Object.values(rooms).map(r => ({
    code: r.code,
    playerCount: r.players.length,
    isStarted: r.isStarted,
    currentRound: r.currentRound,
    cycleCount: r.cycleCount,
    players: r.players.map(p => ({ username: p.username, isHost: p.isHost }))
  }));
  res.json(roomList);
});

// Single room info
app.get('/api/rooms/:code', (req, res) => {
  const room = rooms[req.params.code.toUpperCase()];
  if (!room) return res.status(404).json({ error: 'Room not found' });
  res.json({
    code: room.code,
    playerCount: room.players.length,
    isStarted: room.isStarted,
    currentRound: room.currentRound,
    cycleCount: room.cycleCount,
    hostQueue: room.hostQueue,
    hostQueueIndex: room.hostQueueIndex,
    scores: room.scores,
    players: room.players.map(p => ({ username: p.username, isHost: p.isHost }))
  });
});

// Songs API
app.get('/api/songs', (req, res) => {
  try {
    res.json(getSongsFromFolder());
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch songs' });
  }
});

// Static songs folder
app.use('/songs', express.static(SONGS_FOLDER, { maxAge: '1h', etag: false }));

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ==================== SERVER START ====================

server.listen(PORT, () => {
  const songs = getSongsFromFolder();
  console.log(`

╔══════════════════════════════════════════════════════════╗
║  🎵  GUESSIFY v5.0.0 — Server Ready ✅                  ║
╠══════════════════════════════════════════════════════════╣
║  🌐  URL:           http://localhost:${PORT}               ║
║  📁  Songs folder:  ${SONGS_FOLDER.slice(-30).padEnd(30)}  ║
║  🎵  Songs loaded:  ${String(songs.length).padEnd(30)}  ║
║  ⏱️   Round timer:   ${ROUND_DURATION}s (3 mins)                    ║
║  ⚡  Grace period:  ${HOST_GRACE_PERIOD}s (auto-skip if host idle)  ║
╚══════════════════════════════════════════════════════════╝

📡 REST API:
   GET /api/health        → Server stats
   GET /api/songs         → Song list
   GET /api/rooms         → All active rooms
   GET /api/rooms/:code   → Single room info

🎮 Host Rotation:
   → All players take turns in join order (Cycle 1, 2, 3...)
   → 3-min round timer per host
   → 30s grace after timer → auto-skip if host idle
   → Manual skip available anytime
`);
});

module.exports = app;
