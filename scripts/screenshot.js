const fs = require('fs');
const http = require('http');
const path = require('path');
const puppeteer = require('puppeteer');

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.html') return 'text/html; charset=utf-8';
  if (ext === '.json') return 'application/json; charset=utf-8';
  if (ext === '.js') return 'application/javascript; charset=utf-8';
  if (ext === '.css') return 'text/css; charset=utf-8';
  if (ext === '.png') return 'image/png';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.svg') return 'image/svg+xml';
  return 'application/octet-stream';
}

function startStaticServer(rootDir) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const requestPath = req.url === '/' ? '/city.html' : req.url;
      const safePath = path.normalize(decodeURIComponent(requestPath)).replace(/^(\.\.[/\\])+/, '');
      const filePath = path.join(rootDir, safePath);

      if (!filePath.startsWith(rootDir)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
      }

      fs.readFile(filePath, (err, data) => {
        if (err) {
          res.writeHead(err.code === 'ENOENT' ? 404 : 500);
          res.end(err.code === 'ENOENT' ? 'Not found' : 'Server error');
          return;
        }

        res.writeHead(200, { 'Content-Type': getContentType(filePath) });
        res.end(data);
      });
    });

    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

(async () => {
  const rootDir = path.resolve(__dirname, '..');
  const server = await startStaticServer(rootDir);
  const { port } = server.address();
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page    = await browser.newPage();
  await page.setViewport({ width: 860, height: 500, deviceScaleFactor: 2 });

  const file = 'file://' + path.resolve('city.html');
  await page.goto(file, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 800));

  await page.evaluate(() => {
    const el = document.createElement('div');
    el.innerText = new Date().toISOString();
    el.style.position = 'fixed';
    el.style.bottom = '10px';
    el.style.right = '10px';
    el.style.background = 'rgba(0,0,0,0.6)';
    el.style.color = 'white';
    el.style.padding = '4px 8px';
    el.style.fontSize = '12px';
    el.style.borderRadius = '4px';
    document.body.appendChild(el);
  });

  try {
    await page.goto(`http://127.0.0.1:${port}/city.html`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 800));

    await page.screenshot({ path: path.join(rootDir, 'preview.png') });
    console.log('Saved preview.png');
  } finally {
    await browser.close();
    server.close();
  }
})();
