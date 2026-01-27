import React from 'react';
import { useGameStore } from '../store/gameStore';

const roleInfo = {
  wolf: {
    emoji: '🐺',
    title: 'Wolf',
    color: 'bg-wolf',
    description: 'You hunt at night. Vote with other wolves to eliminate a player.',
    abilities: ['Vote to kill one player each night', 'Win when wolves ≥ citizens'],
  },
  citizen: {
    emoji: '👤',
    title: 'Citizen',
    color: 'bg-citizen',
    description: 'A regular villager. Use your voice and vote to find the wolves!',
    abilities: ['Participate in discussions', 'Vote to eliminate suspects', 'Win when all wolves are eliminated'],
  },
  seer: {
    emoji: '👁️',
    title: 'Agisienne (Seer)',
    color: 'bg-seer',
    description: 'You can see the truth. Each night, discover one player\'s role.',
    abilities: ['See one player\'s role each night', 'Use information wisely', 'Help guide the citizens'],
  },
  protector: {
    emoji: '🛡️',
    title: 'Protector',
    color: 'bg-protector',
    description: 'You shield the innocent. Protect one player from wolves each night.',
    abilities: ['Protect one player each night', 'Cannot protect same player twice in a row', 'Save lives strategically'],
  },
  hunter: {
    emoji: '🎯',
    title: 'Sayad (Hunter)',
    color: 'bg-hunter',
    description: 'Vengeance from beyond. If killed, take one player with you.',
    abilities: ['Choose a player when eliminated', 'Use your final shot wisely', 'Can change the game\'s outcome'],
  },
};

const RoleRevealModal = () => {
  const { player, hideRoleModal } = useGameStore();
  
  if (!player?.role) return null;
  
  const info = roleInfo[player.role];

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className={`${info.color} max-w-2xl w-full rounded-3xl p-8 text-white shadow-2xl transform scale-100 animate-pulse-once`}>
        <div className="text-center mb-8">
          <div className="text-8xl mb-4">{info.emoji}</div>
          <h2 className="text-5xl font-bold mb-2">{info.title}</h2>
          <p className="text-xl opacity-90">{info.description}</p>
        </div>

        <div className="bg-black/20 rounded-2xl p-6 mb-8">
          <h3 className="text-2xl font-bold mb-4">Your Abilities:</h3>
          <ul className="space-y-3">
            {info.abilities.map((ability, index) => (
              <li key={index} className="flex items-start">
                <span className="text-2xl mr-3">•</span>
                <span className="text-lg">{ability}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-yellow-500/20 border-2 border-yellow-500 rounded-xl p-4 mb-6">
          <p className="text-center font-semibold">
            ⚠️ Keep your role secret! Don't show this screen to others.
          </p>
        </div>

        <button
          onClick={hideRoleModal}
          className="w-full bg-white text-gray-900 py-4 rounded-xl font-bold text-xl 
                   hover:bg-gray-100 transition-colors"
        >
          I Understand - Start Game
        </button>
      </div>
    </div>
  );
};

export default RoleRevealModal;
