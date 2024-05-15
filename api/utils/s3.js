import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { env } from './config.js';

const client = new S3Client({
  region: 'auto',
  endpoint: env.r2endPoint,
  credentials: {
    accessKeyId: env.r2Id,
    secretAccessKey: env.r2Key,
  },
});

async function streamImage(key, bucket, pipe) {
  try {
    const getObjectCommand = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });
    const response = await client.send(getObjectCommand);
    const imageData = response.Body;
    if (!imageData) {
      throw new Error({
        code: 404,
        message: 'The requested image was not found.',
      });
    }
    return imageData.pipe(pipe);
  } catch (e) {
    throw new Error({
      code: 500,
      message: 'Dang! Something went wrong.',
    });
  }
}

export { client, streamImage };