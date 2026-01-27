import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import GameRoom from './pages/GameRoom';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/room/:roomCode" element={<GameRoom />} />
      </Routes>
    </Router>
  );
}

export default App;
