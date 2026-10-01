import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const baseUrl = process.env.PREVIEW_URL || 'http://127.0.0.1:5173';
const output = process.env.QA_OUTPUT || 'artifacts/reports';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: process.env.BROWSER_EXECUTABLE || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, timezoneId: 'Asia/Kolkata', reducedMotion: 'reduce', acceptDownloads: true });
await context.addInitScript(() => {
  const NativeDate = Date;
  const fixed = new NativeDate('2026-10-01T12:00:00+05:30').getTime();
  window.Date = class extends NativeDate {
    constructor(...args) { super(...(args.length ? args : [fixed])); }
    static now() { return fixed; }
  };
});
const errors = [];
context.on('page', page => {
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.url().startsWith(baseUrl) && response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
});
const page = await context.newPage();
const value = id => page.locator(`[data-metric-id="${id}"]`).innerText();
const openTab = tab => page.locator(`[data-report-tab="${tab}"]`).click();
const range = async (start, end) => {
  // The shared app calendar supplies a visible custom picker over native inputs.
  await page.locator('#reportsStart').evaluate((input, next) => { input.value = next; input.dispatchEvent(new Event('change', { bubbles: true })); }, start);
  await page.locator('#reportsEnd').evaluate((input, next) => { input.value = next; input.dispatchEvent(new Event('change', { bubbles: true })); }, end);
  await page.locator('#reportsPeriodForm').getByRole('button', { name: 'Apply dates' }).click();
};
const noOverflow = async () => assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, 'No page-level horizontal overflow');
const exportForm = () => page.locator('#reportExportForm');
const captureDownload = async (selector, filename) => {
  const downloadPromise = page.waitForEvent('download');
  await page.locator(selector).click();
  const download = await downloadPromise;
  assert.equal(await download.failure(), null);
  await download.saveAs(`${output}/${filename}`);
  return download.suggestedFilename();
};

