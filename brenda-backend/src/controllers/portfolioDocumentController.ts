import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, ApiResponse } from '../types';
import prisma from '../utils/prisma';
import { uploadPortfolioDocument, deleteCloudinaryAsset } from '../services/cloudinaryService';

export const uploadDocument = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
      return;
    }

    const userId = req.user!.id;
    const { portfolioItemId, title } = req.body as { portfolioItemId?: string; title?: string };

    if (portfolioItemId) {
      const portfolioItem = await prisma.portfolioItem.findFirst({
        where: {
          id: portfolioItemId,
          userId
        },
        select: { id: true }
      });

      if (!portfolioItem) {
        res.status(404).json({
          success: false,
          message: 'Portfolio item not found'
        });
        return;
      }
    }

    const fileBuffer = req.file.buffer;
    const filename = req.file.originalname;

    const uploadResult = await uploadPortfolioDocument(fileBuffer, filename);

    const document = await prisma.portfolioDocument.create({
      data: {
        userId,
        portfolioItemId: portfolioItemId || null,
        name: title || filename,
        url: uploadResult.url,
        secureUrl: uploadResult.secureUrl,
        publicId: uploadResult.publicId,
        format: uploadResult.format,
        bytes: uploadResult.bytes,
        resourceType: uploadResult.resourceType
      }
    });

    const response: ApiResponse = {
      success: true,
      message: 'Document uploaded successfully',
      data: document
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
};

export const listDocuments = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { portfolioItemId } = req.query;

    const documents = await prisma.portfolioDocument.findMany({
      where: {
        userId,
        ...(portfolioItemId ? { portfolioItemId: portfolioItemId as string } : {})
      },
      orderBy: { createdAt: 'desc' }
    });

    const response: ApiResponse = {
      success: true,
      message: 'Documents retrieved successfully',
      data: documents
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const deleteDocument = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const document = await prisma.portfolioDocument.findFirst({
      where: {
        id,
        userId
      }
    });

    if (!document) {
      res.status(404).json({
        success: false,
        message: 'Document not found'
      });
      return;
    }

    await deleteCloudinaryAsset(document.publicId, document.resourceType as 'image' | 'video' | 'raw' | 'auto');

    await prisma.portfolioDocument.delete({
      where: { id }
    });

    const response: ApiResponse = {
      success: true,
      message: 'Document deleted successfully'
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

