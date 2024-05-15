import express from 'express';
import multer from 'multer';
import multerS3 from 'multer-s3';
import { client, streamImage } from './utils/s3.js';
import { optimize } from './utils/optimize.js';
import cors from 'cors'
import { env } from './utils/config.js';

const app = express();

let corsOptions = { 
  origin : env.origins.split(' '), 
}

app.use(cors(corsOptions))

function customHeaders(req, res, next) {
  app.disable('x-powered-by');
  res.setHeader('x-powered-by', 'DuckLabs');
  next();
}

function generateRandomString(length) {
  length = Math.max(length, 32);

  const allowedChars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const randomBytes = crypto.randomBytes(Math.ceil(length / 2));
  let randomString = '';
  for (let i = 0; i < randomBytes.length; i++) {
    const byteValue = randomBytes[i];
    const index = byteValue % allowedChars.length;
    randomString += allowedChars[index];
  }
  return randomString.slice(0, length);
}

const upload = multer({
  storage: multerS3({
    s3: client,
    bucket: function (req, file, cb) {
      cb(null, req.query.bucket);
    },
    metadata: function (req, file, cb) {
      console.log(file);
      cb(null, { fieldName: file.fieldname, contentType: file.mimetype, originalname: file.originalname, server: 'DuckLabs' });
    },
    key: function (req, file, cb) {
      let ext = file.originalname.split('.');
      let name = generateRandomString(32);
      let path = `${req.query.id}/${req.query.path || ''}/${name}.${
        ext[ext.length - 1]
      }`;
      cb(null, path);
    },
    contentType: function (req, file, cb) {
      cb(null, file.mimetype);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
    ];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new multer.MulterError('LIMIT_FILE_TYPE', 'Only images are allowed!'));
    }
  },
});

app.use(customHeaders);

app.get('/', (req, res) => {
  res.json({
    info: "Yet another image server."
  });
});

app.get('/optimize/*', async (req, res) => {
  const { width, height, quality, fit, bucket } = req.query;
  const key = req.params[0];
  if (!key || !bucket) {
    return res
      .status(400)
      .json({ message: 'Dang! Some required params are missing.' });
  }
  try {
    const optimizedBuffer = await optimize(
      width,
      height,
      quality,
      fit,
      key,
      bucket
    );
    res.setHeader('Content-Type', 'image/webp');
    res.send(optimizedBuffer);
  } catch (e) {
    res.json(e);
  }
});

app.get('/get/*', async (req, res) => {
  const key = req.params[0];
  const bucket = req.query.bucket;
  if (!key || !bucket) {
    return res
      .status(400)
      .json({ message: 'Dang! Some required params are missing.' });
  }

  try {
    await streamImage(key, bucket, res);
  } catch (e) {
    res.json(e);
  }
});

app.post('/upload', upload.single('file'), async (req, res) => {
  const {
    acl,
    location,
    versionId,
    contentDisposition,
    contentEncoding,
    storageClass,
    serverSideEncryption,
    ...data
  } = req.file;
  res.status(200).json(data);
});

export default app