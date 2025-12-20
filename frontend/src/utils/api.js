import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const userStr = localStorage.getItem('user');
    let token = localStorage.getItem('token');
    if (userStr && !token) {
      try {
        const user = JSON.parse(userStr);
        if (user.token) token = user.token;
      } catch (e) {}
    }
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Auth
export const login = (data) => api.post('/auth/login', data);
export const register = (data) => api.post('/auth/register', data);

// Game
export const createRoom = (userId) => api.post('/game/create', { userId });
export const startGame = (roomId) => api.post('/game/start', { roomId });
export const submitCode = (data) => api.post('/game/submit', data);
export const runCode = (data) => api.post('/game/run', data);

// User
export const getUserProfile = (id) => api.get(`/users/${id}`);
export const updateUserProfile = (data) => api.put('/users/update', data);

// --- NEW: AI Analysis ---
export const analyzeCode = (data) => api.post('/ai/analyze', data);

export default api;