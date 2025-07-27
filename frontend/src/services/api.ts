import { User, Period, Settings, Prediction, Cycle } from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

interface PeriodResponse {
  periods: Period[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

class ApiClient {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    // Load tokens from localStorage
    this.accessToken = localStorage.getItem('accessToken');
    this.refreshToken = localStorage.getItem('refreshToken');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new ApiError(response.status, error.error?.message || 'Request failed');
    }

    return response.json();
  }

  setTokens(accessToken: string, refreshToken: string) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  }

  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  // Auth endpoints
  async register(email: string, password: string, name?: string): Promise<AuthResponse> {
    const response = await this.request<{ message: string } & AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
    
    this.setTokens(response.accessToken, response.refreshToken);
    return response;
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await this.request<{ message: string } & AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    this.setTokens(response.accessToken, response.refreshToken);
    return response;
  }

  async logout(): Promise<void> {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } finally {
      this.clearTokens();
    }
  }

  async refreshAccessToken(): Promise<void> {
    const response = await this.request<{ accessToken: string; refreshToken: string }>('/auth/refresh', {
      method: 'POST',
    });
    
    this.setTokens(response.accessToken, response.refreshToken);
  }

  async getCurrentUser(): Promise<User> {
    const response = await this.request<{ user: User }>('/auth/me');
    return response.user;
  }

  // Period endpoints
  async createPeriod(data: {
    startDate: string;
    endDate?: string;
    flowIntensity?: string;
    symptoms?: string[];
    notes?: string;
  }): Promise<Period> {
    const response = await this.request<{ message: string; period: Period }>('/periods', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    return response.period;
  }

  async updatePeriod(
    id: string,
    data: Partial<{
      startDate: string;
      endDate: string;
      flowIntensity: string;
      symptoms: string[];
      notes: string;
    }>
  ): Promise<Period> {
    const response = await this.request<{ message: string; period: Period }>(`/periods/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    
    return response.period;
  }

  async deletePeriod(id: string): Promise<void> {
    await this.request(`/periods/${id}`, { method: 'DELETE' });
  }

  async getPeriods(options?: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<PeriodResponse> {
    const params = new URLSearchParams();
    if (options?.page) params.append('page', options.page.toString());
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.startDate) params.append('startDate', options.startDate);
    if (options?.endDate) params.append('endDate', options.endDate);
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request<PeriodResponse>(`/periods${query}`);
  }

  async getCurrentPeriod(): Promise<Period | null> {
    try {
      const response = await this.request<{ period: Period }>('/periods/current');
      return response.period;
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  // Prediction endpoints
  async getPredictions(): Promise<Prediction[]> {
    const response = await this.request<{ predictions: Prediction[] }>('/predictions');
    return response.predictions;
  }

  async generatePredictions(): Promise<Prediction[]> {
    const response = await this.request<{ predictions: Prediction[] }>('/predictions/generate', {
      method: 'POST',
    });
    return response.predictions;
  }
}

export const apiClient = new ApiClient();
export { ApiError };