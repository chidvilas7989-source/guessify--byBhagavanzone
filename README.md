# 🎵 GUESS SONG - Complete Setup Guide v3.3.0

## ✅ What's Fixed & Updated

### Server (server.js) - Complete Rewrite
✅ Fixed missing closing braces in `generateRoomCode()` function
✅ Completed all incomplete socket event handlers
✅ Added full error handling for all events
✅ Implemented proper room cleanup on disconnect
✅ Fixed host role management and auto-rotation
✅ Added timer updates to all players
✅ Proper chat isolation per room
✅ Complete winner declaration flow
✅ Player validation and duplicate username check
✅ User socket tracking for proper cleanup

### Frontend (index.html) - Complete Implementation
✅ Fully implemented Socket.IO event listeners
✅ Complete game flow from home → room → game
✅ All UI screens working (home, room, game)
✅ Chat functionality with full message handling
✅ Leaderboard updates in real-time
✅ Host-only controls for song playing
✅ Winner declaration interface
✅ Timer display synchronized with server
✅ Responsive design for all screen sizes
✅ Visual status messages and notifications

### Project Configuration
✅ Updated package.json with all dependencies
✅ Removed unnecessary files (index11.html)
✅ Standardized version to 3.3.0

---

## 📋 Project Structure

```
guess-song-game/
├── server.js           # Main Express + Socket.IO server
├── package.json        # Node dependencies
├── index.html          # Frontend (all-in-one file)
├── songs/              # Music files folder (create this)
│   ├── song1.mp3
│   ├── song2.mp3
│   └── ...
└── README.md           # This file
```

---

## 🚀 Setup Instructions

### 1️⃣ Install Node.js
- Download from: https://nodejs.org/
- Choose LTS version (recommended)
- Install and verify: `node --version`

### 2️⃣ Create Project Folder
```bash
# Create and navigate to project folder
mkdir guess-song-game
cd guess-song-game
```

### 3️⃣ Add Files
Copy these files to your project folder:
- `server.js`
- `package.json`
- `index.html`

### 4️⃣ Install Dependencies
```bash
npm install
```

### 5️⃣ Create Songs Folder
```bash
# Create a 'songs' folder in project root
mkdir songs
```

### 6️⃣ Add Music Files
- Copy MP3/WAV files to the `songs` folder
- Supported formats: `.mp3`, `.wav`, `.ogg`, `.m4a`, `.aac`
- Examples:
  ```
  songs/
  ├── Bohemian_Rhapsody.mp3
  ├── Imagine.mp3
  ├── Shape_of_You.mp3
  └── Blinding_Lights.mp3
  ```

### 7️⃣ Start the Server
```bash
# For development (auto-restart on changes):
npm run dev

# Or for production:
npm start
```

### 8️⃣ Open in Browser
```
http://localhost:3000
```

---

## 🎮 How to Play

### Game Flow

**Step 1: Home Screen**
- Enter your name
- Optional: Enter your phone number
- Choose: Create Room or Join Room

**Step 2: Room Screen**
- **Creator**: See room code, share with friends, start game (min 2 players)
- **Joiner**: Enter room code to join created room

**Step 3: Game Screen**
- **Host**: 
  - Selects a song
  - Clicks "Play Song" to start
  - Waits for players to guess
  - Enters correct song name
  - Selects the winner
  - Clicks "Declare Winner"
  
- **Players**:
  - Type guesses in chat
  - Wait for host to declare correct answer
  - Score updates automatically

**Step 4: Auto-Rotation**
- After 3 minutes or winner declared, host changes
- New host can play next song
- Continue for multiple rounds

---

## 🔑 Key Features

### Real-time Multiplayer
✅ Live player list updates
✅ Instant chat messaging
✅ Real-time leaderboard
✅ Synchronized timer across all players

### Host Controls
✅ Only host can play songs
✅ Only host can declare winners
✅ Only host can start game
✅ Auto-rotation every round

### Smart Room Management
✅ Unique room codes (6 characters)
✅ Room-specific chat (isolated data)
✅ Auto-cleanup when room empty
✅ Player disconnect handling

### Game Logic
✅ Minimum 2 players required
✅ 3-minute rounds (configurable)
✅ Score tracking per player
✅ Host role rotation

### UI/UX
✅ Dark theme with neon green accents
✅ Smooth animations and transitions
✅ Responsive design (desktop & mobile)
✅ Status notifications
✅ Easy-to-use controls

---

## ⚙️ Configuration

Edit `server.js` to customize:

```javascript
// Line 12: Change port
const PORT = process.env.PORT || 3000;

// Line 13: Change songs folder location
const SONGS_FOLDER = path.join(__dirname, 'songs');

// Line 14: Change round duration (in seconds)
const ROUND_DURATION = 180; // 3 minutes = 180 seconds
```

---

## 🐛 Troubleshooting

### Issue: "Cannot find module 'express'"
**Solution:**
```bash
npm install
```

