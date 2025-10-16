import { Request, Response, NextFunction } from 'express';
import { PrismaClientKnownRequestError, PrismaClientValidationError } from '@prisma/client/runtime/library';
import { AppError, ApiResponse } from '../types';

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let error = { ...err } as AppError;
  error.message = err.message;

  // Log error
  console.error('Error:', err);

  // Prisma errors
  if (err instanceof PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002':
        error.message = 'Duplicate field value entered';
        error.statusCode = 400;
        break;
      case 'P2014':
        error.message = 'Invalid ID provided';
        error.statusCode = 400;
        break;
      case 'P2003':
        error.message = 'Invalid input data';
        error.statusCode = 400;
        break;
      case 'P2025':
        error.message = 'Record not found';
        error.statusCode = 404;
        break;
      default:
        error.message = 'Database error occurred';
        error.statusCode = 500;
    }
  }

  // Prisma validation errors
  if (err instanceof PrismaClientValidationError) {
    error.message = 'Invalid data provided';
    error.statusCode = 400;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error.message = 'Invalid token';
    error.statusCode = 401;
  }

  if (err.name === 'TokenExpiredError') {
    error.message = 'Token expired';
    error.statusCode = 401;
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    error.message = 'Validation failed';
    error.statusCode = 400;
  }

  // Cast errors
  if (err.name === 'CastError') {
    error.message = 'Invalid ID format';
    error.statusCode = 400;
  }

  // Default error
  if (!error.statusCode) {
    error.statusCode = 500;
    error.message = 'Internal server error';
  }

  const response: ApiResponse = {
    success: false,
    message: error.message,
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  };

  res.status(error.statusCode).json(response);
};

export const createError = (message: string, statusCode: number = 500): AppError => {
  const error = new Error(message) as AppError;
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
};