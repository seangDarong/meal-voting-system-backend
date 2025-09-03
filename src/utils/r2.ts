import { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';

// Define interface for file object
export interface File {
  originalname: string;
  buffer: Buffer;
  mimetype: string;
  size?: number;
}

interface R2Config {
  R2_ACCOUNT_ID: string;
  R2_ACCESS_KEY_ID: string;
  R2_SECRET_ACCESS_KEY: string;
  R2_BUCKET_NAME: string;
  R2_PUBLIC_URL: string;
}

// Validate environment variables
const getR2Config = (): R2Config => {
  const {
    R2_ACCOUNT_ID,
    R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY,
    R2_BUCKET_NAME,
    R2_PUBLIC_URL
  } = process.env;

  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME || !R2_PUBLIC_URL) {
    throw new Error('Missing R2 configuration in environment variables');
  }

  return {
    R2_ACCOUNT_ID,
    R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY,
    R2_BUCKET_NAME,
    R2_PUBLIC_URL
  };
};

export const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export const uploadImageToR2 = async (file: File, type: string): Promise<string> => {
  try {
    const { R2_BUCKET_NAME, R2_PUBLIC_URL } = getR2Config();

    const fileKey = `${type}/${Date.now()}_${file.originalname}`;
    
    const imageUrl = `${R2_PUBLIC_URL}/${fileKey}`;
    
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: fileKey,
      Body: file.buffer,
      ContentType: file.mimetype,
    });
    
    await s3.send(command);
    return imageUrl;
  } catch (error: any) {
    console.error('Error uploading image to R2:', error);
    throw new Error(`Failed to upload image: ${error.message}`);
  }
}

export const deleteImageFromR2 = async (key: string): Promise<void> => {
  try {
    const { R2_BUCKET_NAME } = getR2Config();

    // Check if object exists before attempting to delete
    await s3.send(
      new HeadObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
      })
    );

    const command = new DeleteObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    });

    await s3.send(command);
  } catch (error: any) {
    if (error.name === "NotFound") {
      throw new Error(`Object with key "${key}" does not exist.`);
    } else {
      console.error('Error deleting image from R2:', error);
      throw new Error(`Failed to delete image: ${error.message}`);
    }
  }
}

export const getImageFromR2 = async (key: string): Promise<Buffer> => {
  try {
    const { R2_BUCKET_NAME } = getR2Config();

    const command = new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    });

    const response = await s3.send(command);
    
    if (!response.Body) {
      throw new Error('No body in response');
    }

    // Convert Readable stream to Buffer
    const chunks: Buffer[] = [];
    for await (const chunk of response.Body as Readable) {
      chunks.push(chunk as Buffer);
    }
    
    return Buffer.concat(chunks);
  } catch (error: any) {
    console.error('Error retrieving image from R2:', error);
    throw new Error(`Failed to retrieve image: ${error.message}`);
  }
}

export const checkImageExistsInR2 = async (key: string): Promise<boolean> => {
  try {
    const { R2_BUCKET_NAME } = getR2Config();

    await s3.send(
      new HeadObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
      })
    );
    
    return true;
  } catch (error: any) {
    if (error.name === "NotFound") {
      return false;
    }
    console.error('Error checking image existence in R2:', error);
    throw new Error(`Failed to check image existence: ${error.message}`);
  }
}

// Helper function to extract key from URL
export const extractKeyFromUrl = (url: string): string => {
  const { R2_PUBLIC_URL } = getR2Config();
  
  if (!url.startsWith(R2_PUBLIC_URL)) {
    throw new Error('URL does not belong to R2 storage');
  }
  
  return url.replace(`${R2_PUBLIC_URL}/`, '');
}

// Type for upload options
interface UploadOptions {
  contentType?: string;
  metadata?: Record<string, string>;
}

export const uploadFileToR2 = async (
  file: File, 
  type: string, 
  options?: UploadOptions
): Promise<string> => {
  try {
    const { R2_BUCKET_NAME, R2_PUBLIC_URL } = getR2Config();

    const fileKey = `${type}/${Date.now()}_${file.originalname}`;
    
    const fileUrl = `${R2_PUBLIC_URL}/${fileKey}`;
    
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: fileKey,
      Body: file.buffer,
      ContentType: options?.contentType || file.mimetype,
      Metadata: options?.metadata,
    });
    
    await s3.send(command);
    return fileUrl;
  } catch (error: any) {
    console.error('Error uploading file to R2:', error);
    throw new Error(`Failed to upload file: ${error.message}`);
  }
}