import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface VideoStatusUpdate {
  jobId: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed' | 'cancelled';
  message?: string;
  progress?: number;
  videoUrl?: string;
  duration?: number;
  error?: string;
}

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, (data: VideoStatusUpdate) => void> = new Map();

  connect() {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io('http://localhost:3000', {
      transports: ['websocket'],
      timeout: 5000,
    });

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
      this.authenticateUser();
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    this.socket.on('authenticated', (data) => {
      console.log('Socket authenticated:', data);
    });

    this.socket.on('videoStatusUpdate', (data: VideoStatusUpdate) => {
      console.log('Video status update:', data);
      
      // Notify all listeners
      this.listeners.forEach((callback) => {
        callback(data);
      });
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });
  }

  private async authenticateUser() {
    try {
      const userStr = await AsyncStorage.getItem('user');
      if (userStr && this.socket) {
        const user = JSON.parse(userStr);
        this.socket.emit('authenticate', { userId: user.id });
      }
    } catch (error) {
      console.error('Failed to authenticate socket:', error);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.listeners.clear();
  }

  addVideoStatusListener(id: string, callback: (data: VideoStatusUpdate) => void) {
    this.listeners.set(id, callback);
  }

  removeVideoStatusListener(id: string) {
    this.listeners.delete(id);
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const socketService = new SocketService();
