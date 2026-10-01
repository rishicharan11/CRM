export const currency = value => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value || 0);
export const dateLabel = value => value ? new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value.slice(0, 10) + 'T12:00:00')) : 'Date not recorded';
export function dateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function recordDate(value) {
  if (!value) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return validRange({start:value,end:value}) ? value : '';
  // A relative label such as Yesterday or 18–22 Aug is not a timestamp.
  const humanDay=String(value).match(/^(\d{1,2}) [A-Za-z]+,? \d{4}$/)?.[1] || String(value).match(/^[A-Za-z]+ (\d{1,2}),? \d{4}$/)?.[1];
  if (!/^\d{4}-\d{2}-\d{2}[T ]/.test(String(value)) && !humanDay) return '';
  const parsed = new Date(value);
  if (/^\d{4}-\d{2}-\d{2}/.test(value) && !validRange({start:value.slice(0,10),end:value.slice(0,10)})) return '';
  if (humanDay && parsed.getDate() !== Number(humanDay)) return '';
  return Number.isNaN(parsed.getTime()) ? '' : dateKey(parsed);
}
const shift = (key, days) => { const date = new Date(key + 'T12:00:00'); date.setDate(date.getDate() + days); return dateKey(date); };
export function periodLength(range) { return Math.round((Date.parse(range.end) - Date.parse(range.start)) / 86400000) + 1; }
export function validRange(range) {
  if (!range || typeof range !== 'object') return false;
  return [range.start, range.end].every(value => /^\d{4}-\d{2}-\d{2}$/.test(value || '') && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value) && range.start <= range.end;
}
export function presetRange(preset, today = dateKey()) {
  const date = new Date(today + 'T12:00:00');
  const monthStart = dateKey(new Date(date.getFullYear(), date.getMonth(), 1));
  if (preset === 'today') return { start: today, end: today };
  if (preset === 'yesterday') return { start: shift(today, -1), end: shift(today, -1) };
  if (preset === 'last7') return { start: shift(today, -6), end: today };
  if (preset === 'lastWeek') {
    const monday = shift(today, -((date.getDay() + 6) % 7));
    return { start: shift(monday, -7), end: shift(monday, -1) };
  }
  if (preset === 'thisMonth') return { start: monthStart, end: today };
  if (preset === 'lastMonth') return { start: dateKey(new Date(date.getFullYear(), date.getMonth() - 1, 1)), end: shift(monthStart, -1) };
  if (preset === 'all') return { start: today.slice(0,4)+'-01-01', end: today };
  return { start: shift(today, -29), end: today };
}
export function previousRange(range) { return { start: shift(range.start, -periodLength(range)), end: shift(range.start, -1) }; }
export const inRange = (value, range) => Boolean(value && value >= range.start && value <= range.end);
const sum = (rows, key) => rows.reduce((total, row) => total + Number(row[key] || 0), 0);
const activeTask = row => !['Done', 'Cancelled'].includes(row.status);
const normal = (kind, row, overrides = {}) => ({ id: row.id, kind, title: row.title || row.name || row.party || row.id,
  status: row.status || '', date: recordDate(row.createdAt || row.date), amount: Number(row.value || row.amount || 0),
  owner: row.owner || row.assignee || '', details: {}, ...overrides });
export const GROUPS = [
  { id: 'customers', title: 'Customers', area: 'sales', icon: 'nav-customer', description: 'Customer mix, travellers and the CRM account balance.' },
  { id: 'queries', title: 'Queries', area: 'sales', icon: 'file', description: 'Current sales pipeline, ownership and closed-query outcomes.' },
  { id: 'proposals', title: 'Proposals', area: 'sales', icon: 'file', description: 'Customer proposals issued in the selected period.' },
  { id: 'catalogProposals', title: 'Catalogue proposals', area: 'sales', icon: 'file', description: 'Proposal records from the finalized Packages module.' },
  { id: 'bookings', title: 'Bookings', area: 'operations', icon: 'booking', description: 'Booking stages, service risk and the next operational action.' },
  { id: 'tasks', title: 'Tasks & follow-ups', area: 'operations', icon: 'tasks', description: 'Task creation, due work, blockers and ownership.' },
  { id: 'inbox', title: 'Inbox', area: 'operations', icon: 'inbox', description: 'Unread conversations and customers waiting for a reply.' },
  { id: 'documents', title: 'Documents', area: 'operations', icon: 'file', description: 'Customer document readiness and expiry checks.' },
  { id: 'vouchers', title: 'Vouchers', area: 'operations', icon: 'file', description: 'Issued service references and travel dates.' },
  { id: 'packages', title: 'Packages', area: 'operations', icon: 'package', description: 'Catalogue publication and package updates.' },
  { id: 'vendors', title: 'Vendor CRM', area: 'operations', icon: 'vendor', description: 'Supplier coverage, rate cards and compliance follow-ups.' },
  { id: 'finance', title: 'Agency finance', area: 'finance', icon: 'nav-finance', description: 'Recorded movements, expenses, obligations and financial controls.' },
  { id: 'customerLedger', title: 'Customer ledger', area: 'finance', icon: 'wallet', description: 'CRM receipts and refunds, kept separate from Agency finance.' },
];

