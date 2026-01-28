import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createRoom, joinRoom } from '../services/api';
import { useGameStore } from '../store/gameStore';

const HomePage = () => {
  const navigate = useNavigate();
  const { setRoom, setRoomCode, setAdminToken, setPlayer } = useGameStore();
  
  const [mode, setMode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [numWolves, setNumWolves] = useState(2);
  const [numSeers, setNumSeers] = useState(1);
  const [numProtectors, setNumProtectors] = useState(1);
  const [numHunters, setNumHunters] = useState(1);
  
  const [roomCode, setRoomCodeInput] = useState('');
  const [nickname, setNickname] = useState('');

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await createRoom({
        max_players: maxPlayers,
        num_wolves: numWolves,
        num_seers: numSeers,
        num_protectors: numProtectors,
        num_hunters: numHunters,
      });

      console.log('✅ Room created:', data);
      console.log('🔑 Admin token received:', data.admin_token);

      setRoom(data.room);
      setRoomCode(data.room.code);
      setAdminToken(data.admin_token);
      
      // Store in localStorage - THIS WAS MISSING!
      localStorage.setItem('adminToken', data.admin_token);
      localStorage.setItem('roomCode', data.room.code);
      
      navigate(`/room/${data.room.code}`);
    } catch (err) {
      console.error('❌ Create room error:', err);
      setError(err.response?.data?.error || 'Failed to create room');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await joinRoom(roomCode.toUpperCase(), nickname);
      
      setPlayer(data.player, data.player_token);
      setRoomCode(roomCode.toUpperCase());
      
      localStorage.setItem('playerToken', data.player_token);
      localStorage.setItem('playerId', data.player.id);
      localStorage.setItem('roomCode', roomCode.toUpperCase());
      
      navigate(`/room/${roomCode.toUpperCase()}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to join room');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold text-red-500 mb-4">🐺 Loup-Garou</h1>
          <p className="text-gray-400 text-lg">Social Deduction Game</p>
        </div>

        {!mode ? (
          <div className="grid md:grid-cols-2 gap-6">
            <button
              onClick={() => setMode('create')}
              className="bg-gradient-to-br from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 
                       p-8 rounded-2xl transform hover:scale-105 transition-all shadow-xl"
            >
              <div className="text-5xl mb-4">🎮</div>
              <h2 className="text-2xl font-bold mb-2">Create Room</h2>
              <p className="text-gray-300">Start a new game as admin</p>
            </button>

            <button
              onClick={() => setMode('join')}
              className="bg-gradient-to-br from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 
                       p-8 rounded-2xl transform hover:scale-105 transition-all shadow-xl"
            >
              <div className="text-5xl mb-4">🚪</div>
              <h2 className="text-2xl font-bold mb-2">Join Room</h2>
              <p className="text-gray-300">Enter an existing game</p>
            </button>
          </div>
        ) : mode === 'create' ? (
          <div className="bg-gray-800 rounded-2xl p-8 shadow-2xl">
            <button
              onClick={() => setMode(null)}
              className="text-gray-400 hover:text-white mb-6 flex items-center"
            >
              ← Back
            </button>
            
            <h2 className="text-3xl font-bold mb-6">Create New Room</h2>
            
            <form onSubmit={handleCreateRoom} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Max Players</label>
                <input
                  type="number"
                  min="4"
                  max="20"
                  value={maxPlayers}
                  onChange={(e) => setMaxPlayers(parseInt(e.target.value))}
                  className="w-full bg-gray-700 rounded-lg px-4 py-3 focus:ring-2 focus:ring-red-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">🐺 Wolves</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={numWolves}
                    onChange={(e) => setNumWolves(parseInt(e.target.value))}
                    className="w-full bg-gray-700 rounded-lg px-4 py-3 focus:ring-2 focus:ring-red-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">👁️ Seers</label>
                  <input
                    type="number"
                    min="0"
                    max="2"
                    value={numSeers}
                    onChange={(e) => setNumSeers(parseInt(e.target.value))}
                    className="w-full bg-gray-700 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">🛡️ Protectors</label>
                  <input
                    type="number"
                    min="0"
                    max="2"
                    value={numProtectors}
                    onChange={(e) => setNumProtectors(parseInt(e.target.value))}
                    className="w-full bg-gray-700 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">🎯 Hunters</label>
                  <input
                    type="number"
                    min="0"
                    max="2"
                    value={numHunters}
                    onChange={(e) => setNumHunters(parseInt(e.target.value))}
                    className="w-full bg-gray-700 rounded-lg px-4 py-3 focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 text-red-200">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-600 
                         py-4 rounded-lg font-bold text-lg transition-colors"
              >
                {loading ? 'Creating...' : 'Create Room'}
              </button>
            </form>
          </div>
        ) : (
          <div className="bg-gray-800 rounded-2xl p-8 shadow-2xl">
            <button
              onClick={() => setMode(null)}
              className="text-gray-400 hover:text-white mb-6 flex items-center"
            >
              ← Back
            </button>
            
            <h2 className="text-3xl font-bold mb-6">Join Room</h2>
            
            <form onSubmit={handleJoinRoom} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Room Code</label>
                <input
                  type="text"
                  value={roomCode}
                  onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                  placeholder="Enter 6-character code"
                  maxLength={6}
                  className="w-full bg-gray-700 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none uppercase"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Nickname</label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Enter your nickname"
                  maxLength={50}
                  className="w-full bg-gray-700 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>

              {error && (
                <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 text-red-200">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 
                         py-4 rounded-lg font-bold text-lg transition-colors"
              >
                {loading ? 'Joining...' : 'Join Room'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;
