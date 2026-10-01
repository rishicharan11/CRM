import { build } from 'esbuild';
import { access, readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const root = fileURLToPath(new URL('..', import.meta.url));
const reference = resolve(root, '../pakages-module');
const output = resolve(root, 'data/report-reference.json');
try { await access(resolve(reference, 'finance-module/src/financeModel.ts')); }
catch { await access(output); console.log('Reports: using the bundled reference snapshot.'); process.exit(0); }

const app = await readFile(resolve(reference, 'src/App.tsx'), 'utf8');
// Extract the actual catalogue fixtures without loading the React application.
const start = app.indexOf('const packages: PackageRecord[] =');
const end = app.indexOf('const navIcon', start);
if (start < 0 || end < 0) throw new Error('Package catalogue fixtures could not be located.');
const catalogue = app.slice(start, end).replace('const packages: PackageRecord[]', 'const packages').replace('const proposals: ProposalRecord[]', 'const proposals');
const result = await build({ stdin: { contents: `
  import * as finance from './finance-module/src/financeModel.ts';
  import { VENDORS } from './vendor-crm/src/data/vendors.ts';
  import { DIRECTORY_SERVICES, VENDOR_SERVICE_CONNECTIONS } from './vendor-crm/src/data/vendorDirectory.ts';
  import { RATE_CARDS } from './vendor-crm/src/data/rateCards.ts';
  import { COMPLIANCE_DOCS } from './vendor-crm/src/data/vendorFinance.ts';
  import { OPEN_VENDOR_TASKS, DONE_VENDOR_TASKS } from './vendor-crm/src/data/tasks.ts';
  const baliImage='',dubaiImage='',himachalImage='',keralaImage='',rajasthanImage='';
  const packageDaysForProposal = () => [];
  ${catalogue}
  export {finance,VENDORS,DIRECTORY_SERVICES,VENDOR_SERVICE_CONNECTIONS,RATE_CARDS,COMPLIANCE_DOCS,OPEN_VENDOR_TASKS,DONE_VENDOR_TASKS,packages,proposals};
  `, resolveDir: reference, loader: 'ts' }, bundle: true, platform: 'node', format: 'cjs', write: false });
const module = { exports: {} };
new Function('module', 'exports', result.outputFiles[0].text)(module, module.exports);
const source = module.exports;
const text = value => String(value || '').replace(/<[^>]*>/g, '').replaceAll('&amp;', '&').replaceAll('&nbsp;', ' ').replace(/\s+/g, ' ').trim();
const bookingHtml = await readFile(resolve(reference, 'booking-module/booking-redesign.html'), 'utf8');
const bookingList = bookingHtml.slice(bookingHtml.indexOf('<div id="bkBody">'), bookingHtml.indexOf('id="bkEmpty"'));
const bookings = bookingList.split(/<div class="row bk-row"/).slice(1).map(fragment => ({
  id: text(fragment.match(/class="bk-id">([\s\S]*?)<\/div>/)?.[1]),
  title: text(fragment.match(/class="ell bk-title">([\s\S]*?)<\/div>/)?.[1]),
  stage: fragment.match(/data-stage="([^"]+)"/)?.[1] || '',
  queue: fragment.match(/data-queue="([^"]+)"/)?.[1] || '',
  status: text(fragment.match(/class="st-cap [^"]+">([\s\S]*?)<\/span>/)?.[1]),
  travel: text(fragment.match(/class="bk-line mono primary-cell">([\s\S]*?)<\/div>/)?.[1]),
  nextAction: text(fragment.match(/class="ell (?:primary-cell|muted-cell)"[^>]*>([\s\S]*?)<\/div>/)?.[1]),
  financeStatus: text(fragment.match(/class="bk-fin">[\s\S]*?class="st-cap [^"]+">([\s\S]*?)<\/span>/)?.[1]),
}));
if (bookings.length !== 7 || bookings.some(row => !row.id)) throw new Error('Booking fixture extraction changed; review the source before syncing.');
const pick = (row, keys) => Object.fromEntries(keys.map(key => [key, row[key]]));
const finance = Object.fromEntries(['REVIEW_DATE','OBLIGATIONS','TRANSACTIONS','EXPENSES','ACCOUNTS','ACTIVITY','FORECAST','CUSTOMER_ADVANCE','REFUND','statementDifference','unmatchedStatementRow','bookingProjectedMargin','recordedCash','forecastClosing','forecastMinimum'].map(key => [key, source.finance[key]]));
const snapshot = {
  schemaVersion: 1,
  capturedAt: new Date().toISOString(),
  description: 'Local sample records from the finalized Packages, Booking, Vendor CRM and Finance modules. Not a live cross-application connection.',
  finance,
  bookings,
  packages: source.packages.map(row => pick(row, ['id','name','destination','region','startingPrice','updated','status','source'])),
  proposals: source.proposals.map(row => pick(row, ['id','name','customer','value','updated','status','travelStart','travelEnd'])),
  vendors: source.VENDORS.map(row => pick(row, ['id','code','name','status','location','owner','categories','updated','setup'])),
  services: source.DIRECTORY_SERVICES,
  connections: source.VENDOR_SERVICE_CONNECTIONS,
  rateCards: source.RATE_CARDS.map(row => pick(row, ['id','ref','title','category','status','validity','coverageCount'])),
  compliance: source.COMPLIANCE_DOCS.map(row => pick(row, ['id','name','validUntil','status','ownerName','reference'])),
  vendorTasks: [...source.OPEN_VENDOR_TASKS, ...source.DONE_VENDOR_TASKS],
};
await mkdir(resolve(root, 'data'), { recursive: true });
await writeFile(output, JSON.stringify(snapshot, null, 2) + '\n');
console.log(`Reports: synced ${bookings.length} bookings, ${snapshot.packages.length} packages, ${snapshot.vendors.length} vendors and ${finance.TRANSACTIONS.length} finance transactions.`);
