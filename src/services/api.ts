const API_BASE_URL = 'http://localhost:3000/api';

export interface CreateAvatarRequest {
  prompt: string;
}

export interface Avatar {
  name: string;
  appearance: string;
  imageUrl?: string;
}

export interface CreateAvatarResponse {
  success: boolean;
  avatar: Avatar;
  originalPrompt: string;
  rawResponse?: string;
  imageUrl?: string;
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