const API_BASE_URL = 'http://localhost:3000/api';

export interface CreateAvatarRequest {
  prompt: string;
}

export interface Avatar {
  id: number;
  name: string;
  appearance: string;
  imageUrl?: string;
  variation: number;
  error?: string;
}

export interface Scene {
  id: number;
  name: string;
  description: string;
  imageUrl?: string;
  originalAvatarUrl: string;
  error?: string;
}

export interface CreateAvatarResponse {
  success: boolean;
  avatars: Avatar[];
  originalPrompt: string;
  totalGenerated: number;
  totalRequested: number;
}

export interface CreateScenesResponse {
  success: boolean;
  scenes: Scene[];
  originalAvatarUrl: string;
  totalGenerated: number;
  totalRequested: number;
}

export interface HealthResponse {
  status: string;
  message: string;
  timestamp: string;
  sdk: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: any;
  session?: any;
}

export interface TTSOptions {
  voice?: string;
  stability?: number;
  similarity_boost?: number;
  speed?: number;
  timestamps?: boolean;
}

export interface TTSResponse {
  success: boolean;
  audioUrl?: string;
  timestamps?: any[];
  requestId?: string;
  error?: string;
}

export const apiService = {
  async createAvatar(prompt: string): Promise<CreateAvatarResponse> {
    const response = await fetch(`${API_BASE_URL}/create-avatar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  async createScenes(avatarUrl: string): Promise<CreateScenesResponse> {
    const response = await fetch(`${API_BASE_URL}/create-scenes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ avatarUrl }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  async generateSpeech(text: string, options?: TTSOptions): Promise<TTSResponse> {
    const response = await fetch(`${API_BASE_URL}/tts/generate-speech`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        text, 
        ...options 
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  async healthCheck(): Promise<HealthResponse> {
    const response = await fetch(`${API_BASE_URL}/health`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  async testReplicate(): Promise<{ success: boolean; message: string; response: string; imageUrl?: string }> {
    const response = await fetch(`${API_BASE_URL}/test-replicate`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  async testNanoBanana(): Promise<{ success: boolean; message: string; response: string; imageUrl?: string }> {
    const response = await fetch(`${API_BASE_URL}/test-nano-banana`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  async signUp(email: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  async signIn(email: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/signin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  async signOut(): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/signout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  },
};