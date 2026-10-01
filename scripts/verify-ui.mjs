import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const baseUrl = process.env.PREVIEW_URL || 'http://127.0.0.1:5175';
const output = process.env.QA_OUTPUT || 'artifacts/design-parity';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE ? { executablePath: process.env.BROWSER_EXECUTABLE } : {}) });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
const errors = [];
context.on('page', page => {
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.url().startsWith(baseUrl) && response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
});
const page = await context.newPage();
const open = async hash => { await page.goto(`${baseUrl}/#${hash}`, { waitUntil: 'networkidle' }); await page.reload({ waitUntil: 'networkidle' }); };
const screenshot = name => page.screenshot({ path: `${output}/${name}.png`, animations: 'disabled' });
const sheet = () => page.locator('.workspace-data-sheet:visible');
const rows = () => sheet().locator('tbody tr:not(.workspace-sheet-fill)');
const settlePagination = () => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(resolve)))));
const checkCategoryTabsStayStill = async () => {
  const tabs = page.locator('#customerListView .category-tabs');
  const before = await tabs.locator('button').first().boundingBox();
  await tabs.hover();
  await page.mouse.wheel(0, 250);
  await page.waitForTimeout(150);
  assert.equal(await tabs.evaluate(element => element.scrollTop), 0, 'Wheel scrolling must not move the category tabs');
  const after = await tabs.locator('button').first().boundingBox();
  assert.equal(after.y, before.y, 'Category tabs must stay in place when scrolling over them');
};
const checkOverviewScroll = async () => {
  const main = page.locator('#mainContent');
  const geometry = await main.evaluate(element => ({
    overflow: getComputedStyle(element).overflowY,
    needsScroll: element.scrollHeight > element.clientHeight + 1,
  }));
  assert.equal(geometry.overflow, 'auto', 'Hidden list pages must not disable overview scrolling');
  if (geometry.needsScroll) {
    const box = await main.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.wheel(0, 5000);
    await page.waitForFunction(() => {
      const main = document.querySelector('#mainContent');
      return main.scrollTop >= main.scrollHeight - main.clientHeight - 1;
    });
    await main.evaluate(element => element.scrollTo({ top: 0, behavior: 'instant' }));
  }
};
const checkLayout = async () => {
  const geometry = await page.evaluate(() => {
    const table = [...document.querySelectorAll('.workspace-data-sheet')].find(element => element.getClientRects().length);
    const footer = [...document.querySelectorAll('.pagination:not([hidden])')].find(element => element.getClientRects().length);
    return {
      overflow: document.documentElement.scrollWidth > innerWidth,
      footerBottom: footer?.getBoundingClientRect().bottom,
      headerWidths: table ? [...table.tHead.rows[0].cells].map(cell => cell.getBoundingClientRect().width) : [],
      viewport: innerHeight,
    };
  });
  assert.equal(geometry.overflow, false, 'Document must not overflow horizontally');
  if (geometry.footerBottom) assert.ok(geometry.footerBottom <= geometry.viewport, 'Pagination must stay in the viewport');
  geometry.headerWidths.forEach(width => assert.ok(width >= 46, 'Every table column must retain its grid width'));
};

