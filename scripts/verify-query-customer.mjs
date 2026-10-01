import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const baseUrl = process.env.PREVIEW_URL || 'http://127.0.0.1:5175';
const output = process.env.QA_OUTPUT || 'artifacts/query-customer-selector';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE ? { executablePath: process.env.BROWSER_EXECUTABLE } : {}) });
const errors = [];

try {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 1280, height: 600 }, { width: 390, height: 844 }]) {
    const page = await browser.newPage({ viewport, reducedMotion: 'reduce' });
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${baseUrl}/#trip`, { waitUntil: 'networkidle' });
    await page.locator('#createQueryButton').click();
    await page.locator('[data-query-type="Trip"]').click();
    assert.equal(await page.locator('#queryCustomerSearch').count(), 0, 'The duplicate search field is removed');
    const select = page.locator('#queryCustomer');
    const anchor = select.locator('..');
    const trigger = anchor.locator('.themed-btn');
    const action = page.locator('#queryCreateCustomerButton');
    const selectorBox = await trigger.boundingBox();
    const actionBox = await action.boundingBox();
    assert.equal(actionBox.height, selectorBox.height, 'Customer controls have matching heights');
    if (viewport.width > 650) assert.equal(actionBox.y, selectorBox.y, 'The action aligns with the selector');
    else {
      assert.equal(actionBox.x, selectorBox.x, 'Mobile controls share the same left edge');
      assert.equal(actionBox.width, selectorBox.width, 'Mobile controls share the same width');
    }
    await page.screenshot({ path: `${output}/form-${viewport.width}.png`, animations: 'disabled' });
    await trigger.click();
    const list = anchor.locator('.themed-pick-list');
    const search = anchor.getByRole('searchbox', { name: 'Search customers' });
    assert.equal(await list.getByRole('option').count(), await select.locator('option').count(), 'Every customer is available');
    const popBox = await anchor.locator('.themed-pop').boundingBox();
    if (viewport.width > 650) {
      const bodyBox = await page.locator('#queryForm .onboarding-body').boundingBox();
      assert.ok(popBox.y >= bodyBox.y && popBox.y + popBox.height <= bodyBox.y + bodyBox.height + 1, 'The picker fits inside the modal body');
    }
    assert.ok(popBox.x >= 0 && popBox.x + popBox.width <= viewport.width, 'The picker fits horizontally');
    const body = page.locator('#queryForm .onboarding-body');
    const bodyScroll = await body.evaluate(element => element.scrollTop);
    await list.hover();
    await page.mouse.wheel(0, 1000);
    await page.waitForFunction(element => element.scrollTop > 0, await list.elementHandle());
    await page.mouse.wheel(0, 1000);
    await page.waitForTimeout(150);
    assert.equal(await body.evaluate(element => element.scrollTop), bodyScroll, 'Wheel scrolling stays inside the list');
    await page.screenshot({ path: `${output}/scrolled-${viewport.width}.png`, animations: 'disabled' });
    const lastValue = await select.locator('option').last().getAttribute('value');
    await list.getByRole('option').last().click();
    assert.equal(await select.inputValue(), lastValue, 'The final customer can be selected after scrolling');
    await trigger.click();
    await search.fill('CUST-0015');
    assert.equal(await list.getByRole('option').count(), 1, 'Customer ID search works');
    await list.getByRole('option').click();
    assert.equal(await select.inputValue(), 'CUST-0015');
    await trigger.click();
    await search.fill('no-such-customer');
    assert.equal(await list.getByRole('option').count(), 0);
    assert.equal(await list.innerText(), 'No matches found.');
    await search.fill('');
    await search.press('ArrowDown');
    await page.keyboard.press('End');
    await page.keyboard.press('Enter');
    assert.equal(await select.inputValue(), lastValue, 'Keyboard navigation reaches the final customer');
    if (viewport.width === 1440) {
      await action.click();
      await page.locator('#queryNewCustomerName').fill('Selector QA customer');
      await page.locator('#queryNewCustomerPhone').fill('9876543210');
      await page.locator('#queryNewCustomerEmail').fill('selector-qa@example.com');
      await page.locator('#querySaveCustomerButton').click();
      assert.match(await trigger.innerText(), /Selector QA customer/, 'Inline creation selects the new customer');
      const createdValue = await select.inputValue();
      for (const term of ['9876543210', 'selector-qa@example.com']) {
        await trigger.click();
        await search.fill(term);
        await list.getByRole('option', { name: /Selector QA customer/ }).click();
        assert.equal(await select.inputValue(), createdValue, 'Contact search remains available in the dropdown');
      }
    }
    await page.close();
  }
  assert.deepEqual(errors, [], 'The query form produces no runtime errors');
  console.log('PASS: customer alignment, wheel scrolling, selection, keyboard navigation, search, and inline creation on desktop, short desktop, and mobile.');
} finally {
  await browser.close();
}
