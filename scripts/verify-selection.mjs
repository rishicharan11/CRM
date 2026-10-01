import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const baseUrl = process.env.PREVIEW_URL || 'http://127.0.0.1:5173';
const output = process.env.QA_OUTPUT || 'artifacts/selection-parity';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE ? { executablePath: process.env.BROWSER_EXECUTABLE } : {}) });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
const settle = () => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(resolve))))));
const styleKeys = ['height', 'paddingLeft', 'paddingRight', 'gap', 'borderRadius', 'borderTopColor', 'backgroundColor', 'color', 'fontFamily', 'fontSize', 'fontWeight', 'lineHeight'];
const buttonStyles = (locator) => locator.evaluate((element, keys) => Object.fromEntries(keys.map(key => [key, getComputedStyle(element)[key]])), styleKeys);
const lists = [
  { name: 'customers', hash: 'customers', entity: 'customer', footer: '#pagination' },
  { name: 'queries', hash: 'trip', entity: 'query', footer: '#queryListPagination', layout: true },
  { name: 'tasks', hash: 'tasks', entity: 'task', footer: '#taskListPagination', layout: true },
  { name: 'customer-tasks', hash: 'customer-CUST-0001', entity: 'task', tab: '[data-profile-tab="tasks"]', footer: '#profileTaskPagination' },
  { name: 'query-tasks', hash: 'query-QRY-2001', entity: 'task', tab: '[data-query-detail-tab="tasks"]', footer: '#queryTaskPagination' },
];
let vendor;

