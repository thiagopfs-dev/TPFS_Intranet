export type UserRole = 'admin' | 'editor' | 'user';

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  displayName: string;
}

export interface Shortcut {
  id: string;
  title: string;
  iconUrl: string;
  link: string;
  category: string;
  order?: number;
}

export interface Category {
  name: string;
  shortcuts: Shortcut[];
}

export interface NewsItem {
  id: string;
  title: string;
  content: string;
  date: string;
  imageUrl?: string;
}

export interface SGQDocument {
  id: string;
  title: string;
  code: string;
  version: string;
  url: string;
  category: string;
}

export interface Article {
  id: string;
  title: string;
  summary: string;
  content: string;
  author: string;
  date: string;
}

export interface HospitalEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
}
