import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticatedRequest, JWTPayload, AppError } from '../types';
import prisma from '../utils/prisma';

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;

    // Get token from header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Check if token exists
    if (!token) {
      throw createError('Access denied. No token provided.', 401);
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        userType: true,
        isVerified: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      throw createError('Token is not valid. User not found.', 401);
    }

    if (!user.isActive) {
      throw createError('Account is deactivated.', 401);
    }

    // Add user to request object
    req.user = user as any;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(createError('Invalid token.', 401));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(createError('Token expired.', 401));
    } else {
      next(error);
    }
  }
};

// Middleware to check user roles
export const authorize = (...roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw createError('Access denied. User not authenticated.', 401);
    }

    if (!roles.includes(req.user.userType)) {
      throw createError('Access denied. Insufficient permissions.', 403);
    }

    next();
  };
};

// Middleware to check if user is verified
export const requireVerification = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    throw createError('Access denied. User not authenticated.', 401);
  }

  if (!req.user.isVerified) {
    throw createError('Account verification required.', 403);
  }

  next();
};

// Helper function to create errors
const createError = (message: string, statusCode: number): AppError => {
  const error = new Error(message) as AppError;
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
};