try {
  if (process.env.VENDOR_PREVIEW_URL) {
    const reference = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
    await reference.goto(process.env.VENDOR_PREVIEW_URL, { waitUntil: 'networkidle' });
    const frame = reference.frames().find(frame => frame.url().includes('/vendor-crm/')) || reference;
    await frame.getByRole('checkbox', { name: 'Select all vendors', exact: true }).click();
    vendor = {
      export: await buttonStyles(frame.locator('.pt-bulk').getByRole('button', { name: 'Export', exact: true })),
      clear: await buttonStyles(frame.locator('.pt-bulk').getByRole('button', { name: 'Clear', exact: true })),
      background: await frame.locator('.pt-bulk').evaluate(element => getComputedStyle(element).backgroundColor),
    };
    await reference.close();
  }

  for (const viewport of [{ width: 1440, height: 900 }, { width: 1440, height: 650 }, { width: 1920, height: 1200 }, { width: 768, height: 1024 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    for (const list of lists) {
      await page.goto(`${baseUrl}/#${list.hash}`, { waitUntil: 'networkidle' });
      await page.reload({ waitUntil: 'networkidle' });
      if (list.layout) await page.locator('[data-query-layout="list"]:visible, [data-task-layout="list"]:visible').click();
      if (list.tab) await page.locator(list.tab).click();
      if (list.name === 'query-tasks') {
        for (let index = 1; index <= 2; index++) {
          await page.locator('#newQueryTaskButton').click();
          await page.locator('#taskTitleInput').fill(`Selection verification task ${index}`);
          await page.locator('#taskModalSubmit').click();
        }
      }
      await settle();
      const table = page.locator('.workspace-data-sheet:visible');
      const bar = page.locator('.workspace-bulk-bar:visible');
      const header = table.locator('thead input');
      const firstRow = table.locator('tbody tr:has([data-sheet-check])').first();
      const firstId = await firstRow.locator('input').getAttribute('data-sheet-check');
      const selectedName = await firstRow.locator('.customer-name, .profile-task-name strong').first().textContent();
      const before = await table.locator('thead').boundingBox();
      const footerBefore = await page.locator(list.footer).boundingBox();
      await firstRow.locator('input').focus();
      await page.keyboard.press('Space');
      await settle();
      await page.mouse.move(1, 1);
      assert.equal(await table.locator(`input[data-sheet-check="${firstId}"]`).evaluate(element => element === document.activeElement && element.checked), true, `${list.name}: keyboard focus survives the bulk bar appearing`);
      assert.equal(await bar.locator('[role="status"]').textContent(), `1 ${list.entity} selected`);
      assert.equal(await header.evaluate(element => element.indeterminate), true);
      assert.equal((await table.locator('thead').boundingBox()).y, before.y, `${list.name}: selecting cannot shift the table header`);

      const geometry = await bar.evaluate((element, footerSelector) => {
        const footer = document.querySelector(footerSelector);
        const scroller = element.previousElementSibling;
        const label = element.querySelector('[role="status"]');
        const actions = element.querySelector('div');
        const selectedRow = scroller.querySelector('tr.is-selected');
        return { bottom: element.getBoundingClientRect().bottom, top: element.getBoundingClientRect().top,
          footerTop: footer.getBoundingClientRect().top, footerBottom: footer.getBoundingClientRect().bottom,
          scrollerBottom: scroller.getBoundingClientRect().bottom,
          labelRight: label.getBoundingClientRect().right, actionsLeft: actions.getBoundingClientRect().left,
          whiteRow: getComputedStyle(selectedRow.cells[1]).backgroundColor !== getComputedStyle(element).backgroundColor,
          background: getComputedStyle(element).backgroundColor,
          overflow: document.documentElement.scrollWidth > innerWidth };
      }, list.footer);
      assert.ok(Math.abs(geometry.top - geometry.scrollerBottom) <= 1, `${list.name}: actions follow the table`);
      assert.ok(Math.abs(geometry.bottom - geometry.footerTop) <= 1, `${list.name}: actions sit directly above pagination`);
      assert.ok(Math.abs(geometry.footerBottom - footerBefore.y - footerBefore.height) <= 1, `${list.name}: pagination stays fixed`);
      assert.equal(geometry.whiteRow, true, `${list.name}: selected rows keep the vendor neutral background`);
      assert.equal(geometry.overflow, false);
      assert.ok(geometry.labelRight < geometry.actionsLeft, `${list.name}: count and buttons do not overlap`);
      const exportButton = bar.getByRole('button', { name: 'Export', exact: true });
      const clearButton = bar.getByRole('button', { name: 'Clear', exact: true });
      assert.equal(await exportButton.locator('svg use').getAttribute('href'), '#i-export');
      assert.equal((await exportButton.boundingBox()).height, 32);
      if (vendor) {
        assert.deepEqual(await buttonStyles(exportButton), vendor.export, `${list.name}: Export matches Vendor`);
        assert.deepEqual(await buttonStyles(clearButton), vendor.clear, `${list.name}: Clear matches Vendor`);
        assert.equal(geometry.background, vendor.background);
      }
      if (viewport.width === 1440 && viewport.height === 900) {
        const downloadEvent = page.waitForEvent('download');
        await exportButton.click();
        const download = await downloadEvent;
        const csv = await readFile(await download.path(), 'utf8');
        assert.ok(csv.includes(selectedName), `${list.name}: Export includes the selected record`);
        await page.screenshot({ path: `${output}/${list.name}-selected.png` });
      }
      await header.check();
      await settle();
      assert.equal(await header.evaluate(element => element.checked && !element.indeterminate), true);
      assert.equal(await table.locator('tbody tr:has([data-sheet-check]) input:not(:checked)').count(), 0);
      await table.locator('tbody input').first().uncheck();
      await settle();
      assert.equal(await header.evaluate(element => element.indeterminate), true);
      await clearButton.click();
      await settle();
      assert.equal(await page.locator('.workspace-bulk-bar:visible').count(), 0);
      assert.equal(await table.locator('input:checked').count(), 0);
      assert.equal(await header.evaluate(element => element === document.activeElement), true, `${list.name}: Clear restores checkbox focus`);
    }
    console.log(`PASS selection actions on all five tables at ${viewport.width}×${viewport.height}`);
  }
  assert.deepEqual(errors, [], 'No browser errors');
} finally {
  await browser.close();
}
