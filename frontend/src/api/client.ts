import axios from 'axios';
import store from 'src/store';
import { selectToken } from 'src/store/slice/authSlice';

const client = axios.create({
  baseURL: '/api',
});

// Injecte automatiquement le token JWT depuis le store (source de vérité unique).
// L'intercepteur s'exécute à chaque requête : le store est déjà initialisé à ce moment.
client.interceptors.request.use((config) => {
  const token = selectToken(store.getState());
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default client;
