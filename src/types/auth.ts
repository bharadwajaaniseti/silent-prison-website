export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'member' | 'guest';
  joinDate: string;
  lastActive: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface Chapter {
  id: string;
  title: string;
  volume: string;
  content: string;
  publishDate: string;
  isPublished: boolean;
  memberOnly: boolean;
  views: number;
  pdfFile?: string;
  pdfSize?: number;
}

export interface LoreEntry {
  id: string;
  category: string;
  title: string;
  summary: string;
  content: string;
  tags: string[];
  publishDate: string;
  isPublished: boolean;
}

export interface SiteStats {
  totalViews: number;
  dailyViews: number;
  totalUsers: number;
  totalChapters: number;
  totalLore: number;
  memberCount: number;
}