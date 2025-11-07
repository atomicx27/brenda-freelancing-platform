import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { AuthenticatedRequest } from '../types';

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req: AuthenticatedRequest, file, cb) => {
    const uploadPath = path.join(uploadsDir, 'avatars');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req: AuthenticatedRequest, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${req.user?.id || 'unknown'}-${uniqueSuffix}${ext}`);
  }
});

// File filter
const fileFilter = (req: AuthenticatedRequest, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Check file type
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'));
  }
};

// Configure multer
export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: fileFilter
});

// Portfolio document uploads (PDF, docs, etc.)
const documentStorage = multer.memoryStorage();

const allowedDocumentMimeTypes = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain'
]);

const documentFileFilter = (req: AuthenticatedRequest, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (allowedDocumentMimeTypes.has(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported document type.'));
  }
};

const defaultDocumentLimitMb = 25;
const envDocumentLimit = process.env.PORTFOLIO_DOCUMENT_MAX_MB;
const parsedDocumentLimit = envDocumentLimit ? parseInt(envDocumentLimit, 10) : defaultDocumentLimitMb;
const documentLimitMb = Number.isFinite(parsedDocumentLimit) && parsedDocumentLimit > 0 ? parsedDocumentLimit : defaultDocumentLimitMb;

export const documentUpload = multer({
  storage: documentStorage,
  limits: {
    fileSize: documentLimitMb * 1024 * 1024
  },
  fileFilter: documentFileFilter
});

// Resume uploads (PDF only)
const resumeStorage = multer.memoryStorage();
const RESUME_DEFAULT_LIMIT_MB = process.env.RESUME_MAX_MB ? parseInt(process.env.RESUME_MAX_MB, 10) : 10;
const resumeLimitMb = Number.isFinite(RESUME_DEFAULT_LIMIT_MB) && RESUME_DEFAULT_LIMIT_MB > 0 ? RESUME_DEFAULT_LIMIT_MB : 10;

const resumeFileFilter = (req: AuthenticatedRequest, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF resumes are allowed.'));
  }
};

export const resumeUpload = multer({
  storage: resumeStorage,
  limits: {
    fileSize: resumeLimitMb * 1024 * 1024
  },
  fileFilter: resumeFileFilter
});

// Error handler for multer
export const handleUploadError = (error: any, req: any, res: any, next: any) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Please upload a smaller file.'
      });
    }
  }
  
  if (error.message === 'Only image files are allowed!') {
    return res.status(400).json({
      success: false,
      message: 'Only image files are allowed!'
    });
  }

  if (error.message === 'Unsupported document type.') {
    return res.status(400).json({
      success: false,
      message: 'Unsupported document type. Allowed formats: PDF, Word, PowerPoint, Excel, Text.'
    });
  }

  if (error.message === 'Only PDF resumes are allowed.') {
    return res.status(400).json({
      success: false,
      message: 'Only PDF resumes are allowed.'
    });
  }
  
  next(error);
};
