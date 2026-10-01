import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const baseUrl = process.env.PREVIEW_URL || 'http://127.0.0.1:5173';
const output = process.env.QA_OUTPUT || 'artifacts/vendor-creation';
const storageKey = 'paryatech-vendor-drafts-v1';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE ? { executablePath: process.env.BROWSER_EXECUTABLE } : {}) });
const errors = [];
const formGeometry = element => ({
  headerHeight: element.querySelector('form > header').getBoundingClientRect().height,
  footerHeight: element.querySelector('form > footer').getBoundingClientRect().height,
  sectionColumns: getComputedStyle(element.querySelector('.onboarding-step')).gridTemplateColumns,
  inputHeight: element.querySelector('input[type="text"]').getBoundingClientRect().height,
});

try {
  for (const width of [1440, 1920, 768, 390]) {
    const page = await browser.newPage({ viewport: { width, height: width === 390 ? 844 : 900 }, reducedMotion: 'reduce' });
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${baseUrl}/#dashboard`, { waitUntil: 'networkidle' });
    await page.locator('#dashboardNewCustomer').click();
    const customerLayout = await page.locator('#customerCreateView').evaluate(formGeometry);
    await page.locator('#shellBackButton').click();
    await page.waitForURL('**/#dashboard');
    await page.locator('#dashboardNewVendor').click();
    assert.match(page.url(), /#new-vendor$/);
    assert.equal(await page.locator('#vendorModalBackdrop').count(), 0, 'Vendor creation uses a page');
    assert.equal(await page.locator('#dashboardView').isVisible(), false);
    assert.equal(await page.locator('#shellBreadcrumbDetail').innerText(), 'Add vendor');
    assert.equal(await page.locator('#vendorsNavLink').getAttribute('aria-current'), 'page');
    assert.match(await page.locator('#customerNotesShortcut').innerText(), /Vendor setup notes/);
    assert.equal(await page.locator('#vendorCreateSubmit').isDisabled(), true);
    assert.deepEqual(await page.locator('#vendorCreateView').evaluate(formGeometry), customerLayout, 'Customer and vendor creation share layout and control sizes');
    await page.screenshot({ path: `${output}/form-${width}.png`, animations: 'disabled' });
    const footer = page.locator('.new-vendor-actions');
    const footerBefore = await footer.boundingBox();
    await page.locator('.vendor-onboarding-body').hover();
    await page.mouse.wheel(0, 5000);
    await page.waitForFunction(() => document.querySelector('.vendor-onboarding-body').scrollTop > 0);
    assert.deepEqual(await footer.boundingBox(), footerBefore, 'Actions remain fixed while the form scrolls');
    assert.ok(footerBefore.y + footerBefore.height <= page.viewportSize().height);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.screenshot({ path: `${output}/scrolled-${width}.png`, animations: 'disabled' });
    await page.locator('#vendorCreateCancel').click();
    await page.waitForURL('**/#dashboard');
    assert.equal(await page.evaluate(key => localStorage.getItem(key), storageKey), null, 'Cancel does not create a draft');
    await page.locator('#dashboardNewVendor').click();
    assert.equal(await page.locator('#vendorName').inputValue(), '');
    await page.locator('#shellBackButton').click();
    await page.waitForURL('**/#dashboard');
    await page.goForward();
    await page.waitForURL('**/#new-vendor');
    await page.reload({ waitUntil: 'networkidle' });
    assert.equal(await page.locator('#vendorCreateView').isVisible(), true, 'Direct routes and reloads work');
    await page.locator('#shellBackButton').click();
    await page.waitForURL('**/#dashboard');
    if (width === 1440) {
      await page.locator('#dashboardNewVendor').click();
      await page.locator('#vendorName').fill('Coral Bay QA');
      assert.equal(await page.locator('#vendorCode').inputValue(), 'V-CORALBAYQA');
      await page.locator('[name="vendorService"][value="Accommodation"]').check();
      const dmc = page.locator('[name="vendorService"][value="DMC/Ground handling"]');
      await dmc.check();
      assert.equal(await page.locator('#vendorDmcFields').isVisible(), true);
      await dmc.uncheck();
      assert.equal(await page.locator('#vendorDmcFields').isVisible(), false);
      await dmc.check();
      await page.locator('#vendorPhone').fill('9876543210');
      await page.locator('#vendorSameAsPhone').locator('..').click();
      assert.equal(await page.locator('#vendorSameAsPhone').isChecked(), true);
      assert.equal(await page.locator('#vendorWhatsapp').inputValue(), '9876543210');
      assert.equal(await page.locator('#vendorWhatsapp').isDisabled(), true);
      await page.locator('#vendorPhone').fill('9876543211');
      assert.equal(await page.locator('#vendorWhatsapp').inputValue(), '9876543211');
      await page.locator('[name="vendorCity"]').fill('Kochi');
      await page.locator('#vendorEmail').fill('invalid-email');
      assert.equal(await page.locator('#vendorCreateSubmit').isDisabled(), true);
      await page.locator('#vendorEmail').fill('qa@coralbay.example');
      await page.locator('[name="vendorNotes"]').fill('Test contact and services');
      assert.equal(await page.locator('#vendorCreateSubmit').isEnabled(), true);
      await page.locator('#vendorCreateSubmit').click();
      await page.waitForURL('**/#dashboard');
      const drafts = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), storageKey);
      assert.equal(drafts.length, 1);
      assert.deepEqual(drafts[0].vendorService, ['Accommodation', 'DMC/Ground handling']);
      assert.equal(drafts[0].vendorWhatsapp, '9876543211');
      assert.equal(drafts[0].status, 'Draft');
      assert.equal(drafts[0].vendorNotes, 'Test contact and services');
      await page.reload({ waitUntil: 'networkidle' });
      assert.equal(await page.evaluate(key => JSON.parse(localStorage.getItem(key)).length, storageKey), 1);
      await page.locator('#dashboardNewVendor').click();
      await page.locator('#vendorName').fill('Coral Bay QA');
      assert.equal(await page.locator('#vendorCode').inputValue(), 'V-CORALBAYQA-2', 'Draft codes remain unique');
    }
    await page.close();
  }
  assert.deepEqual(errors, [], 'No creation page runtime errors');
  console.log('PASS: customer/vendor layout parity, responsive scrolling, fixed actions, validation, navigation, conditional fields, WhatsApp sync, and draft persistence.');
} finally {
  await browser.close();
}
