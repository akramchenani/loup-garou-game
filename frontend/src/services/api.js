import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Room APIs
export const createRoom = async (config) => {
  const response = await api.post('/rooms/', config);
  return response.data;
};

export const getRoom = async (roomCode) => {
  const response = await api.get(`/rooms/${roomCode}/`);
  return response.data;
};

export const joinRoom = async (roomCode, nickname) => {
  const response = await api.post(`/rooms/${roomCode}/join/`, { nickname });
  return response.data;
};

export const startGame = async (roomCode, adminToken) => {
  const response = await api.post(
    `/rooms/${roomCode}/start_game/`,
    {},
    {
      headers: { 'X-Admin-Token': adminToken },
    }
  );
  return response.data;
};

export const advancePhase = async (roomCode, adminToken) => {
  const response = await api.post(
    `/rooms/${roomCode}/advance_phase/`,
    {},
    {
      headers: { 'X-Admin-Token': adminToken },
    }
  );
  return response.data;
};

export const getGameState = async (roomCode) => {
  const response = await api.get(`/rooms/${roomCode}/state/`);
  return response.data;
};

// Player APIs
export const getPlayerRole = async (playerId, playerToken) => {
  const response = await api.get(`/players/${playerId}/role/`, {
    headers: { 'X-Player-Token': playerToken },
  });
  return response.data;
};

export const submitNightAction = async (playerId, playerToken, targetId) => {
  const response = await api.post(
    `/players/${playerId}/night_action/`,
    { target_id: targetId },
    {
      headers: { 'X-Player-Token': playerToken },
    }
  );
  return response.data;
};

export const submitVote = async (playerId, playerToken, targetId) => {
  const response = await api.post(
    `/players/${playerId}/vote/`,
    { target_id: targetId },
    {
      headers: { 'X-Player-Token': playerToken },
    }
  );
  return response.data;
};

export const hunterRevenge = async (playerId, playerToken, targetId) => {
  const response = await api.post(
    `/players/${playerId}/hunter_revenge/`,
    { target_id: targetId },
    {
      headers: { 'X-Player-Token': playerToken },
    }
  );
  return response.data;
};

// Game Logs
export const getGameLogs = async (roomCode) => {
  const response = await api.get(`/logs/?room_code=${roomCode}`);
  return response.data;
};

export default api;
