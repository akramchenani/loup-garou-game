import React, { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { submitNightAction } from '../services/api';

const NightActionPanel = () => {
  const { player, playerToken, players, addNotification } = useGameStore();
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [actionSubmitted, setActionSubmitted] = useState(false);
  const [result, setResult] = useState(null);

  const alivePlayers = players.filter(p => p.is_alive && p.id !== player.id);

  const canAct = ['wolf', 'seer', 'protector'].includes(player?.role);

  const handleSubmitAction = async () => {
    if (!selectedTarget) {
      addNotification('Please select a target', 'warning');
      return;
    }

    try {
      const response = await submitNightAction(player.id, playerToken, selectedTarget);
      setActionSubmitted(true);
      
      if (response.result) {
        setResult(response.result);
      }
      
      addNotification('Action submitted successfully', 'success');
    } catch (err) {
      addNotification(err.response?.data?.error || 'Failed to submit action', 'error');
    }
  };

  if (!canAct) {
    return (
      <div className="bg-gray-800 rounded-2xl p-8 text-center">
        <div className="text-6xl mb-4">😴</div>
        <h3 className="text-2xl font-bold mb-2">Rest Well</h3>
        <p className="text-gray-400">You have no night action. Wait for day to break.</p>
      </div>
    );
  }

  if (actionSubmitted && !result) {
    return (
      <div className="bg-green-900 rounded-2xl p-8 text-center">
        <div className="text-6xl mb-4">✅</div>
        <h3 className="text-2xl font-bold mb-2">Action Submitted</h3>
        <p className="text-gray-300">Waiting for others to complete their actions...</p>
      </div>
    );
  }

  if (result) {
    return (
      <div className="bg-purple-900 rounded-2xl p-8">
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">👁️</div>
          <h3 className="text-2xl font-bold mb-2">Investigation Result</h3>
        </div>
        
        <div className="bg-black/30 rounded-xl p-6 text-center">
          <div className="text-xl mb-2">
            <span className="font-bold">{result.target_nickname}</span> is a
          </div>
          <div className="text-3xl font-bold text-yellow-400">
            {result.target_role.toUpperCase()}
          </div>
        </div>
      </div>
    );
  }

  const getActionTitle = () => {
    switch (player.role) {
      case 'wolf':
        return '🐺 Choose Your Victim';
      case 'seer':
        return '👁️ Investigate a Player';
      case 'protector':
        return '🛡️ Protect a Player';
      default:
        return 'Choose Target';
    }
  };

  const getActionDescription = () => {
    switch (player.role) {
      case 'wolf':
        return 'Vote with other wolves to eliminate a player tonight';
      case 'seer':
        return 'Discover the true role of one player';
      case 'protector':
        return 'Shield one player from the wolves (cannot protect same player twice)';
      default:
        return '';
    }
  };

  return (
    <div className="bg-gray-800 rounded-2xl p-6 shadow-xl">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold mb-2">{getActionTitle()}</h3>
        <p className="text-gray-400">{getActionDescription()}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        {alivePlayers.map(p => (
          <button
            key={p.id}
            onClick={() => setSelectedTarget(p.id)}
            className={`p-4 rounded-lg border-2 transition-all ${
              selectedTarget === p.id
                ? 'border-blue-500 bg-blue-900 transform scale-105'
                : 'border-gray-600 bg-gray-700 hover:border-gray-500'
            }`}
          >
            <div className="font-semibold">{p.nickname}</div>
            {p.is_leader && <div className="text-yellow-500 text-sm">👑 Leader</div>}
          </button>
        ))}
      </div>

      <button
        onClick={handleSubmitAction}
        disabled={!selectedTarget}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed
                 py-4 rounded-lg font-bold text-lg transition-colors"
      >
        Submit Action
      </button>
    </div>
  );
};

export default NightActionPanel;
