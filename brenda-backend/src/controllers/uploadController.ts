import { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { ApiResponse, AuthenticatedRequest } from '../types';
import prisma from '../utils/prisma';

// Upload avatar
export const uploadAvatar = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.file) {
      const response: ApiResponse = {
        success: false,
        message: 'No file uploaded'
      };
      res.status(400).json(response);
      return;
    }

    const userId = req.user!.id;
    const file = req.file;

    // Generate public URL (in production, this would be a CDN URL)
    const publicUrl = `/uploads/avatars/${file.filename}`;

    // Update user's avatar in database
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { avatar: publicUrl },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        userType: true
      }
    });

    const response: ApiResponse = {
      success: true,
      message: 'Avatar uploaded successfully',
      data: {
        url: publicUrl,
        user: updatedUser
      }
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

// Remove avatar
export const removeAvatar = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;

    // Get current user to find avatar path
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatar: true }
    });

    // Delete file from filesystem if it exists
    if (user?.avatar) {
      const filePath = path.join(__dirname, '../../uploads', user.avatar);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // Update user's avatar to null in database
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { avatar: null },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        userType: true
      }
    });

    const response: ApiResponse = {
      success: true,
      message: 'Avatar removed successfully',
      data: {
        user: updatedUser
      }
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

// Serve uploaded files
export const serveFile = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const filePath = path.join(__dirname, '../../uploads', req.params.filename);
    
    if (!fs.existsSync(filePath)) {
      res.status(404).json({
        success: false,
        message: 'File not found'
      });
      return;
    }

    // Set appropriate headers
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    
    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    next(error);
  }
};


