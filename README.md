# 🐺 Loup-Garou Online - Complete Game Implementation

A real-time multiplayer social deduction game built with Django + Channels (backend) and React + Tailwind CSS (frontend).

## 🎮 Game Features

- **Real-time Multiplayer**: WebSocket-based communication for instant updates
- **Role-Based Gameplay**: 5 unique roles (Wolf, Citizen, Seer, Protector, Hunter)
- **Phase System**: Night actions, day discussions, voting, and leader election
- **Admin Controls**: Room creation and game flow management
- **Responsive UI**: Beautiful, mobile-friendly interface with Tailwind CSS
- **Private Actions**: Secure role assignments and hidden night actions

## 📋 Prerequisites

- Python 3.10+
- Node.js 18+
- Redis (for Django Channels)

## 🚀 Installation & Setup

### Backend Setup

1. **Navigate to backend directory**
```bash
cd backend
```

2. **Create virtual environment**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies**
```bash
pip install -r requirements.txt
```

4. **Run migrations**
```bash
python manage.py makemigrations
python manage.py migrate
```

5. **Create superuser (optional)**
```bash
python manage.py createsuperuser
```

6. **Start Redis** (required for WebSockets)
```bash
# On Ubuntu/Debian
sudo apt-get install redis-server
redis-server

# On macOS
brew install redis
redis-server

# On Windows (using Docker)
docker run -d -p 6379:6379 redis
```

7. **Run development server**
```bash
python manage.py runserver
```

Backend will be available at: `http://localhost:8000`

### Frontend Setup

1. **Navigate to frontend directory**
```bash
cd frontend
```

2. **Install dependencies**
```bash
npm install
```

3. **Create environment file**
```bash
cp .env.example .env
```

4. **Start development server**
```bash
npm run dev
```

Frontend will be available at: `http://localhost:3000`

## 🎯 How to Play

### For Admin (Game Creator)

1. Go to `http://localhost:3000`
2. Click "Create Room"
3. Configure:
   - Number of players
   - Role distribution (Wolves, Seers, Protectors, Hunters)
4. Share the **6-character room code** with players
5. Once all players join, click "Start Game"
6. Control game phases using the Admin Panel

### For Players

1. Go to `http://localhost:3000`
2. Click "Join Room"
3. Enter:
   - Room code (from admin)
   - Your nickname
4. Wait for game to start
5. View your secret role
6. Participate in night actions, discussions, and voting

## 🌙 Game Phases

