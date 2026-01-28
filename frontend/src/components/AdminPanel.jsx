import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { startGame, advancePhase } from '../services/api';

const AdminPanel = () => {
  const { roomCode, adminToken, room, gameState, addNotification } = useGameStore();
  const [loading, setLoading] = useState(false);

  const handleStartGame = async () => {
    console.log('🔑 Admin Token:', adminToken);
    console.log('🏠 Room Code:', roomCode);
    
    setLoading(true);
    try {
      await startGame(roomCode, adminToken);
      addNotification('Game started!', 'success');
    } catch (err) {
      console.error('❌ Start Game Error:', err);
      console.error('❌ Error Response:', err.response?.data);
      addNotification(err.response?.data?.error || 'Failed to start game', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAdvancePhase = async () => {
    setLoading(true);
    try {
      await advancePhase(roomCode, adminToken);
      addNotification('Phase advanced', 'success');
    } catch (err) {
      addNotification(err.response?.data?.error || 'Failed to advance phase', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-purple-900 rounded-2xl p-6 mb-6 shadow-xl border-2 border-purple-500">
      <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <span>👑</span> Admin Controls
      </h3>
      
      <div className="space-y-4">
        {room?.status === 'waiting' && (
          <button
            onClick={handleStartGame}
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 
                     py-3 rounded-lg font-bold transition-colors"
          >
            {loading ? 'Starting...' : 'Start Game'}
          </button>
        )}

        {room?.status === 'playing' && gameState && (
          <>
            <div className="bg-black/20 rounded-lg p-4">
              <div className="text-sm text-gray-300 mb-1">Current Phase</div>
              <div className="text-xl font-bold">{gameState.phase}</div>
            </div>

            <button
              onClick={handleAdvancePhase}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 
                       py-3 rounded-lg font-bold transition-colors"
            >
              {loading ? 'Advancing...' : 'Advance Phase'}
            </button>
          </>
        )}

        <div className="text-xs text-purple-200 bg-black/20 rounded-lg p-3">
          <strong>Note:</strong> As admin, you control when phases change. 
          Monitor the game and advance when ready.
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
