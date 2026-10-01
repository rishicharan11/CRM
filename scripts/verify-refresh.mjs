import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const baseUrl = process.env.PREVIEW_URL || 'http://127.0.0.1:5173';
const output = process.env.QA_OUTPUT || 'artifacts/refresh';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE ? { executablePath: process.env.BROWSER_EXECUTABLE } : {}) });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', error => errors.push(error.message));
const controls = [
  { hash: 'customers', button: '#refreshButton', root: '#customerListView', search: '#customerSearch', term: 'Jain', record: '#customerRows tr[data-customer-id]', message: 'Customer list is up to date' },
  { hash: 'trip', button: '#queriesRefreshButton', root: '#queriesView', search: '#queriesSearch', term: 'Goa', record: '.query-card, #queryListBody tr[data-query-id]', message: 'Query list is up to date', layout: 'query' },
  { hash: 'tasks', button: '#tasksRefreshButton', root: '#tasksView', search: '#tasksSearch', term: 'Confirm', record: '.task-card, #taskListBody tr[data-task-id]', message: 'Task list is up to date', layout: 'task' },
  { hash: 'document-vault', button: '#vaultRefreshButton', root: '#documentVaultView', search: '#vaultSearchVisible', term: 'Jain', record: '#vaultList .vault-customer', message: 'Document vault is up to date' },
  { hash: 'reports', button: '#reportsRefresh', root: '#reportsView', record: '#reportsContent > :first-child', message: 'Workspace report is up to date' },
];
const settle = () => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(resolve)))));
const state = control => page.evaluate(({ root, search }) => {
  const element = document.querySelector(root);
  return {
    hash: location.hash, search: search ? document.querySelector(search).value : '',
    selected: [...element.querySelectorAll('[aria-selected="true"], [aria-pressed="true"]')].map(element => element.textContent.trim()),
    checked: [...element.querySelectorAll('[data-sheet-check]:checked')].map(input => input.dataset.sheetCheck),
    pages: [...element.querySelectorAll('.pagination')].filter(element => element.getClientRects().length).map(element => element.textContent.trim()),
    dates: [...element.querySelectorAll('input[type="date"], #reportsPreset')].map(element => element.value),
  };
}, control);

try {
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    for (const control of controls) {
      for (const layout of control.layout ? ['list', 'kanban'] : [null]) {
        await page.goto(`${baseUrl}/#${control.hash}`, { waitUntil: 'networkidle' });
        await page.reload({ waitUntil: 'networkidle' });
        if (layout) await page.locator(`[data-${control.layout}-layout="${layout}"]`).click();
        if (control.search) await page.locator(control.search).fill(control.term);
        if (control.hash === 'reports') {
          await page.locator('#reportsPreset').selectOption('last7');
          await page.locator('[data-report-tab="finance"]').click();
        }
        await settle();
        const checkboxes = page.locator(`${control.root} tbody [data-sheet-check]:visible`);
        if (await checkboxes.count()) await checkboxes.first().check();
        await settle();
        const before = await state(control);
        const record = page.locator(control.record).filter({ visible: true }).first();
        assert.ok(await record.count(), `${control.hash}: populated content for refresh`);
        const oldRecord = await record.elementHandle();
        const button = page.locator(control.button);
        await button.scrollIntoViewIfNeeded();
        const box = await button.boundingBox();
        await button.click();
        assert.equal(await button.isDisabled(), true, `${control.hash}: disabled while refreshing`);
        assert.equal(await button.getAttribute('aria-busy'), 'true');
        assert.equal(await button.evaluate(element => element.classList.contains('is-refreshing')), true);
        assert.equal(await button.locator('svg').evaluate(element => getComputedStyle(element).animationName), 'button-spin');
        assert.equal(await page.locator('#toast').isVisible(), false, 'Completion message waits for refresh');
        const busyBox = await button.boundingBox();
        assert.equal(busyBox.width, box.width);
        assert.equal(busyBox.height, box.height);
        // Even dispatched clicks cannot start overlapping refreshes.
        await button.evaluate(element => { element.dispatchEvent(new MouseEvent('click', { bubbles: true })); element.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
        if (width === 1440 && layout !== 'kanban') await page.screenshot({ path: `${output}/${control.hash}-refreshing.png` });
        await page.waitForFunction(selector => !document.querySelector(selector).disabled, control.button);
        await settle();
        assert.equal(await button.getAttribute('aria-busy'), null);
        assert.equal(await button.evaluate(element => element.classList.contains('is-refreshing')), false);
        assert.equal(await page.locator('#toast').textContent(), control.message);
        assert.equal(await oldRecord.evaluate(element => element.isConnected), false, `${control.hash}: content actually rerenders`);
        assert.deepEqual(await state(control), before, `${control.hash}: refresh preserves the current view, filters and selection`);
      }
    }
    console.log(`PASS ${width}px: all five refresh controls, including list and kanban modes`);
  }
  assert.deepEqual(errors, [], 'No browser errors');
} finally {
  await browser.close();
}
