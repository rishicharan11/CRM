import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const baseUrl = process.env.PREVIEW_URL || 'http://127.0.0.1:5173';
const output = process.env.QA_OUTPUT || 'artifacts/pagination';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE ? { executablePath: process.env.BROWSER_EXECUTABLE } : {}) });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
const page = await context.newPage();
page.setDefaultTimeout(10000);
const errors = [];
page.on('pageerror', error => errors.push(error.message));
page.on('response', response => { if (response.url().startsWith(baseUrl) && response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });

const lists = [
  { name: 'customers', hash: 'customers', footer: '#pagination', rows: '#customerRows tr[data-customer-id]', search: '#customerSearch' },
  { name: 'queries', hash: 'trip', footer: '#queryListPagination', rows: '#queryListBody tr[data-query-id]', search: '#queriesSearch' },
  { name: 'tasks', hash: 'tasks', footer: '#taskListPagination', rows: '#taskListBody tr[data-task-id]', search: '#tasksSearch' },
  { name: 'customer-tasks', hash: 'customer-CUST-0001', tab: '[data-profile-tab="tasks"]', footer: '#profileTaskPagination', rows: '#profileTaskRows tr[data-profile-task-id]', search: '#profileTaskSearch' },
  { name: 'query-tasks', hash: 'query-QRY-2001', tab: '[data-query-detail-tab="tasks"]', footer: '#queryTaskPagination', rows: '#queryTaskRows tr[data-query-task-id]', search: '#queryTaskSearch' },
  { name: 'vault', hash: 'document-vault', footer: '#vaultPagination', rows: '#vaultList .vault-customer', search: '#vaultSearchVisible' },
];
const settle = () => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(resolve))))));
const open = async list => {
  await page.goto(`${baseUrl}/#${list.hash}`, { waitUntil: 'networkidle' });
  await page.reload({ waitUntil: 'networkidle' });
  if (list.tab) await page.locator(list.tab).click();
  await settle();
};
const inspect = list => page.evaluate(({ footer: selector, rows: rowSelector }) => {
  const footer = document.querySelector(selector);
  const scroller = footer.parentElement.querySelector('.table-scroller, .query-table-scroller, .profile-tasks-scroller, .vault-list');
  const main = document.querySelector('.main-content');
  const rect = element => { const r = element.getBoundingClientRect(); return { top: r.top, bottom: r.bottom, height: r.height }; };
  const range = footer.querySelector('.pagination-range').textContent.match(/Showing (\d+)–(\d+) of (\d+)/).slice(1).map(Number);
  const rows = [...document.querySelectorAll(rowSelector)];
  const header = scroller.querySelector('thead');
  const rowHeight = rows[0]?.querySelector('.vault-customer-head')?.getBoundingClientRect().height + 1 || rows[0]?.getBoundingClientRect().height;
  return {
    footer: rect(footer), main: rect(main), scroller: rect(scroller), range,
    footerDirection: getComputedStyle(footer).flexDirection,
    count: rows.length, ids: rows.map(row => row.dataset.customerId || row.dataset.queryId || row.dataset.taskId || row.dataset.profileTaskId || row.dataset.queryTaskId || row.dataset.vaultCustomer),
    lastRowBottom: rows.at(-1)?.getBoundingClientRect().bottom, rowHeight,
    headerHeight: header?.getBoundingClientRect().height || 0,
    previousDisabled: footer.querySelector('[aria-label="Previous page"]').disabled,
    nextDisabled: footer.querySelector('[aria-label="Next page"]').disabled,
    numberedButtons: footer.querySelectorAll('.page-button:not(.page-button-nav)').length,
    currentPage: Number(footer.querySelector('[aria-current="page"]').textContent),
    horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
  };
}, list);

async function check(list, { full = false } = {}) {
  await settle();
  const state = await inspect(list);
  const [first, last, total] = state.range;
  assert.equal(state.count, total ? last - first + 1 : 0, `${list.name}: range agrees with visible records`);
  assert.equal(state.numberedButtons, 1, `${list.name}: only the current page number is shown`);
  assert.equal(state.footerDirection, 'row', `${list.name}: footer keeps the query layout at every width`);
  assert.equal(state.previousDisabled, first <= 1, `${list.name}: previous boundary is disabled`);
  assert.equal(state.nextDisabled, last === total, `${list.name}: next boundary is disabled`);
  assert.ok(Math.abs(state.footer.bottom - state.main.bottom) <= 1, `${list.name}: footer stays at the shell bottom (${state.footer.bottom} vs ${state.main.bottom})`);
  assert.ok(state.footer.bottom <= await page.evaluate(() => innerHeight), `${list.name}: footer is visible in the viewport`);
  assert.equal(state.horizontalOverflow, false, `${list.name}: horizontal scrolling stays inside the table`);
  if (state.count) {
    assert.ok(state.lastRowBottom <= state.scroller.bottom + 1, `${list.name}: no partial row under the footer`);
    if (full && !state.nextDisabled) {
      const unused = state.scroller.height - state.headerHeight - state.count * state.rowHeight;
      assert.ok(unused < state.rowHeight + 1, `${list.name}: page uses all space available for complete rows`);
    }
  }
  return state;
}