### Issue: "ENOENT: no such file or directory 'songs'"
**Solution:**
```bash
mkdir songs
# Add MP3 files to the songs folder
```

### Issue: "Port 3000 already in use"
**Solution:**
```bash
# Change PORT in server.js or use different port:
PORT=3001 node server.js
```

### Issue: Songs not appearing in dropdown
**Solution:**
1. Check songs folder exists: `songs/`
2. Check files are supported formats (.mp3, .wav)
3. Check file names have no special characters
4. Restart server: `npm run dev`

### Issue: Localhost not accessible
**Solution:**
- Check server started: Look for startup message
- Use: `http://localhost:3000` or `http://127.0.0.1:3000`
- On mobile: Use your computer's IP (e.g., `http://192.168.1.100:3000`)

### Issue: Chat/Scores not updating
**Solution:**
1. Refresh browser (Ctrl+F5 or Cmd+Shift+R)
2. Clear browser cache
3. Restart server

---

## 📱 Multi-Device Setup

### Play on Multiple Devices

1. **Find Your Computer's IP:**
   ```bash
   # Windows (PowerShell):
   ipconfig
   
   # Mac/Linux:
   ifconfig
   ```
   Look for IPv4 address (e.g., `192.168.x.x`)

2. **Server URL:**
   ```
   http://[YOUR_IP]:3000
   ```
   Example: `http://192.168.1.100:3000`

3. **Share with Friends:**
   - Give them your IP + port
   - They access from their phones/devices
   - Create/join room as normal

---

## 📊 API Endpoints

### HTTP
- `GET /` - Returns index.html
- `GET /api/songs` - Returns list of songs
- `GET /songs/:filename` - Stream song file

### Socket.IO Events

**Client → Server:**
- `createRoom` - Create new room
- `joinRoom` - Join existing room
- `startGame` - Start game (host only)
- `playSong` - Play selected song (host only)
- `stopSong` - Stop playing (host only)
- `declareWinner` - Declare correct answer (host only)
- `sendMessage` - Send chat message
- `leaveRoom` - Leave room
- `disconnect` - Disconnect (automatic)

**Server → Client:**
- `roomCreated` - Room creation successful
- `joinedRoom` - Joined room successful
- `gameStarted` - Game started
- `playersUpdated` - Player list changed
- `songPlaying` - Song is now playing
- `songStopped` - Song stopped
- `timerUpdate` - Timer tick
- `winnerDeclared` - Winner declared
- `hostChanged` - Host role changed
- `messageReceived` - New chat message

---

## 📝 File Explanations

### server.js
Main server file with Express and Socket.IO:
- Room management
- Player tracking
- Song serving
- Real-time updates
- Game logic

### index.html
All-in-one frontend file containing:
- HTML structure (3 screens: home, room, game)
- CSS styling (dark theme, responsive)
- JavaScript client-side logic
- Socket.IO event handlers

### package.json
Node dependencies configuration:
- `express` - Web server
- `socket.io` - Real-time communication
- `nodemon` - Auto-restart during development

---

## 🔒 Security Notes

⚠️ **For Development Only:**
- CORS open to all origins
- No authentication system
- No input sanitization
- No rate limiting

🔐 **For Production:**
1. Add authentication
2. Restrict CORS origins
3. Validate all inputs
4. Add rate limiting
5. Use HTTPS
6. Add database for persistence

---

## 🚀 Deployment Options

### Deploy on Render.com (Free)
1. Push code to GitHub
2. Connect GitHub to Render
3. Create new Web Service
4. Set start command: `npm start`
5. Deploy!

### Deploy on Railway.app
1. Push code to GitHub
2. Connect GitHub to Railway
3. Auto-detect Node.js
4. Deploy!

### Deploy on Heroku
```bash
heroku create your-app-name
git push heroku main
```

### Deploy on Your Own Server
```bash
npm install --production
npm start
# Run with pm2 for persistence:
npm install -g pm2
pm2 start server.js
```

---

## 📞 Support

If you encounter issues:
1. Check console for error messages
2. Check troubleshooting section
3. Verify all files present
4. Verify songs folder with files
5. Clear browser cache and refresh
6. Restart server

---

## 📄 Version History

**v3.3.0** (Latest - Current)
- ✅ Complete rewrite fixing all incomplete code
- ✅ Full Socket.IO implementation
- ✅ Complete UI with all screens working
- ✅ Proper error handling throughout
- ✅ Host auto-rotation working
- ✅ Chat system fully isolated per room
- ✅ Timer synchronized with all players
- ✅ Winner declaration fully implemented

**v3.2.0** (Previous)
- Had incomplete socket handlers
- Incomplete HTML/JS
- Missing error handling

---

## 🎉 You're All Set!

Your multiplayer music guessing game is ready! 🎵

### Quick Start Reminder:
```bash
# 1. Install dependencies
npm install

# 2. Add music files to songs/ folder
# 3. Start server
npm run dev

# 4. Open browser
# http://localhost:3000
```

**Enjoy the game! 🎮**
