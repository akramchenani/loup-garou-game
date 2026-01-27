import React, { useState, useEffect } from 'react';

const Timer = ({ endTime }) => {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const end = new Date(endTime);
      const now = new Date();
      const diff = Math.max(0, Math.floor((end - now) / 1000));
      setTimeLeft(diff);
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [endTime]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const getColorClass = () => {
    if (timeLeft > 60) return 'text-green-500';
    if (timeLeft > 30) return 'text-yellow-500';
    return 'text-red-500 animate-pulse';
  };

  return (
    <div className="bg-gray-800 rounded-xl p-4 text-center">
      <div className="text-sm text-gray-400 mb-2">Time Remaining</div>
      <div className={`text-4xl font-bold ${getColorClass()}`}>
        {minutes}:{seconds.toString().padStart(2, '0')}
      </div>
    </div>
  );
};

export default Timer;
