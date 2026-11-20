const https = require('https');
const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '../frontend/public');

function download(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
      if (res.statusCode === 200) {
        const file = fs.createWriteStream(dest);
        res.pipe(file);
        file.on('finish', () => {
          file.close();
          console.log('Downloaded', dest);
          resolve();
        });
      } else {
        reject(new Error(`Failed with status ${res.statusCode}`));
      }
    }).on('error', reject);
  });
}

async function run() {
  await download('https://sterlinglrs.com/wp-content/uploads/2026/10/Sterling-logo-100x100.jpg', path.join(publicDir, 'favicon.ico'));
  await download('https://sterlinglrs.com/wp-content/uploads/2026/10/Sterling-logo-100x100.jpg', path.join(publicDir, 'favicon.jpg'));
  await download('https://sterlinglrs.com/wp-content/uploads/2026/10/Sterling-logo-300x300.jpg', path.join(publicDir, 'apple-touch-icon.png'));
  await download('https://sterlinglrs.com/wp-content/uploads/2026/10/Sterling-logo-300x300.jpg', path.join(publicDir, 'pwa-192x192.png'));
  await download('https://sterlinglrs.com/wp-content/uploads/2026/10/Sterling-logo-300x300.jpg', path.join(publicDir, 'pwa-512x512.png'));
  console.log('All icons downloaded successfully!');
}

run().catch(console.error);
