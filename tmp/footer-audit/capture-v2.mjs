import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const viewports = [
  { name: 'desktop-light', width: 1280, height: 900, theme: 'light' },
  { name: 'mobile-light', width: 360, height: 800, theme: 'light' },
  { name: 'tablet-light', width: 768, height: 1024, theme: 'light' },
];

const browser = await chromium.launch();
for (const vp of viewports) {
  const context = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
  });
  await context.addInitScript((t) => {
    try {
      localStorage.setItem('theme', t);
    } catch {
      /* ignore */
    }
    if (t === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, vp.theme);
  const page = await context.newPage();
  await page.goto('http://localhost:3000/', { waitUntil: 'load' });
  await page.waitForTimeout(500);
  const footer = page.locator('footer').first();
  await footer.scrollIntoViewIfNeeded();
  await footer.screenshot({ path: path.join(__dirname, `footer-${vp.name}.png`) });
  await context.close();
}
await browser.close();
console.log('done');
