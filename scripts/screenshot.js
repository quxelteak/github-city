const puppeteer = require('puppeteer');
const path      = require('path');

(async () => {
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

  await page.screenshot({ path: 'preview.png' });
  await browser.close();
  console.log('Saved preview.png');
})();
