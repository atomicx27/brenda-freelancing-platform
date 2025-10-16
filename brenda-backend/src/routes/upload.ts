import express from 'express';
import { upload, handleUploadError } from '../middleware/upload';
import { uploadAvatar, removeAvatar, serveFile } from '../controllers/uploadController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// All upload routes require authentication
router.use(authenticate);

// Upload avatar
router.post('/avatar', upload.single('file'), handleUploadError, uploadAvatar);

// Remove avatar
router.delete('/avatar', removeAvatar);

// Serve uploaded files
router.get('/:filename', serveFile);

export default router;


