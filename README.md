# 🎵 GUESS SONG - Complete Game Flow Documentation

## Table of Contents
1. [Overview](#overview)
2. [Game Phases](#game-phases)
3. [Player Roles](#player-roles)
4. [Detailed Game Flow](#detailed-game-flow)
5. [Features Explained](#features-explained)
6. [Technical Architecture](#technical-architecture)
7. [Setup & Installation](#setup--installation)
8. [Gameplay Instructions](#gameplay-instructions)
9. [Advanced Features](#advanced-features)
10. [Troubleshooting](#troubleshooting)

---

## 📖 Overview

**GUESS SONG** is a real-time multiplayer music guessing game where players take turns as hosts who play 30-second song clips, while other members try to guess the song name in a live chat.

### Key Highlights
- **2+ Players Required**: Minimum 2 players to start
- **Real-time Multiplayer**: Socket.IO powered instant communication
- **Host Rotation**: Automatic 3-minute rotation or manual host movement
- **30-Second Clips**: Host selects which 30 seconds to play
- **Mystery Gaming**: Members never know which part of the song is playing
- **Live Scoring**: Leaderboard updates in real-time
- **Chat Integration**: Guesses and discussion in live chat

### Technology Stack
- **Backend**: Node.js + Express + Socket.IO
- **Frontend**: HTML5 + CSS3 + Vanilla JavaScript
- **Audio**: HTML5 Audio API
- **Real-time**: Socket.IO Events
- **Theme**: Dark Cyberpunk UI

---

## 🎮 Game Phases

### Phase 1: Welcome Screen
```
┌─────────────────────────────────────┐
│  🎵 GUESS SONG                      │
│  Multiplayer Music Guessing Game    │
│                                     │
│  [Create Room]  [Join Room]         │
└─────────────────────────────────────┘
```

**Actions Available:**
- Create a new room (become host)
- Join existing room with code
- Enter username
- Optional: Enter phone number

---

### Phase 2: Room Lobby
```
┌──────────────────┐  ┌──────────────────┐
│ Room Info        │  │ How It Works      │
├──────────────────┤  ├──────────────────┤
│ Code: ABC123     │  │ ✓ Create room    │
│ 👥 Players:      │  │ ✓ Wait 2+ players│
│ • Rahul (👑)     │  │ ✓ Host starts    │
│ • Priya          │  │ ✓ Host plays     │
│ • Arjun          │  │ ✓ Guess in chat  │
│                  │  │ ✓ Declare winner │
│ [Start Game]     │  │ ✓ Auto-rotate    │
│ [Leave Room]     │  │ ✓ Track leaderbd │
└──────────────────┘  └──────────────────┘
```

**What Happens:**
- Room code displayed for sharing
- Players join and appear in list
- Host (👑 badge) can start when 2+ joined
- Game rules shown on side panel

---

### Phase 3: Game Playing
```
┌─────────────────────────────────────────┐
│ HOST VIEW              MEMBER VIEW       │
├────────────┬──────────┬────────────┬────┤
│ 🎵 Controls│ Chat     │ 🎧 Waiting │ 🏆 │
│            │ & Guesses│ for Host   │ LB │
│ Song: [ ▼] │          │            │    │
│ Track: [==●]          │ Song is... │ 1.  │
│            │ Priya:   │ ⋮⋮⋮      │ P:1 │
│ [▶] [⏹]   │ "Pop"    │            │    │
│            │ Arjun:   │            │ 2. │
│ [Winner]   │ "Dance"  │            │ A:0 │
└────────────┴──────────┴────────────┴────┘
```

**What Happens:**
- Host selects songs and chooses 30-second positions
- Host plays clips using slider controls
- Members listen and guess in chat
- Leaderboard updates in real-time
- Timer counts down (3 minutes per round)

---

### Phase 4: Winner Declaration
```
┌─────────────────────────────────────┐
│ 🏆 Declare Winner                   │
├─────────────────────────────────────┤
│ Song Name: "Levitating"             │
│ Winner: [Priya ▼]                   │
│                                     │
│ [✅ Declare Winner]                 │
│                                     │
│ Result:                             │
│ "Priya guessed correctly!"          │
│ Leaderboard: Priya +1 point         │
└─────────────────────────────────────┘
```

**What Happens:**
- Host enters correct song name
- Host selects winner from list
- Host clicks "Declare Winner"
- All players see notification
- Scores update automatically

---

### Phase 5: Host Rotation
```
TIMER: 3:00 → 0:00
       ↓
Auto-rotation OR manual button press
       ↓
Next player becomes host
       ↓
"You are now the Host!" notification
       ↓
New host sees song selector
       ↓
Game continues...
```

**What Happens:**
- After 3 minutes, host automatically changes
- Host can manually move to next player anytime
- Smart sequencing: no player gets 2 turns in row
- Round number increases
- Game continues indefinitely

---

## 👥 Player Roles

### THE HOST 👑

**Responsibilities:**
- Select songs to play
- Choose 30-second clip position using slider
- Click Play button to broadcast
- Listen to member guesses
- Declare the correct answer and winner

**Unique Controls:**
```
Host-Only UI Elements:
├── Song selector dropdown
├── Track position slider (0-100)
├── Time display ("Xs - Ys")
├── Play/Stop buttons
├── Audio player controls
├── Winner declaration form
└── Move to Next Host button
```

**Visibility:**
- ✅ Sees song names
- ✅ Sees which 30 seconds are playing
- ✅ Sees host controls
- ✅ Sees member guesses in chat
- ✅ Controls game flow

---

### MEMBERS (Regular Players) 👤

**Responsibilities:**
- Listen carefully to 30-second clips
- Make educated guesses based on sound
- Type guesses in chat
- Track scores on leaderboard
- Wait patiently for next clip

**Unique View:**
```
Member-Only UI Elements:
├── "Waiting for Host" animation
├── Generic status ("🎵 Song is playing...")
├── Chat input for guesses
├── Leaderboard (read-only)
├── Game info panel
└── Leave game button
```

**Visibility:**
- ❌ Cannot see song names
- ❌ Cannot see which part is playing
- ❌ Cannot see host controls
- ✅ Can see other members' guesses
- ✅ Can see leaderboard
- ✅ Can participate in chat

---

## 📊 Detailed Game Flow

### Complete Game Cycle

```
START OF GAME
    ↓
[ROUND X BEGINS]
    ↓
Host #N selected
    ↓
"It's your turn to be host!" notification
    ↓
[SONG CYCLE - REPEATS 3 MINUTES]
    ↓
    ├─→ HOST SELECTS SONG
    │   ├─ Clicks dropdown
    │   ├─ Chooses song from list
    │   └─ Track selector appears
    │
    ├─→ HOST CHOOSES POSITION
    │   ├─ Drags slider 0-100
    │   ├─ Time display updates
    │   └─ Shows "Xs - Ys" seconds
    │
    ├─→ HOST PLAYS CLIP
    │   ├─ Clicks "Play" button
    │   ├─ Only 30 seconds broadcast
    │   └─ Timer starts (0:30)
    │
    ├─→ MEMBERS LISTEN (30 seconds)
    │   ├─ See "🎵 Song is playing..."
    │   ├─ Hear audio from selected position
    │   └─ No position/name hints
    │
    ├─→ MEMBERS GUESS
    │   ├─ Type song name in chat
    │   ├─ Press Enter to send
    │   └─ See all other guesses
    │
    ├─→ HOST DECLARES WINNER
    │   ├─ Enters correct song name
    │   ├─ Selects winning member
    │   ├─ Clicks "Declare Winner"
    │   └─ All see notification
    │
    ├─→ SCORES UPDATE
    │   ├─ Winner gets 1 point
    │   ├─ Leaderboard refreshes
    │   └─ Next song begins
    │
    └─→ [REPEAT SONG CYCLE FOR 3 MINUTES]
    
After 3 minutes:
    ↓
HOST ROTATION
    ├─ Timer expires → Auto-rotate
    │ OR
    ├─ Host presses button → Manual rotate
    │
    ↓
Next player becomes host
    ↓
[ROUND X+1 BEGINS]
    ↓
GAME CONTINUES...
```

### Single Song Flow (Detailed)

```
1️⃣ HOST SELECTS SONG
   ├─ Dropdown shows: [-- Choose a song --]
   ├─ Host clicks dropdown
   ├─ Options appear:
   │  - Song 1
   │  - Song 2
   │  - Song 3
   │  - ... (all songs in folder)
   │
   └─ Host clicks song name
      Result: Song is selected

2️⃣ TRACK SELECTOR APPEARS
   ├─ Display: "Playing from: 0s - 30s"
   ├─ Slider appears: [═════●═════]
   ├─ Min/Max labels: 0s ........... 90s
   └─ Ready for position selection

3️⃣ HOST ADJUSTS POSITION
   ├─ Host drags slider left/right
   ├─ Display updates LIVE
   ├─ Shows current selection:
   │  - "0s - 30s" (beginning)
   │  - "45s - 75s" (middle)
   │  - "90s - 120s" (later)
   │  - etc.
   │
   └─ Position selected

4️⃣ HOST CLICKS PLAY
   ├─ Click [▶️ Play] button
   ├─ Audio file opens from:
   │  - audio.currentTime = selectedTrackStart
   │  - Audio plays
   │  - Only 30 seconds will play
   │
   └─ Broadcast to all players

5️⃣ ALL PLAYERS RECEIVE AUDIO
   ├─ Server broadcasts: songPlaying event
   ├─ All clients receive:
   │  - songPath
   │  - songName (host only)
   │  - startTime (position)
   │  - duration (30 seconds)
   │
   ├─ Host audio.src = path
   ├─ Host audio.currentTime = startTime
   ├─ Host clicks play
   │
   ├─ Member audio.src = path
   ├─ Member audio.currentTime = startTime
   ├─ Member audio plays automatically
   │
   └─ Both hear synchronized 30 seconds

6️⃣ HOST DISPLAYS INFO
   ├─ Now Playing: "Song Name"
   ├─ Display shows song title (HOST ONLY)
   ├─ Members see: "🎵 Song is playing..."
   └─ 30 seconds of audio plays...

7️⃣ MEMBERS LISTEN & GUESS
   ├─ Time: 0:30 of audio playing
   ├─ Members hear 30 seconds
   ├─ No lyrics after? Song ends?
   │
   ├─ Priya types in chat: "Is it pop song?"
   │  Press Enter → Message sent
   │
   ├─ Arjun types: "Maybe Levitating?"
   │  Press Enter → Message sent
   │
   ├─ Neha types: "Blinding Lights!"
   │  Press Enter → Message sent
   │
   └─ All can see all guesses in real-time

8️⃣ AUDIO ENDS (30 seconds done)
   ├─ Audio playback stops automatically
   ├─ Host sees: "Waiting for input"
   └─ Members see: "Waiting for host to play..."

9️⃣ HOST ENTERS CORRECT ANSWER
   ├─ Host form shows:
   │  - Song Name: [____________]
   │  - Winner: [Choose member ▼]
   │
   ├─ Host types: "Levitating"
   ├─ Host selects: "Neha"
   └─ Host clicks [✅ Declare Winner]

🔟 WINNER DECLARED
   ├─ All get notification:
   │  "Neha guessed correctly!"
   │
   ├─ Scores update:
   │  Neha: +1 point
   │
   ├─ Leaderboard changes:
   │  Before: Priya: 2, Neha: 0, Arjun: 1
   │  After: Neha: 1, Priya: 2, Arjun: 1
   │
   └─ Ready for next song
      (or next host if 3 minutes passed)
```

---

## ✨ Features Explained

### 1. 30-Second Track Selection 🎵

**What It Is:**
Host can choose ANY 30-second clip from any song using an interactive slider.

**How It Works:**
```
Song: "Bohemian Rhapsody" (5:55 total)

Position 0:    [═●═════════] → 0s - 30s
               (Piano intro)

Position 25:   [═════●══════] → 45s - 75s
               (First verse)

Position 50:   [══════════●] → 90s - 120s
               (Pre-chorus)

Position 75:   [═════════════●] → 135s - 165s
               (Chorus/opera section)
```

**Why It's Great:**
- Same song = infinite variety
- Can't memorize which part plays
- Host controls difficulty
- More replayable
- Keeps game fresh

---

### 2. Real-Time Chat System 💬

**Features:**
```
Each message shows:
├─ Username (colored)
├─ Message text
├─ Timestamp (HH:MM AM/PM)
└─ Auto-scroll to latest

Messages are broadcast instantly
No delay between players
Room-based (isolated per room)
History limited to 100 messages
```

**Used For:**
- Making guesses
- Discussing songs
- Celebrating winners
- General chat

---

### 3. Live Leaderboard 🏆

**Updates In Real-Time:**
```
Position  Player    Score
─────────────────────────
1️⃣        Priya      3 pts
2️⃣        Rahul      2 pts
3️⃣        Arjun      1 pt

Highlights:
- Top player highlighted with accent color
- Sorted by highest score first
- Updates immediately on winner declaration
- Shows everyone's standing at all times
```

**Scoring:**
- Correct guess = 1 point
- Only one winner per song
- Score accumulates throughout game

---

### 4. Host Rotation System 🔄

**Automatic (Timer-Based):**
```
Round 1: Host = Player A
Time: 3:00 → 2:59 → ... → 0:01 → 0:00
TIMER EXPIRES
↓
Round 2: Host = Player B (next in sequence)
```

**Manual (Button-Based):**
```
Round 1: Host = Player A
Host feels ready to be member
↓
Host clicks [🔄 Move to Next Host]
↓
Immediately transitions to Player B
Timer resets to 3:00
```

**Smart Sequencing:**
```
Players: A, B, C, D (4 total)

Round 1: A → B → C → D
Round 2: A → B → C → D
Round 3: A → B → C → D
...

Within round: No repeats
Between rounds: Can repeat
(e.g., A hosts round 1, A can host round 2)
```

---

### 5. Real-Time Audio Broadcast 🔊

**Synchronization:**
```
Host clicks Play
    ↓
Server: socket.emit('songPlaying', data)
    ↓
All clients receive event
    ↓
All set: audio.currentTime = data.startTime
    ↓
All press Play
    ↓
SYNCHRONIZED PLAYBACK
    ↓
Everyone hears same 30 seconds
at same time
```

**Quality:**
- No noticeable delay
- Synchronized across all players
- Only 30 seconds play (auto-stops)
- Full audio controls for host

---

### 6. Mystery Gaming 🔐

**Members DON'T Know:**
```
❌ Song name
❌ Which part is playing
❌ Position in song (0-30s, 45-75s, etc.)
❌ Total song duration
❌ Genre (sometimes)
❌ Time remaining in clip
❌ If it's chorus, verse, bridge, etc.
```

**Members ONLY Know:**
```
✅ It's a song clip (30 seconds)
✅ Audio quality/style
✅ Lyrics (if any in clip)
✅ Approximate tempo
✅ Instruments used
✅ Other members' guesses
```

**Result:** Pure listening-based guessing!

---

## 🏗️ Technical Architecture

### Server-Side (Node.js + Socket.IO)

```
server.js
├── Express Setup
│   ├── Static file serving
│   ├── JSON middleware
│   └── Route handlers
│
├── Socket.IO Events
│   ├── createRoom
│   ├── joinRoom
│   ├── startGame
│   ├── playSong ← Track position sent here!
│   ├── stopSong
│   ├── declareWinner
│   ├── sendMessage
│   ├── leaveRoom
│   ├── moveHostManual
│   └── disconnect
│
├── Game Logic
│   ├── Room management
│   ├── Host rotation algorithm
│   ├── Score tracking
│   ├── Chat history
│   └── Timer management
│
└── Utilities
    ├── Room code generation
    ├── Song folder scanning
    ├── Timer creation/cleanup
    └── Host sequencing
```

### Client-Side (HTML5 + JavaScript)

```
index.html
├── HTML Structure
│   ├── Welcome screen
│   ├── Room lobby
│   ├── Game screen
│   └── Sidebars
│
├── CSS Styling (1500+ lines)
│   ├── Dark theme
│   ├── Animations
│   ├── Responsive layout
│   └── Component styles
│
└── JavaScript Logic
    ├── Screen management
    ├── Socket.IO event handlers
    ├── Audio controls
    ├── Track slider management ← NEW!
    ├── Chat system
    ├── Leaderboard updates
    └── UI state management
```

### Socket.IO Event Flow

```
CLIENT → SERVER → ALL CLIENTS

createRoom:
  Input: { username, phone }
  Output: roomCode
  Broadcast: None (single user)

joinRoom:
  Input: { username, roomCode }
  Broadcast: playersUpdated
  
startGame:
  Broadcast: gameStarted (with songs list)
  
playSong:
  Input: { roomCode, songPath, songName, startTime } ← Position!
  Broadcast: songPlaying (with startTime)
  
declareWinner:
  Input: { winnerName, songName, roomCode }
  Broadcast: winnerDeclared (with updated scores)
  
sendMessage:
  Input: { message, roomCode }
  Broadcast: messageReceived

hostChanged:
  Broadcast: hostChanged (new host info)
  
timerUpdate:
  Broadcast: timerUpdate (remaining seconds)
```

---

## 🚀 Setup & Installation

### Prerequisites
```
✅ Node.js (v14+)
✅ npm (v6+)
✅ MP3/WAV audio files
✅ Modern web browser
```

### Step 1: Project Structure

```
guess-song/
├── package.json [4]
├── server.js [5]
├── index.html [6]
└── songs/
    ├── song1.mp3
    ├── song2.mp3
    ├── song3.mp3
    └── ... (more songs)
```

### Step 2: Install Dependencies

```bash
npm install
```

This installs:
- express (web framework)
- socket.io (real-time communication)
- nodemon (dev dependency, auto-restart)

### Step 3: Add Songs

1. Create `songs` folder in project root
2. Add MP3/WAV files
3. Files must have standard audio format
4. Names should be meaningful (used as display names)

Examples:
```
songs/
├── Levitating.mp3
├── Blinding_Lights.mp3
├── Shape_of_You.mp3
├── Bohemian_Rhapsody.mp3
└── Thriller.mp3
```

### Step 4: Start Server

```bash
npm start
```

Console output:
```
╔════════════════════════════════╗
║ 🎵 GUESS SONG v4.2.0 - Server ║
║ Started ✅                     ║
╠════════════════════════════════╣
║ 🌐 URL: http://localhost:3000 ║
║ 📁 Songs: ./songs              ║
║ ⏱️  Round: 180s (3 min)        ║
║ 🎵 Track: 30s (per clip)      ║
╚════════════════════════════════╝
```

### Step 5: Open in Browser

Navigate to: `http://localhost:3000`

You should see Welcome screen!

---

## 🎮 Gameplay Instructions

### For First-Time Players

#### Creating a Room

1. **Enter Your Name**
   - Type in "Your Name" field
   - Max 20 characters

2. **Optional: Enter Phone**
   - Phone field is optional
   - Useful for identifying players

3. **Click "Create Room"**
   - You become the host
   - Room code is generated
   - You enter Room Lobby

4. **Share Room Code**
   - Click "Copy Code" button
   - Send to friends
   - They can join with this code

#### Joining a Room

1. **Get Room Code**
   - Ask host for room code
   - Format: 6 uppercase letters/numbers

2. **Enter Your Name**
   - Type in "Your Name" field

3. **Enter Room Code**
   - Type in "Room Code" field
   - Must match exactly
   - Case doesn't matter (auto-converted)

4. **Click "Join Room"**
   - You join the room
   - Appear in players list

#### Starting the Game

1. **Wait for 2+ Players**
   - Host must have 1+ other players
   - Warning shown if < 2 players

2. **Host Clicks "Start Game"**
   - Only host can start
   - Members cannot start

3. **Game Begins**
   - All transition to game screen
   - Host sees song selector
   - Members see "Waiting for host..."

### Playing as Host

#### Round Begins

1. **See Song Selector**
   - Dropdown menu with all songs
   - Default: "-- Choose a song --"

2. **Select a Song**
   - Click dropdown
   - Pick any song
   - Track selector appears

#### Choose Track Position

3. **See Track Selector**
   - Title: "🎵 Select 30-Second Clip"
   - Display: "Playing from: 0s - 30s"
   - Slider: [═════●═════]

4. **Drag Slider**
   - Click and drag slider handle
   - OR click anywhere on slider bar
   - Watch display update in real-time

5. **Choose Position**
   - Could be "0s - 30s" (beginning)
   - Could be "45s - 75s" (middle)
   - Could be "90s - 120s" (near end)
   - Any position works!

#### Play the Clip

6. **Click "Play" Button**
   - Audio starts playing
   - From selected position
   - Only 30 seconds play

7. **Watch Members Guess**
   - Members see guesses in chat
   - Can help them by staying silent
   - Or react to interesting guesses!

#### Declare Winner

8. **Enter Correct Song Name**
   - Type exact song name
   - Or similar enough for you

9. **Select Winner from Dropdown**
   - Must be a member (not you)
   - Only members who guessed show up
   - Can only select one winner

10. **Click "Declare Winner"**
    - Winner gets 1 point
    - Leaderboard updates
    - Next song begins

#### Continue Or Rotate

11. **Keep Playing**
    - Repeat steps 2-10
    - Play multiple songs in 3-minute round
    - Choose different positions for variety

12. **When 3 Minutes Pass**
    - Timer shows 0:00
    - Automatically become member
    - Another player becomes host
    - See notification: "Player X is now host"

13. **Or Move Manually**
    - Click [🔄 Move to Next Host] anytime
    - Immediately become member
    - No need to wait for timer

### Playing as Member

#### Waiting for Host

1. **See Waiting Screen**
   - Icon: 🎧
   - Title: "Waiting for Host"
   - Status: "Waiting for host to play a song..."
   - Animated dots: ⋮ ⋮ ⋮

#### Host Plays

2. **See Status Change**
   - Status becomes: "🎵 Song is playing..."
   - Animated dots still animate
   - You don't see song name
   - You don't see position
   - Just the status!

#### Listen & Guess

3. **Listen Carefully**
   - Audio plays for ~30 seconds
   - Pay attention to:
     - Lyrics (if any)
     - Instruments
     - Tempo
     - Style/genre
     - Voice characteristics

4. **Make Your Guess**
   - Click in chat input field
   - Type song name you think it is
   - Press Enter
   - Message sends instantly

5. **See Other Guesses**
   - Chat shows all member guesses
   - Can see what others thought
   - Might help or confuse you!

#### Wait for Winner

6. **Host Declares Winner**
   - See notification: "{Name} guessed correctly!"
   - Leaderboard updates
   - If you won: Celebrate!
   - If not: Prepare for next song

#### Repeat

7. **Next Song Begins**
   - Status resets to "Waiting..."
   - Ready for next clip

### Between Rounds

1. **Host Rotates**
   - Timer expires → Auto-rotate
   - OR host clicks manual button
   - You might become new host!

2. **See Notification**
   - "You are now the Host!"
   - Or "Player X is now Host"

3. **Check Leaderboard**
   - Top scorers highlighted
   - Can see who's winning
   - Still time to catch up!

---

## 🎯 Advanced Features

### Smart Host Rotation Algorithm

**Concept:** No player hosts twice in a row within same round.

```
4 Players: A, B, C, D

Round 1:
├─ Song 1: Host A, Members B,C,D
│          Mark A as "used this round"
│
├─ Song 2: Host B, Members A,C,D
│          Mark B as "used this round"
│
├─ Song 3: Host C, Members A,B,D
│          Mark C as "used this round"
│
├─ Song 4: Host D, Members A,B,C
│          Mark D as "used this round"
│
└─ All 4 players used! Round ends.

Round 2:
├─ Clear "used" marks
├─ Host A again (now OK, new round)
├─ Host B again (now OK, new round)
└─ etc...
```

**Benefits:**
- Fair distribution
- Everyone gets turns
- Prevents one person hosting too much
- Still allows repeats across rounds

---

### Timer Management

**3-Minute Round Timer:**
```
Timer: 3:00 (180 seconds)

Display updates every second:
3:00 → 2:59 → 2:58 → ... → 0:02 → 0:01 → 0:00

Location: Header (top right)
├─ Format: MM:SS
├─ Color: Orange gradient
├─ Shows icon: ⏱️

When timer reaches 0:
├─ Host automatically changes
├─ Notification sent
├─ Next host sees controls
├─ Timer resets to 3:00
```

**Manual Override:**
- Host can click "Move to Next Host" anytime
- Doesn't wait for timer
- Immediately transitions

---

### Real-Time Score Updates

**Calculation:**
```
Declare Winner: Player = "Priya"
        ↓
Server receives event
        ↓
room.scores["Priya"] += 1
        ↓
Broadcast to all players
        ↓
All clients update leaderboard
        ↓
Sorted by score (highest first)
        ↓
Display updates instantly
```

**Display:**
```
Rank  Name     Score
─────────────────────
1️⃣    Priya     3 pts
2️⃣    Rahul     2 pts
3️⃣    Arjun     1 pt
```

---

## 🔧 Troubleshooting

### Issue: "Room not found"

**Cause:** Room code is incorrect or doesn't exist

**Solution:**
1. Check room code spelling
2. Make sure host created room
3. Verify code is 6 characters
4. Try creating new room instead

---

### Issue: "Cannot start game - minimum 2 players"

**Cause:** Only 1 player in room

**Solution:**
1. Invite more players
2. Share room code
3. Wait for them to join
4. Once 2+ players present, "Start Game" enables

---

### Issue: "Audio doesn't play"

**Cause:** 
- No songs in folder
- Invalid audio format
- File corrupted
- Browser issue

**Solution:**
1. Check songs/ folder exists
2. Verify MP3/WAV files present
3. Try different browser
4. Restart server

---

### Issue: "Members can see song name"

**Cause:** Bug or outdated client

**Solution:**
1. Refresh browser (Ctrl+R or Cmd+R)
2. Clear browser cache
3. Relaunch game
4. Try incognito/private window

---

### Issue: "Slider doesn't appear"

**Cause:** Song not selected properly

**Solution:**
1. Make sure you clicked dropdown
2. Select a song from list
3. Wait for slider to appear
4. If not, try another song

---

### Issue: "Audio plays from wrong position"

**Cause:** Slider not set correctly, or server issue

**Solution:**
1. Verify slider position before playing
2. Check display shows correct range
3. Try restarting server
4. Refresh client page

---

### Issue: "Score not updating"

**Cause:** Network lag or bug

**Solution:**
1. Wait a few seconds
2. Try declaring winner again
3. Refresh leaderboard (F5)
4. Check network connection

---

### Issue: "Host doesn't rotate after 3 minutes"

**Cause:** Timer bug or manual control not responded

**Solution:**
1. Manually click "Move to Next Host"
2. Check timer display
3. Restart server and clients
4. Check console for errors (F12)

---

### Issue: "Chat messages not appearing"

**Cause:** Network disconnection or server issue

**Solution:**
1. Check internet connection
2. Verify server is running
3. Refresh page
4. Try another browser

---

## 📱 Platform Support

### Desktop Browsers ✅
- Chrome (recommended)
- Firefox
- Safari
- Edge
- Opera

### Mobile Browsers ✅
- Chrome Mobile
- Safari iOS
- Firefox Mobile
- Samsung Internet

### Responsive Design
- Desktop: Full featured
- Tablet: Optimized layout
- Mobile: Stacked layout (vertical)

---

## 🔐 Privacy & Data

### What's Tracked
- Player usernames (in room only)
- Phone numbers (optional, displayed in room)
- Scores (during game)
- Chat messages (during game)
- Room code

### What's NOT Tracked
- Personal information beyond room
- Game history after disconnect
- IP addresses (unless logged by hosting service)
- Conversation content after game ends

### Data Storage
- All data in memory (RAM)
- Lost when server restarts
- Room deleted when all players leave
- No persistent database

---

## 🎵 Example Gameplay Session

### Complete Game Example

```
SETUP (5 minutes)
└─ Rahul creates room ABC123
  └─ Shares code with friends
    └─ Priya, Arjun, Neha join
      └─ 4 total players
        └─ Rahul (host) clicks "Start Game"

ROUND 1 (3 minutes)

Song 1 (by Rahul):
├─ Rahul selects "Levitating"
├─ Drags slider to position 0
├─ Display: "0s - 30s"
├─ Plays chorus section
├─ Members guess:
│  - Priya: "Levitating!" ✓
│  - Arjun: "Dua Lipa"
│  - Neha: "Pop song"
├─ Rahul declares Priya winner
└─ Scores: Priya: 1, Rahul: 0, Arjun: 0, Neha: 0

Song 2 (by Rahul):
├─ Rahul selects "Blinding Lights"
├─ Drags slider to position 50
├─ Display: "45s - 75s"
├─ Plays verse section
├─ Members guess:
│  - Priya: "Weeknd?"
│  - Arjun: "Blinding Lights!" ✓
│  - Neha: "Uptown Funk"
├─ Rahul declares Arjun winner
└─ Scores: Priya: 1, Arjun: 1, Rahul: 0, Neha: 0

Song 3 (by Rahul):
├─ Rahul selects "Shape of You"
├─ Drags slider to position 75
├─ Display: "105s - 135s"
├─ Plays unique guitar section
├─ Members guess:
│  - Priya: "Ed Sheeran... something?"
│  - Arjun: "Can't tell"
│  - Neha: "Shape of You!" ✓
├─ Rahul declares Neha winner
└─ Scores: Priya: 1, Arjun: 1, Neha: 1, Rahul: 0

Song 4 (Timer showing 0:15 remaining):
├─ Rahul starts 4th song
├─ Members barely finish guessing
├─ Timer reaches 0:00
├─ Host automatically rotates!

ROUND 2 BEGINS

New Host: Priya (was member, now host)
├─ Rahul becomes member
├─ Notification sent to all
├─ Priya sees song selector
└─ Game continues...

(Similar flow repeats)
```

---

## 📞 Support & Help

### Getting Help
1. Check this README first
2. Look in Troubleshooting section
3. Check browser console (F12)
4. Restart server and client
5. Clear browser cache

### Common Questions

**Q: Can I pause audio?**
A: Only host can use audio controls. Members just listen.

**Q: Can I change song while playing?**
A: No, click Stop first, then select new song.

**Q: What if everyone disconnects?**
A: Room is deleted, start fresh with new room code.

**Q: How long can a game last?**
A: Unlimited! Continue for hours if desired.

**Q: Do scores reset between rounds?**
A: No, scores accumulate throughout entire game.

---

## 🎉 Tips for Best Experience

1. **Use Good Audio Files**
   - Clear, high-quality MP3s
   - Variety of songs (different genres)
   - Mix of popular and obscure songs

2. **Communicate Outside Game**
   - Use Discord, Telegram, or video call
   - Can watch reactions live
   - Adds to the fun!

3. **Be Creative with Track Positions**
   - Don't always play choruses
   - Mix up verse, bridge, intro, outro
   - Keeps it challenging

4. **Encourage Everyone**
   - Everyone gets turns as host
   - Thank winners gracefully
   - Celebrate good guesses

5. **Balance Difficulty**
   - Easy songs: well-known, chorus clip
   - Hard songs: obscure, verse clip
   - Mix keeps game interesting

---

**Version**: 4.2.0  
**Last Updated**: February 2, 2026, 10:21 PM IST  
**Status**: ✅ Complete & Tested

🎵 **Enjoy the game!** 🎮
