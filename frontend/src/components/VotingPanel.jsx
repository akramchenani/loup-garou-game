import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { submitVote } from '../services/api';

const VotingPanel = ({ isLeaderElection = false }) => {
  const { player, playerToken, players, addNotification } = useGameStore();
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [voteSubmitted, setVoteSubmitted] = useState(false);

  const alivePlayers = players.filter(p => p.is_alive && (!isLeaderElection || p.id !== player.id));

  const handleSubmitVote = async () => {
    if (!selectedTarget) {
      addNotification('Please select a player to vote for', 'warning');
      return;
    }

    try {
      await submitVote(player.id, playerToken, selectedTarget);
      setVoteSubmitted(true);
      addNotification('Vote submitted successfully', 'success');
    } catch (err) {
      addNotification(err.response?.data?.error || 'Failed to submit vote', 'error');
    }
  };

  if (voteSubmitted) {
    return (
      <div className="bg-green-900 rounded-2xl p-8 text-center">
        <div className="text-6xl mb-4">✅</div>
        <h3 className="text-2xl font-bold mb-2">Vote Submitted</h3>
        <p className="text-gray-300">Waiting for other players to vote...</p>
      </div>
    );
  }

  const title = isLeaderElection ? '👑 Vote for Leader' : '🗳️ Vote to Eliminate';
  const description = isLeaderElection
    ? 'Choose who should lead the village. The leader\'s vote counts double!'
    : 'Vote to eliminate a suspected wolf from the game';

  return (
    <div className="bg-gray-800 rounded-2xl p-6 shadow-xl">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold mb-2">{title}</h3>
        <p className="text-gray-400">{description}</p>
        {player?.is_leader && !isLeaderElection && (
          <div className="mt-3 bg-purple-900 rounded-lg p-3 inline-block">
            <span className="text-yellow-500 font-bold">👑 Your vote counts as 2!</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        {alivePlayers.map(p => (
          <button
            key={p.id}
            onClick={() => setSelectedTarget(p.id)}
            className={`p-4 rounded-lg border-2 transition-all ${
              selectedTarget === p.id
                ? 'border-red-500 bg-red-900 transform scale-105'
                : 'border-gray-600 bg-gray-700 hover:border-gray-500'
            }`}
          >
            <div className="font-semibold">{p.nickname}</div>
            {p.is_leader && <div className="text-yellow-500 text-sm">👑 Leader</div>}
          </button>
        ))}
      </div>

      {!isLeaderElection && (
        <div className="bg-red-900/30 border border-red-600 rounded-lg p-4 mb-6">
          <p className="text-sm text-red-200 text-center">
            ⚠️ Choose carefully! This player will be eliminated from the game.
          </p>
        </div>
      )}

      <button
        onClick={handleSubmitVote}
        disabled={!selectedTarget}
        className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed
                 py-4 rounded-lg font-bold text-lg transition-colors"
      >
        Cast Vote
      </button>
    </div>
  );
};

export default VotingPanel;
