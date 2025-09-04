import AsyncStorage from '@react-native-async-storage/async-storage';

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

export interface VideoJob {
  id: string;
  userId: string;
  sceneData: Scene;
  audioUrl: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed' | 'cancelled';
  videoUrl?: string;
  duration?: number;
  error?: string;
  createdAt: string;
  completedAt?: string;
  updatedAt: string;
}

export interface VideoGenerationResponse {
  success: boolean;
  jobId?: string;
  status?: string;
  message?: string;
  estimatedTime?: string;
  error?: string;
}

export interface UserJobsResponse {
  success: boolean;
  jobs: VideoJob[];
  jobsByStatus: {
    pending: VideoJob[];
    'in-progress': VideoJob[];
    completed: VideoJob[];
    failed: VideoJob[];
  };
  total: number;
  user: {
    id: string;
    email: string;
  };
  error?: string;
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  try {
    const session = await AsyncStorage.getItem('supabase.auth.token');
    if (session) {
      const sessionData = JSON.parse(session);
      if (sessionData.access_token) {
        headers['Authorization'] = `Bearer ${sessionData.access_token}`;
      }
    }
  } catch (error) {
    console.error('Error getting auth headers:', error);
  }

  return headers;
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

  async saveAvatar(imageUrl: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/save-avatar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageUrl }),
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

  async generateVideo(sceneData: Scene, audioUrl: string): Promise<VideoGenerationResponse> {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${API_BASE_URL}/video/generate`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ 
        sceneData,
        audioUrl 
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  async getVideoJobStatus(jobId: string): Promise<{ success: boolean; job?: VideoJob; error?: string }> {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${API_BASE_URL}/video/job/${jobId}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  async getUserVideoJobs(): Promise<UserJobsResponse> {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${API_BASE_URL}/video/user-jobs`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  async cancelVideoJob(jobId: string): Promise<{ success: boolean; message?: string; error?: string }> {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${API_BASE_URL}/video/job/${jobId}/cancel`, {
      method: 'POST',
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  async deleteVideoJob(jobId: string): Promise<{ success: boolean; message?: string; error?: string }> {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${API_BASE_URL}/video/job/${jobId}`, {
      method: 'DELETE',
      headers,
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