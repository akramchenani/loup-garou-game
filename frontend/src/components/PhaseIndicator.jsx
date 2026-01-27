import React from 'react';

const phaseConfig = {
  setup: {
    title: 'Setup',
    emoji: '⚙️',
    color: 'bg-gray-700',
    description: 'Waiting for game to start',
  },
  night: {
    title: 'Night Phase',
    emoji: '🌙',
    color: 'bg-indigo-900',
    description: 'Darkness falls... perform your night actions',
  },
  day: {
    title: 'Day Phase',
    emoji: '☀️',
    color: 'bg-yellow-600',
    description: 'Discuss and share information',
  },
  leader_election: {
    title: 'Leader Election',
    emoji: '👑',
    color: 'bg-purple-700',
    description: 'Vote for a leader',
  },
  voting: {
    title: 'Voting Phase',
    emoji: '🗳️',
    color: 'bg-red-700',
    description: 'Vote to eliminate a suspect',
  },
  finished: {
    title: 'Game Over',
    emoji: '🏁',
    color: 'bg-gray-800',
    description: 'The game has ended',
  },
};

const PhaseIndicator = ({ phase }) => {
  const config = phaseConfig[phase] || phaseConfig.setup;

  return (
    <div className={`${config.color} rounded-2xl p-6 shadow-xl text-center animate-fadeIn`}>
      <div className="text-6xl mb-4">{config.emoji}</div>
      <h2 className="text-3xl font-bold mb-2">{config.title}</h2>
      <p className="text-lg opacity-90">{config.description}</p>
    </div>
  );
};

export default PhaseIndicator;
