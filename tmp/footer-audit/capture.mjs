import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const out = __dirname;

const viewports = [
  { name: 'desktop-light', width: 1280, height: 900, theme: 'light' },
  { name: 'desktop-dark', width: 1280, height: 900, theme: 'dark' },
  { name: 'mobile-light', width: 360, height: 800, theme: 'light' },
  { name: 'mobile-dark', width: 360, height: 800, theme: 'dark' },
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
  await page.evaluate(() => document.fonts?.ready);
  await page.waitForTimeout(400);

  const footer = page.locator('footer').first();
  await footer.scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);
  await footer.screenshot({ path: path.join(out, `footer-${vp.name}.png`) });

  // Context: community section + footer
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight - 900));
  await page.waitForTimeout(200);
  await page.screenshot({
    path: path.join(out, `page-bottom-${vp.name}.png`),
    fullPage: false,
  });

  // Also capture library page (dense app page)
  await page.goto('http://localhost:3000/library', { waitUntil: 'load' });
  await page.waitForTimeout(500);
  const footerLib = page.locator('footer').first();
  if (await footerLib.isVisible()) {
    await footerLib.scrollIntoViewIfNeeded();
    await footerLib.screenshot({ path: path.join(out, `footer-library-${vp.name}.png`) });
  }

  await context.close();
}
await browser.close();
console.log('Screenshots saved to', out);
