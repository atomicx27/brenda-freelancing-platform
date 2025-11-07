import { v2 as cloudinary, UploadApiErrorResponse, UploadApiResponse } from 'cloudinary';

const DEFAULT_PORTFOLIO_FOLDER = 'brenda/portfolio';
const DEFAULT_RESUME_FOLDER = 'brenda/resumes';

const configured = Boolean(process.env.CLOUDINARY_URL);

if (configured) {
  cloudinary.config({
    secure: true,
    url: process.env.CLOUDINARY_URL
  });
} else {
  console.warn('⚠️  CLOUDINARY_URL is not set. Media uploads will be disabled.');
}

export interface CloudinaryUploadResult {
  url: string;
  secureUrl: string;
  publicId: string;
  bytes: number;
  format: string;
  resourceType: string;
  originalFilename?: string;
  folder?: string;
}

const getPortfolioFolder = () => {
  return process.env.CLOUDINARY_PORTFOLIO_FOLDER || DEFAULT_PORTFOLIO_FOLDER;
};

const getResumeFolder = () => {
  return process.env.CLOUDINARY_RESUME_FOLDER || DEFAULT_RESUME_FOLDER;
};

export const isCloudinaryConfigured = () => configured;

export const uploadPortfolioDocument = (fileBuffer: Buffer, filename: string): Promise<CloudinaryUploadResult> => {
  if (!configured) {
    return Promise.reject(new Error('Cloudinary is not configured. Set CLOUDINARY_URL in the environment.'));
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'auto',
        folder: getPortfolioFolder(),
        use_filename: true,
        unique_filename: true,
        overwrite: false,
        filename_override: filename
      },
      (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
        if (error || !result) {
          reject(error || new Error('Unknown error uploading document to Cloudinary'));
          return;
        }

        resolve({
          url: result.url,
          secureUrl: result.secure_url,
          publicId: result.public_id,
          bytes: result.bytes,
          format: result.format,
          resourceType: result.resource_type,
          originalFilename: result.original_filename,
          folder: result.folder
        });
      }
    );

    uploadStream.end(fileBuffer);
  });
};

export const uploadResumeDocument = (fileBuffer: Buffer, filename: string): Promise<CloudinaryUploadResult> => {
  if (!configured) {
    return Promise.reject(new Error('Cloudinary is not configured. Set CLOUDINARY_URL in the environment.'));
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'raw',
        folder: getResumeFolder(),
        use_filename: true,
        unique_filename: true,
        overwrite: false,
        filename_override: filename
      },
      (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
        if (error || !result) {
          reject(error || new Error('Unknown error uploading resume to Cloudinary'));
          return;
        }

        resolve({
          url: result.url,
          secureUrl: result.secure_url,
          publicId: result.public_id,
          bytes: result.bytes,
          format: result.format,
          resourceType: result.resource_type,
          originalFilename: result.original_filename,
          folder: result.folder
        });
      }
    );

    uploadStream.end(fileBuffer);
  });
};

export const deleteCloudinaryAsset = async (publicId: string, resourceType: 'image' | 'video' | 'raw' | 'auto' = 'auto'): Promise<void> => {
  if (!configured) {
    throw new Error('Cloudinary is not configured.');
  }

  const options: { invalidate: boolean; resource_type?: 'image' | 'video' | 'raw' } = {
    invalidate: true
  };

  if (resourceType !== 'auto') {
    options.resource_type = resourceType;
  }

  await cloudinary.uploader.destroy(publicId, options);
};