try {
  const viewports = [{ width: 1440, height: 900 }, { width: 1440, height: 650 }, { width: 1920, height: 1200 }, { width: 768, height: 1024 }, { width: 390, height: 844 }];
  const counts = [];
  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    for (const list of lists) {
      await open(list);
      const first = await check(list, { full: true });
      counts.push({ list: list.name, ...viewport, rows: first.count });
      const seen = [...first.ids];
      let state = first;
      while (!state.nextDisabled) {
        await page.locator(list.footer).getByRole('button', { name: 'Next page', exact: true }).click();
        state = await check(list, { full: true });
        assert.equal(state.footer.bottom, first.footer.bottom, `${list.name}: last page cannot move the footer`);
        seen.push(...state.ids);
      }
      assert.equal(new Set(seen).size, first.range[2], `${list.name}: every record is reachable once`);
      assert.equal(seen.length, new Set(seen).size, `${list.name}: pages do not repeat records`);
      while (!state.previousDisabled) {
        await page.locator(list.footer).getByRole('button', { name: 'Previous page', exact: true }).click();
        state = await check(list);
      }
      await page.screenshot({ path: `${output}/${list.name}-${viewport.width}x${viewport.height}.png` });
    }
  }
  const customerCount = height => counts.find(item => item.list === 'customers' && item.height === height && item.width >= 1440).rows;
  assert.ok(customerCount(1200) > customerCount(900), 'A taller viewport increases customer capacity beyond the old eight-row limit');
  assert.ok(customerCount(650) < customerCount(900), 'A shorter viewport reduces capacity');

  // A live resize on a later page keeps the previously visible record reachable.
  await page.setViewportSize({ width: 1440, height: 650 });
  const customers = lists[0];
  await open(customers);
  await page.locator(customers.footer).getByRole('button', { name: 'Next page', exact: true }).click();
  const beforeResize = await check(customers);
  await page.setViewportSize({ width: 1440, height: 900 });
  const afterResize = await check(customers, { full: true });
  assert.ok(afterResize.ids.includes(beforeResize.ids[0]), 'Resize retains the first record from the old page');

  // Selection bars use table space, preserve selection, and cannot move the footer.
  await page.locator('#customerRows [data-sheet-check]').first().check();
  const selected = await check(customers, { full: true });
  assert.ok(selected.scroller.height < afterResize.scroller.height, 'Bulk actions reduce the space available to records');
  assert.ok(selected.count <= afterResize.count, 'Bulk actions cannot increase page capacity');
  assert.equal(selected.footer.bottom, afterResize.footer.bottom);
  await page.locator('#customerListView [data-sheet-clear]').click();
  assert.equal((await check(customers)).count, afterResize.count, 'Clearing selection restores capacity');

  // Empty searches and short filtered pages keep the same footer and boundaries.
  for (const list of lists) {
    await open(list);
    const before = await check(list);
    await page.locator(list.search).fill('pagination-no-matches');
    const empty = await check(list);
    assert.deepEqual(empty.range, [0, 0, 0]);
    assert.equal(empty.footer.bottom, before.footer.bottom);
    await page.locator(list.search).fill('');
    assert.deepEqual((await check(list)).range, before.range);
  }

  // Expanded vault documents scroll independently of the fixed footer.
  const vault = lists.at(-1);
  await open(vault);
  const vaultBefore = await check(vault);
  await page.locator('#vaultList [data-vault-toggle]').first().click();
  await settle();
  assert.equal((await inspect(vault)).footer.bottom, vaultBefore.footer.bottom);
  await page.locator('#vaultList').evaluate(element => { element.scrollTop = element.scrollHeight; });
  assert.equal((await inspect(vault)).footer.bottom, vaultBefore.footer.bottom);

  // Query task tables are mounted dynamically. Added tasks must page too.
  await page.setViewportSize({ width: 1440, height: 650 });
  const queryTasks = lists[4];
  await open(queryTasks);
  for (let index = 1; index <= 5; index++) {
    await page.locator('#newQueryTaskButton').click();
    await page.locator('#taskTitleInput').fill(`Pagination QA task ${index}`);
    await page.locator('#taskModalSubmit').click();
  }
  let tasks = await check(queryTasks, { full: true });
  assert.equal(tasks.range[2], 5);
  assert.equal(tasks.nextDisabled, false);
  await page.locator(queryTasks.footer).getByRole('button', { name: 'Next page', exact: true }).click();
  tasks = await check(queryTasks);
  assert.equal(tasks.range[1], 5);
  assert.equal(tasks.nextDisabled, true);
  assert.deepEqual(errors, [], 'No runtime or local resource errors');
  console.log(JSON.stringify({ verified: lists.map(list => list.name), capacities: counts, errors }, null, 2));
} finally {
  await browser.close();
}
