const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Helper function for API calls with timeout and retry support
async function apiCall(endpoint: string, options: RequestInit = {}, timeout = 60000) {
  const token = localStorage.getItem('token');
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'An error occurred' }));
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    
    // Better error messages for common issues
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout - backend may be waking up, please retry in a moment');
    }
    throw error;
  }
}

// Auth API
export const authAPI = {
  register: (data: { email: string; password: string; name: string; phone?: string }) =>
    apiCall('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  login: (data: { email: string; password: string }) =>
    apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// Alerts API
export const alertsAPI = {
  getAll: (params?: { severity?: string; type?: string; limit?: number; includeDisabled?: string }) => {
    // Filter out undefined values
    const filteredParams = Object.entries(params || {})
      .filter(([_, value]) => value !== undefined)
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const queryParams = new URLSearchParams(filteredParams as any).toString();
    return apiCall(`/alerts${queryParams ? `?${queryParams}` : ''}`);
  },

  getNearby: (longitude: number, latitude: number, radius?: number) => {
    const params = new URLSearchParams({
      longitude: longitude.toString(),
      latitude: latitude.toString(),
      ...(radius && { radius: radius.toString() }),
    });
    return apiCall(`/alerts/nearby?${params}`);
  },

  getById: (id: string) => apiCall(`/alerts/${id}`),

  create: (data: any) =>
    apiCall('/alerts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: any) =>
    apiCall(`/alerts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiCall(`/alerts/${id}`, {
      method: 'DELETE',
    }),

  toggleNotifications: (id: string, enabled: boolean) =>
    apiCall(`/alerts/${id}/notifications`, {
      method: 'PATCH',
      body: JSON.stringify({ enabled }),
    }),
};

// Reports API
export const reportsAPI = {
  getAll: (params?: { status?: string; type?: string; severity?: string; limit?: number }) => {
    const queryParams = new URLSearchParams(params as any).toString();
    return apiCall(`/reports${queryParams ? `?${queryParams}` : ''}`);
  },

  getNearby: (longitude: number, latitude: number, radius?: number) => {
    const params = new URLSearchParams({
      longitude: longitude.toString(),
      latitude: latitude.toString(),
      ...(radius && { radius: radius.toString() }),
    });
    return apiCall(`/reports/nearby?${params}`);
  },

  getMyReports: () => apiCall('/reports/my-reports'),

  create: (data: any) =>
    apiCall('/reports', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateStatus: (id: string, data: { status: string; verified?: boolean; responseMessage?: string }) =>
    apiCall(`/reports/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  upvote: (id: string) =>
    apiCall(`/reports/${id}/upvote`, {
      method: 'POST',
    }),
};

// Resources API
export const resourcesAPI = {
  getAll: (params?: { type?: string; availability?: string; limit?: number }) => {
    // Filter out undefined values to avoid sending "undefined" as a string
    const filteredParams = Object.entries(params || {})
      .filter(([_, value]) => value !== undefined)
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const queryParams = new URLSearchParams(filteredParams as any).toString();
    return apiCall(`/resources${queryParams ? `?${queryParams}` : ''}`);
  },

  getNearby: (longitude: number, latitude: number, radius?: number, type?: string) => {
    const params = new URLSearchParams({
      longitude: longitude.toString(),
      latitude: latitude.toString(),
      ...(radius && { radius: radius.toString() }),
      ...(type && { type }),
    });
    return apiCall(`/resources/nearby?${params}`);
  },

  getById: (id: string) => apiCall(`/resources/${id}`),

  create: (data: any) =>
    apiCall('/resources', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Suggest resource (for regular authenticated users)
  suggest: (data: any) =>
    apiCall('/resources/suggest', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: any) =>
    apiCall(`/resources/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiCall(`/resources/${id}`, {
      method: 'DELETE',
    }),
};

// Evacuation API
export const evacuationAPI = {
  getAll: (params?: { status?: string; active?: boolean }) => {
    const queryParams = new URLSearchParams(params as any).toString();
    return apiCall(`/evacuation${queryParams ? `?${queryParams}` : ''}`);
  },

  getFrom: (longitude: number, latitude: number, radius?: number) => {
    const params = new URLSearchParams({
      longitude: longitude.toString(),
      latitude: latitude.toString(),
      ...(radius && { radius: radius.toString() }),
    });
    return apiCall(`/evacuation/from?${params}`);
  },

  getById: (id: string) => apiCall(`/evacuation/${id}`),

  create: (data: any) =>
    apiCall('/evacuation', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: any) =>
    apiCall(`/evacuation/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiCall(`/evacuation/${id}`, {
      method: 'DELETE',
    }),
};

// Users API
export const usersAPI = {
  getMe: () => apiCall('/users/me'),

  updateMe: (data: any) =>
    apiCall('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  updateLocation: (longitude: number, latitude: number, address?: string) =>
    apiCall('/users/me/location', {
      method: 'PATCH',
      body: JSON.stringify({ longitude, latitude, address }),
    }),

  getNearby: (radius?: number) => {
    const params = radius ? `?radius=${radius}` : '';
    return apiCall(`/users/nearby${params}`);
  },
};

// Community API
export const communityAPI = {
  getAll: (params?: { category?: string; status?: string; limit?: number }) => {
    const queryParams = new URLSearchParams(params as any).toString();
    return apiCall(`/community${queryParams ? `?${queryParams}` : ''}`);
  },

  getNearby: (longitude: number, latitude: number, radius?: number) => {
    const params = new URLSearchParams({
      longitude: longitude.toString(),
      latitude: latitude.toString(),
      ...(radius && { radius: radius.toString() }),
    });
    return apiCall(`/community/nearby?${params}`);
  },

  create: (data: any) =>
    apiCall('/community', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: any) =>
    apiCall(`/community/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  like: (id: string) =>
    apiCall(`/community/${id}/like`, {
      method: 'POST',
    }),

  addComment: (id: string, content: string) =>
    apiCall(`/community/${id}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),

  delete: (id: string) =>
    apiCall(`/community/${id}`, {
      method: 'DELETE',
    }),

  comment: (id: string, data: { content: string }) =>
    apiCall(`/community/${id}/comments`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// Emergency Alerts API (public)
export const emergencyAlertsAPI = {
  getActive: () => apiCall('/emergency-alerts'),
};

// Admin API
export const adminAPI = {
  // Dashboard stats
  getStats: () => apiCall('/admin/stats'),

  // Users management
  getUsers: (params?: { role?: string; limit?: number; page?: number }) => {
    const queryParams = new URLSearchParams(params as Record<string, string>).toString();
    return apiCall(`/admin/users${queryParams ? `?${queryParams}` : ''}`);
  },

  // Sub-admin management
  createSubAdmin: (data: { email: string; password: string; name: string; phone?: string }) =>
    apiCall('/admin/subadmin', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  removeSubAdmin: (id: string) =>
    apiCall(`/admin/subadmin/${id}`, {
      method: 'DELETE',
    }),

  // Emergency alerts
  sendEmergencyAlert: (data: {
    title: string;
    message: string;
    severity: string;
    targetLocation: { coordinates: number[]; address?: string; city?: string; state?: string };
    affectedRadius: number;
    actionRequired: string;
    instructions?: string[];
    expiresAt?: string;
  }) =>
    apiCall('/admin/emergency-alert', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getEmergencyAlerts: (status?: string) => {
    const params = status ? `?status=${status}` : '';
    return apiCall(`/admin/emergency-alerts${params}`);
  },

  cancelEmergencyAlert: (id: string) =>
    apiCall(`/admin/emergency-alert/${id}/cancel`, {
      method: 'PATCH',
    }),

  // Community posts management
  getCommunityPosts: (params?: { limit?: number; page?: number }) => {
    const queryParams = new URLSearchParams(params as Record<string, string>).toString();
    return apiCall(`/admin/community-posts${queryParams ? `?${queryParams}` : ''}`);
  },

  createCommunityPost: (data: { title: string; content: string; category: string; location?: object }) =>
    apiCall('/admin/community-post', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  deleteCommunityPost: (id: string) =>
    apiCall(`/admin/community-post/${id}`, {
      method: 'DELETE',
    }),

  // Reports management
  getReports: (status?: string) => {
    const params = status ? `?status=${status}` : '';
    return apiCall(`/admin/reports${params}`);
  },

  updateReport: (id: string, data: { status?: string; verified?: boolean; response?: string }) =>
    apiCall(`/admin/report/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  // Resources management
  getResources: () => apiCall('/admin/resources'),

  // Activity log
  getActivity: () => apiCall('/admin/activity'),
};
