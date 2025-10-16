import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import { generateToken, generateRefreshToken } from '../utils/jwt';
import { ApiResponse, UserRegistrationData, UserLoginData, AuthResponse } from '../types';
import { createError } from '../middleware/errorHandler';
import prisma from '../utils/prisma';

// Validation rules
export const registerValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('userType')
    .isIn(['CLIENT', 'FREELANCER'])
    .withMessage('User type must be either CLIENT or FREELANCER')
];

export const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// Register new user
export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const response: ApiResponse = {
        success: false,
        message: 'Validation failed',
        errors: errors.array().reduce((acc, error) => {
          if (error.type === 'field') {
            acc[error.path] = [error.msg];
          }
          return acc;
        }, {} as Record<string, string[]>)
      };
      res.status(400).json(response);
      return;
    }

    const { email, password, firstName, lastName, userType }: UserRegistrationData = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      const response: ApiResponse = {
        success: false,
        message: 'User with this email already exists'
      };
      res.status(400).json(response);
      return;
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        userType,
        isVerified: false,
        isActive: true
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        userType: true,
        isVerified: true,
        createdAt: true
      }
    });

    // Create user profile if freelancer
    if (userType === 'FREELANCER') {
      await prisma.userProfile.create({
        data: {
          userId: user.id,
          skills: [],
          languages: []
        }
      });
    }

    // Generate tokens
    const token = generateToken({
      userId: user.id,
      email: user.email,
      userType: user.userType
    });

    const refreshToken = generateRefreshToken({
      userId: user.id,
      email: user.email,
      userType: user.userType
    });

    const response: AuthResponse = {
      success: true,
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        userType: user.userType,
        isVerified: user.isVerified
      },
      token,
      refreshToken
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
};

// Login user
export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const response: ApiResponse = {
        success: false,
        message: 'Validation failed',
        errors: errors.array().reduce((acc, error) => {
          if (error.type === 'field') {
            acc[error.path] = [error.msg];
          }
          return acc;
        }, {} as Record<string, string[]>)
      };
      res.status(400).json(response);
      return;
    }

    const { email, password }: UserLoginData = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        firstName: true,
        lastName: true,
        userType: true,
        isVerified: true,
        isActive: true
      }
    });

    if (!user) {
      const response: ApiResponse = {
        success: false,
        message: 'Invalid email or password'
      };
      res.status(401).json(response);
      return;
    }

    // Check if user is active
    if (!user.isActive) {
      const response: ApiResponse = {
        success: false,
        message: 'Account is deactivated'
      };
      res.status(401).json(response);
      return;
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      const response: ApiResponse = {
        success: false,
        message: 'Invalid email or password'
      };
      res.status(401).json(response);
      return;
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    // Generate tokens
    const token = generateToken({
      userId: user.id,
      email: user.email,
      userType: user.userType
    });

    const refreshToken = generateRefreshToken({
      userId: user.id,
      email: user.email,
      userType: user.userType
    });

    const response: AuthResponse = {
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        userType: user.userType,
        isVerified: user.isVerified
      },
      token,
      refreshToken
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

// Get current user
export const getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = (req as any).user;

    const response: ApiResponse = {
      success: true,
      message: 'User retrieved successfully',
      data: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        userType: user.userType,
        isVerified: user.isVerified,
        createdAt: user.createdAt
      }
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

// Logout user (client-side token removal)
export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const response: ApiResponse = {
      success: true,
      message: 'Logout successful'
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};
