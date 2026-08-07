// Minimal upload server for testing (Express + multer)
// For production: replace local disk storage with S3/Cloudinary and add authentication.

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    const name = `avatar-${Date.now()}${ext}`;
    cb(null, name);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) return cb(new Error('Not an image'), false);
    cb(null, true);
  }
});

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(UPLOAD_DIR));

app.post('/upload', upload.single('avatar'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'File missing' });
  const url = `/uploads/${req.file.filename}`; // for local testing
  res.json({ url });
});

app.get('/', (req, res) => res.json({ status: 'Upload server running' }));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Upload server listening on http://localhost:${port}`));
