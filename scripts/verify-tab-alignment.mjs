import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const baseUrl = process.env.PREVIEW_URL || 'http://127.0.0.1:5173';
const output = process.env.QA_OUTPUT || 'artifacts/tab-alignment';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE ? { executablePath: process.env.BROWSER_EXECUTABLE } : {}) });
// Keep animations enabled: switching tabs must also stay aligned during the transition.
const page = await browser.newPage();
const errors = [];
page.on('pageerror', error => errors.push(error.message));
const records = [
  { name: 'query', hash: 'query-QRY-2001', attribute: 'data-query-detail-tab', header: '.query-detail-header', tabs: '.query-detail-tabs', panel: '#queryDetailTabPanel', footer: '#queryTaskPagination' },
  { name: 'customer', hash: 'customer-CUST-0001', attribute: 'data-profile-tab', header: '.profile-customer-header', tabs: '.detail-tabs', panel: '.profile-tab-panel:not([hidden])', footer: '#profileTaskPagination' },
];

function compare(actual, expected, message) {
  assert.ok(Math.abs(actual - expected) <= 0.5, `${message}: ${actual} vs ${expected}`);
}

try {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 1440, height: 650 }, { width: 1920, height: 1200 }, { width: 768, height: 1024 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    for (const record of records) {
      await page.goto(`${baseUrl}/#${record.hash}`, { waitUntil: 'networkidle' });
      await page.reload({ waitUntil: 'networkidle' });
      const tabs = await page.locator(`[${record.attribute}]`).evaluateAll((elements, attribute) => elements.map(element => element.getAttribute(attribute)), record.attribute);
      let baseline;
      for (const tab of [...tabs, 'documents', 'tasks', 'communication', 'documents']) {
        await page.locator(`[${record.attribute}="${tab}"]`).click();
        const samples = await page.evaluate(async ({ header, tabs, panel, footer }) => {
          const rect = selector => {
            const r = document.querySelector(selector).getBoundingClientRect();
            return { x: r.x, y: r.y, width: r.width, height: r.height };
          };
          const samples = [];
          for (let frame = 0; frame < 12; frame++) {
            await new Promise(requestAnimationFrame);
            samples.push({ header: rect(header), tabs: rect(tabs), panel: rect(panel) });
          }
          const main = document.querySelector('.main-content');
          const pagination = document.querySelector(footer);
          return { samples, overflow: document.documentElement.scrollWidth > innerWidth,
            mainBottom: main.getBoundingClientRect().bottom,
            footerBottom: pagination?.getClientRects().length ? pagination.getBoundingClientRect().bottom : null };
        }, record);
        baseline ||= samples.samples.at(-1);
        for (const sample of samples.samples) {
          for (const element of ['header', 'tabs', 'panel']) {
            for (const axis of ['x', 'y', 'width']) compare(sample[element][axis], baseline[element][axis], `${record.name} ${tab}: ${element} ${axis}`);
          }
          compare(sample.header.height, baseline.header.height, `${record.name} ${tab}: header height`);
          compare(sample.tabs.height, baseline.tabs.height, `${record.name} ${tab}: tab bar height`);
        }
        assert.equal(samples.overflow, false, `${record.name} ${tab}: no page overflow`);
        if (tab === 'tasks') compare(samples.footerBottom, samples.mainBottom, `${record.name}: task pagination remains pinned`);
        if (viewport.width === 1440 && viewport.height === 900 && ['documents', 'tasks', 'communication'].includes(tab)) {
          await page.screenshot({ path: `${output}/${record.name}-${tab}.png` });
        }
      }
      if (record.name === 'customer') {
        await page.locator('[data-profile-tab="overview"]').click();
        await page.locator('.main-content').evaluate(element => { element.scrollTop = 200; });
        assert.ok(await page.locator('.main-content').evaluate(element => element.scrollTop) > 0, 'Customer overview remains scrollable');
        await page.locator('[data-profile-tab="tasks"]').evaluate(element => element.click());
        assert.equal(await page.locator('.main-content').evaluate(element => element.scrollTop), 0, 'Switching from a scrolled overview restores the tab alignment');
      }
      console.log(`PASS ${record.name}: all tabs aligned at ${viewport.width}×${viewport.height}`);
    }
  }
  assert.deepEqual(errors, [], 'No browser errors');
} finally {
  await browser.close();
}
