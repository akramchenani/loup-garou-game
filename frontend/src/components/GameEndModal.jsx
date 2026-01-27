import React from 'react';
import { useNavigate } from 'react-router-dom';

const GameEndModal = ({ winner, players }) => {
  const navigate = useNavigate();

  const isWolfWin = winner === 'wolves';
  const wolves = players.filter(p => p.role === 'wolf');
  const citizens = players.filter(p => p.role !== 'wolf');

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <div className={`max-w-3xl w-full rounded-3xl p-8 text-white shadow-2xl ${
        isWolfWin ? 'bg-gradient-to-br from-red-900 to-red-700' : 'bg-gradient-to-br from-blue-900 to-blue-700'
      }`}>
        <div className="text-center mb-8">
          <div className="text-8xl mb-4">{isWolfWin ? '🐺' : '👥'}</div>
          <h2 className="text-5xl font-bold mb-4">
            {isWolfWin ? 'Wolves Win!' : 'Citizens Win!'}
          </h2>
          <p className="text-2xl opacity-90">
            {isWolfWin 
              ? 'The wolves have overrun the village!' 
              : 'The village has eliminated all wolves!'}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-black/30 rounded-2xl p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span>🐺</span> Wolves
            </h3>
            <div className="space-y-2">
              {wolves.map(p => (
                <div key={p.id} className="flex items-center justify-between p-2 bg-black/20 rounded">
                  <span>{p.nickname}</span>
                  {p.is_alive ? (
                    <span className="text-green-400">✅ Survived</span>
                  ) : (
                    <span className="text-red-400">💀 Eliminated</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-black/30 rounded-2xl p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span>👥</span> Citizens
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {citizens.map(p => (
                <div key={p.id} className="flex items-center justify-between p-2 bg-black/20 rounded">
                  <div>
                    <div>{p.nickname}</div>
                    <div className="text-xs text-gray-300">
                      {p.role === 'seer' && '👁️ Seer'}
                      {p.role === 'protector' && '🛡️ Protector'}
                      {p.role === 'hunter' && '🎯 Hunter'}
                      {p.role === 'citizen' && '👤 Citizen'}
                    </div>
                  </div>
                  {p.is_alive ? (
                    <span className="text-green-400">✅</span>
                  ) : (
                    <span className="text-red-400">💀</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => navigate('/')}
            className="flex-1 bg-white text-gray-900 py-4 rounded-xl font-bold text-xl 
                     hover:bg-gray-100 transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameEndModal;
