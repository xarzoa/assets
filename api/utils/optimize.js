import sharp from 'sharp';
import { streamImage } from './s3.js';

async function optimize(width, height, quality, fit, key, bucket) {
  try {
    const image = sharp();
    await streamImage(key, bucket, image);
    if (width && height) {
      image.resize(parseInt(width), parseInt(height), {
        fit: fit || 'cover',
      });
    }
    const optimizedBuffer = await image
      .webp({ lossless: quality === 100, quality: quality || 50 })
      .toBuffer();
    return optimizedBuffer;
  } catch (e) {
    throw new Error({
      code: 500,
      message: 'Dang! Error optimizing the image.',
    });
  }
}

export { optimize };