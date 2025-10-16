import { Request } from 'express';
import { User } from '@prisma/client';

// Extend Express Request to include user
export interface AuthenticatedRequest extends Request {
  user?: User;
}

// User types
export interface UserRegistrationData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  userType: 'CLIENT' | 'FREELANCER';
}

export interface UserLoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    userType: string;
    isVerified: boolean;
  };
  token?: string;
  refreshToken?: string;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  errors?: Record<string, string[]>;
}

// JWT Payload
export interface JWTPayload {
  userId: string;
  email: string;
  userType: string;
  iat?: number;
  exp?: number;
}

// Error types
export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

// Validation types
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

// Pagination types
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