try {
  await page.goto(`${baseUrl}/#reports`, { waitUntil: 'networkidle' });
  assert.equal(await page.title(), 'Paryatech — Reports');
  assert.equal(await page.locator('#reportsNavLink').getAttribute('aria-current'), 'page');
  assert.equal(await value('customers-total'), '16');
  assert.equal(await value('bookings-risk'), '3');
  await noOverflow();
  await page.locator('#reportsRefresh').click();
  await page.waitForFunction(() => !document.querySelector('#reportsRefresh').disabled);
  assert.equal(await value('customers-total'), '16');

  // Date filtering is inclusive, while snapshots stay at their labelled source date.
  await range('2026-09-25', '2026-09-25');
  assert.equal(await value('finance-receipts'), '₹40,000');
  assert.equal(await value('finance-payments'), '₹30,000');
  await range('2026-10-01', '2026-10-01');
  assert.equal(await value('finance-receipts'), '₹0');
  assert.equal(await value('customers-total'), '16');
  assert.match(await page.locator('.reports-chart-empty').innerText(), /No dated money movements/);
  await range('2026-10-02', '2026-10-01');
  assert.equal(await page.locator('#reportsPeriodError').isVisible(), true);
  assert.equal(await value('finance-receipts'), '₹0');
  await page.locator('#reportsPreset').selectOption('lastWeek');
  assert.equal(await page.locator('#reportsStart').inputValue(), '2026-09-21');
  assert.equal(await page.locator('#reportsEnd').inputValue(), '2026-09-27');
  await page.locator('#reportsPreset').selectOption('yesterday');
  assert.equal(await page.locator('#reportsStart').inputValue(), '2026-09-30');
  await range('2026-09-01', '2026-10-01');
  await page.reload({ waitUntil: 'networkidle' });
  assert.equal(await page.locator('#reportsStart').inputValue(), '2026-09-01');
  assert.equal(await value('finance-receipts'), '₹62,000');
  // The reference charts use real source records, with keyboard and pointer details.
  assert.equal(await page.locator('[data-report-chart]').count(),4);
  assert.equal(await page.locator('.reports-sparkline').count(),4);
  const cashChart=page.locator('#report-cash-title').locator('..').locator('..').locator('..');
  const receiptLegend=cashChart.locator('[data-chart-series="0"]');
  await receiptLegend.click();
  assert.equal(await receiptLegend.getAttribute('aria-pressed'),'false');
  assert.equal(await cashChart.locator('.reports-series-line').count(),1);
  await receiptLegend.click();
  assert.equal(await cashChart.locator('.reports-series-line').count(),2);
  const cashPoints=cashChart.locator('.reports-chart-point');
  await cashPoints.first().focus();
  assert.equal(await page.locator('.reports-chart-tooltip').isVisible(),true);
  assert.match(await page.locator('.reports-chart-tooltip').innerText(),/Receipts/);
  await page.keyboard.press('ArrowRight');
  assert.equal(await cashPoints.nth(1).evaluate(element=>element===document.activeElement),true);
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('.reports-chart-tooltip').isVisible(),false);
  await cashChart.locator('.reports-chart-data summary').click();
  const bucketReceipts=await cashChart.locator('tbody tr').evaluateAll(rows=>rows.map(row=>Number(row.cells[1].textContent.replace(/[^\d.-]/g,''))));
  assert.equal(bucketReceipts.reduce((sum,amount)=>sum+amount,0),62000,'Chart buckets reconcile to the period receipts');
  await cashChart.locator('.reports-chart-data summary').click();
  await page.screenshot({ path: `${output}/overview-desktop.png` });

  await page.locator('[data-report-metric="customers-total"]').click();
  assert.match(await page.locator('#reportDrillRange').innerText(), /of 16 records/);
  await page.getByRole('button', { name: 'Next records' }).click();
  assert.match(await page.locator('#reportDrillRange').innerText(), /13–16/);
  await page.getByRole('button', { name: 'Previous records' }).click();
  await page.locator('[data-report-record="0"]').click();
  assert.match(page.url(), /#customer-CUST-0001$/);
  await page.locator('#shellBackButton').click();
  await page.waitForURL(/#reports$/);
  assert.equal(await page.locator('#reportsView').isVisible(), true);

  await openTab('finance');
  assert.equal(await value('finance-cash'), '₹2,46,800');
  assert.equal(await value('finance-receivables'), '₹92,000');
  assert.equal(await value('finance-payables'), '₹72,000');
  await page.locator('[data-report-related="finance:0"]').click();
  assert.equal(await page.locator('#reportDrillTitle').innerText(), 'Outstanding obligations');
  assert.equal(await page.locator('#reportDrillBody tbody tr').count(), 5);
  await page.locator('[data-report-record="0"]').click();
  assert.match(await page.locator('#reportRecordDetail').innerText(), /Applied/);
  await page.keyboard.press('Escape');
  await page.screenshot({ path: `${output}/finance-desktop.png` });

  await openTab('directory');
  await page.locator('#reportsKpiSearch').fill('transfer');
  assert.ok(await page.locator('#reportsDirectoryRows tr').count() >= 3);
  assert.equal(await page.locator('#reportsKpiSearch').evaluate(input => input === document.activeElement), true);
  await page.locator('#reportsKpiSearch').fill('Response-time');
  assert.match(await page.locator('#reportsDirectoryRows').innerText(), /Awaiting data/);
  await page.locator('#reportsKpiSearch').fill('');
  await page.locator('#reportsKpiGroup').selectOption('finance');
  assert.match(await page.locator('#reportsDirectoryRows').innerText(), /26 Sept 2026/);
  await page.screenshot({ path: `${output}/directory-desktop.png` });
  await page.locator('#reportsSources').click();
  assert.match(await page.locator('#reportSourceBody').innerText(), /not historical balances/);
  await page.keyboard.press('Escape');

  await page.locator('#reportsBranding').click();
  await exportForm().locator('[name="company"]').fill('Acme Travels');
  await exportForm().locator('[name="preparedBy"]').fill('Operations team');
  await exportForm().locator('[name="contact"]').fill('acme.example · reports@acme.example');
  await exportForm().locator('[name="footer"]').fill('Acme Travels · Confidential');
  await exportForm().locator('[name="accent"]').fill('#244d76');
  await page.locator('#reportLogoFile').setInputFiles('assets/paryatech-mark.png');
  await page.waitForFunction(() => document.querySelector('#reportLogoPreview').src.startsWith('data:image/png'));
  await page.locator('[data-export-action="save"]').click();
  await page.reload({ waitUntil: 'networkidle' });
  await page.locator('#reportsDownload').click();
  assert.equal(await exportForm().locator('[name="company"]').inputValue(), 'Acme Travels');
  assert.match(await page.locator('#reportLogoPreview').getAttribute('src'), /^data:image\/png/);
  await page.screenshot({ path: `${output}/branded-template-desktop.png` });

  // All three exports are exercised through the real user download controls.
  for (const template of ['executive', 'operations', 'finance']) {
    await exportForm().locator(`[name="template"][value="${template}"]`).check();
    if (template === 'executive') await exportForm().locator('[name="definitions"]').check();
    const filename = await captureDownload('[data-export-action="pdf"]', `${template}.pdf`);
    assert.match(filename, new RegExp(`acme-travels-${template}-2026-09-01-to-2026-10-01\\.pdf$`));
    assert.equal(await page.locator('#reportExportError').isVisible(), false);
  }
  const filename = await captureDownload('[data-export-action="csv"]', 'finance.csv');
  assert.match(filename, /\.csv$/);
  const csv = await readFile(`${output}/finance.csv`, 'utf8');
  assert.match(csv, /Acme Travels/);
  assert.match(csv, /Recorded receipts/);
  assert.match(csv, /62000/);
  assert.match(csv, /"-45800"/);
  assert.doesNotMatch(csv, /"'-45800"/);
  assert.match(csv, /2026-09-01/);
  await exportForm().locator('[name="section"]').evaluateAll(inputs => inputs.forEach(input => input.checked = false));
  await page.locator('[data-export-action="csv"]').click();
  assert.match(await page.locator('#reportExportError').innerText(), /at least one/);
  await page.keyboard.press('Escape');

  // Inspect the actual print document, without opening a system print dialog in QA.
  await page.evaluate(() => {
    const append = document.body.append.bind(document.body);
    document.body.append = (...nodes) => {
      for (const node of nodes) if (node.tagName === 'IFRAME') node.addEventListener('load', () => { node.contentWindow.print = () => { node.dataset.qaPrinted = 'true'; }; }, { once: true });
      return append(...nodes);
    };
  });
  await page.locator('#reportsPrint').click();
  await page.waitForFunction(() => document.querySelector('iframe[title="Printable company report"]')?.dataset.qaPrinted === 'true');
  const print = page.frameLocator('iframe[title="Printable company report"]');
  assert.match(await print.locator('body').innerText(), /Acme Travels/);
  assert.match(await print.locator('body').innerText(), /Outstanding obligations/);
  assert.match(await print.locator('body').innerText(), /01 Sept 2026 - 01 Oct 2026/);
  await page.locator('iframe[title="Printable company report"]').evaluate(frame => frame.remove());

  await openTab('overview');
  for (const width of [390, 768, 1280, 1920]) {
    await page.setViewportSize({ width, height: 950 });
    await page.waitForTimeout(300);
    assert.ok(await page.locator('[data-report-chart] svg').evaluateAll(charts=>charts.every(chart=>{const box=chart.getBoundingClientRect();return box.width>100&&box.right<=innerWidth&&box.left>=0;})),'Charts fit their responsive columns');
    await noOverflow();
    const dates=await page.locator('.reports-period-bar .themed-date').evaluateAll(items=>items.map(item=>{const r=item.getBoundingClientRect();return {left:r.left,right:r.right,width:r.width};}));
    assert.ok(dates.every(date=>date.width>=120),'Both calendar controls retain usable width');
    assert.ok(dates[0].right<=dates[1].left,'From and To controls do not overlap');
    await page.screenshot({ path: `${output}/overview-${width}.png` });
    await page.locator('#reportsDownload').click();
    assert.equal(await page.locator('[data-export-action="pdf"]').isVisible(), true);
    const box = await page.locator('[data-export-action="pdf"]').boundingBox();
    assert.ok(box.x >= 0 && box.x + box.width <= width && box.y + box.height <= 950, 'Download control fits the viewport');
    await page.screenshot({ path: `${output}/export-${width}.png` });
    await page.keyboard.press('Escape');
  }
  await page.setViewportSize({width:1440,height:1000});
  await openTab('operations');
  const overdueBefore=Number(await value('tasks-overdue'));
  await page.locator('[data-report-metric="tasks-overdue"]').click();
  await page.locator('[data-report-record="0"]').click();
  assert.equal(await page.locator('#taskDetailsBackdrop').isVisible(),true);
  await page.locator('#taskCompleteButton').click();
  assert.equal(Number(await value('tasks-overdue')),overdueBefore-1,'Completing a task updates the report');
  const unreadBefore=Number(await value('inbox-unread'));
  await page.locator('[data-report-metric="inbox-unread"]').click();
  await page.locator('[data-report-record="0"]').click();
  assert.match(page.url(),/#inbox$/);
  await page.locator('#reportsNavLink').click();
  assert.ok(Number(await value('inbox-unread'))<unreadBefore,'Reading an inbox record updates report state');
  await page.locator('[data-report-metric="documents-expired"]').click();
  assert.match(await page.locator('#reportDrillBody').innerText(),/CUST-0001-DOC-/,'Legacy vault rows receive stable references');
  await page.locator('[data-report-record="0"]').click();
  assert.equal(await page.locator('#profilePanelDocuments').isVisible(),true);
  await page.locator('#reportsNavLink').click();
  await openTab('sales');
  assert.equal(await value('catalog-proposals-updated'),'6','Month-first source dates participate in period reporting');
  await page.locator('[data-report-metric="queries-open"]').click();
  await page.locator('[data-report-record="0"]').click();
  assert.match(page.url(),/#query-QRY-/);
  await page.locator('#reportsNavLink').click();
  await page.locator('#reportsDownload').click();
  const savedLogo=await page.locator('#reportLogoPreview').getAttribute('src');
  await page.locator('#reportResetLogo').click();
  await page.keyboard.press('Escape');
  await page.locator('#reportsDownload').click();
  assert.equal(await page.locator('#reportLogoPreview').getAttribute('src'),savedLogo,'Closing an unsaved branding edit preserves the saved logo');
  await page.keyboard.press('Escape');
  assert.deepEqual(errors, []);
  console.log('Reports browser: navigation, range filtering, snapshots, drills, directory, saved branding, 3 PDFs, CSV, printing and responsive layouts passed.');
} finally {
  await browser.close();
}
