import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const baseUrl = process.env.PREVIEW_URL || 'http://localhost:5173';
const output = process.env.QA_OUTPUT || 'artifacts/service-proposals';
const date = (offset) => new Date(Date.now() + offset * 86400000).toISOString().slice(0, 10);
const storageKey = 'paryatech.service-proposals.v1';
const fixtures = [
  { id: 'QRY-QA-GOA', type: 'Accommodation', details: { stayDestination: 'Goa', checkIn: date(10), checkOut: date(13), rooms: '2', mealPlan: 'Breakfast included' } },
  { id: 'QRY-QA-LONDON', type: 'Accommodation', details: { stayDestination: 'London', checkIn: date(10), checkOut: date(13) } },
  { id: 'QRY-QA-FLIGHT', type: 'Flight', details: { flightOrigin: 'MAA', flightDestination: 'DEL', departureDate: date(10), cabinClass: 'Economy', journeyType: 'One way' } },
  { id: 'QRY-QA-RETURN', type: 'Flight', details: { flightOrigin: 'Bengaluru', flightDestination: 'Dubai', departureDate: date(10), returnDate: date(17), cabinClass: 'Economy', preferredAirlines: 'Emirates', journeyType: 'Round trip' } },
  { id: 'QRY-QA-VISA', type: 'Visa', details: { visaCountry: 'Dubai', visaTravelDate: date(10) } },
  { id: 'QRY-QA-TRANSPORT', type: 'Transport', details: { transportDeparture: 'Kochi', transportDestination: 'Munnar', transportStartDate: date(10) } },
  { id: 'QRY-QA-CRUISE', type: 'Cruise', details: { departurePort: 'Singapore', cruiseRegion: 'Singapore', sailingDate: date(10) } },
].map((query) => ({ title: `QA ${query.type}`, status: 'New', customerId: 'CUST-0001', priority: 'Medium', pendingOn: 'Us', owner: 'Rishi Charan', value: 99000, activity: 'Just now', adults: 4, children: 0, infants: 0, ...query }));
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: process.env.BROWSER_EXECUTABLE });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
await context.addInitScript(({ storageKey, fixtures }) => {
  const saved = JSON.parse(localStorage.getItem(storageKey) || '{"queries":[],"proposals":[]}');
  saved.queries = [...(saved.queries || []), ...fixtures.filter((query) => !saved.queries?.some((item) => item.id === query.id))];
  localStorage.setItem(storageKey, JSON.stringify(saved));
}, { storageKey, fixtures });
const page = await context.newPage();
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
const action = (name, value) => page.locator(`[data-service-action="${name}"]${value ? `[data-value="${value}"]` : ''}`).first();
const quote = (key) => page.locator(`[data-service-quote="${key}"]`);
const store = () => page.evaluate((key) => JSON.parse(localStorage.getItem(key)), storageKey);
let visits = 0;
async function open(id) {
  // A different document URL avoids the existing same-document hash fallback.
  await page.goto(`${baseUrl}/?proposal-qa-open=${++visits}#query-${id}`, { waitUntil: 'networkidle' });
  if (!await page.locator('[data-query-detail-action="build-proposal"]:visible').count()) {
    await page.locator('[data-query-detail-tab="proposals"]').click();
  }
  await page.locator('[data-query-detail-action="build-proposal"]:visible').first().click();
}
async function choose(connection) {
  await action('open-service', 'taj-exotica::qa-goa-room').click();
  await action('quote', connection).click();
}
async function fillQuote(amount, reference) {
  await quote('availability').selectOption('Available');
  await quote('description').fill('Garden View · 2 rooms · breakfast · all four travellers');
  await quote('quoteReference').fill(reference);
  await quote('quotedAt').fill(date(0));
  await quote('validUntil').fill(date(2));
  await quote('amount').fill(String(amount));
  await page.getByRole('button', { name: 'Add option', exact: true }).click();
}
try {
  // Check the real catalogue first: never turn generic services into matching
  // flights, foreign hotels or visa products. Positive flows below use fixtures.
  for (const id of ['QRY-2101', 'QRY-2201', 'QRY-2301', 'QRY-2401', 'QRY-2501']) {
    await open(id);
    assert.match(await page.locator('.query-detail-tab-panel').innerText(), /No services or vendors found/);
    assert.equal(await page.locator('[data-service-search]').count(), 0);
    assert.equal(await page.locator('.service-directory-table tbody tr').count(), 0);
    await action('perspective', 'vendors').click();
    assert.match(await page.locator('.query-detail-tab-panel').innerText(), /No services or vendors found/);
  }
  const catalogue = JSON.parse(await readFile(new URL('../data/vendor-service-catalog.json', import.meta.url), 'utf8'));
  const fixtureProducts = {
    'taj-exotica': { id: 'qa-goa-room', maxTravellers: 8, maxRooms: 4, accommodationTypes: ['Hotel', 'Resort'], mealPlans: ['Breakfast included'], vendorIds: ['exhosp', 'wanderlust', 'coastal'] },
    'kerala-flights': { id: 'qa-maa-del-flight', maxTravellers: 6, flightLegs: [{ origin: 'MAA', destination: 'DEL', date: date(10), cabinClasses: ['Economy'] }], vendorIds: ['trailmakers'] },
    'uae-visa': { id: 'qa-uae-tourist', maxTravellers: 4, visaTypes: ['Tourist'], vendorIds: ['atlas-visa'] },
    'kochi-transfer': { id: 'qa-kochi-munnar', origin: 'Kochi', destination: 'Munnar', maxTravellers: 4, vendorIds: ['bluewave'] },
  };
  for (const service of catalogue.services) service.queryProducts = fixtureProducts[service.id] ? [{ ...fixtureProducts[service.id], availableFrom: date(0), availableUntil: date(30) }] : [];
  const returnOffer = { id: 'qa-blr-return', name: 'Bengaluru–Dubai return flights', maxTravellers: 4, vendorIds: ['trailmakers'], flightLegs: [
    { origin: 'BLR', destination: 'DXB', date: date(10), cabinClasses: ['Economy'], airlines: ['Emirates'] },
    { origin: 'DXB', destination: 'BLR', date: date(17), cabinClasses: ['Economy'], airlines: ['Emirates'] },
  ] };
  catalogue.services.find((service) => service.id === 'kerala-flights').queryProducts.push(returnOffer,
    { ...returnOffer, id: 'qa-blr-one-way', name: 'Bengaluru–Dubai one way', flightLegs: [returnOffer.flightLegs[0]] },
    { ...returnOffer, id: 'qa-wrong-return', name: 'Different return destination', flightLegs: [returnOffer.flightLegs[0], { ...returnOffer.flightLegs[1], destination: 'COK' }] });
  await context.route('**/data/vendor-service-catalog.json*', (route) => route.fulfill({ contentType: 'application/javascript', body: `export default ${JSON.stringify(catalogue)};` }));
  await open('QRY-QA-RETURN');
  assert.equal(await page.locator('.service-directory-table tbody tr').count(), 1, 'Only the complete return product appears');
  assert.match(await page.locator('.service-directory-table').innerText(), /Bengaluru–Dubai return flights/);
  assert.doesNotMatch(await page.locator('.service-directory-table').innerText(), /Kerala Flight Ticketing|one way|Different return/);
  await action('perspective', 'vendors').click();
  assert.equal(await page.locator('.service-directory-table tbody tr').count(), 1, 'Only the vendor of the matching return product appears');
  await action('perspective', 'services').click();
  await action('open-service', 'kerala-flights::qa-blr-return').click();
  await action('quote').click();
  assert.equal(await page.locator('[data-service-requirement="endDate"]').inputValue(), date(17));
  await page.screenshot({ path: `${output}/return-flight-fixture.png` });
  await open('QRY-QA-GOA');
  assert.equal((await store()).proposals.length, 0, 'Build does not create a blank proposal');
  assert.equal(await action('save').isDisabled(), true, 'A service selection is required');
  assert.equal(await page.locator('.service-directory-table tbody tr').count(), 1, 'Goa only shows its hotel');
  assert.match(await page.locator('.service-directory-table').innerText(), /Taj Exotica/);
  assert.doesNotMatch(await page.locator('.service-directory-table').innerText(), /Taj Lake Palace/);
  await action('perspective', 'vendors').click();
  assert.equal(await page.locator('.service-directory-table tbody tr').count(), 3, 'All linked suppliers are available');
  await action('vendor-services', 'exhosp').click();
  assert.equal(await page.locator('[data-service-search]').count(), 0, 'Query requirements replace catalogue searches');
  await action('clear-vendor').click();
  await choose('taj-exotica-exhosp');
  assert.equal(await page.locator('[data-service-requirement="destination"]').inputValue(), 'Goa');
  assert.equal(await page.locator('[data-service-requirement="startDate"]').inputValue(), date(10));
  assert.equal(await page.locator('[data-service-requirement="adults"]').inputValue(), '4');
  assert.equal(await page.locator('[data-service-requirement="destination"]').getAttribute('readonly'), '');
  await quote('availability').selectOption('Available');
  await page.getByRole('button', { name: 'Add option', exact: true }).click();
  assert.match(await page.locator('.service-quote-error').innerText(), /reference/);
  await fillQuote(20000, 'GOA-QUOTE-A');
  await choose('taj-exotica-wanderlust');
  await fillQuote(35000, 'GOA-QUOTE-B');
  assert.equal(await page.locator('[aria-label="Proposal service options"] tbody tr').count(), 2);
  await action('save').click();
  const saved = (await store()).proposals[0];
  assert.equal(saved.serviceOptions.length, 2);
  assert.equal(saved.amount, 20000, 'Alternative prices are not added together');
  assert.equal(saved.serviceOptions[0].amountMinor, 2000000);
  assert.equal(saved.serviceOptions[0].rateCardId, 'rc-acc-2627');
  assert.equal(saved.serviceOptions[0].requirements.adults, 4);
  assert.equal(saved.status, 'Draft');
  const blockedChanges = await page.evaluate(async ({ option, query }) => {
    const { quoteBlocker } = await import('/service-proposals.js');
    return ['destination', 'adults', 'rooms', 'mealPlan', 'startDate'].map((key) => {
      const changed = structuredClone(option);
      changed.requirements[key] = { destination: 'London', adults: 2, rooms: 1, mealPlan: 'Room only', startDate: '2027-02-30' }[key];
      return quoteBlocker(changed, query);
    });
  }, { option: saved.serviceOptions[0], query: fixtures[0] });
  blockedChanges.forEach((reason) => assert.ok(reason, 'A quote cannot change the query requirements'));
  assert.equal(await action('share').isEnabled(), true);
  await page.screenshot({ path: `${output}/accommodation-options.png` });
  await action('share').click();
  const body = page.locator('[data-query-mail-body]');
  assert.match(await body.inputValue(), /Option 1: Taj Exotica/);
  assert.match(await body.inputValue(), /Option 2: Taj Exotica/);
  assert.doesNotMatch(await body.inputValue(), /GOA-QUOTE-A/);
  assert.equal((await store()).proposals[0].status, 'Draft', 'Preparing an email does not send it');
  await page.locator('[data-query-mail-send]').click();
  assert.equal((await store()).proposals[0].status, 'Sent');
  await page.reload({ waitUntil: 'networkidle' });
  await page.locator('[data-query-detail-tab="proposals"]').click();
  await page.locator(`[data-itinerary-open="${saved.id}"]`).click();
  assert.equal(await page.locator('[aria-label="Proposal service options"] tbody tr').count(), 2, 'Saved options reopen after reload');
  await page.evaluate((key) => {
    const value = JSON.parse(localStorage.getItem(key)); value.proposals[0].serviceOptions[0].validUntil = '2000-01-01'; localStorage.setItem(key, JSON.stringify(value));
  }, storageKey);
  await page.reload({ waitUntil: 'networkidle' });
  await page.locator('[data-query-detail-tab="proposals"]').click();
  await page.locator(`[data-itinerary-open="${saved.id}"]`).click();
  assert.equal(await action('share').isDisabled(), true, 'Expired quotes cannot be shared');
  assert.match(await page.locator('[aria-label="Proposal service options"]').innerText(), /Reconfirm quote/);
  await action('edit-proposal').click();
  await action('remove-option', saved.serviceOptions[0].id).click();
  await action('save').click();
  assert.equal((await store()).proposals[0].id, saved.id, 'Editing keeps the original proposal');
  assert.equal((await store()).proposals[0].serviceOptions.length, 1);
  assert.equal(await action('share').isEnabled(), true, 'Removing the expired alternative restores readiness');

  for (const id of ['QRY-QA-LONDON', 'QRY-QA-CRUISE']) {
    await open(id);
    assert.match(await page.locator('.query-detail-tab-panel').innerText(), /No services or vendors found/);
    assert.equal(await action('save').isDisabled(), true);
  }
  for (const id of ['QRY-QA-FLIGHT', 'QRY-QA-VISA', 'QRY-QA-TRANSPORT']) {
    await open(id);
    assert.ok(await page.locator('.service-directory-table tbody tr').count() > 0);
    await action('open-service').click(); await action('quote').click();
    await page.getByRole('button', { name: 'Add option', exact: true }).click();
    await action('save').click();
    assert.equal(await action('share').isDisabled(), true, 'An unconfirmed service is only a draft option');
    assert.match(await page.locator('[aria-label="Proposal service options"]').innerText(), /Pending confirmation/);
    assert.equal((await store()).proposals[0].amount, 0, 'The query budget never becomes a supplier price');
  }
  await open('QRY-QA-FLIGHT');
  await action('open-service').click(); await action('quote').click();
  await quote('availability').selectOption('Unavailable');
  await page.getByRole('button', { name: 'Add option', exact: true }).click();
  assert.match(await page.locator('.service-quote-error').innerText(), /available option/);
  assert.equal(await action('save').isDisabled(), true, 'Unavailable routes do not become proposals');
  await page.goto(`${baseUrl}/#query-QRY-2001`);
  await page.locator('[data-query-detail-action="build-proposal"]').first().click();
  assert.equal(await page.locator('[data-proposal-source="scratch"]').count(), 1, 'Trip keeps its itinerary flow');

  for (const width of [1440, 1100, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await open('QRY-QA-GOA');
    const shellWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    assert.ok(shellWidth <= width + 1, 'The page itself does not overflow horizontally');
    await page.screenshot({ path: `${output}/catalogue-${width}.png` });
    await choose('taj-exotica-exhosp');
    assert.equal(await quote('quoteReference').isVisible(), true);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'Quote form fits the page');
    const tabs = page.locator('#queryDetailContent > .query-detail-tabs');
    const before = await tabs.boundingBox();
    await page.locator('#queryDetailTabPanel').evaluate((element) => element.scrollTop = element.scrollHeight);
    assert.equal((await tabs.boundingBox()).y, before.y, 'Query tabs stay fixed while scrolling the quote form');
    await page.locator('#queryDetailTabPanel').evaluate((element) => element.scrollTop = 0);
    await page.screenshot({ path: `${output}/quote-${width}.png` });
  }
  assert.deepEqual(errors, [], 'No runtime errors');
  console.log('PASS: matching services, supplier selection, quote validation, alternative prices, Communication, persistence, expiry, empty results, all query types, Trip parity, and responsive tables.');
} catch (error) {
  console.log(JSON.stringify({ url: page.url(), errors, storage: await store() }));
  await page.screenshot({ path: `${output}/failure.png` });
  throw error;
} finally {
  await browser.close();
}
