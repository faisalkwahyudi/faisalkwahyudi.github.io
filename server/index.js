require('dotenv').config();
// Upload server with optional backends: local disk (default), S3, or Cloudinary
// Configure STORAGE env: 'local' | 's3' | 'cloudinary'

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const STORAGE = process.env.STORAGE || 'local';

let uploadMiddleware;
let uploadHandler;

// Local disk storage (default)
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
if (STORAGE === 'local') {
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  const diskStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname) || '.jpg';
      const name = `avatar-${Date.now()}${ext}`;
      cb(null, name);
    }
  });
  const upload = multer({
    storage: diskStorage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.startsWith('image/')) return cb(new Error('Not an image'), false);
      cb(null, true);
    }
  });
  uploadMiddleware = upload.single('avatar');
  // local handler
  uploadHandler = async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'File missing' });
    const url = `/uploads/${req.file.filename}`;
    res.json({ url });
  };
}

// S3 backend
if (STORAGE === 's3') {
  const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
  const s3Client = new S3Client({ region: process.env.AWS_REGION });
  const bucket = process.env.AWS_BUCKET;
  if (!bucket) throw new Error('AWS_BUCKET env is required when STORAGE=s3');

  const memoryStorage = multer.memoryStorage();
  const upload = multer({ storage: memoryStorage, limits: { fileSize: 5 * 1024 * 1024 } });
  uploadMiddleware = upload.single('avatar');

  uploadHandler = async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: 'File missing' });
      const ext = path.extname(req.file.originalname) || '.jpg';
      const key = `avatars/avatar-${Date.now()}${ext}`;
      const params = {
        Bucket: bucket,
        Key: key,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
        ACL: process.env.AWS_ACL || 'public-read'
      };
      await s3Client.send(new PutObjectCommand(params));
      const url = process.env.AWS_CLOUDFRONT_DOMAIN
        ? `${process.env.AWS_CLOUDFRONT_DOMAIN}/${key}`
        : `https://${bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
      res.json({ url });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Upload to S3 failed' });
    }
  };
}

// Cloudinary backend
if (STORAGE === 'cloudinary') {
  const cloudinary = require('cloudinary').v2;
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
  const memoryStorage = multer.memoryStorage();
  const upload = multer({ storage: memoryStorage, limits: { fileSize: 5 * 1024 * 1024 } });
  uploadMiddleware = upload.single('avatar');

  const streamUpload = (buffer, opts = {}) => {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(opts, (error, result) => {
        if (error) return reject(error);
        resolve(result);
      });
      stream.end(buffer);
    });
  };

  uploadHandler = async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: 'File missing' });
      const result = await streamUpload(req.file.buffer, { folder: process.env.CLOUDINARY_FOLDER || 'avatars' });
      res.json({ url: result.secure_url });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Upload to Cloudinary failed' });
    }
  };
}

if (!uploadMiddleware || !uploadHandler) {
  throw new Error(`UPLOAD configuration not found. Check STORAGE env variable (current: ${STORAGE})`);
}

const app = express();
app.use(cors());
app.use(express.json());
if (STORAGE === 'local') app.use('/uploads', express.static(UPLOAD_DIR));

app.post('/upload', uploadMiddleware, uploadHandler);

app.get('/', (req, res) => res.json({ status: `Upload server running (storage=${STORAGE})` }));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Upload server listening on http://localhost:${port} (storage=${STORAGE})`));
