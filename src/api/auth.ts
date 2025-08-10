const API_BASE_URL = 'http://localhost:3001/api/users';

export interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  createdAt: string;
  lastLogin: string | null;
  isActive: boolean;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  role?: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

export interface UpdateProfileRequest {
  username?: string;
  email?: string;
  currentPassword?: string;
  newPassword?: string;
}

// Login user
export async function loginUser(credentials: LoginRequest): Promise<AuthResponse> {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }

    const data = await response.json();
    
    // Store token in localStorage
    localStorage.setItem('authToken', data.token);
    localStorage.setItem('currentUser', JSON.stringify(data.user));
    
    return data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}

// Register new user
export async function registerUser(userData: RegisterRequest): Promise<AuthResponse> {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}`${API_BASE_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Registration failed');
    }

    const data = await response.json();
    
    // Store token in localStorage
    localStorage.setItem('authToken', data.token);
    localStorage.setItem('currentUser', JSON.stringify(data.user));
    
    return data;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
}

// Verify token and get current user
export async function verifyToken(): Promise<User | null> {
  try {
    const token = localStorage.getItem('authToken');
    if (!token) {
      return null;
    }

    const response = await fetch(`${import.meta.env.VITE_API_URL}`${API_BASE_URL}/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      // Token is invalid, clear it
      localStorage.removeItem('authToken');
      localStorage.removeItem('currentUser');
      return null;
    }

    const data = await response.json();
    
    // Update stored user data
    localStorage.setItem('currentUser', JSON.stringify(data.user));
    
    return data.user;
  } catch (error) {
    console.error('Token verification error:', error);
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    return null;
  }
}

// Get user profile
export async function getUserProfile(): Promise<User> {
  try {
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${import.meta.env.VITE_API_URL}`${API_BASE_URL}/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get profile');
    }

    const data = await response.json();
    
    // Update stored user data
    localStorage.setItem('currentUser', JSON.stringify(data.user));
    
    return data.user;
  } catch (error) {
    console.error('Get profile error:', error);
    throw error;
  }
}

// Update user profile
export async function updateUserProfile(updates: UpdateProfileRequest): Promise<User> {
  try {
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${import.meta.env.VITE_API_URL}`${API_BASE_URL}/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update profile');
    }

    const data = await response.json();
    
    // Update stored user data
    localStorage.setItem('currentUser', JSON.stringify(data.user));
    
    return data.user;
  } catch (error) {
    console.error('Update profile error:', error);
    throw error;
  }
}

// Logout user
export function logoutUser(): void {
  localStorage.removeItem('authToken');
  localStorage.removeItem('currentUser');
}

// Get current user from localStorage
export function getCurrentUser(): User | null {
  try {
    const userData = localStorage.getItem('currentUser');
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

// Check if user is authenticated
export function isAuthenticated(): boolean {
  const token = localStorage.getItem('authToken');
  const user = getCurrentUser();
  return !!(token && user);
}

// Check if user has admin role
export function isAdmin(): boolean {
  const user = getCurrentUser();
  return user?.role === 'admin';
}