export function buildReport(data, range, now = new Date()) {
  if (!validRange(range)) throw new Error('Select a valid start and end date.');
  const ref = data.reference;
  const today = dateKey(now), previous = previousRange(range);
  const rows = {};
  rows.customers = data.customers.map(row => normal('customer', row, { status: row.category, amount: row.reportBooked ?? row.value, owner: row.contactName || '',
    details: { Category: row.category, Tier: row.tier, Location: row.location, Travellers: row.travellers, 'Lifetime booked value': currency(row.reportBooked ?? row.value), 'CRM outstanding': currency(row.reportOutstanding) } }));
  rows.queries = data.queries.map(row => normal('query', row, { details: { Type: row.type, Priority: row.priority, 'Pending on': row.pendingOn, Customer: row.customerId, 'Expected value': currency(row.value) } }));
  rows.proposals = data.proposals.map(row => normal('proposal', row, { date: recordDate(row.sentAt || row.createdAt), amount: row.amount, details: { Customer: row.customerId, 'Linked query': row.linkedQuery, 'Issued on': dateLabel(recordDate(row.sentAt)), 'Valid until': dateLabel(recordDate(row.validUntil)), Value: currency(row.amount) } }));
  rows.catalogProposals = ref.proposals.map(row=>normal('catalog-proposal',row,{title:row.name,date:recordDate(row.updated),amount:row.value,details:{Customer:row.customer,'Updated on':dateLabel(recordDate(row.updated)),Value:currency(row.value)}}));
  rows.tasks = data.tasks.map(row => normal('task', row, { amount:0, due: recordDate(row.dueDate), details: { Priority: row.priority, Assignee: row.assignee, 'Related to': `${row.entityType} · ${row.entity}`, 'Related record value':currency(row.value), 'Due date': dateLabel(recordDate(row.dueDate)), 'Follow-up': row.followUp ? 'Yes' : 'No' } }));
  rows.inbox = data.inbox.map(row => normal('inbox', row, { title: row.name, status: row.messages.some(message => message.direction === 'incoming' && !message.read) ? 'Unread' : 'Read',
    amount: 0, waiting: row.messages.at(-1)?.direction === 'incoming', unread: row.messages.filter(message => message.direction === 'incoming' && !message.read).length,
    details: { Channel: row.channel, Messages: row.messages.length, 'Last message': row.messages.at(-1)?.subject || 'No messages', Customer: row.customerId } }));
  rows.documents = data.documents.map(row => normal('document', row, { title: row.name, date: recordDate(row.uploadedAt || row.createdAt), expiry: recordDate(row.expiryDate || row.expiry), expiryMonth: /^(?:[A-Za-z]+) \d{4}$/.test(row.expiry||'') ? dateKey(new Date(row.expiry)).slice(0,7) : '', details: { Customer: row.customerName, Traveller: row.traveller, Type: row.type, 'Valid until': row.expiryDate || row.expiry || 'Not recorded' }, customerId: row.customerId }));
  rows.documents.forEach(row=>{if(row.expiry&&row.expiry<today||row.expiryMonth&&row.expiryMonth<today.slice(0,7))row.status='Expired';});
  const requests=(data.requests||[]).map(row=>normal('document',row,{title:`${row.customerName} · ${row.traveller}`,customerId:row.customerId,details:{Traveller:row.traveller,Types:row.types.join(', '),Message:row.message}}));
  rows.vouchers = (data.vouchers||[]).map(row=>normal('voucher',row,{title:row.title,date:recordDate(row.serviceDate),details:{Customer:row.customerId,Type:row.type,Reference:row.reference,'Service date':dateLabel(recordDate(row.serviceDate)),Summary:row.serviceSummary}}));
  rows.bookings = ref.bookings.map(row => normal('booking', row, { details: { Stage: row.stage, 'Travel label': row.travel, 'Next action': row.nextAction, 'Finance state': row.financeStatus, Ownership: row.queue } }));
  rows.packages = ref.packages.map(row => normal('package', row, { date: recordDate(row.updated), amount: row.startingPrice,
    details: { Destination: row.destination, Region: row.region, 'Starting price': currency(row.startingPrice), 'Updated on': dateLabel(recordDate(row.updated)), Source: row.source } }));
  rows.vendors = ref.vendors.map(row => normal('vendor', row, { details: { Location: row.location, Owner: row.owner, Categories: row.categories.join(', '), 'Updated label': row.updated } }));
  const transactions = ref.finance.TRANSACTIONS.map(row => normal('transaction', row, { title: `${row.type} · ${row.party}`, date: recordDate(row.occurredAt), amount: row.amount / 100, status: row.verification,
    direction: row.direction, transactionType: row.type, details: { 'Occurred on': dateLabel(recordDate(row.occurredAt)), Account: row.account, Allocation: row.allocation, 'Bank match': row.bankMatch, Reference: row.externalReference, Linked: row.linked } }));
  const expenses = ref.finance.EXPENSES.map(row => normal('expense', row, { title: `${row.category} · ${row.payee}`, date: row.incurred, amount: row.amount / 100, status: row.payment, details: { Scope: row.scope, Review: row.review, Evidence: row.evidence, Due: dateLabel(row.due) } }));
  const obligations = ref.finance.OBLIGATIONS.map(row => normal('obligation', row, { title: `${row.party} · ${row.item}`, date: row.postedAt, amount: (row.amount - row.applied) / 100, status: row.documentState,
    due: row.due, obligationKind: row.kind, owner: row.owner, details: { Booking: row.booking, Document: row.document, 'Original obligation': currency(row.amount / 100), Applied: currency(row.applied / 100), Remaining: currency((row.amount - row.applied) / 100), Due: dateLabel(row.due), Note: row.note } }));
  rows.customerLedger = data.ledger.map(row => normal('customer-ledger', row, { title: `${row.customerName} · ${row.description}`, status: row.direction === 'Debit' ? 'Receipt' : 'Refund', amount: row.amount, details: { Customer: row.customerId, Description: row.description, Reference: row.detail, 'CRM direction': row.direction } }));
  rows.finance = [...transactions, ...expenses];
  const groups = GROUPS.map(group => ({ ...group, metrics: [], records: rows[group.id], source: ['finance'].includes(group.id) ? `Finance sample · ${dateLabel(ref.finance.REVIEW_DATE)}` : ['vendors','packages','bookings','catalogProposals'].includes(group.id) ? 'Finalized module sample' : 'Customer workspace' }));
  const metrics = [];
  const add = (groupId, id, label, records, options = {}) => {
    const group = groups.find(group => group.id === groupId);
    const selected = options.period ? records.filter(row => inRange(row[options.dateField || 'date'], range)) : records;
    const calc = list => options.calc ? options.calc(list) : options.sum ? sum(list, options.sum) : list.length;
    const value = calc(selected);
    const before = options.period ? calc(records.filter(row => inRange(row[options.dateField || 'date'], previous))) : null;
    const formatted = options.unit === 'money' ? currency(value) : options.unit === 'percent' ? `${Number(value.toFixed(1))}%` : Number(value).toLocaleString('en-IN');
    const metric = { id, groupId, label, value, formatted, unit: options.unit || 'count', basis: options.period ? 'Selected period' : 'Snapshot', description: options.description || '',
      source: options.source || group.source, records: selected, before, delta: before === null ? null : value - before, tone: options.tone || 'neutral', dateBasis: options.period ? (options.dateBasis || 'Record date') : (groupId==='finance'?`Source snapshot dated ${dateLabel(ref.finance.REVIEW_DATE)}; not filtered by report dates`:'Current records; not filtered by report dates') };
    metrics.push(metric); group.metrics.push(metric); return metric;
  };
  add('customers','customers-total','Customers',rows.customers,{description:'All customer records in this workspace. Creation timestamps are not available for every seed record.'});
  add('customers','travellers-total','Travellers',rows.customers,{calc:()=>sum(data.customers,'travellers'),description:'Traveller counts on current customer records.'});
  add('customers','customer-booked','Lifetime booked value',rows.customers,{unit:'money',sum:'amount',description:'Customer CRM lifetime values. Not recognized revenue and not combined with Agency finance.'});
  add('customers','customer-balance','CRM outstanding',rows.customers,{unit:'money',calc:()=>sum(data.customers,'reportOutstanding'),description:'Sum of the same current customer-ledger balances shown on Customer Finance tabs.'});
  const openQueries = rows.queries.filter(row=>!['Won','Lost'].includes(row.status));
  add('queries','queries-open','Open queries',openQueries,{description:'All query stages except Won and Lost.'});
  add('queries','pipeline-value','Open pipeline value',openQueries,{unit:'money',sum:'amount',description:'Expected value of open queries; not receipts or booked revenue.'});
  add('queries','queries-unassigned','Unassigned queries',rows.queries.filter(row=>!row.owner||row.owner==='Unassigned'),{tone:'warning',description:'Queries with no assigned owner.'});
  add('queries','queries-won','Won queries',rows.queries.filter(row=>row.status==='Won'),{description:'Current Won stage; not wins occurring within the selected report dates.'});
  add('queries','queries-lost','Lost queries',rows.queries.filter(row=>row.status==='Lost'),{description:'Current Lost stage; not losses occurring within the selected report dates.'});
  const closed = rows.queries.filter(row=>['Won','Lost'].includes(row.status));
  add('queries','query-win-rate','Closed-query win rate',closed,{unit:'percent',calc:list=>list.length?list.filter(row=>row.status==='Won').length/list.length*100:0,description:'Won ÷ (Won + Lost). Current stage distribution; no historical conversion cohort is implied.'});
  const issued = rows.proposals.filter(row=>row.date&&row.status!=='Draft');
  add('proposals','proposals-issued','Proposals issued',issued,{period:true,dateBasis:'Issued / sent date',description:'Customer proposals with an issued date inside the selected inclusive period.'});
  add('proposals','proposals-value','Issued proposal value',issued,{period:true,unit:'money',sum:'amount',dateBasis:'Issued / sent date',description:'Face value of proposals issued in the period; not revenue.'});
  add('proposals','proposals-accepted','Accepted in issued cohort',issued,{period:true,calc:list=>list.filter(row=>row.status==='Accepted').length,dateBasis:'Issued / sent date',description:'Current accepted status of proposals issued in this period. Acceptance timestamps are not stored.'});
  add('proposals','proposals-expired','Expired open proposals',rows.proposals.filter(row=>['Sent','Changes requested'].includes(row.status)&&recordDate(data.proposals.find(item=>item.id===row.id)?.validUntil)<today&&recordDate(data.proposals.find(item=>item.id===row.id)?.validUntil)),{tone:'warning',description:'Still-open customer proposals whose validity ended before today.'});
  add('catalogProposals','catalog-proposals','Catalogue proposals',rows.catalogProposals,{description:'Proposal records in the finalized Packages module, separate from Customer proposals.'});
  add('catalogProposals','catalog-proposals-updated','Catalogue proposals updated',rows.catalogProposals,{period:true,dateBasis:'Last-updated date',description:'Current catalogue proposal records with a last update in this period; not proposal issue dates.'});
  add('catalogProposals','catalog-proposals-accepted','Accepted catalogue proposals',rows.catalogProposals.filter(row=>row.status==='Accepted'),{description:'Current accepted proposals in the finalized catalogue sample.'});
  add('bookings','bookings-total','Bookings',rows.bookings,{description:'Unique booking records from the Booking module, not supplier booking views added together.'});
  add('bookings','bookings-risk','At-risk bookings',rows.bookings.filter(row=>row.status==='At risk'),{tone:'danger',description:'Booking records explicitly marked At risk.'});
  add('bookings','bookings-upcoming','Upcoming bookings',rows.bookings.filter(row=>row.details.Stage==='upcoming'),{description:'Current upcoming stage as stored in the reference sample. Travel labels do not contain a complete year.'});
  add('bookings','bookings-unassigned','Unassigned bookings',rows.bookings.filter(row=>row.details.Ownership==='unassigned'),{tone:'warning',description:'Booking records in the Unassigned ownership queue.'});
  for(const [stage,label] of [['travelling','Travelling now'],['completed','Completed bookings'],['cancelled','Cancelled bookings']]) add('bookings','bookings-'+stage,label,rows.bookings.filter(row=>row.details.Stage===stage),{description:'Current booking stage in the reference register, not a period transition count.'});
  add('tasks','tasks-open','Open tasks',rows.tasks.filter(activeTask),{description:'Tasks currently active, including Backlog, Open, InProgress and Blocked; excludes Done and Cancelled.'});
  add('tasks','tasks-done','Completed tasks',rows.tasks.filter(row=>row.status==='Done'),{description:'Current Done status. Completion dates are not stored.'});
  add('tasks','tasks-unassigned','Unassigned tasks',rows.tasks.filter(row=>activeTask(row)&&(!row.owner||row.owner==='Unassigned')),{description:'Currently active tasks with no assigned owner.'});
  add('tasks','tasks-created','Tasks created',rows.tasks,{period:true,dateBasis:'Creation timestamp',description:'All task records created during the selected period, across the team.'});
  add('tasks','tasks-due','Tasks due in period',rows.tasks.filter(activeTask),{period:true,dateField:'due',dateBasis:'Due date',description:'Tasks still open whose due date falls inside this period.'});
  add('tasks','tasks-overdue','Overdue tasks',rows.tasks.filter(row=>activeTask(row)&&row.due&&row.due<today),{tone:'danger',description:'Currently active tasks due before today, excluding Done and Cancelled.'});
  add('tasks','tasks-blocked','Blocked tasks',rows.tasks.filter(row=>row.status==='Blocked'),{tone:'warning',description:'Tasks in the current Blocked state.'});
  add('tasks','tasks-followup','Open follow-ups',rows.tasks.filter(row=>activeTask(row)&&row.details['Follow-up']==='Yes'),{description:'Active tasks marked as a follow-up.'});
  add('inbox','inbox-unread','Unread conversations',rows.inbox.filter(row=>row.unread),{description:'Conversations containing at least one incoming unread message.'});
  add('inbox','inbox-unread-messages','Unread messages',rows.inbox.filter(row=>row.unread),{sum:'unread',description:'Incoming messages not yet marked read.'});
  add('inbox','inbox-waiting','Awaiting our reply',rows.inbox.filter(row=>row.waiting),{tone:'warning',description:'Conversations where the latest message is incoming. No response-time SLA is inferred.'});
  add('documents','documents-total','Customer documents',rows.documents,{description:'Documents from the customer vault and uploaded request documents.'});
  add('documents','documents-expired','Expired documents',rows.documents.filter(row=>row.status==='Expired'||row.expiry&&row.expiry<today),{tone:'danger',description:'Known expiry date before today, a past expiry month, or an explicit Expired state.'});
  add('documents','documents-expiring','Expiring in 30 days',rows.documents.filter(row=>row.expiry&&row.expiry>=today&&row.expiry<=shift(today,30)),{tone:'warning',description:'Known complete expiry date from today through the next 30 days, inclusive. Month-only expiry labels are excluded from this dated window.'});
  add('documents','documents-review','Documents to review',rows.documents.filter(row=>/review|approval|pending/i.test(row.status)),{description:'Documents with a review, approval or pending state.'});
  add('documents','documents-requests','Awaiting document upload',requests.filter(row=>row.status==='Sent'),{tone:'warning',description:'Sent document requests still awaiting upload. Received files awaiting approval are counted in Documents to review.'});
  add('documents','documents-requested','Document requests created',requests,{period:true,dateBasis:'Request creation timestamp',description:'Document requests with a creation timestamp inside this period, whether sent or received.'});
  groups.find(group=>group.id==='documents').relatedRegisters=[{title:'Document requests',description:'Current customer upload requests and their review / delivery state.',records:requests}];
  add('vouchers','vouchers-services','Service vouchers in period',rows.vouchers.filter(row=>row.details.Type!=='Invoice'),{period:true,dateBasis:'Service date',description:'Issued service vouchers whose service date falls in the selected period. Not new booking counts.'});
  add('vouchers','vouchers-confirmed','Confirmed service vouchers',rows.vouchers.filter(row=>row.details.Type!=='Invoice'&&row.status==='Confirmed'),{description:'Currently confirmed flight, stay, activity and attraction references.'});
  add('packages','packages-published','Published packages',rows.packages.filter(row=>row.status==='Published'),{description:'Published records in the finalized package catalogue. Starting prices are not sales.'});
  add('packages','packages-draft','Draft packages',rows.packages.filter(row=>row.status==='Draft'),{description:'Draft records awaiting publication.'});
  add('packages','packages-updated','Packages updated',rows.packages,{period:true,dateBasis:'Last-updated date',description:'Packages whose most recent recorded update falls in this period. Not a count of every edit.'});
  add('vendors','vendors-active','Active vendors',rows.vendors.filter(row=>row.status==='Active'),{description:'Active supplier records in the reference Vendor CRM catalogue.'});
  add('vendors','vendor-services','Supplier services',ref.services.map(row=>normal('service',row,{status:row.status,details:{Category:row.category,Location:row.location}})),{description:'Service directory entries, counted once per service ID.'});
  add('vendors','vendor-ratecards','Published rate cards',ref.rateCards.filter(row=>row.status==='published').map(row=>normal('rate-card',row,{title:row.title,status:row.status,details:{Validity:row.validity,Category:row.category}})),{description:'Published rate-card records; validity ranges are shown in the source details.'});
  const compliance = ref.compliance.map(row=>normal('compliance',row,{title:row.name,status:row.validUntil&&row.validUntil<today?'Expired':row.status,owner:row.ownerName,details:{Reference:row.reference,'Valid until':dateLabel(row.validUntil)}}));
  add('vendors','vendor-compliance','Compliance follow-ups',compliance.filter(row=>['Expired','expired','expiring','awaiting'].includes(row.status)),{tone:'warning',description:'Supplier documents expired, approaching expiry, or awaiting signature / evidence.'});
  const vendorTasks=ref.vendorTasks.map(row=>normal('vendor-task',row,{owner:row.assigneeName,details:{Context:row.context,Assignee:row.assigneeName,'Due label':row.due}}));
  add('vendors','vendor-tasks','Open vendor tasks',vendorTasks.filter(row=>row.status!=='Done'),{description:'Open tasks from the Vendor CRM sample, kept separate from the Customer task register. Relative due labels cannot support dated counts.'});
  const external = transactions.filter(row=>row.direction!=='neutral');
  add('finance','finance-receipts','Recorded receipts',external.filter(row=>row.direction==='in'),{period:true,unit:'money',sum:'amount',dateBasis:'Money occurrence date',description:'Recorded incoming payments, including pending verification. Advances are included once; internal transfers are excluded.'});
  add('finance','finance-verified','Verified receipts',external.filter(row=>row.direction==='in'&&row.status==='Verified'),{period:true,unit:'money',sum:'amount',dateBasis:'Money occurrence date',description:'Only recorded receipts whose current verification status is Verified. This is not a verification-event date report.'});
  add('finance','finance-payments','Recorded outgoing',external.filter(row=>row.direction==='out'),{period:true,unit:'money',sum:'amount',dateBasis:'Money occurrence date',description:'Supplier / agency payments and recorded refunds. Internal transfers are excluded.'});
  add('finance','finance-net','Net recorded movement',external,{period:true,unit:'money',calc:list=>list.reduce((total,row)=>total+(row.direction==='in'?row.amount:-row.amount),0),dateBasis:'Money occurrence date',description:'Recorded incoming less outgoing cash movements, excluding transfers. Not profit.'});
  add('finance','finance-expenses','Expenses incurred',expenses,{period:true,unit:'money',sum:'amount',dateBasis:'Expense incurred date',description:'Expense records counted once when incurred, separately from cash payments. Includes approved unpaid reimbursements.'});
  const financialSource = `Finance snapshot · ${dateLabel(ref.finance.REVIEW_DATE)}`;
  add('finance','finance-receivables','Agency receivables',obligations.filter(row=>row.obligationKind==='customer'),{unit:'money',sum:'amount',source:financialSource,description:'Customer obligations less verified applied receipts, at the Finance source snapshot. Pending proof does not settle debt.'});
  add('finance','finance-payables','Outgoing obligations',obligations.filter(row=>row.obligationKind!=='customer'),{unit:'money',sum:'amount',source:financialSource,description:'Supplier balances plus approved unpaid reimbursements. Supplier bills do not add a second commitment.'});
  add('finance','finance-cash','Recorded bank & cash',ref.finance.ACCOUNTS.map(row=>normal('account',row,{title:row.name,amount:row.recorded/100,status:row.lastReview,details:{Account:row.meta}})),{unit:'money',sum:'amount',source:financialSource,description:'Recorded account balances at the Finance snapshot; not reconstructed historical bank balances.'});
  add('finance','finance-pending','Receipts awaiting verification',transactions.filter(row=>row.transactionType==='Receipt'&&row.status!=='Verified'),{unit:'money',sum:'amount',source:financialSource,tone:'warning',description:'Existing receipt proof pending verification. These amounts remain in receivables until applied.'});
  add('finance','finance-bank-difference','Bank statement difference',[],{unit:'money',calc:()=>ref.finance.statementDifference/100,source:financialSource,tone:'warning',description:'Statement closing balance less the recorded HDFC balance. Unmatched credits are a separate reconciliation item.'});
  add('finance','finance-advances','Unallocated customer advance',[normal('advance',ref.finance.CUSTOMER_ADVANCE,{amount:ref.finance.CUSTOMER_ADVANCE.amount/100,status:'Unallocated',date:ref.finance.CUSTOMER_ADVANCE.recorded,details:{Receipt:ref.finance.CUSTOMER_ADVANCE.receipt}})],{unit:'money',sum:'amount',source:financialSource,description:'Party-owned advance not applied to an invoice. Not subtracted from another customer’s receivable.'});
  add('finance','finance-refund-due','Approved refund due',[normal('refund',ref.finance.REFUND,{amount:ref.finance.REFUND.amount/100,status:ref.finance.REFUND.state,details:{Booking:ref.finance.REFUND.booking,Due:dateLabel(ref.finance.REFUND.due)}})],{unit:'money',sum:'amount',source:financialSource,description:'Approved refund still due, distinct from a recorded paid refund and supplier recovery.'});
  add('finance','finance-margin','Projected booking margin',obligations.filter(row=>row.details.Booking==='BK-2026-000003'),{unit:'money',calc:()=>ref.finance.bookingProjectedMargin/100,source:financialSource,description:'Accepted sell price less confirmed supplier commitments for BK-2026-000003 only. Not agency-wide realized profit.'});
  const forecasts=ref.finance.FORECAST.map((row,index)=>normal('forecast',{id:`forecast-${index}`,title:row.source},{amount:row.amount/100,status:row.basis,date:recordDate(`${row.date} ${ref.finance.REVIEW_DATE.slice(0,4)}`),details:{Reference:row.reference,Basis:row.basis}}));
  add('finance','finance-forecast','Forecast closing cash',forecasts,{unit:'money',calc:()=>ref.finance.forecastClosing/100,source:financialSource,description:'Reference forecast starting from recorded bank and cash, plus scheduled movements. Forecast is not actual cash received.'});
  add('finance','finance-forecast-min','Forecast minimum cash',forecasts,{unit:'money',calc:()=>ref.finance.forecastMinimum/100,source:financialSource,description:'Minimum running cash in the same reference forecast schedule.'});
  const auditEvents=ref.finance.ACTIVITY.map(row=>normal('finance-event',row,{title:row.event,date:recordDate(row.occurredAt),status:row.category,owner:row.actor,details:{Actor:row.actor,Record:row.recordId,Party:row.party,Context:row.context,'Occurred at':row.occurredAt,'Recorded at':row.recordedAt,Detail:row.detail}}));
  add('finance','finance-audit','Finance audit events',auditEvents,{period:true,dateBasis:'Event occurrence timestamp',description:'Recorded activity events that occurred in the selected period. Audit events do not create additional money movements.'});
  add('finance','finance-unmatched','Unmatched statement credit',[],{unit:'money',calc:()=>ref.finance.unmatchedStatementRow/100,source:financialSource,tone:'warning',description:'Unmatched bank credit still awaiting reconciliation, separate from the closing statement difference and recorded receipts.'});
  groups.find(group=>group.id==='finance').relatedRegisters=[{title:'Outstanding obligations',description:'Source snapshot obligations, with applied amounts and due dates. Not filtered by the report period.',records:obligations},{title:'Cash forecast schedule',description:'Scheduled movements from the source snapshot. Forecast movements are separate from recorded cash.',records:forecasts}];
  groups.find(group=>group.id==='vendors').relatedRegisters=[{title:'Supplier services',description:'Current service directory in the finalized module sample.',records:ref.services.map(row=>normal('service',row,{details:{Category:row.category,Location:row.location}}))},{title:'Rate cards',description:'Current rate-card register with publication state and validity labels.',records:ref.rateCards.map(row=>normal('rate-card',row,{details:{Validity:row.validity,Category:row.category}}))},{title:'Supplier compliance',description:'Current document states with expiry checked against today.',records:compliance},{title:'Vendor tasks',description:'Tasks from the separate Vendor CRM sample. Relative labels retain their source wording.',records:vendorTasks}];
  add('finance','finance-missing-bills','Supplier bills missing',obligations.filter(row=>row.obligationKind==='supplier'&&row.status==='Bill not received'),{source:financialSource,tone:'warning',description:'Confirmed supplier commitments whose bill has not been received; cost is already represented in the obligation.'});
  add('customerLedger','crm-receipts','CRM receipts',rows.customerLedger.filter(row=>row.status==='Receipt'),{period:true,unit:'money',sum:'amount',dateBasis:'CRM ledger date',description:'Dated receipts recorded in Customer ledgers. Separate sample scope from Agency finance; never added to its receipts.'});
  add('customerLedger','crm-refunds','CRM refunds',rows.customerLedger.filter(row=>row.status==='Refund'),{period:true,unit:'money',sum:'amount',dateBasis:'CRM ledger date',description:'Dated Customer ledger credits presented as refunds, matching the existing CRM ledger.'});
  groups.forEach(group=>{
    group.periodRecords = group.records.filter(row=>inRange(row.date,range));
    group.undated = group.records.filter(row=>!row.date).length;
  });
  const lookup = id => metrics.find(metric=>metric.id===id);
  const alerts = [
    ['tasks-overdue','danger','Resolve overdue work','Open task details and confirm the next owner or due date.'],
    ['bookings-risk','danger','Bookings need attention','Review the pending supplier action before releasing vouchers.'],
    ['queries-unassigned','warning','Assign query owners','Give every open request an accountable owner.'],
    ['inbox-waiting','warning','Customers await a reply','Continue the existing conversation with the next update.'],
    ['documents-expired','danger','Renew customer documents','Check validity before travel or visa submission.'],
    ['vendor-compliance','warning','Follow up supplier documents','Renew expired evidence and collect pending signatures.'],
    ['finance-pending','warning','Verify receipt proof','Apply verified receipts to the matching customer obligation.'],
    ['finance-bank-difference','warning','Explain the bank difference','Match statements to existing money records without duplicating them.'],
  ].map(([id,tone,title,action])=>({metric:lookup(id),tone,title,action})).filter(alert=>alert.metric.value>0);
  const sourceRows = transactions.filter(row=>inRange(row.date,range)&&row.direction!=='neutral');
  const bins = Math.min(periodLength(range), 14), size = Math.ceil(periodLength(range)/bins);
  const trend = Array.from({length:Math.ceil(periodLength(range)/size)},(_,index)=>{
    const start=shift(range.start,index*size),end=[shift(start,size-1),range.end].sort()[0];
    const items=sourceRows.filter(row=>inRange(row.date,{start,end}));
    return {start,end,incoming:sum(items.filter(row=>row.direction==='in'),'amount'),outgoing:sum(items.filter(row=>row.direction==='out'),'amount')};
  });
  const customerMix = ['B2C','B2B','Sub-Agent','Other'].map(label=>({label,value:rows.customers.filter(row=>label==='Other'?!['B2C','B2B','Sub-Agent'].includes(row.status):row.status===label).length}));
  const ageingSeries = ['Not due','1–30 days','31–60 days','61–90 days','90+ days'];
  const collectionsAgeing = obligations.filter(row=>row.obligationKind==='customer'&&row.amount>0).map(row=>{
    // Age the source balances at their source date, not the selected report end.
    const days=Math.round((Date.parse(ref.finance.REVIEW_DATE)-Date.parse(row.due))/86400000);
    const bucket=days<=0?0:days<=30?1:days<=60?2:days<=90?3:4;
    return {label:ref.finance.OBLIGATIONS.find(item=>item.id===row.id).party,values:ageingSeries.map((_,index)=>index===bucket?row.amount:0)};
  });
  return {range:{...range},previous,today,generatedAt:now.toISOString(),groups,metrics,alerts,trend,reference:ref,
    chartData:{customerMix,collectionsAgeing,ageingSeries},
    pipeline:['Unassigned','New','Quoting','Negotiation','Won','Lost'].map(status=>({status,count:rows.queries.filter(row=>row.status===status).length})),
    periodActivity:transactions.filter(row=>inRange(row.date,range)),
    overviewIds:['finance-receipts','finance-payments','tasks-created','proposals-issued','pipeline-value','customers-total','bookings-risk','tasks-overdue'],
    notes:[
      'Date ranges are inclusive and use your local calendar. Period metrics use the date basis shown in the KPI directory.',
      'Snapshot indicators do not change with report dates. Customer records reflect the current workspace; Agency Finance balances are a sample snapshot dated '+dateLabel(ref.finance.REVIEW_DATE)+'.',
      'Records without complete timestamps remain in snapshot indicators and are excluded from dated activity.',
      'Customer CRM and Agency Finance use separate sample scopes. Their balances and receipt totals are never added together.',
      'Recorded receipts may await verification. Transfers are excluded from incoming/outgoing totals; expenses, obligations and payments are tracked separately to prevent double counting.',
    ],
    unavailable:[
      {label:'New customers by day',groupId:'customers',description:'A complete creation date is not recorded for every customer.'},
      {label:'Query conversion over time',groupId:'queries',description:'Query creation and Won/Lost transition timestamps are not recorded.'},
      {label:'Response-time SLA',groupId:'inbox',description:'Full message timestamps and a configured SLA are required.'},
      {label:'Tasks completed in period',groupId:'tasks',description:'Completion timestamps are not stored; current Done status is available.'},
      {label:'Agency-wide realized profit',groupId:'finance',description:'A reconciled revenue-recognition and cost ledger is required.'},
      {label:'Historical balances by report date',groupId:'finance',description:'Historical settlements and account snapshots are required.'},
    ],
  };
}
