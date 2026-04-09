const puppeteer = require('puppeteer');
const path      = require('path');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page    = await browser.newPage();
  await page.setViewport({ width: 860, height: 500, deviceScaleFactor: 2 });

  const file = 'file://' + path.resolve('city.html');
  await page.goto(file, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 800));

  await page.screenshot({ path: 'preview.png' });
  await browser.close();
  console.log('Saved preview.png');
})();
