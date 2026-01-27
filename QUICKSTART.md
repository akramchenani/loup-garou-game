# 🚀 Quick Start Guide

## Prerequisites
- Python 3.10+
- Node.js 18+
- Redis

## One-Command Setup (Linux/macOS)

```bash
chmod +x setup.sh
./setup.sh
```

## Manual Setup

### 1. Start Redis
```bash
redis-server
```

### 2. Backend (Terminal 1)
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### 3. Frontend (Terminal 2)
```bash
cd frontend
npm install
npm run dev
```

### 4. Open Browser
Go to: http://localhost:3000

## First Game

### As Admin:
1. Click "Create Room"
2. Set 8 players, 2 wolves, 1 seer, 1 protector, 1 hunter
3. Share room code with 7 friends
4. Click "Start Game" when all joined
5. Use "Advance Phase" button to control game flow

### As Player:
1. Click "Join Room"
2. Enter room code from admin
3. Enter your nickname
4. Wait for game to start
5. Check your secret role
6. Follow the game phases!

## Game Flow

```
Night → Day → Voting → Night → Day → Voting...
```

- **Night**: Wolves vote to kill, Seer investigates, Protector shields
- **Day**: Discuss and share information
- **Voting**: Eliminate a suspect

## Win Conditions

- **Citizens**: Eliminate all wolves
- **Wolves**: Equal or outnumber citizens

## Troubleshooting

**Redis not found?**
```bash
# Ubuntu/Debian
sudo apt-get install redis-server

# macOS
brew install redis

# Docker
docker run -d -p 6379:6379 redis
```

**Port already in use?**
```bash
# Kill process on port 8000 or 3000
lsof -ti:8000 | xargs kill -9
lsof -ti:3000 | xargs kill -9
```

**WebSocket won't connect?**
- Ensure backend is running
- Check Redis is running
- Try restarting both servers

## Need Help?
Check the full README.md for detailed documentation!
