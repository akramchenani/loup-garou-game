import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import websocketService from '../services/websocket';
import { getRoom, getGameState, getPlayerRole } from '../services/api';
import RoleRevealModal from '../components/RoleRevealModal';
import PlayerList from '../components/PlayerList';
import PhaseIndicator from '../components/PhaseIndicator';
import AdminPanel from '../components/AdminPanel';
import NightActionPanel from '../components/NightActionPanel';
import DayDiscussionPanel from '../components/DayDiscussionPanel';
import VotingPanel from '../components/VotingPanel';
import GameEndModal from '../components/GameEndModal';
import Timer from '../components/Timer';

const GameRoom = () => {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const {
    room,
    player,
    playerToken,
    adminToken,
    gameState,
    players,
    showRoleModal,
    setRoom,
    setRoomCode,
    setGameState,
    setPlayers,
    setPlayer,
    addPlayer,
    updatePlayer,
    addNotification,
  } = useGameStore();

  const [loading, setLoading] = useState(true);
  const [gameEnded, setGameEnded] = useState(false);
  const [winner, setWinner] = useState(null);

  useEffect(() => {
    // Load from localStorage if needed
    const storedPlayerToken = localStorage.getItem('playerToken');
    const storedPlayerId = localStorage.getItem('playerId');
    const storedAdminToken = localStorage.getItem('adminToken');

    const initializeRoom = async () => {
      try {
        const roomData = await getRoom(roomCode);
        setRoom(roomData);
        setRoomCode(roomCode);
        setPlayers(roomData.players);

        if (roomData.status === 'playing' || roomData.status === 'finished') {
          const state = await getGameState(roomCode);
          setGameState(state);

          if (roomData.status === 'finished') {
            setGameEnded(true);
          }
        }

        // Get player role if playing
        if (storedPlayerToken && storedPlayerId && roomData.status === 'playing') {
          try {
            const roleData = await getPlayerRole(storedPlayerId, storedPlayerToken);
            const playerData = roomData.players.find(p => p.id === parseInt(storedPlayerId));
            if (playerData) {
              setPlayer({ ...playerData, role: roleData.role }, storedPlayerToken);
            }
          } catch (err) {
            console.error('Failed to get role:', err);
          }
        }

        setLoading(false);
      } catch (err) {
        console.error('Failed to load room:', err);
        addNotification('Room not found', 'error');
        navigate('/');
      }
    };

    initializeRoom();

    // Connect WebSocket
    websocketService.connect(roomCode);
    
    const handleWebSocketMessage = (data) => {
      console.log('WebSocket message:', data);

      if (data.type === 'initial_state' || data.type === 'state_update') {
        if (data.data.game_state) {
          setGameState(data.data.game_state);
        }
        if (data.data.players) {
          setPlayers(data.data.players);
        }
      } else if (data.type === 'game_update') {
        handleGameUpdate(data.data);
      }
    };

    websocketService.addListener(handleWebSocketMessage);

    return () => {
      websocketService.removeListener(handleWebSocketMessage);
      websocketService.disconnect();
    };
  }, [roomCode]);

  const handleGameUpdate = (data) => {
    switch (data.type) {
      case 'player_joined':
        addPlayer(data.player);
        addNotification(`${data.player.nickname} joined the room`, 'info');
        break;

      case 'phase_change':
        setGameState(prev => ({ ...prev, phase: data.phase }));
        
        if (data.phase === 'night') {
          addNotification(`Night ${data.night_number} begins...`, 'info');
        } else if (data.phase === 'day') {
          addNotification(`Day ${data.day_number}`, 'info');
          if (data.deaths && data.deaths.length > 0) {
            data.deaths.forEach(death => {
              addNotification(`${death.nickname} was killed!`, 'error');
            });
          }
        } else if (data.phase === 'voting') {
          addNotification('Voting phase begins!', 'warning');
        }
        break;

      case 'player_eliminated':
        updatePlayer(data.player.id, { is_alive: false });
        addNotification(`${data.player.nickname} was eliminated! They were ${data.player.role}`, 'error');
        break;

      case 'leader_elected':
        players.forEach(p => updatePlayer(p.id, { is_leader: false }));
        updatePlayer(data.leader.id, { is_leader: true });
        addNotification(`${data.leader.nickname} is now the leader!`, 'success');
        break;

      case 'hunter_revenge':
        updatePlayer(data.victim.id, { is_alive: false });
        addNotification(`${data.hunter} took ${data.victim.nickname} with them!`, 'error');
        break;

      case 'game_ended':
        setGameEnded(true);
        setWinner(data.winner);
        addNotification(`Game Over! ${data.winner} win!`, 'success');
        break;

      default:
        console.log('Unknown update type:', data.type);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl">Loading room...</div>
      </div>
    );
  }

  const renderGameContent = () => {
    if (!gameState || gameState.phase === 'setup') {
      return (
        <div className="text-center py-12">
          <h2 className="text-3xl font-bold mb-4">Waiting for game to start...</h2>
          <p className="text-gray-400">
            {players.length} / {room.max_players} players
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <PhaseIndicator phase={gameState.phase} />
        
        {gameState.timer_end && <Timer endTime={gameState.timer_end} />}

        {gameState.phase === 'night' && player?.is_alive && (
          <NightActionPanel />
        )}

        {gameState.phase === 'day' && (
          <DayDiscussionPanel />
        )}

        {gameState.phase === 'voting' && player?.is_alive && (
          <VotingPanel />
        )}

        {gameState.phase === 'leader_election' && player?.is_alive && (
          <VotingPanel isLeaderElection />
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gray-800 rounded-2xl p-6 mb-6 shadow-xl">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold mb-2">Room: {roomCode}</h1>
              {player && (
                <p className="text-gray-400">
                  Playing as <span className="text-white font-semibold">{player.nickname}</span>
                  {player.role && ` • ${player.role}`}
                </p>
              )}
            </div>
            <button
              onClick={() => navigate('/')}
              className="bg-gray-700 hover:bg-gray-600 px-6 py-2 rounded-lg transition-colors"
            >
              Leave Room
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Game Area */}
          <div className="lg:col-span-2">
            {adminToken && <AdminPanel />}
            {renderGameContent()}
          </div>

          {/* Sidebar */}
          <div>
            <PlayerList players={players} currentPlayerId={player?.id} />
          </div>
        </div>
      </div>

      {/* Modals */}
      {showRoleModal && player?.role && <RoleRevealModal />}
      {gameEnded && <GameEndModal winner={winner} players={players} />}
    </div>
  );
};

export default GameRoom;
