import { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

export const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

export const uploadImageToR2 = async(file, type) => {
    try{
        const bucketName = process.env.R2_BUCKET_NAME;

        if (!bucketName || !process.env.R2_PUBLIC_URL) {
        throw new Error("Missing R2 configuration");
        }

        const fileKey = `${type}/${Date.now()}_${file.originalname}`;
        
        const imageUrl = `${process.env.R2_PUBLIC_URL}/${fileKey}`;
        
        const command = new PutObjectCommand({
            Bucket: bucketName,
            Key: fileKey,
            Body: file.buffer,
            ContentType: file.mimetype,
        });
        
        await s3.send(command);
        return imageUrl;
    } catch(error){
        throw(error);
    }
}

export const deleteImageFromR2 = async(key) =>{
    try{
        await s3.send(
            new HeadObjectCommand({
                Bucket: process.env.R2_BUCKET_NAME,
                Key: key,
            })
        );

        const command = new DeleteObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: key,
        });

        await s3.send(command);
    }catch(error){
        if (err.name === "NotFound") {
            throw new Error(`Object with key "${key}" does not exist.`);
        } else {
            throw err;
        }
    }
}


