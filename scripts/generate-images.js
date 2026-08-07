const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [320, 640, 1280];
const formats = ['jpeg','webp','avif'];

async function generate(src, outDir){
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive:true });
  // LQIP tiny blurred JPEG
  await sharp(src).resize(40).blur().jpeg({ quality:40 }).toFile(path.join(outDir,'me-lqip.jpg'));
  for (const s of sizes){
    for (const fmt of formats){
      const outName = `me-${s}.${fmt === 'jpeg' ? 'jpg' : fmt}`;
      const p = path.join(outDir, outName);
      const pipeline = sharp(src).resize(s, s, { fit: 'cover' });
      if (fmt === 'jpeg') await pipeline.jpeg({ quality: 80 }).toFile(p);
      else if (fmt === 'webp') await pipeline.webp({ quality: 80 }).toFile(p);
      else if (fmt === 'avif') await pipeline.avif({ quality: 60 }).toFile(p);
      console.log('Wrote', p);
    }
    // also write a jpg fallback
    await sharp(src).resize(s, s, { fit: 'cover' }).jpeg({ quality: 80 }).toFile(path.join(outDir,`me-${s}.jpg`));
  }
  console.log('Selesai membuat varian gambar di', outDir);
}

const [,, src, out] = process.argv;
if (!src || !out) {
  console.error('Usage: node scripts/generate-images.js <sourcePath> <outDir>');
  process.exit(1);
}
generate(src, out).catch(e => { console.error(e); process.exit(1); });
