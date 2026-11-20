const https = require('https');

https.get('https://sterlinglrs.com/', { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const lines = data.split('\n').filter(l => l.includes('rel="icon"') || l.includes("rel='icon'") || l.includes('rel="shortcut icon"') || l.includes('rel="apple-touch-icon"') || l.includes('favicon'));
    console.log('Icon lines:', lines);
  });
});
