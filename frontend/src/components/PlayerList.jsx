import React from 'react';

const PlayerList = ({ players, currentPlayerId }) => {
  const alivePlayers = players.filter(p => p.is_alive);
  const deadPlayers = players.filter(p => !p.is_alive);

  const PlayerCard = ({ player, isDead = false }) => (
    <div
      className={`p-4 rounded-lg transition-all ${
        isDead 
          ? 'bg-gray-800/50 opacity-50' 
          : 'bg-gray-700 hover:bg-gray-600'
      } ${
        player.id === currentPlayerId ? 'ring-2 ring-blue-500' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${
            isDead ? 'bg-red-500' : 'bg-green-500'
          }`} />
          <span className={`font-semibold ${isDead ? 'line-through' : ''}`}>
            {player.nickname}
          </span>
          {player.is_leader && (
            <span className="text-yellow-500 text-xl">👑</span>
          )}
          {player.id === currentPlayerId && (
            <span className="text-xs bg-blue-500 px-2 py-1 rounded-full">You</span>
          )}
        </div>
        {isDead && <span className="text-gray-500">💀</span>}
      </div>
    </div>
  );

  return (
    <div className="bg-gray-800 rounded-2xl p-6 shadow-xl">
      <h3 className="text-2xl font-bold mb-4">Players</h3>
      
      {alivePlayers.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm text-gray-400 mb-3">
            Alive ({alivePlayers.length})
          </h4>
          <div className="space-y-2">
            {alivePlayers.map(player => (
              <PlayerCard key={player.id} player={player} />
            ))}
          </div>
        </div>
      )}

      {deadPlayers.length > 0 && (
        <div>
          <h4 className="text-sm text-gray-400 mb-3">
            Eliminated ({deadPlayers.length})
          </h4>
          <div className="space-y-2">
            {deadPlayers.map(player => (
              <PlayerCard key={player.id} player={player} isDead />
            ))}
          </div>
        </div>
      )}

      {players.length === 0 && (
        <p className="text-gray-500 text-center py-8">No players yet</p>
      )}
    </div>
  );
};

export default PlayerList;
