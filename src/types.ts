export type UserRole = string;

export interface Permissions {
  shortcuts: boolean;
  news: boolean;
  sgq: boolean;
  articles: boolean;
  events: boolean;
  ramais: boolean;
  users: boolean;
  settings: boolean;
  roles: boolean;
  categories: boolean;
}

export interface Role {
  name: string;
  permissions: Permissions;
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  role: string;
  displayName: string;
  permissions?: Permissions;
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
  category: 'MANUAL' | 'POP' | 'INSTRUÇÃO' | 'FORMULÁRIO' | string;
  version: string;
  url: string;
  date: string;
}

export interface Article {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  date: string;
  category: string;
}

export interface HospitalEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  category: string;
}

export interface PhoneExtension {
  id: string;
  name: string;
  number: string;
  department: string;
}