### 1. **Night Phase**
- **Wolves**: Vote together to eliminate a player
- **Seer (Agisienne)**: Investigate one player's role
- **Protector**: Shield one player from wolves (can't protect same player twice)
- **Citizens & Hunter**: Sleep

### 2. **Day Phase**
- All alive players discuss
- Share information and suspicions
- Prepare for voting

### 3. **Leader Election** (if needed)
- Players vote for a leader
- Leader's vote counts double in elimination

### 4. **Voting Phase**
- Vote to eliminate a suspected wolf
- Leader vote = 2 votes
- Eliminated player's role is revealed

### 5. **Special: Hunter Revenge**
- If Hunter is killed, they choose one player to take with them

## 🎭 Roles

| Role | Icon | Ability | Win Condition |
|------|------|---------|---------------|
| **Wolf** | 🐺 | Vote to kill at night | Wolves ≥ Citizens |
| **Citizen** | 👤 | Vote during day | All wolves eliminated |
| **Seer** | 👁️ | See one role per night | All wolves eliminated |
| **Protector** | 🛡️ | Protect one player per night | All wolves eliminated |
| **Hunter** | 🎯 | Kill on death | All wolves eliminated |

## 🔧 API Endpoints

### Rooms
- `POST /api/rooms/` - Create room
- `GET /api/rooms/{code}/` - Get room details
- `POST /api/rooms/{code}/join/` - Join room
- `POST /api/rooms/{code}/start_game/` - Start game (admin)
- `POST /api/rooms/{code}/advance_phase/` - Advance phase (admin)
- `GET /api/rooms/{code}/state/` - Get game state

### Players
- `GET /api/players/{id}/role/` - Get player role (private)
- `POST /api/players/{id}/night_action/` - Submit night action
- `POST /api/players/{id}/vote/` - Submit vote
- `POST /api/players/{id}/hunter_revenge/` - Hunter's revenge kill

### WebSocket
- `ws://localhost:8000/ws/game/{room_code}/` - Real-time game updates

## 📁 Project Structure

```
loup-garou-game/
├── backend/
│   ├── game/
│   │   ├── models.py          # Database models
│   │   ├── serializers.py     # API serializers
│   │   ├── views.py           # REST API views
│   │   ├── consumers.py       # WebSocket consumers
│   │   ├── game_logic.py      # Core game logic
│   │   ├── routing.py         # WebSocket routing
│   │   └── urls.py            # API URLs
│   ├── loupgarou/
│   │   ├── settings.py        # Django settings
│   │   ├── asgi.py           # ASGI config
│   │   └── urls.py           # Main URLs
│   ├── manage.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/        # React components
│   │   │   ├── AdminPanel.jsx
│   │   │   ├── DayDiscussionPanel.jsx
│   │   │   ├── GameEndModal.jsx
│   │   │   ├── NightActionPanel.jsx
│   │   │   ├── PhaseIndicator.jsx
│   │   │   ├── PlayerList.jsx
│   │   │   ├── RoleRevealModal.jsx
│   │   │   ├── Timer.jsx
│   │   │   └── VotingPanel.jsx
│   │   ├── pages/             # Page components
│   │   │   ├── HomePage.jsx
│   │   │   └── GameRoom.jsx
│   │   ├── services/          # API & WebSocket
│   │   │   ├── api.js
│   │   │   └── websocket.js
│   │   ├── store/             # State management
│   │   │   └── gameStore.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
└── README.md
```

## 🐛 Troubleshooting

### Redis Connection Error
```bash
# Make sure Redis is running
redis-cli ping
# Should return: PONG
```

### WebSocket Connection Failed
- Ensure backend is running on port 8000
- Check Redis is running
- Verify CORS settings in Django

### Role Not Assigned
- Make sure exact number of players joined before starting
- Check role configuration matches player count

### Port Already in Use
```bash
# Backend (8000)
lsof -ti:8000 | xargs kill -9

# Frontend (3000)
lsof -ti:3000 | xargs kill -9
```

## 🎨 Customization

### Add New Roles
1. Update `ROLE_CHOICES` in `backend/game/models.py`
2. Add role logic in `backend/game/game_logic.py`
3. Update `roleInfo` in `frontend/src/components/RoleRevealModal.jsx`
4. Add Tailwind color in `frontend/tailwind.config.js`

### Adjust Timers
Edit in `backend/game/game_logic.py`:
```python
game_state.timer_end = timezone.now() + timedelta(minutes=YOUR_TIME)
```

### Change Player Limits
Modify in `backend/game/models.py`:
```python
max_players = models.IntegerField(default=YOUR_LIMIT)
```

## 📝 TODO / Future Enhancements

- [ ] Voice chat integration
- [ ] Mobile app (React Native)
- [ ] Game replays/history
- [ ] More roles (Cupid, Witch, etc.)
- [ ] Tournament mode
- [ ] Spectator mode
- [ ] In-game chat system
- [ ] Player statistics
- [ ] Custom role configurations
- [ ] Multi-language support

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

This project is open source and available under the MIT License.

## 🎉 Credits

Built with:
- Django & Django REST Framework
- Django Channels (WebSockets)
- React
- Tailwind CSS
- Zustand (State Management)
- Vite (Build Tool)

## 📞 Support

For issues or questions:
1. Check the Troubleshooting section
2. Open an issue on GitHub
3. Contact the development team

---

**Enjoy playing Loup-Garou! 🐺🌙**
