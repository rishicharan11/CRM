import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { buildReport, presetRange, previousRange, validRange, recordDate, periodLength } from '../reports-model.js';

const reference = JSON.parse(await readFile(new URL('../data/report-reference.json', import.meta.url)));
const data = { reference, customers: [], queries: [], proposals: [], tasks: [], inbox: [], documents: [], vouchers: [], ledger: [] };
const now = new Date('2026-10-01T12:00:00');
const report = range => buildReport(data, range, now);
const metric = (result, id) => result.metrics.find(row => row.id === id);
assert.deepEqual(presetRange('yesterday', '2026-10-01'), { start: '2026-09-30', end: '2026-09-30' });
assert.deepEqual(presetRange('lastWeek', '2026-10-01'), { start: '2026-09-21', end: '2026-09-27' });
assert.deepEqual(presetRange('lastWeek', '2026-09-28'), { start: '2026-09-21', end: '2026-09-27' });
assert.deepEqual(presetRange('lastMonth', '2026-03-01'), { start: '2026-02-01', end: '2026-02-28' });
assert.deepEqual(presetRange('lastMonth', '2024-03-01'), { start: '2024-02-01', end: '2024-02-29' });
assert.deepEqual(previousRange({ start: '2026-09-25', end: '2026-09-26' }), { start: '2026-09-23', end: '2026-09-24' });
assert.equal(periodLength({ start: '2026-01-01', end: '2026-01-01' }), 1);
assert.equal(validRange({ start: '2026-02-29', end: '2026-03-01' }), false);
assert.equal(validRange(null), false);
assert.equal(validRange(undefined), false);
assert.equal(validRange({ start: '2026-10-02', end: '2026-10-01' }), false);
assert.equal(recordDate('Yesterday'), '');
assert.equal(recordDate('September 2026'), '');
assert.equal(recordDate('2026-02-31'), '');
assert.equal(recordDate('31 Feb 2026'), '');
assert.deepEqual(presetRange('all', '2027-02-15'), { start: '2027-01-01', end: '2027-02-15' });
assert.equal(recordDate('18–22 Aug'), '');
assert.equal(recordDate('25 Sep 2026'), '2026-09-25');
assert.equal(recordDate('Sep 27, 2026'), '2026-09-27');
assert.equal(recordDate('Feb 31, 2026'), '');

const september = report({ start: '2026-09-01', end: '2026-09-30' });
assert.equal(metric(september, 'finance-receipts').value, 62000);
assert.equal(metric(september, 'finance-verified').value, 50000);
assert.equal(metric(september, 'finance-payments').value, 107800);
assert.equal(metric(september, 'finance-net').value, -45800);
assert.equal(metric(september, 'finance-expenses').value, 84800);
assert.equal(metric(september, 'finance-receivables').value, 92000);
assert.equal(metric(september, 'finance-payables').value, 72000);
assert.equal(metric(september, 'finance-cash').value, 246800);
assert.equal(metric(september, 'finance-pending').value, 12000);
assert.equal(metric(september, 'finance-unmatched').value, 7500);
assert.equal(metric(september, 'finance-bank-difference').value, 750);
assert.equal(metric(september, 'finance-refund-due').value, 18000);
assert.equal(metric(september, 'finance-margin').value, 25000);
assert.equal(metric(september, 'finance-forecast').value, 258300);
assert.equal(metric(september, 'finance-forecast-min').value, 181800);
assert.equal(metric(september, 'finance-audit').value, reference.finance.ACTIVITY.length);
assert.equal(metric(september, 'bookings-total').value, 7);
assert.equal(metric(september, 'bookings-risk').value, 3);
assert.equal(metric(september, 'vendor-tasks').value, 5);
assert.equal(metric(september, 'catalog-proposals-updated').value, 6);
assert.equal(metric(report({start:'2026-08-01',end:'2026-08-31'}),'packages-updated').value,3);
assert.equal(september.trend.reduce((sum, bucket) => sum + bucket.incoming, 0), 62000);
assert.equal(september.trend.reduce((sum, bucket) => sum + bucket.outgoing, 0), 107800);