try {
  await open('customers');
  await checkCategoryTabsStayStill();
  const initialPageSize = await rows().count();
  assert.ok(initialPageSize > 0);
  assert.ok((await page.locator('#pagination').innerText()).includes(`Showing 1–${initialPageSize} of 16 customers`));
  await page.locator('#pagination').getByRole('button', { name: 'Next page' }).click();
  assert.equal(await rows().count(), 16 - initialPageSize);
  assert.ok((await page.locator('#pagination').innerText()).includes(`Showing ${initialPageSize + 1}–16 of 16 customers`));
  assert.equal(await page.locator('#pagination').getByRole('button', { name: 'Next page' }).isDisabled(), true);
  await page.locator('#pagination').getByRole('button', { name: 'Previous page' }).click();
  await checkLayout();
  await screenshot('customers-desktop');
  await sheet().locator('tbody input[type=checkbox]').first().check();
  await settlePagination();
  assert.equal(await sheet().locator('thead input').evaluate(input => input.indeterminate), true);
  assert.equal(await page.locator('#customerDetailView').isVisible(), false, 'Selection must not open the record');
  await sheet().locator('thead input').check();
  const selectedCount = await rows().count();
  assert.equal(await sheet().locator('tbody input:checked').count(), selectedCount);
  const firstSelectedName = await rows().first().locator('.customer-name').innerText();
  await screenshot('customers-selected');
  await page.locator('#pagination').getByRole('button', { name: 'Next page' }).click();
  assert.ok((await page.locator('.workspace-bulk-bar:visible').innerText()).includes(`${selectedCount} customers selected`), 'Selection survives paging');
  assert.equal(await sheet().locator('thead input').isChecked(), false);
  await sheet().locator('tbody input').first().check();
  const secondSelectedName = await rows().first().locator('.customer-name').innerText();
  const downloaded = page.waitForEvent('download');
  await page.locator('.workspace-bulk-bar:visible [data-sheet-export]').click();
  const download = await downloaded;
  const csv = await readFile(await download.path(), 'utf8');
  assert.ok(csv.includes(firstSelectedName) && csv.includes(secondSelectedName), 'Export must include selected records from both pages');
  await page.locator('.workspace-bulk-bar:visible [data-sheet-clear]').click();
  await page.locator('#customerSearch').fill('Jain');
  assert.equal(await rows().count(), 1);
  await page.locator('#customerSearch').fill('no-such-customer-qa');
  assert.equal(await page.locator('#emptyState').isVisible(), true);
  await page.locator('#clearFilters').click();
  await page.locator('#filterButton').click();
  await page.locator('#tierFilterOptions [data-filter-value="Gold"]').check();
  assert.equal(await page.locator('#filterPopover').isVisible(), true, 'Live filtering keeps the menu open');
  assert.ok(await rows().count() > 0);
  assert.ok((await rows().allTextContents()).every(text => text.includes('Gold')));
  await page.locator('#tierFilterOptions [data-filter-value="Silver"]').check();
  assert.ok((await rows().allTextContents()).every(text => /Gold|Silver/.test(text)));
  await page.locator('#clearCustomerFilters').click();
  await settlePagination();
  assert.equal(await rows().count(), initialPageSize);
  await page.locator('#groupFilterOptions [data-group-value="Corporate"]').check();
  assert.equal(await rows().count(), 2);
  await page.locator('#groupFilterOptions [data-group-value="Family"]').check();
  assert.match(await page.locator('#pagination').innerText(), /of 12 customers/, 'Group filters match either selected type');
  await page.locator('#clearCustomerFilters').click();
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#filterPopover').isVisible(), false);
  await page.locator('#customerLocationSearch').fill('Chennai');
  assert.equal(await rows().count(), 1);
  assert.match(await rows().innerText(), /Manish Kumar/);
  await page.locator('#customerLocationSearch').fill('');
  await page.locator('#customerSearch').fill('no-such-customer-qa');
  await page.locator('#clearFilters').click();
  await page.locator('[data-category="B2B"]').click();
  assert.ok((await rows().allTextContents()).every(text => text.includes('B2B')));
  await page.locator('[data-category="All"]').click();
  await page.locator('[data-customer-menu]').first().click();
  await page.locator('#editCustomerRowAction').click();
  assert.equal(await page.locator('#customerEditBackdrop').isVisible(), true);
  await page.locator('#cancelCustomerEdit').click();
  await rows().first().locator('td').nth(1).click();
  assert.match(await page.locator('#customerDetailTitle').innerText(), /Jain Family/);
  await checkOverviewScroll();
  await screenshot('customer-overview');
  for (const tab of ['travellers', 'documents', 'pipeline', 'finance', 'tasks', 'communication']) {
    await page.locator(`[data-profile-tab="${tab}"]`).click();
    await checkLayout();
    await screenshot(`customer-${tab}`);
    if (tab === 'tasks') {
      await sheet().locator('tbody input[type=checkbox]').first().check();
      assert.equal(await page.locator('#profilePanelTasks').isVisible(), true);
      await page.locator('.workspace-bulk-bar:visible [data-sheet-clear]').click();
      await sheet().locator('[data-task-action]').first().click();
      await page.getByRole('menuitem', { name: 'Edit task', exact: true }).click();
      assert.equal(await page.locator('#taskTitleInput').isVisible(), true);
      await page.keyboard.press('Escape');
    }
  }
  await page.locator('#customersNavLink').click();
  await page.locator('#createButton').click();
  assert.equal(await page.locator('#onboardingContinue').isDisabled(), true);
  await screenshot('customer-form');
  assert.equal(await page.locator('#customerCreateView').isVisible(), true);
  assert.equal(await page.locator('#customerListView').isVisible(), false);
  assert.match(page.url(), /#new-customer$/);
  assert.equal(await page.locator('#shellBreadcrumbDetail').innerText(), 'Add customer');
  assert.equal(await page.locator('#customerCreateView [aria-modal]').count(), 0, 'Creation is a page');
  await page.locator('#customerCreateCancel').click();
  assert.equal(await page.locator('#customerListView').isVisible(), true);
  await page.locator('#createButton').click();
  await page.locator('#shellBackButton').click();
  await page.waitForURL('**/#customers');
  await page.locator('#createButton').click();
  await page.locator('#customerName').fill('Parity QA family');
  await page.locator('#primaryTravellerName').fill('Parity QA traveller');
  await page.locator('#customerPhone').fill('9876543210');
  const missing = await page.locator('#customerForm').evaluate(form => [...form.elements].filter(e => e.checkValidity && !e.checkValidity()).map(e => e.name));
  assert.deepEqual(missing, [], 'Required customer fields should be valid');
  await page.locator('#onboardingContinue').click();
  await page.locator('#customersNavLink').click();
  await page.locator('#customerSearch').fill('Parity QA family');
  assert.equal(await rows().count(), 1, 'Created customer must appear in the directory');

  await page.locator('#queryNavLink').click();
  assert.equal(await page.locator('#queryListShell').isVisible(), true);
  await checkLayout();
  await screenshot('queries-desktop');
  await page.locator('#queriesSearch').fill('Goa');
  assert.equal(await rows().count(), 1);
  await page.locator('#queriesSearch').fill('');
  await page.locator('[data-query-status="Unassigned"]').click();
  assert.equal(await rows().count(), 2);
  await page.locator('[data-query-status="All"]').click();
  await page.locator('[data-query-action]').first().click();
  await page.getByRole('menuitem', { name: 'Edit query', exact: true }).click();
  assert.equal(await page.locator('#queryPositionBackdrop').isVisible(), true);
  await screenshot('query-edit');
  await page.locator('#queryPositionForm input[name="title"]').fill('Updated parity QA itinerary');
  await page.locator('#queryPositionForm button[type="submit"]').click();
  assert.equal(await page.locator('#queryDetailTitle').innerText(), 'Updated parity QA itinerary');
  await screenshot('query-overview');
  for (const tab of ['proposals', 'travellers', 'documents', 'tasks', 'communication']) {
    await page.locator(`[data-query-detail-tab="${tab}"]`).click();
    await checkLayout();
    await screenshot(`query-${tab}`);
    if (tab === 'tasks') {
      await page.locator('#newQueryTaskButton').click();
      await page.locator('#taskTitleInput').fill('Query context parity QA task');
      await page.locator('#taskModalSubmit').click();
      assert.equal(await sheet().locator('tbody input[type=checkbox]').count(), 1, 'Created task stays linked to its query');
      await screenshot('query-tasks-populated');
      await sheet().locator('tbody input[type=checkbox]').first().check();
      await page.locator('.workspace-bulk-bar:visible [data-sheet-clear]').click();
      await sheet().locator('[data-task-action]').first().click();
      await page.getByRole('menuitem', { name: 'View task', exact: true }).click();
      assert.equal(await page.locator('#taskDetailsBackdrop').isVisible(), true);
      await page.waitForFunction(() => document.getElementById('taskDetailsBackdrop').contains(document.activeElement));
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('#taskDetailsBackdrop').isVisible(), false);
      await page.locator('[data-query-detail-tab="tasks"]').focus();
      await page.keyboard.press('ArrowRight');
      assert.equal(await page.locator('[data-query-detail-tab="communication"]').evaluate(e => e === document.activeElement && e.getAttribute('aria-selected') === 'true'), true);
    }
  }
  await page.locator('#queryNavLink').click();
  await page.locator('[data-query-layout="kanban"]').click();
  assert.equal(await page.locator('#queryKanbanShell').isVisible(), true);
  await page.reload({ waitUntil: 'networkidle' });
  assert.equal(await page.locator('#queryKanbanShell').isVisible(), true, 'Query layout preference survives reload');
  await screenshot('queries-kanban');
  await page.locator('[data-query-layout="list"]').click();

  await page.locator('#tasksNavLink').click();
  await checkLayout();
  await screenshot('tasks-desktop');
  const taskPageSize = await rows().count();
  await page.locator('#taskListPagination').getByRole('button', { name: 'Next page' }).click();
  assert.ok((await page.locator('#taskListPagination').innerText()).includes(`Showing ${taskPageSize + 1}`));
  await page.locator('#taskListPagination').getByRole('button', { name: 'Previous page' }).click();
  await page.locator('[data-task-action]').first().click();
  await page.getByRole('menuitem', { name: 'Edit task', exact: true }).click();
  await page.locator('#taskTitleInput').fill('Updated parity QA task');
  await page.locator('#taskModalSubmit').click();
  await page.locator('#tasksSearch').fill('Updated parity QA task');
  assert.equal(await rows().count(), 1);
  await page.locator('[data-task-action]').first().click();
  await page.getByRole('menuitem', { name: 'Mark completed', exact: true }).click();
  await page.locator('[data-task-view="completed"]').click();
  assert.equal(await rows().count(), 1, 'Completed task must appear in Completed');
  await page.locator('#tasksSearch').fill('');
  await page.locator('[data-task-layout="kanban"]').click();
  await page.reload({ waitUntil: 'networkidle' });
  assert.equal(await page.locator('#taskBoardShell').isVisible(), true, 'Task layout preference survives reload');
  await page.locator('[data-task-layout="list"]').click();

  await page.locator('#inboxNavLink').click();
  await screenshot('inbox-desktop');
  await page.locator('.inbox-conversation').first().click();
  await screenshot('inbox-conversation');
  assert.ok(await page.locator('#inboxThreadPanel').innerText());
  await page.locator('#dashboardNavLink').click();
  await screenshot('home-desktop');
  await page.locator('#dashboardDensityAdvance').click();
  await screenshot('home-advanced');
  await page.locator('#shellSearchLabel').click();
  await page.locator('#globalSearchInput').fill('Jain');
  assert.match(await page.locator('#globalSearchResults').innerText(), /Jain/);
  await page.keyboard.press('Escape');
  await page.locator('#customerNotesButton').click();
  assert.equal(await page.locator('#customerNotesBackdrop').isVisible(), true);
  await page.keyboard.press('Escape');
  await page.locator('#collapseButton').click();
  assert.equal(await page.locator('#appShell').evaluate(e => e.classList.contains('is-collapsed')), true);
  await screenshot('sidebar-collapsed');
  await page.locator('#collapseButton').click();

  for (const width of [1920, 1280, 768, 390]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
    for (const hash of ['customers', 'trip', 'tasks', 'dashboard', 'inbox']) {
      await open(hash);
      await checkLayout();
      await screenshot(`${hash}-${width}`);
      if (width === 390 && hash === 'inbox') {
        await page.locator('.inbox-conversation').first().click();
        assert.equal(await page.locator('.inbox-list-panel').isVisible(), false);
        assert.equal(await page.locator('.inbox-mobile-back').isVisible(), true);
        await screenshot('inbox-conversation-mobile');
        await page.getByRole('button', { name: 'Back to conversations', exact: true }).click();
        assert.equal(await page.locator('.inbox-list-panel').isVisible(), true);
        assert.equal(await page.locator('#inboxThreadPanel').isVisible(), false);
      }
      if (width <= 1000 && hash === 'customers') {
        await page.locator('#mobileNavButton').click();
        assert.equal(await page.locator('#appShell').evaluate(e => e.classList.contains('is-mobile-open')), true);
        await page.keyboard.press('Escape');
      }
      if (hash === 'customers') {
        await page.locator('#createButton').click();
        const geometry = await page.locator('.new-customer-actions').boundingBox();
        assert.ok(geometry.y + geometry.height <= (width === 390 ? 844 : 900), 'Creation actions stay visible');
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
        await page.locator('.customer-onboarding-body').evaluate(element => element.scrollTop = element.scrollHeight);
        assert.equal(await page.locator('#onboardingReferralTitle').isVisible(), true);
        await screenshot(`customer-form-${width}`);
        await page.locator('#customerCreateCancel').click();
      }
    }
    if (width <= 768) {
      await open('customers');
      await rows().first().locator('td').nth(1).click();
      for (const tab of ['overview', 'travellers', 'documents', 'pipeline', 'finance', 'tasks', 'communication']) {
        await page.locator(`[data-profile-tab="${tab}"]`).click();
        if (tab === 'overview') await checkOverviewScroll();
        await checkLayout();
        await screenshot(`customer-${tab}-${width}`);
        if (tab === 'communication') {
          await page.locator('#customerMailComposeButton').click();
          await page.locator('#customerMailSubject').fill('Parity QA communication');
          await page.locator('#customerMailBody').fill('Checking the responsive compose view.');
          assert.equal(await page.locator('#sendCustomerMail').isEnabled(), true);
          const footerBottom = await page.locator('#customerMailComposer > footer').evaluate(element => element.getBoundingClientRect().bottom);
          assert.ok(footerBottom <= (width === 390 ? 844 : 900), 'Compose controls must stay reachable');
          await screenshot(`customer-compose-${width}`);
          await page.locator('#cancelCustomerMail').click();
        }
      }
      await open('trip');
      await rows().first().locator('td').nth(1).click();
      for (const tab of ['overview', 'proposals', 'travellers', 'documents', 'tasks', 'communication']) {
        await page.locator(`[data-query-detail-tab="${tab}"]`).click();
        await checkLayout();
        await screenshot(`query-${tab}-${width}`);
      }
    }
  }
  assert.deepEqual(errors, [], 'No runtime errors or missing local resources');
  console.log('PASS: lists, selection/export, search/filters, records, forms, query editing, task completion, layout persistence, inbox, home, shared shell, and four responsive widths.');
  console.log(`Screenshots: ${output}`);
} finally {
  await browser.close();
}
