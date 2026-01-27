import React from 'react';
import { useGameStore } from '../store/gameStore';

const DayDiscussionPanel = () => {
  const { player, players } = useGameStore();

  return (
    <div className="bg-gray-800 rounded-2xl p-6 shadow-xl">
      <div className="text-center mb-6">
        <div className="text-6xl mb-4">💬</div>
        <h3 className="text-2xl font-bold mb-2">Discussion Time</h3>
        <p className="text-gray-400">
          Share information, discuss suspicions, and prepare for the vote
        </p>
      </div>

      <div className="bg-yellow-900/30 border-2 border-yellow-600 rounded-xl p-6 mb-6">
        <h4 className="font-bold text-yellow-300 mb-3 text-lg">💡 Discussion Tips:</h4>
        <ul className="space-y-2 text-sm text-yellow-100">
          <li>• Share your observations from the night</li>
          <li>• Listen to others' claims carefully</li>
          <li>• Look for inconsistencies in stories</li>
          <li>• Work together to identify suspicious behavior</li>
          <li>• Be strategic - wolves may be lying!</li>
        </ul>
      </div>

      <div className="bg-gray-700 rounded-xl p-4">
        <h4 className="font-semibold mb-3">Alive Players:</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {players.filter(p => p.is_alive).map(p => (
            <div
              key={p.id}
              className={`p-3 rounded-lg ${
                p.id === player?.id ? 'bg-blue-900' : 'bg-gray-600'
              }`}
            >
              <div className="font-semibold">{p.nickname}</div>
              {p.is_leader && <div className="text-yellow-500 text-sm">👑 Leader</div>}
            </div>
          ))}
        </div>
      </div>

      {player?.is_leader && (
        <div className="mt-6 bg-purple-900 rounded-xl p-4 border-2 border-purple-500">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">👑</span>
            <span className="font-bold text-lg">Leader Controls</span>
          </div>
          <p className="text-sm text-purple-200">
            As leader, your vote counts double in the elimination phase. 
            Use your influence wisely!
          </p>
        </div>
      )}
    </div>
  );
};

export default DayDiscussionPanel;
