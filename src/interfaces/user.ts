import { UserRole } from './enums';

// User signup data interface
export interface UserSignupData {
  username: string;
  email: string;
  password: string;
  dob: string;
}

// Login request interface
export interface LoginRequest {
  username: string;
  password: string;
}

// Login response interface
export interface LoginResponse {
  user_id: string;
  username: string;
  avatar_url: string;
  token: string;
}

// User info interface (full user data)
export interface UserInfo {
  user_id: string;
  username: string;
  role: UserRole;
  avatar_url: string;
  created_at: string;
  dob: string;
  user_profile: string;
  bio?: string;
  email_verified: boolean;
  banned_until?: string;
  location?: any;
  interests?: string[];
  experience?: string[];
  available_days?: string[];
  languages?: string[];
  privacy: boolean;
}

// Public user info interface (for viewing other users)
export interface PublicUserInfo {
  username: string;
  role: string;
  avatar_url: string;
  user_profile: string;
  bio?: string;
  interests?: string[];
  experience?: string[];
  languages?: string[];
}

// Private user info interface (for private profiles)
export interface PrivateUserInfo {
  username: string;
  role: string;
  avatar_url: string;
}

// Update user profile request interface
export interface UpdateUserRequest {
  user_profile?: string;
  bio?: string;
  location?: any;
  interests?: string[];
  experience?: string[];
  available_days?: string[];
  languages?: string[];
  privacy?: boolean;
}

// Avatar upload response interface
export interface AvatarUploadResponse {
  avatar_url: string;
}

// API response wrapper interface
export interface ApiResponse<T> {
  data: T;
  status: number;
  statusText: string;
} 