const day = report({ start: '2026-09-25', end: '2026-09-25' });
assert.equal(metric(day, 'finance-receipts').value, 40000);
assert.equal(metric(day, 'finance-payments').value, 30000);
assert.equal(metric(day, 'finance-payments').before, 2800);
const october = report({ start: '2026-10-01', end: '2026-10-01' });
assert.equal(metric(october, 'finance-receipts').value, 0);
assert.equal(metric(october, 'finance-cash').value, 246800);
assert.equal(metric(october, 'finance-receivables').value, 92000);
assert.deepEqual(october.chartData.collectionsAgeing.map(row=>row.values),[[80000,0,0,0,0],[0,12000,0,0,0]],'Ageing uses the Finance snapshot date, not today or the chosen report end');
assert.equal(october.chartData.collectionsAgeing.flatMap(row=>row.values).reduce((sum,value)=>sum+value,0),metric(october,'finance-receivables').value);
assert.equal(october.chartData.customerMix.reduce((sum,row)=>sum+row.value,0),metric(october,'customers-total').value);
assert.equal(october.groups.find(row => row.id === 'bookings').undated, 7);

data.documents = [{id:'D1',name:'Month-only expiry',status:'Expiring soon',expiry:'September 2026'},{id:'D2',name:'Full expiry date',status:'Valid',expiryDate:'2026-10-15'},{id:'D3',name:'Future month label',status:'Valid',expiry:'October 2026'}];
data.tasks = [
  { id: 'T1', title: 'Overdue', status: 'Open', createdAt: '2026-09-25T12:00:00', dueDate: '2026-09-30', assignee: 'Unassigned', followUp: true },
  { id: 'T2', title: 'Done', status: 'Done', createdAt: '2026-09-26T12:00:00', dueDate: '2026-09-20' },
  { id: 'T3', title: 'Cancelled', status: 'Cancelled', dueDate: '2026-09-20' },
  { id: 'T4', title: 'Due today', status: 'Blocked', createdAt: '2026-09-24T12:00:00', dueDate: '2026-10-01' },
];
data.proposals = [
  { id: 'P1', status: 'Sent', amount: 1000, sentAt: '25 Sep 2026', validUntil: '30 Sep 2026' },
  { id: 'P2', status: 'Draft', amount: 2000, createdAt: '2026-09-25' },
  { id: 'P3', status: 'Accepted', amount: 3000, sentAt: '26 Sep 2026' },
];
data.queries = [{ id: 'Q1', status: 'Won', value: 1000 }, { id: 'Q2', status: 'Lost', value: 1000 }, { id: 'Q3', status: 'New', value: 1000 }];
const work = report({ start: '2026-09-25', end: '2026-09-26' });
assert.equal(metric(work, 'documents-expired').value, 1);
assert.equal(metric(work, 'documents-expiring').value, 1);
assert.equal(metric(work, 'tasks-created').value, 2);
assert.equal(metric(work, 'tasks-overdue').value, 1);
assert.equal(metric(work, 'tasks-followup').value, 1);
assert.equal(metric(work, 'tasks-open').value, 2);
assert.equal(metric(work, 'proposals-issued').value, 2);
assert.equal(metric(work, 'proposals-value').value, 4000);
assert.equal(metric(work, 'proposals-accepted').value, 1);
assert.equal(metric(work, 'proposals-expired').value, 1);
assert.equal(metric(work, 'query-win-rate').value, 50);
assert.equal(metric(work, 'pipeline-value').value, 1000);
assert.equal(new Set(work.metrics.map(row => row.id)).size, work.metrics.length);
assert.ok(work.metrics.every(row => Number.isFinite(row.value)), 'No NaN or infinite indicators');
console.log(`Reports model: date boundaries, ${work.metrics.length} indicators, paise conversion, cash scopes and snapshot invariance passed.`);
