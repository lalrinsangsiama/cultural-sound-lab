// API client utilities for Cultural Sound Lab

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const error: ApiError = {
          message: `HTTP error! status: ${response.status}`,
          status: response.status,
        };
        
        try {
          const errorData = await response.json();
          error.message = errorData.message || error.message;
          error.code = errorData.code;
        } catch {
          // If response is not JSON, use the default error message
        }
        
        throw error;
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      
      throw new Error("An unknown error occurred");
    }
  }

  // Authentication endpoints
  async login(email: string, password: string) {
    return this.request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }

  async register(userData: {
    name: string;
    email: string;
    password: string;
    culturalAffiliation?: string;
  }) {
    return this.request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  }

  async logout() {
    return this.request("/api/auth/logout", {
      method: "POST",
    });
  }

  // Audio library endpoints
  async getAudioSamples(filters?: {
    culture?: string;
    instrument?: string;
    search?: string;
  }) {
    const params = new URLSearchParams();
    if (filters?.culture) params.append("culture", filters.culture);
    if (filters?.instrument) params.append("instrument", filters.instrument);
    if (filters?.search) params.append("search", filters.search);

    const query = params.toString() ? `?${params.toString()}` : "";
    return this.request(`/api/audio/samples${query}`);
  }

  async getAudioSample(id: string) {
    return this.request(`/api/audio/samples/${id}`);
  }

  async getAudioPreview(id: string) {
    return this.request(`/api/audio/preview/${id}`);
  }

  // Generation endpoints
  async generateAudio(params: {
    type: 'sound_logo' | 'playlist' | 'social_clip' | 'long_form';
    parameters: {
      duration?: number;
      mood?: string;
      energy_level?: number;
      instruments?: string[];
      cultural_style?: string;
      tempo?: number;
      key?: string;
      description?: string;
      brand_name?: string;
      playlist_size?: number;
      video_description?: string;
    };
    source_samples: string[];
  }) {
    return this.request("/api/generate", {
      method: "POST",
      body: JSON.stringify(params),
    });
  }

  async getGeneration(id: string) {
    return this.request(`/api/generate/${id}`);
  }

  async getUserGenerations(filters?: {
    page?: number;
    limit?: number;
    type?: string;
    status?: string;
  }) {
    const params = new URLSearchParams();
    if (filters?.page) params.append("page", filters.page.toString());
    if (filters?.limit) params.append("limit", filters.limit.toString());
    if (filters?.type) params.append("type", filters.type);
    if (filters?.status) params.append("status", filters.status);

    const query = params.toString() ? `?${params.toString()}` : "";
    return this.request(`/api/generate${query}`);
  }

  async getJobStatus(jobId: string) {
    return this.request(`/api/generate/job/${jobId}/status`);
  }

  async downloadGeneration(id: string) {
    return this.request(`/api/generate/${id}/download`);
  }

  async deleteGeneration(id: string) {
    return this.request(`/api/generate/${id}`, {
      method: "DELETE",
    });
  }

  // Project endpoints
  async getProjects(status?: string) {
    const params = status ? `?status=${status}` : "";
    return this.request(`/api/projects${params}`);
  }

  async getProject(id: string) {
    return this.request(`/api/projects/${id}`);
  }

  async deleteProject(id: string) {
    return this.request(`/api/projects/${id}`, {
      method: "DELETE",
    });
  }

  // Licensing endpoints
  async createLicense(data: {
    generationId: string;
    type: string;
    usageDescription: string;
  }) {
    return this.request("/api/licenses", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getLicenses() {
    return this.request("/api/licenses");
  }

  async processPayment(data: {
    licenseId: string;
    paymentMethodId: string;
    amount: number;
  }) {
    return this.request("/api/payments", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Analytics endpoints
  async getEarnings(period?: string) {
    const params = period ? `?period=${period}` : "";
    return this.request(`/api/analytics/earnings${params}`);
  }

  async getUsageStats() {
    return this.request("/api/analytics/usage");
  }

  async getCulturalImpact() {
    return this.request("/api/analytics/cultural-impact");
  }

  // User settings endpoints
  async updateProfile(data: {
    name?: string;
    email?: string;
    culturalAffiliation?: string;
    bio?: string;
    location?: string;
  }) {
    return this.request("/api/user/profile", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async updateSettings(data: {
    notifications?: Record<string, boolean>;
    privacy?: Record<string, boolean>;
    generation?: Record<string, any>;
  }) {
    return this.request("/api/user/settings", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }
}

// Export a default instance
export const apiClient = new ApiClient();

// Helper functions for common operations
export const auth = {
  login: (email: string, password: string) => apiClient.login(email, password),
  register: (userData: any) => apiClient.register(userData),
  logout: () => apiClient.logout(),
};

export const audio = {
  getSamples: (filters?: any) => apiClient.getAudioSamples(filters),
  getSample: (id: string) => apiClient.getAudioSample(id),
  getPreview: (id: string) => apiClient.getAudioPreview(id),
};

export const generation = {
  create: (params: any) => apiClient.generateAudio(params),
  get: (id: string) => apiClient.getGeneration(id),
  getJobStatus: (jobId: string) => apiClient.getJobStatus(jobId),
  getUserGenerations: (filters?: any) => apiClient.getUserGenerations(filters),
  download: (id: string) => apiClient.downloadGeneration(id),
  delete: (id: string) => apiClient.deleteGeneration(id),
};