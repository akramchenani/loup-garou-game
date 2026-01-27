import { create } from 'zustand';

export const useGameStore = create((set, get) => ({
  // Room data
  room: null,
  roomCode: null,
  
  // Player data
  player: null,
  playerToken: null,
  adminToken: null,
  
  // Game state
  gameState: null,
  players: [],
  
  // UI state
  showRoleModal: false,
  notifications: [],
  
  // Actions
  setRoom: (room) => set({ room }),
  setRoomCode: (code) => set({ roomCode: code }),
  
  setPlayer: (player, token) => set({ 
    player, 
    playerToken: token,
    showRoleModal: player?.role ? true : false 
  }),
  
  setAdminToken: (token) => set({ adminToken: token }),
  
  setGameState: (gameState) => set({ gameState }),
  
  setPlayers: (players) => set({ players }),
  
  updatePlayer: (playerId, updates) => set((state) => ({
    players: state.players.map((p) =>
      p.id === playerId ? { ...p, ...updates } : p
    ),
  })),
  
  addPlayer: (player) => set((state) => ({
    players: [...state.players, player],
  })),
  
  removePlayer: (playerId) => set((state) => ({
    players: state.players.filter((p) => p.id !== playerId),
  })),
  
  hideRoleModal: () => set({ showRoleModal: false }),
  
  addNotification: (message, type = 'info') => set((state) => ({
    notifications: [
      ...state.notifications,
      { id: Date.now(), message, type, timestamp: new Date() },
    ],
  })),
  
  removeNotification: (id) => set((state) => ({
    notifications: state.notifications.filter((n) => n.id !== id),
  })),
  
  clearNotifications: () => set({ notifications: [] }),
  
  reset: () => set({
    room: null,
    roomCode: null,
    player: null,
    playerToken: null,
    adminToken: null,
    gameState: null,
    players: [],
    showRoleModal: false,
    notifications: [],
  }),
  
  // Getters
  isAdmin: () => {
    const state = get();
    return !!state.adminToken;
  },
  
  isAlive: () => {
    const state = get();
    return state.player?.is_alive ?? false;
  },
  
  isLeader: () => {
    const state = get();
    return state.player?.is_leader ?? false;
  },
  
  getAlivePlayers: () => {
    const state = get();
    return state.players.filter((p) => p.is_alive);
  },
  
  getDeadPlayers: () => {
    const state = get();
    return state.players.filter((p) => !p.is_alive);
  },
}));
