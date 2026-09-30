import { enhanceListSheet, readLayoutPreference, saveLayoutPreference, initializeWorkspaceParity } from './workspace-parity.js';

const customers = [
  { name: 'Jain Family', id: 'CUST-0001', category: 'B2C', tier: 'Gold', location: 'Hyderabad', travellers: 4, value: 300000, outstanding: 100000, trips: 2 },
  { name: 'Rishi Charan', id: 'CUST-0002', category: 'B2B', tier: 'Silver', location: 'Bengaluru', travellers: 2, value: 185000, outstanding: 25000, trips: 1 },
  { name: 'Pragyam Soni', id: 'CUST-0003', category: 'Sub-Agent', tier: 'Bronze', location: 'Mumbai', travellers: 2, value: 25000, outstanding: 0, trips: 1 },
  { name: 'Yakshith', id: 'CUST-0004', category: 'Other', tier: 'Bronze', location: 'Mangalore', travellers: 1, value: 50000, outstanding: 15000, trips: 1 },
  { name: 'Aarav Singh', id: 'CUST-0005', category: 'B2C', tier: 'Gold', location: 'Delhi', travellers: 3, value: 245000, outstanding: 40000, trips: 2 },
  { name: 'Sonia Bhatia', id: 'CUST-0006', category: 'B2B', tier: 'Silver', location: 'Pune', travellers: 1, value: 110000, outstanding: 30000, trips: 1 },
  { name: 'Manish Kumar', id: 'CUST-0007', category: 'Sub-Agent', tier: 'Gold', location: 'Chennai', travellers: 4, value: 420000, outstanding: 75000, trips: 3 },
  { name: 'Vani Patel', id: 'CUST-0008', category: 'Other', tier: 'Bronze', location: 'Ahmedabad', travellers: 2, value: 90000, outstanding: 12000, trips: 1 },
  { name: 'Rohan Ghosh', id: 'CUST-0009', category: 'B2C', tier: 'Gold', location: 'Kolkata', travellers: 2, value: 80000, outstanding: 18000, trips: 1, groupType: 'Family' },
  { name: 'Neha Sharma', id: 'CUST-0010', category: 'B2C', tier: 'Silver', location: 'Noida', travellers: 4, value: 110000, outstanding: 32000, trips: 2, groupType: 'Family' },
  { name: 'Deepak Prasad', id: 'CUST-0011', category: 'B2C', tier: 'Bronze', location: 'Lucknow', travellers: 1, value: 30000, outstanding: 8000, trips: 1, groupType: 'Family' },
  { name: 'Tanvi Singh', id: 'CUST-0012', category: 'B2C', tier: 'Gold', location: 'Jaipur', travellers: 2, value: 95000, outstanding: 24000, trips: 2, groupType: 'Family' },
  { name: 'Ankit Kapoor', id: 'CUST-0013', category: 'B2C', tier: 'Silver', location: 'Surat', travellers: 1, value: 22000, outstanding: 6500, trips: 1, groupType: 'Family' },
  { name: 'Maya Joshi', id: 'CUST-0014', category: 'B2C', tier: 'Bronze', location: 'Indore', travellers: 3, value: 60000, outstanding: 12000, trips: 1, groupType: 'Family' },
  { name: 'Rahul Agarwal', id: 'CUST-0015', category: 'B2C', tier: 'Gold', location: 'Ghaziabad', travellers: 5, value: 200000, outstanding: 72000, trips: 3, groupType: 'Family' },
  { name: 'Pooja Qureshi', id: 'CUST-0016', category: 'B2C', tier: 'Silver', location: 'Vadodara', travellers: 4, value: 40000, outstanding: 11000, trips: 1, groupType: 'Family' },
];

function taskDateOffset(days) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function taskTimestampOffset(days, hours = 0) {
  return new Date(Date.now() + ((days * 24) + hours) * 60 * 60 * 1000).toISOString();
}

const customerNotesByCustomer = new Map([
  ['CUST-0001', [
    { id: 'NOTE-1002', body: 'Customer asked to keep two adjacent rooms for the children and confirm airport transfers before final approval.', author: 'Rishi Charan', createdAt: taskTimestampOffset(-1, -2), relation: 'Profile · Travel preferences', pinned: true, mine: true },
    { id: 'NOTE-1001', body: 'Passport copies received for all travellers. Follow up on the remaining visa photographs.', author: 'Meera Shah', createdAt: taskTimestampOffset(-4), relation: 'Document · Passport & visa', pinned: true, mine: false },
  ]],
  ['CUST-0002', [
    { id: 'NOTE-2001', body: 'Resend the hotel voucher in the existing email thread and reconfirm the 6:30 AM pickup.', author: 'Rishi Charan', createdAt: taskTimestampOffset(-2), relation: 'Booking · Recent booking', pinned: false, mine: true },
  ]],
]);

const CUSTOMER_NOTES_STORAGE_KEY = 'paryatech.customer-notes.v1';
try {
  const storedCustomerNotes = JSON.parse(localStorage.getItem(CUSTOMER_NOTES_STORAGE_KEY) || 'null');
  if (storedCustomerNotes && typeof storedCustomerNotes === 'object') {
    Object.entries(storedCustomerNotes).forEach(([customerId, notes]) => {
      if (!Array.isArray(notes)) return;
      const validNotes = notes.filter((note) => note
        && typeof note.id === 'string'
        && typeof note.body === 'string'
        && typeof note.author === 'string'
        && typeof note.createdAt === 'string')
        .map((note) => ({
          ...note,
          relation: typeof note.relation === 'string' ? note.relation : '',
          pinned: Boolean(note.pinned),
          mine: typeof note.mine === 'boolean' ? note.mine : note.author === 'Rishi Charan',
        }));
      customerNotesByCustomer.set(customerId, validNotes);
    });
  }
} catch {
  try { localStorage.removeItem(CUSTOMER_NOTES_STORAGE_KEY); } catch { /* storage blocked — notes stay in memory */ }
}

function saveCustomerNotesStore() {
  try {
    localStorage.setItem(CUSTOMER_NOTES_STORAGE_KEY, JSON.stringify(Object.fromEntries(customerNotesByCustomer)));
  } catch {
    // Notes remain available for the current session when browser storage is unavailable.
  }
}

function normalizeStoredNotes(notes, fallbackAuthor = 'Rishi Charan') {
  if (!Array.isArray(notes)) return null;
  return notes.filter((note) => note
    && typeof note.id === 'string'
    && typeof note.body === 'string'
    && typeof note.author === 'string'
    && typeof note.createdAt === 'string')
    .map((note) => ({
      ...note,
      relation: typeof note.relation === 'string' ? note.relation : '',
      pinned: Boolean(note.pinned),
      mine: typeof note.mine === 'boolean' ? note.mine : note.author === fallbackAuthor,
    }));
}

const moduleNotesByKey = new Map();
const MODULE_NOTES_STORAGE_KEY = 'paryatech.module-notes.v1';
try {
  const storedModuleNotes = JSON.parse(localStorage.getItem(MODULE_NOTES_STORAGE_KEY) || 'null');
  if (storedModuleNotes && typeof storedModuleNotes === 'object') {
    Object.entries(storedModuleNotes).forEach(([key, notes]) => {
      const validNotes = normalizeStoredNotes(notes);
      if (validNotes) moduleNotesByKey.set(key, validNotes);
    });
  }
} catch {
  try { localStorage.removeItem(MODULE_NOTES_STORAGE_KEY); } catch { /* storage blocked — notes stay in memory */ }
}

function saveModuleNotesStore() {
  try {
    localStorage.setItem(MODULE_NOTES_STORAGE_KEY, JSON.stringify(Object.fromEntries(moduleNotesByKey)));
  } catch {
    // Module notes remain available for the current session when browser storage is unavailable.
  }
}

function notesContext(view = activeView, customer = selectedCustomer) {
  if (view === 'detail' && customer) {
    return {
      kind: 'customer',
      key: customer.id,
      title: 'Customer notes',
      eyebrow: `Customers · ${customer.id}`,
      placeholder: 'What should the team know about this customer?',
      pinLabel: 'Pin to the top of this customer',
      emptyAll: 'No notes yet. Use + on the notes strip to write one.',
    };
  }
  if (view === 'dashboard') {
    return {
      kind: 'module',
      key: 'module-home',
      title: 'Workspace notes',
      eyebrow: 'Workspace · Home',
      placeholder: 'What should the team know about this workspace?',
      pinLabel: 'Pin to the top of this workspace',
      emptyAll: 'No notes yet. Use + on the notes strip to write one.',
    };
  }
  const moduleMeta = {
    inbox: { key: 'module-inbox', title: 'Inbox notes', eyebrow: 'Workspace · All inbox' },
    tasks: { key: 'module-tasks', title: 'Task notes', eyebrow: 'Workspace · All tasks' },
    queries: { key: 'module-queries', title: 'Query notes', eyebrow: 'Sales · Queries' },
    'query-detail': { key: 'module-query-detail', title: 'Query notes', eyebrow: 'Sales · Queries' },
    'new-customer': { key: 'module-customer-setup', title: 'Customer setup notes', eyebrow: 'CRM · Add customer' },
    customers: { key: 'module-customers', title: 'Customer notes', eyebrow: 'CRM · Customers' },
    vault: { key: 'module-vault', title: 'Document notes', eyebrow: 'CRM · Document vault' },
  }[view] ?? { key: `module-${view}`, eyebrow: String(view) };
  return {
    kind: 'module',
    key: moduleMeta.key,
    title: moduleMeta.title || 'Module notes',
    eyebrow: moduleMeta.eyebrow,
    placeholder: 'What should the team know here?',
    pinLabel: 'Pin to the top of this module',
    emptyAll: 'No notes yet. Use + on the notes strip to write one.',
  };
}

function notesForContext(ctx = notesContext()) {
  if (!ctx) return [];
  if (ctx.kind === 'customer') return customerNotesByCustomer.get(ctx.key) ?? [];
  return moduleNotesByKey.get(ctx.key) ?? [];
}

function persistNotesForContext(ctx, notes) {
  if (ctx.kind === 'customer') {
    customerNotesByCustomer.set(ctx.key, notes);
    saveCustomerNotesStore();
  } else {
    moduleNotesByKey.set(ctx.key, notes);
    saveModuleNotesStore();
  }
}

const taskRecords = [
  { id: 'TASK-1001', title: 'Confirm Goa Beach Escape supplier services', description: 'Confirm hotel rooms, transfers, and activity slots before the customer payment deadline.', status: 'Open', priority: 'High', assignee: 'Rishi Charan', entityType: 'Booking', entity: 'Goa Beach Escape', tier: 'Gold', value: 39999, startDate: taskDateOffset(-4), dueDate: taskDateOffset(-2), createdAt: taskTimestampOffset(-5), delay: 'Vendor delay', followUp: false },
  { id: 'TASK-1002', title: 'Build Sri Lanka route proposal', description: 'Complete the Colombo, Kandy, and Bentota route with the preferred vehicle plan.', status: 'In Progress', priority: 'Medium', assignee: 'Rishi Charan', entityType: 'Query', entity: 'Sri Lanka Highlights', tier: 'Bronze', value: 19009, startDate: taskDateOffset(-1), dueDate: taskDateOffset(1), createdAt: taskTimestampOffset(-3), delay: 'Due tomorrow', followUp: true },
  { id: 'TASK-1003', title: 'Share Bangalore to Trivandrum vouchers', description: 'Send the final hotel and transport vouchers to all three travellers.', status: 'Done', priority: 'Low', assignee: 'Rishi Charan', entityType: 'Booking', entity: 'Trivandrum Escape', tier: 'Silver', value: 10000, startDate: taskDateOffset(-5), dueDate: taskDateOffset(-1), createdAt: taskTimestampOffset(-7), delay: 'Completed', followUp: false },
  { id: 'TASK-1004', title: 'Collect Maldives honeymoon preferences', description: 'Confirm room category, meal plan, and preferred speedboat transfer window.', status: 'Blocked', priority: 'Medium', assignee: 'Rishi Charan', entityType: 'Query', entity: 'Maldives Honeymoon', tier: 'Silver', value: 120000, startDate: taskDateOffset(3), dueDate: taskDateOffset(5), createdAt: taskTimestampOffset(-1, -3), delay: 'Customer delay', followUp: true },
  { id: 'TASK-1005', title: 'Call Jain Family about adjacent rooms', description: 'Confirm the children’s room arrangement before releasing the Singapore hotel hold.', status: 'Open', priority: 'High', assignee: 'Kumar Iyer', createdBy: 'Kumar Iyer', entityType: 'Customer', entity: 'Jain Family', tier: 'Gold', value: 300000, startDate: taskDateOffset(0), dueDate: taskDateOffset(0), createdAt: taskTimestampOffset(0, -4), delay: 'Due today', followUp: true },
  { id: 'TASK-1006', title: 'Review cancelled Alpine Stays allocation', description: 'Document the cancellation reason and release the unused room inventory.', status: 'Cancelled', priority: 'Low', assignee: 'Rishi Charan', entityType: 'Vendor', entity: 'Alpine Stays', tier: 'Bronze', value: 0, startDate: taskDateOffset(-2), dueDate: taskDateOffset(7), createdAt: taskTimestampOffset(-2), delay: 'Cancelled', followUp: false },
  { id: 'TASK-1007', title: 'Reconcile Dubai booking payment risk', description: 'Validate the customer ledger and share the pending payment link.', status: 'Open', priority: 'High', assignee: 'Meera Shah', entityType: 'Booking', entity: 'Abu Dhabi & Dubai Twin', tier: 'Gold', value: 155000, startDate: taskDateOffset(-5), dueDate: taskDateOffset(-3), createdAt: taskTimestampOffset(-6), delay: 'Customer delay', followUp: false },
  { id: 'TASK-1008', title: 'Send Bali balance payment reminder', description: 'Share the updated payment link and confirm receipt with the customer.', status: 'Backlog', priority: 'Medium', assignee: 'Unassigned', entityType: 'Query', entity: 'Bali Island Escape', tier: 'Silver', value: 85000, startDate: taskDateOffset(-5), dueDate: taskDateOffset(-4), createdAt: taskTimestampOffset(-4), delay: 'Needs owner', followUp: true },
  { id: 'TASK-1009', title: 'Verify Thailand visa document set', description: 'Review passport validity and missing photographs before submission.', status: 'In Progress', priority: 'High', assignee: 'Vikram Soni', entityType: 'Booking', entity: 'Thailand Beach & Bangkok', tier: 'Gold', value: 261400, startDate: taskDateOffset(-1), dueDate: taskDateOffset(2), createdAt: taskTimestampOffset(-2), delay: 'On track', followUp: false },
  { id: 'TASK-1010', title: 'Archive Northstar offsite handover', description: 'Close the completed corporate booking and attach the final reconciliation note.', status: 'Done', priority: 'Low', assignee: 'Kumar Iyer', entityType: 'Customer', entity: 'Northstar Pharma Pvt Ltd', tier: 'Corporate', value: 731400, startDate: taskDateOffset(-9), dueDate: taskDateOffset(-5), createdAt: taskTimestampOffset(-12), delay: 'Completed', followUp: false },
  { id: 'TASK-1011', title: 'Confirm Island Hopper ferry inventory', description: 'Get written confirmation for both ferry sectors and update the booking notes.', status: 'Open', priority: 'Medium', assignee: 'Rishi Charan', entityType: 'Vendor', entity: 'Island Hopper Ferries', tier: 'Silver', value: 0, startDate: taskDateOffset(1), dueDate: taskDateOffset(4), createdAt: taskTimestampOffset(0, -1), delay: 'Waiting on vendor', followUp: false },
  { id: 'TASK-1012', title: 'Prepare Kerala family itinerary review', description: 'Check driving times, meal inclusions, and the child-friendly activity mix.', status: 'Backlog', priority: 'Low', assignee: 'Meera Shah', entityType: 'Query', entity: 'Kerala Backwaters & Hills', tier: 'Bronze', value: 95000, startDate: taskDateOffset(2), dueDate: taskDateOffset(6), createdAt: taskTimestampOffset(-1), delay: 'Planned', followUp: false },
  { id: 'TASK-1013', title: 'Confirm Singapore visa photographs', description: 'Collect the remaining visa photographs from Jain Family before the document review deadline.', status: 'Open', priority: 'Medium', assignee: 'Rishi Charan', createdBy: 'Rishi Charan', entityType: 'Customer', entity: 'Jain Family', tier: 'Gold', value: 300000, startDate: taskDateOffset(0), dueDate: '', createdAt: taskTimestampOffset(0, -2), delay: 'No due date', followUp: true },
];
const TASK_RECORDS_STORAGE_KEY = 'paryatech.task-records.v1';
try {
  const savedTasks = JSON.parse(localStorage.getItem(TASK_RECORDS_STORAGE_KEY) || 'null');
  if (Array.isArray(savedTasks) && savedTasks.every((task) => task
    && typeof task.id === 'string'
    && typeof task.title === 'string'
    && typeof task.status === 'string')) {
    taskRecords.splice(0, taskRecords.length, ...savedTasks);
  }
} catch { /* Seed tasks remain available when browser storage is unavailable. */ }

function saveTaskRecordsStore() {
  try { localStorage.setItem(TASK_RECORDS_STORAGE_KEY, JSON.stringify(taskRecords)); }
  catch { /* Changes remain available for the current session. */ }
}

const customerReferralLinks = new Map([
  ['CUST-0001', { referredBy: null, referrals: ['CUST-0005', 'CUST-0008'] }],
  ['CUST-0002', { referredBy: null, referrals: ['CUST-0003'] }],
  ['CUST-0003', { referredBy: 'CUST-0002', referrals: [] }],
  ['CUST-0005', { referredBy: 'CUST-0001', referrals: [] }],
  ['CUST-0008', { referredBy: 'CUST-0001', referrals: [] }],
]);
const QUERY_TYPES = ['Trip', 'Flight', 'Accommodation', 'Visa', 'Cruise', 'Transport'];
const QUERY_KANBAN_STATUSES = ['Unassigned', 'New', 'Quoting', 'Negotiation', 'Won', 'Lost'];
const QUERY_SAMPLE_TITLES = {
  Trip: [
    'Winter vacation tour planning for Shimla from Bengaluru',
    'Goa Beach Escape for the Jain Family',
    'Sri Lanka highlights and coastal circuit',
    'Bali anniversary itinerary for Patel Family',
    'Kashmir Paradise solo itinerary',
    'Maldives honeymoon with water villa stay',
    'Rajasthan heritage circuit for twelve travellers',
    'Kerala backwaters and hills family holiday',
    'Dubai and Abu Dhabi twin-city escape',
    'Nepal and Kathmandu Valley group journey',
    'Andaman island-hopping family itinerary',
    'Singapore city break and Sentosa holiday',
  ],
  Flight: [
    'Bengaluru to Dubai return flights for Jain Family',
    'Delhi to Goa flights for four travellers',
    'Mumbai to Singapore group flight options',
    'Hyderabad to London premium economy itinerary',
    'Chennai to Colombo weekend flight plan',
    'Kolkata to Bangkok family fare search',
    'Bengaluru to Paris multi-city flight request',
    'Pune to Leh connecting flight options',
    'Ahmedabad to Bali honeymoon flights',
    'Delhi to Tokyo business-class comparison',
    'Mumbai to Kochi corporate group flights',
    'Jaipur to Dubai direct flight request',
  ],
  Accommodation: [
    'Maldives water villa stay for honeymoon couple',
    'Jaipur heritage hotels for Singh Family',
    'Kochi beachfront rooms for corporate group',
    'Shimla mountain resort for winter vacation',
    'Dubai Marina apartments for Jain Family',
    'Goa private villa for eight travellers',
    'Singapore family rooms near Sentosa',
    'Bali boutique resort with pool villa',
    'London central hotel for business delegation',
    'Kashmir houseboat and Pahalgam resort stay',
    'Rajasthan palace hotel circuit',
    'Andaman beachfront cottages for family trip',
  ],
  Visa: [
    'Thailand tourist visas for four travellers',
    'Schengen business visa support for Northstar team',
    'Dubai express visas for two travellers',
    'Singapore family visa documentation',
    'United Kingdom visitor visas for Jain Family',
    'Japan tourist visa for solo traveller',
    'Australia visitor visa document review',
    'United States business visa appointment support',
    'Sri Lanka electronic travel authorisation',
    'Vietnam e-visa application for group',
    'Turkey tourist visa for honeymoon couple',
    'Canada visitor visa file preparation',
  ],
  Cruise: [
    'Singapore round-trip cruise for Jain Family',
    'Mediterranean sailing for Bhatia couple',
    'Dubai family cruise cabin upgrade',
    'Alaska inside passage balcony cabin request',
    'Norwegian fjords summer cruise itinerary',
    'Greek islands honeymoon sailing',
    'Mumbai to Lakshadweep cruise options',
    'Caribbean family cruise with adjoining cabins',
    'Nile river cruise and Cairo extension',
    'Vietnam and Cambodia Mekong river cruise',
    'Japan spring coastal cruise',
    'Antarctica expedition cruise enquiry',
  ],
  Transport: [
    'Kerala airport and intercity transport plan',
    'Rajasthan coach for twelve travellers',
    'Mumbai airport transfer for corporate guests',
    'Dubai private transfers and desert safari vehicle',
    'Sri Lanka chauffeur-driven circuit',
    'Goa airport pickup and local sightseeing',
    'Ladakh four-wheel-drive vehicle plan',
    'Singapore airport and attraction transfers',
    'Bali private car with English-speaking guide',
    'Kashmir family tempo traveller request',
    'London executive vehicle for business delegation',
    'Jaipur wedding guest shuttle plan',
  ],
};
const QUERY_SAMPLE_DELAYS = ['Internal review', 'Customer response', 'Vendor delay', 'Pricing approval', 'Supplier confirmation', 'Document follow-up'];
const QUERY_SAMPLE_ACTIVITIES = ['2 hours ago', '5 hours ago', '12 hours ago', '1 day ago', '2 days ago', '3 days ago', '5 days ago', '1 week ago'];
const QUERY_SAMPLE_OWNERS = ['Rishi Charan', 'Rishi Charan', 'Meera Shah', 'Rishi Charan', 'Kumar Iyer', 'Unassigned', 'Rishi Charan', 'Meera Shah', 'Rishi Charan', 'Kumar Iyer', 'Rishi Charan', 'Unassigned'];
const QUERY_SAMPLE_PENDING_ON = ['Us', 'Customer', 'Vendor'];
const queryModuleRecords = QUERY_TYPES.flatMap((type, typeIndex) => QUERY_SAMPLE_TITLES[type].map((title, index) => {
  const customer = customers[(typeIndex * 3 + index) % customers.length];
  return {
    id: `QRY-${2001 + typeIndex * 100 + index}`,
    type,
    title,
    status: QUERY_KANBAN_STATUSES[index % QUERY_KANBAN_STATUSES.length],
    priority: ['High', 'Medium', 'Low'][index % 3],
    delay: QUERY_SAMPLE_DELAYS[index % QUERY_SAMPLE_DELAYS.length],
    pendingOn: QUERY_SAMPLE_PENDING_ON[index % QUERY_SAMPLE_PENDING_ON.length],
    value: 18000 + typeIndex * 23000 + index * 13500,
    activity: QUERY_SAMPLE_ACTIVITIES[index % QUERY_SAMPLE_ACTIVITIES.length],
    owner: QUERY_SAMPLE_OWNERS[index],
    customerId: customer.id,
  };
}));
const customerProposalRecords = [
  { id: 'PROP-3101', customerId: 'CUST-0001', title: 'Bali Family Escape', package: '5D / 4N · Flights, 4-star stay and private transfers', linkedQuery: 'Direct proposal', status: 'Sent', amount: 45000, sentAt: '2026-09-22', validUntil: '2026-09-29' },
  { id: 'PROP-3102', customerId: 'CUST-0001', title: 'Singapore Cruise and City', package: '7D / 6N · Cruise cabin, city stay and transfers', linkedQuery: 'QRY-2401', status: 'Accepted', amount: 145000, sentAt: '2026-09-20', validUntil: '2026-09-27' },
  { id: 'PROP-3103', customerId: 'CUST-0001', title: 'Dubai Return Flight Package', package: 'Return economy fares · 4 travellers · 30 kg baggage', linkedQuery: 'QRY-2101', status: 'Sent', amount: 58000, sentAt: '2026-09-19', validUntil: '2026-09-24' },
  { id: 'PROP-3104', customerId: 'CUST-0001', title: 'Thailand Visa Support', package: 'Tourist visa filing · 4 travellers · document review', linkedQuery: 'QRY-2301', status: 'Sent', amount: 28000, sentAt: '2026-09-18', validUntil: '2026-09-30' },
  { id: 'PROP-3201', customerId: 'CUST-0002', title: 'Dubai Express Visa', package: 'Express tourist visa · 2 travellers · document check', linkedQuery: 'QRY-2303', status: 'Sent', amount: 12000, sentAt: '2026-09-17', validUntil: '2026-09-24' },
];
const proposalCatalogRecords = [
  { id: 'PKG-SHIMLA-7D', type: 'package', title: 'Shimla, Manali & Chandigarh family escape', destination: 'Shimla', origin: 'Bengaluru', days: 7, amount: 77770, scope: 'Domestic', stops: [{ city: 'Shimla', nights: 3 }, { city: 'Manali', nights: 2 }, { city: 'Chandigarh', nights: 1 }], summary: 'Private transfers, three selected stays, breakfast and guided sightseeing.' },
  { id: 'PKG-SRILANKA-15D', type: 'package', title: 'Sri Lanka family discovery', destination: 'Sri Lanka', origin: 'Hyderabad', days: 15, amount: 148000, scope: 'International', stops: [{ city: 'Colombo', nights: 2 }, { city: 'Kandy', nights: 3 }, { city: 'Nuwara Eliya', nights: 3 }, { city: 'Bentota', nights: 4 }, { city: 'Colombo', nights: 2 }], summary: 'Hotels, private chauffeur, breakfast and family-friendly experiences.' },
  { id: 'PKG-KERALA-6D', type: 'package', title: 'Kerala backwaters & hills', destination: 'Kerala', origin: 'Bengaluru', days: 6, amount: 95000, scope: 'Domestic', stops: [{ city: 'Munnar', nights: 2 }, { city: 'Thekkady', nights: 1 }, { city: 'Alleppey', nights: 2 }], summary: 'Hill stay, wildlife stop, houseboat and private intercity transport.' },
  { id: 'PKG-BALI-6D', type: 'package', title: 'Bali family retreat', destination: 'Bali', origin: 'Hyderabad', days: 6, amount: 132000, scope: 'International', stops: [{ city: 'Ubud', nights: 3 }, { city: 'Nusa Dua', nights: 2 }], summary: 'Resort stays, airport transfers, breakfast and private sightseeing.' },
  { id: 'ITY-SRILANKA-COAST', type: 'itinerary', title: 'Sri Lanka culture & coast route', destination: 'Sri Lanka', origin: 'Hyderabad', days: 15, amount: 0, scope: 'International', stops: [{ city: 'Colombo', nights: 2 }, { city: 'Sigiriya', nights: 2 }, { city: 'Kandy', nights: 3 }, { city: 'Ella', nights: 2 }, { city: 'Bentota', nights: 4 }, { city: 'Colombo', nights: 1 }], summary: 'Reusable day plan with cultural triangle, hill country and south coast.' },
  { id: 'ITY-HIMACHAL-7D', type: 'itinerary', title: 'Classic Himachal seven-day route', destination: 'Shimla', origin: 'Bengaluru', days: 7, amount: 0, scope: 'Domestic', stops: [{ city: 'Shimla', nights: 3 }, { city: 'Manali', nights: 2 }, { city: 'Chandigarh', nights: 1 }], summary: 'Reusable route with day descriptions, activities and transfer legs.' },
];
const customerVoucherRecords = [
  { id: 'VCH-4101', customerId: 'CUST-0001', type: 'Flight', title: 'Hyderabad to Singapore', serviceSummary: 'Singapore Airlines SQ 523 · Economy · 4 travellers', referenceLabel: 'PNR', reference: 'X7P9QK', secondaryReference: 'Tickets 618-7284519201–04', serviceDate: '2026-10-05', status: 'Confirmed' },
  { id: 'VCH-4102', customerId: 'CUST-0001', type: 'Accommodation', title: 'Marina Bay Sands Singapore', serviceSummary: '2 family rooms · Breakfast included · 5 nights', referenceLabel: 'Confirmation', reference: 'MBS-884219', secondaryReference: 'Check-out 11 Oct 2026', serviceDate: '2026-10-06', status: 'Confirmed' },
  { id: 'VCH-4103', customerId: 'CUST-0001', type: 'Invoice', title: 'Singapore family package invoice', serviceSummary: '₹1,45,000 · Paid in full · GST included', referenceLabel: 'Invoice', reference: 'INV-2026-184', secondaryReference: 'Issued 21 Sep 2026', serviceDate: '2026-09-21', status: 'Paid' },
  { id: 'VCH-4104', customerId: 'CUST-0001', type: 'Activity', title: 'Singapore Night Safari', serviceSummary: '4 entries · 7:15 PM tram slot · Transfer included', referenceLabel: 'Voucher', reference: 'NSG-44512', secondaryReference: 'Present QR code at entry', serviceDate: '2026-10-08', status: 'Confirmed' },
  { id: 'VCH-4105', customerId: 'CUST-0001', type: 'Attraction', title: 'Universal Studios Singapore', serviceSummary: '4 dated admission tickets · Sentosa Island', referenceLabel: 'Voucher', reference: 'USS-29184', secondaryReference: '4 mobile tickets issued', serviceDate: '2026-10-09', status: 'Confirmed' },
  { id: 'VCH-4201', customerId: 'CUST-0002', type: 'Flight', title: 'Bengaluru to Dubai', serviceSummary: 'Emirates EK 569 · Economy · 2 travellers', referenceLabel: 'PNR', reference: 'H6K2LM', secondaryReference: 'Tickets 176-4821906101–02', serviceDate: '2026-11-12', status: 'Confirmed' },
  { id: 'VCH-4202', customerId: 'CUST-0002', type: 'Accommodation', title: 'Atlantis The Palm Dubai', serviceSummary: '1 ocean room · Breakfast included · 4 nights', referenceLabel: 'Confirmation', reference: 'ATP-771204', secondaryReference: 'Check-out 17 Nov 2026', serviceDate: '2026-11-13', status: 'Confirmed' },
];
const bankAccountsByCustomer = new Map([
  ['CUST-0001', [
    { id: 'BANK-1001', bankName: 'HDFC Bank', holderName: 'Jain Family', accountType: 'Current account', branch: 'Hyderabad · MG Road', accountNumber: '50200018472163', ifscCode: 'HDFC0001234', preferred: true },
  ]],
  ['CUST-0002', [
    { id: 'BANK-2001', bankName: 'ICICI Bank', holderName: 'Rishi Charan', accountType: 'Savings account', branch: 'Bengaluru · MG Road', accountNumber: '004501029317', ifscCode: 'ICIC0000045', preferred: true },
  ]],
]);

function bankAccountsFor(customer) {
  if (!customer) return [];
  if (!bankAccountsByCustomer.has(customer.id)) bankAccountsByCustomer.set(customer.id, []);
  return bankAccountsByCustomer.get(customer.id);
}

function preferredBankAccount(customer) {
  const accounts = bankAccountsFor(customer);
  return accounts.find((account) => account.preferred) ?? accounts[0] ?? null;
}

const customerFinanceEntries = new Map([
  ['CUST-0001', [
    { id: 'FIN-1001', date: '2026-01-07', description: 'Advance payment received', detail: 'Singapore family package · UPI receipt UPI-4821', amount: 120000, direction: 'Debit' },
    { id: 'FIN-1002', date: '2026-03-31', description: 'Balance payment received', detail: 'Singapore family package · Bank transfer NEFT-7319', amount: 100000, direction: 'Debit' },
    { id: 'FIN-1003', date: '2026-04-04', description: 'Flight segment refund', detail: 'Cancelled fare component · Refund RF-2048', amount: 20000, direction: 'Credit' },
  ]],
  ['CUST-0002', [
    { id: 'FIN-2001', date: '2026-02-12', description: 'Booking advance received', detail: 'Dubai booking · Card receipt CRD-1028', amount: 100000, direction: 'Debit' },
    { id: 'FIN-2002', date: '2026-04-18', description: 'Final payment received', detail: 'Dubai booking · Bank transfer NEFT-9112', amount: 70000, direction: 'Debit' },
    { id: 'FIN-2003', date: '2026-05-02', description: 'Hotel amendment refund', detail: 'Room-category adjustment · Refund RF-3116', amount: 10000, direction: 'Credit' },
  ]],
]);




const inboxConversations = [
  {
    id: 'conversation-jain-email',
    customerId: 'CUST-0001',
    name: 'Jain Family',
    channel: 'email',
    time: 'Yesterday',
    messages: [
      { direction: 'outgoing', subject: 'Singapore itinerary and document checklist', body: 'Hello Vandan,\n\nPlease find the updated itinerary and the document checklist for all four travellers.', time: 'Yesterday' },
      { direction: 'incoming', subject: 'Re: Singapore itinerary and document checklist', body: 'Received, thank you. We will upload the remaining documents today.', time: 'Yesterday', read: true },
    ],
  },
  {
    id: 'conversation-rishi-email',
    customerId: 'CUST-0002',
    name: 'Rishi Charan',
    channel: 'email',
    time: '10:18 AM',
    messages: [
      { direction: 'outgoing', subject: 'Your Shimla booking is confirmed', body: 'Hi Rishi,\n\nYour Shimla booking is confirmed. I’ve shared the next steps below for your reference.', time: '10:00 AM' },
      { direction: 'incoming', subject: 'Re: Your Shimla booking is confirmed', body: 'Thanks. Could you resend the hotel voucher in this thread?', time: '10:18 AM', read: false },
    ],
  },
  {
    id: 'conversation-aarav-email',
    customerId: 'CUST-0005',
    name: 'Aarav Singh',
    channel: 'email',
    time: '8:36 AM',
    messages: [
      { direction: 'incoming', subject: 'Dietary requirements for the Delhi group', body: 'Please add two Jain meals and one gluten-free meal to our booking.', time: '8:36 AM', read: false },
    ],
  },
  {
    id: 'conversation-pragyam-email', customerId: 'CUST-0003', name: 'Pragyam Soni', channel: 'email', time: 'Yesterday',
    messages: [
      { direction: 'incoming', subject: 'Mumbai group fare request', body: 'Could you share the revised fare for two travellers with checked baggage included?', time: 'Yesterday', read: false },
      { direction: 'outgoing', subject: 'Re: Mumbai group fare request', body: 'Hi Pragyam,\n\nI have asked the airline to hold the current fare. I will send the revised quote once the baggage option is confirmed.', time: 'Yesterday' },
    ],
  },
  {
    id: 'conversation-yakshith-email', customerId: 'CUST-0004', name: 'Yakshith', channel: 'email', time: 'Yesterday',
    messages: [
      { direction: 'incoming', subject: 'Airport pickup details', body: 'My flight arrives in Mangalore at 7:20 PM. Please confirm where I should meet the driver.', time: 'Yesterday', read: true },
      { direction: 'outgoing', subject: 'Re: Airport pickup details', body: 'The driver will wait near the arrivals exit with a name board and call you after landing.', time: 'Yesterday' },
    ],
  },
  {
    id: 'conversation-sonia-email', customerId: 'CUST-0006', name: 'Sonia Bhatia', channel: 'email', time: 'Mon',
    messages: [
      { direction: 'incoming', subject: 'Change of Pune departure date', body: 'Can we move the departure to Friday evening? Please share the fare difference before making the change.', time: 'Mon', read: false },
    ],
  },
  {
    id: 'conversation-manish-email', customerId: 'CUST-0007', name: 'Manish Kumar', channel: 'email', time: 'Mon',
    messages: [
      { direction: 'outgoing', subject: 'Chennai group rooming list', body: 'Hi Manish,\n\nPlease review the rooming list and confirm the names before we release it to the hotel.', time: 'Mon', attachments: ['Chennai-rooming-list.pdf'] },
      { direction: 'incoming', subject: 'Re: Chennai group rooming list', body: 'The names look correct. Please update the second room to twin beds.', time: 'Mon', read: true },
    ],
  },
  {
    id: 'conversation-vani-email', customerId: 'CUST-0008', name: 'Vani Patel', channel: 'email', time: 'Sun',
    messages: [
      { direction: 'incoming', subject: 'Ahmedabad hotel options', body: 'Thank you for the options. Could you send photos of the rooms and the breakfast timings?', time: 'Sun', read: false },
    ],
  },
  {
    id: 'conversation-rohan-email', customerId: 'CUST-0009', name: 'Rohan Ghosh', channel: 'email', time: 'Sat',
    messages: [
      { direction: 'outgoing', subject: 'Kolkata family trip proposal', body: 'Hello Rohan,\n\nAttached is the itinerary for your family trip. The price includes accommodation and airport transfers.', time: 'Sat', attachments: ['Family-trip-proposal.pdf'] },
      { direction: 'incoming', subject: 'Re: Kolkata family trip proposal', body: 'We like the plan. Is it possible to add one more night at the same hotel?', time: 'Sat', read: true },
    ],
  },
  {
    id: 'conversation-neha-email', customerId: 'CUST-0010', name: 'Neha Sharma', channel: 'email', time: 'Fri',
    messages: [
      { direction: 'incoming', subject: 'Passport details for four travellers', body: 'I have attached the passport details for all four travellers. Please let me know if anything else is needed.', time: 'Fri', read: false, attachments: ['Passport-details.pdf'] },
    ],
  },
  {
    id: 'conversation-deepak-email', customerId: 'CUST-0011', name: 'Deepak Prasad', channel: 'email', time: 'Thu',
    messages: [
      { direction: 'outgoing', subject: 'Payment receipt for your booking', body: 'Hi Deepak,\n\nWe have received your booking advance. Your payment receipt is attached for your records.', time: 'Thu', attachments: ['Payment-receipt.pdf'] },
      { direction: 'incoming', subject: 'Re: Payment receipt for your booking', body: 'Received the receipt. Thank you for confirming the payment.', time: 'Thu', read: true },
    ],
  },
  {
    id: 'conversation-tanvi-email', customerId: 'CUST-0012', name: 'Tanvi Singh', channel: 'email', time: 'Wed',
    messages: [
      { direction: 'incoming', subject: 'Jaipur trip check-in time', body: 'Could you confirm the hotel check-in time and whether an early check-in is possible?', time: 'Wed', read: false },
    ],
  },
];

const vaultDocumentSeeds = new Map([
  ['CUST-0001', [
    { traveller: 'Vandan Jain', name: 'Passport Copy File For Travel Family Trip', type: 'Passport', expiry: 'August 2027', activity: 'last updated 8 hours ago', kind: 'pdf' },
    { traveller: 'Vrushab Jain', name: 'Travel Family To Singapore Itinerary File', type: 'Document', expiry: 'December 2026', activity: 'last updated 12 hours ago', kind: 'doc' },
    { traveller: 'Vandan Jain', name: 'Visa Copy For The Trip', type: 'Visa', expiry: 'April 2029', activity: 'last updated 2 days ago', kind: 'doc' },
    { traveller: 'Vandan Jain', name: 'Hotel Booking Confirmation For Singapore', type: 'Booking', expiry: 'June 2026', activity: 'last updated 3 days ago', kind: 'pdf' },
    { traveller: 'Vandan Jain', name: 'Group Photo Copy File', type: 'ID', expiry: 'N/A', activity: 'last updated 1 week ago', kind: 'img' },
    { traveller: 'Vrushab Jain', name: 'Flight Tickets For Family Trip', type: 'Tickets', expiry: 'September 2026', activity: 'last updated 1 week ago', kind: 'doc', expiring: true },
  ]],
]);
const vaultCustomers = customers.map((customer) => ({
  ...customer,
  documents: [...(vaultDocumentSeeds.get(customer.id) ?? [])],
}));

let activeCategory = 'All';
let currentPage = 1;
let queryListPage = 1;
let taskListPage = 1;
let totalCustomerCount = customers.length;
let activeView = 'dashboard';
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
let expandedVaultCustomer = null;
let vaultPage = 1;
let selectedCustomer = customers[0];
let vaultSourceCustomer = null;
// In-app back stack: remembers previously visited views (persisted per tab) so the
// Back action can return to the previous view — including the previous top-level
// view — instead of always falling back to a default page. This covers cases where
// the browser history entry has no usable app state (deep link, reload, replaceState
// flows), where `history.state?.canGoBack` is falsy.
const VIEW_BACK_STACK_KEY = 'paryatech-customer-back-stack';
const VIEW_BACK_STACK_LIMIT = 30;
function restoreViewBackStack() {
  try {
    const raw = sessionStorage.getItem(VIEW_BACK_STACK_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((entry) => entry && typeof entry.view === 'string').slice(-VIEW_BACK_STACK_LIMIT);
  } catch (error) {
    return [];
  }
}
let viewBackStack = restoreViewBackStack();
let suppressBackRecord = false;
function persistViewBackStack() {
  try {
    sessionStorage.setItem(VIEW_BACK_STACK_KEY, JSON.stringify(viewBackStack.slice(-VIEW_BACK_STACK_LIMIT)));
  } catch (error) {
    // Storage unavailable (private mode, disabled cookies) — in-memory stack still works.
  }
}
function backEntryKey(entry) {
  if (!entry) return '';
  const qualifier = entry.customerId ?? entry.queryId ?? entry.queryCategory ?? entry.sourceCustomerId ?? '';
  return qualifier === '' ? entry.view : `${entry.view}|${qualifier}`;
}
function currentViewContext() {
  const context = { view: activeView };
  if (activeView === 'detail') {
    context.customerId = selectedCustomer?.id;
    context.profileTab = activeProfileTab;
  } else if (activeView === 'query-detail') {
    context.queryId = selectedQuery?.id;
    context.queryDetailTab = activeQueryDetailTab;
  } else if (activeView === 'queries') {
    context.queryCategory = activeQueryCategory;
  } else if (activeView === 'vault' && vaultSourceCustomer) {
    context.sourceCustomerId = vaultSourceCustomer.id;
  }
  return context;
}
// Key for the navigation target. Callers that open query/vault views assign
// selectedQuery / activeQueryCategory / vaultSourceCustomer before setView, so the
// current globals already describe the target at record time.
function targetViewKey(view, customer) {
  if (view === 'detail') return `detail|${customer?.id ?? ''}`;
  if (view === 'query-detail') return `query-detail|${selectedQuery?.id ?? ''}`;
  if (view === 'queries') return `queries|${activeQueryCategory ?? ''}`;
  if (view === 'vault') return `vault|${vaultSourceCustomer?.id ?? ''}`;
  return view;
}
function recordViewForBack(targetView, targetCustomer) {
  if (suppressBackRecord) return;
  const from = currentViewContext();
  const fromKey = backEntryKey(from);
  // Skip sidebar re-clicks / no-op navigations that stay on the same view context.
  if (fromKey === targetViewKey(targetView, targetCustomer)) return;
  const last = viewBackStack[viewBackStack.length - 1];
  if (last && backEntryKey(last) === fromKey) return;
  viewBackStack.push(from);
  if (viewBackStack.length > VIEW_BACK_STACK_LIMIT) viewBackStack.splice(0, viewBackStack.length - VIEW_BACK_STACK_LIMIT);
  persistViewBackStack();
}
// Drop trailing stack entries that match the view just arrived at via browser
// back/forward, so a later Back fallback can't bounce straight back.
function pruneViewBackStackForArrival(state, fallbackView) {
  const arrivalKey = backEntryKey({
    view: state?.view ?? fallbackView,
    customerId: state?.customerId,
    queryId: state?.queryId,
    queryCategory: state?.queryCategory,
    sourceCustomerId: state?.sourceCustomerId,
  });
  let changed = false;
  while (viewBackStack.length > 0 && backEntryKey(viewBackStack[viewBackStack.length - 1]) === arrivalKey) {
    viewBackStack.pop();
    changed = true;
  }
  if (changed) persistViewBackStack();
}
function restoreViewEntry(entry) {
  // Restoring is itself a back step (browser-like pointer move), not a new
  // forward navigation — don't re-record the view we are leaving, otherwise
  // repeated Back presses would oscillate instead of walking further back.
  suppressBackRecord = true;
  try {
    switch (entry.view) {
      case 'dashboard':
      case 'inbox':
      case 'tasks':
      case 'customers':
      case 'new-customer':
      case 'notifications':
      case 'account':
        setView(entry.view);
        return true;
      case 'queries':
        if (entry.queryCategory && QUERY_TYPES.includes(entry.queryCategory)) activeQueryCategory = entry.queryCategory;
        setView('queries');
        return true;
      case 'detail': {
        const customer = customers.find((item) => item.id === entry.customerId);
        if (!customer) return false;
        setView('detail', customer);
        if (entry.profileTab) setProfileTab(entry.profileTab);
        return true;
      }
      case 'query-detail': {
        const query = queryModuleRecords.find((item) => item.id === entry.queryId);
        if (!query) return false;
        openQueryDetail(query);
        if (QUERY_DETAIL_TABS.includes(entry.queryDetailTab) && entry.queryDetailTab !== activeQueryDetailTab) {
          activeQueryDetailTab = entry.queryDetailTab;
          renderQueryDetail();
        }
        return true;
      }
      case 'vault': {
        const source = entry.sourceCustomerId ? customers.find((item) => item.id === entry.sourceCustomerId) ?? null : null;
        openDocumentVault(source);
        return true;
      }
      default:
        return false;
    }
  } finally {
    suppressBackRecord = false;
  }
}
// Pops the most recent restorable view that differs from the current one.
function popPreviousViewEntry() {
  const currentKey = backEntryKey(currentViewContext());
  while (viewBackStack.length > 0) {
    const entry = viewBackStack.pop();
    if (!entry || typeof entry.view !== 'string') continue;
    if (backEntryKey(entry) === currentKey) continue;
    if (restoreViewEntry(entry)) {
      persistViewBackStack();
      return true;
    }
  }
  persistViewBackStack();
  return false;
}
let toastTimer;
const appliedFilters = { tier: [], groupType: [], outstanding: false, expiring: false };
const appliedVaultFilters = { tier: [], category: null, expiring: false };
const pendingVaultFilters = { ...appliedVaultFilters };
const selectedCustomerIds = new Set();
let selectedImportFile = null;

let activeProfileTab = 'overview';
let profileTaskSearchQuery = '';
let profileTaskPage = 1;
const profileTaskFilters = { priority: 'all', entity: 'all', assignee: 'all', sort: 'created-desc', from: '', to: '' };
const pendingProfileTaskFilters = { ...profileTaskFilters };
let queryTaskSearchQuery = '';
let queryTaskPage = 1;
let lastQueryTasksQueryId = '';
const queryTaskFilters = { priority: 'all', entity: 'all', assignee: 'all', sort: 'created-desc', from: '', to: '' };
const pendingQueryTaskFilters = { ...queryTaskFilters };
let customerMailFilter = 'all';
let selectedCustomerMailIndex = null;
let customerMailSidebarCollapsed = false;
let customerMailAttachments = [];
let queryMailFilter = 'all';
let selectedQueryMailIndex = null;
let queryMailSidebarCollapsed = false;
let queryMailAttachments = [];
let onboardingPhotoFile = null;
let onboardingPhotoDataUrl = '';
let queryReturnFocus = null;
let customerReturnFocus = null;
let vendorReturnFocus = null;
let customerNotesReturnFocus = null;
let customerRowMenuReturnFocus = null;
let activeCustomerNoteFilter = 'all';
let customerNoteRelatedSelection = '';
let mobileNavReturnFocus = null;
let bookingReturnFocus = null;
let bookingInitialCustomerId = '';
const samplePassportPreview = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="920" height="620" viewBox="0 0 920 620">
    <rect width="920" height="620" fill="#eef2ec"/>
    <rect x="90" y="70" width="740" height="480" rx="20" fill="#fffdf8" stroke="#b9c7bf" stroke-width="4"/>
    <rect x="90" y="70" width="740" height="92" rx="20" fill="#245c58"/>
    <path d="M90 142h740" stroke="#245c58" stroke-width="40"/>
    <text x="132" y="126" font-family="Arial" font-size="26" font-weight="700" fill="white">REPUBLIC OF INDIA · PASSPORT COPY</text>
    <rect x="132" y="210" width="188" height="230" rx="12" fill="#d9e5df"/>
    <circle cx="226" cy="286" r="52" fill="#91aaa0"/>
    <path d="M162 408c8-58 36-88 64-88s56 30 64 88" fill="#91aaa0"/>
    <text x="360" y="225" font-family="Arial" font-size="18" fill="#63726b">SURNAME</text>
    <text x="360" y="257" font-family="Arial" font-size="26" font-weight="700" fill="#193a37">CHARAN</text>
    <text x="360" y="307" font-family="Arial" font-size="18" fill="#63726b">GIVEN NAME</text>
    <text x="360" y="339" font-family="Arial" font-size="26" font-weight="700" fill="#193a37">RISHI</text>
    <text x="360" y="389" font-family="Arial" font-size="18" fill="#63726b">DOCUMENT NUMBER</text>
    <text x="360" y="421" font-family="monospace" font-size="24" fill="#193a37">P••••••42</text>
    <path d="M132 486h656M132 514h656" stroke="#71857c" stroke-width="8" stroke-dasharray="4 7"/>
  </svg>
`)}`;
const documentRequests = new Map([['CUST-0002', {
  customerId: 'CUST-0002',
  traveller: 'Rishi Charan',
  types: ['Passport'],
  message: 'Please upload a clear passport copy.',
  link: `${location.origin}${location.pathname}?document-request=demo-passport&customer-id=CUST-0002&customer=Rishi%20Charan&document=Passport`,
  status: 'Received · Approval needed',
  createdAt: '2026-09-18T10:31:00+05:30',
}]]);
const uploadedRequestDocuments = new Map([['CUST-0002', [{
  id: 'customer-upload-demo-passport',
  name: 'Passport — Rishi Charan',
  fileName: 'rishi-charan-passport.png',
  mimeType: 'image/png',
  fileSize: 842316,
  fileUrl: samplePassportPreview,
  type: 'Passport',
  traveller: 'Rishi Charan',
  status: 'Pending review',
  source: 'Customer upload link',
  uploadedAt: '2026-09-18T10:52:00+05:30',
}]]]);
let currentDocumentRequest = null;
let currentReviewDocument = null;
let renderedTravellerDocuments = [];
let requestTargetTraveller = null;
let requestReturnFocus = null;
let requestUploadFileName = '';
let selectedRequestUploadFile = null;
let requestUploadPreviewUrl = '';
let publicDocumentRequestMode = false;
const travellerProfilesByCustomer = new Map();
const expandedTravellerByCustomer = new Map();
const TRAVELLER_PREFERENCE_GROUPS = [
  {
    id: 'stay',
    label: 'Stay',
    fields: [
      { key: 'hotelStar', label: 'Hotel star', options: ['3 Star', '4 Star', '5 Star', 'Boutique', 'Resort'] },
      { key: 'roomType', label: 'Room type', options: ['Single', 'Double', 'Twin', 'Suite', 'Deluxe'] },
      { key: 'mealPlan', label: 'Meal plan', options: ['Room Only', 'Breakfast', 'Half Board', 'Full Board', 'All Inclusive'] },
      { key: 'hotelCategory', label: 'Hotel category', options: ['3 Star', '4 Star', '5 Star', 'Boutique', 'Homestay'] },
      { key: 'hotelChains', label: 'Hotel chains', multiple: true, options: ['Taj', 'Oberoi', 'ITC', 'Marriott', 'Hyatt', 'Accor', 'IHG'] },
    ],
  },
  {
    id: 'transport',
    label: 'Transport',
    fields: [
      { key: 'flightClass', label: 'Flight class', options: ['Economy', 'Premium Economy', 'Business', 'First Class'] },
      { key: 'seatPreference', label: 'Seat preference', options: ['Window', 'Aisle', 'Middle', 'No Preference'] },
      { key: 'carType', label: 'Car type', options: ['Sedan', 'SUV', 'Hatchback', 'Luxury', 'Van'] },
      { key: 'preferredAirlines', label: 'Preferred airlines', multiple: true, options: ['IndiGo', 'Air India', 'Vistara', 'SpiceJet', 'Emirates', 'Qatar Airways', 'Singapore Airlines'] },
    ],
  },
  {
    id: 'activities',
    label: 'Activities',
    fields: [
      { key: 'adventureLevel', label: 'Adventure level', options: ['Relaxed', 'Moderate', 'Active', 'Extreme'] },
      { key: 'interests', label: 'Interests', multiple: true, options: ['Sightseeing', 'Adventure Sports', 'Cultural', 'Beach', 'Wildlife'] },
      { key: 'guidedTours', label: 'Guided tours', options: ['Private Guide', 'Group Tour', 'Self-Guided', 'No Preference'] },
    ],
  },
  {
    id: 'food',
    label: 'Food',
    fields: [
      { key: 'dietary', label: 'Dietary', options: ['Vegetarian', 'Non-Vegetarian', 'Vegan', 'Jain', 'Halal', 'No Restriction'] },
      { key: 'cuisineType', label: 'Cuisine type', options: ['Local', 'International', 'Indian', 'Continental', 'Any'] },
      { key: 'spiceLevel', label: 'Spice level', options: ['Mild', 'Medium', 'Spicy', 'No Preference'] },
    ],
  },
  {
    id: 'budget',
    label: 'Budget',
    fields: [
      { key: 'range', label: 'Range', options: ['Budget', 'Mid-Range', 'Premium', 'Luxury', 'Ultra-Luxury'] },
      { key: 'budgetBand', label: 'Budget band', options: ['Value', 'Mid', 'Premium', 'Luxury'] },
      { key: 'flexibility', label: 'Flexibility', options: ['Strict', 'Somewhat Flexible', 'Very Flexible'] },
    ],
  },
  {
    id: 'travel',
    label: 'Travel style',
    fields: [
      { key: 'travelStyle', label: 'Travel style', multiple: true, options: ['Leisure', 'Adventure', 'Luxury', 'Cultural', 'Wellness', 'Family', 'Honeymoon', 'Group'] },
      { key: 'bestTime', label: 'Best time', multiple: true, options: ['Jan–Mar', 'Apr–Jun', 'Jul–Sep', 'Oct–Dec', 'Summer', 'Monsoon', 'Winter'] },
    ],
  },
  {
    id: 'communication',
    label: 'Communication',
    fields: [
      { key: 'preferredChannel', label: 'Preferred channel', options: ['WhatsApp', 'Phone', 'Email'] },
      { key: 'languages', label: 'Languages', multiple: true, options: ['English', 'Hindi', 'Tamil'] },
    ],
  },
];
const expandedDocumentGroupByCustomer = new Map();
let draftTravellerPreferences = {};
let travellerPreferencePicks = [];
let travellerModalMode = 'add';
let activeTravellerId = null;
let travellerReturnFocus = null;
let travellerDeleteArmed = false;
let activeInboxConversationId = null;
let inboxComposerOpen = false;
let inboxConversationFilter = 'all';
let selectedInboxCustomerId = null;
let inboxChannel = 'email';
let activeCustomerCommunicationChannel = 'email';
let inboxReturnFocus = null;
const TASK_CURRENT_USER = 'Rishi Charan';
const TASK_STATUSES = ['Backlog', 'Open', 'In Progress', 'Blocked', 'Done', 'Cancelled'];
let activeTaskView = 'inbox';
let activeTaskLayout = readLayoutPreference('tasks');
let activeTaskStatus = 'All';
let draggedTaskId = null;
let taskModalReturnFocus = null;
let taskDetailsReturnFocus = null;
let taskDetailsId = null;
let taskDraftFollowUp = false;
let taskModalQueryLock = null;
let taskModalEntityContext = null;
let referralTreeReturnFocus = null;
const taskFilters = { priority: 'all', entity: 'all', assignee: 'all', sort: 'created-desc', from: '', to: '' };
let activeCustomerPipelineView = 'queries';
let activeQueryCategory = 'Trip';
let activeQueryLayout = readLayoutPreference('queries');
let activeQueryStatus = 'All';
let activeQueryScope = 'mine';
let draggedQueryId = null;
let suppressQueryCardClick = false;
let currentQueryType = 'Trip';
let pendingQueryCustomer = null;
let queryInitialSnapshot = '';
const queryFilters = { priority: 'all', pendingOn: 'all', tier: 'all' };
let selectedQuery = queryModuleRecords[0];
let activeQueryDetailTab = 'overview';
const ITINERARY_STEPS = ['itinerary', 'content', 'costing', 'preview'];
const QUERY_DETAIL_TABS = ['overview', 'proposals', 'travellers', 'documents', 'tasks', 'communication'];
let activeItineraryStep = 'itinerary';
let activeItineraryProposalId = null;
let activeItineraryCostCategory = 'all';
let expandedItineraryDay = 0;
let proposalWorkspaceView = 'list';
let proposalCatalogType = 'package';
let pendingProposalSourceId = null;
let proposalSearchTerm = '';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const appShell = $('#appShell');
const collapseButton = $('#collapseButton');
const sidebar = $('#primarySidebar');
const sidebarTooltip = $('#sidebarTooltip');
let sidebarTooltipTarget = null;
const shellBackButton = $('#shellBackButton');
const shellBreadcrumbRoot = $('#shellBreadcrumbRoot');
const shellBreadcrumbCurrent = $('#shellBreadcrumbCurrent');
const shellCustomerCrumb = $('#shellCustomerCrumb');
const shellBreadcrumbCustomer = $('#shellBreadcrumbCustomer');
const shellDetailCrumb = $('#shellDetailCrumb');
const shellBreadcrumbDetail = $('#shellBreadcrumbDetail');
const shellSearchLabel = $('#shellSearchLabel');
const shellSearch = $('#shellSearch');
const shellHelpButton = $('#shellHelpButton');
const shellNotificationsButton = $('#shellNotificationsButton');
const shellAccountButton = $('#shellAccountButton');
const globalSearchBackdrop = $('#globalSearchBackdrop');
const globalSearchDialog = $('#globalSearchDialog');
const globalSearchInput = $('#globalSearchInput');
const globalSearchResults = $('#globalSearchResults');
const notificationCenterBackdrop = $('#notificationCenterBackdrop');
const notificationCenter = $('#notificationCenter');
const closeNotificationCenterButton = $('#closeNotificationCenter');
const notificationsUnreadTab = $('#notificationsUnreadTab');
const notificationsAllTab = $('#notificationsAllTab');
const markNotificationsRead = $('#markNotificationsRead');
const notificationList = $('#notificationList');
const viewAllNotifications = $('#viewAllNotifications');
const notificationPreferences = $('#notificationPreferences');
const accountMenuBackdrop = $('#accountMenuBackdrop');
const accountMenu = $('#accountMenu');
const shellSignOut = $('#shellSignOut');
const notificationsView = $('#notificationsView');
const accountView = $('#accountView');
const accountFullName = $('#accountFullName');
const accountEmail = $('#accountEmail');
const accountPhone = $('#accountPhone');
const accountPhotoInput = $('#accountPhotoInput');
const accountProfileAvatar = $('#accountProfileAvatar');
const accountChangePhoto = $('#accountChangePhoto');
const saveAccountProfile = $('#saveAccountProfile');
const mobileNavButton = $('#mobileNavButton');
const dashboardMobileNavButton = $('#dashboardMobileNavButton');
const sidebarBackdrop = $('#sidebarBackdrop');
const queryNavLink = $('#queryNavLink');
const mobileSidebarQuery = window.matchMedia('(max-width: 1000px)');
let desktopSidebarCollapsed = false;
const dashboardView = $('#dashboardView');
const dashboardTimestamp = $('#dashboardTimestamp');
const dashboardDensityNormal = $('#dashboardDensityNormal');
const dashboardDensityAdvance = $('#dashboardDensityAdvance');
const dashboardHomeNormal = $('#dashboardHomeNormal');
const dashboardHomeAdvance = $('#dashboardHomeAdvance');
const dashboardNavLink = $('#dashboardNavLink');
const customersNavLink = $('#customersNavLink');
const brandHomeLink = $('#brandHomeLink');
const customerListView = $('#customerListView');
const customerDetailView = $('#customerDetailView');
const documentVaultView = $('#documentVaultView');
const inboxView = $('#inboxView');
const inboxMobileNavButton = $('#inboxMobileNavButton');
const inboxNavLink = $('#inboxNavLink');
const inboxHeaderUnread = $('#inboxHeaderUnread');
const inboxCreateButton = $('#inboxCreateButton');
const inboxSearch = $('#inboxSearch');
const inboxFilterTabs = $('#inboxFilterTabs');
const inboxConversationList = $('#inboxConversationList');
const inboxThreadPanel = $('#inboxThreadPanel');
const inboxCreateBackdrop = $('#inboxCreateBackdrop');
const inboxCustomerSearch = $('#inboxCustomerSearch');
const inboxCustomerList = $('#inboxCustomerList');
const inboxCustomerResultCount = $('#inboxCustomerResultCount');
const startInboxConversationButton = $('#startInboxConversation');
const inboxSentBackdrop = $('#inboxSentBackdrop');
const queriesView = $('#queriesView');
const queriesMobileNavButton = $('#queriesMobileNavButton');
const queriesSearch = $('#queriesSearch');
const queriesFilterButton = $('#queriesFilterButton');
const queriesFilterPopover = $('#queriesFilterPopover');
const queriesPriorityFilter = $('#queriesPriorityFilter');
const queriesPendingFilter = $('#queriesPendingFilter');
const queriesTierFilter = $('#queriesTierFilter');
const queriesScopeFilter = $('#queriesScopeFilter');
const queryScopeButton = $('#queryScopeButton');
const queryScopeOptions = $('#queryScopeOptions');
const queryPriorityButton = $('#queryPriorityButton');
const queryPriorityOptions = $('#queryPriorityOptions');
const queryPendingButton = $('#queryPendingButton');
const queryPendingOptions = $('#queryPendingOptions');
const queryTierButton = $('#queryTierButton');
const queryTierOptions = $('#queryTierOptions');
const applyQueryFiltersButton = $('#applyQueryFilters');
const pendingQueryFilters = { scope: 'mine', priority: 'all', pendingOn: 'all', tier: 'all' };
const queryKanbanShell = $('#queryKanbanShell');
const queryKanban = $('#queryKanban');
const queryListShell = $('#queryListShell');
const queryListBody = $('#queryListBody');
const queryListPagination = $('#queryListPagination');
const queryStatusTabs = $('#queryStatusTabs');
const queryEmptyState = $('#queryEmptyState');
const queryNameHeading = $('#queryNameHeading');
const queryValueHeading = $('#queryValueHeading');
const queryTypeModalBackdrop = $('#queryTypeModalBackdrop');
const queryDetailView = $('#queryDetailView');
const queryDetailContent = $('#queryDetailContent');
const tasksView = $('#tasksView');
const tasksNavLink = $('#tasksNavLink');
const tasksMobileNavButton = $('#tasksMobileNavButton');
const tasksResultCount = $('#tasksResultCount');
const tasksSearch = $('#tasksSearch');
const tasksFilterButton = $('#tasksFilterButton');
const tasksFilterPopover = $('#tasksFilterPopover');
const tasksPriorityFilter = $('#tasksPriorityFilter');
const tasksEntityFilter = $('#tasksEntityFilter');
const tasksAssigneeFilter = $('#tasksAssigneeFilter');
const tasksSort = $('#tasksSort');
const tasksDateFrom = $('#tasksDateFrom');
const tasksDateTo = $('#tasksDateTo');
const applyTaskFiltersButton = $('#applyTaskFilters');
const taskBoardShell = $('#taskBoardShell');
const taskBoard = $('#taskBoard');
const taskListShell = $('#taskListShell');
const taskListBody = $('#taskListBody');
const taskListPagination = $('#taskListPagination');
const taskStatusTabs = $('#taskStatusTabs');
const tasksEmptyState = $('#tasksEmptyState');
const taskBoardAnnouncement = $('#taskBoardAnnouncement');
const tasksRefreshButton = $('#tasksRefreshButton');
const newTaskButton = $('#newTaskButton');
const taskModalBackdrop = $('#taskModalBackdrop');
const taskDetailsBackdrop = $('#taskDetailsBackdrop');
const taskDetailsBody = $('#taskDetailsBody');
const taskDetailActions = $('#taskDetailActions');
const taskDeleteConfirm = $('#taskDeleteConfirm');
const taskCompleteButton = $('#taskCompleteButton');
const taskEditButton = $('#taskEditButton');
const taskDeleteButton = $('#taskDeleteButton');
const taskForm = $('#taskForm');
const taskId = $('#taskId');
const taskIdDisplay = $('#taskIdDisplay');
const taskTitleInput = $('#taskTitleInput');
const taskDescription = $('#taskDescription');
const taskStatus = $('#taskStatus');
const taskPriority = $('#taskPriority');
const taskAssigneeMultiselect = $('#taskAssigneeMultiselect');
const taskAssigneeButton = $('#taskAssigneeButton');
const taskAssigneeButtonLabel = $('#taskAssigneeButtonLabel');
const taskAssigneePopover = $('#taskAssigneePopover');
const taskDueDate = $('#taskDueDate');
const taskDueTime = $('#taskDueTime');
const taskModalTitle = $('#taskModalTitle');
const taskModalSubmit = $('#taskModalSubmit');
const overviewTaskCards = $('#overviewTaskCards');
const overviewPreferenceChips = $('#overviewPreferenceChips');
const overviewReferralTree = $('#overviewReferralTree');
const profileTaskRows = $('#profileTaskRows');
const profileTaskSearch = $('#profileTaskSearch');
const profileTaskPagination = $('#profileTaskPagination');
const profileTaskFilterButton = $('#profileTaskFilterButton');
const profileTaskFilterPopover = $('#profileTaskFilterPopover');
const profileTaskPriorityFilter = $('#profileTaskPriorityFilter');
const profileTaskEntityFilter = $('#profileTaskEntityFilter');
const profileTaskAssigneeFilter = $('#profileTaskAssigneeFilter');
const profileTaskSort = $('#profileTaskSort');
const profileTaskDateFrom = $('#profileTaskDateFrom');
const profileTaskDateTo = $('#profileTaskDateTo');
const applyProfileTaskFiltersButton = $('#applyProfileTaskFilters');
const referralTreeBackdrop = $('#referralTreeBackdrop');
const referralTreeStage = $('#referralTreeStage');
const referralReferrerSelect = $('#referralReferrerSelect');
const inboxSentSummary = $('#inboxSentSummary');
const inboxSentChannel = $('#inboxSentChannel');
const customerRows = $('#customerRows');
const customerRowActionMenu = $('#customerRowActionMenu');
const customerSearch = $('#customerSearch');
const customerLocationSearch = $('#customerLocationSearch');
const selectAllCustomers = $('#selectAllCustomers');
const emptyState = $('#emptyState');
const listTableScroller = $('#customerListView .table-scroller');
const pagination = $('#pagination');
const refreshButton = $('#refreshButton');
const createButton = $('#createButton');
const vendorModalBackdrop = $('#vendorModalBackdrop');
const vendorForm = $('#vendorForm');
const vendorName = $('#vendorName');
const customerCreateView = $('#customerCreateView');
const customerForm = $('#customerForm');
const customerName = $('#customerName');
const customerCode = $('#customerCode');
const primaryTravellerName = $('#primaryTravellerName');
const customerPhone = $('#customerPhone');
const customerWhatsapp = $('#customerWhatsapp');
const sameAsPhone = $('#sameAsPhone');
const customerPhotoButton = $('#customerPhotoButton');
const customerPhotoInput = $('#customerPhotoInput');
const customerPhotoPreview = $('#customerPhotoPreview');
const preferenceTypeahead = $('#preferenceTypeahead');
const preferenceChips = $('#preferenceChips');
const preferenceInput = $('#preferenceInput');
const preferenceSuggestions = $('#preferenceSuggestions');
const preferenceHidden = $('#preferenceHidden');
const onboardingReferrer = $('#onboardingReferrer');
const referralPersonFields = $('#referralPersonFields');
const referralChannelFields = $('#referralChannelFields');
const onboardingSecondary = $('#onboardingSecondary');
const onboardingContinue = $('#onboardingContinue');
const addTierButton = $('#addTierButton');
const queryModalBackdrop = $('#queryModalBackdrop');
const queryForm = $('#queryForm');
const queryCustomer = $('#queryCustomer');
const queryCustomerSearch = $('#queryCustomerSearch');
const queryCreateCustomerButton = $('#queryCreateCustomerButton');
const queryInlineCustomer = $('#queryInlineCustomer');
const queryInlineCustomerCode = $('#queryInlineCustomerCode');
const queryNewCustomerName = $('#queryNewCustomerName');
const queryNewCustomerPhone = $('#queryNewCustomerPhone');
const queryNewCustomerEmail = $('#queryNewCustomerEmail');
const queryCancelCustomerButton = $('#queryCancelCustomerButton');
const querySaveCustomerButton = $('#querySaveCustomerButton');
const querySecondary = $('#querySecondary');
const queryContinue = $('#queryContinue');
const queryTypeInput = $('#queryTypeInput');
const queryTypeFields = $('#queryTypeFields');
const queryRepeatFields = $('#queryRepeatFields');
const queryChildren = $('#queryChildren');
const queryChildAges = $('#queryChildAges');
const queryAssigneeMultiselect = $('#queryAssigneeMultiselect');
const queryAssigneeButton = $('#queryAssigneeButton');
const queryAssigneeButtonLabel = $('#queryAssigneeButtonLabel');
const queryAssigneePopover = $('#queryAssigneePopover');
const customerPipelineContent = $('#customerPipelineContent');
const bookingModalBackdrop = $('#bookingModalBackdrop');
const bookingForm = $('#bookingForm');
const bookingCustomer = $('#bookingCustomer');
const bookingSecondary = $('#bookingSecondary');
const bookingContinue = $('#bookingContinue');
const bookingServiceFields = $('#bookingServiceFields');
const bookingNoteFields = $('#bookingNoteFields');
const totalCustomers = $('#totalCustomers');
const fileModalBackdrop = $('#fileModalBackdrop');
const fileForm = $('#fileForm');
const fileCustomer = $('#fileCustomer');
const vaultList = $('#vaultList');
const vaultSearch = $('#vaultSearch');
const vaultSearchVisible = $('#vaultSearchVisible');
const vaultFilterButton = $('#vaultFilterButton');
const vaultFilterPopover = $('#vaultFilterPopover');
const vaultTierButton = $('#vaultTierButton');
const vaultTierOptions = $('#vaultTierOptions');
const vaultCategoryButton = $('#vaultCategoryButton');
const vaultCategoryOptions = $('#vaultCategoryOptions');
const vaultExpiringFilter = $('#vaultExpiringFilter');
const vaultApplyFiltersButton = $('#vaultApplyFilters');
const vaultAppliedFiltersElement = $('#vaultAppliedFilters');
const vaultEmptyState = $('#vaultEmptyState');
const vaultPagination = $('#vaultPagination');
const vaultTableHead = $('#vaultTableHead');
const toast = $('#toast');
const filterButton = $('#filterButton');
const filterPopover = $('#filterPopover');
const tierFilterOptions = $('#tierFilterOptions');
const groupFilterOptions = $('#groupFilterOptions');
const outstandingFilter = $('#outstandingFilter');
const expiringFilter = $('#expiringFilter');
const appliedFiltersElement = $('#appliedFilters');
const importModalBackdrop = $('#importModalBackdrop');
const importForm = $('#importForm');
const importDropzone = $('#importDropzone');
const importFileInput = $('#importFileInput');
const importFileCard = $('#importFileCard');
const submitImport = $('#submitImport');

const requestDocumentBackdrop = $('#requestDocumentBackdrop');
const requestDocumentForm = $('#requestDocumentForm');
const requestDocumentFormStage = $('#requestDocumentFormStage');
const requestDocumentLinkStage = $('#requestDocumentLinkStage');
const requestTraveller = $('#requestTraveller');
const generateRequestLink = $('#generateRequestLink');
const copyRequestLink = $('#copyRequestLink');
const previewRequestUpload = $('#previewRequestUpload');
const sendRequestLink = $('#sendRequestLink');
const requestUploadBackdrop = $('#requestUploadBackdrop');
const requestUploadForm = $('#requestUploadForm');
const requestUploadType = $('#requestUploadType');
const requestUploadName = $('#requestUploadName');
const requestUploadFile = $('#requestUploadFile');
const requestUploadPrompt = $('#requestUploadPrompt');
const submitRequestUpload = $('#submitRequestUpload');
const documentReviewBackdrop = $('#documentReviewBackdrop');
const documentReplacementFile = $('#documentReplacementFile');
const documentReviewManagementActions = $('#documentReviewManagementActions');
const documentDeleteConfirmation = $('#documentDeleteConfirmation');
const requestUploadError = $('#requestUploadError');
const requestUploadPreview = $('#requestUploadPreview');
const requestUploadPreviewImage = $('#requestUploadPreviewImage');
const requestUploadPreviewFrame = $('#requestUploadPreviewFrame');
const requestUploadSuccess = $('#requestUploadSuccess');
const documentReviewInbox = $('#documentReviewInbox');
const documentReviewQueue = $('#documentReviewQueue');
const customerActionMenuButton = $('#customerActionMenuButton');
const customerActionMenu = $('#customerActionMenu');
const customerEditBackdrop = $('#customerEditBackdrop');
const customerEditForm = $('#customerEditForm');
const customerEditName = $('#customerEditName');
const customerEditCode = $('#customerEditCode');
const customerEditCategory = $('#customerEditCategory');
const customerEditTiers = $('#customerEditTiers');
const customerEditLocation = $('#customerEditLocation');
const customerEditGroupType = $('#customerEditGroupType');
const customerEditPhone = $('#customerEditPhone');
const customerEditEmail = $('#customerEditEmail');
const customerEditValue = $('#customerEditValue');
const customerEditOutstanding = $('#customerEditOutstanding');
const profileEditBackdrop = $('#profileEditBackdrop');
const profileEditForm = $('#profileEditForm');
const profileEditFields = $('#profileEditFields');
const queryPositionBackdrop = $('#queryPositionBackdrop');
const queryPositionForm = $('#queryPositionForm');
const queryPositionFields = $('#queryPositionFields');
let activeProfileEditSection = '';
let activeProfileDateKey = '';
const customerMailThread = $('#customerMailThread');
const customerMailComposer = $('#customerMailComposer');
const customerMailSubject = $('#customerMailSubject');
const customerMailBody = $('#customerMailBody');
const sendCustomerMail = $('#sendCustomerMail');
const customerMailShell = $('#customerMailShell');
const customerMailListView = $('#customerMailListView');
const customerMailReader = $('#customerMailReader');
const customerMailTemplateButton = $('#customerMailTemplateButton');
const customerMailTemplateMenu = $('#customerMailTemplateMenu');
const customerMailAttachmentInput = $('#customerMailAttachmentInput');
const customerMailComposerAttachments = $('#customerMailComposerAttachments');
const customerDeleteBackdrop = $('#customerDeleteBackdrop');
const customerNotesShortcut = $('#customerNotesShortcut');
const customerNotesButton = $('#customerNotesButton');
const customerNotesLabel = $('#customerNotesLabel');
const customerNotesShortcutCount = $('#customerNotesShortcutCount');
const customerNotesBackdrop = $('#customerNotesBackdrop');
const customerNotesPopover = $('.customer-notes-popover');
const customerNotesBrowse = $('#customerNotesBrowse');
const customerNotesModeButton = $('#customerNotesModeButton');
const customerNotesSearch = $('#customerNotesSearch');
const customerNoteForm = $('#customerNoteForm');
const customerNoteText = $('#customerNoteText');
const customerNotePinned = $('#customerNotePinned');
const customerNoteRelatedButton = $('#customerNoteRelatedButton');
const customerNoteRelatedMenu = $('#customerNoteRelatedMenu');
const customerNoteRelatedValue = $('#customerNoteRelatedValue');
const customerNotesList = $('#customerNotesList');
const customerNotesEmpty = $('#customerNotesEmpty');
const saveCustomerNote = $('#saveCustomerNote');
const travellerDocumentHierarchy = $('#travellerDocumentHierarchy');
const travellerAccordion = $('#travellerAccordion');
const addTravellerButton = $('#addTravellerButton');
const travellerModalBackdrop = $('#travellerModalBackdrop');
const travellerForm = $('#travellerForm');
const travellerPrimary = $('#travellerPrimary');
const travellerFullName = $('#travellerFullName');
const travellerRelationship = $('#travellerRelationship');
const travellerDateOfBirth = $('#travellerDateOfBirth');
const travellerNationality = $('#travellerNationality');
const travellerModalPhone = $('#travellerModalPhone');
const travellerModalEmail = $('#travellerModalEmail');
const travellerAddress = $('#travellerAddress');
const travellerPreferenceTypeahead = $('#travellerPreferenceTypeahead');
const travellerPreferenceInput = $('#travellerPreferenceInput');
const travellerPreferenceSuggestions = $('#travellerPreferenceSuggestions');
const travellerPreferenceChips = $('#travellerPreferenceChips');
const clearTravellerPreferences = $('#clearTravellerPreferences');
const deleteTravellerButton = $('#deleteTravellerButton');
const editTravellerButton = $('#editTravellerButton');
const saveTravellerButton = $('#saveTravellerButton');
function escapeHTML(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
}
const shellNotifications = [
  { id: 'notification-task', title: 'Task due today', detail: 'Review the passport copies for Bali group departure.', time: '12 minutes ago', unread: true, target: 'tasks' },
  { id: 'notification-query', title: 'Query needs attention', detail: 'Dubai family holiday has been waiting for a proposal.', time: '48 minutes ago', unread: true, target: 'queries' },
  { id: 'notification-customer', title: 'Customer profile updated', detail: 'A traveller preference was added to the customer record.', time: 'Yesterday', unread: false, target: 'customers' },
  { id: 'notification-workspace', title: 'Workspace digest ready', detail: 'Your weekly sales and operations summary is available.', time: 'Monday', unread: false, target: 'dashboard' },
];
let notificationFilter = 'unread';
let notificationPageUnreadOnly = false;
let globalSearchRestoreTarget = null;
let notificationCenterRestoreTarget = null;
let accountMenuRestoreTarget = null;
let suppressShellSearchFocus = false;

function initials(name) {
  return name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}
function avatarMarkup(customer) {
  if (customer.photo) {
    const name = customer.name || 'Customer';
    return `<img src="${escapeHTML(customer.photo)}" alt="${escapeHTML(`${name} profile photo`)}" />`;
  }
  return escapeHTML(initials(customer.name));
}

// Company avatar: Paryatech favicon inside the avatar container, identical everywhere.
const PARYATECH_AVATAR_IMAGE = new URL('./assets/paryatech-favicon.svg', import.meta.url).href;
const QUERY_ICON_ASSETS = {
  Trip: new URL('./assets/query-trip.svg', import.meta.url).href,
  Flight: new URL('./assets/query-flight.svg', import.meta.url).href,
  Accommodation: new URL('./assets/query-accommodation.svg', import.meta.url).href,
  Visa: new URL('./assets/query-visa.svg', import.meta.url).href,
  Cruise: new URL('./assets/query-cruise.svg', import.meta.url).href,
  Transport: new URL('./assets/query-transport.svg', import.meta.url).href,
};
function paryatechAvatarMarkup() {
  return `<img class="paryatech-avatar-img" src="${PARYATECH_AVATAR_IMAGE}" alt="Paryatech" />`;
}
function renderParyatechAvatar(element) {
  element.replaceChildren();
  const image = document.createElement('img');
  image.className = 'paryatech-avatar-img';
  image.src = PARYATECH_AVATAR_IMAGE;
  image.alt = 'Paryatech';
  element.append(image);
}


function renderAvatar(element, customer) {
  element.replaceChildren();
  if (!customer.photo) {
    element.textContent = initials(customer.name);
    return;
  }
  const image = document.createElement('img');
  image.src = customer.photo;
  image.alt = `${customer.name || 'Customer'} profile photo`;
  element.append(image);
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })
    .format(value);
}

const INDIAN_STATE_BY_CITY = {  hyderabad: 'Telangana',
  bengaluru: 'Karnataka',
  mumbai: 'Maharashtra',
  mangalore: 'Karnataka',
  delhi: 'Delhi',
  pune: 'Maharashtra',
  chennai: 'Tamil Nadu',
  ahmedabad: 'Gujarat',
  kolkata: 'West Bengal',
  noida: 'Uttar Pradesh',
  lucknow: 'Uttar Pradesh',
  jaipur: 'Rajasthan',
  surat: 'Gujarat',
  indore: 'Madhya Pradesh',
  ghaziabad: 'Uttar Pradesh',
  vadodara: 'Gujarat',
};

// Vendor-style location label: "City, State, IN" with a pin icon in the cell.
function customerLocationLabel(customer) {
  const parts = String(customer?.location ?? '').split(',').map((part) => part.trim()).filter(Boolean);
  if (!parts.length) return '—';
  const normalizeCountry = (value) => (/^india$/i.test(value) || /^in$/i.test(value) ? 'IN' : value);
  if (parts.length === 1) {
    const state = INDIAN_STATE_BY_CITY[parts[0].toLocaleLowerCase()];
    return state ? `${parts[0]}, ${state}, IN` : `${parts[0]}, IN`;
  }
  if (parts.length === 2) return `${parts[0]}, ${parts[1]}, IN`;
  return `${parts[0]}, ${parts[1]}, ${normalizeCountry(parts[parts.length - 1])}`;
}

const CUSTOMER_TIER_CHOICES = ['Gold', 'Silver', 'Bronze', 'Corporate', 'Other'];

// Tier column supports multiple labels per customer. Legacy records carry a
// single `tier`; `tiers` is the source of truth once assigned.
function customerTierList(customer) {
  if (Array.isArray(customer?.tiers) && customer.tiers.length) return customer.tiers.filter(Boolean);
  return customer?.tier ? [customer.tier] : [];
}

function customerTierMatches(customer, tier) {
  return customerTierList(customer).includes(tier);
}

// Customer-list Tier filter is multi-select: `tier` holds an array of tier
// names (match ANY). tierSelection() tolerates legacy single-string values.
function tierSelection(list) {
  if (Array.isArray(list)) return list.filter(Boolean);
  return list ? [list] : [];
}

function allFilterTierChoices() {
  const extras = [];
  customers.forEach((customer) => {
    customerTierList(customer).forEach((tier) => {
      if (!CUSTOMER_TIER_CHOICES.includes(tier) && !extras.includes(tier)) extras.push(tier);
    });
  });
  return [...CUSTOMER_TIER_CHOICES, ...extras];
}

function renderTierFilterOptions() {
  tierFilterOptions.innerHTML = allFilterTierChoices().map((tier) => `<label class="customer-filter-option"><input type="checkbox" data-filter-value="${escapeHTML(tier)}" /><span>${escapeHTML(tier)}</span></label>`).join('');
}

function setCustomerTiers(customer, tiers) {
  const next = [...new Set((tiers || []).map(String).map((tier) => tier.trim()).filter(Boolean))];
  if (!next.length) return;
  customer.tiers = next;
  customer.tier = next[0];
}

const TEAM_MEMBERS = [
  { name: 'Rishi Charan', desk: 'Customer desk' },
  { name: 'Kumar Iyer', desk: 'Operations' },
  { name: 'Meera Shah', desk: 'Operations' },
  { name: 'Vikram Soni', desk: 'Sales' },
];

// Tasks and queries can be assigned to multiple team members. `assignees` /
// `owners` arrays are the source of truth; legacy `assignee` / `owner`
// strings stay synced to the first entry ('Unassigned' when empty).
function taskAssigneeList(task) {
  if (Array.isArray(task?.assignees) && task.assignees.length) return task.assignees.filter(Boolean);
  if (task?.assignee && task.assignee !== 'Unassigned') return [task.assignee];
  return [];
}

function taskAssigneeMatches(task, name) {
  if (name === 'Unassigned') return taskAssigneeList(task).length === 0;
  return taskAssigneeList(task).includes(name);
}

function setTaskAssignees(task, assignees) {
  const next = [...new Set((assignees || []).map(String).map((name) => name.trim()).filter(Boolean).filter((name) => name !== 'Unassigned'))];
  task.assignees = next;
  task.assignee = next[0] ?? 'Unassigned';
}

function queryOwnerList(query) {
  if (Array.isArray(query?.owners) && query.owners.length) return query.owners.filter(Boolean);
  if (query?.owner && query.owner !== 'Unassigned') return [query.owner];
  return [];
}

function queryOwnerMatches(query, name) {
  if (name === 'Unassigned') return queryOwnerList(query).length === 0;
  return queryOwnerList(query).includes(name);
}

function setQueryOwners(query, owners) {
  const next = [...new Set((owners || []).map(String).map((name) => name.trim()).filter(Boolean).filter((name) => name !== 'Unassigned'))];
  query.owners = next;
  query.owner = next[0] ?? 'Unassigned';
}

function assigneeDisplayNames(list) {
  const names = Array.isArray(list) ? list.filter(Boolean) : [];
  return names.length ? names.join(', ') : 'Unassigned';
}

function taskAssigneeAvatar(task) {
  const names = taskAssigneeList(task);
  return names.length ? initials(names[0]) : '—';
}

function queryOwnerAvatar(query) {
  const names = queryOwnerList(query);
  return names.length ? initials(names[0]) : 'UA';
}

function assigneeOptionsMarkup(selected = [], fieldName = 'assignee') {
  const assigned = Array.isArray(selected) ? selected : (selected ? [selected] : []);
  const extras = assigned.filter((name) => name !== 'Unassigned' && !TEAM_MEMBERS.some((member) => member.name === name));
  const option = (name, desk) => `<label><input type="checkbox" name="${fieldName}" value="${escapeHTML(name)}"${assigned.includes(name) ? ' checked' : ''} /><span><i><svg><use href="#i-check" /></svg></i><strong>${escapeHTML(name)}</strong><small>${escapeHTML(desk)}</small></span></label>`;
  return [...TEAM_MEMBERS.map((member) => option(member.name, member.desk)), ...extras.map((name) => option(name, 'Team member'))].join('');
}

function assigneeDropdownOptionsMarkup(selected = [], fieldName = 'taskAssignees') {
  const assigned = Array.isArray(selected) ? selected : (selected ? [selected] : []);
  const extras = assigned.filter((name) => name !== 'Unassigned' && !TEAM_MEMBERS.some((member) => member.name === name));
  const option = (name, desk) => `<label class="assignee-option"><input type="checkbox" name="${fieldName}" value="${escapeHTML(name)}"${assigned.includes(name) ? ' checked' : ''} /><span class="assignee-check" aria-hidden="true"><svg><use href="#i-check" /></svg></span><span class="assignee-text"><strong>${escapeHTML(name)}</strong><small>${escapeHTML(desk)}</small></span></label>`;
  return [...TEAM_MEMBERS.map((member) => option(member.name, member.desk)), ...extras.map((name) => option(name, 'Team member'))].join('');
}

function taskAssigneeDropdownMarkup(selected = []) {
  return assigneeDropdownOptionsMarkup(selected, 'taskAssignees');
}

function taskAssigneeSelections() {
  if (!taskAssigneePopover) return [];
  return $$('input[name="taskAssignees"]', taskAssigneePopover)
    .filter((input) => input.checked)
    .map((input) => input.value);
}

function syncTaskAssigneeButton() {
  if (!taskAssigneeButton || !taskAssigneePopover) return;
  const selected = taskAssigneeSelections();
  if (taskAssigneeButtonLabel) {
    taskAssigneeButtonLabel.textContent =
      selected.length === 0 ? 'Select assignees'
      : selected.length === 1 ? selected[0]
      : `${selected[0]} +${selected.length - 1}`;
  }
  taskAssigneeButton.classList.toggle('has-value', selected.length > 0);
}

function setTaskAssigneeOpen(open) {
  if (!taskAssigneeButton || !taskAssigneePopover) return;
  taskAssigneePopover.hidden = !open;
  taskAssigneeButton.setAttribute('aria-expanded', String(open));
}

function tierEditOptionsMarkup(customer) {
  const assigned = customerTierList(customer);
  const extras = assigned.filter((tier) => !CUSTOMER_TIER_CHOICES.includes(tier));
  const option = (tier, extra = false) => `<label class="${extra ? 'tier-custom' : `tier-${tier.toLowerCase()}`}"><input type="checkbox" name="tier" value="${escapeHTML(tier)}"${assigned.includes(tier) ? ' checked' : ''} /><span></span>${escapeHTML(tier)}</label>`;
  return [...CUSTOMER_TIER_CHOICES.map((tier) => option(tier)), ...extras.map((tier) => option(tier, true))].join('');
}

function customerRowsMarkup(rows, interactive = true) {
  return rows.map((customer) => `
    <tr data-customer-id="${escapeHTML(customer.id)}" ${interactive ? `tabindex="0" aria-label="Open ${escapeHTML(customer.name)} profile"` : ''}>
      <td><div class="customer-cell"><span class="avatar">${avatarMarkup(customer)}</span><div class="customer-identity"><span class="customer-name">${escapeHTML(customer.name)}</span><span class="customer-id">${escapeHTML(customer.id)}</span></div></div></td>
      <td><span class="kind-badge">${escapeHTML(customer.category)}</span></td>
      <td><span class="tier-cell">${customerTierList(customer).map((tier) => `<span class="tier tier-${tier.toLowerCase()}">${escapeHTML(tier)}</span>`).join('')}</span></td>
      <td><span class="customer-location"><svg aria-hidden="true"><use href="#i-map-pin" /></svg><span>${escapeHTML(customerLocationLabel(customer))}</span></span></td>
      <td>${customer.travellers} ${customer.travellers === 1 ? 'traveller' : 'travellers'}</td>
      <td class="numeric">${formatCurrency(customer.value)}</td>
      <td><div class="row-actions"><button class="row-menu" type="button" data-customer-menu="${escapeHTML(customer.id)}" aria-haspopup="menu" aria-expanded="false" aria-controls="customerRowActionMenu" aria-label="Actions for ${escapeHTML(customer.name)}"><svg><use href="#i-more" /></svg></button></div></td>
    </tr>`).join('');
}

function customerIdNumber(customer) {
  return Number(customer.id.replace(/\D/g, ''));
}

function customerContactDetails(customer) {
  const serial = customerIdNumber(customer);
  const emailName = customer.name.toLocaleLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/(^\.|\.$)/g, '');
  const phoneSuffix = String(20245480 + serial * 137).slice(-8);
  return {
    phone: customer.phone || `+91 98${phoneSuffix.slice(0, 3)} ${phoneSuffix.slice(3)}`,
    email: customer.email || `${emailName}@example.com`,
  };
}

function ensureCustomerDetailData(customer) {
  const serial = customerIdNumber(customer);
  const month = [1, 3, 6, 9][(serial - 1) % 4];
  customer.source ??= ['Website', 'Referral', 'Walk-in', 'Campaign'][(serial - 1) % 4];
  customer.createdAt ??= `${2022 + (serial % 4)}-${String(month).padStart(2, '0')}-01T00:00:00+05:30`;
  customer.contactName ??= customer.name;
  customer.contactLocation ??= customer.location;
  customer.preferences ??= {
    seat: 'Aisle seat',
    hotel: 'Boutique / heritage',
    budget: 'Mid-range',
    accessibility: 'Ground-floor room',
  };
  customer.importantDates ??= [
    { key: 'birthday', type: 'Birthday', label: 'Birthday', date: '1998-06-14' },
    { key: 'passport-expiry', type: 'Passport expiry', label: 'Passport expiry', date: '2035-07-25' },
    { key: 'anniversary', type: 'Anniversary', label: 'Anniversary', date: '' },
    { key: 'custom-date', type: 'Custom date', label: 'Custom date', date: '' },
  ];
  return customer;
}

function customerCreatedDateLabel(customer) {
  const date = new Date(customer.createdAt || '');
  if (Number.isNaN(date.getTime())) return 'Not set';
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
}

function customerDateLabel(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return 'Not set';
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(`${value}T00:00:00`));
}

function renderCustomerOverviewDetails(customer) {
  ensureCustomerDetailData(customer);
  $('#overviewImportantDates').innerHTML = customer.importantDates.map((item) => `
    <div><dt>${escapeHTML(item.label)}</dt><dd>${escapeHTML(customerDateLabel(item.date))}</dd></div>`).join('');
  const preferences = customer.preferences;
  const preferenceTags = Array.isArray(customer.preferenceTags) ? customer.preferenceTags.filter(Boolean) : [];
  const preferenceChips = preferenceTags.length
    ? preferenceTags
    : [
      preferences.seat && `Seat preference: ${preferences.seat}`,
      preferences.hotel && `Hotel preference: ${preferences.hotel}`,
      preferences.budget && `Budget band: ${preferences.budget}`,
      preferences.accessibility && `Accessibility: ${preferences.accessibility}`,
    ].filter(Boolean);
  overviewPreferenceChips.innerHTML = preferenceChips.length
    ? preferenceChips.map((chip) => `<span class="preference-chip">${escapeHTML(chip)}</span>`).join('')
    : '<p class="trio-empty">No preferences recorded.</p>';
}

let customerPageSize = 8;
const WORKSPACE_LIST_PAGE_SIZE = 6;
const VAULT_PAGE_SIZE = 8;

function fitCustomerPage() {
  const view = $('#customerListView');
  if (view.hidden || listTableScroller.hidden) return;
  const main = view.closest('.main-content');
  const sheet = listTableScroller.querySelector('table');
  const rowHeight = parseFloat(getComputedStyle(view).getPropertyValue('--sheet-row-height'));
  const footerHeight = pagination.getBoundingClientRect().height || 59;
  const scrollbarHeight = listTableScroller.offsetHeight - listTableScroller.clientHeight;
  const available = main.getBoundingClientRect().bottom - listTableScroller.getBoundingClientRect().top
    - sheet.tHead.getBoundingClientRect().height - footerHeight - scrollbarHeight;
  const nextSize = Math.max(1, Math.min(8, Math.floor(available / rowHeight)));
  if (nextSize === customerPageSize) return;
  const firstRecord = (currentPage - 1) * customerPageSize;
  customerPageSize = nextSize;
  currentPage = Math.floor(firstRecord / customerPageSize) + 1;
  setCustomerRowActionMenu();
  renderCustomers();
  renderPagination();
}

function filteredCustomerPool() {
  const query = customerSearch.value.trim().toLocaleLowerCase();
  const locationQuery = customerLocationSearch?.value.trim().toLocaleLowerCase() ?? '';
  return customers.filter((customer) => {
    const matchesCategory = activeCategory === 'All' || customer.category === activeCategory;
    const matchesSearch = !query || [customer.name, customer.id, customer.category, ...customerTierList(customer), customer.location, customerLocationLabel(customer)]
      .some((value) => String(value).toLocaleLowerCase().includes(query));
    const matchesLocation = !locationQuery || String(customer.location).toLocaleLowerCase().includes(locationQuery)
      || customerLocationLabel(customer).toLocaleLowerCase().includes(locationQuery);
    const customerGroup = customer.groupType ?? (customer.category === 'B2C' ? 'Family' : customer.category === 'B2B' ? 'Corporate' : 'Other');
    const selectedGroups = tierSelection(appliedFilters.groupType);
    const matchesGroup = !selectedGroups.length || selectedGroups.includes(customerGroup);
    const matchesOutstanding = !appliedFilters.outstanding || customer.outstanding > 0;
    const vaultCustomer = vaultCustomers.find((item) => item.id === customer.id && item.name === customer.name);
    const matchesExpiry = !appliedFilters.expiring || vaultCustomerSummary(vaultCustomer).expiring > 0;
    const selectedTiers = tierSelection(appliedFilters.tier);
    const matchesTier = !selectedTiers.length || selectedTiers.some((tier) => customerTierMatches(customer, tier));
    return matchesCategory && matchesSearch && matchesLocation && matchesGroup && matchesOutstanding && matchesExpiry && matchesTier;
  });
}

function customerResultCount() {
  return filteredCustomerPool().length;
}

function customerTotalPages() {
  return Math.max(1, Math.ceil(customerResultCount() / customerPageSize));
}

function filteredCustomers() {
  const pool = filteredCustomerPool();
  const totalPages = Math.max(1, Math.ceil(pool.length / customerPageSize));
  currentPage = Math.min(currentPage, totalPages);
  const start = (currentPage - 1) * customerPageSize;
  return pool.slice(start, start + customerPageSize);
}

function renderAppliedFilters() {
  const chips = [
    ...tierSelection(appliedFilters.tier).map((tier) => ({ key: 'tier', tier, label: tier })),
    ...tierSelection(appliedFilters.groupType).map((group) => ({ key: 'groupType', group, label: group })),
    appliedFilters.outstanding && { key: 'outstanding', label: 'Outstanding balance' },
    appliedFilters.expiring && { key: 'expiring', label: 'Document expiring soon' },
  ].filter(Boolean);
  appliedFiltersElement.innerHTML = chips.map((chip) => `<span class="filter-chip">${escapeHTML(chip.label)}<button type="button" data-clear-filter="${chip.key}"${chip.tier ? ` data-tier-value="${escapeHTML(chip.tier)}"` : ''}${chip.group ? ` data-group-value="${escapeHTML(chip.group)}"` : ''} aria-label="Remove ${escapeHTML(chip.label)} filter"><svg><use href="#i-x" /></svg></button></span>`).join('');
  appliedFiltersElement.hidden = chips.length === 0;
}

function syncSelectAll() {
  if (!selectAllCustomers) return;
  const rows = filteredCustomers();
  const selectable = rows.map((customer) => customer.id);
  const selectedOnPage = selectable.filter((id) => selectedCustomerIds.has(id));
  selectAllCustomers.checked = selectable.length > 0 && selectedOnPage.length === selectable.length;
  selectAllCustomers.indeterminate = selectedOnPage.length > 0 && selectedOnPage.length < selectable.length;
}

function renderCustomers() {
  totalCustomerCount = customers.length;
  if (totalCustomers) totalCustomers.textContent = totalCustomerCount;
  $$('.category-tab').forEach((tab) => {
    const category = tab.dataset.category;
    const count = category === 'All' ? customers.length : customers.filter((customer) => customer.category === category).length;
    $('.category-tab-count', tab).textContent = count;
  });
  const lifetimeValueElement = $('#lifetimeValue');
  if (lifetimeValueElement) lifetimeValueElement.textContent = formatCurrency(customers.reduce((sum, customer) => sum + Number(customer.value || 0), 0));
  const outstandingValueElement = $('#outstandingValue');
  if (outstandingValueElement) outstandingValueElement.textContent = formatCurrency(customers.reduce((sum, customer) => sum + Number(customer.outstanding || 0), 0));
  const expiringDocumentsElement = $('#expiringDocuments');
  if (expiringDocumentsElement) expiringDocumentsElement.textContent = vaultCustomers
    .reduce((sum, customer) => sum + vaultCustomerSummary(customer).expiring, 0);
  const rows = filteredCustomers();
  const count = customerResultCount();
  customerRows.innerHTML = customerRowsMarkup(rows);
  enhanceListSheet(customerRows.closest('table'), 'customers', customers.map(item => item.id));
  emptyState.hidden = rows.length > 0;
  listTableScroller.hidden = rows.length === 0;
  pagination.hidden = customerResultCount() === 0;
  syncSelectAll();
  renderAppliedFilters();
  syncFilterControls();
}


function paginationMarkup(page, totalPages, totalItems, pageSize = customerPageSize, pageKey = 'page', entityLabel = 'customers') {
  const activePage = Math.max(1, Math.min(page, totalPages));
  const firstItem = ((activePage - 1) * pageSize) + 1;
  const lastItem = Math.min(activePage * pageSize, totalItems);
  const previousBlocked = activePage === 1;
  const nextBlocked = activePage === totalPages;
  const pageNumbers = pageKey === 'page'
    ? [...new Set([1, activePage - 1, activePage, activePage + 1, totalPages])].filter((number) => number >= 1 && number <= totalPages).sort((a, b) => a - b)
    : [activePage];
  const numberedButtons = pageNumbers.map((number, index) => `${index && number - pageNumbers[index - 1] > 1 ? '<span aria-hidden="true">…</span>' : ''}<button class="page-button${number === activePage ? ' is-active' : ''}" type="button" data-${pageKey}="${number}" aria-label="Page ${number}"${number === activePage ? ' aria-current="page"' : ''}>${number}</button>`).join('');
  return `
    <span class="pagination-range">Showing ${totalItems ? firstItem : 0}–${lastItem} of ${totalItems} ${entityLabel}</span>
    <span class="pagination-pages">
      <button class="page-button page-button-nav${previousBlocked ? ' is-blocked' : ''}" type="button" data-${pageKey}="prev" aria-label="Previous page"${previousBlocked ? ' disabled aria-disabled="true" data-pagination-blocked' : ''}><svg aria-hidden="true"><use href="#i-chevron-left" /></svg></button>
      ${numberedButtons}
      <button class="page-button page-button-nav${nextBlocked ? ' is-blocked' : ''}" type="button" data-${pageKey}="next" aria-label="Next page"${nextBlocked ? ' disabled aria-disabled="true" data-pagination-blocked' : ''}><svg aria-hidden="true"><use href="#i-chevron-right" /></svg></button>
    </span>`;
}

function renderPagination() {
  const totalPages = customerTotalPages();
  const totalItems = customerResultCount();
  currentPage = Math.max(1, Math.min(currentPage, totalPages));
  pagination.innerHTML = totalItems > 0 ? paginationMarkup(currentPage, totalPages, totalItems) : '';
  pagination.hidden = totalItems === 0;
}

function setCategory(category) {
  activeCategory = category;
  currentPage = 1;
  $$('.category-tab').forEach((tab) => {
    const active = tab.dataset.category === category;
    tab.classList.toggle('is-active', active);
    tab.setAttribute('aria-selected', String(active));
  });
  renderCustomers();
  renderPagination();
}

function showToast(message) {
  window.clearTimeout(toastTimer);
  toast.textContent = message;
  toast.hidden = false;
  toastTimer = window.setTimeout(() => { toast.hidden = true; }, 2600);
}
function selectedRequestTypes() {
  return $$('input[name="requestType"]:checked', requestDocumentFormStage).map((input) => input.value);
}

function updateRequestLinkAction() {
  generateRequestLink.disabled = !requestTraveller.value || selectedRequestTypes().length === 0;
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const field = document.createElement('textarea');
    field.value = text;
    field.style.position = 'fixed';
    field.style.opacity = '0';
    document.body.append(field);
    field.select();
    const copied = document.execCommand('copy');
    field.remove();
    return copied;
  }
}

const travellerNamesByCustomer = {
  'CUST-0001': ['Vandan Jain', 'Vrushab Jain', 'Aditi Jain', 'Reyansh Jain'],
  'CUST-0002': ['Rishi Charan', 'Ananya Charan'],
};

function travellerNamesForCustomer(customer) {
  const profiles = travellerProfilesByCustomer.get(customer.id);
  if (profiles?.length) return [...profiles].sort((left, right) => Number(right.primary) - Number(left.primary)).map((profile) => profile.name);
  const count = customer.travellers ?? 1;
  const vaultCustomer = vaultCustomers.find((item) => item.id === customer.id && item.name === customer.name);
  const names = [...(travellerNamesByCustomer[customer.id] ?? [])];
  (vaultCustomer?.documents ?? []).forEach((documentItem) => {
    if (documentItem.traveller && !names.includes(documentItem.traveller)) names.push(documentItem.traveller);
  });
  if (!names.length) names.push(customer.name);
  const familyName = customer.name.replace(/\s+(family|group)$/i, '').trim() || customer.name;
  while (names.length < count) names.push(`${familyName} · Traveller ${names.length + 1}`);
  return names.slice(0, count);
}

function normalizedDocumentType(type) {
  if (type === 'ID') return 'National ID';
  return type;
}

function documentStatus(documentItem) {
  if (documentItem.status) return documentItem.status;
  if (documentItem.expiring) return 'Expiring soon';
  if (documentItem.expiry && documentItem.expiry !== 'N/A') {
    const expiryTime = Date.parse(`1 ${documentItem.expiry}`);
    if (Number.isFinite(expiryTime) && expiryTime < Date.now()) return 'Expired';
  }
  return 'Valid';
}

function documentStatusClass(status) {
  if (status === 'Valid' || status === 'Approved') return 'status-valid';
  if (status === 'Pending review') return 'status-approval';
  if (status === 'Expiring soon') return 'status-expiring';
  if (status === 'Expired') return 'status-expired';
  if (status === 'Missing') return 'status-missing';
  return 'status-requested';
}
function isGroupDocument(documentItem) {
  return documentItem.scope === 'group' || documentItem.traveller === 'Group' || !documentItem.traveller;
}


function buildTravellerDocumentGroups(customer) {
  const names = travellerNamesForCustomer(customer);
  const vaultCustomer = vaultCustomers.find((item) => item.id === customer.id && item.name === customer.name);
  const uploadedDocuments = uploadedRequestDocuments.get(customer.id) ?? [];
  const sourceDocuments = [...(vaultCustomer?.documents ?? []), ...uploadedDocuments].filter((documentItem) => !isGroupDocument(documentItem));
  const requiredTypes = ['Passport', 'Visa', 'National ID'];

  return names.map((traveller, travellerIndex) => {
    const matchedDocuments = sourceDocuments.filter((documentItem) => {
      if (documentItem.traveller === traveller) return true;
      return travellerIndex === 0 && documentItem.traveller === customer.name;
    });
    const documents = matchedDocuments.map((documentItem, documentIndex) => {
      const type = normalizedDocumentType(documentItem.type);
      const documentId = documentItem.id ?? `${customer.id}-traveller-${travellerIndex}-document-${documentIndex}`;
      documentItem.id = documentId;
      return {
        ...documentItem,
        id: documentId,
        traveller,
        type,
        status: documentStatus(documentItem),
        expiry: documentItem.expiry ?? 'Not provided',
        fileName: documentItem.fileName ?? documentItem.name,
        source: documentItem.source ?? 'Agency upload',
        required: requiredTypes.includes(type),
      };
    });
    const presentTypes = new Set(documents.map((documentItem) => documentItem.type));
    requiredTypes.forEach((type) => {
      if (presentTypes.has(type)) return;
      documents.push({
        id: `${customer.id}-traveller-${travellerIndex}-missing-${type.toLocaleLowerCase().replace(/\s+/g, '-')}`,
        traveller,
        name: `${type} required`,
        type,
        status: 'Missing',
        expiry: '—',
        fileName: '',
        source: 'Requirement',
        required: true,
      });
    });
    return { traveller, index: travellerIndex, kind: 'traveller', documents };
  });
}
function buildGroupDocumentGroups(customer) {
  const vaultCustomer = vaultCustomers.find((item) => item.id === customer.id && item.name === customer.name);
  const uploadedDocuments = uploadedRequestDocuments.get(customer.id) ?? [];
  const documents = [...(vaultCustomer?.documents ?? []), ...uploadedDocuments]
    .filter(isGroupDocument)
    .map((documentItem, documentIndex) => {
      const type = normalizedDocumentType(documentItem.type);
      const documentId = documentItem.id ?? `${customer.id}-group-document-${documentIndex}`;
      documentItem.id = documentId;
      return {
        ...documentItem,
        id: documentId,
        traveller: `${customer.name} group`,
        type,
        status: documentStatus(documentItem),
        expiry: documentItem.expiry ?? 'Not provided',
        fileName: documentItem.fileName ?? documentItem.name,
        source: documentItem.source ?? 'Agency upload',
        required: Boolean(documentItem.required),
      };
    });
  return documents.length
    ? [{ traveller: `${customer.name} group`, index: 'group', kind: 'group', documents }]
    : [];
}
function storedDocumentById(id, customer = selectedCustomer) {
  const uploaded = uploadedRequestDocuments.get(customer.id) ?? [];
  const uploadedDocument = uploaded.find((documentItem) => documentItem.id === id);
  if (uploadedDocument) return { documentItem: uploadedDocument, collection: uploaded, source: 'uploaded' };
  const vaultCustomer = vaultCustomers.find((item) => item.id === customer.id && item.name === customer.name);
  const documentItem = vaultCustomer?.documents.find((item) => item.id === id);
  return documentItem ? { documentItem, collection: vaultCustomer.documents, source: 'vault', vaultCustomer } : null;
}



function emptyTravellerPreferences() {
  return Object.fromEntries(TRAVELLER_PREFERENCE_GROUPS.flatMap((group) => group.fields.map((field) => [field.key, []])));
}

function normalizeTravellerPreferences(preferences = {}) {
  const normalized = emptyTravellerPreferences();
  TRAVELLER_PREFERENCE_GROUPS.forEach((group) => group.fields.forEach((field) => {
    const values = Array.isArray(preferences[field.key]) ? preferences[field.key] : preferences[field.key] ? [preferences[field.key]] : [];
    normalized[field.key] = values.filter((value) => field.options.includes(value));
    if (!field.multiple) normalized[field.key] = normalized[field.key].slice(0, 1);
  }));
  return normalized;
}

function seededTravellerPreferences(index) {
  const seeds = [
    { seatPreference: ['Aisle'], hotelCategory: ['Boutique'], dietary: ['Vegetarian'], travelStyle: ['Family'] },
    { seatPreference: ['Window'], hotelCategory: ['4 Star'], travelStyle: ['Leisure'] },
    { seatPreference: ['Window'], hotelStar: ['Resort'], dietary: ['Jain'] },
    { travelStyle: ['Family'] },
  ];
  return normalizeTravellerPreferences(seeds[index] ?? {});
}

function travellerPreferences(profile) {
  const preferences = normalizeTravellerPreferences(profile?.preferences);
  return TRAVELLER_PREFERENCE_GROUPS.flatMap((group) => group.fields.flatMap((field) =>
    preferences[field.key].map((value) => `${field.label}: ${value}`)));
}

function travellerPicksFromPreferences(preferences = {}) {
  const normalized = normalizeTravellerPreferences(preferences);
  const picks = [];
  TRAVELLER_PREFERENCE_GROUPS.forEach((group) => group.fields.forEach((field) => {
    normalized[field.key].forEach((value) => picks.push({ field: field.key, label: field.label, value }));
  }));
  return picks;
}

function travellerPreferencesFromPicks(picks) {
  const grouped = {};
  (picks ?? []).forEach((pick) => {
    if (!pick || typeof pick.field !== 'string' || typeof pick.value !== 'string') return;
    (grouped[pick.field] ??= []).push(pick.value);
  });
  return normalizeTravellerPreferences(grouped);
}

function syncTravellerPreferenceDraft() {
  draftTravellerPreferences = travellerPreferencesFromPicks(travellerPreferencePicks);
}

function closeTravellerPreferenceSuggestions() {
  if (!travellerPreferenceSuggestions || !travellerPreferenceInput) return;
  travellerPreferenceSuggestions.hidden = true;
  travellerPreferenceInput.setAttribute('aria-expanded', 'false');
}

function renderTravellerPreferenceChips() {
  const readOnly = travellerModalMode === 'view';
  travellerPreferenceChips.replaceChildren();
  travellerPreferencePicks.forEach((pick) => {
    const chip = document.createElement('span');
    chip.className = 'preference-chip';
    const text = document.createElement('span');
    text.textContent = preferenceTagText(pick);
    chip.append(text);
    if (!readOnly) {
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'preference-chip-remove';
      remove.setAttribute('aria-label', `Remove ${preferenceTagText(pick)}`);
      remove.innerHTML = '<svg aria-hidden="true"><use href="#i-x" /></svg>';
      remove.addEventListener('click', () => {
        travellerPreferencePicks = travellerPreferencePicks.filter((item) => !(item.field === pick.field && item.value === pick.value));
        syncTravellerPreferenceDraft();
        renderTravellerPreferenceEditor();
        renderTravellerPreferenceSuggestions();
        travellerPreferenceInput.focus();
      });
      chip.append(remove);
    }
    travellerPreferenceChips.append(chip);
  });
  travellerPreferenceChips.hidden = travellerPreferencePicks.length === 0;
}

function renderTravellerPreferenceSuggestions() {
  const query = travellerPreferenceInput.value.trim().toLocaleLowerCase();
  const selected = new Set(travellerPreferencePicks.map((pick) => `${pick.field}|||${pick.value}`));
  const matches = preferenceSuggestionPool().filter((option) => {
    if (selected.has(`${option.field}|||${option.value}`)) return false;
    if (!query) return false;
    return option.value.toLocaleLowerCase().includes(query) || option.label.toLocaleLowerCase().includes(query);
  }).slice(0, 8);
  travellerPreferenceSuggestions.replaceChildren();
  if (query && !matches.length) {
    const empty = document.createElement('p');
    empty.className = 'themed-empty';
    empty.textContent = 'No matching preferences.';
    travellerPreferenceSuggestions.append(empty);
  } else {
    matches.forEach((option) => {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'themed-option';
      item.setAttribute('role', 'option');
      const label = document.createElement('span');
      label.textContent = option.value;
      const context = document.createElement('small');
      context.textContent = option.label;
      item.append(label, context);
      item.addEventListener('click', () => addTravellerPreference(option));
      travellerPreferenceSuggestions.append(item);
    });
  }
  const open = document.activeElement === travellerPreferenceInput && query.length > 0;
  travellerPreferenceSuggestions.hidden = !open;
  travellerPreferenceInput.setAttribute('aria-expanded', String(open));
}

function addTravellerPreference(option) {
  if (!option || travellerModalMode === 'view') return;
  if (travellerPreferencePicks.some((pick) => pick.field === option.field && pick.value === option.value)) return;
  const field = TRAVELLER_PREFERENCE_GROUPS.flatMap((group) => group.fields).find((item) => item.key === option.field);
  if (field && !field.multiple) {
    travellerPreferencePicks = travellerPreferencePicks.filter((pick) => pick.field !== option.field);
  }
  travellerPreferencePicks = [...travellerPreferencePicks, { field: option.field, label: option.label, value: option.value }];
  travellerPreferenceInput.value = '';
  syncTravellerPreferenceDraft();
  renderTravellerPreferenceEditor();
  closeTravellerPreferenceSuggestions();
  travellerPreferenceInput.focus();
}

function clearTravellerPreferencePicks() {
  travellerPreferencePicks = [];
  if (travellerPreferenceInput) travellerPreferenceInput.value = '';
  syncTravellerPreferenceDraft();
  renderTravellerPreferenceEditor();
  closeTravellerPreferenceSuggestions();
}

function renderTravellerPreferenceEditor() {
  syncTravellerPreferenceDraft();
  const readOnly = travellerModalMode === 'view';
  travellerPreferenceInput.disabled = readOnly;
  renderTravellerPreferenceChips();
  renderTravellerPreferenceSuggestions();
  const selections = travellerPreferences({ preferences: draftTravellerPreferences });
  $('#travellerModalPreferenceCount').textContent = `${selections.length} saved`;
  clearTravellerPreferences.hidden = readOnly || selections.length === 0;
}

function ensureTravellerProfiles(customer, contact = {}) {
  const existing = travellerProfilesByCustomer.get(customer.id);
  if (existing?.length) return existing;
  const datesOfBirth = ['1981-06-21', '1984-02-11', '2010-09-18', '2014-04-03'];
  const relationships = ['Family', 'Spouse', 'Child', 'Child'];
  const profiles = travellerNamesForCustomer(customer).map((name, index) => ({
    id: `${customer.id}-traveller-${index + 1}`,
    name,
    primary: index === 0,
    relationship: relationships[index] ?? 'Family',
    dateOfBirth: datesOfBirth[index] ?? '',
    nationality: 'Indian',
    phone: index === 0 ? (contact.phone ?? '') : '',
    email: index === 0 ? (contact.email ?? '') : '',
    address: `${customer.location}, India`,
    preferences: seededTravellerPreferences(index),
    trips: Math.max(0, (customer.trips ?? 0) - index - 1),
  }));
  travellerProfilesByCustomer.set(customer.id, profiles);
  expandedTravellerByCustomer.set(customer.id, '');
  return profiles;
}

function travellerDocumentSummary(customer, profile) {
  const group = buildTravellerDocumentGroups(customer).find((item) => item.traveller === profile.name);
  const documents = group?.documents ?? [];
  return {
    uploaded: documents.filter((documentItem) => documentItem.status !== 'Missing').length,
    missing: documents.filter((documentItem) => documentItem.status === 'Missing').length,
  };
}

function formatTravellerDate(value) {
  if (!value) return 'Not added';
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(`${value}T00:00:00`));
}

function travellerFactMarkup(label, value, icon) {
  return `<div class="traveller-fact"><svg><use href="#${icon}" /></svg><span>${escapeHTML(label)}</span><strong>${escapeHTML(value || 'Not added')}</strong></div>`;
}

function renderTravellerTab(customer, contact = {}) {
  const profiles = [...ensureTravellerProfiles(customer, contact)].sort((left, right) => Number(right.primary) - Number(left.primary));
  const savedExpandedId = expandedTravellerByCustomer.get(customer.id);
  if (!expandedTravellerByCustomer.has(customer.id) || (savedExpandedId && !profiles.some((profile) => profile.id === savedExpandedId))) {
    expandedTravellerByCustomer.set(customer.id, profiles[0]?.id ?? '');
  }
  const expandedId = expandedTravellerByCustomer.get(customer.id);
  const travellerSectionCount = document.getElementById('travellerSectionCount');
  if (travellerSectionCount) travellerSectionCount.textContent = profiles.length;
  const travellersPill = document.getElementById('travellersTabCount');
  if (travellersPill) travellersPill.textContent = profiles.length;
  travellerAccordion.innerHTML = profiles.map((profile, index) => {
    const expanded = profile.id === expandedId;
    const panelId = `traveller-profile-${customer.id}-${index}`;
    const documentSummary = travellerDocumentSummary(customer, profile);
    const preferences = travellerPreferences(profile);
    const role = profile.primary ? 'Primary traveller' : profile.relationship;
    return `<article class="traveller-profile-card${expanded ? ' is-expanded' : ''}" data-traveller-card="${escapeHTML(profile.id)}">
      <button class="traveller-profile-toggle" type="button" data-traveller-profile-toggle="${escapeHTML(profile.id)}" aria-expanded="${expanded}" aria-controls="${panelId}">
        <span class="traveller-avatar">${escapeHTML(initials(profile.name))}</span>
        <span class="traveller-profile-heading"><span><strong>${escapeHTML(profile.name)}</strong>${profile.primary ? '<em class="traveller-primary-badge">Primary</em>' : ''}</span><small>${escapeHTML(role)} · ${escapeHTML(profile.nationality || 'Nationality not added')}</small></span>
        <span class="traveller-profile-summary"><span><b>${documentSummary.uploaded}</b> documents</span><span><b>${profile.trips}</b> trips</span><span><b>${preferences.length}</b> preferences</span></span>
        <svg class="traveller-profile-chevron"><use href="#i-chevron-right" /></svg>
      </button>
      <div class="traveller-profile-panel" id="${panelId}"${expanded ? '' : ' hidden'}>
        <div class="traveller-facts-grid">
          ${travellerFactMarkup('Date of birth', formatTravellerDate(profile.dateOfBirth), 'i-clock')}
          ${travellerFactMarkup('Nationality', profile.nationality, 'i-map-pin')}
          ${travellerFactMarkup('Relationship', role, 'i-users')}
          ${travellerFactMarkup('Phone', profile.phone, 'i-phone')}
          ${travellerFactMarkup('Email', profile.email, 'i-mail')}
          ${travellerFactMarkup('Address', profile.address, 'i-map-pin')}
        </div>
        <div class="traveller-detail-columns">
          <button class="traveller-detail-link" type="button" data-traveller-documents="${escapeHTML(profile.id)}" data-traveller-name="${escapeHTML(profile.name)}"><span class="traveller-detail-label">Documents</span><strong>${documentSummary.uploaded} uploaded</strong><p>${documentSummary.missing ? `${documentSummary.missing} required document${documentSummary.missing === 1 ? '' : 's'} missing` : 'All required documents added'}</p></button>
          <section><span class="traveller-detail-label">Trips</span><strong>${profile.trips} completed</strong><p>${profile.trips ? 'Travel history available in bookings' : 'No completed trips yet'}</p></section>
          <section><span class="traveller-detail-label">Preferences</span><strong>${preferences.length} saved</strong><div class="traveller-preference-chips">${preferences.length ? preferences.map((preference) => `<span>${escapeHTML(preference)}</span>`).join('') : '<small>No preferences added</small>'}</div></section>
        </div>
        <footer class="traveller-profile-actions">
          <button class="button button-secondary button-small" type="button" data-traveller-view="${escapeHTML(profile.id)}">View full details</button>
          <button class="button button-tertiary button-small" type="button" data-traveller-edit="${escapeHTML(profile.id)}"><svg><use href="#i-edit" /></svg>Edit</button>
          ${profile.primary ? '' : `<button class="button button-danger button-small" type="button" data-traveller-delete="${escapeHTML(profile.id)}"><svg><use href="#i-trash" /></svg>Delete</button>`}
        </footer>
      </div>
    </article>`;
  }).join('');
}

function syncTravellerProfiles(customer, profiles) {
  const ordered = [...profiles].sort((left, right) => Number(right.primary) - Number(left.primary));
  travellerProfilesByCustomer.set(customer.id, ordered);
  travellerNamesByCustomer[customer.id] = ordered.map((profile) => profile.name);
  customer.travellers = ordered.length;
  const vaultCustomer = vaultCustomers.find((item) => item.id === customer.id && item.name === customer.name);
  if (vaultCustomer) vaultCustomer.travellers = ordered.length;
  $('#detailTravellers').textContent = ordered.length;
  const syncedSectionCount = document.getElementById('travellerSectionCount');
  if (syncedSectionCount) syncedSectionCount.textContent = ordered.length;
  renderTravellerTab(customer);
  renderDocumentRequestState(customer);
  renderCustomers();
  renderVault();
}

function setTravellerModalMode(mode) {
  const customer = selectedCustomer;
  const profile = customer ? travellerProfilesByCustomer.get(customer.id)?.find((item) => item.id === activeTravellerId) : null;
  const readOnly = mode === 'view';
  travellerModalMode = mode;
  $$('input, select, textarea', travellerForm).forEach((control) => {
    control.disabled = readOnly || (control === travellerPrimary && Boolean(profile?.primary));
  });
  editTravellerButton.hidden = !readOnly;
  saveTravellerButton.hidden = readOnly;
  saveTravellerButton.textContent = mode === 'add' ? 'Add traveller' : 'Save changes';
  deleteTravellerButton.hidden = !profile || profile.primary || mode === 'add';
  $('#travellerModalTitle').textContent = mode === 'add' ? 'Add traveller' : readOnly ? profile?.name ?? 'Traveller details' : `Edit ${profile?.name ?? 'traveller'}`;
  renderTravellerPreferenceEditor();
  if (!readOnly) window.setTimeout(() => travellerFullName.focus(), 0);
}

function openTravellerModal(profile, mode, trigger) {
  const customer = selectedCustomer;
  if (!customer) return;
  travellerReturnFocus = trigger;
  activeTravellerId = profile?.id ?? null;
  travellerPreferencePicks = profile ? travellerPicksFromPreferences(profile.preferences) : [];
  draftTravellerPreferences = travellerPreferencesFromPicks(travellerPreferencePicks);
  travellerPreferenceInput.value = '';
  closeTravellerPreferenceSuggestions();
  travellerDeleteArmed = false;
  deleteTravellerButton.innerHTML = '<svg><use href="#i-trash" /></svg>Delete traveller';
  travellerForm.reset();
  travellerPrimary.checked = profile?.primary ?? travellerProfilesByCustomer.get(customer.id)?.length === 0;
  travellerFullName.value = profile?.name ?? '';
  travellerRelationship.value = profile?.relationship ?? 'Family';
  travellerDateOfBirth.value = profile?.dateOfBirth ?? '';
  travellerNationality.value = profile?.nationality ?? 'Indian';
  travellerModalPhone.value = profile?.phone ?? '';
  travellerModalEmail.value = profile?.email ?? '';
  travellerAddress.value = profile?.address ?? `${customer.location}, India`;
  const documentSummary = profile ? travellerDocumentSummary(customer, profile) : { uploaded: 0 };
  $('#travellerModalDocumentCount').textContent = `${documentSummary.uploaded} uploaded`;
  $('#travellerModalTripCount').textContent = `${profile?.trips ?? 0} completed`;
  setTravellerModalMode(mode);
  openModal(travellerModalBackdrop, mode === 'view' ? $('#closeTravellerModal') : travellerFullName);
}

function closeTravellerModal() {
  closeModal(travellerModalBackdrop, travellerForm, travellerReturnFocus);
  activeTravellerId = null;
  travellerDeleteArmed = false;
}

function renameTravellerDocuments(customer, previousName, nextName) {
  if (previousName === nextName) return;
  const vaultCustomer = vaultCustomers.find((item) => item.id === customer.id && item.name === customer.name);
  (vaultCustomer?.documents ?? []).forEach((documentItem) => {
    if (documentItem.traveller === previousName) documentItem.traveller = nextName;
  });
  (uploadedRequestDocuments.get(customer.id) ?? []).forEach((documentItem) => {
    if (documentItem.traveller === previousName) documentItem.traveller = nextName;
  });
  const request = documentRequests.get(customer.id);
  if (request?.traveller === previousName) request.traveller = nextName;
}

function removeTravellerDocuments(customer, travellerName) {
  const vaultCustomer = vaultCustomers.find((item) => item.id === customer.id && item.name === customer.name);
  if (vaultCustomer) vaultCustomer.documents = vaultCustomer.documents.filter((documentItem) => documentItem.traveller !== travellerName);
  const uploaded = uploadedRequestDocuments.get(customer.id);
  if (uploaded) uploadedRequestDocuments.set(customer.id, uploaded.filter((documentItem) => documentItem.traveller !== travellerName));
  const request = documentRequests.get(customer.id);
  if (request?.traveller === travellerName) documentRequests.delete(customer.id);
}

function pendingReviewDocuments(customerId = selectedCustomer?.id) {
  return (uploadedRequestDocuments.get(customerId) ?? []).filter((documentItem) => documentItem.status === 'Pending review');
}

function formatUploadTime(value) {
  if (!value) return 'Just now';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true }).format(date);
}

function formatDocumentFileSize(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '—';
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function reviewThumbnailMarkup(documentItem) {
  const imagePreview = documentItem.fileUrl && (documentItem.mimeType?.startsWith('image/') || /\.(png|jpe?g|webp|svg)$/i.test(documentItem.fileName ?? ''));
  return imagePreview
    ? `<span class="document-review-thumbnail"><img src="${escapeHTML(documentItem.fileUrl)}" alt="" /></span>`
    : `<span class="document-review-thumbnail">${escapeHTML(documentItem.type.slice(0, 4).toUpperCase())}</span>`;
}

function renderDocumentNotifications(customer) {
  const pending = pendingReviewDocuments(customer.id);
  const count = pending.length;
  renderDocumentsTabPill(customer);

  documentReviewInbox.hidden = count === 0;
  $('#documentReviewInboxCount').textContent = `${count} pending`;
  documentReviewQueue.innerHTML = pending.map((documentItem) => `
    <article class="document-review-queue-item">
      ${reviewThumbnailMarkup(documentItem)}
      <div class="document-review-queue-copy"><strong>${escapeHTML(documentItem.name)}</strong><small>${escapeHTML(documentItem.traveller)} · ${escapeHTML(documentItem.type)}</small></div>
      <div class="document-review-queue-source"><strong>Customer upload</strong><small>${escapeHTML(formatUploadTime(documentItem.uploadedAt))}</small></div>
      <button class="button button-primary button-small" type="button" data-document-review="${escapeHTML(documentItem.id)}">Review upload</button>
    </article>`).join('');
}

function travellerDocumentGroupsMarkup(groups, scope, openIndex = '0') {
  return groups.map((group) => {
    const uploaded = group.documents.filter((documentItem) => documentItem.status !== 'Missing').length;
    const missing = group.documents.filter((documentItem) => documentItem.status === 'Missing').length;
    const pending = group.documents.filter((documentItem) => documentItem.status === 'Pending review').length;
    const expired = group.documents.filter((documentItem) => documentItem.status === 'Expired').length;
    const expiring = group.documents.filter((documentItem) => documentItem.status === 'Expiring soon').length;
    const open = openIndex === 'all' || String(group.index) === openIndex;
    const panelId = `${scope}-traveller-documents-${group.index}`;
    const groupStatus = pending ? 'Approval needed' : expired ? 'Expired document' : missing ? 'Action needed' : expiring ? 'Expiring soon' : 'Ready';
    const groupStatusClass = pending ? 'status-approval' : expired ? 'status-expired' : missing ? 'status-missing' : expiring ? 'status-expiring' : 'status-valid';
    const summary = pending ? `${uploaded} uploaded · ${pending} awaiting approval` : `${uploaded} uploaded · ${missing} missing`;
    const isGroup = group.kind === 'group';
    const sequence = initials(group.traveller);
    const description = isGroup
      ? `Group documents · ${group.documents.length} tracked`
      : `Traveller ${Number(group.index) + 1} · ${group.documents.length} tracked documents`;
    return `<article class="traveller-document-group" data-document-owner="${escapeHTML(group.kind)}" data-document-traveller="${escapeHTML(group.traveller)}">
      <button class="traveller-document-header" type="button" data-traveller-toggle data-traveller-index="${group.index}" aria-expanded="${open}" aria-controls="${escapeHTML(panelId)}">
        <span class="traveller-sequence">${sequence}</span>
        <span class="traveller-document-name"><strong>${escapeHTML(group.traveller)}</strong><small>${escapeHTML(description)}</small></span>
        <span class="traveller-document-summary">${summary}</span>
        <span class="status-badge ${groupStatusClass}">${groupStatus}</span>
        <span class="traveller-document-chevron"><svg><use href="#i-chevron-right" /></svg></span>
      </button>
      <div class="traveller-document-list" id="${escapeHTML(panelId)}" ${open ? '' : 'hidden'}>
        <div class="traveller-document-columns"><span>Document</span><span>Status</span><span>Expiry</span><span>Action</span></div>
        ${group.documents.map((documentItem) => {
          const isMissing = documentItem.status === 'Missing';
          const action = isMissing
            ? `<button class="text-action" type="button" data-request-missing-document data-traveller-name="${escapeHTML(group.traveller)}" data-document-type="${escapeHTML(documentItem.type)}">Request</button>`
            : `<button class="text-action" type="button" data-document-review="${escapeHTML(documentItem.id)}">${documentItem.status === 'Pending review' ? 'Review upload' : 'View'}</button>`;
          return `<div class="traveller-document-item" data-document-status="${escapeHTML(documentItem.status)}" data-document-required="${documentItem.required}">
            <div class="traveller-document-info"><span class="record-icon">${escapeHTML(documentItem.type.slice(0, 4).toUpperCase())}</span><span><strong>${escapeHTML(documentItem.name)}</strong><small>${escapeHTML(documentItem.source)}</small></span></div>
            <span class="status-badge ${documentStatusClass(documentItem.status)}">${escapeHTML(documentItem.status)}</span>
            <span class="traveller-document-expiry">${escapeHTML(documentItem.expiry)}</span>
            ${action}
          </div>`;
        }).join('')}
      </div>
    </article>`;
  }).join('');
}


function renderTravellerDocumentHierarchy(customer) {
  const travellerGroups = buildTravellerDocumentGroups(customer);
  const groupGroups = buildGroupDocumentGroups(customer);
  const groups = [...travellerGroups, ...groupGroups];
  const allDocuments = groups.flatMap((group) => group.documents);
  const requiredDocuments = allDocuments.filter((documentItem) => documentItem.required);
  const readyDocuments = requiredDocuments.filter((documentItem) => ['Valid', 'Approved', 'Expiring soon'].includes(documentItem.status));
  const missingCount = allDocuments.filter((documentItem) => documentItem.status === 'Missing').length;
  const pendingCount = allDocuments.filter((documentItem) => documentItem.status === 'Pending review').length;
  const expiredCount = allDocuments.filter((documentItem) => documentItem.status === 'Expired').length;
  const expiringCount = allDocuments.filter((documentItem) => documentItem.status === 'Expiring soon').length;

  renderedTravellerDocuments = allDocuments.filter((documentItem) => documentItem.status !== 'Missing');
  travellerDocumentHierarchy.innerHTML = travellerDocumentGroupsMarkup(groups, 'profile-all', expandedDocumentGroupByCustomer.get(customer.id) ?? '');

  const readiness = requiredDocuments.length ? Math.round((readyDocuments.length / requiredDocuments.length) * 100) : 100;
  $('#documentReadinessPercent').textContent = readiness;
  $('#documentReadinessCopy').textContent = readiness;
  $('#detailDocuments').textContent = `${readyDocuments.length} / ${requiredDocuments.length} ready`;
  $('#documentReadinessMessage').textContent = pendingCount
    ? `${pendingCount} awaiting approval · ${missingCount} still missing`
    : missingCount || expiredCount || expiringCount
      ? `${missingCount} missing · ${expiredCount} expired · ${expiringCount} expiring soon`
      : 'All required documents are up to date.';

}

function renderDocumentRequestState(customer) {
  const request = documentRequests.get(customer.id);
  const requestCard = $('#documentRequestCard');
  requestCard.hidden = !request;
  if (request) {
    $('#documentRequestStatus').textContent = request.status;
    $('#documentRequestSummary').textContent = `${request.traveller} · ${request.types.join(', ')} · ${request.status === 'Sent' ? 'Awaiting upload' : request.status}`;
  }
  renderDocumentNotifications(customer);
  renderTravellerDocumentHierarchy(customer);
}

function resetRequestDocumentDialog() {
  requestDocumentForm.reset();
  const typeInputs = $$('input[name="requestType"]', requestDocumentFormStage);
  typeInputs.forEach((input, index) => { input.checked = index === 0; });
  requestDocumentFormStage.hidden = false;
  requestDocumentLinkStage.hidden = true;
  generateRequestLink.hidden = false;
  copyRequestLink.hidden = true;
  previewRequestUpload.hidden = true;
  sendRequestLink.hidden = true;
  sendRequestLink.disabled = false;
  sendRequestLink.innerHTML = '<svg><use href="#i-message"></use></svg>Send link';
  currentDocumentRequest = null;
}

function openRequestDocumentDialog(trigger, requestedType = null, traveller = null) {
  requestReturnFocus = trigger;
  resetRequestDocumentDialog();
  const travellers = travellerNamesForCustomer(selectedCustomer);
  requestTraveller.innerHTML = travellers.map((name) => `<option value="${escapeHTML(name)}">${escapeHTML(name)}</option>`).join('');
  requestTargetTraveller = traveller ?? travellers[0] ?? selectedCustomer.name;
  requestTraveller.value = requestTargetTraveller;
  if (requestedType) {
    $$('input[name="requestType"]', requestDocumentFormStage).forEach((input) => {
      input.checked = input.value === requestedType;
    });
  }
  updateRequestLinkAction();
  openModal(requestDocumentBackdrop, requestTraveller);
}

function closeRequestDocumentDialog() {
  closeModal(requestDocumentBackdrop, requestDocumentForm, requestReturnFocus);
  currentDocumentRequest = null;
  requestTargetTraveller = null;
}

function showGeneratedRequest(request) {
  currentDocumentRequest = request;
  documentRequests.set(request.customerId, request);
  requestDocumentFormStage.hidden = true;
  requestDocumentLinkStage.hidden = false;
  generateRequestLink.hidden = true;
  copyRequestLink.hidden = false;
  previewRequestUpload.hidden = false;
  sendRequestLink.hidden = false;
  $('#requestDocumentLink').textContent = request.link;
  $('#requestLinkTraveller').textContent = request.traveller;
  $('#requestLinkDocuments').textContent = request.types.join(', ');
  renderDocumentRequestState(selectedCustomer);
  copyRequestLink.focus();
}

function clearRequestUploadSelection() {
  if (requestUploadPreviewUrl.startsWith('blob:')) URL.revokeObjectURL(requestUploadPreviewUrl);
  requestUploadPreviewUrl = '';
  selectedRequestUploadFile = null;
  requestUploadFileName = '';
  requestUploadFile.value = '';
  requestUploadPrompt.textContent = 'Choose a PDF or image';
  requestUploadError.hidden = true;
  requestUploadError.textContent = '';
  requestUploadPreview.hidden = true;
  requestUploadPreviewImage.hidden = true;
  requestUploadPreviewImage.removeAttribute('src');
  requestUploadPreviewFrame.hidden = true;
  requestUploadPreviewFrame.removeAttribute('src');
  submitRequestUpload.disabled = true;
}

function setRequestUploadSelection(file) {
  clearRequestUploadSelection();
  if (!file) return;
  const allowed = ['application/pdf', 'image/jpeg', 'image/png'];
  const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
  const isImage = ['image/jpeg', 'image/png'].includes(file.type) || /\.(jpe?g|png)$/i.test(file.name);
  const maxBytes = isPdf ? 10 * 1024 * 1024 : 5 * 1024 * 1024;
  if ((!allowed.includes(file.type) && !isPdf && !isImage) || file.size > maxBytes) {
    requestUploadError.textContent = file.size > maxBytes
      ? `${file.name} is too large. Images must be under 5 MB and PDFs under 10 MB.`
      : 'Choose a JPEG, PNG, or PDF file.';
    requestUploadError.hidden = false;
    return;
  }
  selectedRequestUploadFile = file;
  requestUploadFileName = file.name;
  requestUploadPreviewUrl = URL.createObjectURL(file);
  requestUploadPrompt.textContent = file.name;
  requestUploadPreview.hidden = false;
  if (isPdf) {
    requestUploadPreviewFrame.src = requestUploadPreviewUrl;
    requestUploadPreviewFrame.hidden = false;
  } else {
    requestUploadPreviewImage.src = requestUploadPreviewUrl;
    requestUploadPreviewImage.hidden = false;
  }
  submitRequestUpload.disabled = !requestUploadName.value.trim();
}

function prepareRequestUpload(request) {
  currentDocumentRequest = request;
  requestUploadForm.hidden = false;
  requestUploadSuccess.hidden = true;
  requestUploadType.innerHTML = request.types.map((type) => `<option value="${escapeHTML(type)}">${escapeHTML(type)}</option>`).join('');
  $('#requestUploadCustomer').textContent = request.traveller;
  requestUploadName.value = `${request.types[0]} — ${request.traveller}`;
  clearRequestUploadSelection();
}

function closeRequestUpload() {
  closeModal(requestUploadBackdrop, requestUploadForm, requestReturnFocus);
  clearRequestUploadSelection();
}

function reviewDocumentById(id, trigger) {
  const uploadedDocument = (uploadedRequestDocuments.get(selectedCustomer.id) ?? []).find((item) => item.id === id);
  currentReviewDocument = uploadedDocument ?? renderedTravellerDocuments.find((documentItem) => documentItem.id === id);
  if (!currentReviewDocument) return;
  const canApprove = currentReviewDocument.status === 'Pending review';
  const fileName = currentReviewDocument.fileName || currentReviewDocument.name;
  const imagePreview = currentReviewDocument.fileUrl && (currentReviewDocument.mimeType?.startsWith('image/') || /\.(png|jpe?g|webp|svg)$/i.test(fileName));
  const pdfPreview = currentReviewDocument.fileUrl && (currentReviewDocument.mimeType === 'application/pdf' || /\.pdf$/i.test(fileName));
  $('#documentReviewTitle').textContent = currentReviewDocument.name;
  $('#documentReviewSubtitle').textContent = canApprove
    ? `${currentReviewDocument.traveller} uploaded this file. Validate it before approval.`
    : `Viewing the document attached to ${currentReviewDocument.traveller}.`;
  $('#documentReviewFile').textContent = fileName;
  $('#documentReviewFileName').textContent = fileName;
  $('#documentReviewFileMeta').textContent = `${currentReviewDocument.mimeType?.replace('image/', '').toUpperCase() || currentReviewDocument.kind?.toUpperCase() || 'FILE'} · ${formatDocumentFileSize(currentReviewDocument.fileSize)}`;
  $('#documentReviewStatus').textContent = currentReviewDocument.status;
  $('#documentReviewSource').textContent = currentReviewDocument.source;
  $('#documentReviewUploadedAt').textContent = formatUploadTime(currentReviewDocument.uploadedAt);
  $('#documentReviewSize').textContent = formatDocumentFileSize(currentReviewDocument.fileSize);
  $('#documentReviewTraveller').innerHTML = travellerNamesForCustomer(selectedCustomer).map((name) => `<option value="${escapeHTML(name)}">${escapeHTML(name)}</option>`).join('');
  $('#documentReviewTraveller').value = currentReviewDocument.traveller;
  $('#documentReviewType').value = ['Passport', 'Visa', 'National ID', 'Travel insurance'].includes(currentReviewDocument.type) ? currentReviewDocument.type : 'Other';
  $('#documentReviewName').value = currentReviewDocument.name;
  $('#documentReviewExpiry').value = /^\d{4}-\d{2}-\d{2}$/.test(currentReviewDocument.expiryDate ?? '') ? currentReviewDocument.expiryDate : '';
  $('#documentReviewNote').value = currentReviewDocument.reviewNote ?? '';
  $('#documentReviewPreviewImage').hidden = !imagePreview;
  $('#documentReviewPreviewImage').src = imagePreview ? currentReviewDocument.fileUrl : '';
  $('#documentReviewPreviewFrame').hidden = !pdfPreview;
  $('#documentReviewPreviewFrame').src = pdfPreview ? currentReviewDocument.fileUrl : '';
  $('#documentReviewPreviewFallback').hidden = Boolean(imagePreview || pdfPreview);
  ['documentReviewTraveller', 'documentReviewType', 'documentReviewName', 'documentReviewExpiry', 'documentReviewNote'].forEach((elementId) => {
    $(`#${elementId}`).disabled = !canApprove;
  });
  documentReviewManagementActions.hidden = false;
  documentDeleteConfirmation.hidden = true;
  $('#documentDeleteName').textContent = currentReviewDocument.name;
  $('#documentApprovalCallout').hidden = !canApprove;
  $('#approveDocument').hidden = !canApprove;
  $('.document-review-inspector', documentReviewBackdrop).scrollTop = 0;
  documentReviewBackdrop.dataset.returnDocument = id;
  documentReviewBackdrop._returnFocus = trigger;
  openModal(documentReviewBackdrop, $('#closeDocumentReview'));
}

function closeDocumentReview() {
  const returnFocus = documentReviewBackdrop._returnFocus;
  documentReplacementFile.value = '';
  documentReviewManagementActions.hidden = false;
  documentDeleteConfirmation.hidden = true;
  closeModal(documentReviewBackdrop, null, returnFocus);
  currentReviewDocument = null;
}

function printCurrentDocument() {
  if (!currentReviewDocument) return;
  documentReviewBackdrop.classList.add('is-printing-document');
  const finishPrint = () => documentReviewBackdrop.classList.remove('is-printing-document');
  window.addEventListener('afterprint', finishPrint, { once: true });
  window.print();
  window.setTimeout(finishPrint, 1000);
}

function updateDashboardClock(now = new Date()) {
  const weekday = new Intl.DateTimeFormat('en-IN', { weekday: 'long' }).format(now);
  const day = new Intl.DateTimeFormat('en-IN', { day: 'numeric' }).format(now);
  const month = new Intl.DateTimeFormat('en-IN', { month: 'long' }).format(now);
  const time = new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true }).format(now);
  const hour = now.getHours();
  const salutation = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  dashboardTimestamp.dateTime = now.toISOString();
  dashboardTimestamp.textContent = `${weekday} · ${day} ${month} · ${time}`;
  $('#dashboardTitle').textContent = `${salutation}, Rishi`;
}

const dashboardHomeData = {
  returning: {
    modules: {
      queries: ['12', 'Live enquiries in your pipeline', '2 sent · 3 in negotiation · 1 follow-up due'],
      inbox: ['18', 'Messages waiting in your inbox', '4 unread · 2 from customers · 1 from supplier'],
      bookings: ['9', 'Confirmed trips in the next 30 days', '1 at risk · ₹84K payment pending · 2 departing soon'],
      tasks: ['11', 'Open tasks across the team', '3 overdue · 2 due today · assigned to 4 members'],
    },
    kpis: {
      AtRisk: '2',
      Payment: '₹2.28L',
      Query: '7',
      Booking: '₹18.40L',
    },
  },
  new: {
    modules: {
      queries: ['0', 'No queries yet · start your pipeline', 'Create your first enquiry to begin'],
      inbox: ['0', 'Inbox is empty', 'Messages and replies will collect here'],
      bookings: ['0', 'No bookings yet', 'Confirmed trips appear after a query wins'],
      tasks: ['0', 'No open tasks', 'Ops and follow-up tasks will show here'],
    },
    kpis: {
      AtRisk: '0',
      Payment: '₹0',
      Query: '0',
      Booking: '₹0',
    },
  },
};

function dashboardHomeMode() {
  return dashboardView?.dataset.homeMode === 'new' ? 'new' : 'returning';
}

function renderDashboardHome() {
  if (!dashboardView) return;
  const mode = dashboardHomeMode();
  const data = dashboardHomeData[mode];
  const setModule = (name, values) => {
    const value = $(`#home${name}Value`);
    if (!value) return;
    value.textContent = values[0];
    $(`#home${name}Primary`).textContent = values[1];
    $(`#home${name}Breakdown`).textContent = values[2];
  };
  setModule('Queries', data.modules.queries);
  setModule('Inbox', data.modules.inbox);
  setModule('Bookings', data.modules.bookings);
  setModule('Tasks', data.modules.tasks);
  Object.entries(data.kpis).forEach(([name, value]) => {
    $(`#dashboard${name}Value`).textContent = value;
  });
  const isNew = mode === 'new';
  $('#dashboardNewEmptyNormal').hidden = !isNew;
  ['Queries', 'Bookings', 'Tasks', 'Followups'].forEach((name) => {
    const empty = $(`#home${name}Empty`);
    const body = $(`#home${name}TableBody`) ?? $(`#home${name}List`);
    if (empty) empty.hidden = !isNew;
    if (body) body.closest('.query-table-scroller, .dashboard-focus-list')?.toggleAttribute('hidden', isNew);
  });
  $('#homeNotesList')?.toggleAttribute('hidden', isNew);
}

function setDashboardDensity(density) {
  if (!dashboardView) return;
  const value = density === 'advance' ? 'advance' : 'normal';
  dashboardView.dataset.homeDensity = value;
  const isAdvance = value === 'advance';
  dashboardHomeNormal.hidden = isAdvance;
  dashboardHomeAdvance.hidden = !isAdvance;
  dashboardDensityNormal.classList.toggle('is-active', !isAdvance);
  dashboardDensityAdvance.classList.toggle('is-active', isAdvance);
  dashboardDensityNormal.setAttribute('aria-pressed', String(!isAdvance));
  dashboardDensityAdvance.setAttribute('aria-pressed', String(isAdvance));
}

function setDashboardHomeMode(mode) {
  if (!dashboardView) return;
  dashboardView.dataset.homeMode = mode === 'new' ? 'new' : 'returning';
  renderDashboardHome();
}

function inboxInitials(name) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}

function currentInboxConversation() {
  return inboxConversations.find((conversation) => conversation.id === activeInboxConversationId) ?? null;
}
function inboxConversationUnreadCount(conversation) {
  return conversation.messages.filter((message) => message.direction === 'incoming' && message.read === false).length;
}

function inboxUnreadContactCount() {
  return new Set(
    inboxConversations
      .filter((conversation) => inboxConversationUnreadCount(conversation) > 0)
      .map((conversation) => conversation.customerId ?? conversation.name.trim().toLocaleLowerCase()),
  ).size;
}

function markInboxConversationRead(conversation) {
  conversation.messages.forEach((message) => {
    if (message.direction === 'incoming') message.read = true;
  });
}

function inboxConversationForCustomer(customerId, channel) {
  return inboxConversations.find((conversation) => conversation.customerId === customerId && conversation.channel === channel) ?? null;
}

function ensureInboxConversation(customer, channel) {
  const existing = inboxConversationForCustomer(customer.id, channel);
  if (existing) return existing;
  const conversation = {
    id: `conversation-${customer.id.toLocaleLowerCase()}-${channel}`,
    customerId: customer.id,
    name: customer.name,
    channel,
    time: 'Now',
    messages: [],
  };
  inboxConversations.unshift(conversation);
  return conversation;
}
function moveInboxConversationToTop(conversation) {
  const index = inboxConversations.indexOf(conversation);
  if (index <= 0) return;
  inboxConversations.splice(index, 1);
  inboxConversations.unshift(conversation);
}



function inboxPreview(conversation) {
  const message = conversation.messages.at(-1);
  if (!message) return 'New email';
  const content = message.subject || message.body;
  return `${message.direction === 'outgoing' ? 'You: ' : ''}${content}`;
}

function inboxCurrentTime() {
  return new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true }).format(new Date());
}

function inboxConversationHasAttachments(conversation) {
  return conversation.messages.some((message) => (message.attachments?.length ?? 0) > 0);
}

function inboxConversationMatchesFilter(conversation) {
  if (inboxConversationFilter === 'read') return inboxConversationUnreadCount(conversation) === 0;
  if (inboxConversationFilter === 'unread') return inboxConversationUnreadCount(conversation) > 0;
  if (inboxConversationFilter === 'attachments') return inboxConversationHasAttachments(conversation);
  return true;
}

function renderInboxList() {
  const query = inboxSearch.value.trim().toLocaleLowerCase();
  const filtered = inboxConversations.filter((conversation) => {
    const matchesQuery = !query || `${conversation.name} ${inboxPreview(conversation)}`.toLocaleLowerCase().includes(query);
    return matchesQuery && inboxConversationMatchesFilter(conversation);
  });
  inboxConversationList.innerHTML = filtered.length
    ? filtered.map((conversation) => {
      const unread = inboxConversationUnreadCount(conversation);
      return `
        <button class="inbox-conversation${conversation.id === activeInboxConversationId ? ' is-active' : ''}${unread ? ' is-unread' : ''}" type="button" data-inbox-conversation="${escapeHTML(conversation.id)}" data-inbox-unread="${unread}" ${conversation.id === activeInboxConversationId ? 'aria-current="true"' : ''}>
          <span class="inbox-avatar${conversation.channel === 'email' ? ' avatar-email' : ''}">${escapeHTML(inboxInitials(conversation.name))}</span>
          <span class="inbox-conversation-copy"><strong>${escapeHTML(conversation.name)}</strong><span>${escapeHTML(inboxPreview(conversation))}</span></span>
          <span class="inbox-conversation-meta"><span class="inbox-conversation-time">${escapeHTML(conversation.time)}</span>${unread ? `<span class="inbox-unread-dot" aria-label="${unread} unread">${unread}</span>` : ''}</span>
        </button>
      `;
    }).join('')
    : `<div class="inbox-list-empty"><p>${inboxConversationFilter === 'all' ? 'No conversations match this search.' : `No ${inboxConversationFilter === 'attachments' ? 'conversations with attachments' : `${inboxConversationFilter} conversations`} found.`}</p></div>`;
  const unread = inboxUnreadContactCount();
  inboxHeaderUnread.textContent = String(unread);
  inboxHeaderUnread.hidden = unread === 0;
  inboxHeaderUnread.setAttribute('aria-label', `${unread} ${unread === 1 ? 'contact needs' : 'contacts need'} attention`);
  inboxNavLink.setAttribute('aria-label', unread ? `All inbox, ${unread} contacts with unread messages` : 'All inbox, no contacts with unread messages');
}

function inboxThreadHeader(conversation) {
  return `
    <header class="inbox-thread-header">
      <button class="shell-icon inbox-mobile-back" type="button" data-inbox-close aria-label="Back to conversations"><svg aria-hidden="true"><use href="#i-chevron-left" /></svg></button>
      <div class="inbox-thread-person">
        <span class="inbox-avatar avatar-email">${escapeHTML(inboxInitials(conversation.name))}</span>
        <div><h2>${escapeHTML(conversation.name)}</h2><p>${conversation.messages.length ? `${conversation.messages.length} message${conversation.messages.length === 1 ? '' : 's'} in this conversation` : 'New conversation'}</p></div>
      </div>
      <div class="inbox-thread-actions">
        <span class="inbox-channel-badge is-email"><svg><use href="#i-mail" /></svg>Email</span>
        <button class="shell-icon inbox-thread-more" type="button" data-inbox-mark-unread aria-label="Mark conversation unread"><svg><use href="#i-more" /></svg></button>
        <button class="shell-icon inbox-thread-more" type="button" data-inbox-close aria-label="Close conversation" title="Close conversation"><svg><use href="#i-x" /></svg></button>
      </div>
    </header>
  `;
}

function renderInboxEmpty() {
  inboxThreadPanel.innerHTML = `
    <div class="inbox-empty">
      <button class="inbox-empty-button" type="button" data-inbox-start aria-label="Start a conversation">
        <img class="inbox-empty-illustration" src="${new URL('./assets/inbox-start-conversation.svg', import.meta.url).href}" alt="A traveller holding a conversation bubble" width="318" height="300" />
        <h2>Start conversation</h2>
        <p>Select a customer to start an email conversation.</p>
      </button>
    </div>
  `;
}

function renderWhatsAppConversation(conversation) {
  const messages = conversation.messages.map((message) => `
    <div class="inbox-message-row${message.direction === 'outgoing' ? ' is-outgoing' : ''}">
      <article class="inbox-message"><p>${escapeHTML(message.body)}</p><time>${escapeHTML(message.time)}</time></article>
    </div>
  `).join('');
  inboxThreadPanel.innerHTML = `
    ${inboxThreadHeader(conversation)}
    <div class="inbox-thread-body">
      <div class="inbox-day-label">${conversation.messages.length ? 'Today' : 'Start of conversation'}</div>
      ${messages}
    </div>
    <div class="inbox-compose">
      <textarea id="inboxMessageInput" aria-label="WhatsApp message" placeholder="Start typing here…"></textarea>
      <div class="inbox-compose-actions">
        <div class="inbox-compose-tools">
          <label class="button button-secondary"><svg><use href="#i-upload" /></svg>Upload<input class="sr-only" id="inboxAttachmentInput" type="file" /></label>
          <span id="inboxAttachmentName" aria-live="polite"></span>
        </div>
        <button class="button button-primary inbox-compose-send" type="button" data-inbox-send="whatsapp" disabled><svg><use href="#i-message" /></svg>Send</button>
      </div>
    </div>
  `;
}

function renderEmailConversation(conversation) {
  const history = conversation.messages.map((message) => `
    <article class="inbox-email-card">
      <header>
        <div><strong>${escapeHTML(message.subject || '(no subject)')}</strong><span>${message.direction === 'outgoing' ? `You to ${escapeHTML(conversation.name)}` : `${escapeHTML(conversation.name)} to You`}</span></div>
        <time>${escapeHTML(message.time)}</time>
      </header>
      <p>${escapeHTML(message.body)}</p>
      ${message.attachments?.length ? `<div class="inbox-email-attachments">${message.attachments.map((attachment) => `<span><svg><use href="#i-upload" /></svg>${escapeHTML(attachment)}</span>`).join('')}</div>` : ''}
    </article>
  `).join('');
  inboxThreadPanel.innerHTML = `
    ${inboxThreadHeader(conversation)}
    <div class="inbox-email-scroll">
      ${history ? `<div class="inbox-email-history">${history}</div>` : ''}
      ${inboxComposerOpen ? `<section class="inbox-email-compose" aria-labelledby="inboxEmailComposeTitle">
        <div class="inbox-email-compose-head"><h3 id="inboxEmailComposeTitle">New message</h3><button class="shell-icon inbox-thread-more" type="button" data-inbox-collapse aria-label="Close composer"><svg><use href="#i-x" /></svg></button></div>
        <label class="inbox-email-field"><span>From</span><input value="Paryatech Travel" readonly aria-label="From" /></label>
        <label class="inbox-email-field"><span>To</span><input value="${escapeHTML(conversation.name)}" readonly aria-label="To" /></label>
        <label class="inbox-email-field"><span>Subject</span><input id="inboxEmailSubject" type="text" placeholder="Add a subject" /></label>
        <textarea id="inboxEmailBody" aria-label="Email message" placeholder="Write your message…"></textarea>
        <div class="inbox-email-toolbar">
          <div><button class="button button-primary" type="button" data-inbox-send="email" disabled>Send</button><label class="button button-secondary" aria-label="Attach a file"><svg><use href="#i-upload" /></svg><input class="sr-only" id="inboxAttachmentInput" type="file" /></label><div class="customer-mail-template-anchor"><button class="button button-secondary" data-inbox-template-button type="button" aria-haspopup="menu" aria-expanded="false"><svg><use href="#i-message" /></svg>Template</button><div class="customer-mail-template-menu" data-inbox-template-menu role="menu" hidden><button type="button" role="menuitem" data-inbox-template="documents"><strong>Request documents</strong><small>Ask for missing travel files</small></button><button type="button" role="menuitem" data-inbox-template="acceptance"><strong>Request acceptance</strong><small>Ask the customer to approve a proposal</small></button><button type="button" role="menuitem" data-inbox-template="letter"><strong>Request supporting letter</strong><small>Ask for an employer or sponsor letter</small></button></div></div><span class="inbox-email-format" aria-hidden="true">A</span><span id="inboxAttachmentName" aria-live="polite"></span></div>
          <button class="shell-icon inbox-thread-more" type="button" data-inbox-discard aria-label="Discard draft"><svg><use href="#i-trash" /></svg></button>
        </div>
      </section>` : `<div class="inbox-email-reply"><button class="button button-secondary" type="button" data-inbox-reply><svg><use href="#i-message" /></svg>Reply</button></div>`}
    </div>
  `;
}

function renderInboxThread() {
  const conversation = currentInboxConversation();
  if (!conversation) {
    renderInboxEmpty();
    return;
  }
  renderEmailConversation(conversation);
  window.setTimeout(() => {
    const scroller = $('.inbox-email-scroll', inboxThreadPanel);
    if (scroller) scroller.scrollTop = scroller.scrollHeight;
  }, 0);
}

function selectInboxConversation(conversationId, moveFocus = false, openComposer = false) {
  const conversation = inboxConversations.find((item) => item.id === conversationId);
  if (!conversation) return;
  activeInboxConversationId = conversation.id;
  inboxComposerOpen = openComposer;
  markInboxConversationRead(conversation);
  renderInboxList();
  renderInboxThread();
  if (moveFocus) window.setTimeout(() => (inboxComposerOpen ? $('#inboxEmailSubject', inboxThreadPanel) : $('[data-inbox-close]', inboxThreadPanel))?.focus(), 0);
}

function closeInboxConversation() {
  activeInboxConversationId = null;
  inboxComposerOpen = false;
  renderInboxList();
  renderInboxThread();
  inboxCreateButton.focus();
}

function renderInboxCustomers() {
  const query = inboxCustomerSearch.value.trim().toLocaleLowerCase();
  const available = customers.filter((customer) => `${customer.name} ${customer.id} ${customer.location}`.toLocaleLowerCase().includes(query));
  inboxCustomerResultCount.textContent = `${available.length} available`;
  inboxCustomerList.innerHTML = available.length
    ? available.map((customer) => `
      <button class="inbox-customer-option${customer.id === selectedInboxCustomerId ? ' is-selected' : ''}" type="button" role="option" aria-selected="${customer.id === selectedInboxCustomerId}" data-inbox-customer="${escapeHTML(customer.id)}">
        <span class="inbox-avatar">${escapeHTML(inboxInitials(customer.name))}</span>
        <span><strong>${escapeHTML(customer.name)}</strong><small>${escapeHTML(customer.id)} · ${escapeHTML(customer.location)} · ${escapeHTML(customer.category)}</small></span>
        <svg><use href="#i-check" /></svg>
      </button>
    `).join('')
    : '<div class="inbox-list-empty"><p>No available customers match this search.</p></div>';
  startInboxConversationButton.disabled = !selectedInboxCustomerId;
}

function openInboxCreate(trigger = inboxCreateButton) {
  inboxReturnFocus = trigger;
  selectedInboxCustomerId = null;
  inboxChannel = 'email';
  inboxCustomerSearch.value = '';
  renderInboxCustomers();
  openModal(inboxCreateBackdrop, inboxCustomerSearch);
}

function closeInboxCreate() {
  inboxCreateBackdrop.hidden = true;
  document.body.style.overflow = '';
  inboxReturnFocus?.focus();
}

function startInboxConversation() {
  const customer = customers.find((item) => item.id === selectedInboxCustomerId);
  if (!customer) return;
  inboxChannel = 'email';
  const conversation = ensureInboxConversation(customer, inboxChannel);
  closeInboxCreate();
  selectInboxConversation(conversation.id, true, true);
}

function showInboxSent(conversation) {
  inboxSentSummary.textContent = `Your Email message to ${conversation.name} was sent successfully.`;
  inboxSentChannel.innerHTML = `<svg><use href="#i-mail" /></svg>Email · ${escapeHTML(conversation.name)}`;
  openModal(inboxSentBackdrop, $('#viewSentConversation'));
}

function sendInboxMessage(channel) {
  const conversation = currentInboxConversation();
  if (!conversation) return;
  const subject = $('#inboxEmailSubject', inboxThreadPanel).value.trim();
  const body = $('#inboxEmailBody', inboxThreadPanel).value.trim();
  if (!subject || !body) return;
  conversation.messages.push({ direction: 'outgoing', subject, body, time: inboxCurrentTime() });
  conversation.time = 'Now';
  inboxComposerOpen = false;
  moveInboxConversationToTop(conversation);
  renderInboxList();
  renderInboxThread();
  showInboxSent(conversation);
}

function closeInboxTemplateMenu() {
  const menu = $('[data-inbox-template-menu]', inboxThreadPanel);
  const button = $('[data-inbox-template-button]', inboxThreadPanel);
  if (menu) menu.hidden = true;
  if (button) button.setAttribute('aria-expanded', 'false');
}

function applyInboxTemplate(templateKey) {
  const conversation = currentInboxConversation();
  const template = customerMailTemplates[templateKey];
  if (!conversation || !template) return;
  const linked = conversation.customerId ? customers.find((item) => item.id === conversation.customerId) : null;
  const recipient = linked?.contactName || linked?.name || conversation.name;
  const subject = $('#inboxEmailSubject', inboxThreadPanel);
  const body = $('#inboxEmailBody', inboxThreadPanel);
  if (!subject || !body) return;
  subject.value = template.subject;
  body.value = template.body(recipient);
  $('[data-inbox-send="email"]', inboxThreadPanel).disabled = false;
  closeInboxTemplateMenu();
  body.focus();
}

function openCustomerCommunicationInInbox() {
  const conversation = ensureInboxConversation(selectedCustomer, 'email');
  activeInboxConversationId = conversation.id;
  inboxComposerOpen = true;
  markInboxConversationRead(conversation);
  renderInboxList();
  setView('inbox');
  window.setTimeout(() => $('#inboxMessageInput, #inboxEmailSubject', inboxThreadPanel)?.focus(), 0);
}


const customerMailTemplates = {
  documents: {
    subject: 'Documents required for your upcoming trip',
    body: (name) => `Hello ${name},\n\nWe are preparing the documents for your upcoming trip. Please reply to this email with clear copies of the pending passports, visas, and identification documents for every traveller.\n\nOnce received, we will review the files and confirm that the travel party is document-ready.\n\nRegards,\nParyatech Travel`,
  },
  acceptance: {
    subject: 'Approval requested for your travel proposal',
    body: (name) => `Hello ${name},\n\nYour travel proposal is ready for review. Please check the itinerary, inclusions, pricing, and traveller details, then reply with your acceptance so we can proceed with confirmations.\n\nIf you need any changes, include them in your reply and we will update the proposal before booking.\n\nRegards,\nParyatech Travel`,
  },
  letter: {
    subject: 'Supporting letter required for your travel file',
    body: (name) => `Hello ${name},\n\nTo complete your travel file, please share the required supporting letter from your employer, sponsor, or host. The letter should include the traveller’s full name, travel purpose, intended dates, and the signatory’s contact details.\n\nPlease reply to this email with the signed document attached.\n\nRegards,\nParyatech Travel`,
  },
};

function customerEmailConversation() {
  return ensureInboxConversation(selectedCustomer, 'email');
}

function filteredCustomerMail(messages) {
  const entries = messages.map((message, index) => ({ message, index }));
  if (customerMailFilter === 'inbox') return entries.filter(({ message }) => message.direction === 'incoming');
  if (customerMailFilter === 'sent') return entries.filter(({ message }) => message.direction === 'outgoing');
  return entries;
}

function setCustomerMailSidebarCollapsed(collapsed) {
  customerMailSidebarCollapsed = collapsed;
  customerMailShell.classList.toggle('is-sidebar-collapsed', collapsed);
  const toggle = $('#customerMailSidebarToggle');
  toggle.setAttribute('aria-expanded', String(!collapsed));
  toggle.setAttribute('aria-label', collapsed ? 'Expand mailboxes' : 'Collapse mailboxes');
}

function closeCustomerMailTemplateMenu() {
  customerMailTemplateMenu.hidden = true;
  customerMailTemplateButton.setAttribute('aria-expanded', 'false');
}

function renderCustomerMailComposerAttachments() {
  customerMailComposerAttachments.hidden = customerMailAttachments.length === 0;
  customerMailComposerAttachments.innerHTML = customerMailAttachments.map((attachment, index) => `
    <span><svg><use href="#i-file" /></svg>${escapeHTML(attachment.name)}<button type="button" data-customer-mail-attachment-remove="${index}" aria-label="Remove ${escapeHTML(attachment.name)}">×</button></span>
  `).join('');
}

function renderCustomerMailReader(messages) {
  const message = Number.isInteger(selectedCustomerMailIndex) ? messages[selectedCustomerMailIndex] : null;
  const composing = !customerMailComposer.hidden;
  customerMailListView.hidden = composing || Boolean(message);
  customerMailReader.hidden = composing || !message;
  if (!message) return;

  const { email } = customerContactDetails(selectedCustomer);
  const outgoing = message.direction === 'outgoing';
  const sender = outgoing ? 'Paryatech Travel' : selectedCustomer.contactName;
  const route = outgoing ? `To ${selectedCustomer.name} · ${email}` : `To Paryatech Travel · from ${email}`;
  $('#customerMailReaderDirection').textContent = outgoing ? 'Sent' : 'Received';
  $('#customerMailReaderSubject').textContent = message.subject || '(no subject)';
  $('#customerMailReaderTime').textContent = message.time;
  if (outgoing) renderParyatechAvatar($('#customerMailReaderAvatar'));
  else $('#customerMailReaderAvatar').textContent = initials(sender);
  $('#customerMailReaderSender').textContent = sender;
  $('#customerMailReaderRoute').textContent = route;
  $('#customerMailReaderBody').textContent = message.body.replace(/\\n/g, '\n');
  const attachments = message.attachments ?? [];
  const attachmentContainer = $('#customerMailReaderAttachments');
  attachmentContainer.hidden = attachments.length === 0;
  attachmentContainer.innerHTML = attachments.map((attachment) => `<span><svg><use href="#i-file" /></svg>${escapeHTML(attachment.name)}</span>`).join('');
}

function renderCustomerMailWorkspace() {
  const conversation = customerEmailConversation();
  const messages = conversation.messages;
  const filtered = filteredCustomerMail(messages);
  const inboxCount = messages.filter((message) => message.direction === 'incoming').length;
  const sentCount = messages.filter((message) => message.direction === 'outgoing').length;
  const { email } = customerContactDetails(selectedCustomer);
  const filterLabel = { all: 'All mail', inbox: 'Inbox', sent: 'Sent' }[customerMailFilter];
  markInboxConversationRead(conversation);
  $('#customerMailHeaderAvatar').textContent = initials(selectedCustomer.name);
  $('#customerMailTitle').textContent = selectedCustomer.name;
  $('#customerMailThreadTitle').textContent = filterLabel;
  $('#customerMailThreadSummary').textContent = `${filtered.length} ${filtered.length === 1 ? 'message' : 'messages'}`;
  $('#customerMailAddress').textContent = email;
  $('#customerMailTo').value = email;
  $('#customerMailAllCount').textContent = messages.length;
  $('#customerMailInboxCount').textContent = inboxCount;
  $('#customerMailSentCount').textContent = sentCount;
  $$('[data-customer-mail-filter]').forEach((button) => {
    const active = button.dataset.customerMailFilter === customerMailFilter;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-selected', String(active));
  });
  customerMailThread.innerHTML = filtered.length
    ? filtered.map(({ message, index }) => {
      const outgoing = message.direction === 'outgoing';
      const sender = outgoing ? 'Paryatech Travel' : selectedCustomer.contactName;
      const preview = message.body.replace(/\\n|\n/g, ' ').trim();
      const attachmentCount = message.attachments?.length ?? 0;
      return `<button class="customer-mail-message${outgoing ? ' is-sent' : ' is-received'}" type="button" role="listitem" data-customer-mail-index="${index}" aria-label="Open ${escapeHTML(message.subject || 'email')}">
        <span class="customer-mail-avatar">${outgoing ? paryatechAvatarMarkup() : escapeHTML(initials(sender))}</span>
        <span class="customer-mail-message-copy">
          <span class="customer-mail-message-top"><strong>${escapeHTML(message.subject || '(no subject)')}</strong><time>${escapeHTML(message.time)}</time></span>
          <span class="customer-mail-message-meta">${escapeHTML(sender)} · ${outgoing ? 'Sent' : 'Received'}${attachmentCount ? ` · ${attachmentCount} attachment${attachmentCount === 1 ? '' : 's'}` : ''}</span>
          <span class="customer-mail-message-preview">${escapeHTML(preview)}</span>
        </span>
        <span class="customer-mail-direction">${outgoing ? 'Sent' : 'Received'}</span>
      </button>`;
    }).join('')
    : `<div class="customer-mail-empty"><svg><use href="#i-mail" /></svg><strong>No ${customerMailFilter === 'inbox' ? 'received' : customerMailFilter === 'sent' ? 'sent' : ''} emails yet</strong><p>Create a new email or select another mailbox.</p></div>`;
  setCustomerMailSidebarCollapsed(customerMailSidebarCollapsed);
  renderCustomerMailReader(messages);
  renderInboxList();
  if (selectedCustomer) {
    const communicationPill = document.getElementById('communicationTabCount');
    if (communicationPill) communicationPill.textContent = customerEmailMessageCount(selectedCustomer);
  }
}

function openCustomerMailReader(index) {
  const conversation = customerEmailConversation();
  if (!conversation.messages[index]) return;
  closeCustomerMailComposer();
  selectedCustomerMailIndex = index;
  if (conversation.messages[index].direction === 'incoming') conversation.messages[index].read = true;
  renderCustomerMailWorkspace();
  customerMailReader.focus({ preventScroll: true });
}

function openCustomerMailComposer(templateKey = '') {
  const template = customerMailTemplates[templateKey];
  const recipient = selectedCustomer.contactName || selectedCustomer.name;
  selectedCustomerMailIndex = null;
  customerMailAttachments = [];
  customerMailComposer.reset();
  customerMailAttachmentInput.value = '';
  $('#customerMailTo').value = customerContactDetails(selectedCustomer).email;
  customerMailSubject.value = template?.subject ?? '';
  customerMailBody.value = template ? template.body(recipient) : '';
  sendCustomerMail.disabled = !customerMailSubject.value.trim() || !customerMailBody.value.trim();
  closeCustomerMailTemplateMenu();
  renderCustomerMailComposerAttachments();
  customerMailComposer.hidden = false;
  customerMailListView.hidden = true;
  customerMailReader.hidden = true;
  window.setTimeout(() => (template ? customerMailBody : customerMailSubject).focus(), 0);
}

function closeCustomerMailComposer() {
  customerMailComposer.reset();
  customerMailComposer.hidden = true;
  customerMailAttachments = [];
  customerMailAttachmentInput.value = '';
  sendCustomerMail.disabled = true;
  closeCustomerMailTemplateMenu();
  renderCustomerMailComposerAttachments();
  renderCustomerMailReader(customerEmailConversation().messages);
}

function submitCustomerMail() {
  if (!customerMailComposer.reportValidity()) return;
  const conversation = customerEmailConversation();
  conversation.messages.push({
    direction: 'outgoing',
    subject: customerMailSubject.value.trim(),
    body: customerMailBody.value.trim(),
    attachments: customerMailAttachments.map((attachment) => ({ ...attachment })),
    time: inboxCurrentTime(),
  });
  conversation.time = 'Now';
  moveInboxConversationToTop(conversation);
  customerMailFilter = 'all';
  selectedCustomerMailIndex = null;
  closeCustomerMailComposer();
  renderCustomerMailWorkspace();
  showToast(`Email sent to ${selectedCustomer.name}`);
}

function customerEmailMessageCount(customer) {
  if (!customer) return 0;
  const conversation = inboxConversations.find((item) => item.customerId === customer.id && item.channel === 'email');
  return conversation ? conversation.messages.length : 0;
}

function queryEmailConversation(customer = queryDetailCustomer()) {
  if (!customer) return null;
  return ensureInboxConversation(customer, 'email');
}

function filteredQueryMail(messages) {
  const entries = messages.map((message, index) => ({ message, index }));
  if (queryMailFilter === 'inbox') return entries.filter(({ message }) => message.direction === 'incoming');
  if (queryMailFilter === 'sent') return entries.filter(({ message }) => message.direction === 'outgoing');
  return entries;
}

function queryMailScope() {
  return $('[data-query-mail-shell]', queryDetailContent);
}

function renderQueryMailComposerAttachments() {
  const scope = queryMailScope();
  if (!scope) return;
  const container = $('[data-query-mail-composer-attachments]', scope);
  const composer = $('[data-query-mail-composer]', scope);
  if (!container || !composer || composer.hidden) return;
  container.hidden = queryMailAttachments.length === 0;
  container.innerHTML = queryMailAttachments.map((attachment, index) => `
    <span><svg><use href="#i-file" /></svg>${escapeHTML(attachment.name)}<button type="button" data-query-mail-attachment-remove="${index}" aria-label="Remove ${escapeHTML(attachment.name)}">×</button></span>
  `).join('');
}

function renderQueryMailReader(messages) {
  const scope = queryMailScope();
  if (!scope) return;
  const customer = queryDetailCustomer();
  const message = Number.isInteger(selectedQueryMailIndex) ? messages[selectedQueryMailIndex] : null;
  const composer = $('[data-query-mail-composer]', scope);
  const listView = $('[data-query-mail-list-view]', scope);
  const reader = $('[data-query-mail-reader]', scope);
  if (!composer || !listView || !reader) return;
  const composing = !composer.hidden;
  listView.hidden = composing || Boolean(message);
  reader.hidden = composing || !message;
  if (!message || !customer) return;
  const { email } = customerContactDetails(customer);
  const outgoing = message.direction === 'outgoing';
  const sender = outgoing ? 'Paryatech Travel' : (customer.contactName || customer.name);
  const route = outgoing ? `To ${customer.name} · ${email}` : `To Paryatech Travel · from ${email}`;
  $('[data-query-mail-reader-direction]', scope).textContent = outgoing ? 'Sent' : 'Received';
  $('[data-query-mail-reader-subject]', scope).textContent = message.subject || '(no subject)';
  $('[data-query-mail-reader-time]', scope).textContent = message.time;
  const avatar = $('[data-query-mail-reader-avatar]', scope);
  if (outgoing) renderParyatechAvatar(avatar);
  else avatar.textContent = initials(sender);
  $('[data-query-mail-reader-sender]', scope).textContent = sender;
  $('[data-query-mail-reader-route]', scope).textContent = route;
  $('[data-query-mail-reader-body]', scope).textContent = String(message.body || '').replace(/\\n/g, '\n');
  const attachments = message.attachments ?? [];
  const attachmentContainer = $('[data-query-mail-reader-attachments]', scope);
  attachmentContainer.hidden = attachments.length === 0;
  attachmentContainer.innerHTML = attachments.map((attachment) => `<span><svg><use href="#i-file" /></svg>${escapeHTML(attachment.name)}</span>`).join('');
}

function renderQueryMailWorkspace() {
  const scope = queryMailScope();
  const customer = queryDetailCustomer();
  if (!scope || !customer) return;
  const conversation = queryEmailConversation(customer);
  const messages = conversation ? conversation.messages : [];
  const filtered = filteredQueryMail(messages);
  const inboxCount = messages.filter((message) => message.direction === 'incoming').length;
  const sentCount = messages.filter((message) => message.direction === 'outgoing').length;
  const { email } = customerContactDetails(customer);
  const filterLabel = { all: 'All mail', inbox: 'Inbox', sent: 'Sent' }[queryMailFilter];
  if (conversation) markInboxConversationRead(conversation);
  $('[data-query-mail-avatar]', scope).textContent = initials(customer.name);
  $('[data-query-mail-title]', scope).textContent = customer.name;
  $('[data-query-mail-thread-title]', scope).textContent = filterLabel;
  $('[data-query-mail-thread-summary]', scope).textContent = `${filtered.length} ${filtered.length === 1 ? 'message' : 'messages'}`;
  $('[data-query-mail-address]', scope).textContent = email;
  const toInput = $('[data-query-mail-to]', scope);
  if (toInput) toInput.value = email;
  $('[data-query-mail-all-count]', scope).textContent = messages.length;
  $('[data-query-mail-inbox-count]', scope).textContent = inboxCount;
  $('[data-query-mail-sent-count]', scope).textContent = sentCount;
  $$('[data-query-mail-filter]', scope).forEach((button) => {
    const active = button.dataset.queryMailFilter === queryMailFilter;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-selected', String(active));
  });
  const thread = $('[data-query-mail-thread]', scope);
  thread.innerHTML = filtered.length
    ? filtered.map(({ message, index }) => {
      const outgoing = message.direction === 'outgoing';
      const sender = outgoing ? 'Paryatech Travel' : (customer.contactName || customer.name);
      const preview = String(message.body || '').replace(/\\n|\n/g, ' ').trim();
      const attachmentCount = message.attachments?.length ?? 0;
      return `<button class="customer-mail-message${outgoing ? ' is-sent' : ' is-received'}" type="button" role="listitem" data-query-mail-index="${index}" aria-label="Open ${escapeHTML(message.subject || 'email')}">
        <span class="customer-mail-avatar">${outgoing ? paryatechAvatarMarkup() : escapeHTML(initials(sender))}</span>
        <span class="customer-mail-message-copy">
          <span class="customer-mail-message-top"><strong>${escapeHTML(message.subject || '(no subject)')}</strong><time>${escapeHTML(message.time)}</time></span>
          <span class="customer-mail-message-meta">${escapeHTML(sender)} · ${outgoing ? 'Sent' : 'Received'}${attachmentCount ? ` · ${attachmentCount} attachment${attachmentCount === 1 ? '' : 's'}` : ''}</span>
          <span class="customer-mail-message-preview">${escapeHTML(preview)}</span>
        </span>
        <span class="customer-mail-direction">${outgoing ? 'Sent' : 'Received'}</span>
      </button>`;
    }).join('')
    : `<div class="customer-mail-empty"><svg><use href="#i-mail" /></svg><strong>No ${queryMailFilter === 'inbox' ? 'received' : queryMailFilter === 'sent' ? 'sent' : ''} emails yet</strong><p>Create a new email or select another mailbox.</p></div>`;
  scope.classList.toggle('is-sidebar-collapsed', queryMailSidebarCollapsed);
  const toggle = $('[data-query-mail-sidebar-toggle]', scope);
  if (toggle) {
    toggle.setAttribute('aria-expanded', String(!queryMailSidebarCollapsed));
    toggle.setAttribute('aria-label', queryMailSidebarCollapsed ? 'Expand mailboxes' : 'Collapse mailboxes');
  }
  renderQueryMailReader(messages);
  renderInboxList();
  const queryTabCount = $('[data-query-detail-tab="communication"] span', queryDetailContent);
  if (queryTabCount) queryTabCount.textContent = messages.length;
  if (selectedCustomer && customer && selectedCustomer.id === customer.id) {
    const communicationPill = document.getElementById('communicationTabCount');
    if (communicationPill) communicationPill.textContent = messages.length;
  }
}

function openQueryMailReader(index) {
  const conversation = queryEmailConversation();
  if (!conversation || !conversation.messages[index]) return;
  closeQueryMailComposer(true);
  selectedQueryMailIndex = index;
  if (conversation.messages[index].direction === 'incoming') conversation.messages[index].read = true;
  renderQueryMailWorkspace();
  $('[data-query-mail-reader]', queryMailScope())?.focus({ preventScroll: true });
}

function openQueryMailComposer(templateKey = '') {
  const scope = queryMailScope();
  const customer = queryDetailCustomer();
  if (!scope || !customer) return;
  const template = customerMailTemplates[templateKey];
  const recipient = customer.contactName || customer.name;
  selectedQueryMailIndex = null;
  queryMailAttachments = [];
  const composer = $('[data-query-mail-composer]', scope);
  const subject = $('[data-query-mail-subject]', scope);
  const body = $('[data-query-mail-body]', scope);
  const toInput = $('[data-query-mail-to]', scope);
  const attachmentInput = $('[data-query-mail-attachment-input]', scope);
  const sendButton = $('[data-query-mail-send]', scope);
  composer.reset();
  if (attachmentInput) attachmentInput.value = '';
  if (toInput) toInput.value = customerContactDetails(customer).email;
  subject.value = template?.subject ?? '';
  body.value = template ? template.body(recipient) : '';
  sendButton.disabled = !subject.value.trim() || !body.value.trim();
  closeQueryMailTemplateMenu();
  renderQueryMailComposerAttachments();
  composer.hidden = false;
  $('[data-query-mail-list-view]', scope).hidden = true;
  $('[data-query-mail-reader]', scope).hidden = true;
  window.setTimeout(() => (template ? body : subject).focus(), 0);
}

function closeQueryMailComposer(silent = false) {
  const scope = queryMailScope();
  if (!scope) {
    queryMailAttachments = [];
    return;
  }
  const composer = $('[data-query-mail-composer]', scope);
  if (!composer || composer.hidden) {
    queryMailAttachments = [];
    if (!silent) renderQueryMailReader(queryEmailConversation()?.messages ?? []);
    return;
  }
  composer.reset();
  composer.hidden = true;
  queryMailAttachments = [];
  const attachmentInput = $('[data-query-mail-attachment-input]', scope);
  if (attachmentInput) attachmentInput.value = '';
  const sendButton = $('[data-query-mail-send]', scope);
  if (sendButton) sendButton.disabled = true;
  closeQueryMailTemplateMenu();
  if (!silent) renderQueryMailReader(queryEmailConversation()?.messages ?? []);
}

function closeQueryMailTemplateMenu() {
  const scope = queryMailScope();
  const menu = scope ? $('[data-query-mail-template-menu]', scope) : null;
  const button = scope ? $('[data-query-mail-template-button]', scope) : null;
  if (menu) menu.hidden = true;
  if (button) button.setAttribute('aria-expanded', 'false');
}

function submitQueryMail() {
  const scope = queryMailScope();
  const customer = queryDetailCustomer();
  const conversation = queryEmailConversation(customer);
  if (!scope || !customer || !conversation) return;
  const composer = $('[data-query-mail-composer]', scope);
  if (!composer || !composer.reportValidity()) return;
  const subject = $('[data-query-mail-subject]', scope).value.trim();
  const body = $('[data-query-mail-body]', scope).value.trim();
  if (!subject || !body) return;
  const sharedProposal = customerProposalRecords.find((proposal) => queryMailAttachments.some((attachment) => attachment.name.startsWith(proposal.id)));
  conversation.messages.push({
    direction: 'outgoing',
    subject,
    body,
    attachments: queryMailAttachments.map((attachment) => ({ ...attachment })),
    time: inboxCurrentTime(),
  });
  if (sharedProposal) {
    sharedProposal.status = 'Sent';
    sharedProposal.sentAt = taskDateOffset(0);
  }
  conversation.time = 'Now';
  moveInboxConversationToTop(conversation);
  queryMailFilter = 'all';
  selectedQueryMailIndex = null;
  closeQueryMailComposer(true);
  renderQueryMailWorkspace();
  if (selectedCustomer && customer && selectedCustomer.id === customer.id) renderCustomerMailWorkspace();
  else renderInboxList();
  showToast(`Email sent to ${customer.name}`);
}

function queryCustomerRecord(query) {
  return customers.find((customer) => customer.id === query.customerId);
}

function queryCategoryRecords() {
  const search = queriesSearch.value.trim().toLocaleLowerCase();
  return queryModuleRecords.filter((query) => {
    const customer = queryCustomerRecord(query);
    const matchesCategory = query.type === activeQueryCategory;
    const matchesScope = activeQueryScope === 'all' || queryOwnerMatches(query, TASK_CURRENT_USER);
    const matchesSearch = !search || [query.title, query.delay, query.pendingOn, ...queryOwnerList(query), query.status, customer?.name, customer?.id]
      .some((value) => String(value ?? '').toLocaleLowerCase().includes(search));
    const matchesPriority = queryFilters.priority === 'all' || query.priority === queryFilters.priority;
    const matchesPending = queryFilters.pendingOn === 'all' || query.pendingOn === queryFilters.pendingOn;
    const matchesTier = queryFilters.tier === 'all' || customerTierMatches(customer, queryFilters.tier);
    return matchesCategory && matchesScope && matchesSearch && matchesPriority && matchesPending && matchesTier;
  });
}

function queryCardMarkup(query) {
  const customer = queryCustomerRecord(query);
  const customerName = customer?.name ?? 'Unknown customer';
  const customerId = customer?.id ?? query.customerId ?? 'No customer ID';
  const tier = customer?.tier ?? 'Bronze';
  const tierClass = tier.toLocaleLowerCase().replace(/[^a-z0-9]+/g, '-');
  const ownerInitials = queryOwnerAvatar(query);
  return `<article class="query-card" draggable="true" tabindex="0" data-query-id="${escapeHTML(query.id)}" aria-label="${escapeHTML(query.title)}, ${escapeHTML(customerName)}, ${escapeHTML(query.status)}">
    <div class="query-card-top">
      <span class="query-priority query-priority-${query.priority.toLocaleLowerCase()}">${escapeHTML(query.priority)}</span>
      <span class="query-tier query-tier-${escapeHTML(tierClass)}"><i aria-hidden="true"></i>${escapeHTML(tier)}</span>
    </div>
    <span class="query-card-drag" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></span>
    <h3 class="query-card-title">${escapeHTML(query.title)}</h3>
    <p class="query-card-customer">${escapeHTML(customerName)} <b>(${escapeHTML(customerId)})</b></p>
    <footer class="query-card-footer">
      <span class="query-delay"><svg><use href="#i-hourglass" /></svg>${escapeHTML(query.delay)}</span>
      <time class="query-activity">${escapeHTML(query.activity)}</time>
      <span class="query-avatar" title="${escapeHTML(assigneeDisplayNames(queryOwnerList(query)))}" aria-label="Assigned to ${escapeHTML(assigneeDisplayNames(queryOwnerList(query)))}">${escapeHTML(ownerInitials)}</span>
    </footer>
  </article>`;
}

function queryListRowMarkup(query) {
  const customer = queryCustomerRecord(query);
  const ownerInitials = queryOwnerAvatar(query);
  const context = [customer?.name, query.customerId].filter(Boolean).join(' · ');
  const prioritySlug = String(query.priority || '').toLocaleLowerCase();
  return `<tr tabindex="0" data-query-id="${escapeHTML(query.id)}" aria-label="Open ${escapeHTML(query.title)}">
    <td><div class="customer-cell"><span class="avatar" aria-hidden="true">${escapeHTML(initials(query.title))}</span><div class="customer-identity"><span class="customer-name">${escapeHTML(query.title)}</span><span class="customer-id">${escapeHTML(context)}</span></div></div></td>
    <td><span class="tier tier-${escapeHTML(prioritySlug)}">${escapeHTML(query.priority)}</span></td>
    <td><span class="kind-badge">${escapeHTML(query.pendingOn)}</span></td>
    <td class="numeric">${query.value ? formatCurrency(query.value) : '—'}</td>
    <td><div class="customer-cell"><span class="avatar" title="${escapeHTML(assigneeDisplayNames(queryOwnerList(query)))}" aria-hidden="true">${escapeHTML(ownerInitials)}</span><div class="customer-identity"><span class="customer-name">${escapeHTML(assigneeDisplayNames(queryOwnerList(query)))}</span><span class="customer-id">${escapeHTML(query.activity)}</span></div></div></td>
    <td><div class="row-actions"><button class="row-menu" type="button" data-query-action="${escapeHTML(query.id)}" aria-label="${escapeHTML(query.title)} actions"><svg><use href="#i-more" /></svg></button></div></td>
  </tr>`;
}

function renderQueryModule() {
  const records = queryCategoryRecords();
  queryNameHeading.textContent = `${activeQueryCategory} name`;
  queryValueHeading.textContent = `${activeQueryCategory} value`;

  $$('[data-query-category]').forEach((tab) => {
    const category = tab.dataset.queryCategory;
    const active = category === activeQueryCategory;
    $('.category-tab-count', tab).textContent = queryModuleRecords.filter((query) => query.type === category).length;
    tab.classList.toggle('is-active', active);
    tab.setAttribute('aria-selected', String(active));
  });
  $$('.nav-subitem').forEach((link) => {
    const active = link.getAttribute('href') === `#${activeQueryCategory.toLocaleLowerCase()}` && activeView === 'queries';
    link.classList.toggle('is-active', active);
    if (active) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  $$('[data-query-layout]').forEach((button) => {
    const active = button.dataset.queryLayout === activeQueryLayout;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  $$('[data-query-scope]').forEach((button) => {
    const active = button.dataset.queryScope === activeQueryScope;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  if (queriesScopeFilter && queriesScopeFilter.value !== activeQueryScope) queriesScopeFilter.value = activeQueryScope;
  $$('[data-query-status]', queryStatusTabs).forEach((tab) => {
    const active = tab.dataset.queryStatus === activeQueryStatus;
    tab.classList.toggle('is-active', active);
    tab.setAttribute('aria-selected', String(active));
  });

  const hasRecords = records.length > 0;
  queryEmptyState.hidden = hasRecords;
  $('#queryEmptyTitle').textContent = `No ${activeQueryCategory.toLocaleLowerCase()} queries yet`;
  queryKanbanShell.hidden = !hasRecords || activeQueryLayout !== 'kanban';
  queryListShell.hidden = !hasRecords || activeQueryLayout !== 'list';

  if (activeQueryLayout === 'kanban') {
    queryKanban.innerHTML = QUERY_KANBAN_STATUSES.map((status) => {
      const statusRecords = records.filter((query) => query.status === status);
      return `<section class="query-column" data-query-status-drop="${escapeHTML(status)}">
        <header class="query-column-header">
          <div class="query-column-title"><i aria-hidden="true"></i><strong>${escapeHTML(status)}</strong><span>${statusRecords.length}</span></div>
          <button class="query-column-add" type="button" data-query-add-status="${escapeHTML(status)}" aria-label="Add ${escapeHTML(activeQueryCategory.toLocaleLowerCase())} query"><svg><use href="#i-plus" /></svg></button>
        </header>
        <div class="query-column-list">${statusRecords.length ? statusRecords.map(queryCardMarkup).join('') : '<div class="query-column-empty">No queries in this stage</div>'}</div>
      </section>`;
    }).join('');
  } else {
    const statusRecords = activeQueryStatus === 'All' ? records : records.filter((query) => query.status === activeQueryStatus);
    const totalPages = Math.max(1, Math.ceil(statusRecords.length / WORKSPACE_LIST_PAGE_SIZE));
    queryListPage = Math.max(1, Math.min(queryListPage, totalPages));
    const start = (queryListPage - 1) * WORKSPACE_LIST_PAGE_SIZE;
    queryListBody.innerHTML = statusRecords.length
      ? statusRecords.slice(start, start + WORKSPACE_LIST_PAGE_SIZE).map(queryListRowMarkup).join('')
      : `<tr><td colspan="6"><div class="query-column-empty">No ${escapeHTML(activeQueryStatus.toLocaleLowerCase())} queries</div></td></tr>`;
    queryListPagination.innerHTML = statusRecords.length
      ? paginationMarkup(queryListPage, totalPages, statusRecords.length, WORKSPACE_LIST_PAGE_SIZE, 'query-list-page', 'queries')
      : '';
    queryListPagination.hidden = statusRecords.length === 0;
    enhanceListSheet(queryListBody.closest('table'), 'queries', queryModuleRecords.map(item => item.id));
  }
}

function setQueryCategory(category, updateHistory = false) {
  if (!QUERY_TYPES.includes(category)) return;
  activeQueryCategory = category;
  activeQueryStatus = 'All';
  queryListPage = 1;
  renderQueryModule();
  if (updateHistory) history.pushState({ view: 'queries', queryCategory: category, canGoBack: true }, '', `#${category.toLocaleLowerCase()}`);
}

function updateQueryModuleStatus(queryIdValue, status) {
  const query = queryModuleRecords.find((item) => item.id === queryIdValue);
  if (!query || !QUERY_KANBAN_STATUSES.includes(status) || query.status === status) return;
  query.status = status;
  query.activity = 'Just now';
  renderQueryModule();
  showToast(`${query.title} moved to ${status}`);
}

function queryDetailCustomer(query = selectedQuery) {
  return query ? queryCustomerRecord(query) : null;
}

function queryDetailProposals(query = selectedQuery) {
  return query ? customerProposalRecords.filter((proposal) => proposal.linkedQuery === query.id) : [];
}

function queryDetailTasks(query = selectedQuery) {
  if (!query) return [];
  const normalizedTitle = query.title.toLocaleLowerCase();
  return taskRecords.filter((task) => task.queryId === query.id
    || (task.entityType === 'Query' && normalizedTitle.includes(String(task.entity || '').toLocaleLowerCase())));
}

function queryDetailFacts(query) {
  const details = query.details ?? {};
  const candidates = [
    ['Destination', details.destination || details.flightDestination || details.stayDestination || details.visaCountry || details.arrivalPort || details.transportDestination],
    ['Departure', details.departureCity || details.flightOrigin || details.departurePort || details.transportDeparture],
    ['Start date', details.startDate || details.departureDate || details.checkIn || details.travelDate],
    ['End date', details.endDate || details.returnDate || details.checkOut],
    ['Adults', query.adults],
    ['Children', query.children],
    ['Infants', query.infants],
    ['Priority', query.priority],
    ['Pending on', query.pendingOn],
  ];
  return candidates.filter(([, value]) => value !== undefined && value !== null && value !== '');
}

function queryDetailEmpty(title, copy) {
  return `<div class="query-detail-empty"><svg><use href="#i-file" /></svg><strong>${escapeHTML(title)}</strong><p>${escapeHTML(copy)}</p></div>`;
}

function queryOverviewActivity(query) {
  const items = queryDetailProposals(query)
    .filter((proposal) => proposal.linkedQuery === query.id)
    .slice(0, 3)
    .map((proposal) => ({
      time: pipelineDateLabel(proposal.sentAt),
      title: `Proposal ${String(proposal.status).toLowerCase()}`,
      detail: proposal.title,
    }));
    items.push({ time: query.activity, title: `Status · ${query.status}`, detail: `Owned by ${assigneeDisplayNames(queryOwnerList(query))}` });
  return items.slice(0, 3);
}

function queryDetailOverviewMarkup(query, customer) {
  const tiers = customerTierList(customer);
  const customerTier = tiers[0];
  const tasks = queryDetailTasks(query).filter(isActiveTask);
  return `<div class="overview-trio" aria-label="Current position, tasks and customer profile">
    <article class="trio-panel" aria-labelledby="queryCurrentTitle">
      <header class="trio-panel-header"><h2 id="queryCurrentTitle">Current position</h2><button type="button" data-query-detail-action="edit-position">Edit</button></header>
      <dl class="query-current-list">
        <div><dt>Expected value</dt><dd>${query.value ? formatCurrency(query.value) : '—'}</dd></div>
        <div><dt>Pending on</dt><dd>${escapeHTML(query.pendingOn)}</dd></div>
        <div><dt>Follow-up</dt><dd>${escapeHTML(query.delay)}</dd></div>
        <div><dt>Priority</dt><dd class="${query.priority === 'High' ? 'query-current-high' : ''}">${escapeHTML(query.priority)}</dd></div>
        <div><dt>Assigned to</dt><dd><span class="query-owner"><span class="query-avatar">${escapeHTML(queryOwnerAvatar(query))}</span>${escapeHTML(assigneeDisplayNames(queryOwnerList(query)))}</span></dd></div>
      </dl>
    </article>
    <article class="trio-panel" aria-labelledby="queryTasksTitle">
      <header class="trio-panel-header"><h2 id="queryTasksTitle">Task</h2><button type="button" data-query-detail-action="view-tasks">View all</button></header>
      <div class="trio-task-cards">${tasks.length ? tasks.map((task) => {
    const priority = task.priority || 'Medium';
    return `<article class="trio-task-card" tabindex="0" data-query-task-id="${escapeHTML(task.id)}" aria-label="View ${escapeHTML(task.title)}">
          <div class="trio-task-top">
            <span class="customer-task-priority customer-task-priority-${priority.toLocaleLowerCase()}">${escapeHTML(priority)}</span>
            ${task.tier ? `<span class="tier tier-${task.tier.toLocaleLowerCase()}">${escapeHTML(task.tier)}</span>` : ''}
            <span class="trio-task-grip" aria-hidden="true"><svg><use href="#i-more" /></svg></span>
          </div>
          <strong>${escapeHTML(task.title)}</strong>
          <small>${escapeHTML(customerTaskDueLabel(task))}</small>
        </article>`;
  }).join('') : '<p class="trio-empty">No active tasks for this query.</p>'}</div>
    </article>
    <article class="trio-panel" aria-labelledby="queryCustomerTitle">
      <header class="trio-panel-header"><h2 id="queryCustomerTitle">Customer Profile</h2><button type="button" data-query-detail-action="view-customer" aria-label="Open customer profile"><svg><use href="#i-external" /></svg></button></header>
      <dl class="query-customer-facts">
        <div><dt>Customer code</dt><dd>${escapeHTML(customer.id)}</dd></div>
        <div><dt>Category</dt><dd>${escapeHTML(customer.category)}</dd></div>
        <div><dt>Group</dt><dd>${escapeHTML(customer.groupType ?? customer.category)}</dd></div>
        <div><dt>Location</dt><dd>${escapeHTML(customer.location)}</dd></div>
        <div><dt>Tier</dt><dd>${customerTier ? `<span class="tier tier-${customerTier.toLocaleLowerCase()}">${escapeHTML(customerTier)}</span>` : '—'}</dd></div>
        <div><dt>Source</dt><dd>${escapeHTML(customer.source ?? 'Website')}</dd></div>
        <div><dt>Customer created date</dt><dd>${escapeHTML(customerCreatedDateLabel(customer))}</dd></div>
      </dl>
    </article>
  </div>
  <article class="trio-panel query-recent-panel" aria-labelledby="queryRecentTitle">
    <header class="trio-panel-header"><h2 id="queryRecentTitle">Recent activity</h2></header>
    <ol class="activity-list">${queryOverviewActivity(query).map((item, index) => `<li><time>${escapeHTML(item.time)}</time><span class="activity-dot${index === 0 ? ' is-positive' : ''}"></span><p><strong>${escapeHTML(item.title)}</strong><small>${escapeHTML(item.detail)}</small></p></li>`).join('')}</ol>
  </article>`;
}

function itineraryISODate(value, fallback) {
  const candidate = /^\d{4}-\d{2}-\d{2}$/.test(String(value || '')) ? String(value) : fallback;
  return candidate;
}

function itineraryDateOffset(value, days) {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function itineraryDateLabel(value, compact = false) {
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return String(value || 'Date pending');
  return new Intl.DateTimeFormat('en-IN', compact
    ? { day: 'numeric', month: 'short', timeZone: 'UTC' }
    : { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(date);
}

function itineraryTripPreset(query, proposal = null) {
  const details = query.details ?? {};
  const catalog = proposal?.catalogId ? proposalCatalogRecords.find((item) => item.id === proposal.catalogId) : null;
  if (catalog) return {
    origin: details.departureCity || catalog.origin,
    stops: catalog.stops.map((stop) => ({ ...stop })),
    scope: catalog.scope,
  };
  const title = query.title.toLocaleLowerCase();
  const start = new Date(`${details.startDate || ''}T00:00:00Z`);
  const end = new Date(`${details.endDate || ''}T00:00:00Z`);
  const requestedNights = Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())
    ? 4
    : Math.max(1, Math.round((end - start) / 86400000));
  const preset = title.includes('shimla')
    ? { origin: 'Bengaluru', stops: [{ city: 'Shimla', nights: 3 }, { city: 'Manali', nights: 2 }, { city: 'Chandigarh', nights: 1 }] }
    : title.includes('goa')
      ? { origin: details.departureCity || 'Hyderabad', stops: [{ city: 'North Goa', nights: 2 }, { city: 'South Goa', nights: 2 }] }
      : title.includes('kerala')
        ? { origin: details.departureCity || 'Bengaluru', stops: [{ city: 'Munnar', nights: 2 }, { city: 'Thekkady', nights: 1 }, { city: 'Alleppey', nights: 2 }] }
        : { origin: details.departureCity || 'Bengaluru', stops: [{ city: details.destination || query.summary || 'Destination', nights: requestedNights }] };
  const savedStops = Array.isArray(query.tripCities)
    ? query.tripCities.filter((stop) => stop.city).map((stop) => ({ city: stop.city, nights: Math.max(1, Number(stop.nights) || 1) }))
    : [];
  return {
    origin: details.departureCity || preset.origin,
    stops: savedStops.length ? savedStops : preset.stops,
    scope: details.scope || 'Domestic',
  };
}

function createItineraryModel(query, proposal) {
  const preset = itineraryTripPreset(query, proposal);
  const totalNights = preset.stops.reduce((sum, stop) => sum + stop.nights, 0);
  const startDate = itineraryISODate(query.details?.startDate, '2026-12-12');
  const routeDays = preset.stops.flatMap((stop) => Array.from({ length: stop.nights }, () => stop.city));
  routeDays.push(preset.stops.at(-1).city);
  const activityNames = ['Arrival, hotel check-in and local orientation', 'Guided city highlights and market walk', 'Scenic excursion with private transfers'];
  const days = routeDays.map((city, index) => {
    const previousCity = index === 0 ? preset.origin : routeDays[index - 1];
    const changesCity = previousCity !== city;
    return {
      date: itineraryDateOffset(startDate, index),
      time: index === 0 ? '10:00' : '09:00',
      city,
      description: index === 0
        ? `Arrive in ${city}, meet your driver and settle into the hotel.`
        : `Explore ${city} at a comfortable pace with time kept flexible for the travellers.`,
      travel: index === 0 || changesCity ? `${previousCity} → ${city}` : `Local travel in ${city}`,
      hotelCheckIn: index === 0 || changesCity ? `${city} hotel check-in` : 'Continue at the same stay',
      meals: 'Breakfast',
      operationsNote: '',
      activities: index < 3 ? [{ name: activityNames[index], details: index === 0 ? 'Private arrival assistance' : 'Private guide and transfers', guests: Math.max(1, Number(query.adults || 2) + Number(query.children || 0)), unitCost: 1200 + index * 350 }] : [],
    };
  });
  const accommodations = preset.stops.map((stop, index) => ({
    destination: stop.city,
    checkIn: itineraryDateOffset(startDate, preset.stops.slice(0, index).reduce((sum, item) => sum + item.nights, 0)),
    checkOut: itineraryDateOffset(startDate, preset.stops.slice(0, index + 1).reduce((sum, item) => sum + item.nights, 0)),
    name: index === 0 && stop.city.toLocaleLowerCase().includes('shimla') ? 'The Cedar Grand, Shimla' : `${stop.city} select hotel`,
    roomCategory: 'Deluxe room',
    mealPlan: 'Breakfast included',
    rooms: Math.max(1, Number(query.details?.rooms || 1)),
    nights: stop.nights,
    unitCost: 6200 + index * 800,
  }));
  const transportPoints = [preset.origin, ...preset.stops.map((stop) => stop.city)];
  const transport = transportPoints.slice(0, -1).map((point, index) => ({
    route: `${point} → ${transportPoints[index + 1]}`,
    vehicle: query.tripVehicles?.[0]?.type || 'SUV',
    units: Math.max(1, Number(query.tripVehicles?.[0]?.units || 1)),
    unitCost: 5500 + index * 1500,
  }));
  return {
    mode: proposal.itineraryMode || 'simple',
    scope: preset.scope,
    origin: preset.origin,
    stops: preset.stops,
    startDate,
    endDate: itineraryISODate(query.details?.endDate, itineraryDateOffset(startDate, totalNights)),
    travellers: Math.max(1, Number(query.adults || 2) + Number(query.children || 0) + Number(query.infants || 0)),
    days,
    accommodations,
    transport,
    flights: [],
    content: {
      title: proposal.title,
      preparedFor: queryDetailCustomer(query)?.name ?? '',
      bookingFrom: preset.origin,
      introduction: `A carefully paced ${totalNights + 1}-day journey planned around ${preset.stops.map((stop) => stop.city).join(', ')} with private support throughout.`,
      inclusions: 'Accommodation with selected meal plan\nPrivate transport listed in the itinerary\nSightseeing and activities listed by day',
      exclusions: 'Airfare unless listed\nPersonal expenses\nAnything not mentioned under inclusions',
      notes: 'Final timings remain subject to supplier confirmation.',
    },
    marginPercent: 10,
  };
}

function ensureItineraryModel(query, proposal) {
  if (!proposal.itinerary) proposal.itinerary = createItineraryModel(query, proposal);
  return proposal.itinerary;
}

function activeItineraryProposal(query = selectedQuery) {
  const proposals = queryDetailProposals(query);
  return proposals.find((proposal) => proposal.id === activeItineraryProposalId) ?? proposals[0] ?? null;
}

function itineraryServiceRows(model) {
  const rows = [];
  model.accommodations.forEach((stay, index) => rows.push({
    category: 'accommodation', kind: 'accommodations', index, title: stay.name, detail: `${stay.destination} · ${stay.roomCategory}`, quantity: stay.rooms * stay.nights, unitCost: stay.unitCost,
  }));
  model.days.forEach((day, dayIndex) => day.activities.forEach((activity, activityIndex) => rows.push({
    category: 'activities', kind: 'activities', index: dayIndex, subindex: activityIndex, title: activity.name, detail: `${day.city} · ${itineraryDateLabel(day.date, true)}`, quantity: activity.guests, unitCost: activity.unitCost,
  })));
  model.transport.forEach((transfer, index) => rows.push({
    category: 'transport', kind: 'transport', index, title: transfer.route, detail: transfer.vehicle, quantity: transfer.units, unitCost: transfer.unitCost,
  }));
  model.flights.forEach((flight, index) => rows.push({
    category: 'flights', kind: 'flights', index, title: flight.route, detail: flight.cabin, quantity: flight.travellers, unitCost: flight.unitCost,
  }));
  return rows;
}

function itineraryCostSummary(model) {
  const categoryTotals = { accommodation: 0, activities: 0, transport: 0, flights: 0 };
  const base = itineraryServiceRows(model).reduce((sum, row) => {
    const total = row.quantity * row.unitCost;
    categoryTotals[row.category] += total;
    return sum + total;
  }, 0);
  const margin = Math.round(base * Math.max(0, Number(model.marginPercent || 0)) / 100);
  return { base, margin, total: base + margin, categoryTotals };
}

function itineraryRouteMarkup(model) {
  return `<div class="itinerary-route" aria-label="Trip route">
    ${model.stops.map((stop, index) => `<div class="itinerary-route-stop"><span>${index + 1}</span><strong>${escapeHTML(stop.city)}</strong><small>${stop.nights} ${stop.nights === 1 ? 'night' : 'nights'}</small></div>${index < model.stops.length - 1 ? '<svg aria-hidden="true"><use href="#i-chevron-right" /></svg>' : ''}`).join('')}
  </div>
  <div class="itinerary-meta-strip">
    <span><b>${model.stops.reduce((sum, stop) => sum + stop.nights, 0)}</b> nights</span>
    <span><b>${model.days.length}</b> days</span>
    <span><b>${model.travellers}</b> travellers</span>
    <span><b>${escapeHTML(model.scope)}</b> trip</span>
  </div>`;
}

function itineraryDayMarkup(day, index, mode = 'simple') {
  const expanded = expandedItineraryDay === index;
  const activityLabel = `${day.activities.length} ${day.activities.length === 1 ? 'activity' : 'activities'}`;
  return `<article class="itinerary-day${expanded ? ' is-open' : ''}">
    <button class="itinerary-day-toggle" type="button" data-itinerary-day="${index}" aria-expanded="${expanded}">
      <span class="itinerary-day-number">${index + 1}</span>
      <span><small>Day ${index + 1} · ${escapeHTML(itineraryDateLabel(day.date, true))} · ${escapeHTML(day.time || 'Time pending')}</small><strong>${escapeHTML(day.city)}</strong><em>${escapeHTML(day.travel || 'Travel plan pending')} · ${escapeHTML(day.hotelCheckIn || 'Stay plan pending')}</em></span>
      <span class="itinerary-day-count">${activityLabel}</span>
      <svg><use href="#i-chevron-down" /></svg>
    </button>
    ${expanded ? `<div class="itinerary-day-editor">
      <div class="itinerary-day-field-grid">
        <label class="field"><span>Destination</span><input data-itinerary-change="day" data-index="${index}" data-field="city" value="${escapeHTML(day.city)}" /></label>
        <label class="field"><span>Date</span><input type="date" data-itinerary-change="day" data-index="${index}" data-field="date" value="${escapeHTML(day.date)}" /></label>
        <label class="field"><span>Start time</span><input type="time" data-itinerary-change="day" data-index="${index}" data-field="time" value="${escapeHTML(day.time || '')}" /></label>
      </div>
      <label class="field"><span>Day description</span><textarea rows="3" data-itinerary-change="day" data-index="${index}" data-field="description">${escapeHTML(day.description)}</textarea></label>
      <div class="field-grid">
        <label class="field"><span>Travel</span><input data-itinerary-change="day" data-index="${index}" data-field="travel" value="${escapeHTML(day.travel || '')}" placeholder="Route or local transfer" /></label>
        <label class="field"><span>Hotel check-in</span><input data-itinerary-change="day" data-index="${index}" data-field="hotelCheckIn" value="${escapeHTML(day.hotelCheckIn || '')}" placeholder="Stay or check-in note" /></label>
      </div>
      ${mode === 'advanced' ? `<div class="field-grid itinerary-advanced-fields">
        <label class="field"><span>Meals</span><input data-itinerary-change="day" data-index="${index}" data-field="meals" value="${escapeHTML(day.meals || '')}" placeholder="Breakfast, lunch, dinner" /></label>
        <label class="field"><span>Operations note</span><input data-itinerary-change="day" data-index="${index}" data-field="operationsNote" value="${escapeHTML(day.operationsNote || '')}" placeholder="Guide, ticket or supplier note" /></label>
      </div>` : ''}
      <div class="itinerary-activity-list">${day.activities.map((activity, activityIndex) => `<div><span><strong>${escapeHTML(activity.name)}</strong><small>${escapeHTML(activity.details || 'Details pending')}</small></span><button class="row-menu" type="button" data-itinerary-remove-activity="${activityIndex}" data-day-index="${index}" aria-label="Remove ${escapeHTML(activity.name)}"><svg><use href="#i-x" /></svg></button></div>`).join('')}</div>
      <div class="query-detail-quick-add"><input data-itinerary-activity-input="${index}" placeholder="Add an activity…" /><button class="button button-secondary button-small" type="button" data-itinerary-add-activity="${index}"><svg><use href="#i-plus" /></svg>Add activity</button></div>
    </div>` : ''}
  </article>`;
}

function itineraryMealOptions(value) {
  return ['Room only', 'Breakfast included', 'Half board', 'Full board'].map((option) => `<option${option === value ? ' selected' : ''}>${option}</option>`).join('');
}

function itineraryServiceTableMarkup(model, kind) {
  if (kind === 'accommodations') {
    return `<div class="customer-pipeline-table-wrap"><table class="customer-pipeline-table itinerary-service-table itinerary-stay-table">
      <thead><tr><th>Destination / dates</th><th>Accommodation</th><th>Room category</th><th>Meal plan</th><th>Rooms</th><th>Nights</th><th><span class="sr-only">Action</span></th></tr></thead>
      <tbody>${model.accommodations.map((stay, index) => `<tr>
        <td><strong>${escapeHTML(stay.destination)}</strong><small>${escapeHTML(itineraryDateLabel(stay.checkIn, true))} – ${escapeHTML(itineraryDateLabel(stay.checkOut, true))}</small></td>
        <td><input data-itinerary-change="service" data-kind="${kind}" data-index="${index}" data-field="name" value="${escapeHTML(stay.name)}" aria-label="Accommodation name" /></td>
        <td><input data-itinerary-change="service" data-kind="${kind}" data-index="${index}" data-field="roomCategory" value="${escapeHTML(stay.roomCategory)}" aria-label="Room category" /></td>
        <td><select data-itinerary-change="service" data-kind="${kind}" data-index="${index}" data-field="mealPlan" aria-label="Meal plan">${itineraryMealOptions(stay.mealPlan)}</select></td>
        <td><input type="number" min="1" data-itinerary-change="service" data-kind="${kind}" data-index="${index}" data-field="rooms" value="${stay.rooms}" aria-label="Rooms" /></td>
        <td><input type="number" min="1" data-itinerary-change="service" data-kind="${kind}" data-index="${index}" data-field="nights" value="${stay.nights}" aria-label="Nights" /></td>
        <td><button class="row-menu" type="button" data-itinerary-remove-service="${kind}" data-index="${index}" aria-label="Remove accommodation"><svg><use href="#i-x" /></svg></button></td>
      </tr>`).join('')}</tbody>
    </table></div>`;
  }
  const records = model[kind];
  const flight = kind === 'flights';
  return records.length ? `<div class="customer-pipeline-table-wrap"><table class="customer-pipeline-table itinerary-service-table">
    <thead><tr><th>Route / leg</th><th>${flight ? 'Airline / flight' : 'Vehicle'}</th><th>${flight ? 'Cabin' : 'Units'}</th><th><span class="sr-only">Action</span></th></tr></thead>
    <tbody>${records.map((record, index) => `<tr>
      <td><input data-itinerary-change="service" data-kind="${kind}" data-index="${index}" data-field="route" value="${escapeHTML(record.route)}" aria-label="Route" /></td>
      <td><input data-itinerary-change="service" data-kind="${kind}" data-index="${index}" data-field="${flight ? 'airline' : 'vehicle'}" value="${escapeHTML(flight ? record.airline : record.vehicle)}" aria-label="${flight ? 'Airline and flight' : 'Vehicle'}" /></td>
      <td><input ${flight ? '' : 'type="number" min="1"'} data-itinerary-change="service" data-kind="${kind}" data-index="${index}" data-field="${flight ? 'cabin' : 'units'}" value="${escapeHTML(flight ? record.cabin : String(record.units))}" aria-label="${flight ? 'Cabin' : 'Units'}" /></td>
      <td><button class="row-menu" type="button" data-itinerary-remove-service="${kind}" data-index="${index}" aria-label="Remove ${flight ? 'flight' : 'transport'}"><svg><use href="#i-x" /></svg></button></td>
    </tr>`).join('')}</tbody>
  </table></div>` : queryDetailEmpty(`No ${flight ? 'flights' : 'transport'} added`, `Add ${flight ? 'flight sectors' : 'route legs'} when they are part of this proposal.`);
}

function itineraryBuildMarkup(model) {
  return `<div class="itinerary-build-stack">
    <section class="query-detail-section itinerary-route-section"><header><div><h2>Trip route</h2><p>${escapeHTML(itineraryDateLabel(model.startDate))} – ${escapeHTML(itineraryDateLabel(model.endDate))}</p></div></header><div class="itinerary-route-body">${itineraryRouteMarkup(model)}</div></section>
    <section class="query-detail-section"><header><div><h2>Day-wise itinerary</h2><p>${model.mode === 'advanced' ? 'Advanced plan with meals and operations notes.' : 'Simple customer-ready plan with the essential trip details.'}</p></div><button class="button button-secondary button-small" type="button" data-itinerary-add-day><svg><use href="#i-plus" /></svg>Add day</button></header><div class="itinerary-days">${model.days.map((day, index) => itineraryDayMarkup(day, index, model.mode)).join('')}</div></section>
    <section class="query-detail-section"><header><div><h2>Accommodation</h2><p>${model.accommodations.length} ${model.accommodations.length === 1 ? 'stay' : 'stays'} carried into costing.</p></div><button class="button button-secondary button-small" type="button" data-itinerary-add-service="accommodations"><svg><use href="#i-plus" /></svg>Add accommodation</button></header>${itineraryServiceTableMarkup(model, 'accommodations')}</section>
    <section class="query-detail-section"><header><div><h2>Transportation</h2><p>${model.transport.length} route ${model.transport.length === 1 ? 'leg' : 'legs'}.</p></div><button class="button button-secondary button-small" type="button" data-itinerary-add-service="transport"><svg><use href="#i-plus" /></svg>Add transport</button></header>${itineraryServiceTableMarkup(model, 'transport')}</section>
    <section class="query-detail-section"><header><div><h2>Flights</h2><p>${model.flights.length} flight ${model.flights.length === 1 ? 'sector' : 'sectors'}.</p></div><button class="button button-secondary button-small" type="button" data-itinerary-add-service="flights"><svg><use href="#i-plus" /></svg>Add flight</button></header>${itineraryServiceTableMarkup(model, 'flights')}</section>
  </div>`;
}

function itineraryContentMarkup(model) {
  return `<section class="query-detail-section itinerary-content-section">
    <header><div><h2>Proposal content</h2><p>Prepare the customer-facing title, introduction and commercial notes.</p></div><span class="status-badge status-draft">Draft content</span></header>
    <div class="itinerary-content-form">
      <div class="field-grid">
        <label class="field"><span>Proposal title</span><input data-itinerary-change="content" data-field="title" value="${escapeHTML(model.content.title)}" /></label>
        <label class="field"><span>Prepared for</span><input data-itinerary-change="content" data-field="preparedFor" value="${escapeHTML(model.content.preparedFor || '')}" /></label>
      </div>
      <label class="field"><span>Booking from</span><input data-itinerary-change="content" data-field="bookingFrom" value="${escapeHTML(model.content.bookingFrom || model.origin)}" /></label>
      <label class="field"><span>Introduction</span><textarea rows="4" data-itinerary-change="content" data-field="introduction">${escapeHTML(model.content.introduction)}</textarea></label>
      <div class="field-grid">
        <label class="field"><span>Inclusions</span><textarea rows="7" data-itinerary-change="content" data-field="inclusions">${escapeHTML(model.content.inclusions)}</textarea></label>
        <label class="field"><span>Exclusions</span><textarea rows="7" data-itinerary-change="content" data-field="exclusions">${escapeHTML(model.content.exclusions)}</textarea></label>
      </div>
      <label class="field"><span>Important notes</span><textarea rows="3" data-itinerary-change="content" data-field="notes">${escapeHTML(model.content.notes)}</textarea></label>
    </div>
  </section>`;
}

function itineraryCostingMarkup(model) {
  const allRows = itineraryServiceRows(model);
  const rows = activeItineraryCostCategory === 'all' ? allRows : allRows.filter((row) => row.category === activeItineraryCostCategory);
  const summary = itineraryCostSummary(model);
  const categoryTabs = [
    ['all', 'All services'],
    ['accommodation', 'Accommodation'],
    ['activities', 'Activities'],
    ['transport', 'Transportation'],
    ['flights', 'Flights'],
  ];
  return `<div class="itinerary-costing-layout">
    <section class="query-detail-section itinerary-costing-sheet">
      <header><div><h2>Costing sheet</h2><p>Price each service independently, then apply the proposal margin.</p></div></header>
      <div class="itinerary-cost-tabs" role="tablist" aria-label="Cost categories">${categoryTabs.map(([key, label]) => `<button class="${key === activeItineraryCostCategory ? 'is-active' : ''}" type="button" role="tab" aria-selected="${key === activeItineraryCostCategory}" data-itinerary-cost-category="${key}">${label} <span>${key === 'all' ? allRows.length : allRows.filter((row) => row.category === key).length}</span></button>`).join('')}</div>
      <div class="customer-pipeline-table-wrap"><table class="customer-pipeline-table itinerary-cost-table">
        <thead><tr><th>Service</th><th>Category</th><th>Quantity</th><th>Unit cost</th><th>Total cost</th></tr></thead>
        <tbody>${rows.map((row) => `<tr><td><strong>${escapeHTML(row.title)}</strong><small>${escapeHTML(row.detail)}</small></td><td>${escapeHTML(row.category.charAt(0).toLocaleUpperCase() + row.category.slice(1))}</td><td>${row.quantity}</td><td><span class="itinerary-money-input">₹<input type="number" min="0" data-itinerary-change="cost" data-kind="${row.kind}" data-index="${row.index}" ${row.subindex === undefined ? '' : `data-subindex="${row.subindex}"`} value="${row.unitCost}" aria-label="Unit cost for ${escapeHTML(row.title)}" /></span></td><td class="pipeline-money">${formatCurrency(row.quantity * row.unitCost)}</td></tr>`).join('') || '<tr><td colspan="5">No services in this category.</td></tr>'}</tbody>
      </table></div>
    </section>
    <aside class="query-detail-section itinerary-price-summary" aria-label="Price summary">
      <header><div><h2>Price summary</h2><p>INR</p></div></header>
      <dl class="itinerary-category-totals">
        <div><dt>Accommodation</dt><dd>${formatCurrency(summary.categoryTotals.accommodation)}</dd></div>
        <div><dt>Activities</dt><dd>${formatCurrency(summary.categoryTotals.activities)}</dd></div>
        <div><dt>Transportation</dt><dd>${formatCurrency(summary.categoryTotals.transport)}</dd></div>
        <div><dt>Flights</dt><dd>${formatCurrency(summary.categoryTotals.flights)}</dd></div>
      </dl>
      <dl><div><dt>Base cost</dt><dd>${formatCurrency(summary.base)}</dd></div><div><dt>Margin</dt><dd>${formatCurrency(summary.margin)}</dd></div></dl>
      <label class="field"><span>Margin percentage</span><span class="itinerary-margin-input"><input type="number" min="0" max="100" data-itinerary-change="margin" value="${model.marginPercent}" />%</span></label>
      <div class="itinerary-client-price"><span>Client price</span><strong>${formatCurrency(summary.total)}</strong><small>Inclusive of margin</small></div>
    </aside>
  </div>`;
}

function itineraryPreviewMarkup(query, customer, proposal, model) {
  const summary = itineraryCostSummary(model);
  const contentList = (value) => String(value || '').split('\n').filter(Boolean).map((item) => `<li>${escapeHTML(item)}</li>`).join('');
  return `<div class="itinerary-preview-layout">
    <article class="query-detail-section itinerary-preview">
      <header class="itinerary-preview-cover"><div><span class="overline">Prepared for ${escapeHTML(model.content.preparedFor || customer.name)}</span><h2>${escapeHTML(model.content.title)}</h2><p>${escapeHTML(model.content.bookingFrom || model.origin)} → ${escapeHTML(model.stops.map((stop) => stop.city).join(' → '))}</p></div><span class="status-badge ${pipelineStatusClass(proposal.status)}">${escapeHTML(proposal.status)}</span></header>
      <div class="itinerary-preview-body">
        <p class="itinerary-preview-intro">${escapeHTML(model.content.introduction)}</p>
        ${itineraryRouteMarkup(model)}
        <section><h3>Day-wise plan</h3><ol class="itinerary-preview-days">${model.days.map((day, index) => `<li><span>${index + 1}</span><div><small>${escapeHTML(itineraryDateLabel(day.date))} · ${escapeHTML(day.time || 'Time pending')}</small><strong>${escapeHTML(day.city)}</strong><p>${escapeHTML(day.description)}</p><div class="itinerary-preview-logistics"><span>Travel · ${escapeHTML(day.travel || 'Pending')}</span><span>Stay · ${escapeHTML(day.hotelCheckIn || 'Pending')}</span>${model.mode === 'advanced' && day.meals ? `<span>Meals · ${escapeHTML(day.meals)}</span>` : ''}</div>${day.activities.length ? `<ul>${day.activities.map((activity) => `<li>${escapeHTML(activity.name)}${activity.details ? ` · ${escapeHTML(activity.details)}` : ''}</li>`).join('')}</ul>` : ''}</div></li>`).join('')}</ol></section>
        <section><h3>Accommodation</h3><div class="itinerary-preview-stays">${model.accommodations.map((stay) => `<div><strong>${escapeHTML(stay.name)}</strong><span>${escapeHTML(stay.destination)} · ${stay.nights} nights · ${stay.rooms} ${stay.rooms === 1 ? 'room' : 'rooms'} · ${escapeHTML(stay.mealPlan)}</span></div>`).join('')}</div></section>
        <section class="itinerary-preview-commercials"><div><h3>Inclusions</h3><ul>${contentList(model.content.inclusions)}</ul></div><div><h3>Exclusions</h3><ul>${contentList(model.content.exclusions)}</ul></div></section>
        <section><h3>Important notes</h3><p>${escapeHTML(model.content.notes)}</p></section>
      </div>
    </article>
    <aside class="query-detail-section itinerary-review-panel"><header><div><h2>Review checklist</h2><p>Customer-facing proposal</p></div></header><dl>
      <div><dt>Customer</dt><dd>${escapeHTML(customer.name)}</dd></div>
      <div><dt>Mode</dt><dd>${escapeHTML(model.mode === 'advanced' ? 'Advanced itinerary' : 'Simple itinerary')}</dd></div>
      <div><dt>Duration</dt><dd>${model.days.length} days</dd></div>
      <div><dt>Services</dt><dd>${itineraryServiceRows(model).length}</dd></div>
      <div><dt>Client price</dt><dd>${formatCurrency(summary.total)}</dd></div>
    </dl>
      ${proposal.shareUrl ? `<div class="itinerary-share-link"><small>Customer link</small><a href="${escapeHTML(proposal.shareUrl)}" target="_blank" rel="noreferrer">${escapeHTML(proposal.shareUrl)}</a></div>` : ''}
      <button class="button button-primary" type="button" data-itinerary-publish><svg><use href="#i-check" /></svg>${proposal.status === 'Published' ? 'Publish changes' : 'Publish proposal'}</button>
      ${proposal.status === 'Published' || proposal.status === 'Sent' ? '<button class="button button-secondary" type="button" data-itinerary-share><svg><use href="#i-mail" /></svg>Share in Communication</button>' : ''}
    </aside>
  </div>`;
}

function queryItineraryMarkup(query, customer) {
  const proposal = activeItineraryProposal(query);
  if (!proposal) return queryDetailEmpty('Proposal unavailable', 'Return to the proposal list and choose another record.');
  const model = ensureItineraryModel(query, proposal);
  const stepIndex = ITINERARY_STEPS.indexOf(activeItineraryStep);
  const body = activeItineraryStep === 'content'
    ? itineraryContentMarkup(model)
    : activeItineraryStep === 'costing'
      ? itineraryCostingMarkup(model)
      : activeItineraryStep === 'preview'
        ? itineraryPreviewMarkup(query, customer, proposal, model)
        : itineraryBuildMarkup(model);
  return `<div class="itinerary-builder">
    <header class="itinerary-builder-header">
      <button class="button button-tertiary button-small itinerary-builder-back" type="button" data-proposal-workspace="list"><svg><use href="#i-chevron-left" /></svg>All proposals</button>
      <div><span class="overline">${model.mode === 'advanced' ? 'Advanced itinerary' : 'Simple itinerary'}</span><h2>${escapeHTML(proposal.title)}</h2><p>${escapeHTML(model.origin)} → ${escapeHTML(model.stops.map((stop) => stop.city).join(' → '))} · ${model.travellers} travellers</p></div>
      <div class="itinerary-builder-heading-actions"><div class="proposal-mode-switch" role="group" aria-label="Itinerary mode"><button class="${model.mode === 'simple' ? 'is-active' : ''}" type="button" data-itinerary-mode="simple">Simple</button><button class="${model.mode === 'advanced' ? 'is-active' : ''}" type="button" data-itinerary-mode="advanced">Advanced</button></div><span class="status-badge ${pipelineStatusClass(proposal.status)}">${escapeHTML(proposal.status)}</span></div>
    </header>
    <nav class="itinerary-stepper" aria-label="Proposal workflow">${ITINERARY_STEPS.map((step, index) => `<button class="${step === activeItineraryStep ? 'is-active' : ''}${index < stepIndex ? ' is-complete' : ''}" type="button" data-itinerary-step="${step}" aria-current="${step === activeItineraryStep ? 'step' : 'false'}"><span>${index < stepIndex ? '<svg><use href="#i-check" /></svg>' : index + 1}</span>${['Build itinerary', 'Proposal content', 'Costing', 'Preview'][index]}</button>`).join('')}</nav>
    ${body}
    <footer class="itinerary-builder-actions">
      <button class="button button-secondary" type="button" data-itinerary-previous ${stepIndex === 0 ? 'disabled' : ''}><svg><use href="#i-chevron-left" /></svg>Previous</button>
      ${stepIndex < ITINERARY_STEPS.length - 1 ? `<button class="button button-primary" type="button" data-itinerary-next>Continue to ${['proposal content', 'costing', 'preview'][stepIndex]}<svg><use href="#i-chevron-right" /></svg></button>` : ''}
    </footer>
  </div>`;
}

function proposalCatalogMarkup() {
  const search = proposalSearchTerm.trim().toLocaleLowerCase();
  const records = proposalCatalogRecords.filter((item) => item.type === proposalCatalogType
    && (!search || [item.title, item.destination, item.origin, item.scope].some((value) => String(value).toLocaleLowerCase().includes(search))));
  return `<div class="proposal-catalog">
    <div class="proposal-catalog-toolbar"><label class="search-field"><svg><use href="#i-search" /></svg><input id="proposalCatalogSearch" type="search" value="${escapeHTML(proposalSearchTerm)}" placeholder="Search ${proposalCatalogType === 'package' ? 'packages' : 'saved itineraries'}" /></label><span>${records.length} available</span></div>
    <div class="proposal-catalog-grid">${records.map((item) => `<button class="proposal-catalog-card${pendingProposalSourceId === item.id ? ' is-selected' : ''}" type="button" data-proposal-catalog-id="${escapeHTML(item.id)}" aria-pressed="${pendingProposalSourceId === item.id}">
      <span class="proposal-catalog-card-top"><span class="status-badge ${item.scope === 'International' ? 'status-sent' : 'status-valid'}">${escapeHTML(item.scope)}</span><strong>${item.days}D / ${Math.max(1, item.days - 1)}N</strong></span>
      <b>${escapeHTML(item.title)}</b><small>${escapeHTML(item.origin)} → ${escapeHTML(item.stops.map((stop) => stop.city).join(' → '))}</small><p>${escapeHTML(item.summary)}</p>
      <span class="proposal-catalog-price">${item.amount ? `From ${formatCurrency(item.amount)}` : 'Reusable itinerary'}</span>
    </button>`).join('') || queryDetailEmpty('No matches', 'Try another destination or route.')}</div>
  </div>`;
}

function proposalCreatorMarkup(query, customer) {
  const selectedSource = proposalCatalogRecords.find((item) => item.id === pendingProposalSourceId);
  const sourceLabel = proposalCatalogType === 'package' ? 'Package' : proposalCatalogType === 'itinerary' ? 'Saved itinerary' : 'From scratch';
  return `<form class="query-proposal-creator" id="queryProposalCreator">
    <header><div><span class="overline">New proposal</span><h2>Build for ${escapeHTML(customer.name)}</h2><p>Choose a starting point, then select the itinerary detail level.</p></div><button class="button button-tertiary button-small" type="button" data-proposal-workspace="list"><svg><use href="#i-x" /></svg>Cancel</button></header>
    <section class="proposal-creator-section"><div class="proposal-creator-section-heading"><span>1</span><div><h3>Choose a starting point</h3><p>Use a package, reuse an itinerary, or begin with a blank route.</p></div></div>
      <div class="proposal-source-grid">
        <button class="${proposalCatalogType === 'package' ? 'is-selected' : ''}" type="button" data-proposal-source="package"><svg><use href="#i-package" /></svg><strong>Select package</strong><small>Start with packaged stays, transport and route</small></button>
        <button class="${proposalCatalogType === 'itinerary' ? 'is-selected' : ''}" type="button" data-proposal-source="itinerary"><svg><use href="#i-file" /></svg><strong>Choose itinerary</strong><small>Reuse a day-wise plan from the itinerary library</small></button>
        <button class="${proposalCatalogType === 'scratch' ? 'is-selected' : ''}" type="button" data-proposal-source="scratch"><svg><use href="#i-plus" /></svg><strong>Build from scratch</strong><small>Use trip-query dates, destination and travellers</small></button>
      </div>
      ${proposalCatalogType === 'scratch' ? '<div class="proposal-scratch-note"><svg><use href="#i-check" /></svg><span><strong>Trip details will be used</strong><small>Dates, destination, travellers and route from the query remain editable.</small></span></div>' : proposalCatalogMarkup()}
    </section>
    <section class="proposal-creator-section"><div class="proposal-creator-section-heading"><span>2</span><div><h3>Proposal setup</h3><p>Name the proposal and choose how much operational detail to capture.</p></div></div>
      <div class="field-grid"><label class="field"><span>Proposal title</span><input name="proposalTitle" required value="${escapeHTML(selectedSource?.title || `${query.title} proposal`)}" /></label><label class="field"><span>Starting point</span><input value="${escapeHTML(selectedSource?.title || sourceLabel)}" readonly /></label></div>
      <fieldset class="proposal-mode-options"><legend>Itinerary mode</legend>
        <label><input type="radio" name="itineraryMode" value="simple" checked /><span><strong>Simple itinerary</strong><small>Day, time, destination, description, travel, stay and activities.</small></span></label>
        <label><input type="radio" name="itineraryMode" value="advanced" /><span><strong>Advanced itinerary</strong><small>Add meal plans and internal operations notes for every day.</small></span></label>
      </fieldset>
    </section>
    <footer><span>${selectedSource ? `Selected · ${escapeHTML(selectedSource.id)}` : proposalCatalogType === 'scratch' ? 'Blank itinerary selected' : 'Select one item to continue'}</span><button class="button button-primary" type="submit" ${!selectedSource && proposalCatalogType !== 'scratch' ? 'disabled' : ''}><svg><use href="#i-chevron-right" /></svg>Create & build proposal</button></footer>
  </form>`;
}

function queryDetailProposalsMarkup(query, customer) {
  if (query.type === 'Trip' && proposalWorkspaceView === 'builder') return queryItineraryMarkup(query, customer);
  if (query.type === 'Trip' && proposalWorkspaceView === 'create') return proposalCreatorMarkup(query, customer);
  const proposals = queryDetailProposals(query);
  return `<section class="query-detail-section query-proposals-workspace">
    <header><div><h2>Proposals</h2><p>${proposals.length ? `${proposals.length} linked ${proposals.length === 1 ? 'proposal' : 'proposals'}.` : 'Build the first customer-ready proposal from this trip query.'}</p></div>${query.type === 'Trip' ? '<div class="query-proposal-actions"><button class="button button-secondary button-small" type="button" data-proposal-action="send-package"><svg><use href="#i-package" /></svg>Send a package</button><button class="button button-primary button-small" type="button" data-proposal-action="build-itinerary"><svg><use href="#i-plus" /></svg>Build itinerary</button></div>' : '<button class="button button-primary button-small" type="button" data-query-detail-action="build-proposal"><svg><use href="#i-plus" /></svg>Build proposal</button>'}</header>
    ${proposals.length ? `<div class="customer-pipeline-table-wrap"><table class="customer-pipeline-table customer-proposal-table"><thead><tr><th>Proposal and source</th><th>Mode</th><th>Created</th><th>Status</th><th>Amount</th>${query.type === 'Trip' ? '<th class="col-action">Action</th>' : ''}</tr></thead>
      <tbody>${proposals.map((proposal) => `<tr><td><strong>${escapeHTML(proposal.title)}</strong><small>${escapeHTML(proposal.id)} · ${escapeHTML(proposal.package)}</small></td><td>${escapeHTML(proposal.itineraryMode === 'advanced' ? 'Advanced' : 'Simple')}</td><td>${escapeHTML(pipelineDateLabel(proposal.sentAt))}</td><td><span class="status-badge ${pipelineStatusClass(proposal.status)}">${escapeHTML(proposal.status)}</span></td><td class="pipeline-money">${formatCurrency(proposal.amount)}</td>${query.type === 'Trip' ? `<td><button class="button button-secondary button-small" type="button" data-itinerary-open="${escapeHTML(proposal.id)}">Open proposal</button></td>` : ''}</tr>`).join('')}</tbody>
    </table></div>` : queryDetailEmpty('No proposals yet', 'Use a package, choose a saved itinerary or build from scratch.')}
  </section>`;
}

function queryDetailDocumentsMarkup(query, customer) {
  const documents = vaultDocumentRecords(customer);
  return `<section class="query-detail-section"><header><div><h2>Documents</h2><p>${documents.length} ${documents.length === 1 ? 'document' : 'documents'} linked from ${escapeHTML(customer.name)}.</p></div><button class="button button-tertiary button-small" type="button" data-query-detail-action="documents">Open document vault</button></header>
    ${documents.length ? `<div class="query-document-list">${documents.map((documentItem) => {
    const expiry = documentItem.expiry ?? (/^\d{4}-\d{2}-\d{2}$/.test(documentItem.expiryDate ?? '') ? customerDateLabel(documentItem.expiryDate) : documentItem.expiryDate) ?? 'No expiry';
    const meta = [documentItem.traveller, documentItem.type, expiry].filter(Boolean).join(' · ');
    const status = documentStatus(documentItem);
    return `<article class="query-document-row"><span class="query-document-icon"><svg><use href="#i-file" /></svg></span><div><strong>${escapeHTML(documentItem.name)}</strong><small>${escapeHTML(meta)}</small></div><span class="status-badge ${documentStatusClass(status)}">${escapeHTML(status)}</span></article>`;
  }).join('')}</div>` : queryDetailEmpty('No documents yet', 'Documents uploaded for this customer appear here.')}</section>`;
}

function queryDetailTravellersMarkup(query, customer) {
  const profiles = ensureTravellerProfiles(customer, customerContactDetails(customer));
  return `<div class="query-detail-stack">
    <section class="query-detail-section"><header><div><h2>Travellers</h2><p>${profiles.length} ${profiles.length === 1 ? 'traveller' : 'travellers'} linked from ${escapeHTML(customer.name)}.</p></div><button class="button button-tertiary button-small" type="button" data-query-detail-action="view-customer">Manage in customer</button></header>
      <div class="customer-pipeline-table-wrap"><table class="customer-pipeline-table"><thead><tr><th>Traveller</th><th>Role</th><th>Gender</th><th>Date of birth</th><th>Documents</th></tr></thead><tbody>
        ${profiles.map((profile) => { const summary = travellerDocumentSummary(customer, profile); return `<tr><td><strong>${escapeHTML(profile.name)}</strong><small>${escapeHTML(profile.id)}</small></td><td>${profile.primary ? '<span class="status-badge status-valid">Primary</span>' : 'Traveller'}</td><td>${escapeHTML(profile.gender || 'Not added')}</td><td>${escapeHTML(formatTravellerDate(profile.dateOfBirth))}</td><td>${summary.uploaded} uploaded · ${summary.missing} missing</td></tr>`; }).join('')}
      </tbody></table></div>
    </section>
  </div>`;
}

function queryDetailTasksMarkup(query) {
  return `<section class="query-detail-section query-tasks-section">
    <div class="profile-tasks-toolbar query-tasks-toolbar" role="search" aria-label="Query tasks">
      <div class="filter-anchor task-filter-anchor">
        <label class="search-field profile-tasks-search" for="queryTaskSearch">
          <svg aria-hidden="true"><use href="#i-search" /></svg>
          <input id="queryTaskSearch" type="search" placeholder="Search" autocomplete="off" aria-label="Search query tasks" value="${escapeHTML(queryTaskSearchQuery)}" />
        </label>
        <button class="search-filter" id="queryTaskFilterButton" type="button" aria-label="Filter query tasks" aria-controls="queryTaskFilterPopover" aria-expanded="false"><svg aria-hidden="true"><use href="#i-sliders" /></svg><span class="filter-button-label">Filters</span></button>
        <section class="filter-popover task-filter-popover" id="queryTaskFilterPopover" aria-labelledby="queryTaskFilterTitle" hidden>
          <h2 id="queryTaskFilterTitle">Select Filters</h2>
          <div class="task-filter-fields">
            <label class="field"><span>Priority</span><select id="queryTaskPriorityFilter"><option value="all">All priorities</option><option>High</option><option>Medium</option><option>Low</option></select></label>
            <label class="field"><span>Related entity</span><select id="queryTaskEntityFilter"><option value="all">All entities</option></select></label>
            <label class="field"><span>Assignee</span><select id="queryTaskAssigneeFilter"><option value="all">All assignees</option></select></label>
            <label class="field"><span>Order</span><select id="queryTaskSort"><option value="created-desc">Created: newest</option><option value="created-asc">Created: oldest</option><option value="due-asc">Due: soonest</option><option value="due-desc">Due: latest</option><option value="priority-desc">Priority: highest</option><option value="priority-asc">Priority: lowest</option></select></label>
            <div class="field-grid task-filter-date-grid">
              <label class="field"><span>Due from</span><input id="queryTaskDateFrom" type="date" /></label>
              <label class="field"><span>Due to</span><input id="queryTaskDateTo" type="date" /></label>
            </div>
          </div>
          <footer class="filter-actions"><button class="button button-secondary" id="clearQueryTaskFilters" type="button">Clear</button><button class="button button-primary" id="applyQueryTaskFilters" type="button" disabled>Apply</button></footer>
        </section>
      </div>
      <button class="button button-primary" id="newQueryTaskButton" type="button"><svg><use href="#i-plus" /></svg>Add task</button>
    </div>
    <div class="profile-tasks-table-wrap">
      <div class="profile-tasks-scroller">
        <table class="profile-tasks-table">
          <thead><tr><th scope="col">Task name</th><th scope="col">Priority</th><th scope="col">Related entity</th><th scope="col">Assignee</th><th scope="col">Due</th><th scope="col"><span class="sr-only">Actions</span></th></tr></thead>
          <tbody id="queryTaskRows"></tbody>
        </table>
      </div>
      <footer class="pagination" id="queryTaskPagination" aria-label="Query tasks pagination"></footer>
    </div>
  </section>`;
}

function queryDetailCommunicationMarkup(customer) {
  return `<section class="query-detail-section query-communication-section" aria-label="Query email communication">
    <article class="customer-mail-shell" data-query-mail-shell aria-label="Customer email conversation">
      <header class="customer-mail-header">
        <div class="customer-mail-identity">
          <button class="customer-mail-sidebar-toggle" data-query-mail-sidebar-toggle type="button" aria-label="Collapse mailboxes" aria-expanded="true"><svg><use href="#i-menu" /></svg></button>
          <span class="customer-mail-header-avatar" data-query-mail-avatar>${escapeHTML(initials(customer.name))}</span>
          <div class="query-mail-heading"><h2 data-query-mail-title>${escapeHTML(customer.name)}</h2><p class="query-mail-subtitle">Continue existing customer conversations without losing query context.</p></div>
        </div>
        <button class="button button-primary button-small" data-query-mail-compose type="button"><svg><use href="#i-plus" /></svg>Compose email</button>
      </header>
      <div class="customer-mail-layout">
        <aside class="customer-mail-sidebar" aria-label="Email navigation">
          <div class="customer-mail-filters" role="tablist" aria-label="Email views">
            <button class="is-active" type="button" role="tab" aria-selected="true" data-query-mail-filter="all" title="All mail"><svg><use href="#i-mail" /></svg><span>All mail</span><b data-query-mail-all-count>0</b></button>
            <button type="button" role="tab" aria-selected="false" data-query-mail-filter="inbox" title="Inbox"><svg><use href="#i-inbox" /></svg><span>Inbox</span><b data-query-mail-inbox-count>0</b></button>
            <button type="button" role="tab" aria-selected="false" data-query-mail-filter="sent" title="Sent"><svg><use href="#i-check" /></svg><span>Sent</span><b data-query-mail-sent-count>0</b></button>
          </div>
        </aside>
        <div class="customer-mail-main">
          <section class="customer-mail-list-view" data-query-mail-list-view aria-label="Email list">
            <header class="customer-mail-thread-heading">
              <div><h3 data-query-mail-thread-title>All mail</h3><p data-query-mail-thread-summary></p></div>
              <span class="customer-mail-address" data-query-mail-address></span>
            </header>
            <div class="customer-mail-thread" data-query-mail-thread role="list" aria-live="polite"></div>
          </section>
          <article class="customer-mail-reader" data-query-mail-reader tabindex="-1" aria-label="Email reader" hidden>
            <header>
              <button class="button button-secondary button-small button-icon" data-query-mail-reader-back type="button" aria-label="Back to mail"><svg><use href="#i-chevron-left" /></svg></button>
              <div><span class="customer-mail-reader-direction" data-query-mail-reader-direction></span><h3 data-query-mail-reader-subject></h3></div>
              <time data-query-mail-reader-time></time>
            </header>
            <div class="customer-mail-reader-meta">
              <span class="customer-mail-reader-avatar" data-query-mail-reader-avatar></span>
              <div><strong data-query-mail-reader-sender></strong><span data-query-mail-reader-route></span></div>
            </div>
            <div class="customer-mail-reader-body" data-query-mail-reader-body></div>
            <div class="customer-mail-reader-attachments" data-query-mail-reader-attachments hidden></div>
          </article>
          <form class="customer-mail-composer" data-query-mail-composer aria-label="Compose email" hidden>
            <div class="customer-mail-compose-fields">
              <label><span>To</span><input data-query-mail-to name="to" type="email" readonly /></label>
              <label><span>Subject</span><input data-query-mail-subject name="subject" type="text" placeholder="Add a subject" required /></label>
              <label class="customer-mail-message-field"><span>Message</span><textarea data-query-mail-body name="body" rows="10" placeholder="Write your email…" required></textarea></label>
            </div>
            <div class="customer-mail-composer-attachments" data-query-mail-composer-attachments hidden></div>
            <footer>
              <div class="customer-mail-compose-tools">
                <input class="sr-only" data-query-mail-attachment-input type="file" multiple />
                <button class="button button-secondary button-small" data-query-mail-upload type="button"><svg><use href="#i-file" /></svg>Upload</button>
                <div class="customer-mail-template-anchor">
                  <button class="button button-secondary button-small" data-query-mail-template-button type="button" aria-haspopup="menu" aria-expanded="false"><svg><use href="#i-message" /></svg>Template</button>
                  <div class="customer-mail-template-menu" data-query-mail-template-menu role="menu" hidden>
                    <button type="button" role="menuitem" data-query-mail-template="documents"><strong>Request documents</strong><small>Ask for missing travel files</small></button>
                    <button type="button" role="menuitem" data-query-mail-template="acceptance"><strong>Request acceptance</strong><small>Ask the customer to approve a proposal</small></button>
                    <button type="button" role="menuitem" data-query-mail-template="letter"><strong>Request supporting letter</strong><small>Ask for an employer or sponsor letter</small></button>
                  </div>
                </div>
              </div>
              <div class="customer-mail-compose-actions">
                <button class="button button-secondary button-small" data-query-mail-discard type="button">Discard</button>
                <button class="button button-primary button-small" data-query-mail-send type="submit" disabled>Send</button>
              </div>
            </footer>
          </form>
        </div>
      </div>
    </article>
  </section>`;
}

function queryDetailActivityMarkup(query) {
  return `<article class="query-detail-panel"><header><div><span class="overline">Activity</span><h2>Query timeline</h2></div></header><ol class="activity-list">
    <li><time>${escapeHTML(query.activity)}</time><span class="activity-dot"></span><p><strong>Query updated</strong><small>${escapeHTML(query.title)}</small></p></li>
    <li><time>Current</time><span class="activity-dot is-positive"></span><p><strong>Status · ${escapeHTML(query.status)}</strong><small>Owned by ${escapeHTML(assigneeDisplayNames(queryOwnerList(query)))}</small></p></li>
  </ol></article>`;
}

function queryDetailPanelMarkup(query, customer) {
  if (activeQueryDetailTab === 'proposals') return queryDetailProposalsMarkup(query, customer);
  if (activeQueryDetailTab === 'travellers') return queryDetailTravellersMarkup(query, customer);
  if (activeQueryDetailTab === 'documents') return queryDetailDocumentsMarkup(query, customer);
  if (activeQueryDetailTab === 'tasks') return queryDetailTasksMarkup(query);
  if (activeQueryDetailTab === 'communication') return queryDetailCommunicationMarkup(customer);
  return queryDetailOverviewMarkup(query, customer);
}

function renderQueryDetail() {
  const query = selectedQuery;
  const customer = queryDetailCustomer(query);
  if (!query || !customer) {
    queryDetailContent.innerHTML = queryDetailEmpty('Query unavailable', 'Return to queries and choose another record.');
    return;
  }
  ensureCustomerDetailData(customer);
  const proposals = queryDetailProposals(query);
  const tasks = queryDetailTasks(query);
  const travellers = ensureTravellerProfiles(customer, customerContactDetails(customer));
  const documents = vaultDocumentRecords(customer);
  const emailCount = customerEmailMessageCount(customer);
  const statusOptions = QUERY_KANBAN_STATUSES.map((status) => `<option${status === query.status ? ' selected' : ''}>${escapeHTML(status)}</option>`).join('');
  const tabs = [
    ['overview', 'Overview', ''],
    ['proposals', 'Proposals', proposals.length],
    ['travellers', 'Travellers', travellers.length],
    ['documents', 'Documents', documents.length],
    ['tasks', 'Tasks', tasks.length],
    ['communication', 'Communication', emailCount],
  ];
  if (!query || query.id !== lastQueryTasksQueryId) {
    resetQueryTaskState();
    lastQueryTasksQueryId = query?.id ?? '';
  }
  queryDetailContent.innerHTML = `<header class="query-detail-header">
    <div class="query-detail-heading"><span class="query-detail-icon"><img src="${QUERY_ICON_ASSETS[query.type]}" alt="" /></span><div><h1 id="queryDetailTitle" title="${escapeHTML(query.title)}">${escapeHTML(query.title)}</h1><p>${escapeHTML(query.type)} <i>•</i> ${escapeHTML(customer.name)} ${escapeHTML(customer.id)} <i>•</i> <b>${escapeHTML(query.id)}</b></p></div></div>
    <div class="query-detail-actions"><label class="query-detail-status"><span class="sr-only">Query status</span><select id="queryDetailStatus">${statusOptions}</select></label><button class="button button-primary" type="button" data-query-detail-action="build-proposal"><svg><use href="#i-file" /></svg>Build proposal</button><button class="query-detail-icon-button${query.favorite ? ' is-active' : ''}" type="button" data-query-detail-action="favorite" aria-label="${query.favorite ? 'Remove query from favorites' : 'Add query to favorites'}" aria-pressed="${Boolean(query.favorite)}"><svg><use href="#i-star" /></svg></button><div class="query-detail-menu-wrap"><button class="query-detail-icon-button" type="button" data-query-detail-action="menu" aria-label="More query actions" aria-expanded="false"><svg><use href="#i-more" /></svg></button><div class="customer-action-menu query-detail-menu" id="queryDetailMenu" role="menu" hidden><button type="button" role="menuitem" data-query-menu-action="customer"><svg><use href="#i-users" /></svg><span>View customer</span></button><button type="button" role="menuitem" data-query-menu-action="task"><svg><use href="#i-tasks" /></svg><span>Add task</span></button><button type="button" role="menuitem" data-query-menu-action="lost"><svg><use href="#i-x" /></svg><span>Mark as lost</span></button><button type="button" role="menuitem" data-query-menu-action="edit-query"><svg><use href="#i-edit" /></svg><span>Edit query</span></button><button class="is-danger" type="button" role="menuitem" data-query-menu-action="delete-customer"><svg><use href="#i-trash" /></svg><span>Delete customer</span></button></div></div></div>
  </header>
  <div class="query-detail-tabs" role="tablist" aria-label="Query detail sections">${tabs.map(([key, label, count]) => `<button class="${key === activeQueryDetailTab ? 'is-active' : ''}" type="button" role="tab" aria-selected="${key === activeQueryDetailTab}" data-query-detail-tab="${key}">${label}${count !== '' ? ` <span>${count}</span>` : ''}</button>`).join('')}</div>
  <div class="query-detail-tab-panel" id="queryDetailTabPanel">${queryDetailPanelMarkup(query, customer)}</div>`;
  if (activeQueryDetailTab === 'tasks') renderQueryTasks(query);
  if (activeQueryDetailTab === 'communication') renderQueryMailWorkspace();
}

function openQueryDetail(query, updateHistory = true) {
  if (!query) return;
  selectedQuery = query;
  activeQueryCategory = query.type;
  activeQueryDetailTab = 'overview';
  proposalWorkspaceView = 'list';
  pendingProposalSourceId = null;
  proposalSearchTerm = '';
  queryMailFilter = 'all';
  selectedQueryMailIndex = null;
  queryMailAttachments = [];
  setView('query-detail', queryDetailCustomer(query) ?? selectedCustomer, updateHistory);
}

function buildQueryProposal(query = selectedQuery) {
  if (query.type === 'Trip') {
    activeQueryDetailTab = 'proposals';
    proposalWorkspaceView = 'create';
    proposalCatalogType = 'package';
    pendingProposalSourceId = null;
    proposalSearchTerm = '';
    renderQueryDetail();
    return;
  }
  let proposal = queryDetailProposals(query)[0];
  if (!proposal) {
    proposal = {
      id: `PROP-${Date.now().toString(36).slice(-6).toUpperCase()}`,
      customerId: query.customerId,
      title: `${query.title} proposal`,
      package: query.summary || query.type,
      linkedQuery: query.id,
      status: 'Draft',
      amount: Number(query.value || 0),
      sentAt: taskDateOffset(0),
      validUntil: taskDateOffset(7),
    };
    customerProposalRecords.unshift(proposal);
    showToast('Draft proposal created');
  }
  activeQueryDetailTab = 'proposals';
  renderQueryDetail();
}

function taskCategoryPool(view = activeTaskView) {
  const today = taskDateOffset(0);
  if (view === 'inbox') return taskRecords.filter((task) => taskAssigneeMatches(task, TASK_CURRENT_USER));
  if (view === 'overdue') return taskRecords.filter((task) => task.dueDate && task.dueDate < today && !['Done', 'Cancelled'].includes(task.status));
  if (view === 'completed') return taskRecords.filter((task) => ['Done', 'Cancelled'].includes(task.status));
  if (view === 'followups') return taskRecords.filter((task) => task.followUp);
  return [...taskRecords];
}

function filteredTaskRecords() {
  const query = tasksSearch.value.trim().toLocaleLowerCase();
  const priorityWeight = { High: 3, Medium: 2, Low: 1 };
  const filtered = taskCategoryPool().filter((task) => {
    const matchesSearch = !query || [task.title, task.description, task.entity, task.entityType, ...taskAssigneeList(task)]
      .some((value) => String(value || '').toLocaleLowerCase().includes(query));
    const matchesPriority = taskFilters.priority === 'all' || task.priority === taskFilters.priority;
    const matchesEntity = taskFilters.entity === 'all' || task.entityType === taskFilters.entity;
    const matchesAssignee = taskFilters.assignee === 'all' || taskAssigneeMatches(task, taskFilters.assignee);
    const matchesFrom = !taskFilters.from || (task.dueDate && task.dueDate >= taskFilters.from);
    const matchesTo = !taskFilters.to || (task.dueDate && task.dueDate <= taskFilters.to);
    return matchesSearch && matchesPriority && matchesEntity && matchesAssignee && matchesFrom && matchesTo;
  });
  return filtered.sort((left, right) => {
    if (taskFilters.sort === 'created-asc') return left.createdAt.localeCompare(right.createdAt);
    if (taskFilters.sort === 'due-asc') return (left.dueDate || '9999-12-31').localeCompare(right.dueDate || '9999-12-31');
    if (taskFilters.sort === 'due-desc') return (right.dueDate || '').localeCompare(left.dueDate || '');
    if (taskFilters.sort === 'priority-desc') return priorityWeight[right.priority] - priorityWeight[left.priority] || right.createdAt.localeCompare(left.createdAt);
    if (taskFilters.sort === 'priority-asc') return priorityWeight[left.priority] - priorityWeight[right.priority] || right.createdAt.localeCompare(left.createdAt);
    return right.createdAt.localeCompare(left.createdAt);
  });
}

function taskDuePresentation(task) {
  if (task.status === 'Done') return { label: 'Completed', className: 'is-complete' };
  if (task.status === 'Cancelled') return { label: 'Cancelled', className: 'is-overdue' };
  if (!task.dueDate) return { label: task.delay || 'No due date', className: '' };
  const today = new Date(`${taskDateOffset(0)}T12:00:00`);
  const due = new Date(`${task.dueDate}T12:00:00`);
  const days = Math.round((due - today) / 86400000);
  if (days < 0) return { label: `Overdue ${Math.abs(days)}d`, className: 'is-overdue' };
  if (days === 0) return { label: 'Due today', className: 'is-overdue' };
  if (days === 1) return { label: task.delay || 'Due tomorrow', className: '' };
  return { label: task.delay || `Due in ${days}d`, className: '' };
}

function taskCreatedLabel(task) {
  const elapsed = Math.max(0, Date.now() - new Date(task.createdAt).getTime());
  const hours = Math.floor(elapsed / 3600000);
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function taskCardMarkup(task) {
  const due = taskDuePresentation(task);
  const cardState = task.status === 'Done' ? ' is-complete' : task.status === 'Cancelled' ? ' is-cancelled' : '';
  const tier = task.tier || 'Silver';
  const tierClass = tier.toLocaleLowerCase().replace(/[^a-z0-9]+/g, '-');
  const avatar = taskAssigneeAvatar(task);
  return `<article class="query-card task-card${cardState}" draggable="true" tabindex="0" data-task-id="${escapeHTML(task.id)}" aria-label="View ${escapeHTML(task.title)}">
    <div class="query-card-top">
      <span class="query-priority query-priority-${task.priority.toLocaleLowerCase()}">${escapeHTML(task.priority)}</span>
      <span class="query-tier query-tier-${escapeHTML(tierClass)}"><i aria-hidden="true"></i>${escapeHTML(tier)}</span>
    </div>
    <span class="query-card-drag" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></span>
    <h3 class="query-card-title">${escapeHTML(task.title)}</h3>
    <p class="query-card-customer">${escapeHTML(task.entity)} <b>(${escapeHTML(task.entityType)})</b></p>
    <footer class="query-card-footer">
      <span class="query-delay task-due ${due.className}"><svg><use href="#i-clock" /></svg>${escapeHTML(due.label)}</span>
      <time class="query-activity">${escapeHTML(taskCreatedLabel(task))}</time>
      <span class="query-avatar" title="${escapeHTML(assigneeDisplayNames(taskAssigneeList(task)))}" aria-label="Assigned to ${escapeHTML(assigneeDisplayNames(taskAssigneeList(task)))}">${escapeHTML(avatar)}</span>
    </footer>
  </article>`;
}

function taskListRowMarkup(task) {
  const due = taskDuePresentation(task);
  const avatar = taskAssigneeAvatar(task);
  const assignee = assigneeDisplayNames(taskAssigneeList(task));
  const context = [task.entity === 'General operations' ? 'Overview' : task.entity, task.id].filter(Boolean).join(' · ');
  const relatedEntity = task.entityType === 'General' ? 'Overview' : `${task.entityType} · ${task.entity}`;
  return `<tr tabindex="0" data-task-id="${escapeHTML(task.id)}" aria-label="View ${escapeHTML(task.title)}">
    <td><div class="customer-cell"><span class="avatar" aria-hidden="true">${escapeHTML(initials(task.title))}</span><div class="customer-identity"><span class="customer-name">${escapeHTML(task.title)}</span><span class="customer-id">${escapeHTML(context)}</span></div></div></td>
    <td><span class="tier tier-${escapeHTML(task.priority.toLocaleLowerCase())}">${escapeHTML(task.priority)}</span></td>
    <td><span class="kind-badge task-related-entity" title="${escapeHTML(relatedEntity)}">${escapeHTML(relatedEntity)}</span></td>
    <td><span class="task-table-due ${due.className}">${escapeHTML(due.label)}</span></td>
    <td><div class="customer-cell"><span class="avatar" title="${escapeHTML(assignee)}" aria-hidden="true">${escapeHTML(avatar)}</span><div class="customer-identity"><span class="customer-name">${escapeHTML(assignee)}</span><span class="customer-id">${escapeHTML(taskCreatedLabel(task))}</span></div></div></td>
    <td><div class="row-actions"><button class="row-menu" type="button" data-task-action="${escapeHTML(task.id)}" aria-label="${escapeHTML(task.title)} actions"><svg><use href="#i-more" /></svg></button></div></td>
  </tr>`;
}

function customerTasksFor(customer = selectedCustomer) {
  if (!customer) return [];
  return taskRecords
    .filter((task) => task.entityType === 'Customer' && task.entity === customer.name)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

function isActiveTask(task) {
  return !['Done', 'Cancelled'].includes(task.status);
}
function customerTaskDueLabel(task) {
  if (!task.dueDate) return 'No due date';
  return `Due ${new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${task.dueDate}T00:00:00`))}`;
}


function renderCustomerTasks(customer = selectedCustomer) {
  const activeTasks = customerTasksFor(customer).filter(isActiveTask);
  const tiers = customerTierList(customer);
  const tier = tiers[0];
  overviewTaskCards.innerHTML = activeTasks.length
    ? activeTasks.map((task) => {
      const dueLabel = customerTaskDueLabel(task);
      return `<article class="trio-task-card" tabindex="0" data-customer-task-id="${escapeHTML(task.id)}" aria-label="View ${escapeHTML(task.title)}">
        <div class="trio-task-top">
          <span class="customer-task-priority customer-task-priority-${task.priority.toLocaleLowerCase()}">${escapeHTML(task.priority)}</span>
          ${tier ? `<span class="tier tier-${tier.toLocaleLowerCase()}">${escapeHTML(tier)}</span>` : ''}
          <span class="trio-task-grip" aria-hidden="true"><svg><use href="#i-more" /></svg></span>
        </div>
        <strong>${escapeHTML(task.title)}</strong>
        <small>${escapeHTML(dueLabel)}</small>
      </article>`;
    }).join('')
    : '<p class="trio-empty">No active tasks for this customer.</p>';
}

function openCustomerTaskModal(trigger, task = null) {
  if (task) {
    openTaskModal({ task, returnFocus: trigger });
    return;
  }
  openTaskModal({
    draft: { entityType: 'Customer', entity: selectedCustomer.name },
    returnFocus: trigger,
  });
}

const PROFILE_TASKS_PAGE_SIZE = 5;
const PROFILE_TASK_PRIORITY_WEIGHT = { High: 3, Medium: 2, Low: 1 };

function filteredProfileTasks(customer = selectedCustomer) {
  if (!customer) return [];
  const query = profileTaskSearchQuery.trim().toLocaleLowerCase();
  const scoped = customerTasksFor(customer)
    .filter((task) => {
      if (!query) return true;
      return [task.title, task.id, ...taskAssigneeList(task), task.status, task.priority, task.entity, task.entityType, task.description]
        .some((value) => String(value || '').toLocaleLowerCase().includes(query));
    })
    .filter((task) => profileTaskFilters.priority === 'all' || task.priority === profileTaskFilters.priority)
    .filter((task) => profileTaskFilters.entity === 'all' || task.entityType === profileTaskFilters.entity)
    .filter((task) => profileTaskFilters.assignee === 'all' || taskAssigneeMatches(task, profileTaskFilters.assignee))
    .filter((task) => !profileTaskFilters.from || (task.dueDate && task.dueDate >= profileTaskFilters.from))
    .filter((task) => !profileTaskFilters.to || (task.dueDate && task.dueDate <= profileTaskFilters.to));
  return scoped.sort((left, right) => {
    if (profileTaskFilters.sort === 'created-asc') return String(left.createdAt || '').localeCompare(String(right.createdAt || ''));
    if (profileTaskFilters.sort === 'due-asc') return (left.dueDate || '9999-12-31').localeCompare(right.dueDate || '9999-12-31');
    if (profileTaskFilters.sort === 'due-desc') return (right.dueDate || '').localeCompare(left.dueDate || '');
    if (profileTaskFilters.sort === 'priority-desc') return PROFILE_TASK_PRIORITY_WEIGHT[right.priority] - PROFILE_TASK_PRIORITY_WEIGHT[left.priority] || String(right.createdAt || '').localeCompare(String(left.createdAt || ''));
    if (profileTaskFilters.sort === 'priority-asc') return PROFILE_TASK_PRIORITY_WEIGHT[left.priority] - PROFILE_TASK_PRIORITY_WEIGHT[right.priority] || String(right.createdAt || '').localeCompare(String(left.createdAt || ''));
    return String(right.createdAt || '').localeCompare(String(left.createdAt || ''));
  });
}

function profileTaskFilterChanged() {
  return Object.keys(profileTaskFilters).some((key) => profileTaskFilters[key] !== pendingProfileTaskFilters[key]);
}

function syncProfileTaskFilterOptions(customer = selectedCustomer) {
  const tasks = customerTasksFor(customer);
  const entities = [...new Set(tasks.map((task) => task.entityType).filter(Boolean))].sort();
  const assignees = [...new Set(tasks.flatMap((task) => taskAssigneeList(task)).filter(Boolean))].sort();
  const keepEntity = entities.includes(profileTaskEntityFilter.value) ? profileTaskEntityFilter.value : 'all';
  const keepAssignee = assignees.includes(profileTaskAssigneeFilter.value) ? profileTaskAssigneeFilter.value : 'all';
  profileTaskEntityFilter.innerHTML = '<option value="all">All entities</option>'
    + entities.map((entity) => `<option value="${escapeHTML(entity)}">${escapeHTML(entity)}</option>`).join('');
  profileTaskAssigneeFilter.innerHTML = '<option value="all">All assignees</option>'
    + assignees.map((assignee) => `<option value="${escapeHTML(assignee)}">${escapeHTML(assignee)}</option>`).join('')
    + (assignees.includes('Unassigned') ? '' : '<option value="Unassigned">Unassigned</option>');
  profileTaskEntityFilter.value = pendingProfileTaskFilters.entity !== 'all' && entities.includes(pendingProfileTaskFilters.entity) ? pendingProfileTaskFilters.entity : keepEntity;
  profileTaskAssigneeFilter.value = pendingProfileTaskFilters.assignee !== 'all' && (assignees.includes(pendingProfileTaskFilters.assignee) || pendingProfileTaskFilters.assignee === 'Unassigned') ? pendingProfileTaskFilters.assignee : keepAssignee;
  if (profileTaskFilters.entity !== 'all' && !entities.includes(profileTaskFilters.entity)) profileTaskFilters.entity = 'all';
  if (profileTaskFilters.assignee !== 'all' && !assignees.includes(profileTaskFilters.assignee) && profileTaskFilters.assignee !== 'Unassigned') profileTaskFilters.assignee = 'all';
}

function syncProfileTaskFilterControls(customer = selectedCustomer) {
  syncProfileTaskFilterOptions(customer);
  profileTaskPriorityFilter.value = pendingProfileTaskFilters.priority;
  if ([...profileTaskEntityFilter.options].some((option) => option.value === pendingProfileTaskFilters.entity)) {
    profileTaskEntityFilter.value = pendingProfileTaskFilters.entity;
  }
  if ([...profileTaskAssigneeFilter.options].some((option) => option.value === pendingProfileTaskFilters.assignee)) {
    profileTaskAssigneeFilter.value = pendingProfileTaskFilters.assignee;
  }
  profileTaskSort.value = pendingProfileTaskFilters.sort;
  profileTaskDateFrom.value = pendingProfileTaskFilters.from;
  profileTaskDateTo.value = pendingProfileTaskFilters.to;
  applyProfileTaskFiltersButton.disabled = !profileTaskFilterChanged();
  const hasActive = profileTaskSearchQuery.trim() !== '' || Object.entries(profileTaskFilters).some(([key, value]) => key === 'sort' ? value !== 'created-desc' : key === 'from' || key === 'to' ? value !== '' : value !== 'all');
  profileTaskFilterButton.classList.toggle('has-active', hasActive);
}

function openProfileTaskFilterPopover() {
  Object.assign(pendingProfileTaskFilters, profileTaskFilters);
  syncProfileTaskFilterControls();
  profileTaskFilterPopover.hidden = false;
  profileTaskFilterButton.setAttribute('aria-expanded', 'true');
}

function closeProfileTaskFilterPopover() {
  profileTaskFilterPopover.hidden = true;
  profileTaskFilterButton.setAttribute('aria-expanded', 'false');
}

function renderProfileTasks(customer = selectedCustomer) {
  if (!profileTaskRows) return;
  const tasks = filteredProfileTasks(customer);
  const totalPages = Math.max(1, Math.ceil(tasks.length / PROFILE_TASKS_PAGE_SIZE));
  if (profileTaskPage > totalPages) profileTaskPage = totalPages;
  const start = (profileTaskPage - 1) * PROFILE_TASKS_PAGE_SIZE;
  const pageTasks = tasks.slice(start, start + PROFILE_TASKS_PAGE_SIZE);

  syncProfileTaskFilterControls(customer);
  profileTaskRows.innerHTML = pageTasks.length
    ? pageTasks.map((task) => {
      const due = taskDuePresentation(task);
      const avatar = taskAssigneeAvatar(task);
      const detail = [task.id, task.entityType, task.description].filter(Boolean).map((part) => String(part).trim()).filter(Boolean).join(' · ');
      return `<tr tabindex="0" data-profile-task-id="${escapeHTML(task.id)}" aria-label="View ${escapeHTML(task.title)}">
        <td><span class="profile-task-name"><strong>${escapeHTML(task.title)}</strong>${detail ? `<small>${escapeHTML(detail)}</small>` : ''}</span></td>
        <td><span class="customer-task-priority customer-task-priority-${task.priority.toLocaleLowerCase()}">${escapeHTML(task.priority)}</span></td>
        <td><span class="profile-task-entity">${escapeHTML(task.entityType)} · ${escapeHTML(task.entity)}</span></td>
        <td><span class="customer-task-creator"><span class="customer-task-avatar" title="${escapeHTML(assigneeDisplayNames(taskAssigneeList(task)))}">${escapeHTML(avatar)}</span><span><strong>${escapeHTML(assigneeDisplayNames(taskAssigneeList(task)))}</strong><small>${escapeHTML(taskCreatedLabel(task))}</small></span></span></td>
        <td><span class="profile-task-due ${due.className}"><svg aria-hidden="true"><use href="#i-clock" /></svg>${escapeHTML(due.label)}</span></td>
        <td><button class="row-menu" type="button" data-task-action="${escapeHTML(task.id)}" aria-label="${escapeHTML(task.title)} actions"><svg aria-hidden="true"><use href="#i-more" /></svg></button></td>
      </tr>`;
    }).join('')
    : `<tr class="profile-task-empty-row"><td colspan="6">No tasks found for this customer.</td></tr>`;

  profileTaskPagination.innerHTML = tasks.length
    ? paginationMarkup(profileTaskPage, totalPages, tasks.length, PROFILE_TASKS_PAGE_SIZE, 'profile-task-page', 'tasks')
    : '';
  profileTaskPagination.hidden = tasks.length === 0;
  enhanceListSheet(profileTaskRows.closest('table'), 'tasks', taskRecords.map(item => item.id));
}

function openQueryTaskModal(trigger, task = null) {
  if (task) {
    openTaskModal({ task, returnFocus: trigger });
    return;
  }
  openTaskModal({
    draft: {
      status: 'Open',
      priority: selectedQuery?.priority || 'Medium',
      assignees: queryOwnerList(selectedQuery).length ? queryOwnerList(selectedQuery) : [TASK_CURRENT_USER],
      entityType: 'Query',
      entity: selectedQuery?.title || '',
    },
    queryLock: selectedQuery ? { id: selectedQuery.id, title: selectedQuery.title } : null,
    returnFocus: trigger,
  });
}

function filteredQueryTasks(query = selectedQuery) {
  if (!query) return [];
  const search = queryTaskSearchQuery.trim().toLocaleLowerCase();
  const scoped = queryDetailTasks(query)
    .filter((task) => {
      if (!search) return true;
      return [task.title, task.id, ...taskAssigneeList(task), task.status, task.priority, task.entity, task.entityType, task.description]
        .some((value) => String(value || '').toLocaleLowerCase().includes(search));
    })
    .filter((task) => queryTaskFilters.priority === 'all' || task.priority === queryTaskFilters.priority)
    .filter((task) => queryTaskFilters.entity === 'all' || task.entityType === queryTaskFilters.entity)
    .filter((task) => queryTaskFilters.assignee === 'all' || taskAssigneeMatches(task, queryTaskFilters.assignee))
    .filter((task) => !queryTaskFilters.from || (task.dueDate && task.dueDate >= queryTaskFilters.from))
    .filter((task) => !queryTaskFilters.to || (task.dueDate && task.dueDate <= queryTaskFilters.to));
  return scoped.sort((left, right) => {
    if (queryTaskFilters.sort === 'created-asc') return String(left.createdAt || '').localeCompare(String(right.createdAt || ''));
    if (queryTaskFilters.sort === 'due-asc') return (left.dueDate || '9999-12-31').localeCompare(right.dueDate || '9999-12-31');
    if (queryTaskFilters.sort === 'due-desc') return (right.dueDate || '').localeCompare(left.dueDate || '');
    if (queryTaskFilters.sort === 'priority-desc') return PROFILE_TASK_PRIORITY_WEIGHT[right.priority] - PROFILE_TASK_PRIORITY_WEIGHT[left.priority] || String(right.createdAt || '').localeCompare(String(left.createdAt || ''));
    if (queryTaskFilters.sort === 'priority-asc') return PROFILE_TASK_PRIORITY_WEIGHT[left.priority] - PROFILE_TASK_PRIORITY_WEIGHT[right.priority] || String(right.createdAt || '').localeCompare(String(left.createdAt || ''));
    return String(right.createdAt || '').localeCompare(String(left.createdAt || ''));
  });
}

function queryTaskFilterChanged() {
  return Object.keys(queryTaskFilters).some((key) => queryTaskFilters[key] !== pendingQueryTaskFilters[key]);
}

function queryTaskField(id) {
  return $(`#${id}`, queryDetailContent);
}

function syncQueryTaskFilterOptions(query = selectedQuery) {
  const entityFilter = queryTaskField('queryTaskEntityFilter');
  const assigneeFilter = queryTaskField('queryTaskAssigneeFilter');
  if (!entityFilter || !assigneeFilter) return;
  const tasks = queryDetailTasks(query);
  const entities = [...new Set(tasks.map((task) => task.entityType).filter(Boolean))].sort();
  const assignees = [...new Set(tasks.flatMap((task) => taskAssigneeList(task)).filter(Boolean))].sort();
  const keepEntity = entities.includes(entityFilter.value) ? entityFilter.value : 'all';
  const keepAssignee = assignees.includes(assigneeFilter.value) ? assigneeFilter.value : 'all';
  entityFilter.innerHTML = '<option value="all">All entities</option>'
    + entities.map((entity) => `<option value="${escapeHTML(entity)}">${escapeHTML(entity)}</option>`).join('');
  assigneeFilter.innerHTML = '<option value="all">All assignees</option>'
    + assignees.map((assignee) => `<option value="${escapeHTML(assignee)}">${escapeHTML(assignee)}</option>`).join('')
    + (assignees.includes('Unassigned') ? '' : '<option value="Unassigned">Unassigned</option>');
  entityFilter.value = pendingQueryTaskFilters.entity !== 'all' && entities.includes(pendingQueryTaskFilters.entity) ? pendingQueryTaskFilters.entity : keepEntity;
  assigneeFilter.value = pendingQueryTaskFilters.assignee !== 'all' && (assignees.includes(pendingQueryTaskFilters.assignee) || pendingQueryTaskFilters.assignee === 'Unassigned') ? pendingQueryTaskFilters.assignee : keepAssignee;
  if (queryTaskFilters.entity !== 'all' && !entities.includes(queryTaskFilters.entity)) queryTaskFilters.entity = 'all';
  if (queryTaskFilters.assignee !== 'all' && !assignees.includes(queryTaskFilters.assignee) && queryTaskFilters.assignee !== 'Unassigned') queryTaskFilters.assignee = 'all';
}

function syncQueryTaskFilterControls(query = selectedQuery) {
  const priorityFilter = queryTaskField('queryTaskPriorityFilter');
  const entityFilter = queryTaskField('queryTaskEntityFilter');
  const assigneeFilter = queryTaskField('queryTaskAssigneeFilter');
  const sort = queryTaskField('queryTaskSort');
  const dateFrom = queryTaskField('queryTaskDateFrom');
  const dateTo = queryTaskField('queryTaskDateTo');
  const applyButton = queryTaskField('applyQueryTaskFilters');
  const filterButton = queryTaskField('queryTaskFilterButton');
  if (!priorityFilter || !applyButton || !filterButton) return;
  syncQueryTaskFilterOptions(query);
  priorityFilter.value = pendingQueryTaskFilters.priority;
  if ([...entityFilter.options].some((option) => option.value === pendingQueryTaskFilters.entity)) {
    entityFilter.value = pendingQueryTaskFilters.entity;
  }
  if ([...assigneeFilter.options].some((option) => option.value === pendingQueryTaskFilters.assignee)) {
    assigneeFilter.value = pendingQueryTaskFilters.assignee;
  }
  sort.value = pendingQueryTaskFilters.sort;
  dateFrom.value = pendingQueryTaskFilters.from;
  dateTo.value = pendingQueryTaskFilters.to;
  applyButton.disabled = !queryTaskFilterChanged();
  const hasActive = queryTaskSearchQuery.trim() !== '' || Object.entries(queryTaskFilters).some(([key, value]) => key === 'sort' ? value !== 'created-desc' : key === 'from' || key === 'to' ? value !== '' : value !== 'all');
  filterButton.classList.toggle('has-active', hasActive);
}

function openQueryTaskFilterPopover() {
  Object.assign(pendingQueryTaskFilters, queryTaskFilters);
  syncQueryTaskFilterControls();
  const popover = queryTaskField('queryTaskFilterPopover');
  const filterButton = queryTaskField('queryTaskFilterButton');
  if (!popover || !filterButton) return;
  popover.hidden = false;
  filterButton.setAttribute('aria-expanded', 'true');
}

function closeQueryTaskFilterPopover() {
  const popover = queryTaskField('queryTaskFilterPopover');
  const filterButton = queryTaskField('queryTaskFilterButton');
  if (!popover || !filterButton) return;
  popover.hidden = true;
  filterButton.setAttribute('aria-expanded', 'false');
}

function resetQueryTaskState() {
  queryTaskSearchQuery = '';
  queryTaskPage = 1;
  Object.assign(queryTaskFilters, { priority: 'all', entity: 'all', assignee: 'all', sort: 'created-desc', from: '', to: '' });
  Object.assign(pendingQueryTaskFilters, queryTaskFilters);
}

function renderQueryTasks(query = selectedQuery) {
  const rows = queryTaskField('queryTaskRows');
  const pagination = queryTaskField('queryTaskPagination');
  if (!rows || !pagination || !query) return;
  const tasks = filteredQueryTasks(query);
  const totalPages = Math.max(1, Math.ceil(tasks.length / PROFILE_TASKS_PAGE_SIZE));
  if (queryTaskPage > totalPages) queryTaskPage = totalPages;
  const start = (queryTaskPage - 1) * PROFILE_TASKS_PAGE_SIZE;
  const pageTasks = tasks.slice(start, start + PROFILE_TASKS_PAGE_SIZE);

  syncQueryTaskFilterControls(query);
  rows.innerHTML = pageTasks.length
    ? pageTasks.map((task) => {
      const due = taskDuePresentation(task);
      const avatar = taskAssigneeAvatar(task);
      const detail = [task.id, task.entityType, task.description].filter(Boolean).map((part) => String(part).trim()).filter(Boolean).join(' · ');
      return `<tr tabindex="0" data-query-task-id="${escapeHTML(task.id)}" aria-label="View ${escapeHTML(task.title)}">
        <td><span class="profile-task-name"><strong>${escapeHTML(task.title)}</strong>${detail ? `<small>${escapeHTML(detail)}</small>` : ''}</span></td>
        <td><span class="customer-task-priority customer-task-priority-${task.priority.toLocaleLowerCase()}">${escapeHTML(task.priority)}</span></td>
        <td><span class="profile-task-entity">${escapeHTML(task.entityType)} · ${escapeHTML(task.entity)}</span></td>
        <td><span class="customer-task-creator"><span class="customer-task-avatar" title="${escapeHTML(assigneeDisplayNames(taskAssigneeList(task)))}">${escapeHTML(avatar)}</span><span><strong>${escapeHTML(assigneeDisplayNames(taskAssigneeList(task)))}</strong><small>${escapeHTML(taskCreatedLabel(task))}</small></span></span></td>
        <td><span class="profile-task-due ${due.className}"><svg aria-hidden="true"><use href="#i-clock" /></svg>${escapeHTML(due.label)}</span></td>
        <td><button class="row-menu" type="button" data-task-action="${escapeHTML(task.id)}" aria-label="${escapeHTML(task.title)} actions"><svg aria-hidden="true"><use href="#i-more" /></svg></button></td>
      </tr>`;
    }).join('')
    : `<tr class="profile-task-empty-row"><td colspan="6">No tasks found for this query.</td></tr>`;

  pagination.innerHTML = tasks.length
    ? paginationMarkup(queryTaskPage, totalPages, tasks.length, PROFILE_TASKS_PAGE_SIZE, 'query-task-page', 'tasks')
    : '';
  pagination.hidden = tasks.length === 0;
  enhanceListSheet(rows.closest('table'), 'tasks', taskRecords.map(item => item.id));
}

function referralCustomer(customerId) {
  return customers.find((customer) => customer.id === customerId);
}

function referralLinksFor(customerId) {
  if (!customerReferralLinks.has(customerId)) customerReferralLinks.set(customerId, { referredBy: null, referrals: [] });
  return customerReferralLinks.get(customerId);
}

function referralDescendantIds(customerId, descendants = new Set()) {
  const links = customerReferralLinks.get(customerId);
  (links?.referrals ?? []).forEach((referredCustomerId) => {
    if (descendants.has(referredCustomerId)) return;
    descendants.add(referredCustomerId);
    referralDescendantIds(referredCustomerId, descendants);
  });
  return descendants;
}

function referralCustomerNodeMarkup(customer, relation) {
  return `<button class="referral-tree-node" type="button" data-referral-customer="${escapeHTML(customer.id)}">
    <span class="referral-tree-avatar">${avatarMarkup(customer)}</span>
    <span><small>${escapeHTML(relation)}</small><strong>${escapeHTML(customer.name)}</strong><em>${escapeHTML(customer.id)}</em></span>
  </button>`;
}

function renderReferralOverview(customer = selectedCustomer) {
  $('#overviewReferralSource').textContent = customer?.source ?? 'Website';
  if (!customer || !overviewReferralTree) return;
  const links = referralLinksFor(customer.id);
  const referrer = referralCustomer(links.referredBy);
  const referrals = links.referrals.map(referralCustomer).filter(Boolean);
  const source = customer.source ?? 'Website';
  overviewReferralTree.innerHTML = `
    <section class="referral-tree-level">
      <span class="referral-tree-level-label">${referrer ? 'Referred by' : 'Acquisition source'}</span>
      ${referrer
    ? referralCustomerNodeMarkup(referrer, 'Referrer')
    : `<div class="referral-source-node"><svg><use href="#i-target" /></svg><span><small>Direct acquisition</small><strong>${escapeHTML(source)}</strong></span></div>`}
    </section>
    <span class="referral-tree-connector" aria-hidden="true"></span>
    <section class="referral-tree-current">
      <span class="referral-tree-avatar">${avatarMarkup(customer)}</span>
      <span><small>Current customer</small><strong>${escapeHTML(customer.name)}</strong><em>${escapeHTML(customer.id)}</em></span>
    </section>
    ${referrals.length ? `
    <span class="referral-tree-connector is-branch" aria-hidden="true"></span>
    <section class="referral-tree-level referral-tree-children trio-referral-children">
      <span class="referral-tree-level-label">Referred customers</span>
      <div>${referrals.map((referredCustomer) => referralCustomerNodeMarkup(referredCustomer, 'Referred customer')).join('')}</div>
    </section>` : ''}`;
}

function renderReferralTree(customer = selectedCustomer) {
  const links = referralLinksFor(customer.id);
  const referrer = referralCustomer(links.referredBy);
  const referrals = links.referrals.map(referralCustomer).filter(Boolean);
  const unavailableReferrers = referralDescendantIds(customer.id);
  unavailableReferrers.add(customer.id);
  const eligibleReferrers = customers.filter((candidate) => !unavailableReferrers.has(candidate.id));

  referralReferrerSelect.innerHTML = '<option value="">No referrer — direct website acquisition</option>'
    + eligibleReferrers.map((candidate) => `<option value="${escapeHTML(candidate.id)}">${escapeHTML(candidate.name)} (${escapeHTML(candidate.id)})</option>`).join('');
  referralReferrerSelect.value = links.referredBy || '';
  $('#referralTreeSubtitle').textContent = `${referrals.length} referred customer${referrals.length === 1 ? '' : 's'} · Source: Website`;
  referralTreeStage.innerHTML = `
    <section class="referral-tree-level">
      <span class="referral-tree-level-label">${referrer ? 'Referred by' : 'Acquisition source'}</span>
      ${referrer
    ? referralCustomerNodeMarkup(referrer, 'Referrer')
    : '<div class="referral-source-node"><svg><use href="#i-target" /></svg><span><small>Direct acquisition</small><strong>Website</strong></span></div>'}
    </section>
    <span class="referral-tree-connector" aria-hidden="true"></span>
    <section class="referral-tree-current">
      <span class="referral-tree-avatar">${avatarMarkup(customer)}</span>
      <span><small>Current customer</small><strong>${escapeHTML(customer.name)}</strong><em>${escapeHTML(customer.id)}</em></span>
    </section>
    <span class="referral-tree-connector is-branch" aria-hidden="true"></span>
    <section class="referral-tree-level referral-tree-children">
      <span class="referral-tree-level-label">Referred customers</span>
      <div>${referrals.length
    ? referrals.map((referredCustomer) => referralCustomerNodeMarkup(referredCustomer, 'Referred customer')).join('')
    : '<p class="referral-tree-empty">No referred customers yet.</p>'}</div>
    </section>`;
}

function openReferralTree(trigger) {
  referralTreeReturnFocus = trigger;
  $('#referralTreeTitle').textContent = `${selectedCustomer.name} referral tree`;
  renderReferralTree(selectedCustomer);
  openModal(referralTreeBackdrop, referralReferrerSelect);
}

function saveReferralReferrer() {
  const customer = selectedCustomer;
  const links = referralLinksFor(customer.id);
  const nextReferrerId = referralReferrerSelect.value || null;
  customerReferralLinks.forEach((candidateLinks) => {
    candidateLinks.referrals = candidateLinks.referrals.filter((customerId) => customerId !== customer.id);
  });
  links.referredBy = nextReferrerId;
  if (nextReferrerId) {
    const referrerLinks = referralLinksFor(nextReferrerId);
    if (!referrerLinks.referrals.includes(customer.id)) referrerLinks.referrals.push(customer.id);
  }
  renderReferralTree(customer);
  showToast(nextReferrerId ? 'Referrer updated' : 'Referrer removed');
}

function closeReferralTree(restoreFocus = true) {
  closeModal(referralTreeBackdrop, null, restoreFocus ? referralTreeReturnFocus : null);
  referralTreeReturnFocus = null;
}

function taskStatusRecords(tasks, status) {
  return tasks.filter((task) => task.status === status);
}

function renderTaskTabs() {
  $$('.tasks-tab').forEach((tab) => {
    const isActive = tab.dataset.taskView === activeTaskView;
    $('.category-tab-count', tab).textContent = taskCategoryPool(tab.dataset.taskView).length;
    tab.classList.toggle('is-active', isActive);
    tab.setAttribute('aria-selected', String(isActive));
  });
}

function taskFilterControlsChanged() {
  return tasksPriorityFilter.value !== taskFilters.priority
    || tasksEntityFilter.value !== taskFilters.entity
    || tasksAssigneeFilter.value !== taskFilters.assignee
    || tasksSort.value !== taskFilters.sort
    || tasksDateFrom.value !== taskFilters.from
    || tasksDateTo.value !== taskFilters.to;
}

function syncTaskFilterApplyState() {
  applyTaskFiltersButton.disabled = !taskFilterControlsChanged();
}

function renderTaskFilters() {
  const hasPopoverFilter = taskFilters.priority !== 'all'
    || taskFilters.entity !== 'all'
    || taskFilters.assignee !== 'all'
    || taskFilters.sort !== 'created-desc'
    || Boolean(taskFilters.from || taskFilters.to);
  tasksFilterButton.classList.toggle('has-active', hasPopoverFilter);
}

function renderTaskBoard() {
  renderTaskTabs();
  renderTaskFilters();
  const tasks = filteredTaskRecords();
  const hasRecords = tasks.length > 0;
  tasksResultCount.textContent = `${tasks.length} task${tasks.length === 1 ? '' : 's'}`;

  $$('[data-task-layout]').forEach((button) => {
    const active = button.dataset.taskLayout === activeTaskLayout;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  $$('[data-task-status-tab]', taskStatusTabs).forEach((tab) => {
    const active = tab.dataset.taskStatusTab === activeTaskStatus;
    tab.classList.toggle('is-active', active);
    tab.setAttribute('aria-selected', String(active));
  });

  taskBoardShell.hidden = !hasRecords || activeTaskLayout !== 'kanban';
  taskListShell.hidden = !hasRecords || activeTaskLayout !== 'list';
  tasksEmptyState.hidden = hasRecords;

  if (activeTaskLayout === 'kanban') {
    taskBoard.innerHTML = TASK_STATUSES.map((status) => {
      const statusTasks = taskStatusRecords(tasks, status);
      return `<section class="task-column" data-task-status="${escapeHTML(status)}">
        <header class="task-column-header">
          <div class="task-column-title"><i></i><strong>${escapeHTML(status)}</strong><span>${statusTasks.length}</span></div>
          <button class="task-column-add" type="button" data-task-add-status="${escapeHTML(status)}" aria-label="Add ${escapeHTML(status.toLowerCase())} task"><svg><use href="#i-plus" /></svg></button>
        </header>
        <div class="task-column-list">${statusTasks.length ? statusTasks.map(taskCardMarkup).join('') : '<div class="task-column-empty">No tasks in this stage</div>'}</div>
      </section>`;
    }).join('');
  } else {
    const statusTasks = activeTaskStatus === 'All' ? tasks : taskStatusRecords(tasks, activeTaskStatus);
    const totalPages = Math.max(1, Math.ceil(statusTasks.length / WORKSPACE_LIST_PAGE_SIZE));
    taskListPage = Math.max(1, Math.min(taskListPage, totalPages));
    const start = (taskListPage - 1) * WORKSPACE_LIST_PAGE_SIZE;
    taskListBody.innerHTML = statusTasks.length
      ? statusTasks.slice(start, start + WORKSPACE_LIST_PAGE_SIZE).map(taskListRowMarkup).join('')
      : `<tr><td colspan="6"><div class="task-column-empty">No ${escapeHTML(activeTaskStatus.toLocaleLowerCase())} tasks</div></td></tr>`;
    taskListPagination.innerHTML = statusTasks.length
      ? paginationMarkup(taskListPage, totalPages, statusTasks.length, WORKSPACE_LIST_PAGE_SIZE, 'task-list-page', 'tasks')
      : '';
    taskListPagination.hidden = statusTasks.length === 0;
    enhanceListSheet(taskListBody.closest('table'), 'tasks', taskRecords.map(item => item.id));
  }
}

function setTaskView(view) {
  activeTaskView = view;
  if (view === 'completed') activeTaskStatus = 'Done';
  else if (activeTaskStatus === 'Done') activeTaskStatus = 'All';
  taskListPage = 1;
  renderTaskBoard();
}

function syncTaskFilterControls() {
  tasksPriorityFilter.value = taskFilters.priority;
  tasksEntityFilter.value = taskFilters.entity;
  tasksAssigneeFilter.value = taskFilters.assignee;
  tasksSort.value = taskFilters.sort;
  tasksDateFrom.value = taskFilters.from;
  tasksDateTo.value = taskFilters.to;
  tasksDateTo.setCustomValidity('');
  syncThemedControls(tasksFilterPopover);
  syncTaskFilterApplyState();
}

function closeTaskFilterPopover() {
  tasksFilterPopover.hidden = true;
  tasksFilterButton.setAttribute('aria-expanded', 'false');
  syncTaskFilterControls();
}

function clearTaskFilters() {
  tasksSearch.value = '';
  Object.assign(taskFilters, { priority: 'all', entity: 'all', assignee: 'all', sort: 'created-desc', from: '', to: '' });
  syncTaskFilterControls();
  closeTaskFilterPopover();
  taskListPage = 1;
  renderTaskBoard();
}

function nextTaskIdentifier() {
  const year = new Date().getFullYear();
  const existingNumbers = taskRecords.map((task) => task.id.match(new RegExp(`^TSK-${year}-(\\d+)$`))?.[1]).filter(Boolean).map(Number);
  return `TSK-${year}-${String(Math.max(taskRecords.length + 1, ...existingNumbers.map((number) => number + 1))).padStart(6, '0')}`;
}

function syncTaskDueTime() {
  taskDueTime.disabled = !taskDueDate.value;
  if (taskDueTime.disabled) taskDueTime.value = '';
}

function openTaskDetails(task, returnFocus = document.activeElement) {
  taskDetailsId = task.id;
  taskDetailsReturnFocus = returnFocus;
  const dueDate = task.dueDate
    ? new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(`${task.dueDate}T00:00:00`))
    : 'No due date';
  const due = task.dueTime ? `${dueDate} · ${task.dueTime}` : dueDate;
  const priority = { High: 'P1 · High', Medium: 'P2 · Medium', Low: 'P3 · Low' }[task.priority] || task.priority;
  taskDetailsBody.innerHTML = `
    <div class="task-detail-heading"><span class="task-detail-id">${escapeHTML(task.id)}</span><span class="task-detail-status" data-status="${escapeHTML(task.status)}">${escapeHTML(task.status)}</span></div>
    <h3>${escapeHTML(task.title)}</h3>
    <p class="task-detail-description">${escapeHTML(task.description || 'No description added.')}</p>
    <dl class="task-detail-grid">
      <div><dt>Priority</dt><dd>${escapeHTML(priority)}</dd></div>
      <div><dt>Assignees</dt><dd>${escapeHTML(assigneeDisplayNames(taskAssigneeList(task)))}</dd></div>
      <div><dt>Due</dt><dd>${escapeHTML(due)}</dd></div>
      <div><dt>Related to</dt><dd>${escapeHTML(task.entityType === 'General' ? 'Overview' : `${task.entityType} · ${task.entity}`)}</dd></div>
    </dl>`;
  taskCompleteButton.disabled = task.status === 'Done';
  $('#taskCompleteButtonLabel').textContent = task.status === 'Done' ? 'Completed' : 'Mark completed';
  taskDetailActions.hidden = false;
  taskDeleteConfirm.hidden = true;
  openModal(taskDetailsBackdrop, taskCompleteButton.disabled ? taskEditButton : taskCompleteButton);
}

function closeTaskDetails(restoreFocus = true) {
  if (taskDetailsBackdrop.hidden) return;
  closeModal(taskDetailsBackdrop, null, restoreFocus && taskDetailsReturnFocus?.isConnected ? taskDetailsReturnFocus : null);
  taskDetailsId = null;
  taskDetailsReturnFocus = null;
}

function openTaskModal({
  task = null,
  draft = null,
  status = 'Open',
  returnFocus = document.activeElement,
  queryLock = null,
  edit = false,
} = {}) {
  if (task && !edit) {
    openTaskDetails(task, returnFocus);
    return;
  }
  taskModalReturnFocus = returnFocus;
  taskDraftFollowUp = Boolean(task?.followUp || draft?.followUp);
  taskModalQueryLock = !task && queryLock ? queryLock : null;
  taskModalEntityContext = !task && draft?.entityType && draft?.entity
    ? { entityType: draft.entityType, entity: draft.entity }
    : null;
  taskForm.reset();
  const identifier = task?.id || nextTaskIdentifier();
  taskId.value = identifier;
  taskIdDisplay.textContent = identifier;
  taskModalTitle.textContent = task ? 'Edit task' : 'Add task';
  taskModalSubmit.textContent = task ? 'Save changes' : 'Create task';
  taskTitleInput.value = task?.title || draft?.title || '';
  taskDescription.value = task?.description || draft?.description || '';
  taskStatus.value = task?.status || draft?.status || status;
  taskPriority.value = task?.priority || draft?.priority || 'Medium';
  taskAssigneePopover.innerHTML = taskAssigneeDropdownMarkup(
    task ? taskAssigneeList(task) : (draft?.assignees ?? draft?.assignee ?? TASK_CURRENT_USER),
  );
  setTaskAssigneeOpen(false);
  syncTaskAssigneeButton();
  taskDueDate.value = task?.dueDate || draft?.dueDate || '';
  taskDueTime.value = task?.dueTime || draft?.dueTime || '';
  taskDueDate.setCustomValidity('');
  syncTaskDueTime();
  syncThemedControls(taskModalBackdrop);
  openModal(taskModalBackdrop, taskTitleInput);
}

function closeTaskModalDialog() {
  closeThemedPops();
  setTaskAssigneeOpen(false);
  taskModalBackdrop.hidden = true;
  document.body.style.overflow = '';
  taskForm.reset();
  taskModalReturnFocus?.focus();
  taskModalReturnFocus = null;
  taskDraftFollowUp = false;
  taskModalQueryLock = null;
  taskModalEntityContext = null;
}

function refreshTaskViews(task) {
  renderTaskBoard();
  renderCustomerTasks(selectedCustomer);
  renderProfileTasks(selectedCustomer);
  renderProfileTabCounts(selectedCustomer);
  if (selectedQuery && (task.queryId === selectedQuery.id || (task.entityType === 'Query' && task.entity === selectedQuery.title))) {
    selectedQuery.activity = 'Just now';
    renderQueryDetail();
  }
}

function saveTask(event) {
  event.preventDefault();
  if (!taskForm.reportValidity()) return;
  const existingTask = taskRecords.find((task) => task.id === taskId.value);
  const lockedQuery = taskModalQueryLock;
  const entityType = lockedQuery ? 'Query' : existingTask?.entityType || taskModalEntityContext?.entityType || 'General';
  const entity = lockedQuery?.title || existingTask?.entity || taskModalEntityContext?.entity || 'General operations';
  const entityMatch = taskRecords.find((task) => task.entity === entity);
  const status = taskStatus.value;
  let resolvedQueryId = existingTask?.queryId;
  if (lockedQuery) {
    resolvedQueryId = lockedQuery.id;
  } else if (entityType === 'Query') {
    resolvedQueryId ??= queryModuleRecords.find((query) => query.title === entity)?.id;
  } else {
    resolvedQueryId = undefined;
  }
  const record = {
    id: existingTask?.id || taskId.value || nextTaskIdentifier(),
    title: taskTitleInput.value.trim(),
    description: taskDescription.value.trim(),
    status,
    priority: taskPriority.value,
    assignees: [...taskAssigneePopover.querySelectorAll('input[name="taskAssignees"]:checked')].map((input) => input.value),
    startDate: existingTask?.startDate || '',
    startTime: existingTask?.startTime || '',
    dueDate: taskDueDate.value,
    dueTime: taskDueTime.value,
    entityType,
    entity,
    queryId: resolvedQueryId,
    tier: existingTask?.tier || entityMatch?.tier || 'Silver',
    value: existingTask?.value ?? entityMatch?.value ?? 0,
    createdAt: existingTask?.createdAt || new Date().toISOString(),
    createdBy: existingTask?.createdBy || TASK_CURRENT_USER,
    delay: status === 'Done' ? 'Completed' : status === 'Cancelled' ? 'Cancelled' : taskDueDate.value ? existingTask?.delay || 'Planned' : 'No due date',
    followUp: existingTask?.followUp ?? taskDraftFollowUp,
  };
  setTaskAssignees(record, record.assignees);
  if (existingTask) Object.assign(existingTask, record);
  else taskRecords.unshift(record);
  saveTaskRecordsStore();
  closeTaskModalDialog();
  refreshTaskViews(record);
  showToast(existingTask ? 'Task updated' : 'Task created');
}

function updateTaskStatus(taskIdValue, status) {
  const task = taskRecords.find((item) => item.id === taskIdValue);
  if (!task || task.status === status) return;
  task.status = status;
  if (status === 'Done') task.delay = 'Completed';
  if (status === 'Cancelled') task.delay = 'Cancelled';
  saveTaskRecordsStore();
  refreshTaskViews(task);
  taskBoardAnnouncement.textContent = `${task.title} moved to ${status}.`;
  showToast(status === 'Done' ? 'Task completed' : `Task moved to ${status}`);
}

function restoreShellFocus(target, shellTrigger = null) {
  if (!(target instanceof HTMLElement) || !target.isConnected) return;
  if (target === shellSearch) suppressShellSearchFocus = true;
  target.focus();
  if (shellTrigger && target !== shellTrigger) shellTrigger.setAttribute('aria-expanded', 'false');
}

function visibleGlobalSearchResults() {
  if (!globalSearchResults) return [];
  return $$('[data-global-search-target]', globalSearchResults).filter((item) => !item.hidden);
}

function filterGlobalSearchResults() {
  if (!globalSearchInput || !globalSearchResults) return;
  const query = globalSearchInput.value.trim().toLocaleLowerCase();
  $$('[data-global-search-target]', globalSearchResults).forEach((item) => {
    item.hidden = Boolean(query) && !item.textContent.toLocaleLowerCase().includes(query);
    item.classList.remove('is-active');
    item.setAttribute('aria-selected', 'false');
  });
  const first = visibleGlobalSearchResults()[0];
  if (first) {
    first.classList.add('is-active');
    first.setAttribute('aria-selected', 'true');
  }
}

function openGlobalSearch(trigger = document.activeElement) {
  if (!globalSearchBackdrop || !globalSearchInput) {
    showToast('Search is unavailable');
    return;
  }
  if (!globalSearchBackdrop.hidden) return;
  closeNotificationCenter(false);
  closeAccountMenu(false);
  globalSearchRestoreTarget = trigger instanceof HTMLElement ? trigger : shellSearch;
  globalSearchBackdrop.hidden = false;
  shellSearch?.setAttribute('aria-expanded', 'true');
  shellSearchLabel?.setAttribute('aria-expanded', 'true');
  globalSearchInput.value = '';
  filterGlobalSearchResults();
  globalSearchInput.focus();
}

function closeGlobalSearch(restoreFocus = true) {
  if (!globalSearchBackdrop || globalSearchBackdrop.hidden) return;
  globalSearchBackdrop.hidden = true;
  shellSearch?.setAttribute('aria-expanded', 'false');
  if (restoreFocus) restoreShellFocus(globalSearchRestoreTarget, shellSearch);
  shellSearchLabel?.setAttribute('aria-expanded', 'false');
  globalSearchRestoreTarget = null;
}

function activateAccountSection(section = 'profile', scroll = false) {
  if (!accountView) return;
  const panels = $$('[data-account-panel]', accountView);
  const available = panels.some((panel) => panel.dataset.accountPanel === section);
  const nextSection = available ? section : panels[0]?.dataset.accountPanel;
  if (!nextSection) return;
  $$('[data-account-section]').forEach((item) => {
    const active = item.dataset.accountSection === nextSection;
    item.classList.toggle('is-active', active);
    item.setAttribute('aria-selected', String(active));
    if (item.closest('#accountView')) {
      if (active) item.setAttribute('aria-current', 'page');
      else item.removeAttribute('aria-current');
    }
  });
  panels.forEach((panel) => {
    const active = panel.dataset.accountPanel === nextSection;
    panel.hidden = !active;
    panel.classList.toggle('is-active', active);
  });
  const panel = panels.find((item) => item.dataset.accountPanel === nextSection);
  if (scroll && panel) panel.scrollIntoView({ block: 'start', behavior: 'smooth' });
}

const ACCOUNT_PROFILE_STORAGE_KEY = 'paryatech.account-profile.v1';
let accountPhotoPreviewUrl = null;

function syncAccountProfileIdentity() {
  const name = accountFullName?.value.trim() || 'Rishi Charan';
  const email = accountEmail?.value.trim() || 'rishi@paryatech.com';
  const initials = name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
  ['#accountHeaderName', '#accountProfileName'].forEach((selector) => {
    const element = $(selector);
    if (element) element.textContent = name;
  });
  const headerEmail = $('#accountHeaderEmail');
  if (headerEmail) headerEmail.textContent = email;
  const menuName = $('header strong', accountMenu);
  const menuEmail = $('header small', accountMenu);
  if (menuName) menuName.textContent = name;
  if (menuEmail) menuEmail.textContent = email;
  $$('.account-identity-avatar, .account-menu header > span').forEach((avatar) => {
    if (avatar === accountProfileAvatar && accountPhotoPreviewUrl) return;
    avatar.textContent = initials;
  });
}

function restoreAccountProfile() {
  try {
    const saved = JSON.parse(localStorage.getItem(ACCOUNT_PROFILE_STORAGE_KEY) || 'null');
    if (saved && typeof saved === 'object') {
      if (typeof saved.name === 'string' && saved.name.trim()) accountFullName.value = saved.name;
      if (typeof saved.email === 'string' && saved.email.trim()) accountEmail.value = saved.email;
      if (typeof saved.phone === 'string') accountPhone.value = saved.phone;
    }
  } catch { /* Storage may be unavailable in a preview. */ }
  syncAccountProfileIdentity();
}

function openAccountView(section = 'profile') {
  setView('account');
  activateAccountSection(section);
}

function openAccountMenu(trigger = shellAccountButton) {
  if (!accountMenuBackdrop || !accountMenu) {
    openAccountView();
    return;
  }
  closeGlobalSearch(false);
  closeNotificationCenter(false);
  accountMenuRestoreTarget = trigger instanceof HTMLElement ? trigger : shellAccountButton;
  accountMenuBackdrop.hidden = false;
  shellAccountButton?.setAttribute('aria-expanded', 'true');
  window.requestAnimationFrame(() => $('[data-account-section]', accountMenu)?.focus());
}

function closeAccountMenu(restoreFocus = true) {
  if (!accountMenuBackdrop || accountMenuBackdrop.hidden) return;
  accountMenuBackdrop.hidden = true;
  shellAccountButton?.setAttribute('aria-expanded', 'false');
  if (restoreFocus) restoreShellFocus(accountMenuRestoreTarget, shellAccountButton);
  accountMenuRestoreTarget = null;
}

function notificationMarkup(notification) {
  return `<article class="notification-row${notification.unread ? ' is-unread' : ''}" role="listitem" data-notification-id="${escapeHTML(notification.id)}">
    <span class="notification-dot" aria-hidden="true"></span>
    <div><strong>${escapeHTML(notification.title)}</strong><p>${escapeHTML(notification.detail)}</p><time>${escapeHTML(notification.time)}</time></div>
  </article>`;
}

function notificationPageLists() {
  if (!notificationsView) return [];
  return $$('[data-notification-page-list], [data-notifications-list], #notificationsPageList, .notification-page-list', notificationsView);
}

function updateNotificationButton() {
  if (!shellNotificationsButton) return;
  const count = shellNotifications.filter((item) => item.unread).length;
  shellNotificationsButton.classList.toggle('has-alert', count > 0);
  shellNotificationsButton.setAttribute('aria-label', count ? `Notifications, ${count} unread` : 'Notifications');
}

function renderShellNotifications() {
  const centerItems = notificationFilter === 'unread'
    ? shellNotifications.filter((item) => item.unread)
    : shellNotifications;
  if (notificationList) {
    notificationList.innerHTML = centerItems.length
      ? centerItems.map(notificationMarkup).join('')
      : '<div class="notification-empty"><strong>You are all caught up</strong><p>There are no unread notifications.</p></div>';
  }
  const pageItems = notificationPageUnreadOnly ? shellNotifications.filter((item) => item.unread) : shellNotifications;
  notificationPageLists().forEach((list) => {
    list.innerHTML = pageItems.length
      ? pageItems.map(notificationMarkup).join('')
      : '<div class="notification-empty"><strong>You are all caught up</strong><p>There are no unread notifications.</p></div>';
  });
  const unreadSelected = notificationFilter === 'unread';
  notificationsUnreadTab?.classList.toggle('is-active', unreadSelected);
  notificationsAllTab?.classList.toggle('is-active', !unreadSelected);
  notificationsUnreadTab?.setAttribute('aria-selected', String(unreadSelected));
  notificationsAllTab?.setAttribute('aria-selected', String(!unreadSelected));
  if (markNotificationsRead) markNotificationsRead.disabled = !shellNotifications.some((item) => item.unread);
  const unreadCount = shellNotifications.filter((item) => item.unread).length;
  const centerSummary = $('header p', notificationCenter);
  if (centerSummary) centerSummary.textContent = `${unreadCount} unread`;
  const pageFilterButton = $('[data-notification-filter="unread"]', notificationsView);
  if (pageFilterButton) {
    pageFilterButton.classList.toggle('is-active', notificationPageUnreadOnly);
    pageFilterButton.setAttribute('aria-pressed', String(notificationPageUnreadOnly));
    pageFilterButton.textContent = notificationPageUnreadOnly ? 'Show all' : 'Show unread';
  }
  $$('[data-mark-notifications-read]').forEach((button) => {
    button.disabled = unreadCount === 0;
  });
  updateNotificationButton();
}

function openNotificationCenter(trigger = shellNotificationsButton) {
  if (!notificationCenterBackdrop || !notificationCenter) {
    setView('notifications');
    return;
  }
  closeGlobalSearch(false);
  closeAccountMenu(false);
  notificationCenterRestoreTarget = trigger instanceof HTMLElement ? trigger : shellNotificationsButton;
  notificationCenterBackdrop.hidden = false;
  shellNotificationsButton?.setAttribute('aria-expanded', 'true');
  renderShellNotifications();
  window.requestAnimationFrame(() => closeNotificationCenterButton?.focus());
}

function closeNotificationCenter(restoreFocus = true) {
  if (!notificationCenterBackdrop || notificationCenterBackdrop.hidden) return;
  notificationCenterBackdrop.hidden = true;
  shellNotificationsButton?.setAttribute('aria-expanded', 'false');
  if (restoreFocus) restoreShellFocus(notificationCenterRestoreTarget, shellNotificationsButton);
  notificationCenterRestoreTarget = null;
}

function navigateGlobalSearchTarget(rawTarget) {
  const target = String(rawTarget ?? '').trim();
  const normalized = target.toLocaleLowerCase();
  const customerId = target.match(/CUS(?:T)?-\d+/i)?.[0]?.toUpperCase();
  const queryId = target.match(/QRY-[A-Z0-9-]+/i)?.[0]?.toUpperCase();
  if (customerId) {
    const customer = customers.find((item) => item.id.toUpperCase() === customerId);
    if (customer) setView('detail', customer);
    else showToast('That customer is unavailable');
    return;
  }
  if (queryId) {
    const query = queryModuleRecords.find((item) => item.id.toUpperCase() === queryId);
    if (query) openQueryDetail(query);
    else showToast('That query is unavailable');
    return;
  }
  if (normalized === 'dashboard' || normalized === 'home') setView('dashboard');
  else if (normalized === 'inbox') setView('inbox');
  else if (normalized === 'customers' || normalized.startsWith('customer')) setView('customers');
  else if (normalized === 'queries' || normalized.startsWith('query')) setView('queries');
  else if (normalized === 'tasks' || normalized.startsWith('task')) setView('tasks');
  else if (normalized === 'notifications' || normalized.startsWith('notification')) setView('notifications');
  else if (normalized === 'account') openAccountView();
  else if (normalized.startsWith('account:') || normalized.startsWith('account-') || normalized.startsWith('account/')) {
    openAccountView(normalized.replace(/^account[:/-]/, ''));
  } else {
    showToast('That area is outside this system preview');
  }
}

function setSidebarCurrent(view) {
  if (view === 'notifications' || view === 'account') return;
  const dashboardActive = view === 'dashboard';
  const inboxActive = view === 'inbox';
  const tasksActive = view === 'tasks';
  const queriesActive = ['queries', 'query-detail'].includes(view);
  const customersActive = ['customers', 'detail', 'vault', 'new-customer'].includes(view);
  dashboardNavLink.classList.toggle('is-active', dashboardActive);
  inboxNavLink.classList.toggle('is-active', inboxActive);
  tasksNavLink.classList.toggle('is-active', tasksActive);
  queryNavLink.classList.toggle('is-active', queriesActive);
  customersNavLink.classList.toggle('is-active', customersActive);
  [[dashboardNavLink, dashboardActive], [inboxNavLink, inboxActive], [tasksNavLink, tasksActive], [queryNavLink, queriesActive], [customersNavLink, customersActive]]
    .forEach(([item, active]) => {
      if (active) item.setAttribute('aria-current', 'page');
      else item.removeAttribute('aria-current');
    });
}
function setAllFinancesCurrent() {
  $$('.sidebar .nav-item').forEach((item) => {
    item.classList.remove('is-active');
    item.removeAttribute('aria-current');
  });
  const allFinancesLink = $('.sidebar a[href="#finance"]');
  allFinancesLink.classList.add('is-active');
  allFinancesLink.setAttribute('aria-current', 'page');
}

function navigateToAllFinances(event) {
  event?.preventDefault();
  const state = {
    view: activeView,
    customerId: activeView === 'detail' ? selectedCustomer.id : undefined,
    profileTab: activeView === 'detail' ? activeProfileTab : undefined,
    canGoBack: true,
    destination: 'finance',
  };
  history[location.hash === '#finance' ? 'replaceState' : 'pushState'](state, '', '#finance');
  setAllFinancesCurrent();
  showToast('Opened Operations → All finances');
  if (mobileSidebarQuery.matches) setMobileSidebarOpen(false);
}


function viewHash(view, customer) {
  if (view === 'dashboard') return '#dashboard';
  if (view === 'inbox') return '#inbox';
  if (view === 'tasks') return '#tasks';
  if (view === 'notifications') return '#notifications';
  if (view === 'account') return '#account';
  if (view === 'queries') return `#${activeQueryCategory.toLocaleLowerCase()}`;
  if (view === 'query-detail') return `#query-${selectedQuery.id}`;
  if (view === 'new-customer') return '#new-customer';
  if (view === 'customers') return '#customers';
  if (view === 'detail') return `#customer-${customer.id}`;
  return '#document-vault';
}

function navigateBack() {
  if (['customers', 'queries', 'inbox', 'tasks', 'notifications', 'account'].includes(activeView)) {
    setView('dashboard');
    return;
  }
  if (history.state?.canGoBack) {
    history.back();
    return;
  }
  // No usable browser-history step (deep link, reload, replaceState flow):
  // return to the previous view in the navigation history when one exists,
  // instead of always falling back to a default page.
  if (popPreviousViewEntry()) return;
  if (activeView === 'vault' && vaultSourceCustomer) {
    setView('detail', vaultSourceCustomer);
    return;
  }
  const fallbackView = activeView === 'query-detail'
    ? 'queries'
    : activeView === 'detail' || activeView === 'vault' || activeView === 'new-customer'
      ? 'customers'
      : 'dashboard';
  setView(fallbackView);
}
const shellViewMeta = {
  dashboard: { root: 'Workspace', current: 'Home', rootView: 'dashboard' },
  inbox: { root: 'Workspace', current: 'All inbox', rootView: 'dashboard' },
  tasks: { root: 'Workspace', current: 'All tasks', rootView: 'dashboard' },
  notifications: { root: 'Workspace', current: 'Notifications', rootView: 'dashboard' },
  account: { root: 'Workspace', current: 'Account', rootView: 'dashboard' },
  queries: { root: 'Sales', current: 'Queries', rootView: 'dashboard' },
  'query-detail': { root: 'Sales', current: 'Queries', rootView: 'dashboard' },
  'new-customer': { root: 'CRM', current: 'Customers', rootView: 'customers' },
  customers: { root: 'CRM', current: 'Customers', rootView: 'customers' },
  detail: { root: 'CRM', current: 'Customers', rootView: 'customers' },
  vault: { root: 'CRM', current: 'Customers', rootView: 'customers' },
};


function updateShellTopbar(view, customer) {
  const meta = shellViewMeta[view] ?? shellViewMeta.dashboard;
  const showsDetailCrumb = ['detail', 'vault', 'query-detail', 'new-customer'].includes(view);
  const showsVaultCustomer = view === 'vault' && Boolean(vaultSourceCustomer);
  const isWorkspaceRoot = view === 'dashboard';
  shellBreadcrumbRoot.textContent = meta.root;
  shellBreadcrumbRoot.dataset.view = meta.rootView;
  shellBreadcrumbCurrent.textContent = meta.current;
  shellBreadcrumbCurrent.classList.toggle('is-current', !showsDetailCrumb);
  if (showsDetailCrumb) shellBreadcrumbCurrent.removeAttribute('aria-current');
  else shellBreadcrumbCurrent.setAttribute('aria-current', 'page');
  shellBackButton.hidden = isWorkspaceRoot;
  shellBackButton.setAttribute('aria-label', showsDetailCrumb ? `Back from ${meta.current}` : 'Back to home');
  shellCustomerCrumb.hidden = !showsVaultCustomer;
  shellBreadcrumbCustomer.textContent = showsVaultCustomer ? vaultSourceCustomer.name : '';
  shellDetailCrumb.hidden = !showsDetailCrumb;
  shellBreadcrumbDetail.textContent = view === 'new-customer' ? 'Add customer' : view === 'detail' ? customer.name : view === 'vault' ? 'Document vault' : view === 'query-detail' ? selectedQuery.id : '';
  if (showsDetailCrumb) shellBreadcrumbDetail.setAttribute('aria-current', 'page');
  else shellBreadcrumbDetail.removeAttribute('aria-current');
  const breadcrumbTrack = shellBreadcrumbRoot.closest('.topbar-breadcrumbs');
  breadcrumbTrack.scrollLeft = showsDetailCrumb ? breadcrumbTrack.scrollWidth : 0;
  shellSearchLabel.hidden = false;
  const shellSearchText = $(':scope > span', shellSearchLabel);
  if (shellSearchText) shellSearchText.textContent = 'Search anything';
  shellSearch.placeholder = 'Search anything';
  shellSearch.value = '';
}

function setView(view, customer = selectedCustomer, updateHistory = true) {
  if (updateHistory) recordViewForBack(view, customer);
  setCustomerRowActionMenu();
  if (!customerNotesBackdrop.hidden) closeCustomerNotes(false);
  activeView = view;
  if (view === 'detail' && customer) selectedCustomer = customer;
  const pageTitles = {
    dashboard: 'Paryatech — Dashboard',
    inbox: 'Paryatech — Inbox',
    tasks: 'Paryatech — Tasks',
    notifications: 'Paryatech — Notifications',
    account: 'Paryatech — Account',
    queries: 'Paryatech — Queries',
    'query-detail': 'Paryatech — Query',
    'new-customer': 'Paryatech — Add customer',
    customers: 'Paryatech — Customers',
    vault: 'Paryatech — Document vault',
  };
  document.title = view === 'detail' ? `${customer.name} — Paryatech` : view === 'query-detail' ? `${selectedQuery.title} — Paryatech` : pageTitles[view];
  dashboardView.hidden = view !== 'dashboard';
  inboxView.hidden = view !== 'inbox';
  queriesView.hidden = view !== 'queries';
  queryDetailView.hidden = view !== 'query-detail';
  tasksView.hidden = view !== 'tasks';
  customerListView.hidden = view !== 'customers';
  customerCreateView.hidden = view !== 'new-customer';
  customerDetailView.hidden = view !== 'detail';
  documentVaultView.hidden = view !== 'vault';
  notificationsView.hidden = view !== 'notifications';
  accountView.hidden = view !== 'account';
  customerNotesShortcut.hidden = view === 'notifications' || view === 'account';
  if (!customerNotesShortcut.hidden) renderCustomerNotesShortcut(view === 'detail' ? customer : selectedCustomer);
  setSidebarCurrent(view);
  if (view === 'dashboard') updateDashboardClock();
  if (view === 'inbox') {
    renderInboxList();
    renderInboxThread();
  }
  if (view === 'tasks') renderTaskBoard();
  if (view === 'queries') renderQueryModule();
  if (view === 'query-detail') renderQueryDetail();
  if (view === 'detail') renderCustomerDetail(customer);
  if (view === 'vault') renderVault();
  if (view === 'notifications') renderShellNotifications();
  if (view === 'account') activateAccountSection($('[data-account-section].is-active', accountView)?.dataset.accountSection ?? 'profile');
  updateShellTopbar(view, customer);
  if (updateHistory) {
    const state = { view, canGoBack: true };
    if (view === 'queries') state.queryCategory = activeQueryCategory;
    if (view === 'query-detail') Object.assign(state, { queryId: selectedQuery.id, queryDetailTab: activeQueryDetailTab });
    if (view === 'detail') Object.assign(state, { customerId: customer.id, profileTab: activeProfileTab });
    if (view === 'vault' && vaultSourceCustomer) state.sourceCustomerId = vaultSourceCustomer.id;
    history.pushState(state, '', viewHash(view, customer));
  }
  $('#mainContent').scrollTo({ top: 0, left: 0, behavior: 'auto' });
}

function openDocumentVault(customer = null) {
  vaultSourceCustomer = customer;
  vaultSearch.value = customer?.name ?? '';
  vaultPage = 1;
  expandedVaultCustomer = customer?.id ?? null;
  setView('vault', customer ?? selectedCustomer);
}

function openCustomerDocuments(customer) {
  setView('detail', customer);
  setProfileTab('documents');
}
function customerFinanceSummary(customer) {
  const addedBookingValue = (customer.bookings ?? []).reduce((total, booking) => total + Number(booking.sellingPrice || 0), 0);
  const bookingValue = Number(customer.value || 0) + addedBookingValue;
  const seededEntries = customerFinanceEntries.get(customer.id);
  const fallbackDebited = Math.max(0, Number(customer.value || 0) - Number(customer.outstanding ?? customer.value ?? 0));
  const sourceEntries = seededEntries ?? (fallbackDebited > 0
    ? [{ id: `FIN-${customer.id}`, date: '2026-01-07', description: 'Payment received', detail: 'Customer payment', amount: fallbackDebited, direction: 'Debit' }]
    : []);
  let runningOutstanding = bookingValue;
  const entries = sourceEntries.map((entry) => {
    runningOutstanding += entry.direction === 'Credit' ? entry.amount : -entry.amount;
    return { ...entry, outstanding: Math.max(0, runningOutstanding) };
  });
  const credited = entries.reduce((total, entry) => total + (entry.direction === 'Credit' ? entry.amount : 0), 0);
  const debited = entries.reduce((total, entry) => total + (entry.direction === 'Debit' ? entry.amount : 0), 0);
  return {
    bookingValue,
    credited,
    debited,
    outstanding: Math.max(0, bookingValue - debited + credited),
    entries: [...entries].reverse(),
  };
}

function renderCustomerFinance(customer) {
  const summary = customerFinanceSummary(customer);
  $('#financeTotalBooked').textContent = formatCurrency(summary.bookingValue);
  $('#financeTotalCredited').textContent = formatCurrency(summary.credited);
  $('#financeTotalDebited').textContent = formatCurrency(summary.debited);
  $('#financeOutstanding').textContent = formatCurrency(summary.outstanding);
  $('#financePaymentHistoryCount').textContent = summary.entries.length;
  $('#financeLedgerRows').innerHTML = summary.entries.length
    ? summary.entries.map((entry) => {
      const directionClass = entry.direction.toLocaleLowerCase();
      return `
        <tr>
          <td>${escapeHTML(customerDateLabel(entry.date))}</td>
          <td class="finance-description"><strong>${escapeHTML(entry.description)}</strong><small>${escapeHTML(entry.detail)}</small></td>
          <td class="finance-amount is-${directionClass}">${escapeHTML(formatCurrency(entry.amount))}</td>
          <td><span class="finance-entry-type is-${directionClass}">${escapeHTML(entry.direction)}</span></td>
          <td class="finance-outstanding">${escapeHTML(formatCurrency(entry.outstanding))}</td>
        </tr>
      `;
    }).join('')
    : '<tr><td class="finance-empty-state" colspan="5">No payment or refund entries yet.</td></tr>';
  renderCustomerBankDetails(customer);
}

let bankModalMode = 'add';
let bankModalReturnFocus = null;

function renderCustomerBankDetails(customer = selectedCustomer) {
  const grid = $('#bankDetailsGrid');
  const emptyState = $('#bankEmptyState');
  if (!grid || !emptyState || !customer) return;
  const account = preferredBankAccount(customer);
  grid.hidden = !account;
  emptyState.hidden = Boolean(account);
  $('#editBankDetailsButton').disabled = !account;
  if (!account) return;
  grid.innerHTML = `
    <div class="bank-cell">
      <span>Bank</span>
      <div class="bank-name-value">
        <span class="bank-icon-tile"><svg><use href="#i-nav-finance" /></svg></span>
        <strong>${escapeHTML(account.bankName)}</strong>
        ${account.preferred ? '<span class="bank-preferred-pill">Preferred account</span>' : ''}
        <button class="bank-icon-button" type="button" data-bank-edit aria-label="Edit bank details"><svg><use href="#i-edit" /></svg></button>
      </div>
    </div>
    <div class="bank-cell"><span>Account holder</span><strong>${escapeHTML(account.holderName)}</strong></div>
    <div class="bank-cell"><span>Account type</span><strong>${escapeHTML(account.accountType || '—')}</strong></div>
    <div class="bank-cell"><span>Branch</span><strong>${escapeHTML(account.branch || '—')}</strong></div>
    <div class="bank-cell"><span>Account number</span><div class="bank-value-row"><strong>${escapeHTML(account.accountNumber)}</strong><button class="bank-icon-button" type="button" data-bank-copy="${escapeHTML(account.accountNumber)}" aria-label="Copy account number"><svg><use href="#i-copy" /></svg></button></div></div>
    <div class="bank-cell"><span>IFSC code</span><div class="bank-value-row"><strong>${escapeHTML(account.ifscCode)}</strong><button class="bank-icon-button" type="button" data-bank-copy="${escapeHTML(account.ifscCode)}" aria-label="Copy IFSC code"><svg><use href="#i-copy" /></svg></button></div></div>`;
}

function openBankModal(mode = 'add', trigger = null) {
  const customer = selectedCustomer;
  if (!customer) return;
  bankModalMode = mode;
  bankModalReturnFocus = trigger;
  const account = mode === 'edit' ? preferredBankAccount(customer) : null;
  if (mode === 'edit' && !account) return;
  $('#bankModalTitle').textContent = mode === 'edit' ? 'Edit bank details' : 'Add bank details';
  $('#bankNameInput').value = account?.bankName ?? '';
  $('#bankHolderInput').value = account?.holderName ?? customer.contactName ?? customer.name;
  $('#bankAccountNumberInput').value = account?.accountNumber ?? '';
  $('#bankIfscInput').value = account?.ifscCode ?? '';
  $('#bankAccountTypeInput').value = account?.accountType ?? '';
  $('#bankBranchInput').value = account?.branch ?? '';
  $('#bankPreferredInput').checked = account?.preferred ?? bankAccountsFor(customer).length === 0;
  openModal($('#bankModalBackdrop'), $('#bankNameInput'));
}

function closeBankModal() {
  closeModal($('#bankModalBackdrop'), $('#bankModalForm'), bankModalReturnFocus);
  bankModalMode = 'add';
  bankModalReturnFocus = null;
}

function persistBankModal() {
  const customer = selectedCustomer;
  if (!customer) return;
  const bankName = $('#bankNameInput').value.trim();
  const holderName = $('#bankHolderInput').value.trim();
  const accountNumber = $('#bankAccountNumberInput').value.trim();
  const ifscCode = $('#bankIfscInput').value.trim().toUpperCase();
  if (!bankName || !holderName || !accountNumber || !ifscCode) {
    showToast('Fill the required bank fields');
    return;
  }
  const accounts = bankAccountsFor(customer);
  const preferred = $('#bankPreferredInput').checked;
  const wasEdit = bankModalMode === 'edit';
  if (preferred) accounts.forEach((item) => { item.preferred = false; });
  if (wasEdit) {
    const account = preferredBankAccount(customer);
    if (!account) return;
    Object.assign(account, {
      bankName,
      holderName,
      accountType: $('#bankAccountTypeInput').value,
      branch: $('#bankBranchInput').value.trim(),
      accountNumber,
      ifscCode,
      preferred: preferred || accounts.length <= 1,
    });
  } else {
    accounts.push({
      id: `BANK-${Date.now()}`,
      bankName,
      holderName,
      accountType: $('#bankAccountTypeInput').value,
      branch: $('#bankBranchInput').value.trim(),
      accountNumber,
      ifscCode,
      preferred: preferred || accounts.length === 0,
    });
  }
  closeBankModal();
  renderCustomerBankDetails(customer);
  showToast(wasEdit ? 'Bank details updated' : 'Bank details added');
}

async function copyBankValue(value, trigger) {
  try {
    await navigator.clipboard.writeText(value);
    showToast('Copied to clipboard');
  } catch {
    const fallback = document.createElement('textarea');
    fallback.value = value;
    document.body.appendChild(fallback);
    fallback.select();
    document.execCommand('copy');
    fallback.remove();
    showToast('Copied to clipboard');
  }
  trigger?.focus();
}


function renderDocumentsTabPill(customer) {
  const pill = document.getElementById('documentsTabCount');
  if (!pill || !customer) return;
  const pending = pendingReviewDocuments(customer.id).length;
  if (pending > 0) {
    pill.className = 'detail-tab-count';
    pill.textContent = pending;
    pill.title = `${pending} document approval${pending === 1 ? '' : 's'} pending`;
  } else {
    pill.className = 'category-tab-count';
    pill.textContent = vaultCustomerSummary(customer).documents;
    pill.title = '';
  }
}

function renderProfileTabCounts(customer) {
  if (!customer) return;
  const setCount = (id, value) => {
    const pill = document.getElementById(id);
    if (pill) pill.textContent = value;
  };
  const travellerProfiles = travellerProfilesByCustomer.get(customer.id);
  setCount('travellersTabCount', travellerProfiles?.length ?? Number(customer.travellers || 0));
  renderDocumentsTabPill(customer);
  const pipelineTotal = queryModuleRecords.filter((query) => query.customerId === customer.id).length
    + customerProposalRecords.filter((proposal) => proposal.customerId === customer.id).length
    + customerVouchersFor(customer).length;
  setCount('pipelineTabCount', pipelineTotal);
  setCount('financeTabCount', customerFinanceSummary(customer).entries.length);
  setCount('tasksTabCount', customerTasksFor(customer).length);
  setCount('communicationTabCount', customerEmailMessageCount(customer));
}

function renderCustomerDetail(customer) {
  ensureCustomerDetailData(customer);
  selectedCustomer = customer;
  const serial = customerIdNumber(customer);
  const travellerCount = customer.travellers;
  const groupType = customer.groupType ?? (customer.category === 'B2C' ? 'Family' : customer.category === 'B2B' ? 'Corporate' : 'Solo');
  const documents = vaultCustomerSummary(customer).documents;
  const destinations = ['Thailand Beach & Bangkok', 'Singapore City & Sentosa', 'Himachal Hills, Your Way', 'Dubai City Escape', 'Kerala Backwaters'];
  const destination = destinations[(serial - 1) % destinations.length];
  const { phone, email } = customerContactDetails(customer);
  const createdDate = customerCreatedDateLabel(customer);

  renderAvatar($('#detailAvatar'), customer);
  $('#customerDetailTitle').textContent = customer.name;
  $('#detailId').textContent = customer.id;
  $('#detailCategory').textContent = customer.category;
  $('#detailLocation').textContent = `${customer.location}, India`;
  $('#detailCustomerCreatedDate').textContent = createdDate;
  $('#detailTier').textContent = customer.tier;
  $('#detailTier').className = `tier tier-${customer.tier.toLowerCase()}`;
  $('#detailTravellers').textContent = travellerCount;
  $('#detailValue').textContent = formatCurrency(customer.value);
  $('#detailTrips').textContent = customer.trips ?? 0;
  $('#detailDocuments').textContent = `${documents} / ${documents} valid`;
  $('#detailActivityTrip').textContent = destination;
  $('#detailContactName').textContent = customer.contactName;
  $('#detailPhone').textContent = phone;
  $('#detailEmail').textContent = email;
  $('#detailContactLocation').textContent = `${customer.contactLocation}, India`;
  $('#detailProfileCode').textContent = customer.id;
  $('#detailProfileCategory').textContent = customer.category;
  $('#detailGroup').textContent = groupType;
  $('#detailProfileLocation').textContent = `${customer.location}, India`;
  $('#detailProfileTier').textContent = customer.tier;
  $('#detailProfileTier').className = `tier tier-${customer.tier.toLowerCase()}`;
  $('#detailSource').textContent = customer.source;
  $('#detailProfileCreatedDate').textContent = createdDate;
  renderCustomerOverviewDetails(customer);
  renderCustomerTasks(customer);
  renderReferralOverview(customer);
  renderTravellerTab(customer, { phone, email });
  renderDocumentRequestState(customer);
  renderCustomerPipeline(customer);
  renderCustomerFinance(customer);
  renderProfileTabCounts(customer);
  profileTaskSearchQuery = '';
  profileTaskPage = 1;
  Object.assign(profileTaskFilters, { priority: 'all', entity: 'all', assignee: 'all', sort: 'created-desc', from: '', to: '' });
  Object.assign(pendingProfileTaskFilters, profileTaskFilters);
  if (profileTaskSearch) profileTaskSearch.value = '';
  renderProfileTasks(customer);
  customerMailFilter = 'all';
  selectedCustomerMailIndex = null;
  closeCustomerMailComposer();
  setProfileTab('overview');
  renderCustomerNotesShortcut(customer);
}

function setProfileTab(tabName, moveFocus = false) {
  const allowedTabs = new Set(['overview', 'travellers', 'documents', 'pipeline', 'finance', 'tasks', 'communication']);
  const nextTab = allowedTabs.has(tabName) ? tabName : 'overview';
  activeProfileTab = nextTab;
  $$('.detail-tab', customerDetailView).forEach((tab) => {
    const active = tab.dataset.profileTab === nextTab;
    tab.classList.toggle('is-active', active);
    tab.setAttribute('aria-selected', String(active));
    tab.tabIndex = active ? 0 : -1;
    if (active && moveFocus) tab.focus();
  });
  $$('[data-profile-panel]', customerDetailView).forEach((panel) => {
    const active = panel.dataset.profilePanel === nextTab;
    panel.hidden = !active;
    panel.classList.toggle('is-active', active);
  });
  if (nextTab === 'tasks') renderProfileTasks(selectedCustomer);
  if (nextTab === 'communication') renderCustomerMailWorkspace();
  $('#mainContent').scrollTo({ top: 0, left: 0, behavior: 'auto' });
  if (activeView === 'detail' && history.state?.view === 'detail' && history.state.customerId === selectedCustomer.id) {
    history.replaceState({ ...history.state, customerId: selectedCustomer.id, profileTab: nextTab }, '', location.href);
  }
}


function vaultDocumentRecords(customer) {
  if (!customer) return [];
  const vaultCustomer = vaultCustomers.find((item) => item.id === customer.id);
  return [...(vaultCustomer?.documents ?? []), ...(uploadedRequestDocuments.get(customer.id) ?? [])];
}

function vaultCustomerSummary(customer) {
  if (!customer) return { travellers: 0, documents: 0, expiring: 0 };
  const profileCustomer = customers.find((item) => item.id === customer.id) ?? customer;
  const documents = vaultDocumentRecords(profileCustomer);
  return {
    travellers: Number(profileCustomer.travellers || 0),
    documents: documents.length,
    expiring: documents.filter((documentItem) => documentStatus(documentItem) === 'Expiring soon').length,
  };
}

function filteredVaultCustomers() {
  const query = vaultSearch.value.trim().toLocaleLowerCase();
  return vaultCustomers.filter((customer) => {
    const selectedTiers = tierSelection(appliedVaultFilters.tier);
    if (selectedTiers.length && !selectedTiers.some((tier) => customerTierMatches(customer, tier))) return false;
    if (appliedVaultFilters.category && customer.category !== appliedVaultFilters.category) return false;
    if (appliedVaultFilters.expiring && vaultCustomerSummary(customer).expiring === 0) return false;
    if (!query) return true;
    const documents = vaultDocumentRecords(customer);
    return [customer.name, customer.id, customer.category, ...customerTierList(customer), customer.location, customerLocationLabel(customer)]
      .some((value) => String(value).toLocaleLowerCase().includes(query))
      || travellerNamesForCustomer(customer).some((name) => name.toLocaleLowerCase().includes(query))
      || documents.some((documentItem) => [documentItem.traveller, documentItem.name, documentItem.type, documentItem.status]
        .some((value) => String(value || '').toLocaleLowerCase().includes(query)));
  });
}

function vaultDocumentsMarkup(customer) {
  const profileCustomer = customers.find((item) => item.id === customer.id) ?? customer;
  const groups = [...buildTravellerDocumentGroups(profileCustomer), ...buildGroupDocumentGroups(profileCustomer)];
  renderedTravellerDocuments = groups.flatMap((group) => group.documents.filter((documentItem) => documentItem.status !== 'Missing'));
  return `<div class="vault-documents" id="vault-customer-documents-${escapeHTML(customer.id)}">
    <div class="traveller-document-hierarchy">
      ${travellerDocumentGroupsMarkup(groups, `vault-${customer.id}`, '')}
    </div>
  </div>`;
}

function renderVault() {
  if (vaultSearchVisible && document.activeElement !== vaultSearchVisible && vaultSearchVisible.value !== vaultSearch.value) {
    vaultSearchVisible.value = vaultSearch.value;
  }
  const matchingCustomers = filteredVaultCustomers();
  const totalPages = Math.max(1, Math.ceil(matchingCustomers.length / VAULT_PAGE_SIZE));
  vaultPage = Math.max(1, Math.min(vaultPage, totalPages));
  const start = (vaultPage - 1) * VAULT_PAGE_SIZE;
  const rows = matchingCustomers.slice(start, start + VAULT_PAGE_SIZE);
  const summaries = vaultCustomers.map(vaultCustomerSummary);
  const vaultTotalDocuments = $('#vaultTotalDocuments');
  if (vaultTotalDocuments) vaultTotalDocuments.textContent = summaries.reduce((sum, item) => sum + item.documents, 0);
  const vaultTotalCustomers = $('#vaultTotalCustomers');
  if (vaultTotalCustomers) vaultTotalCustomers.textContent = vaultCustomers.length;
  const vaultTotalTravellers = $('#vaultTotalTravellers');
  if (vaultTotalTravellers) vaultTotalTravellers.textContent = summaries.reduce((sum, item) => sum + item.travellers, 0);
  const vaultExpiringDocuments = $('#vaultExpiringDocuments');
  if (vaultExpiringDocuments) vaultExpiringDocuments.textContent = summaries.reduce((sum, item) => sum + item.expiring, 0);
  vaultList.innerHTML = rows.map((customer) => {
    const expanded = expandedVaultCustomer === customer.id;
    const summary = vaultCustomerSummary(customer);
    return `<article class="vault-customer${expanded ? ' is-expanded' : ''}" data-vault-customer="${escapeHTML(customer.id)}">
      <button class="vault-customer-head" type="button" data-vault-toggle="${escapeHTML(customer.id)}" aria-expanded="${expanded}" aria-controls="vault-customer-documents-${escapeHTML(customer.id)}">
        <span class="vault-customer-person"><span class="avatar vault-avatar">${avatarMarkup(customer)}</span><span class="vault-person-copy"><span class="vault-name-line"><strong>${escapeHTML(customer.name)}</strong><span class="tier tier-${customer.tier.toLowerCase()}">${escapeHTML(customer.tier)}</span></span><span class="vault-customer-meta"><span class="customer-id">${escapeHTML(customer.id)}</span><i>•</i><span class="kind-badge">${escapeHTML(customer.category)}</span><i>•</i><span>${escapeHTML(customer.location)}, India</span></span></span></span>
        <span class="vault-metric"><span>Travellers</span><strong>${summary.travellers}</strong></span>
        <span class="vault-metric"><span>Documents</span><strong>${summary.documents}</strong></span>
        <span class="vault-metric"><span>Expiring</span><strong>${summary.expiring}</strong></span>
        <span class="vault-toggle" aria-hidden="true"><svg><use href="#i-chevron-right" /></svg></span>
      </button>
      ${expanded ? vaultDocumentsMarkup(customer) : ''}
    </article>`;
  }).join('');
  const hasRows = matchingCustomers.length > 0;
  vaultEmptyState.hidden = hasRows;
  vaultList.hidden = !hasRows;
  vaultTableHead.hidden = !hasRows;
  vaultPagination.innerHTML = totalPages > 1
    ? paginationMarkup(vaultPage, totalPages, matchingCustomers.length, VAULT_PAGE_SIZE, 'vault-page')
    : '';
  vaultPagination.hidden = !hasRows || totalPages <= 1;
}

function openModal(backdrop, focusTarget) {
  backdrop.hidden = false;
  document.body.style.overflow = 'hidden';
  enhanceThemedControls(backdrop);
  syncThemedControls(backdrop);
  window.setTimeout(() => focusTarget?.focus(), 0);
}

function closeModal(backdrop, form, returnFocus) {
  backdrop.hidden = true;
  document.body.style.overflow = '';
  form?.reset();
  syncThemedControls(backdrop);
  returnFocus?.focus();
}

function customerNotesFor(customer = selectedCustomer) {
  if (customer && typeof customer === 'object' && customer.id && activeView === 'detail') {
    return customerNotesByCustomer.get(customer.id) ?? [];
  }
  return notesForContext();
}

function renderCustomerNotesShortcut(customer = selectedCustomer) {
  const ctx = notesContext(activeView, customer);
  const notes = notesForContext(ctx);
  const count = notes.length;
  const pinnedCount = notes.filter((note) => note.pinned).length;
  if (customerNotesLabel) customerNotesLabel.textContent = ctx.title;
  const badgeCount = ctx.kind === 'customer' ? pinnedCount : count;
  customerNotesShortcutCount.textContent = badgeCount;
  customerNotesShortcutCount.hidden = badgeCount === 0;
  customerNotesShortcutCount.title = ctx.kind === 'customer'
    ? `${pinnedCount} pinned ${pinnedCount === 1 ? 'note' : 'notes'}`
    : `${count} ${count === 1 ? 'note' : 'notes'}`;
  const contextName = ctx.kind === 'customer' ? customer?.name ?? 'customer' : ctx.eyebrow;
  customerNotesButton.setAttribute('aria-label', `${ctx.title} for ${contextName}, ${count} total and ${pinnedCount} pinned`);
  const addButton = $('#addCustomerNoteButton');
  if (addButton) addButton.setAttribute('aria-label', `Write a note in ${ctx.title}`);
}

function formatCustomerNoteDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const day = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' }).format(date);
  const time = new Intl.DateTimeFormat('en-IN', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(date);
  return `${day} · ${time}`;
}

function renderCustomerNotes() {
  const ctx = notesContext();
  const query = customerNotesSearch.value.trim().toLocaleLowerCase();
  const allNotes = [...notesForContext(ctx)];
  const notes = allNotes
    .filter((note) => {
      if (activeCustomerNoteFilter === 'pinned' && !note.pinned) return false;
      if (activeCustomerNoteFilter === 'mine' && !note.mine) return false;
      if (!query) return true;
      return [note.body, note.author, note.relation]
        .some((value) => String(value || '').toLocaleLowerCase().includes(query));
    })
    .sort((a, b) => Number(b.pinned) - Number(a.pinned)
      || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  $('#customerNotesEyebrow').textContent = ctx.eyebrow;
  $('#customerNotesTitle').textContent = customerNoteForm.classList.contains('is-active') ? 'Write a note' : ctx.title;
  customerNoteText.placeholder = ctx.placeholder;
  const pinLabel = $('.customer-note-pin', customerNoteForm);
  if (pinLabel && pinLabel.lastChild) pinLabel.lastChild.textContent = ctx.pinLabel;
  const searchWrap = $('.customer-notes-search', customerNotesBrowse);
  const filtersWrap = $('.customer-notes-filters', customerNotesBrowse);
  const hasAnyNotes = allNotes.length > 0;
  if (searchWrap) searchWrap.style.display = hasAnyNotes ? '' : 'none';
  if (filtersWrap) filtersWrap.style.display = hasAnyNotes ? '' : 'none';
  if (!hasAnyNotes) {
    customerNotesEmpty.hidden = false;
    customerNotesEmpty.textContent = ctx.emptyAll;
  } else {
    customerNotesEmpty.hidden = notes.length > 0;
    customerNotesEmpty.textContent = 'No notes match.';
  }
  customerNotesList.innerHTML = notes.map((note) => `
    <article class="customer-note-item${note.pinned ? ' is-pinned' : ''}" data-customer-note="${escapeHTML(note.id)}">
      <div class="customer-note-copy">
        ${note.pinned ? '<span class="customer-note-pinned-mark" aria-label="Pinned"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4v6l3 3v2h-5v5l-1 1-1-1v-5H4v-2l3-3V4H6V2h10v2z"/></svg></span>' : ''}
        <div>
          <p>${escapeHTML(note.body)}</p>
          <div class="customer-note-meta">
            <strong>${escapeHTML(note.author)}</strong>
            <span>·</span>
            <time datetime="${escapeHTML(note.createdAt)}">${escapeHTML(formatCustomerNoteDate(note.createdAt))}</time>
            ${note.relation ? `<span>·</span><span class="customer-note-relation">${escapeHTML(note.relation)}</span>` : ''}
          </div>
          <div class="customer-note-actions">
            <button type="button" data-customer-note-action="pin">${note.pinned ? 'Unpin' : 'Pin'}</button>
            <button type="button" data-customer-note-action="task">Add task</button>
            <button class="customer-note-delete" type="button" data-customer-note-action="delete">Delete</button>
          </div>
        </div>
      </div>
    </article>
  `).join('');
  document.querySelectorAll('[data-customer-note-filter]').forEach((button) => {
    const active = button.dataset.customerNoteFilter === activeCustomerNoteFilter;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  renderCustomerNotesShortcut();
}

function setCustomerNoteRelated(value = '') {
  customerNoteRelatedSelection = value;
  customerNoteRelatedValue.textContent = value || 'Nothing specific';
  customerNoteRelatedMenu.querySelectorAll('[data-customer-note-related]').forEach((option) => {
    const active = option.dataset.customerNoteRelated === value;
    option.classList.toggle('is-active', active);
    option.setAttribute('aria-selected', String(active));
  });
}

function closeCustomerNoteRelatedMenu() {
  customerNoteRelatedMenu.hidden = true;
  customerNoteRelatedButton.setAttribute('aria-expanded', 'false');
}

function resetCustomerNoteComposer() {
  customerNoteForm.reset();
  customerNotePinned.setAttribute('aria-checked', 'false');
  setCustomerNoteRelated('');
  closeCustomerNoteRelatedMenu();
  saveCustomerNote.disabled = true;
}

function setCustomerNotesMode(mode, moveFocus = true) {
  const composing = mode === 'compose';
  if (composing && !customerNoteForm.classList.contains('is-active')) resetCustomerNoteComposer();
  customerNotesBrowse.classList.toggle('is-active', !composing);
  customerNoteForm.classList.toggle('is-active', composing);
  const ctx = notesContext();
  $('#customerNotesTitle').textContent = composing ? 'Write a note' : ctx.title;
  customerNotesModeButton.textContent = composing ? 'All notes' : 'Write a note';
  if (!composing) renderCustomerNotes();
  else {
    customerNoteText.placeholder = ctx.placeholder;
    const pinLabel = $('.customer-note-pin', customerNoteForm);
    if (pinLabel && pinLabel.lastChild) pinLabel.lastChild.textContent = ctx.pinLabel;
  }
  if (moveFocus) {
    if (composing) customerNoteText.focus();
    else if (notesForContext().length > 0) customerNotesSearch.focus();
    else customerNotesModeButton.focus();
  }
}

function positionCustomerNotes() {
  const anchor = customerNotesShortcut.getBoundingClientRect();
  const width = customerNotesPopover.offsetWidth;
  const height = customerNotesPopover.offsetHeight;
  const gap = 10;
  const pad = 12;
  let left = anchor.right + gap;
  if (left + width > window.innerWidth - pad) left = anchor.left - width - gap;
  left = Math.max(pad, Math.min(left, window.innerWidth - pad - width));
  let top = anchor.top;
  if (top + height > window.innerHeight - pad) top = window.innerHeight - pad - height;
  top = Math.max(pad, top);
  customerNotesPopover.style.left = `${Math.round(left)}px`;
  customerNotesPopover.style.top = `${Math.round(top)}px`;
  customerNotesPopover.style.transformOrigin = left > anchor.left ? 'top left' : 'top right';
}

function openCustomerNotes(mode, trigger) {
  customerNotesReturnFocus = trigger;
  customerNotesSearch.value = '';
  activeCustomerNoteFilter = 'all';
  customerNotesButton.setAttribute('aria-expanded', 'true');
  customerNotesBackdrop.hidden = false;
  customerNotesBackdrop.setAttribute('aria-hidden', 'false');
  setCustomerNotesMode(mode, false);
  renderCustomerNotes();
  positionCustomerNotes();
  void customerNotesPopover.offsetWidth;
  customerNotesBackdrop.classList.add('is-open');
  if (mode === 'compose') customerNoteText.focus();
  else if (notesForContext().length > 0) customerNotesSearch.focus();
  else customerNotesModeButton.focus();
}

function closeCustomerNotes(restoreFocus = true) {
  const returnFocus = customerNotesReturnFocus;
  customerNotesButton.setAttribute('aria-expanded', 'false');
  closeCustomerNoteRelatedMenu();
  customerNotesBackdrop.classList.remove('is-open');
  customerNotesBackdrop.setAttribute('aria-hidden', 'true');
  customerNotesBackdrop.hidden = true;
  if (restoreFocus) returnFocus?.focus();
  customerNotesReturnFocus = null;
}

function persistCustomerNote(event) {
  event.preventDefault();
  if (!customerNoteForm.reportValidity()) return;
  const body = customerNoteText.value.trim();
  if (!body) return;
  const ctx = notesContext();
  const notes = [...notesForContext(ctx)];
  notes.unshift({
    id: `NOTE-${Date.now()}`,
    body,
    author: 'Rishi Charan',
    createdAt: new Date().toISOString(),
    relation: customerNoteRelatedSelection,
    pinned: customerNotePinned.getAttribute('aria-checked') === 'true',
    mine: true,
  });
  persistNotesForContext(ctx, notes);
  setCustomerNotesMode('browse');
  showToast('Note added');
}

function updateCustomerNote(noteId, update) {
  const ctx = notesContext();
  const notes = notesForContext(ctx);
  const nextNotes = notes.map((note) => (note.id === noteId ? update(note) : note));
  persistNotesForContext(ctx, nextNotes);
  renderCustomerNotes();
}

function deleteCustomerNote(noteId) {
  const ctx = notesContext();
  persistNotesForContext(ctx, notesForContext(ctx).filter((note) => note.id !== noteId));
  renderCustomerNotes();
  showToast('Note deleted');
}

function createTaskFromCustomerNote(note) {
  const ctx = notesContext();
  const isCustomerContext = ctx.kind === 'customer';
  const customer = selectedCustomer;
  closeCustomerNotes(false);
  if (isCustomerContext && customer) {
    openTaskModal({
      draft: {
        title: `Follow up with ${customer.name}`,
        description: note.body,
        entityType: 'Customer',
        entity: customer.name,
        followUp: true,
      },
      returnFocus: customerNotesButton,
    });
    return;
  }
  openTaskModal({
    draft: {
      title: 'Follow up on note',
      description: note.body,
      followUp: true,
    },
    returnFocus: customerNotesButton,
  });
}

function setCustomerActionMenu(open, moveFocus = false) {
  customerActionMenu.hidden = !open;
  customerActionMenuButton.setAttribute('aria-expanded', String(open));
  if (open && moveFocus) window.setTimeout(() => $('#editCustomerAction').focus(), 0);
}

function setCustomerRowActionMenu(button = null, moveFocus = false) {
  if (customerRowMenuReturnFocus) customerRowMenuReturnFocus.setAttribute('aria-expanded', 'false');
  customerRowActionMenu.hidden = true;
  customerRowMenuReturnFocus = null;
  if (!button) return;

  const customer = customers.find((item) => item.id === button.dataset.customerMenu);
  if (!customer) return;
  selectedCustomer = customer;
  customerRowMenuReturnFocus = button;
  button.setAttribute('aria-expanded', 'true');
  customerRowActionMenu.hidden = false;

  const buttonRect = button.getBoundingClientRect();
  const menuRect = customerRowActionMenu.getBoundingClientRect();
  const viewportGutter = 12;
  const left = Math.max(viewportGutter, Math.min(buttonRect.right - menuRect.width, window.innerWidth - menuRect.width - viewportGutter));
  const hasRoomBelow = window.innerHeight - buttonRect.bottom >= menuRect.height + 8;
  const top = hasRoomBelow
    ? buttonRect.bottom + 8
    : Math.max(viewportGutter, buttonRect.top - menuRect.height - 8);
  customerRowActionMenu.style.left = `${left}px`;
  customerRowActionMenu.style.top = `${top}px`;
  if (moveFocus) window.setTimeout(() => $('#editCustomerRowAction').focus(), 0);
}

function openCustomerEditor(trigger) {
  const customer = selectedCustomer;
  const { phone, email } = customerContactDetails(customer);
  setCustomerActionMenu(false);
  setCustomerRowActionMenu();
  customerEditName.value = customer.name;
  customerEditCode.value = customer.id;
  customerEditCategory.value = customer.category;
  customerEditTiers.innerHTML = tierEditOptionsMarkup(customer);
  customerEditLocation.value = customer.location;
  customerEditGroupType.value = customer.groupType ?? (customer.category === 'B2C' ? 'Family' : customer.category === 'B2B' ? 'Corporate' : 'Other');
  customerEditPhone.value = phone;
  customerEditEmail.value = email;
  customerEditValue.value = customer.value;
  customerEditOutstanding.value = customer.outstanding ?? 0;
  customerEditBackdrop._returnFocus = trigger;
  openModal(customerEditBackdrop, customerEditName);
}

function closeCustomerEditor() {
  closeModal(customerEditBackdrop, customerEditForm, customerEditBackdrop._returnFocus);
}

function profileEditOptions(options, selected) {
  return options.map((option) => `<option${option === selected ? ' selected' : ''}>${escapeHTML(option)}</option>`).join('');
}

function openProfileSectionEditor(section, trigger, dateKey = '') {
  const customer = ensureCustomerDetailData(selectedCustomer);
  const { phone, email } = customerContactDetails(customer);
  const titles = {
    contact: ['Edit primary contact', 'Update the contact details used by the team.'],
    profile: ['Edit profile', 'Update the customer fields shown in this profile.'],
    preferences: ['Edit preferences', 'Record the customer’s travel and accessibility preferences.'],
    dates: ['Edit important dates', 'Update every date tracked for this customer, including a custom date.'],
  };
  activeProfileEditSection = section;
  activeProfileDateKey = dateKey;
  profileEditBackdrop._returnFocus = trigger;
  $('#profileEditTitle').textContent = titles[section][0];
  $('#profileEditDescription').textContent = titles[section][1];

  if (section === 'contact') {
    profileEditFields.innerHTML = `
      <div class="field-grid">
        <label class="field"><span>Contact name <b aria-hidden="true">*</b></span><input name="contactName" type="text" value="${escapeHTML(customer.contactName)}" required /></label>
        <label class="field"><span>Phone</span><input name="phone" type="tel" value="${escapeHTML(phone)}" /></label>
      </div>
      <label class="field"><span>Email</span><input name="email" type="email" value="${escapeHTML(email)}" /></label>
      <label class="field"><span>Location</span><input name="contactLocation" type="text" value="${escapeHTML(customer.contactLocation)}" /></label>`;
  } else if (section === 'profile') {
    const groupType = customer.groupType ?? (customer.category === 'B2C' ? 'Family' : customer.category === 'B2B' ? 'Corporate' : 'Other');
    profileEditFields.innerHTML = `
      <div class="field-grid">
        <label class="field"><span>Customer code</span><input name="code" type="text" value="${escapeHTML(customer.id)}" readonly /></label>
        <label class="field"><span>Category</span><select name="category">${profileEditOptions(['B2C', 'B2B', 'Sub-Agent', 'Other'], customer.category)}</select></label>
      </div>
      <div class="field-grid">
        <label class="field"><span>Group</span><select name="groupType">${profileEditOptions(['Family', 'Friends', 'Corporate', 'Educational', 'Religious', 'Solo', 'Other'], groupType)}</select></label>
        <label class="field"><span>Location <b aria-hidden="true">*</b></span><input name="location" type="text" value="${escapeHTML(customer.location)}" required /></label>
      </div>
      <div class="field-grid">
        <fieldset class="tier-options tier-options-edit"><legend class="sr-only">Customer tiers</legend>${tierEditOptionsMarkup(customer)}</fieldset>
        <label class="field"><span>Source</span><select name="source">${profileEditOptions(['Website', 'Referral', 'Walk-in', 'Campaign'], customer.source)}</select></label>
      </div>
      <label class="field"><span>Customer created date</span><input type="text" value="${escapeHTML(customerCreatedDateLabel(customer))}" readonly /></label>`;
  } else if (section === 'preferences') {
    profileEditFields.innerHTML = `
      <div class="field">
        <span id="profilePreferenceInputLabel">Travel preferences / interest</span>
        <div class="preference-typeahead" id="profilePreferenceTypeahead">
          <div class="preference-combobox">
            <svg aria-hidden="true"><use href="#i-search" /></svg>
            <input id="profilePreferenceInput" type="text" placeholder="e.g. Beach, Boutique, Vegetarian" autocomplete="off" role="combobox" aria-expanded="false" aria-controls="profilePreferenceSuggestions" aria-autocomplete="list" aria-labelledby="profilePreferenceInputLabel" />
          </div>
          <div class="themed-list preference-suggestions" id="profilePreferenceSuggestions" role="listbox" aria-label="Matching preferences" hidden></div>
          <div class="preference-chips" id="profilePreferenceChips" aria-live="polite"></div>
          <div id="profilePreferenceHidden"></div>
        </div>
      </div>`;
    seedProfileEditPreferences(customer);
    syncProfilePreferenceHidden();
    renderProfilePreferenceChips();
    renderProfilePreferenceSuggestions();
    attachProfilePreferenceListeners();
  } else if (section === 'dates') {
    profileEditFields.innerHTML = customer.importantDates.map((item) => {
      const isCustom = item.type === 'Custom date';
      return `
      <div class="field-grid">
        ${isCustom
          ? `<label class="field"><span>Custom label</span><input name="dateLabel" type="text" value="${escapeHTML(item.label)}" placeholder="Custom date" /></label>`
          : `<label class="field"><span>${escapeHTML(item.label)}</span><input type="text" value="${escapeHTML(item.label)}" readonly tabindex="-1" /></label>`}
        <label class="field"><span>Date</span><input name="dateValue" type="date" value="${escapeHTML(item.date ?? '')}" /></label>
      </div>
      <input type="hidden" name="dateKey" value="${escapeHTML(item.key)}" />
      <input type="hidden" name="dateType" value="${escapeHTML(item.type)}" />`;
    }).join('');
  } else {
    const record = customer.importantDates.find((item) => item.key === dateKey);
    const type = record?.type ?? 'Custom date';
    profileEditFields.innerHTML = `
      <label class="field"><span>Date type</span><select name="type">${profileEditOptions(['Birthday', 'Passport expiry', 'Anniversary', 'Custom date'], type)}</select></label>
      <label class="field"><span>Label <b aria-hidden="true">*</b></span><input name="label" type="text" value="${escapeHTML(record?.label ?? 'Custom date')}" required /></label>
      <label class="field"><span>Date <b aria-hidden="true">*</b></span><input name="date" type="date" value="${escapeHTML(record?.date ?? '')}" required /></label>`;
  }

  openModal(profileEditBackdrop, $('input:not([readonly]), select', profileEditFields));
}

function closeProfileSectionEditor() {
  closeModal(profileEditBackdrop, profileEditForm, profileEditBackdrop._returnFocus);
  activeProfileEditSection = '';
  activeProfileDateKey = '';
}

function openQueryPositionEditor(trigger) {
  const query = selectedQuery;
  if (!query) return;
  queryPositionBackdrop._returnFocus = trigger ?? document.activeElement;
  queryPositionFields.innerHTML = `
    <label class="field"><span>Query title <b aria-hidden="true">*</b></span><input name="title" type="text" value="${escapeHTML(query.title)}" required /></label>
    <div class="field-grid">
      <label class="field"><span>Expected value</span><input name="value" type="number" min="0" value="${Number(query.value || 0)}" /></label>
      <label class="field"><span>Pending on</span><select name="pendingOn">${['Us', 'Customer', 'Vendor'].map((value) => `<option${value === query.pendingOn ? ' selected' : ''}>${value}</option>`).join('')}</select></label>
    </div>
    <div class="field-grid">
      <label class="field"><span>Follow-up</span><input name="followUp" type="text" value="${escapeHTML(query.delay ?? '')}" placeholder="e.g. Internal review" /></label>
      <label class="field"><span>Priority</span><select name="priority">${['High', 'Medium', 'Low'].map((value) => `<option${value === query.priority ? ' selected' : ''}>${value}</option>`).join('')}</select></label>
    </div>
    <div class="field query-position-assignees"><span id="queryPositionAssigneeLabel">Assigned to</span><div class="assignee-multiselect" id="queryPositionAssigneeMultiselect"><button class="filter-select-button assignee-multiselect-button" id="queryPositionAssigneeButton" type="button" aria-expanded="false" aria-controls="queryPositionAssigneePopover" aria-labelledby="queryPositionAssigneeLabel queryPositionAssigneeButtonLabel"><span id="queryPositionAssigneeButtonLabel"></span><svg><use href="#i-chevron-down" /></svg></button><div class="assignee-multiselect-popover" id="queryPositionAssigneePopover" role="group" aria-label="Assignees" hidden>${assigneeDropdownOptionsMarkup(queryOwnerList(query), 'owner')}</div></div></div>`;
  syncQueryPositionAssigneeButton();
  openModal(queryPositionBackdrop, $('input:not([readonly]), select', queryPositionFields));
}

function setQueryPositionAssigneeOpen(open) {
  const button = $('#queryPositionAssigneeButton', queryPositionFields);
  const popover = $('#queryPositionAssigneePopover', queryPositionFields);
  if (!button || !popover) return;
  popover.hidden = !open;
  button.setAttribute('aria-expanded', String(open));
}

function syncQueryPositionAssigneeButton() {
  const button = $('#queryPositionAssigneeButton', queryPositionFields);
  const label = $('#queryPositionAssigneeButtonLabel', queryPositionFields);
  const popover = $('#queryPositionAssigneePopover', queryPositionFields);
  if (!button || !label || !popover) return;
  const selected = $$('input[name="owner"]:checked', popover).map((input) => input.value);
  label.textContent = selected.length === 0 ? 'Select assignees'
    : selected.length === 1 ? selected[0]
      : `${selected[0]} +${selected.length - 1}`;
  button.classList.toggle('has-value', selected.length > 0);
}

function closeQueryPositionEditor() {
  closeModal(queryPositionBackdrop, queryPositionForm, queryPositionBackdrop._returnFocus);
}

function persistQueryPositionEdit(event) {
  event.preventDefault();
  const values = new FormData(queryPositionForm);
  selectedQuery.title = String(values.get('title')).trim();
  selectedQuery.value = Number(values.get('value') || 0);
  selectedQuery.pendingOn = String(values.get('pendingOn'));
  selectedQuery.delay = String(values.get('followUp') || '').trim();
  selectedQuery.priority = String(values.get('priority'));
  setQueryOwners(selectedQuery, values.getAll('owner'));
  selectedQuery.activity = 'Just now';
  renderQueryModule();
  renderQueryDetail();
  updateShellTopbar('query-detail', queryDetailCustomer());
  closeQueryPositionEditor();
  showToast('Query updated');
}

function persistProfileSectionEdit() {
  const customer = selectedCustomer;
  const values = new FormData(profileEditForm);
  const previousLocation = customer.location;
  if (activeProfileEditSection === 'contact') {
    customer.contactName = values.get('contactName').trim();
    customer.phone = values.get('phone').trim();
    customer.email = values.get('email').trim();
    customer.contactLocation = values.get('contactLocation').trim() || customer.location;
    const primaryProfile = travellerProfilesByCustomer.get(customer.id)?.find((profile) => profile.primary);
    if (primaryProfile) Object.assign(primaryProfile, { phone: customer.phone, email: customer.email });
  } else if (activeProfileEditSection === 'profile') {
    Object.assign(customer, {
      category: values.get('category'),
      groupType: values.get('groupType'),
      location: values.get('location').trim(),
      source: values.get('source'),
    });
    setCustomerTiers(customer, values.getAll('tier'));
    if (customer.contactLocation === previousLocation) customer.contactLocation = customer.location;
    const vaultCustomer = vaultCustomers.find((item) => item.id === customer.id);
    if (vaultCustomer) Object.assign(vaultCustomer, { category: customer.category, tier: customer.tier, location: customer.location });
  } else if (activeProfileEditSection === 'preferences') {
    customer.preferenceTags = [...new Set(values.getAll('preferenceTag').map((tag) => String(tag).trim()).filter(Boolean))];
    customer.preferences = { seat: '', hotel: '', budget: '', accessibility: '' };
  } else {
    const nextRecord = {
      key: activeProfileDateKey || `important-date-${Date.now()}`,
      type: values.get('type'),
      label: values.get('label').trim(),
      date: values.get('date'),
    };
    const existingIndex = customer.importantDates.findIndex((item) => item.key === activeProfileDateKey);
    if (existingIndex >= 0) customer.importantDates[existingIndex] = nextRecord;
    else customer.importantDates.push(nextRecord);
  }
  const updatedSection = activeProfileEditSection;
  closeProfileSectionEditor();
  renderCustomers();
  renderVault();
  renderCustomerDetail(customer);
  showToast(`${updatedSection === 'dates' ? 'Important dates' : updatedSection === 'date' ? 'Important date' : $('#profileEditTitle').textContent.replace(/^Edit /, '')} updated`);
}

function openCustomerDelete(trigger) {
  setCustomerActionMenu(false);
  setCustomerRowActionMenu();
  $('#customerDeleteName').textContent = selectedCustomer.name;
  customerDeleteBackdrop._returnFocus = trigger;
  openModal(customerDeleteBackdrop, $('#confirmCustomerDelete'));
}

function closeCustomerDelete() {
  closeModal(customerDeleteBackdrop, null, customerDeleteBackdrop._returnFocus);
}

function persistCustomerEdit() {
  const customer = selectedCustomer;
  const previousName = customer.name;
  const previousLocation = customer.location;
  const nextCategory = customerEditCategory.value;
  const nextName = customerEditName.value.trim();
  const nextTiers = [...customerEditTiers.querySelectorAll('input[name="tier"]:checked')].map((input) => input.value);
  Object.assign(customer, {
    name: nextName,
    category: nextCategory,
    location: customerEditLocation.value.trim(),
    groupType: customerEditGroupType.value,
    phone: customerEditPhone.value.trim(),
    email: customerEditEmail.value.trim(),
    value: Number(customerEditValue.value || 0),
    outstanding: Number(customerEditOutstanding.value || 0),
  });
  setCustomerTiers(customer, nextTiers);
  if (previousName !== nextName) {
    taskRecords.forEach((task) => {
      if (task.entityType === 'Customer' && task.entity === previousName) task.entity = nextName;
    });
  }
  if (customer.contactName === previousName) customer.contactName = nextName;
  if (customer.contactLocation === previousLocation) customer.contactLocation = customer.location;
  const vaultCustomer = vaultCustomers.find((item) => item.id === customer.id);
  if (vaultCustomer) Object.assign(vaultCustomer, { name: customer.name, category: customer.category, tier: customer.tier, location: customer.location });
  const profiles = travellerProfilesByCustomer.get(customer.id);
  const primaryProfile = profiles?.find((profile) => profile.primary);
  if (primaryProfile) {
    if (primaryProfile.name === previousName && previousName !== nextName) {
      renameTravellerDocuments(customer, previousName, nextName);
      primaryProfile.name = nextName;
    }
    primaryProfile.phone = customer.phone;
    primaryProfile.email = customer.email;
    travellerNamesByCustomer[customer.id] = [...profiles].sort((left, right) => Number(right.primary) - Number(left.primary)).map((profile) => profile.name);
  }
  const returnTab = activeProfileTab;
  closeCustomerEditor();
  renderCustomers();
  renderVault();
  renderCustomerDetail(customer);
  setProfileTab(returnTab);
  showToast(`${customer.name} updated`);
}

function deleteSelectedCustomer() {
  const customer = selectedCustomer;
  const customerIndex = customers.findIndex((item) => item.id === customer.id);
  if (customerIndex < 0) return;
  customers.splice(customerIndex, 1);
  const vaultIndex = vaultCustomers.findIndex((item) => item.id === customer.id);
  if (vaultIndex >= 0) vaultCustomers.splice(vaultIndex, 1);
  travellerProfilesByCustomer.delete(customer.id);
  expandedTravellerByCustomer.delete(customer.id);
  customerNotesByCustomer.delete(customer.id);
  saveCustomerNotesStore();
  delete travellerNamesByCustomer[customer.id];
  documentRequests.delete(customer.id);
  uploadedRequestDocuments.delete(customer.id);
  for (let index = taskRecords.length - 1; index >= 0; index -= 1) {
    const task = taskRecords[index];
    if (task.entityType === 'Customer' && task.entity === customer.name) taskRecords.splice(index, 1);
  }
  saveTaskRecordsStore();
  customerReferralLinks.delete(customer.id);
  customerReferralLinks.forEach((links) => {
    if (links.referredBy === customer.id) links.referredBy = null;
    links.referrals = links.referrals.filter((customerId) => customerId !== customer.id);
  });
  totalCustomerCount = customers.length;
  if (totalCustomers) totalCustomers.textContent = totalCustomerCount;
  customerDeleteBackdrop.hidden = true;
  document.body.style.overflow = '';
  selectedCustomer = customers[0];
  renderCustomers();
  renderPagination();
  renderVault();
  setView('customers', selectedCustomer, false);
  history.replaceState({ view: 'customers', canGoBack: false }, '', '#customers');
  showToast(`${customer.name} deleted`);
}

function nextCustomerCode() {
  const nextSerial = Math.max(0, ...customers.map(customerIdNumber)) + 1;
  return `CUST-${String(nextSerial).padStart(4, '0')}`;
}

function updateOnboardingSecondaryAction() {
  onboardingSecondary.disabled = !customerName.value.trim();
}

function updateOnboardingContinueState() {
  onboardingContinue.disabled = $$('input, select, textarea', customerForm).some((field) => !field.checkValidity());
}

function resetCustomerOnboarding() {
  customerForm.reset();
  onboardingPhotoFile = null;
  onboardingPhotoDataUrl = '';
  customerPhotoPreview.src = '';
  customerPhotoPreview.hidden = true;
  $('.customer-photo-placeholder', customerPhotoButton).hidden = false;
  clearOnboardingPreferences();
  fillOnboardingReferrers();
  syncReferralFields();
  $$('[data-custom-tier]', customerForm).forEach((item) => item.remove());
  addTierButton.hidden = false;
  customerCode.value = nextCustomerCode();
  updateOnboardingSecondaryAction();
  updateOnboardingContinueState();
}

function openCustomerOnboarding(returnFocus = createButton) {
  customerReturnFocus = returnFocus;
  resetCustomerOnboarding();
  setView('new-customer');
  if (mobileSidebarQuery.matches) setMobileSidebarOpen(false);
  $('.customer-onboarding-body', customerCreateView).scrollTop = 0;
  customerName.focus({ preventScroll: true });
}

function closeCustomerOnboarding() {
  setView('customers');
  resetCustomerOnboarding();
  customerReturnFocus?.focus();
  customerReturnFocus = null;
}

function openVendorOnboarding(returnFocus = document.activeElement) {
  vendorReturnFocus = returnFocus;
  vendorForm.reset();
  openModal(vendorModalBackdrop, vendorName);
}

function closeVendorOnboarding() {
  closeModal(vendorModalBackdrop, vendorForm, vendorReturnFocus);
  vendorReturnFocus = null;
}

function customerFormIsValid() {
  updateOnboardingContinueState();
  const invalidField = $$('input, select, textarea', customerForm).find((field) => !field.checkValidity());
  if (!invalidField) return true;
  invalidField.reportValidity();
  invalidField.focus();
  return false;
}

function customerFromOnboarding(draft = false) {
  const values = new FormData(customerForm);
  const category = String(values.get('category') || 'B2C');
  const rawLocation = String(values.get('location') || '').trim();
  const selectedTier = String(values.get('tier') || 'Gold');
  const selectedTiers = values.getAll('tier').map((tier) => String(tier).trim()).filter(Boolean);
  const assignedTiers = selectedTiers.length ? [...new Set(selectedTiers)] : [selectedTier];
  return {
    name: String(values.get('name') || '').trim(),
    id: String(values.get('code') || nextCustomerCode()),
    category,
    tier: assignedTiers[0],
    tiers: assignedTiers,
    location: rawLocation.split(',')[0] || 'Not set',
    travellers: 1,
    value: 0,
    outstanding: 0,
    trips: 0,
    photo: onboardingPhotoDataUrl,
    groupType: String(values.get('groupType') || (category === 'B2C' ? 'Family' : category === 'B2B' ? 'Corporate' : 'Other')),
    status: draft ? 'Draft' : 'Active',
    createdAt: new Date().toISOString(),
    source: readOnboardingReferral().source,
    title: String(values.get('title') || ''),
    primaryName: String(values.get('primaryName') || '').trim(),
    dateOfBirth: String(values.get('dateOfBirth') || ''),
    gender: String(values.get('gender') || ''),
    phone: `${String(values.get('phoneCountry') || '+91')} ${String(values.get('phone') || '').trim()}`.trim(),
    email: String(values.get('email') || '').trim(),
    whatsapp: `${String(values.get('whatsappCountry') || '+91')} ${String(values.get('whatsapp') || '').trim()}`.trim(),
    destination: String(values.get('destination') || '').trim(),
    stops: values.getAll('stops').map((stop) => String(stop).trim()).filter(Boolean),
    preferenceTags: [...new Set(values.getAll('preferenceTag').map((tag) => String(tag).trim()).filter(Boolean))],
    creditLimit: Number(values.get('creditLimit') || 0),
    note: String(values.get('note') || '').trim(),
  };
}

function persistOnboardedCustomer(draft = false) {
  if (draft && !customerName.checkValidity()) {
    customerName.reportValidity();
    customerName.focus();
    return;
  }
  if (!draft && !customerFormIsValid()) return;
  const customer = customerFromOnboarding(draft);
  customers.unshift(customer);
  vaultCustomers.unshift({ ...customer, documents: [] });
  const referral = readOnboardingReferral();
  if (referral.referrerId) {
    const links = referralLinksFor(customer.id);
    links.referredBy = referral.referrerId;
    const referrerLinks = referralLinksFor(referral.referrerId);
    if (!referrerLinks.referrals.includes(customer.id)) referrerLinks.referrals.push(customer.id);
  }
  totalCustomerCount = customers.length;
  if (totalCustomers) totalCustomers.textContent = totalCustomerCount;
  customerSearch.value = '';
  setCategory('All');
  closeCustomerOnboarding();
  showToast(draft ? 'Customer draft saved' : 'Customer successfully created');
}

function submitCustomerOnboarding() {
  if (!customerFormIsValid()) return;
  persistOnboardedCustomer();
}

function syncWhatsappWithPhone() {
  if (sameAsPhone.checked) customerWhatsapp.value = customerPhone.value;
  customerWhatsapp.readOnly = sameAsPhone.checked;
}

let onboardingPreferences = [];
let preferenceSuggestionCache = null;

function preferenceSuggestionPool() {
  if (!preferenceSuggestionCache) {
    preferenceSuggestionCache = [];
    TRAVELLER_PREFERENCE_GROUPS.forEach((group) => {
      group.fields.forEach((field) => {
        field.options.forEach((value) => {
          preferenceSuggestionCache.push({ field: field.key, label: field.label, value });
        });
      });
    });
  }
  return preferenceSuggestionCache;
}

function preferenceTagText(pick) {
  return `${pick.label}: ${pick.value}`;
}

function syncPreferenceHidden() {
  preferenceHidden.replaceChildren();
  onboardingPreferences.forEach((pick) => {
    const hidden = document.createElement('input');
    hidden.type = 'hidden';
    hidden.name = 'preferenceTag';
    hidden.value = preferenceTagText(pick);
    preferenceHidden.append(hidden);
  });
}

function closePreferenceSuggestions() {
  preferenceSuggestions.hidden = true;
  preferenceInput.setAttribute('aria-expanded', 'false');
}

function renderPreferenceChips() {
  preferenceChips.replaceChildren();
  onboardingPreferences.forEach((pick) => {
    const chip = document.createElement('span');
    chip.className = 'preference-chip';
    const text = document.createElement('span');
    text.textContent = preferenceTagText(pick);
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'preference-chip-remove';
    remove.setAttribute('aria-label', `Remove ${preferenceTagText(pick)}`);
    remove.innerHTML = '<svg aria-hidden="true"><use href="#i-x" /></svg>';
    remove.addEventListener('click', () => {
      onboardingPreferences = onboardingPreferences.filter((item) => !(item.field === pick.field && item.value === pick.value));
      syncPreferenceHidden();
      renderPreferenceChips();
      renderPreferenceSuggestions();
      preferenceInput.focus();
    });
    chip.append(text, remove);
    preferenceChips.append(chip);
  });
  preferenceChips.hidden = onboardingPreferences.length === 0;
}

function renderPreferenceSuggestions() {
  const query = preferenceInput.value.trim().toLocaleLowerCase();
  const selected = new Set(onboardingPreferences.map((pick) => `${pick.field}|||${pick.value}`));
  const matches = preferenceSuggestionPool().filter((option) => {
    if (selected.has(`${option.field}|||${option.value}`)) return false;
    if (!query) return false;
    return option.value.toLocaleLowerCase().includes(query) || option.label.toLocaleLowerCase().includes(query);
  }).slice(0, 8);
  preferenceSuggestions.replaceChildren();
  if (query && !matches.length) {
    const empty = document.createElement('p');
    empty.className = 'themed-empty';
    empty.textContent = 'No matching preferences.';
    preferenceSuggestions.append(empty);
  } else {
    matches.forEach((option) => {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'themed-option';
      item.setAttribute('role', 'option');
      const label = document.createElement('span');
      label.textContent = option.value;
      const context = document.createElement('small');
      context.textContent = option.label;
      item.append(label, context);
      item.addEventListener('click', () => addOnboardingPreference(option));
      preferenceSuggestions.append(item);
    });
  }
  const open = document.activeElement === preferenceInput && query.length > 0;
  preferenceSuggestions.hidden = !open;
  preferenceInput.setAttribute('aria-expanded', String(open));
}

function addOnboardingPreference(option) {
  if (!option || onboardingPreferences.some((pick) => pick.field === option.field && pick.value === option.value)) return;
  onboardingPreferences = [...onboardingPreferences, { field: option.field, label: option.label, value: option.value }];
  preferenceInput.value = '';
  syncPreferenceHidden();
  renderPreferenceChips();
  closePreferenceSuggestions();
  preferenceInput.focus();
}

function clearOnboardingPreferences() {
  onboardingPreferences = [];
  if (preferenceInput) preferenceInput.value = '';
  if (preferenceHidden) preferenceHidden.replaceChildren();
  if (preferenceChips) {
    preferenceChips.replaceChildren();
    preferenceChips.hidden = true;
  }
  if (preferenceSuggestions && preferenceInput) closePreferenceSuggestions();
}

let profileEditPreferences = [];

function profilePreferenceEls() {
  return {
    input: document.getElementById('profilePreferenceInput'),
    suggestions: document.getElementById('profilePreferenceSuggestions'),
    chips: document.getElementById('profilePreferenceChips'),
    hidden: document.getElementById('profilePreferenceHidden'),
  };
}

function parsePreferenceTag(tag) {
  const text = String(tag ?? '').trim();
  if (!text) return null;
  const sep = text.indexOf(':');
  if (sep <= 0) return { field: 'custom', label: 'Preference', value: text };
  const label = text.slice(0, sep).trim();
  const value = text.slice(sep + 1).trim();
  if (!label || !value) return null;
  const field = TRAVELLER_PREFERENCE_GROUPS.flatMap((group) => group.fields)
    .find((item) => item.label.toLocaleLowerCase() === label.toLocaleLowerCase());
  return { field: field ? field.key : 'custom', label: field ? field.label : label, value };
}

function seedProfileEditPreferences(customer) {
  const tags = Array.isArray(customer.preferenceTags) ? customer.preferenceTags.filter(Boolean) : [];
  const source = tags.length ? tags : [
    customer.preferences?.seat && `Seat preference: ${customer.preferences.seat}`,
    customer.preferences?.hotel && `Hotel preference: ${customer.preferences.hotel}`,
    customer.preferences?.budget && `Budget band: ${customer.preferences.budget}`,
    customer.preferences?.accessibility && `Accessibility: ${customer.preferences.accessibility}`,
  ].filter(Boolean);
  profileEditPreferences = source.map(parsePreferenceTag).filter(Boolean);
}

function syncProfilePreferenceHidden() {
  const { hidden } = profilePreferenceEls();
  if (!hidden) return;
  hidden.replaceChildren();
  profileEditPreferences.forEach((pick) => {
    const field = document.createElement('input');
    field.type = 'hidden';
    field.name = 'preferenceTag';
    field.value = preferenceTagText(pick);
    hidden.append(field);
  });
}

function closeProfilePreferenceSuggestions() {
  const { input, suggestions } = profilePreferenceEls();
  if (!input || !suggestions) return;
  suggestions.hidden = true;
  input.setAttribute('aria-expanded', 'false');
}

function renderProfilePreferenceChips() {
  const { input, chips } = profilePreferenceEls();
  if (!chips) return;
  chips.replaceChildren();
  profileEditPreferences.forEach((pick) => {
    const chip = document.createElement('span');
    chip.className = 'preference-chip';
    const text = document.createElement('span');
    text.textContent = preferenceTagText(pick);
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'preference-chip-remove';
    remove.setAttribute('aria-label', `Remove ${preferenceTagText(pick)}`);
    remove.innerHTML = '<svg aria-hidden="true"><use href="#i-x" /></svg>';
    remove.addEventListener('click', () => {
      profileEditPreferences = profileEditPreferences.filter((item) => !(item.field === pick.field && item.value === pick.value));
      syncProfilePreferenceHidden();
      renderProfilePreferenceChips();
      renderProfilePreferenceSuggestions();
      if (input) input.focus();
    });
    chip.append(text, remove);
    chips.append(chip);
  });
  chips.hidden = profileEditPreferences.length === 0;
}

function renderProfilePreferenceSuggestions() {
  const { input, suggestions } = profilePreferenceEls();
  if (!input || !suggestions) return;
  const query = input.value.trim().toLocaleLowerCase();
  const selected = new Set(profileEditPreferences.map((pick) => `${pick.field}|||${pick.value}`));
  const matches = preferenceSuggestionPool().filter((option) => {
    if (selected.has(`${option.field}|||${option.value}`)) return false;
    if (!query) return false;
    return option.value.toLocaleLowerCase().includes(query) || option.label.toLocaleLowerCase().includes(query);
  }).slice(0, 8);
  suggestions.replaceChildren();
  if (query && !matches.length) {
    const empty = document.createElement('p');
    empty.className = 'themed-empty';
    empty.textContent = 'No matching preferences.';
    suggestions.append(empty);
  } else {
    matches.forEach((option) => {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'themed-option';
      item.setAttribute('role', 'option');
      const label = document.createElement('span');
      label.textContent = option.value;
      const context = document.createElement('small');
      context.textContent = option.label;
      item.append(label, context);
      item.addEventListener('click', () => addProfilePreference(option));
      suggestions.append(item);
    });
  }
  const open = document.activeElement === input && query.length > 0;
  suggestions.hidden = !open;
  input.setAttribute('aria-expanded', String(open));
}

function addProfilePreference(option) {
  const { input } = profilePreferenceEls();
  if (!option || (input && input.disabled)) return;
  if (profileEditPreferences.some((pick) => pick.field === option.field && pick.value === option.value)) return;
  profileEditPreferences = [...profileEditPreferences, { field: option.field, label: option.label, value: option.value }];
  if (input) input.value = '';
  syncProfilePreferenceHidden();
  renderProfilePreferenceChips();
  closeProfilePreferenceSuggestions();
  if (input) input.focus();
}

function attachProfilePreferenceListeners() {
  const { input, suggestions } = profilePreferenceEls();
  if (!input || !suggestions) return;
  input.addEventListener('input', renderProfilePreferenceSuggestions);
  input.addEventListener('focus', renderProfilePreferenceSuggestions);
  input.addEventListener('blur', () => {
    window.setTimeout(() => {
      const els = profilePreferenceEls();
      if (document.activeElement !== els.input) closeProfilePreferenceSuggestions();
    }, 120);
  });
  input.addEventListener('keydown', (event) => {
    const els = profilePreferenceEls();
    if (event.key === 'Escape') {
      closeProfilePreferenceSuggestions();
      return;
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!els.suggestions.hidden) focusThemedOption(els.suggestions, event.key === 'ArrowDown' ? 1 : -1);
    } else if (event.key === 'Enter' && !els.suggestions.hidden) {
      event.preventDefault();
      if (document.activeElement === els.input) $('.themed-option', els.suggestions)?.click();
    }
  });
  suggestions.addEventListener('keydown', (event) => {
    const els = profilePreferenceEls();
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      focusThemedOption(els.suggestions, event.key === 'ArrowDown' ? 1 : -1);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      closeProfilePreferenceSuggestions();
      els.input.focus();
    }
  });
}

function selectedReferralType() {
  return $$('input[name="referralType"]', customerForm).find((input) => input.checked)?.value ?? null;
}

function syncReferralFields() {
  const type = selectedReferralType();
  referralPersonFields.hidden = type !== 'person';
  referralChannelFields.hidden = type !== 'channel';
}

function fillOnboardingReferrers() {
  const current = onboardingReferrer.value;
  onboardingReferrer.innerHTML = '<option value="">Select a customer</option>'
    + customers.map((customer) => `<option value="${escapeHTML(customer.id)}">${escapeHTML(customer.name)} ${escapeHTML(customer.id)}</option>`).join('');
  onboardingReferrer.value = customers.some((customer) => customer.id === current) ? current : '';
}

function readOnboardingReferral() {
  const type = selectedReferralType();
  if (type === 'person') {
    const referrerId = onboardingReferrer.value || null;
    const valid = referrerId && customers.some((customer) => customer.id === referrerId) ? referrerId : null;
    return { type, referrerId: valid, source: valid ? 'Referral' : 'Website' };
  }
  if (type === 'channel') {
    const channel = $$('input[name="sourceChannel"]', customerForm).find((input) => input.checked)?.value || 'Website';
    return { type, referrerId: null, source: channel };
  }
  return { type: null, referrerId: null, source: 'Website' };
}

function openCustomTierEditor() {
  const existingEditor = $('[data-custom-tier-editor]', customerForm);
  if (existingEditor) {
    existingEditor.querySelector('input').focus();
    return;
  }
  const editor = document.createElement('span');
  editor.className = 'custom-tier-editor';
  editor.dataset.customTierEditor = '';
  editor.innerHTML = '<input type="text" maxlength="18" placeholder="Tier name" aria-label="New tier name" /><button type="button">Add</button>';
  addTierButton.before(editor);
  addTierButton.hidden = true;
  const input = editor.querySelector('input');
  const commit = () => {
    const name = input.value.trim();
    if (!name) {
      input.focus();
      return;
    }
    const option = document.createElement('label');
    option.className = 'tier-custom';
    option.dataset.customTier = '';
    const radio = document.createElement('input');
    radio.type = 'checkbox';
    radio.name = 'tier';
    radio.value = name;
    radio.checked = true;
    const dot = document.createElement('span');
    option.append(radio, dot, document.createTextNode(name));
    editor.replaceWith(option);
    addTierButton.hidden = false;
  };
  editor.querySelector('button').addEventListener('click', commit);
  input.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    commit();
  });
  input.focus();
}

function queryFormSnapshot() {
  return JSON.stringify([...new FormData(queryForm).entries()].map(([key, value]) => [key, String(value)]));
}

function queryHasChanges() {
  return queryFormSnapshot() !== queryInitialSnapshot;
}

function updateQuerySecondaryAction() {
  const savesDraft = queryHasChanges();
  querySecondary.querySelector('span').textContent = savesDraft ? 'Save as draft' : 'Cancel';
  querySecondary.querySelector('svg').hidden = savesDraft;
  querySecondary.dataset.action = savesDraft ? 'draft' : 'cancel';
}

function queryTypeFieldsMarkup(type) {
  if (type === 'Trip') {
    return `<fieldset class="query-scope-options">
      <legend>Scope <b aria-hidden="true">*</b></legend>
      <label><input type="radio" name="scope" value="Domestic" checked /><span>Domestic</span></label>
      <label><input type="radio" name="scope" value="International" /><span>International</span></label>
    </fieldset>
    <div class="query-service-grid">
      <label class="field"><span>Departure city</span><span class="input-with-leading-icon"><svg><use href="#i-map-pin" /></svg><input name="departureCity" type="text" placeholder="Search departure city…" /></span></label>
      <label class="field"><span>Destination <b aria-hidden="true">*</b></span><span class="input-with-leading-icon"><svg><use href="#i-map-pin" /></svg><input name="destination" type="text" placeholder="Search city, state, or country…" required /></span></label>
      <label class="field"><span>Start date</span><input name="startDate" type="date" /></label>
      <label class="field"><span>End date</span><input name="endDate" type="date" /></label>
    </div>`;
  }
  if (type === 'Flight') {
    return `<div class="query-option-field"><span>Journey type</span><div class="query-option-pills">
      <label><input type="radio" name="journeyType" value="One way" checked /><span>One way</span></label>
      <label><input type="radio" name="journeyType" value="Round trip" /><span>Round trip</span></label>
      <label><input type="radio" name="journeyType" value="Multi-city" /><span>Multi-city</span></label>
    </div></div>
    <div class="query-service-grid">
      <label class="field"><span>From <b aria-hidden="true">*</b></span><input name="flightOrigin" type="text" placeholder="Airport or city" required /></label>
      <label class="field"><span>To <b aria-hidden="true">*</b></span><input name="flightDestination" type="text" placeholder="Airport or city" required /></label>
      <label class="field"><span>Departure date <b aria-hidden="true">*</b></span><input name="departureDate" type="date" required /></label>
      <label class="field"><span>Return date</span><input name="returnDate" type="date" /></label>
      <label class="field"><span>Cabin class</span><select name="cabinClass"><option>Economy</option><option>Premium economy</option><option>Business</option><option>First class</option></select></label>
      <label class="field"><span>Preferred airlines</span><input name="preferredAirlines" type="text" placeholder="Optional" /></label>
    </div>`;
  }
  if (type === 'Accommodation') {
    return `<div class="query-service-grid">
      <label class="field"><span>Destination <b aria-hidden="true">*</b></span><input name="stayDestination" type="text" placeholder="Search destination…" required /></label>
      <label class="field"><span>Accommodation type</span><select name="accommodationType"><option>Hotel</option><option>Resort</option><option>Villa</option><option>Apartment</option><option>Hostel</option></select></label>
      <label class="field"><span>Check-in <b aria-hidden="true">*</b></span><input name="checkIn" type="date" required /></label>
      <label class="field"><span>Check-out <b aria-hidden="true">*</b></span><input name="checkOut" type="date" required /></label>
      <label class="field"><span>Preferred properties</span><input name="preferredProperties" type="text" placeholder="Hotel or property names" /></label>
      <label class="field"><span>Meal plan</span><select name="mealPlan"><option>Room only</option><option>Breakfast included</option><option>Half board</option><option>Full board</option><option>All inclusive</option></select></label>
    </div>
    <div class="query-option-field"><span>Star rating (multi-select)</span><div class="query-option-pills">
      <label><input type="checkbox" name="starRating" value="2" /><span>★★</span></label>
      <label><input type="checkbox" name="starRating" value="3" checked /><span>★★★</span></label>
      <label><input type="checkbox" name="starRating" value="4" /><span>★★★★</span></label>
      <label><input type="checkbox" name="starRating" value="5" /><span>★★★★★</span></label>
    </div></div>`;
  }
  if (type === 'Visa') {
    return `<div class="query-service-grid">
      <label class="field"><span>Destination country <b aria-hidden="true">*</b></span><input name="visaCountry" type="text" placeholder="Country" required /></label>
      <label class="field"><span>Visa type</span><select name="visaType"><option>Tourist</option><option>Business</option><option>Transit</option><option>Student</option><option>Work</option></select></label>
      <label class="field"><span>Intended travel date <b aria-hidden="true">*</b></span><input name="visaTravelDate" type="date" required /></label>
      <label class="field"><span>Processing speed</span><select name="processingSpeed"><option>Standard</option><option>Priority</option><option>Express</option></select></label>
      <label class="field"><span>Passport status</span><select name="passportStatus"><option>Valid passports available</option><option>Some documents pending</option><option>Passport renewal required</option></select></label>
      <label class="field"><span>Nationality</span><input name="nationality" type="text" value="Indian" /></label>
    </div>`;
  }
  if (type === 'Cruise') {
    return `<div class="query-service-grid">
      <label class="field"><span>Sailing region <b aria-hidden="true">*</b></span><input name="cruiseRegion" type="text" placeholder="e.g. Mediterranean" required /></label>
      <label class="field"><span>Preferred cruise line</span><input name="cruiseLine" type="text" placeholder="Optional" /></label>
      <label class="field"><span>Departure port <b aria-hidden="true">*</b></span><input name="departurePort" type="text" placeholder="Port or city" required /></label>
      <label class="field"><span>Arrival port</span><input name="arrivalPort" type="text" placeholder="Port or city" /></label>
      <label class="field"><span>Sailing date <b aria-hidden="true">*</b></span><input name="sailingDate" type="date" required /></label>
      <label class="field"><span>Return date</span><input name="cruiseReturnDate" type="date" /></label>
      <label class="field"><span>Cabin preference</span><select name="cabinPreference"><option>Interior</option><option>Ocean view</option><option>Balcony</option><option>Suite</option></select></label>
      <label class="field"><span>Cabins</span><input name="cabins" type="number" min="1" value="1" /></label>
    </div>`;
  }
  return `<div class="query-service-grid">
    <label class="field"><span>Departure <b aria-hidden="true">*</b></span><input name="transportDeparture" type="text" placeholder="Station, terminal, or address" required /></label>
    <label class="field"><span>Destination <b aria-hidden="true">*</b></span><input name="transportDestination" type="text" placeholder="Station, terminal, or address" required /></label>
    <label class="field"><span>Start date <b aria-hidden="true">*</b></span><input name="transportStartDate" type="date" required /></label>
    <label class="field"><span>End date</span><input name="transportEndDate" type="date" /></label>
  </div>`;
}

function queryRepeatFieldsMarkup(type) {
  const sections = [];
  if (type === 'Trip') {
    sections.push(`<div class="query-repeat-section"><span class="query-field-label">Cities &amp; days</span><div class="query-repeat-list" id="queryCities"></div><button class="inline-add" type="button" data-query-repeat-add="city"><svg><use href="#i-plus" /></svg>Add city</button></div>`);
  }
  if (type === 'Transport') {
    sections.push(`<div class="query-repeat-section"><span class="query-field-label">Route stops</span><small>Optional intermediate stops between departure and destination.</small><div class="query-repeat-list" id="queryStops"></div><button class="inline-add" type="button" data-query-repeat-add="stop"><svg><use href="#i-plus" /></svg>Add stop</button></div>`);
  }
  if (['Trip', 'Transport'].includes(type)) {
    sections.push(`<div class="query-repeat-section"><span class="query-field-label">Vehicles</span><small>Add each vehicle type and how many units are needed.</small><div class="query-repeat-list" id="queryVehicles"></div><button class="inline-add" type="button" data-query-repeat-add="vehicle"><svg><use href="#i-plus" /></svg>Add vehicle</button></div>`);
  }
  return sections.join('');
}

function validateQueryDates() {
  const datePairs = [
    ['startDate', 'endDate'],
    ['departureDate', 'returnDate'],
    ['checkIn', 'checkOut'],
    ['sailingDate', 'cruiseReturnDate'],
    ['transportStartDate', 'transportEndDate'],
  ];
  datePairs.forEach(([startName, endName]) => {
    const start = $(`[name="${startName}"]`, queryForm);
    const end = $(`[name="${endName}"]`, queryForm);
    if (!start || !end) return;
    end.setCustomValidity(start.value && end.value && end.value < start.value ? 'End date must be on or after the start date.' : '');
  });
}

function updateQueryContinueState() {
  validateQueryDates();
  queryContinue.disabled = $$('input, select, textarea', queryForm).some((field) => !field.checkValidity());
}


function renderQueryChildAges() {
  const count = Math.max(0, Math.min(12, Number(queryChildren.value) || 0));
  const previousValues = $$('input', queryChildAges).map((input) => input.value);
  queryChildAges.replaceChildren();
  for (let index = 0; index < count; index += 1) {
    const label = document.createElement('label');
    label.className = 'field';
    label.innerHTML = `<span>Child ${index + 1} age <small>(optional)</small></span><input name="childAge" type="number" min="2" max="11" placeholder="Age" />`;
    label.querySelector('input').value = previousValues[index] || '';
    queryChildAges.append(label);
  }
}

function queryAssigneeSelections() {
  if (!queryAssigneePopover) return [];
  return $$('input[name="assignedTo"]', queryAssigneePopover)
    .filter((input) => input.checked)
    .map((input) => input.value);
}

function syncQueryAssigneeButton() {
  if (!queryAssigneeButton || !queryAssigneePopover) return;
  const selected = queryAssigneeSelections();
  if (queryAssigneeButtonLabel) {
    queryAssigneeButtonLabel.textContent =
      selected.length === 0 ? 'Select assignees'
      : selected.length === 1 ? selected[0]
      : `${selected[0]} +${selected.length - 1}`;
  }
  queryAssigneeButton.classList.toggle('has-value', selected.length > 0);
}

function setQueryAssigneeOpen(open) {
  if (!queryAssigneeButton || !queryAssigneePopover) return;
  queryAssigneePopover.hidden = !open;
  queryAssigneeButton.setAttribute('aria-expanded', String(open));
}

function populateQueryCustomerOptions(selectedId = queryCustomer.value, searchTerm = queryCustomerSearch.value) {
  const normalizedSearch = String(searchTerm || '').trim().toLocaleLowerCase();
  const matchingCustomers = customers.filter((item) => {
    if (!normalizedSearch) return true;
    const details = customerContactDetails(item);
    return [item.name, item.id, details.phone, details.email].some((value) => String(value || '').toLocaleLowerCase().includes(normalizedSearch));
  });
  queryCustomer.innerHTML = matchingCustomers.length
    ? matchingCustomers.map((item) => `<option value="${escapeHTML(item.id)}">${escapeHTML(item.name)} · ${escapeHTML(item.id)}</option>`).join('')
    : '<option value="" disabled>No customers match this search</option>';
  queryCustomer.value = matchingCustomers.some((item) => item.id === selectedId) ? selectedId : matchingCustomers[0]?.id ?? '';
  queryCustomer.dispatchEvent(new Event('change', { bubbles: true }));
}

function setQueryInlineCustomerOpen(open) {
  queryInlineCustomer.hidden = !open;
  queryCreateCustomerButton.hidden = open;
  queryInlineCustomerCode.textContent = open ? nextCustomerCode() : '';
  [queryNewCustomerName, queryNewCustomerPhone].forEach((field) => { field.required = open; });
  if (!open) {
    queryNewCustomerName.value = '';
    queryNewCustomerPhone.value = '';
    queryNewCustomerEmail.value = '';
  }
  updateQueryContinueState();
  if (open) window.setTimeout(() => queryNewCustomerName.focus(), 0);
}

function saveInlineQueryCustomer() {
  if (![queryNewCustomerName, queryNewCustomerPhone, queryNewCustomerEmail].every((field) => field.checkValidity())) {
    [queryNewCustomerName, queryNewCustomerPhone, queryNewCustomerEmail].find((field) => !field.checkValidity())?.reportValidity();
    return;
  }
  const customer = {
    name: queryNewCustomerName.value.trim(),
    id: nextCustomerCode(),
    category: 'B2C',
    tier: 'Bronze',
    tiers: ['Bronze'],
    location: 'Not set',
    travellers: 1,
    value: 0,
    outstanding: 0,
    trips: 0,
    groupType: 'Family',
    status: 'Active',
    source: 'Phone enquiry',
    createdAt: new Date().toISOString(),
    primaryName: queryNewCustomerName.value.trim(),
    contactName: queryNewCustomerName.value.trim(),
    phone: queryNewCustomerPhone.value.trim(),
    email: queryNewCustomerEmail.value.trim(),
  };
  customers.unshift(customer);
  vaultCustomers.unshift({ ...customer, documents: [] });
  customerReferralLinks.set(customer.id, { referredBy: null, referrals: [] });
  ensureCustomerDetailData(customer);
  totalCustomerCount = customers.length;
  if (totalCustomers) totalCustomers.textContent = totalCustomerCount;
  queryCustomerSearch.value = '';
  populateQueryCustomerOptions(customer.id);
  renderCustomers();
  renderVault();
  setQueryInlineCustomerOpen(false);
  updateQuerySecondaryAction();
  showToast(`${customer.name} created as ${customer.id}`);
}


function resetQueryOnboarding(type = currentQueryType, customer = null) {
  currentQueryType = QUERY_TYPES.includes(type) ? type : 'Trip';
  queryForm.reset();
  queryTypeInput.value = currentQueryType;
  $('#queryModalTitle').textContent = `New ${currentQueryType.toLocaleLowerCase()} query`;
  $('#queryDetailsTitle').textContent = `${currentQueryType} details`;
  $('#queryDetailsDescription').textContent = `Fill in the requirements for this ${currentQueryType.toLocaleLowerCase()} query.`;
  queryTypeFields.innerHTML = queryTypeFieldsMarkup(currentQueryType);
  queryRepeatFields.innerHTML = queryRepeatFieldsMarkup(currentQueryType);
  const customerId = customer?.id && customers.some((item) => item.id === customer.id) ? customer.id : customers[0]?.id;
  queryCustomerSearch.value = '';
  populateQueryCustomerOptions(customerId);
  setQueryInlineCustomerOpen(false);
  queryChildren.value = '0';
  queryChildAges.replaceChildren();
  const isVisaQuery = currentQueryType === 'Visa';
  $$('[name="rooms"], [name="extraBeds"]', queryForm).forEach((field) => {
    field.closest('label.field').hidden = isVisaQuery;
    if (isVisaQuery) field.value = '';
  });
  queryInitialSnapshot = queryFormSnapshot();
  setQueryAssigneeOpen(false);
  syncQueryAssigneeButton();
  updateQuerySecondaryAction();
  updateQueryContinueState();
}

function openQueryTypeSelector(customer = null, returnFocus = document.activeElement) {
  pendingQueryCustomer = customer;
  queryReturnFocus = returnFocus;
  openModal(queryTypeModalBackdrop, $('[data-query-type]', queryTypeModalBackdrop));
}

function closeQueryTypeSelector(restoreFocus = true) {
  queryTypeModalBackdrop.hidden = true;
  document.body.style.overflow = '';
  if (restoreFocus) queryReturnFocus?.focus();
  if (restoreFocus) {
    queryReturnFocus = null;
    pendingQueryCustomer = null;
  }
}

function openQueryOnboarding(type = 'Trip', customer = null, returnFocus = document.activeElement) {
  queryReturnFocus = returnFocus;
  resetQueryOnboarding(type, customer);
  openModal(queryModalBackdrop, queryCustomer);
}

function closeQueryOnboarding() {
  queryModalBackdrop.hidden = true;
  document.body.style.overflow = '';
  queryForm.reset();
  setQueryAssigneeOpen(false);
  syncQueryAssigneeButton();
  setQueryInlineCustomerOpen(false);
  queryTypeFields.replaceChildren();
  queryRepeatFields.replaceChildren();
  queryChildAges.replaceChildren();
  queryReturnFocus?.focus();
  queryReturnFocus = null;
  pendingQueryCustomer = null;
}

function queryFormIsValid() {
  updateQueryContinueState();
  const invalidField = $$('input, select, textarea', queryForm).find((field) => !field.checkValidity());
  if (!invalidField) return true;
  invalidField.reportValidity();
  invalidField.focus();
  return false;
}

function renumberQueryRows(container, label) {
  [...container.children].forEach((row, index) => {
    const title = $('.query-repeat-title', row);
    if (title) title.textContent = `${label} ${index + 1}`;
    const remove = $('[data-query-repeat-remove]', row);
    if (remove) remove.setAttribute('aria-label', `Remove ${label.toLocaleLowerCase()} ${index + 1}`);
  });
}

function addQueryRepeatRow(kind) {
  const config = {
    city: { container: '#queryCities', label: 'City', fields: '<label class="field"><span class="query-repeat-title">City</span><input name="queryCity" type="text" placeholder="Search city…" /></label><label class="field"><span>Days</span><input name="queryCityDays" type="number" min="1" value="1" /></label>' },
    stop: { container: '#queryStops', label: 'Stop', fields: '<label class="field"><span class="query-repeat-title">Stop</span><input name="routeStop" type="text" placeholder="Station, terminal, or address" /></label><label class="field"><span>Wait</span><input name="stopWait" type="text" placeholder="Optional" /></label>' },
    vehicle: { container: '#queryVehicles', label: 'Vehicle', fields: '<label class="field"><span class="query-repeat-title">Vehicle</span><select name="vehicleType"><option>Car</option><option>SUV</option><option>Van</option><option>Tempo traveller</option><option>Bus</option><option>Coach</option></select></label><label class="field"><span>Units</span><input name="vehicleUnits" type="number" min="1" value="1" /></label>' },
  }[kind];
  if (!config) return;
  const container = $(config.container, queryRepeatFields);
  if (!container) return;
  const row = document.createElement('div');
  row.className = `query-repeat-row query-${kind}-row`;
  row.innerHTML = `${config.fields}<button class="row-menu" type="button" data-query-repeat-remove aria-label="Remove ${config.label.toLocaleLowerCase()}"><svg><use href="#i-x" /></svg></button>`;
  container.append(row);
  renumberQueryRows(container, config.label);
  $('input, select', row)?.focus();
  updateQuerySecondaryAction();
}

function queryTitleFromForm(type, values, customer) {
  const value = (name) => String(values.get(name) || '').trim();
  if (type === 'Trip') return value('destination') ? `${value('destination')} trip for ${customer.name}` : `Trip query for ${customer.name}`;
  if (type === 'Flight') return value('flightOrigin') || value('flightDestination')
    ? `${value('flightOrigin') || 'Origin'} to ${value('flightDestination') || 'Destination'} flights for ${customer.name}`
    : `Flight query for ${customer.name}`;
  if (type === 'Accommodation') return value('stayDestination') ? `${value('stayDestination')} accommodation for ${customer.name}` : `Accommodation query for ${customer.name}`;
  if (type === 'Visa') return value('visaCountry') ? `${value('visaCountry')} visa for ${customer.name}` : `Visa query for ${customer.name}`;
  if (type === 'Cruise') return value('cruiseRegion') ? `${value('cruiseRegion')} cruise for ${customer.name}` : `Cruise query for ${customer.name}`;
  return value('transportDeparture') || value('transportDestination')
    ? `${value('transportDeparture') || 'Departure'} to ${value('transportDestination') || 'Destination'} transport for ${customer.name}`
    : `Transport query for ${customer.name}`;
}

function querySummaryFromForm(type, values) {
  if (type === 'Trip') return [values.get('departureCity'), values.get('destination')].filter(Boolean).join(' to ') || values.get('scope');
  if (type === 'Flight') return [values.get('flightOrigin'), values.get('flightDestination')].filter(Boolean).join(' to ');
  if (type === 'Accommodation') return `${values.get('accommodationType')} · ${values.get('stayDestination')}`;
  if (type === 'Visa') return `${values.get('visaType')} visa · ${values.get('visaCountry')}`;
  if (type === 'Cruise') return [values.get('departurePort'), values.get('arrivalPort')].filter(Boolean).join(' to ') || values.get('cruiseRegion');
  return [values.get('transportDeparture'), values.get('transportDestination')].filter(Boolean).join(' to ');
}

function queryFromForm(draft = false) {
  const values = new FormData(queryForm);
  const customer = customers.find((item) => item.id === values.get('customer'));
  if (!customer) return { customer: null, query: null };
  const type = String(values.get('queryType'));
  const title = queryTitleFromForm(type, values, customer);
  const owners = [...new Set(values.getAll('assignedTo').map((name) => String(name).trim()).filter(Boolean))];
  const owner = owners[0] ?? 'Unassigned';
  const query = {
    id: `QRY-${Date.now().toString(36).slice(-6).toUpperCase()}`,
    type,
    title,
    summary: querySummaryFromForm(type, values),
    status: draft || owner === 'Unassigned' ? 'Unassigned' : 'New',
    profileStatus: draft ? 'Draft' : 'New',
    priority: String(values.get('priority') || 'Medium'),
    delay: draft ? 'Draft saved' : values.get('dueDate') ? 'Follow-up scheduled' : 'Internal review',
    pendingOn: 'Us',
    value: Number(values.get('budget') || 0),
    activity: 'Just now',
    owner,
    owners,
    customerId: customer.id,
    adults: Number(values.get('adults') || 1),
    children: Number(values.get('children') || 0),
    infants: Number(values.get('infants') || 0),
    details: Object.fromEntries([...values.entries()].filter(([key]) => !['childAge', 'starRating', 'queryCity', 'queryCityDays', 'vehicleType', 'vehicleUnits'].includes(key))),
    tripCities: values.getAll('queryCity').map((city, index) => ({ city: String(city).trim(), nights: Number(values.getAll('queryCityDays')[index] || 1) })).filter((stop) => stop.city),
    tripVehicles: values.getAll('vehicleType').map((vehicle, index) => ({ type: String(vehicle), units: Number(values.getAll('vehicleUnits')[index] || 1) })),
    childAges: values.getAll('childAge').map(Number).filter(Boolean),
    starRatings: values.getAll('starRating'),
  };
  return { customer, query };
}

function pipelineDateLabel(value) {
  if (!value) return 'Not set';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
}

function pipelineStatusClass(status) {
  if (['Accepted', 'Confirmed', 'Won', 'Paid'].includes(status)) return 'status-valid';
  if (['New', 'Published', 'Sent'].includes(status)) return 'status-requested';
  if (['Quoting', 'Negotiation', 'Pending'].includes(status)) return 'status-approval';
  if (['Draft', 'Unassigned'].includes(status)) return 'status-draft';
  if (['Lost', 'Cancelled'].includes(status)) return 'status-expired';
  return 'status-requested';
}

function customerVouchersFor(customer) {
  const createdVouchers = (customer.bookings ?? []).map((booking) => {
    const serviceType = booking.serviceType || booking.type || 'Booking';
    const price = booking.sellingPrice ? formatCurrency(booking.sellingPrice) : 'Price pending';
    return {
      id: `VCH-${booking.id}`,
      customerId: customer.id,
      type: serviceType,
      title: booking.title,
      serviceSummary: booking.serviceDescription || `${booking.paxCount} ${booking.paxCount === 1 ? 'traveller' : 'travellers'} · ${price}`,
      referenceLabel: serviceType === 'Flight' ? 'Booking ref' : 'Booking',
      reference: booking.id,
      secondaryReference: booking.operationalNotes || (serviceType === 'Flight' ? 'PNR pending' : 'Supplier confirmation pending'),
      serviceDate: booking.travelStartDate,
      status: booking.status,
    };
  });
  return [...createdVouchers, ...customerVoucherRecords.filter((voucher) => voucher.customerId === customer.id)];
}

function renderCustomerPipeline(customer = selectedCustomer) {
  const queries = queryModuleRecords.filter((query) => query.customerId === customer.id);
  const proposals = customerProposalRecords.filter((proposal) => proposal.customerId === customer.id);
  const vouchers = customerVouchersFor(customer);
  const proposalValue = proposals.reduce((sum, proposal) => sum + proposal.amount, 0);

  $('#customerPipelineQueryTotal').textContent = queries.length;
  $('#customerPipelineProposalTotal').textContent = proposals.length;
  $('#customerPipelineProposalValue').textContent = formatCurrency(proposalValue);
  $('#customerPipelineVoucherTotal').textContent = vouchers.length;
  $('#customerPipelineQueryCount').textContent = queries.length;
  $('#customerPipelineProposalCount').textContent = proposals.length;
  $('#customerPipelineVoucherCount').textContent = vouchers.length;

  const allowedViews = new Set(['queries', 'proposals', 'vouchers']);
  if (!allowedViews.has(activeCustomerPipelineView)) activeCustomerPipelineView = 'queries';
  $$('[data-customer-pipeline-view]', $('#profilePanelPipeline')).forEach((tab) => {
    const active = tab.dataset.customerPipelineView === activeCustomerPipelineView;
    tab.classList.toggle('is-active', active);
    tab.setAttribute('aria-selected', String(active));
    tab.tabIndex = active ? 0 : -1;
  });

  if (activeCustomerPipelineView === 'queries') {
    customerPipelineContent.innerHTML = queries.length
      ? `<div class="customer-pipeline-table-wrap"><table class="customer-pipeline-table" aria-label="Customer queries">
          <thead><tr><th>Query</th><th>Type</th><th>Status</th><th>Budget</th><th>Owner</th><th>Updated</th></tr></thead>
          <tbody>${queries.map((query) => `<tr>
            <td><strong>${escapeHTML(query.title)}</strong><small>${escapeHTML(query.id)} · ${escapeHTML(query.delay)}</small></td>
            <td><span class="pipeline-kind">${escapeHTML(query.type)}</span></td>
            <td><span class="status-badge ${pipelineStatusClass(query.status)}">${escapeHTML(query.status)}</span></td>
            <td class="pipeline-money">${query.value ? formatCurrency(query.value) : '—'}</td>
            <td>${escapeHTML(assigneeDisplayNames(queryOwnerList(query)))}</td>
            <td>${escapeHTML(query.activity)}</td>
          </tr>`).join('')}</tbody>
        </table></div>`
      : '<div class="customer-pipeline-empty"><strong>No queries for this customer</strong><p>New queries linked to this customer will appear here.</p></div>';
    return;
  }

  if (activeCustomerPipelineView === 'proposals') {
    customerPipelineContent.innerHTML = proposals.length
      ? `<div class="customer-pipeline-table-wrap"><table class="customer-pipeline-table customer-proposal-table" aria-label="Customer proposals">
          <thead><tr><th>Proposal and package</th><th>Linked query</th><th>Sent</th><th>Status</th><th>Amount</th></tr></thead>
          <tbody>${proposals.map((proposal) => `<tr>
            <td><strong>${escapeHTML(proposal.title)}</strong><small>${escapeHTML(proposal.id)} · ${escapeHTML(proposal.package)}</small></td>
            <td>${escapeHTML(proposal.linkedQuery)}</td>
            <td><strong>${escapeHTML(pipelineDateLabel(proposal.sentAt))}</strong><small>Valid until ${escapeHTML(pipelineDateLabel(proposal.validUntil))}</small></td>
            <td><span class="status-badge ${pipelineStatusClass(proposal.status)}">${escapeHTML(proposal.status)}</span></td>
            <td class="pipeline-money">${formatCurrency(proposal.amount)}</td>
          </tr>`).join('')}</tbody>
        </table></div>`
      : '<div class="customer-pipeline-empty"><strong>No proposals sent</strong><p>Packages shared with this customer will appear here.</p></div>';
    return;
  }

  customerPipelineContent.innerHTML = vouchers.length
    ? `<div class="customer-pipeline-table-wrap"><table class="customer-pipeline-table customer-voucher-table" aria-label="Customer booking vouchers">
        <thead><tr><th>Voucher and service</th><th>Booking details</th><th>Reference</th><th>Travel or use date</th><th>Status</th></tr></thead>
        <tbody>${vouchers.map((voucher) => `<tr>
          <td><span class="pipeline-voucher-title"><span class="pipeline-kind">${escapeHTML(voucher.type)}</span><strong>${escapeHTML(voucher.title)}</strong></span><small>${escapeHTML(voucher.id)}</small></td>
          <td><strong>${escapeHTML(voucher.serviceSummary)}</strong><small>${escapeHTML(voucher.secondaryReference)}</small></td>
          <td><small>${escapeHTML(voucher.referenceLabel)}</small><b class="pipeline-reference">${escapeHTML(voucher.reference)}</b></td>
          <td>${escapeHTML(pipelineDateLabel(voucher.serviceDate))}</td>
          <td><span class="status-badge ${pipelineStatusClass(voucher.status)}">${escapeHTML(voucher.status)}</span></td>
        </tr>`).join('')}</tbody>
      </table></div>`
    : '<div class="customer-pipeline-empty"><strong>No vouchers issued</strong><p>Confirmed flight, stay, invoice, activity and attraction records will appear here.</p></div>';
}

function persistQuery(draft = false) {
  if (!draft && !queryFormIsValid()) return;
  const { customer, query } = queryFromForm(draft);
  if (!customer || !query) return;
  customer.queries ||= [];
  customer.queries.unshift(query);
  queryModuleRecords.unshift(query);
  closeQueryOnboarding();
  activeQueryCategory = query.type;
  activeQueryStatus = query.status;
  setView('queries');
  showToast(draft ? `${query.type} query draft saved` : `${query.type} query created`);
}

function submitQuery() {
  if (!queryFormIsValid()) return;
  persistQuery();
}

function bookingHasChanges() {
  const values = new FormData(bookingForm);
  return String(values.get('customer')) !== bookingInitialCustomerId
    || String(values.get('bookingTitle') || '').trim()
    || String(values.get('bookingType')) !== 'Trip'
    || String(values.get('currency')) !== 'INR'
    || Number(values.get('paxCount')) !== 1
    || Number(values.get('sellingPrice')) > 0
    || Number(values.get('taxPercent')) > 0
    || String(values.get('travelStartDate') || '')
    || String(values.get('travelEndDate') || '')
    || String(values.get('serviceDescription') || '').trim()
    || String(values.get('operationalNotes') || '').trim();
}

function updateBookingSecondaryAction() {
  const savesDraft = bookingHasChanges();
  bookingSecondary.querySelector('span').textContent = savesDraft ? 'Save as draft' : 'Cancel';
  bookingSecondary.querySelector('svg').hidden = savesDraft;
  bookingSecondary.dataset.action = savesDraft ? 'draft' : 'cancel';
}

function validateBookingDates() {
  const startDate = $('[name="travelStartDate"]', bookingForm);
  const endDate = $('[name="travelEndDate"]', bookingForm);
  const invalidRange = Boolean(startDate.value && endDate.value && endDate.value < startDate.value);
  endDate.setCustomValidity(invalidRange ? 'Travel end date must be on or after the start date.' : '');
}

function updateBookingContinueState() {
  validateBookingDates();
  bookingContinue.disabled = $$('input, select, textarea', bookingForm).some((field) => !field.checkValidity());
}


function syncBookingSetupFields() {
  const setup = $('[name="operationsSetup"]:checked', bookingForm)?.value || 'service';
  const usesService = setup === 'service';
  bookingServiceFields.hidden = !usesService;
  bookingNoteFields.hidden = usesService;
  $$('input, select, textarea', bookingServiceFields).forEach((field) => { field.disabled = !usesService; });
  $$('input, select, textarea', bookingNoteFields).forEach((field) => { field.disabled = usesService; });
  updateBookingContinueState();
}

function resetBookingOnboarding(customer = null) {
  bookingForm.reset();
  bookingCustomer.innerHTML = customers.map((item) => `<option value="${escapeHTML(item.id)}">${escapeHTML(item.name)} · ${escapeHTML(item.id)}</option>`).join('');
  const customerId = customer?.id && customers.some((item) => item.id === customer.id) ? customer.id : customers[0]?.id;
  bookingCustomer.value = customerId || '';
  bookingInitialCustomerId = bookingCustomer.value;
  syncBookingSetupFields();
  updateBookingSecondaryAction();
  updateBookingContinueState();
}

function openBookingOnboarding(customer = null, returnFocus = document.activeElement) {
  bookingReturnFocus = returnFocus;
  resetBookingOnboarding(customer);
  openModal(bookingModalBackdrop, $('[name="bookingTitle"]', bookingForm));
}

function closeBookingOnboarding() {
  bookingModalBackdrop.hidden = true;
  document.body.style.overflow = '';
  resetBookingOnboarding();
  bookingReturnFocus?.focus();
  bookingReturnFocus = null;
}

function bookingFormIsValid() {
  updateBookingContinueState();
  const invalidField = $$('input, select, textarea', bookingForm).find((field) => !field.checkValidity());
  if (!invalidField) return true;
  invalidField.reportValidity();
  invalidField.focus();
  return false;
}

function bookingFromForm(draft = false) {
  const values = new FormData(bookingForm);
  return {
    customer: customers.find((item) => item.id === values.get('customer')),
    booking: {
      id: `BKG-${Date.now().toString(36).slice(-6).toUpperCase()}`,
      status: draft ? 'Draft' : 'Pending',
      title: String(values.get('bookingTitle') || '').trim() || 'Untitled booking',
      type: String(values.get('bookingType') || 'Trip'),
      currency: String(values.get('currency') || 'INR'),
      travelStartDate: String(values.get('travelStartDate') || ''),
      travelEndDate: String(values.get('travelEndDate') || ''),
      paxCount: Number(values.get('paxCount') || 1),
      sellingPrice: Number(values.get('sellingPrice') || 0),
      taxPercent: Number(values.get('taxPercent') || 0),
      operationsSetup: String(values.get('operationsSetup') || 'service'),
      serviceType: String(values.get('serviceType') || ''),
      serviceDescription: String(values.get('serviceDescription') || '').trim(),
      serviceCost: Number(values.get('serviceCost') || 0),
      operationalNotes: String(values.get('operationalNotes') || '').trim(),
    },
  };
}


function persistBooking(draft = false) {
  if (!draft && !bookingFormIsValid()) return;
  const { customer, booking } = bookingFromForm(draft);
  if (!customer) return;
  customer.bookings ||= [];
  customer.bookings.unshift(booking);
  closeBookingOnboarding();
  activeCustomerPipelineView = 'vouchers';
  setView('detail', customer);
  setProfileTab('pipeline');
  showToast(draft ? 'Booking draft saved' : 'Booking successfully created');
}

function submitBooking() {
  if (!bookingFormIsValid()) return;
  persistBooking();
}

function setOptionsOpen(button, options, open) {
  button.setAttribute('aria-expanded', String(open));
  options.hidden = !open;
}

function syncFilterControls() {
  const tiers = tierSelection(appliedFilters.tier);
  const groups = tierSelection(appliedFilters.groupType);
  $$('[data-filter-value]', tierFilterOptions).forEach((input) => { input.checked = tiers.includes(input.dataset.filterValue); });
  $$('[data-group-value]', groupFilterOptions).forEach((input) => { input.checked = groups.includes(input.dataset.groupValue); });
  outstandingFilter.checked = appliedFilters.outstanding;
  expiringFilter.checked = appliedFilters.expiring;
  const count = tiers.length + groups.length + Number(appliedFilters.outstanding) + Number(appliedFilters.expiring);
  $('.filter-button-label', filterButton).textContent = count ? `Filters ${count}` : 'Filters';
  filterButton.classList.toggle('has-active', count > 0);
  $('#clearCustomerFilters').hidden = count === 0;
}

function queryFiltersChanged() {
  return pendingQueryFilters.scope !== activeQueryScope
    || pendingQueryFilters.priority !== queryFilters.priority
    || pendingQueryFilters.pendingOn !== queryFilters.pendingOn
    || pendingQueryFilters.tier !== queryFilters.tier;
}

function syncQueryFilterControls() {
  const scopeLabel = pendingQueryFilters.scope === 'all' ? 'All' : 'Mine';
  $('#queryScopeValue').textContent = scopeLabel;
  $('#queryPriorityValue').textContent = pendingQueryFilters.priority === 'all' ? 'Priority' : pendingQueryFilters.priority;
  $('#queryPendingValue').textContent = pendingQueryFilters.pendingOn === 'all' ? 'Pending on' : pendingQueryFilters.pendingOn;
  $('#queryTierValue').textContent = pendingQueryFilters.tier === 'all' ? 'Customer tier' : pendingQueryFilters.tier;
  queryScopeButton.classList.toggle('has-value', pendingQueryFilters.scope !== 'mine' || activeQueryScope !== 'mine');
  queryPriorityButton.classList.toggle('has-value', pendingQueryFilters.priority !== 'all');
  queryPendingButton.classList.toggle('has-value', pendingQueryFilters.pendingOn !== 'all');
  queryTierButton.classList.toggle('has-value', pendingQueryFilters.tier !== 'all');
  $$('#queryScopeOptions [data-query-option]').forEach((option) => option.setAttribute('aria-selected', String(option.dataset.value === pendingQueryFilters.scope)));
  $$('#queryPriorityOptions [data-query-option]').forEach((option) => option.setAttribute('aria-selected', String(option.dataset.value === pendingQueryFilters.priority)));
  $$('#queryPendingOptions [data-query-option]').forEach((option) => option.setAttribute('aria-selected', String(option.dataset.value === pendingQueryFilters.pendingOn)));
  $$('#queryTierOptions [data-query-option]').forEach((option) => option.setAttribute('aria-selected', String(option.dataset.value === pendingQueryFilters.tier)));
  if (applyQueryFiltersButton) applyQueryFiltersButton.disabled = !queryFiltersChanged();
}

function openQueryFilterPopover() {
  pendingQueryFilters.scope = activeQueryScope;
  pendingQueryFilters.priority = queryFilters.priority;
  pendingQueryFilters.pendingOn = queryFilters.pendingOn;
  pendingQueryFilters.tier = queryFilters.tier;
  syncQueryFilterControls();
  queriesFilterPopover.hidden = false;
  queriesFilterButton.setAttribute('aria-expanded', 'true');
}

function closeQueryFilterPopover() {
  queriesFilterPopover.hidden = true;
  queriesFilterButton.setAttribute('aria-expanded', 'false');
  [queryScopeButton, queryPriorityButton, queryPendingButton, queryTierButton].forEach((button) => button?.setAttribute('aria-expanded', 'false'));
  [queryScopeOptions, queryPriorityOptions, queryPendingOptions, queryTierOptions].forEach((options) => { if (options) options.hidden = true; });
}

function openFilterPopover() {
  renderTierFilterOptions();
  syncFilterControls();
  filterPopover.hidden = false;
  filterButton.setAttribute('aria-expanded', 'true');
}

function closeFilterPopover() {
  filterPopover.hidden = true;
  filterButton.setAttribute('aria-expanded', 'false');
}

function vaultFiltersChanged() {
  const appliedTiers = tierSelection(appliedVaultFilters.tier);
  const pendingTiers = tierSelection(pendingVaultFilters.tier);
  if (appliedTiers.length !== pendingTiers.length || appliedTiers.some((tier) => !pendingTiers.includes(tier))) return true;
  return Object.keys(appliedVaultFilters).some((key) => key !== 'tier' && appliedVaultFilters[key] !== pendingVaultFilters[key]);
}

function syncVaultFilterControls() {
  const pendingTiers = tierSelection(pendingVaultFilters.tier);
  $('#vaultTierValue').textContent = pendingTiers.length === 1 ? pendingTiers[0] : pendingTiers.length > 1 ? `${pendingTiers.length} tiers` : 'Tier';
  $('#vaultCategoryValue').textContent = pendingVaultFilters.category || 'Category';
  vaultTierButton.classList.toggle('has-value', pendingTiers.length > 0);
  vaultCategoryButton.classList.toggle('has-value', Boolean(pendingVaultFilters.category));
  vaultExpiringFilter.checked = pendingVaultFilters.expiring;
  $$('[data-vault-tier]', vaultTierOptions).forEach((option) => {
    option.setAttribute('aria-selected', String(pendingTiers.includes(option.dataset.vaultTier)));
  });
  $$('[data-vault-category]', vaultCategoryOptions).forEach((option) => {
    option.setAttribute('aria-selected', String(option.dataset.vaultCategory === pendingVaultFilters.category));
  });
  vaultApplyFiltersButton.disabled = !vaultFiltersChanged();
}

function openVaultFilterPopover() {
  Object.assign(pendingVaultFilters, appliedVaultFilters);
  pendingVaultFilters.tier = tierSelection(appliedVaultFilters.tier);
  syncVaultFilterControls();
  vaultFilterPopover.hidden = false;
  vaultFilterButton.setAttribute('aria-expanded', 'true');
}

function closeVaultFilterPopover() {
  vaultFilterPopover.hidden = true;
  vaultFilterButton.setAttribute('aria-expanded', 'false');
  setOptionsOpen(vaultTierButton, vaultTierOptions, false);
  setOptionsOpen(vaultCategoryButton, vaultCategoryOptions, false);
}

function renderVaultFilterChips() {
  const chips = [
    ...tierSelection(appliedVaultFilters.tier).map((tier) => ({ key: 'tier', tier, label: `${tier} Tier` })),
    appliedVaultFilters.category && { key: 'category', label: appliedVaultFilters.category },
    appliedVaultFilters.expiring && { key: 'expiring', label: 'Document expiring soon' },
  ].filter(Boolean);
  vaultAppliedFiltersElement.innerHTML = chips.map((chip) => `<span class="filter-chip">${escapeHTML(chip.label)}<button type="button" data-clear-vault-filter="${chip.key}"${chip.tier ? ` data-tier-value="${escapeHTML(chip.tier)}"` : ''}${chip.group ? ` data-group-value="${escapeHTML(chip.group)}"` : ''} aria-label="Remove ${escapeHTML(chip.label)} filter"><svg><use href="#i-x" /></svg></button></span>`).join('');
  vaultAppliedFiltersElement.hidden = chips.length === 0;
  vaultFilterButton.classList.toggle('has-active', chips.length > 0);
}

function applyVaultFiltersAndRender() {
  Object.assign(appliedVaultFilters, pendingVaultFilters);
  appliedVaultFilters.tier = tierSelection(pendingVaultFilters.tier);
  vaultPage = 1;
  expandedVaultCustomer = null;
  renderVaultFilterChips();
  renderVault();
  closeVaultFilterPopover();
}

function clearAppliedFilters() {
  appliedFilters.tier = [];
  appliedFilters.groupType = [];
  appliedFilters.outstanding = false;
  appliedFilters.expiring = false;
  syncFilterControls();
}

function formatFileSize(file) {
  const megabytes = file.size / (1024 * 1024);
  if (megabytes < 0.1) return '< 0.1 MB';
  return `${megabytes.toFixed(megabytes >= 10 ? 0 : 1).replace('.0', '')} MB`;
}

function setImportFile(file) {
  if (!file) return;
  if (file.size > 50 * 1024 * 1024) {
    showToast('Choose a file under 50MB');
    return;
  }
  selectedImportFile = file;
  $('#importFileName').textContent = file.name;
  $('#importFileSize').textContent = formatFileSize(file);
  importFileCard.hidden = false;
  submitImport.disabled = false;
}

function resetImportFile() {
  selectedImportFile = null;
  importFileInput.value = '';
  importFileCard.hidden = true;
  submitImport.disabled = true;
}

function importSampleCell(value) {
  const text = String(value ?? '');
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function downloadImportSampleCsv() {
  const rows = [
    ['code', 'name', 'category', 'group_type', 'tier', 'location', 'travellers', 'phone', 'email'],
    ['CUST-0101', 'Sharma Family', 'B2C', 'Family', 'Gold', 'Jaipur', '4', '+91 98290 12345', 'sharma.family@example.com'],
    ['', 'Acme Travels Pvt Ltd', 'B2B', 'Corporate', 'Silver', 'Mumbai', '12', '+91 98765 43210', 'hello@acmetravels.com'],
  ];
  const csv = rows.map((row) => row.map(importSampleCell).join(',')).join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'customers-sample.csv';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function closeImportModal() {
  closeModal(importModalBackdrop, importForm, $('#importButton'));
  resetImportFile();
}

function refreshControl(button, message, render) {
  if (!button || button.disabled) return;
  const label = $('span', button);
  const originalText = label?.textContent;
  button.disabled = true;
  button.classList.add('is-refreshing');
  button.setAttribute('aria-busy', 'true');
  if (label) label.textContent = 'Refreshing';
  window.setTimeout(() => {
    try {
      if (typeof render === 'function') render();
    } finally {
      button.disabled = false;
      button.classList.remove('is-refreshing');
      button.removeAttribute('aria-busy');
      if (label && originalText) label.textContent = originalText;
      showToast(message);
    }
  }, 650);
}

function hideSidebarTooltip() {
  if (sidebarTooltipTarget?.getAttribute('aria-describedby') === 'sidebarTooltip') {
    sidebarTooltipTarget.removeAttribute('aria-describedby');
  }
  sidebarTooltipTarget = null;
  sidebarTooltip.hidden = true;
}

function showSidebarTooltip(item) {
  if (!appShell.classList.contains('is-collapsed') || mobileSidebarQuery.matches) return;
  const label = item.dataset.sidebarLabel;
  if (!label) return;
  hideSidebarTooltip();
  sidebarTooltipTarget = item;
  item.setAttribute('aria-describedby', 'sidebarTooltip');
  sidebarTooltip.textContent = label;
  sidebarTooltip.hidden = false;
  const rect = item.getBoundingClientRect();
  const zoom = Number.parseFloat(getComputedStyle(document.body).zoom) || 1;
  sidebarTooltip.style.left = `${(rect.right + 10) / zoom}px`;
  sidebarTooltip.style.top = `${(rect.top + rect.height / 2) / zoom}px`;
}

function setSidebarCollapsed(collapsed) {
  hideSidebarTooltip();
  appShell.classList.toggle('is-collapsed', collapsed);
  collapseButton.setAttribute('aria-label', collapsed ? 'Expand navigation' : 'Collapse navigation');
  collapseButton.setAttribute('aria-expanded', String(!collapsed));
  $('.collapse-label-collapse', collapseButton).textContent = 'Collapse';
  $$('.sidebar .nav-item').forEach((item) => {
    const label = $('span:not(.nav-count)', item)?.textContent.trim();
    if (label) item.dataset.sidebarLabel = label;
    item.removeAttribute('title');
  });
}

function setMobileSidebarOpen(open) {
  const isOpen = mobileSidebarQuery.matches && open;
  appShell.classList.toggle('is-mobile-open', isOpen);
  document.body.classList.toggle('sidebar-open', isOpen);
  [mobileNavButton, dashboardMobileNavButton, inboxMobileNavButton, queriesMobileNavButton, tasksMobileNavButton].forEach((button) => button.setAttribute('aria-expanded', String(isOpen)));
  sidebar.inert = mobileSidebarQuery.matches && !isOpen;
  collapseButton.setAttribute('aria-expanded', String(isOpen));
  if (mobileSidebarQuery.matches) {
    hideSidebarTooltip();
    collapseButton.setAttribute('aria-label', 'Close navigation');
    $('.collapse-label-collapse', collapseButton).textContent = 'Close';
  }
}

function syncSidebarForViewport() {
  setMobileSidebarOpen(false);
  if (mobileSidebarQuery.matches) {
    appShell.classList.remove('is-collapsed');
    return;
  }
  sidebar.inert = false;
  setSidebarCollapsed(desktopSidebarCollapsed);
}

collapseButton.addEventListener('click', () => {
  hideSidebarTooltip();
  if (mobileSidebarQuery.matches) {
    setMobileSidebarOpen(false);
    mobileNavReturnFocus?.focus();
    return;
  }
  const collapsed = !appShell.classList.contains('is-collapsed');
  setSidebarCollapsed(collapsed);
  desktopSidebarCollapsed = collapsed;
});

sidebar.addEventListener('pointerover', (event) => {
  const item = event.target.closest('.nav-item');
  if (item && sidebar.contains(item)) showSidebarTooltip(item);
});
sidebar.addEventListener('pointerout', (event) => {
  const item = event.target.closest('.nav-item');
  if (item && !item.contains(event.relatedTarget) && !item.contains(document.activeElement)) hideSidebarTooltip();
});
sidebar.addEventListener('focusin', (event) => {
  const item = event.target.closest('.nav-item');
  if (item) showSidebarTooltip(item);
});
sidebar.addEventListener('focusout', (event) => {
  const item = event.target.closest('.nav-item');
  if (item && !item.contains(event.relatedTarget)) hideSidebarTooltip();
});
$('.sidebar-scroll').addEventListener('scroll', hideSidebarTooltip);
window.addEventListener('resize', hideSidebarTooltip);

[mobileNavButton, dashboardMobileNavButton, inboxMobileNavButton, queriesMobileNavButton, tasksMobileNavButton].forEach((button) => button.addEventListener('click', () => {
  mobileNavReturnFocus = button;
  setMobileSidebarOpen(true);
  collapseButton.focus();
}));

sidebarBackdrop.addEventListener('click', () => {
  setMobileSidebarOpen(false);
  mobileNavReturnFocus?.focus();
});

mobileSidebarQuery.addEventListener('change', syncSidebarForViewport);
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && appShell.classList.contains('is-mobile-open')) {
    setMobileSidebarOpen(false);
    mobileNavReturnFocus?.focus();
  }
});

queryNavLink.addEventListener('click', (event) => {
  event.preventDefault();
  setQueryCategory('Trip');
  setView('queries');
  if (mobileSidebarQuery.matches) setMobileSidebarOpen(false);
});
$('#createQueryButton').addEventListener('click', (event) => openQueryTypeSelector(null, event.currentTarget));
$('#queryEmptyCreate').addEventListener('click', (event) => openQueryTypeSelector(null, event.currentTarget));
$('#queriesRefreshButton').addEventListener('click', () => {
  renderQueryModule();
  showToast('Queries refreshed');
});
queriesSearch.addEventListener('input', () => {
  queryListPage = 1;
  renderQueryModule();
});
$$('[data-query-category]').forEach((tab) => tab.addEventListener('click', () => {
  setQueryCategory(tab.dataset.queryCategory, true);
}));
$$('[data-query-layout]').forEach((button) => button.addEventListener('click', () => {
  activeQueryLayout = button.dataset.queryLayout;
  saveLayoutPreference('queries', activeQueryLayout);
  queryListPage = 1;
  renderQueryModule();
}));
$$('[data-query-scope]').forEach((button) => button.addEventListener('click', () => {
  activeQueryScope = button.dataset.queryScope;
  if (queriesScopeFilter) queriesScopeFilter.value = activeQueryScope;
  queryListPage = 1;
  renderQueryModule();
}));
queriesScopeFilter?.addEventListener('change', () => {
  activeQueryScope = queriesScopeFilter.value === 'all' ? 'all' : 'mine';
  queryListPage = 1;
  renderQueryModule();
});
queryStatusTabs.addEventListener('click', (event) => {
  const tab = event.target.closest('[data-query-status]');
  if (!tab) return;
  activeQueryStatus = tab.dataset.queryStatus;
  queryListPage = 1;
  renderQueryModule();
});
queriesFilterButton.addEventListener('click', () => {
  if (queriesFilterPopover.hidden) openQueryFilterPopover();
  else closeQueryFilterPopover();
});
[[queryScopeButton, queryScopeOptions], [queryPriorityButton, queryPriorityOptions], [queryPendingButton, queryPendingOptions], [queryTierButton, queryTierOptions]].forEach(([button, options]) => {
  button?.addEventListener('click', () => {
    const open = options.hidden;
    [[queryScopeButton, queryScopeOptions], [queryPriorityButton, queryPriorityOptions], [queryPendingButton, queryPendingOptions], [queryTierButton, queryTierOptions]].forEach(([otherButton, otherOptions]) => setOptionsOpen(otherButton, otherOptions, false));
    setOptionsOpen(button, options, open);
  });
});
queriesFilterPopover.addEventListener('click', (event) => {
  const option = event.target.closest('[data-query-option]');
  if (!option) return;
  const kind = option.dataset.queryOption;
  const value = option.dataset.value;
  if (kind === 'scope') pendingQueryFilters.scope = value;
  else if (kind === 'priority') pendingQueryFilters.priority = pendingQueryFilters.priority === value ? 'all' : value;
  else if (kind === 'pendingOn') pendingQueryFilters.pendingOn = pendingQueryFilters.pendingOn === value ? 'all' : value;
  else if (kind === 'tier') pendingQueryFilters.tier = pendingQueryFilters.tier === value ? 'all' : value;
  [[queryScopeButton, queryScopeOptions], [queryPriorityButton, queryPriorityOptions], [queryPendingButton, queryPendingOptions], [queryTierButton, queryTierOptions]].forEach(([otherButton, otherOptions]) => setOptionsOpen(otherButton, otherOptions, false));
  syncQueryFilterControls();
});
$('#applyQueryFilters').addEventListener('click', () => {
  activeQueryScope = pendingQueryFilters.scope;
  queryFilters.priority = pendingQueryFilters.priority;
  queryFilters.pendingOn = pendingQueryFilters.pendingOn;
  queryFilters.tier = pendingQueryFilters.tier;
  if (queriesScopeFilter) queriesScopeFilter.value = activeQueryScope;
  if (queriesPriorityFilter) queriesPriorityFilter.value = queryFilters.priority;
  if (queriesPendingFilter) queriesPendingFilter.value = queryFilters.pendingOn;
  if (queriesTierFilter) queriesTierFilter.value = queryFilters.tier;
  closeQueryFilterPopover();
  const scopeActive = activeQueryScope !== 'mine';
  queriesFilterButton.classList.toggle('has-active', scopeActive || Object.values(queryFilters).some((value) => value !== 'all'));
  queryListPage = 1;
  renderQueryModule();
});
$('#clearQueryFilters').addEventListener('click', () => {
  activeQueryScope = 'mine';
  queryFilters.priority = 'all';
  queryFilters.pendingOn = 'all';
  queryFilters.tier = 'all';
  Object.assign(pendingQueryFilters, { scope: 'mine', priority: 'all', pendingOn: 'all', tier: 'all' });
  if (queriesScopeFilter) queriesScopeFilter.value = 'mine';
  if (queriesPriorityFilter) queriesPriorityFilter.value = 'all';
  if (queriesPendingFilter) queriesPendingFilter.value = 'all';
  if (queriesTierFilter) queriesTierFilter.value = 'all';
  queriesFilterButton.classList.remove('has-active');
  closeQueryFilterPopover();
  syncQueryFilterControls();
  queryListPage = 1;
  renderQueryModule();
});
queryKanban.addEventListener('click', (event) => {
  const add = event.target.closest('[data-query-add-status]');
  if (add) {
    openQueryOnboarding(activeQueryCategory, null, add);
    return;
  }
  const card = event.target.closest('[data-query-id]');
  if (!card || suppressQueryCardClick) return;
  openQueryDetail(queryModuleRecords.find((query) => query.id === card.dataset.queryId));
});
queryKanban.addEventListener('keydown', (event) => {
  if (!['Enter', ' '].includes(event.key)) return;
  const card = event.target.closest('[data-query-id]');
  if (!card) return;
  event.preventDefault();
  openQueryDetail(queryModuleRecords.find((query) => query.id === card.dataset.queryId));
});
queryKanban.addEventListener('dragstart', (event) => {
  const card = event.target.closest('[data-query-id]');
  if (!card) return;
  draggedQueryId = card.dataset.queryId;
  suppressQueryCardClick = true;
  card.classList.add('is-dragging');
  event.dataTransfer.effectAllowed = 'move';
});
queryKanban.addEventListener('dragend', (event) => {
  event.target.closest('[data-query-id]')?.classList.remove('is-dragging');
  $$('.query-column.is-drag-over', queryKanban).forEach((column) => column.classList.remove('is-drag-over'));
  draggedQueryId = null;
  requestAnimationFrame(() => { suppressQueryCardClick = false; });
});
queryKanban.addEventListener('dragover', (event) => {
  const column = event.target.closest('[data-query-status-drop]');
  if (!column || !draggedQueryId) return;
  event.preventDefault();
  event.dataTransfer.dropEffect = 'move';
  $$('.query-column', queryKanban).forEach((item) => item.classList.toggle('is-drag-over', item === column));
});
queryKanban.addEventListener('drop', (event) => {
  const column = event.target.closest('[data-query-status-drop]');
  if (!column || !draggedQueryId) return;
  event.preventDefault();
  updateQueryModuleStatus(draggedQueryId, column.dataset.queryStatusDrop);
});
queryListBody.addEventListener('click', (event) => {
  const row = event.target.closest('[data-query-id]');
  if (!row) return;
  openQueryDetail(queryModuleRecords.find((query) => query.id === row.dataset.queryId));
});
queryListBody.addEventListener('keydown', (event) => {
  if (!['Enter', ' '].includes(event.key)) return;
  const row = event.target.closest('[data-query-id]');
  if (!row) return;
  event.preventDefault();
  openQueryDetail(queryModuleRecords.find((query) => query.id === row.dataset.queryId));
});

queryDetailContent.addEventListener('click', (event) => {
  const tab = event.target.closest('[data-query-detail-tab]');
  if (tab) {
    activeQueryDetailTab = tab.dataset.queryDetailTab;
    if (activeQueryDetailTab === 'communication') {
      queryMailFilter = 'all';
      selectedQueryMailIndex = null;
      closeQueryMailComposer(true);
    }
    renderQueryDetail();
    return;
  }
  const mailFilter = event.target.closest('[data-query-mail-filter]');
  if (mailFilter) {
    queryMailFilter = mailFilter.dataset.queryMailFilter;
    selectedQueryMailIndex = null;
    closeQueryMailComposer(true);
    renderQueryMailWorkspace();
    return;
  }
  const mailMessage = event.target.closest('[data-query-mail-index]');
  if (mailMessage) {
    openQueryMailReader(Number(mailMessage.dataset.queryMailIndex));
    return;
  }
  if (event.target.closest('[data-query-mail-reader-back]')) {
    selectedQueryMailIndex = null;
    renderQueryMailWorkspace();
    $('[data-query-mail-index]', queryDetailContent)?.focus();
    return;
  }
  if (event.target.closest('[data-query-mail-compose]')) {
    openQueryMailComposer();
    return;
  }
  const mailTemplate = event.target.closest('[data-query-mail-template]');
  if (mailTemplate) {
    openQueryMailComposer(mailTemplate.dataset.queryMailTemplate);
    return;
  }
  if (event.target.closest('[data-query-mail-template-button]')) {
    const scope = queryMailScope();
    const menu = $('[data-query-mail-template-menu]', scope);
    const button = $('[data-query-mail-template-button]', scope);
    const open = menu.hidden;
    menu.hidden = !open;
    button.setAttribute('aria-expanded', String(open));
    return;
  }
  if (event.target.closest('[data-query-mail-upload]')) {
    $('[data-query-mail-attachment-input]', queryMailScope())?.click();
    return;
  }
  const attachmentRemove = event.target.closest('[data-query-mail-attachment-remove]');
  if (attachmentRemove) {
    queryMailAttachments.splice(Number(attachmentRemove.dataset.queryMailAttachmentRemove), 1);
    renderQueryMailComposerAttachments();
    return;
  }
  if (event.target.closest('[data-query-mail-discard]')) {
    closeQueryMailComposer();
    renderQueryMailWorkspace();
    return;
  }
  if (event.target.closest('[data-query-mail-sidebar-toggle]')) {
    queryMailSidebarCollapsed = !queryMailSidebarCollapsed;
    renderQueryMailWorkspace();
    return;
  }
  const queryTaskCard = event.target.closest('[data-query-task-id]');
  if (queryTaskCard) {
    const task = taskRecords.find((record) => record.id === queryTaskCard.dataset.queryTaskId);
    if (task) openTaskModal({ task, returnFocus: queryTaskCard });
    return;
  }
  if (event.target.closest('#newQueryTaskButton')) {
    openQueryTaskModal(event.target.closest('#newQueryTaskButton'));
    return;
  }
  if (event.target.closest('#queryTaskFilterButton')) {
    if (queryTaskField('queryTaskFilterPopover')?.hidden) openQueryTaskFilterPopover();
    else closeQueryTaskFilterPopover();
    return;
  }
  if (event.target.closest('#applyQueryTaskFilters')) {
    Object.assign(queryTaskFilters, pendingQueryTaskFilters);
    queryTaskPage = 1;
    closeQueryTaskFilterPopover();
    renderQueryTasks();
    return;
  }
  if (event.target.closest('#clearQueryTaskFilters')) {
    Object.assign(pendingQueryTaskFilters, { priority: 'all', entity: 'all', assignee: 'all', sort: 'created-desc', from: '', to: '' });
    Object.assign(queryTaskFilters, pendingQueryTaskFilters);
    queryTaskSearchQuery = '';
    const searchInput = queryTaskField('queryTaskSearch');
    if (searchInput) searchInput.value = '';
    queryTaskPage = 1;
    closeQueryTaskFilterPopover();
    renderQueryTasks();
    return;
  }
  const queryTaskPageButton = event.target.closest('[data-query-task-page]');
  if (queryTaskPageButton && !queryTaskPageButton.disabled && !queryTaskPageButton.hasAttribute('data-pagination-blocked')) {
    const totalPages = Math.max(1, Math.ceil(filteredQueryTasks(selectedQuery).length / PROFILE_TASKS_PAGE_SIZE));
    const key = queryTaskPageButton.dataset.queryTaskPage;
    if (key === 'prev') queryTaskPage = Math.max(1, queryTaskPage - 1);
    else if (key === 'next') queryTaskPage = Math.min(totalPages, queryTaskPage + 1);
    else queryTaskPage = Number(key) || 1;
    renderQueryTasks();
    $('[aria-current="page"]', queryDetailContent)?.focus();
    return;
  }
  const proposalWorkspace = event.target.closest('[data-proposal-workspace]');
  if (proposalWorkspace) {
    proposalWorkspaceView = proposalWorkspace.dataset.proposalWorkspace;
    pendingProposalSourceId = null;
    proposalSearchTerm = '';
    renderQueryDetail();
    return;
  }
  const proposalAction = event.target.closest('[data-proposal-action]');
  if (proposalAction) {
    proposalWorkspaceView = 'create';
    proposalCatalogType = proposalAction.dataset.proposalAction === 'send-package' ? 'package' : 'itinerary';
    pendingProposalSourceId = null;
    proposalSearchTerm = '';
    renderQueryDetail();
    return;
  }
  const proposalSource = event.target.closest('[data-proposal-source]');
  if (proposalSource) {
    proposalCatalogType = proposalSource.dataset.proposalSource;
    pendingProposalSourceId = null;
    proposalSearchTerm = '';
    renderQueryDetail();
    return;
  }
  const proposalCatalogCard = event.target.closest('[data-proposal-catalog-id]');
  if (proposalCatalogCard) {
    pendingProposalSourceId = proposalCatalogCard.dataset.proposalCatalogId;
    renderQueryDetail();
    return;
  }
  const itineraryMode = event.target.closest('[data-itinerary-mode]');
  if (itineraryMode) {
    const proposal = activeItineraryProposal();
    const model = proposal ? ensureItineraryModel(selectedQuery, proposal) : null;
    if (!proposal || !model) return;
    model.mode = itineraryMode.dataset.itineraryMode;
    proposal.itineraryMode = model.mode;
    renderQueryDetail();
    showToast(`${model.mode === 'advanced' ? 'Advanced' : 'Simple'} itinerary enabled`);
    return;
  }
  if (event.target.closest('[data-itinerary-share]')) {
    const proposal = activeItineraryProposal();
    if (!proposal) return;
    proposal.shareUrl ||= `https://proposals.paryatech.com/${proposal.id.toLocaleLowerCase()}`;
    activeQueryDetailTab = 'communication';
    renderQueryDetail();
    openQueryMailComposer();
    const scope = queryMailScope();
    const subject = $('[data-query-mail-subject]', scope);
    const body = $('[data-query-mail-body]', scope);
    if (subject) subject.value = `${proposal.title} · itinerary proposal`;
    if (body) body.value = `Hello ${queryDetailCustomer()?.contactName || queryDetailCustomer()?.name},\n\nYour itinerary proposal is ready to review:\n${proposal.shareUrl}\n\nPlease reply here if you would like any changes.`;
    queryMailAttachments = [{ name: `${proposal.id}-itinerary.pdf`, size: 'Generated proposal', type: 'application/pdf' }];
    renderQueryMailComposerAttachments();
    const sendButton = $('[data-query-mail-send]', scope);
    if (sendButton) sendButton.disabled = false;
    subject?.focus();
    showToast('Proposal added to Communication');
    return;
  }
  const itineraryStepButton = event.target.closest('[data-itinerary-step]');
  if (itineraryStepButton) {
    activeItineraryStep = itineraryStepButton.dataset.itineraryStep;
    renderQueryDetail();
    return;
  }
  if (event.target.closest('[data-itinerary-previous]')) {
    activeItineraryStep = ITINERARY_STEPS[Math.max(0, ITINERARY_STEPS.indexOf(activeItineraryStep) - 1)];
    renderQueryDetail();
    return;
  }
  if (event.target.closest('[data-itinerary-next]')) {
    activeItineraryStep = ITINERARY_STEPS[Math.min(ITINERARY_STEPS.length - 1, ITINERARY_STEPS.indexOf(activeItineraryStep) + 1)];
    renderQueryDetail();
    return;
  }
  const openItinerary = event.target.closest('[data-itinerary-open]');
  if (openItinerary) {
    activeItineraryProposalId = openItinerary.dataset.itineraryOpen;
    activeItineraryStep = selectedQuery.type === 'Trip' ? 'itinerary' : 'preview';
    activeQueryDetailTab = 'proposals';
    proposalWorkspaceView = 'builder';
    renderQueryDetail();
    return;
  }
  const itineraryDay = event.target.closest('[data-itinerary-day]');
  if (itineraryDay) {
    const index = Number(itineraryDay.dataset.itineraryDay);
    expandedItineraryDay = expandedItineraryDay === index ? -1 : index;
    renderQueryDetail();
    return;
  }
  if (event.target.closest('[data-itinerary-add-day]')) {
    const proposal = activeItineraryProposal();
    if (!proposal) return;
    const model = ensureItineraryModel(selectedQuery, proposal);
    const previous = model.days.at(-1);
    model.days.push({ date: itineraryDateOffset(previous?.date || model.endDate, 1), time: '09:00', city: previous?.city || model.stops.at(-1).city, description: '', travel: `Local travel in ${previous?.city || model.stops.at(-1).city}`, hotelCheckIn: 'Continue at the same stay', meals: 'Breakfast', operationsNote: '', activities: [] });
    model.endDate = model.days.at(-1).date;
    expandedItineraryDay = model.days.length - 1;
    renderQueryDetail();
    return;
  }
  const addActivity = event.target.closest('[data-itinerary-add-activity]');
  if (addActivity) {
    const dayIndex = Number(addActivity.dataset.itineraryAddActivity);
    const input = $(`[data-itinerary-activity-input="${dayIndex}"]`, queryDetailContent);
    const name = input?.value.trim();
    if (!name) {
      input?.focus();
      return;
    }
    const proposal = activeItineraryProposal();
    const model = proposal ? ensureItineraryModel(selectedQuery, proposal) : null;
    model?.days[dayIndex]?.activities.push({ name, details: 'Details pending', guests: model.travellers, unitCost: 0 });
    renderQueryDetail();
    return;
  }
  const removeActivity = event.target.closest('[data-itinerary-remove-activity]');
  if (removeActivity) {
    const proposal = activeItineraryProposal();
    const model = proposal ? ensureItineraryModel(selectedQuery, proposal) : null;
    model?.days[Number(removeActivity.dataset.dayIndex)]?.activities.splice(Number(removeActivity.dataset.itineraryRemoveActivity), 1);
    renderQueryDetail();
    return;
  }
  const addService = event.target.closest('[data-itinerary-add-service]');
  if (addService) {
    const proposal = activeItineraryProposal();
    if (!proposal) return;
    const model = ensureItineraryModel(selectedQuery, proposal);
    const kind = addService.dataset.itineraryAddService;
    if (kind === 'accommodations') model.accommodations.push({ destination: model.stops.at(-1).city, checkIn: model.startDate, checkOut: model.endDate, name: 'New accommodation', roomCategory: 'Deluxe room', mealPlan: 'Breakfast included', rooms: 1, nights: 1, unitCost: 0 });
    if (kind === 'transport') model.transport.push({ route: 'New route leg', vehicle: 'SUV', units: 1, unitCost: 0 });
    if (kind === 'flights') model.flights.push({ route: `${model.origin} → ${model.stops[0].city}`, airline: 'Airline / flight pending', cabin: 'Economy', travellers: model.travellers, unitCost: 0 });
    renderQueryDetail();
    return;
  }
  const removeService = event.target.closest('[data-itinerary-remove-service]');
  if (removeService) {
    const proposal = activeItineraryProposal();
    const model = proposal ? ensureItineraryModel(selectedQuery, proposal) : null;
    model?.[removeService.dataset.itineraryRemoveService]?.splice(Number(removeService.dataset.index), 1);
    renderQueryDetail();
    return;
  }
  const costCategory = event.target.closest('[data-itinerary-cost-category]');
  if (costCategory) {
    activeItineraryCostCategory = costCategory.dataset.itineraryCostCategory;
    renderQueryDetail();
    return;
  }
  if (event.target.closest('[data-itinerary-publish]')) {
    const proposal = activeItineraryProposal();
    if (!proposal) return;
    const model = ensureItineraryModel(selectedQuery, proposal);
    proposal.amount = itineraryCostSummary(model).total;
    proposal.status = 'Published';
    proposal.shareUrl ||= `https://proposals.paryatech.com/${proposal.id.toLocaleLowerCase()}`;
    proposal.sentAt = taskDateOffset(0);
    selectedQuery.status = 'Negotiation';
    selectedQuery.activity = 'Just now';
    renderQueryModule();
    renderQueryDetail();
    showToast('Proposal published');
    return;
  }
  const menuAction = event.target.closest('[data-query-menu-action]')?.dataset.queryMenuAction;
  if (menuAction) {
    if (menuAction === 'customer') setView('detail', queryDetailCustomer());
    if (menuAction === 'task') {
      activeQueryDetailTab = 'tasks';
      renderQueryDetail();
      $('#queryTaskSearch', queryDetailContent)?.focus();
    }
    if (menuAction === 'lost') {
      selectedQuery.status = 'Lost';
      selectedQuery.activity = 'Just now';
      renderQueryModule();
      renderQueryDetail();
      showToast('Query marked as Lost');
    }
    if (menuAction === 'edit-query') {
      const form = $('#queryDetailEditForm', queryDetailContent);
      if (form) {
        form.hidden = false;
        form.elements.title.focus();
      }
      const menu = $('#queryDetailMenu', queryDetailContent);
      if (menu) menu.hidden = true;
    }
    if (menuAction === 'delete-customer') {
      const customer = queryDetailCustomer();
      if (!customer) return;
      selectedCustomer = customer;
      openCustomerDelete(event.target.closest('[data-query-menu-action]'));
    }
    return;
  }
  const actionButton = event.target.closest('[data-query-detail-action]');
  if (!actionButton) return;
  const action = actionButton.dataset.queryDetailAction;
  const customer = queryDetailCustomer();
  if (action === 'build-proposal') buildQueryProposal();
  if (action === 'favorite') {
    selectedQuery.favorite = !selectedQuery.favorite;
    renderQueryDetail();
    showToast(selectedQuery.favorite ? 'Query added to favorites' : 'Query removed from favorites');
  }
  if (action === 'edit-position') {
    openQueryPositionEditor(actionButton);
  }
  if (action === 'view-tasks') {
    activeQueryDetailTab = 'tasks';
    renderQueryDetail();
  }
  if (action === 'menu') {
    const menu = $('#queryDetailMenu', queryDetailContent);
    const open = menu.hidden;
    menu.hidden = !open;
    actionButton.setAttribute('aria-expanded', String(open));
  }
  if (action === 'view-customer') setView('detail', customer);
  if (action === 'documents') openDocumentVault(customer);
  if (action === 'finance') {
    setView('detail', customer);
    setProfileTab('finance');
  }
  if (action === 'booking') openBookingOnboarding(customer, actionButton);
  if (action === 'collaborator') {
    const select = $('#queryCollaboratorSelect', queryDetailContent);
    if (!select.value) {
      showToast('Choose a team member');
      return;
    }
    const owners = queryOwnerList(selectedQuery);
    if (!owners.includes(select.value)) owners.push(select.value);
    setQueryOwners(selectedQuery, owners);
    selectedQuery.activity = 'Just now';
    renderQueryModule();
    renderQueryDetail();
    showToast(`${select.value} assigned`);
  }
});

queryDetailContent.addEventListener('keydown', (event) => {
  if (!['Enter', ' '].includes(event.key)) return;
  const card = event.target.closest('[data-query-task-id]');
  if (!card || event.target.closest('button')) return;
  event.preventDefault();
  const task = taskRecords.find((record) => record.id === card.dataset.queryTaskId);
  if (task) openTaskModal({ task, returnFocus: card });
});
queryDetailContent.addEventListener('change', (event) => {
  if (event.target.hasAttribute?.('data-query-mail-attachment-input')) {
    queryMailAttachments = [...event.target.files].map((file) => ({
      name: file.name,
      size: formatDocumentFileSize(file.size),
      type: file.type,
    }));
    renderQueryMailComposerAttachments();
    return;
  }
  const itineraryField = event.target.closest?.('[data-itinerary-change]');
  if (itineraryField) {
    const proposal = activeItineraryProposal();
    if (!proposal) return;
    const model = ensureItineraryModel(selectedQuery, proposal);
    const changeType = itineraryField.dataset.itineraryChange;
    const field = itineraryField.dataset.field;
    const numericValue = itineraryField.type === 'number' ? Math.max(0, Number(itineraryField.value) || 0) : itineraryField.value;
    if (changeType === 'content') {
      model.content[field] = itineraryField.value;
      if (field === 'title') proposal.title = itineraryField.value.trim() || proposal.title;
    }
    if (changeType === 'day') model.days[Number(itineraryField.dataset.index)][field] = itineraryField.value;
    if (changeType === 'service') model[itineraryField.dataset.kind][Number(itineraryField.dataset.index)][field] = numericValue;
    if (changeType === 'cost') {
      const kind = itineraryField.dataset.kind;
      const target = kind === 'activities'
        ? model.days[Number(itineraryField.dataset.index)].activities[Number(itineraryField.dataset.subindex)]
        : model[kind][Number(itineraryField.dataset.index)];
      target.unitCost = numericValue;
    }
    if (changeType === 'margin') model.marginPercent = numericValue;
    proposal.amount = itineraryCostSummary(model).total;
    proposal.sentAt = taskDateOffset(0);
    if (['cost', 'margin'].includes(changeType)) renderQueryDetail();
    return;
  }
  if (['queryTaskPriorityFilter', 'queryTaskEntityFilter', 'queryTaskAssigneeFilter', 'queryTaskSort'].includes(event.target.id)) {
    pendingQueryTaskFilters.priority = queryTaskField('queryTaskPriorityFilter').value;
    pendingQueryTaskFilters.entity = queryTaskField('queryTaskEntityFilter').value;
    pendingQueryTaskFilters.assignee = queryTaskField('queryTaskAssigneeFilter').value;
    pendingQueryTaskFilters.sort = queryTaskField('queryTaskSort').value;
    queryTaskField('applyQueryTaskFilters').disabled = !queryTaskFilterChanged();
    return;
  }
  if (event.target.id !== 'queryDetailStatus') return;
  selectedQuery.status = event.target.value;
  selectedQuery.activity = 'Just now';
  renderQueryModule();
  renderQueryDetail();
  showToast(`Query moved to ${selectedQuery.status}`);
});

queryDetailContent.addEventListener('input', (event) => {
  if (event.target.hasAttribute?.('data-query-mail-subject') || event.target.hasAttribute?.('data-query-mail-body')) {
    const scope = queryMailScope();
    if (!scope) return;
    const subject = $('[data-query-mail-subject]', scope)?.value.trim() ?? '';
    const body = $('[data-query-mail-body]', scope)?.value.trim() ?? '';
    const sendButton = $('[data-query-mail-send]', scope);
    if (sendButton) sendButton.disabled = !subject || !body;
    return;
  }
  if (event.target.id === 'proposalCatalogSearch') {
    proposalSearchTerm = event.target.value;
    renderQueryDetail();
    const search = $('#proposalCatalogSearch', queryDetailContent);
    search?.focus();
    search?.setSelectionRange(search.value.length, search.value.length);
    return;
  }
  if (event.target.id === 'queryTaskSearch') {
    queryTaskSearchQuery = event.target.value;
    queryTaskPage = 1;
    renderQueryTasks();
    return;
  }
  if (event.target.id === 'queryTaskDateFrom' || event.target.id === 'queryTaskDateTo') {
    pendingQueryTaskFilters.from = queryTaskField('queryTaskDateFrom').value;
    pendingQueryTaskFilters.to = queryTaskField('queryTaskDateTo').value;
    queryTaskField('applyQueryTaskFilters').disabled = !queryTaskFilterChanged();
  }
});

queryDetailContent.addEventListener('submit', (event) => {
  event.preventDefault();
  if (event.target.hasAttribute?.('data-query-mail-composer')) {
    submitQueryMail();
    return;
  }
  if (event.target.id === 'queryProposalCreator') {
    if (!event.target.reportValidity()) return;
    const source = proposalCatalogRecords.find((item) => item.id === pendingProposalSourceId) ?? null;
    if (!source && proposalCatalogType !== 'scratch') return;
    const values = new FormData(event.target);
    const proposal = {
      id: `PROP-${Date.now().toString(36).slice(-6).toUpperCase()}`,
      customerId: selectedQuery.customerId,
      title: String(values.get('proposalTitle') || '').trim(),
      package: source?.title || 'Built from trip query',
      catalogId: source?.id || null,
      linkedQuery: selectedQuery.id,
      status: 'Draft',
      amount: Number(source?.amount || selectedQuery.value || 0),
      sentAt: taskDateOffset(0),
      validUntil: taskDateOffset(7),
      itineraryMode: String(values.get('itineraryMode') || 'simple'),
    };
    proposal.itinerary = createItineraryModel(selectedQuery, proposal);
    proposal.amount = itineraryCostSummary(proposal.itinerary).total;
    customerProposalRecords.unshift(proposal);
    activeItineraryProposalId = proposal.id;
    activeItineraryStep = 'itinerary';
    activeItineraryCostCategory = 'all';
    expandedItineraryDay = 0;
    proposalWorkspaceView = 'builder';
    pendingProposalSourceId = null;
    proposalSearchTerm = '';
    renderQueryDetail();
    showToast('Draft proposal created');
    return;
  }
  if (event.target.id === 'queryNoteForm') {
    const input = $('#queryNoteInput', event.target);
    const body = input.value.trim();
    if (!body) return;
    selectedQuery.notes ??= [];
    selectedQuery.notes.unshift({ body, time: 'Just now' });
    selectedQuery.activity = 'Just now';
    renderQueryDetail();
    showToast('Note added');
    return;
  }
});

$$('.category-tab').forEach((tab) => tab.addEventListener('click', () => setCategory(tab.dataset.category)));
customerSearch.addEventListener('input', () => {
  currentPage = 1;
  renderCustomers();
  renderPagination();
});
customerLocationSearch?.addEventListener('input', () => {
  currentPage = 1;
  renderCustomers();
  renderPagination();
});
selectAllCustomers?.addEventListener('change', () => {
  filteredCustomers().forEach((customer) => {
    if (selectAllCustomers.checked) selectedCustomerIds.add(customer.id);
    else selectedCustomerIds.delete(customer.id);
  });
  renderCustomers();
});
customerRows.addEventListener('change', (event) => {
  const checkbox = event.target.closest('[data-customer-select]');
  if (!checkbox) return;
  if (checkbox.checked) selectedCustomerIds.add(checkbox.dataset.customerSelect);
  else selectedCustomerIds.delete(checkbox.dataset.customerSelect);
  syncSelectAll();
});
$$('.category-tab').forEach((tab, tabIndex, tabs) => tab.addEventListener('keydown', (event) => {
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
  event.preventDefault();
  const nextIndex = event.key === 'Home'
    ? 0
    : event.key === 'End'
      ? tabs.length - 1
      : (tabIndex + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
  tabs[nextIndex].focus();
  setCategory(tabs[nextIndex].dataset.category);
}));
$('#clearFilters').addEventListener('click', () => {
  customerSearch.value = '';
  if (customerLocationSearch) customerLocationSearch.value = '';
  clearAppliedFilters();
  setCategory('All');
  customerSearch.focus();
});
customerLocationSearch.addEventListener('input', () => {
  currentPage = 1;
  renderCustomers();
  renderPagination();
});
filterButton.addEventListener('click', () => {
  if (filterPopover.hidden) openFilterPopover();
  else closeFilterPopover();
});
filterPopover.addEventListener('change', (event) => {
  const input = event.target;
  const key = input.hasAttribute('data-filter-value') ? 'tier' : input.hasAttribute('data-group-value') ? 'groupType' : null;
  if (key) {
    const value = key === 'tier' ? input.dataset.filterValue : input.dataset.groupValue;
    const selected = tierSelection(appliedFilters[key]);
    appliedFilters[key] = input.checked ? [...new Set([...selected, value])] : selected.filter((item) => item !== value);
  } else {
    appliedFilters.outstanding = outstandingFilter.checked;
    appliedFilters.expiring = expiringFilter.checked;
  }
  currentPage = 1;
  renderCustomers();
  renderPagination();
});
$('#clearCustomerFilters').addEventListener('click', () => {
  clearAppliedFilters();
  currentPage = 1;
  renderCustomers();
  renderPagination();
});
appliedFiltersElement.addEventListener('click', (event) => {
  const removeButton = event.target.closest('[data-clear-filter]');
  if (!removeButton) return;
  const key = removeButton.dataset.clearFilter;
  if (key === 'tier' && removeButton.dataset.tierValue) {
    appliedFilters.tier = tierSelection(appliedFilters.tier).filter((tier) => tier !== removeButton.dataset.tierValue);
  } else if (key === 'groupType' && removeButton.dataset.groupValue) {
    appliedFilters.groupType = tierSelection(appliedFilters.groupType).filter((group) => group !== removeButton.dataset.groupValue);
  } else {
    appliedFilters[key] = false;
  }
  currentPage = 1;
  renderCustomers();
  renderPagination();
});
dashboardDensityNormal.addEventListener('click', () => setDashboardDensity('normal'));
dashboardDensityAdvance.addEventListener('click', () => setDashboardDensity('advance'));
$('#dashboardNewQuery').addEventListener('click', (event) => {
  openQueryTypeSelector(null, event.currentTarget);
});
$('#dashboardNewEmptyCreate')?.addEventListener('click', (event) => {
  openQueryTypeSelector(null, event.currentTarget);
});
$('#dashboardNewVendor').addEventListener('click', (event) => {
  openVendorOnboarding(event.currentTarget);
});
$('#dashboardNewCustomer').addEventListener('click', (event) => {
  openCustomerOnboarding(event.currentTarget);
});
$('#homeNotesCompose')?.addEventListener('submit', (event) => {
  event.preventDefault();
  const input = $('#homeNoteInput');
  if (!input.value.trim()) return;
  input.value = '';
  showToast('Note saved');
});
dashboardView.addEventListener('click', (event) => {
  const customerButton = event.target.closest('[data-dashboard-customer-id]');
  if (customerButton) {
    const customer = customers.find((item) => item.id === customerButton.dataset.dashboardCustomerId);
    if (customer) setView('detail', customer);
    return;
  }
  const actionButton = event.target.closest('[data-dashboard-action]');
  if (actionButton) showToast(`${actionButton.dataset.dashboardAction} opened`);
});
$('#documentVaultButton').addEventListener('click', () => openDocumentVault());
$('#importButton').addEventListener('click', () => {
  resetImportFile();
  openModal(importModalBackdrop, importDropzone);
});
$('#closeImportModal').addEventListener('click', closeImportModal);
$('#cancelImportModal').addEventListener('click', closeImportModal);
$('#removeImportFile').addEventListener('click', resetImportFile);
$('#downloadSampleCsv').addEventListener('click', downloadImportSampleCsv);
importDropzone.addEventListener('click', () => importFileInput.click());
importFileInput.addEventListener('change', () => setImportFile(importFileInput.files?.[0]));
['dragenter', 'dragover'].forEach((type) => importDropzone.addEventListener(type, (event) => {
  event.preventDefault();
  importDropzone.classList.add('is-dragging');
}));
['dragleave', 'drop'].forEach((type) => importDropzone.addEventListener(type, (event) => {
  event.preventDefault();
  importDropzone.classList.remove('is-dragging');
}));
importDropzone.addEventListener('drop', (event) => setImportFile(event.dataTransfer.files?.[0]));
importModalBackdrop.addEventListener('click', (event) => { if (event.target === importModalBackdrop) closeImportModal(); });
importForm.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!selectedImportFile) return;
  closeImportModal();
  showToast('File successfully imported');
});
refreshButton.addEventListener('click', () => refreshControl(refreshButton, 'Customer list is up to date', () => {
  renderCustomers();
  renderPagination();
}));
$('#vaultRefreshButton').addEventListener('click', () => refreshControl($('#vaultRefreshButton'), 'Document vault is up to date', () => renderVault()));
$('#closeVendorModal').addEventListener('click', closeVendorOnboarding);
$('#cancelVendorModal').addEventListener('click', closeVendorOnboarding);
vendorModalBackdrop.addEventListener('click', (event) => { if (event.target === vendorModalBackdrop) closeVendorOnboarding(); });
vendorForm.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!vendorForm.reportValidity()) return;
  const name = vendorName.value.trim();
  closeVendorOnboarding();
  showToast(`${name} added to vendors`);
});
createButton.addEventListener('click', () => openCustomerOnboarding(createButton));
$('#customerCreateCancel').addEventListener('click', closeCustomerOnboarding);
onboardingContinue.addEventListener('click', submitCustomerOnboarding);
onboardingSecondary.addEventListener('click', () => persistOnboardedCustomer(true));
customerForm.addEventListener('submit', (event) => {
  event.preventDefault();
  submitCustomerOnboarding();
});
customerForm.addEventListener('input', () => {
  updateOnboardingSecondaryAction();
  updateOnboardingContinueState();
});
customerForm.addEventListener('change', () => {
  updateOnboardingSecondaryAction();
  updateOnboardingContinueState();
});
customerName.addEventListener('change', () => {
  if (!primaryTravellerName.value.trim()) primaryTravellerName.value = customerName.value.trim();
  updateOnboardingContinueState();
});
customerPhotoButton.addEventListener('click', () => customerPhotoInput.click());
customerPhotoInput.addEventListener('change', () => {
  const file = customerPhotoInput.files?.[0];
  if (!file) return;
  if (!['image/jpeg', 'image/png'].includes(file.type) || file.size > 5 * 1024 * 1024) {
    customerPhotoInput.value = '';
    showToast('Choose a JPEG or PNG image under 5MB');
    return;
  }
  onboardingPhotoFile = file;
  const reader = new FileReader();
  reader.addEventListener('load', () => {
    onboardingPhotoDataUrl = String(reader.result);
    customerPhotoPreview.src = onboardingPhotoDataUrl;
    customerPhotoPreview.alt = `${customerName.value.trim() || 'Customer'} profile photo`;
    customerPhotoPreview.hidden = false;
    $('.customer-photo-placeholder', customerPhotoButton).hidden = true;
    updateOnboardingSecondaryAction();
  });
  reader.readAsDataURL(file);
});
sameAsPhone.addEventListener('change', syncWhatsappWithPhone);
customerPhone.addEventListener('input', syncWhatsappWithPhone);
addTierButton.addEventListener('click', openCustomTierEditor);
$$('input[name="referralType"]', customerForm).forEach((input) => input.addEventListener('change', syncReferralFields));
preferenceInput.addEventListener('input', renderPreferenceSuggestions);
preferenceInput.addEventListener('focus', renderPreferenceSuggestions);
preferenceInput.addEventListener('blur', () => {
  window.setTimeout(() => {
    if (document.activeElement !== preferenceInput) closePreferenceSuggestions();
  }, 120);
});
preferenceInput.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closePreferenceSuggestions();
    return;
  }
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault();
    if (!preferenceSuggestions.hidden) focusThemedOption(preferenceSuggestions, event.key === 'ArrowDown' ? 1 : -1);
  } else if (event.key === 'Enter' && !preferenceSuggestions.hidden) {
    event.preventDefault();
    if (document.activeElement === preferenceInput) $('.themed-option', preferenceSuggestions)?.click();
  }
});
preferenceSuggestions.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault();
    focusThemedOption(preferenceSuggestions, event.key === 'ArrowDown' ? 1 : -1);
  } else if (event.key === 'Escape') {
    event.preventDefault();
    closePreferenceSuggestions();
    preferenceInput.focus();
  }
});
document.addEventListener('click', (event) => {
  if (!preferenceSuggestions.hidden && !event.target.closest('#preferenceTypeahead')) closePreferenceSuggestions();
  const profileEls = profilePreferenceEls();
  if (profileEls.suggestions && !profileEls.suggestions.hidden && !event.target.closest('#profilePreferenceTypeahead')) closeProfilePreferenceSuggestions();
});

function openCustomerFromEvent(event) {
  if (event.target.closest('input[type="checkbox"]')) return;
  const menuButton = event.target.closest('[data-customer-menu]');
  if (menuButton) {
    const shouldOpen = menuButton.getAttribute('aria-expanded') !== 'true';
    setCustomerRowActionMenu(shouldOpen ? menuButton : null, shouldOpen);
    return;
  }
  const row = event.target.closest('[data-customer-id]');
  if (!row) return;
  const customer = customers.find((item) => item.id === row.dataset.customerId);
  setView('detail', customer);
}

customerRows.addEventListener('click', openCustomerFromEvent);
customerRows.addEventListener('keydown', (event) => {
  if (event.target.closest('button') || event.target.closest('input') || !['Enter', ' '].includes(event.key)) return;
  event.preventDefault();
  openCustomerFromEvent(event);
});
$('#backToCustomers').addEventListener('click', navigateBack);
$('#backFromVault').addEventListener('click', navigateBack);
$('#newQueryButton').addEventListener('click', (event) => openQueryTypeSelector(selectedCustomer, event.currentTarget));
$$('.detail-tab').forEach((tab) => tab.addEventListener('click', () => setProfileTab(tab.dataset.profileTab)));
$('.detail-tabs').addEventListener('keydown', (event) => {
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
  event.preventDefault();
  const tabs = $$('.detail-tab', customerDetailView);
  const currentIndex = tabs.findIndex((tab) => tab.dataset.profileTab === activeProfileTab);
  const nextIndex = event.key === 'Home'
    ? 0
    : event.key === 'End'
      ? tabs.length - 1
      : (currentIndex + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
  setProfileTab(tabs[nextIndex].dataset.profileTab, true);
});
$('#editBankDetailsButton').addEventListener('click', (event) => openBankModal('edit', event.currentTarget));
$('#addBankAccountButton').addEventListener('click', (event) => openBankModal('add', event.currentTarget));
$('#bankEmptyAddButton').addEventListener('click', (event) => openBankModal('add', event.currentTarget));
$('#closeBankModal').addEventListener('click', closeBankModal);
$('#cancelBankModal').addEventListener('click', closeBankModal);
$('#bankModalForm').addEventListener('submit', (event) => {
  event.preventDefault();
  persistBankModal();
});
$('#bankModalBackdrop').addEventListener('mousedown', (event) => {
  if (event.target.id === 'bankModalBackdrop') closeBankModal();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !$('#bankModalBackdrop').hidden) closeBankModal();
});
$('#bankDetailsGrid').addEventListener('click', (event) => {
  const editButton = event.target.closest('[data-bank-edit]');
  if (editButton) {
    openBankModal('edit', editButton);
    return;
  }
  const copyButton = event.target.closest('[data-bank-copy]');
  if (copyButton) copyBankValue(copyButton.dataset.bankCopy, copyButton);
});
$('.customer-pipeline-tabs').addEventListener('keydown', (event) => {
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
  event.preventDefault();
  const tabs = $$('[data-customer-pipeline-view]', $('#profilePanelPipeline'));
  const currentIndex = tabs.findIndex((tab) => tab.dataset.customerPipelineView === activeCustomerPipelineView);
  const nextIndex = event.key === 'Home'
    ? 0
    : event.key === 'End'
      ? tabs.length - 1
      : (currentIndex + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
  activeCustomerPipelineView = tabs[nextIndex].dataset.customerPipelineView;
  renderCustomerPipeline(selectedCustomer);
  tabs[nextIndex].focus();
});
$$('[data-customer-mail-filter]').forEach((button) => button.addEventListener('click', () => {
  customerMailFilter = button.dataset.customerMailFilter;
  selectedCustomerMailIndex = null;
  closeCustomerMailComposer();
  renderCustomerMailWorkspace();
}));
$('#customerMailSidebarToggle').addEventListener('click', () => setCustomerMailSidebarCollapsed(!customerMailSidebarCollapsed));
$('#customerMailComposeButton').addEventListener('click', () => openCustomerMailComposer());
$('#customerMailReaderBack').addEventListener('click', () => {
  selectedCustomerMailIndex = null;
  renderCustomerMailWorkspace();
  $('.customer-mail-message', customerMailThread)?.focus();
});
customerMailThread.addEventListener('click', (event) => {
  const message = event.target.closest('[data-customer-mail-index]');
  if (message) openCustomerMailReader(Number(message.dataset.customerMailIndex));
});
customerMailTemplateButton.addEventListener('click', () => {
  const open = customerMailTemplateMenu.hidden;
  customerMailTemplateMenu.hidden = !open;
  customerMailTemplateButton.setAttribute('aria-expanded', String(open));
});
$$('[data-customer-mail-template]').forEach((button) => button.addEventListener('click', () => openCustomerMailComposer(button.dataset.customerMailTemplate)));
$('#customerMailUploadButton').addEventListener('click', () => customerMailAttachmentInput.click());
customerMailAttachmentInput.addEventListener('change', () => {
  customerMailAttachments = [...customerMailAttachmentInput.files].map((file) => ({
    name: file.name,
    size: formatDocumentFileSize(file.size),
    type: file.type,
  }));
  renderCustomerMailComposerAttachments();
});
customerMailComposerAttachments.addEventListener('click', (event) => {
  const remove = event.target.closest('[data-customer-mail-attachment-remove]');
  if (!remove) return;
  customerMailAttachments.splice(Number(remove.dataset.customerMailAttachmentRemove), 1);
  renderCustomerMailComposerAttachments();
});
$('#cancelCustomerMail').addEventListener('click', closeCustomerMailComposer);
customerMailComposer.addEventListener('input', () => {
  sendCustomerMail.disabled = !customerMailSubject.value.trim() || !customerMailBody.value.trim();
});
customerMailComposer.addEventListener('submit', (event) => {
  event.preventDefault();
  submitCustomerMail();
});
customerDetailView.addEventListener('click', (event) => {
  const pipelineView = event.target.closest('[data-customer-pipeline-view]');
  if (pipelineView) {
    activeCustomerPipelineView = pipelineView.dataset.customerPipelineView;
    renderCustomerPipeline(selectedCustomer);
    return;
  }

  const profileToggle = event.target.closest('[data-traveller-profile-toggle]');
  if (profileToggle) {
    const profileId = profileToggle.dataset.travellerProfileToggle;
    const expanded = profileToggle.getAttribute('aria-expanded') === 'true';
    expandedTravellerByCustomer.set(selectedCustomer.id, expanded ? '' : profileId);
    renderTravellerTab(selectedCustomer);
    if (!expanded) window.setTimeout(() => $(`[data-traveller-profile-toggle="${profileId}"]`)?.focus(), 0);
    return;
  }
  const travellerDocuments = event.target.closest('[data-traveller-documents]');
  if (travellerDocuments) {
    const travellerName = travellerDocuments.dataset.travellerName;
    const targetGroup = buildTravellerDocumentGroups(selectedCustomer).find((group) => group.traveller === travellerName);
    expandedDocumentGroupByCustomer.set(selectedCustomer.id, String(targetGroup?.index ?? ''));
    setProfileTab('documents');
    renderTravellerDocumentHierarchy(selectedCustomer);
    window.requestAnimationFrame(() => {
      const group = $$('[data-document-traveller]', travellerDocumentHierarchy)
        .find((item) => item.dataset.documentTraveller === travellerName);
      group?.scrollIntoView({ block: 'start', behavior: 'smooth' });
      $('.traveller-document-header', group)?.focus();
    });
    return;
  }
  const viewTraveller = event.target.closest('[data-traveller-view]');
  const editTraveller = event.target.closest('[data-traveller-edit]');
  const removeTraveller = event.target.closest('[data-traveller-delete]');
  const travellerAction = viewTraveller ?? editTraveller ?? removeTraveller;
  if (travellerAction) {
    const profileId = viewTraveller?.dataset.travellerView ?? editTraveller?.dataset.travellerEdit ?? removeTraveller?.dataset.travellerDelete;
    const profile = travellerProfilesByCustomer.get(selectedCustomer.id)?.find((item) => item.id === profileId);
    if (!profile) return;
    openTravellerModal(profile, editTraveller ? 'edit' : 'view', travellerAction);
    if (removeTraveller) window.setTimeout(() => deleteTravellerButton.focus(), 0);
    return;
  }
  const travellerToggle = event.target.closest('[data-traveller-toggle]');
  if (travellerToggle) {
    const expanded = travellerToggle.getAttribute('aria-expanded') === 'true';
    const toggleIndex = travellerToggle.dataset.travellerIndex;
    expandedDocumentGroupByCustomer.set(selectedCustomer.id, expanded ? '' : toggleIndex);
    renderTravellerDocumentHierarchy(selectedCustomer);
    window.requestAnimationFrame(() => {
      $$('[data-traveller-toggle]', travellerDocumentHierarchy)
        .find((button) => button.dataset.travellerIndex === toggleIndex)?.focus();
    });
    return;
  }
  const missingDocument = event.target.closest('[data-request-missing-document]');
  if (missingDocument) {
    openRequestDocumentDialog(missingDocument, missingDocument.dataset.documentType, missingDocument.dataset.travellerName);
    return;
  }
  const reviewButton = event.target.closest('[data-document-review]');
  const action = event.target.closest('[data-profile-action]');
  if (reviewButton && !action) {
    reviewDocumentById(reviewButton.dataset.documentReview, reviewButton);
    return;
  }
  if (!action) return;
  if (action.dataset.profileAction === 'Edit primary contact') {
    openProfileSectionEditor('contact', action);
    return;
  }
  if (action.dataset.profileAction === 'Edit profile') {
    openProfileSectionEditor('profile', action);
    return;
  }
  if (action.dataset.profileAction === 'Edit preferences') {
    openProfileSectionEditor('preferences', action);
    return;
  }
  if (action.dataset.profileAction === 'Edit important dates') {
    openProfileSectionEditor('dates', action);
    return;
  }
  if (action.dataset.profileAction === 'Add query') {
    openQueryTypeSelector(selectedCustomer, action);
    return;
  }
  if (action.dataset.profileAction === 'Add booking') {
    openBookingOnboarding(selectedCustomer, action);
    return;
  }
  if (action.dataset.profileAction === 'Open document vault') {
    openDocumentVault(selectedCustomer);
    return;
  }
  if (action.dataset.profileAction === 'Request documents') {
    openRequestDocumentDialog(action);
    return;
  }
  if (action.dataset.profileAction === 'Email') {
    setProfileTab('communication');
    return;
  }
  if (action.dataset.profileAction === 'Call') {
    const { phone } = customerContactDetails(selectedCustomer);
    const dialNumber = String(phone ?? '').replace(/[^+\d]/g, '');
    if (dialNumber) {
      window.location.href = `tel:${dialNumber}`;
      return;
    }
    showToast(`No phone number for ${selectedCustomer.name}`);
    return;
  }
  showToast(`${action.dataset.profileAction} for ${selectedCustomer.name}`);
});
customerActionMenuButton.addEventListener('click', () => {
  setCustomerActionMenu(customerActionMenu.hidden, true);
});
$('#editCustomerAction').addEventListener('click', () => openCustomerEditor(customerActionMenuButton));
$('#deleteCustomerAction').addEventListener('click', () => openCustomerDelete(customerActionMenuButton));
$('#editCustomerRowAction').addEventListener('click', () => openCustomerEditor(customerRowMenuReturnFocus));
$('#deleteCustomerRowAction').addEventListener('click', () => openCustomerDelete(customerRowMenuReturnFocus));
document.addEventListener('click', (event) => {
  if (!customerActionMenu.hidden && !event.target.closest('.customer-action-menu-wrap')) setCustomerActionMenu(false);
  if (!customerRowActionMenu.hidden && !event.target.closest('#customerRowActionMenu') && !event.target.closest('[data-customer-menu]')) setCustomerRowActionMenu();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !customerActionMenu.hidden) {
    setCustomerActionMenu(false);
    customerActionMenuButton.focus();
  }
});
document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape' || customerRowActionMenu.hidden) return;
  const returnFocus = customerRowMenuReturnFocus;
  setCustomerRowActionMenu();
  returnFocus?.focus();
});
listTableScroller.addEventListener('scroll', () => setCustomerRowActionMenu());
window.addEventListener('resize', () => setCustomerRowActionMenu());
customerNotesButton.addEventListener('click', () => openCustomerNotes('browse', customerNotesButton));
$('#addCustomerNoteButton').addEventListener('click', (event) => openCustomerNotes('compose', event.currentTarget));
customerNotesModeButton.addEventListener('click', () => {
  setCustomerNotesMode(customerNoteForm.classList.contains('is-active') ? 'browse' : 'compose');
});
$('#closeCustomerNotes').addEventListener('click', () => closeCustomerNotes());
$('#cancelCustomerNote').addEventListener('click', () => setCustomerNotesMode('browse'));
customerNoteForm.addEventListener('submit', persistCustomerNote);
customerNoteText.addEventListener('input', () => {
  saveCustomerNote.disabled = !customerNoteText.value.trim();
});
customerNotesSearch.addEventListener('input', renderCustomerNotes);
document.querySelectorAll('[data-customer-note-filter]').forEach((button) => {
  button.addEventListener('click', () => {
    activeCustomerNoteFilter = button.dataset.customerNoteFilter;
    renderCustomerNotes();
  });
});
customerNoteRelatedButton.addEventListener('click', (event) => {
  event.stopPropagation();
  const open = customerNoteRelatedMenu.hidden;
  customerNoteRelatedMenu.hidden = !open;
  customerNoteRelatedButton.setAttribute('aria-expanded', String(open));
});
customerNoteRelatedMenu.addEventListener('click', (event) => {
  const option = event.target.closest('[data-customer-note-related]');
  if (!option) return;
  setCustomerNoteRelated(option.dataset.customerNoteRelated);
  closeCustomerNoteRelatedMenu();
  customerNoteRelatedButton.focus();
});
customerNotePinned.addEventListener('click', () => {
  const checked = customerNotePinned.getAttribute('aria-checked') === 'true';
  customerNotePinned.setAttribute('aria-checked', String(!checked));
});
customerNotesList.addEventListener('click', (event) => {
  const action = event.target.closest('[data-customer-note-action]');
  const item = event.target.closest('[data-customer-note]');
  if (!action || !item) return;
  const note = notesForContext().find((candidate) => candidate.id === item.dataset.customerNote);
  if (!note) return;
  if (action.dataset.customerNoteAction === 'pin') {
    updateCustomerNote(note.id, (current) => ({ ...current, pinned: !current.pinned }));
    showToast(note.pinned ? 'Note unpinned' : 'Note pinned');
  }
  if (action.dataset.customerNoteAction === 'task') createTaskFromCustomerNote(note);
  if (action.dataset.customerNoteAction === 'delete') deleteCustomerNote(note.id);
});
customerNotesBackdrop.addEventListener('click', (event) => {
  if (event.target === customerNotesBackdrop) closeCustomerNotes();
});
document.addEventListener('click', (event) => {
  if (!customerNoteRelatedMenu.hidden && !event.target.closest('#customerNoteRelated')) closeCustomerNoteRelatedMenu();
});
window.addEventListener('resize', () => {
  if (!customerNotesBackdrop.hidden) positionCustomerNotes();
});
$('#closeCustomerEdit').addEventListener('click', closeCustomerEditor);
$('#cancelCustomerEdit').addEventListener('click', closeCustomerEditor);
customerEditBackdrop.addEventListener('click', (event) => { if (event.target === customerEditBackdrop) closeCustomerEditor(); });
customerEditForm.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!customerEditForm.reportValidity()) return;
  persistCustomerEdit();
});
$('#closeProfileEdit').addEventListener('click', closeProfileSectionEditor);
$('#cancelProfileEdit').addEventListener('click', closeProfileSectionEditor);
profileEditBackdrop.addEventListener('click', (event) => { if (event.target === profileEditBackdrop) closeProfileSectionEditor(); });
profileEditForm.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!profileEditForm.reportValidity()) return;
  persistProfileSectionEdit();
});
$('#closeQueryPosition').addEventListener('click', closeQueryPositionEditor);
$('#cancelQueryPosition').addEventListener('click', closeQueryPositionEditor);
queryPositionBackdrop.addEventListener('click', (event) => { if (event.target === queryPositionBackdrop) closeQueryPositionEditor(); });
queryPositionFields.addEventListener('click', (event) => {
  const button = event.target.closest('#queryPositionAssigneeButton');
  if (button) {
    const popover = $('#queryPositionAssigneePopover', queryPositionFields);
    setQueryPositionAssigneeOpen(popover?.hidden);
  }
});
queryPositionFields.addEventListener('change', (event) => {
  if (event.target.matches('input[name="owner"]')) syncQueryPositionAssigneeButton();
});
queryPositionFields.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  const popover = $('#queryPositionAssigneePopover', queryPositionFields);
  if (popover?.hidden) return;
  event.preventDefault();
  event.stopPropagation();
  setQueryPositionAssigneeOpen(false);
  $('#queryPositionAssigneeButton', queryPositionFields)?.focus();
});
document.addEventListener('click', (event) => {
  if (queryPositionBackdrop.hidden || event.target.closest('#queryPositionAssigneeMultiselect')) return;
  setQueryPositionAssigneeOpen(false);
});
queryPositionForm.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!queryPositionForm.reportValidity()) return;
  persistQueryPositionEdit(event);
});
$('#closeCustomerDelete').addEventListener('click', closeCustomerDelete);
$('#cancelCustomerDelete').addEventListener('click', closeCustomerDelete);
customerDeleteBackdrop.addEventListener('click', (event) => { if (event.target === customerDeleteBackdrop) closeCustomerDelete(); });
$('#confirmCustomerDelete').addEventListener('click', deleteSelectedCustomer);
addTravellerButton.addEventListener('click', () => openTravellerModal(null, 'add', addTravellerButton));
$('#closeTravellerModal').addEventListener('click', closeTravellerModal);
$('#cancelTravellerModal').addEventListener('click', closeTravellerModal);
travellerModalBackdrop.addEventListener('click', (event) => { if (event.target === travellerModalBackdrop) closeTravellerModal(); });
editTravellerButton.addEventListener('click', () => setTravellerModalMode('edit'));
travellerPreferenceInput.addEventListener('input', renderTravellerPreferenceSuggestions);
travellerPreferenceInput.addEventListener('focus', renderTravellerPreferenceSuggestions);
travellerPreferenceInput.addEventListener('blur', () => {
  window.setTimeout(() => {
    if (document.activeElement !== travellerPreferenceInput) closeTravellerPreferenceSuggestions();
  }, 120);
});
travellerPreferenceInput.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeTravellerPreferenceSuggestions();
    return;
  }
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault();
    if (!travellerPreferenceSuggestions.hidden) focusThemedOption(travellerPreferenceSuggestions, event.key === 'ArrowDown' ? 1 : -1);
  } else if (event.key === 'Enter' && !travellerPreferenceSuggestions.hidden) {
    event.preventDefault();
    if (document.activeElement === travellerPreferenceInput) $('.themed-option', travellerPreferenceSuggestions)?.click();
  }
});
travellerPreferenceSuggestions.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault();
    focusThemedOption(travellerPreferenceSuggestions, event.key === 'ArrowDown' ? 1 : -1);
  } else if (event.key === 'Escape') {
    event.preventDefault();
    closeTravellerPreferenceSuggestions();
    travellerPreferenceInput.focus();
  }
});
document.addEventListener('click', (event) => {
  if (!travellerPreferenceSuggestions.hidden && !event.target.closest('#travellerPreferenceTypeahead')) closeTravellerPreferenceSuggestions();
});
clearTravellerPreferences.addEventListener('click', () => {
  if (travellerModalMode !== 'view') clearTravellerPreferencePicks();
});
travellerForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const customer = selectedCustomer;
  if (!customer || !travellerForm.reportValidity()) return;
  const profiles = [...(travellerProfilesByCustomer.get(customer.id) ?? [])];
  const existingIndex = profiles.findIndex((profile) => profile.id === activeTravellerId);
  const existing = profiles[existingIndex];
  const name = travellerFullName.value.trim();
  const nextId = existing?.id ?? `${customer.id}-traveller-${Date.now()}`;
  const primary = existing?.primary || travellerPrimary.checked || profiles.length === 0;
  if (primary) profiles.forEach((profile) => { profile.primary = false; });
  const nextProfile = {
    ...existing,
    id: nextId,
    name,
    primary,
    relationship: travellerRelationship.value,
    dateOfBirth: travellerDateOfBirth.value,
    nationality: travellerNationality.value.trim(),
    phone: travellerModalPhone.value.trim(),
    email: travellerModalEmail.value.trim(),
    address: travellerAddress.value.trim(),
    preferences: normalizeTravellerPreferences(draftTravellerPreferences),
    trips: existing?.trips ?? 0,
  };
  if (existing) {
    renameTravellerDocuments(customer, existing.name, name);
    profiles[existingIndex] = nextProfile;
  } else {
    profiles.push(nextProfile);
  }
  expandedTravellerByCustomer.set(customer.id, nextId);
  syncTravellerProfiles(customer, profiles);
  closeTravellerModal();
  showToast(existing ? `${name} updated` : `${name} added`);
});
deleteTravellerButton.addEventListener('click', () => {
  const customer = selectedCustomer;
  const profiles = customer ? [...(travellerProfilesByCustomer.get(customer.id) ?? [])] : [];
  const profile = profiles.find((item) => item.id === activeTravellerId);
  if (!customer || !profile || profile.primary) return;
  if (!travellerDeleteArmed) {
    travellerDeleteArmed = true;
    deleteTravellerButton.textContent = `Confirm delete ${profile.name}`;
    return;
  }
  removeTravellerDocuments(customer, profile.name);
  expandedTravellerByCustomer.set(customer.id, profiles.find((item) => item.primary)?.id ?? '');
  syncTravellerProfiles(customer, profiles.filter((item) => item.id !== profile.id));
  closeTravellerModal();
  showToast(`${profile.name} deleted`);
});
$('#closeQueryTypeModal').addEventListener('click', () => closeQueryTypeSelector(true));
$('#cancelQueryTypeModal').addEventListener('click', () => closeQueryTypeSelector(true));
queryTypeModalBackdrop.addEventListener('click', (event) => {
  if (event.target === queryTypeModalBackdrop) closeQueryTypeSelector(true);
  const typeButton = event.target.closest('[data-query-type]');
  if (!typeButton) return;
  const customer = pendingQueryCustomer;
  const returnFocus = queryReturnFocus;
  closeQueryTypeSelector(false);
  openQueryOnboarding(typeButton.dataset.queryType, customer, returnFocus);
});
$('#closeQueryModal').addEventListener('click', closeQueryOnboarding);
queryModalBackdrop.addEventListener('click', (event) => { if (event.target === queryModalBackdrop) closeQueryOnboarding(); });
queryContinue.addEventListener('click', submitQuery);
querySecondary.addEventListener('click', () => {
  if (querySecondary.dataset.action === 'draft') persistQuery(true);
  else closeQueryOnboarding();
});
queryForm.addEventListener('submit', (event) => {
  event.preventDefault();
  submitQuery();
});
queryForm.addEventListener('input', () => {
  updateQuerySecondaryAction();
  updateQueryContinueState();
});
queryForm.addEventListener('change', () => {
  updateQuerySecondaryAction();
  updateQueryContinueState();
});
queryCustomerSearch.addEventListener('input', () => populateQueryCustomerOptions(queryCustomer.value, queryCustomerSearch.value));
queryCreateCustomerButton.addEventListener('click', () => setQueryInlineCustomerOpen(true));
queryCancelCustomerButton.addEventListener('click', () => {
  setQueryInlineCustomerOpen(false);
  queryCreateCustomerButton.focus();
});
querySaveCustomerButton.addEventListener('click', saveInlineQueryCustomer);
queryAssigneeButton?.addEventListener('click', (event) => {
  event.stopPropagation();
  setQueryAssigneeOpen(queryAssigneePopover.hidden);
});
queryAssigneePopover?.addEventListener('click', (event) => {
  event.stopPropagation();
});
queryAssigneePopover?.addEventListener('change', () => {
  syncQueryAssigneeButton();
});
queryAssigneePopover?.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    event.preventDefault();
    setQueryAssigneeOpen(false);
    queryAssigneeButton?.focus();
  }
});
document.addEventListener('click', (event) => {
  if (!queryAssigneePopover || queryAssigneePopover.hidden) return;
  if (!event.target.closest('#queryAssigneeMultiselect')) setQueryAssigneeOpen(false);
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && queryAssigneePopover && !queryAssigneePopover.hidden) {
    setQueryAssigneeOpen(false);
  }
});
taskAssigneeButton?.addEventListener('click', (event) => {
  event.stopPropagation();
  setTaskAssigneeOpen(taskAssigneePopover.hidden);
});
taskAssigneePopover?.addEventListener('click', (event) => {
  event.stopPropagation();
});
taskAssigneePopover?.addEventListener('change', () => {
  syncTaskAssigneeButton();
});
taskAssigneePopover?.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    event.preventDefault();
    setTaskAssigneeOpen(false);
    taskAssigneeButton?.focus();
  }
});
document.addEventListener('click', (event) => {
  if (!taskAssigneePopover || taskAssigneePopover.hidden) return;
  if (!event.target.closest('#taskAssigneeMultiselect')) setTaskAssigneeOpen(false);
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && taskAssigneePopover && !taskAssigneePopover.hidden) {
    setTaskAssigneeOpen(false);
  }
});
queryChildren.addEventListener('input', renderQueryChildAges);
queryRepeatFields.addEventListener('click', (event) => {
  const add = event.target.closest('[data-query-repeat-add]');
  if (add) {
    addQueryRepeatRow(add.dataset.queryRepeatAdd);
    return;
  }
  const remove = event.target.closest('[data-query-repeat-remove]');
  if (!remove) return;
  const row = remove.closest('.query-repeat-row');
  const container = row?.parentElement;
  row?.remove();
  if (container?.id === 'queryCities') renumberQueryRows(container, 'City');
  if (container?.id === 'queryStops') renumberQueryRows(container, 'Stop');
  if (container?.id === 'queryVehicles') renumberQueryRows(container, 'Vehicle');
  updateQuerySecondaryAction();
});
$('#closeBookingModal').addEventListener('click', closeBookingOnboarding);
bookingModalBackdrop.addEventListener('click', (event) => { if (event.target === bookingModalBackdrop) closeBookingOnboarding(); });
bookingContinue.addEventListener('click', submitBooking);
bookingSecondary.addEventListener('click', () => {
  if (bookingSecondary.dataset.action === 'draft') persistBooking(true);
  else closeBookingOnboarding();
});
bookingForm.addEventListener('submit', (event) => {
  event.preventDefault();
  submitBooking();
});
bookingForm.addEventListener('input', () => {
  updateBookingSecondaryAction();
  updateBookingContinueState();
});
bookingForm.addEventListener('change', (event) => {
  if (event.target.matches('[name="operationsSetup"]')) syncBookingSetupFields();
  updateBookingSecondaryAction();
  updateBookingContinueState();
});
requestDocumentForm.addEventListener('change', (event) => {
  if (event.target === requestTraveller) requestTargetTraveller = requestTraveller.value;
  updateRequestLinkAction();
});
requestDocumentForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const types = selectedRequestTypes();
  requestTargetTraveller = requestTraveller.value;
  if (!requestTargetTraveller || !types.length) return;
  const token = `${selectedCustomer.id.toLocaleLowerCase()}-${Math.random().toString(36).slice(2, 10)}`;
  const linkURL = new URL(location.pathname, location.origin);
  linkURL.searchParams.set('document-request', token);
  linkURL.searchParams.set('customer-id', selectedCustomer.id);
  linkURL.searchParams.set('customer', requestTargetTraveller);
  types.forEach((type) => linkURL.searchParams.append('document', type));
  showGeneratedRequest({
    customerId: selectedCustomer.id,
    traveller: requestTargetTraveller,
    types,
    message: $('#requestDocumentMessage').value.trim(),
    link: linkURL.href,
    status: 'Link ready',
    createdAt: new Date().toISOString(),
  });
});
$('#closeRequestDocument').addEventListener('click', closeRequestDocumentDialog);
$('#cancelRequestDocument').addEventListener('click', closeRequestDocumentDialog);
requestDocumentBackdrop.addEventListener('click', (event) => { if (event.target === requestDocumentBackdrop) closeRequestDocumentDialog(); });
copyRequestLink.addEventListener('click', async () => {
  if (!currentDocumentRequest) return;
  const copied = await copyText(currentDocumentRequest.link);
  showToast(copied ? 'Upload link copied' : 'Could not copy upload link');
});
sendRequestLink.addEventListener('click', () => {
  if (!currentDocumentRequest) return;
  currentDocumentRequest.status = 'Sent';
  renderDocumentRequestState(selectedCustomer);
  sendRequestLink.disabled = true;
  sendRequestLink.textContent = 'Link sent';
  showToast(`Document request sent to ${currentDocumentRequest.traveller}`);
});
previewRequestUpload.addEventListener('click', () => {
  if (!currentDocumentRequest) return;
  prepareRequestUpload(currentDocumentRequest);
  requestDocumentBackdrop.hidden = true;
  openModal(requestUploadBackdrop, requestUploadType);
});
$('#copyActiveRequestLink').addEventListener('click', async () => {
  const request = documentRequests.get(selectedCustomer.id);
  if (!request) return;
  const copied = await copyText(request.link);
  showToast(copied ? 'Upload link copied' : 'Could not copy upload link');
});
$('#requestUploadDropzone').addEventListener('click', () => requestUploadFile.click());
requestUploadFile.addEventListener('change', () => setRequestUploadSelection(requestUploadFile.files?.[0]));
$('#removeRequestUpload').addEventListener('click', clearRequestUploadSelection);
requestUploadName.addEventListener('input', () => {
  submitRequestUpload.disabled = !selectedRequestUploadFile || !requestUploadName.value.trim();
});
requestUploadType.addEventListener('change', () => {
  if (currentDocumentRequest) requestUploadName.value = `${requestUploadType.value} — ${currentDocumentRequest.traveller}`;
});
requestUploadForm.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!currentDocumentRequest || !selectedRequestUploadFile || !requestUploadName.value.trim()) return;
  const fileName = selectedRequestUploadFile.name;
  const uploads = uploadedRequestDocuments.get(currentDocumentRequest.customerId) ?? [];
  uploads.push({
    id: `customer-upload-${Date.now()}`,
    name: requestUploadName.value.trim(),
    fileName,
    fileSize: selectedRequestUploadFile.size,
    mimeType: selectedRequestUploadFile.type,
    fileUrl: requestUploadPreviewUrl,
    type: requestUploadType.value,
    traveller: currentDocumentRequest.traveller,
    status: 'Pending review',
    source: 'Customer upload link',
    uploadedAt: new Date().toISOString(),
  });
  uploadedRequestDocuments.set(currentDocumentRequest.customerId, uploads);
  currentDocumentRequest.status = 'Received · Approval needed';
  const uploadedType = requestUploadType.value;
  const uploadedTraveller = currentDocumentRequest.traveller;
  requestUploadPreviewUrl = '';
  if (publicDocumentRequestMode) {
    requestUploadForm.hidden = true;
    requestUploadSuccess.hidden = false;
    $('#requestUploadSuccessDocument').textContent = requestUploadName.value.trim();
    return;
  }
  closeRequestUpload();
  const customer = customers.find((item) => item.id === currentDocumentRequest?.customerId) ?? selectedCustomer;
  if (customer.id === selectedCustomer.id) {
    renderDocumentRequestState(customer);
    renderTravellerTab(customer);
    setProfileTab('documents');
  }
  showToast(`${uploadedTraveller} uploaded ${uploadedType}. Approval needed.`);
});
$('#closeRequestUpload').addEventListener('click', closeRequestUpload);
$('#cancelRequestUpload').addEventListener('click', closeRequestUpload);
requestUploadBackdrop.addEventListener('click', (event) => {
  if (!publicDocumentRequestMode && event.target === requestUploadBackdrop) closeRequestUpload();
});
$('#closeDocumentReview').addEventListener('click', closeDocumentReview);
documentReviewBackdrop.addEventListener('click', (event) => { if (event.target === documentReviewBackdrop) closeDocumentReview(); });
$('#approveDocument').addEventListener('click', () => {
  if (!currentReviewDocument) return;
  const traveller = $('#documentReviewTraveller').value;
  const type = $('#documentReviewType').value;
  const name = $('#documentReviewName').value.trim();
  if (!traveller || !type || !name) {
    showToast('Traveller, document type, and document name are required');
    return;
  }
  currentReviewDocument.traveller = traveller;
  currentReviewDocument.type = type === 'Other' ? currentReviewDocument.type : type;
  currentReviewDocument.name = name;
  currentReviewDocument.expiryDate = $('#documentReviewExpiry').value;
  currentReviewDocument.expiry = currentReviewDocument.expiryDate
    ? new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' }).format(new Date(`${currentReviewDocument.expiryDate}T00:00:00`))
    : 'Not provided';
  currentReviewDocument.reviewNote = $('#documentReviewNote').value.trim();
  currentReviewDocument.reviewedAt = new Date().toISOString();
  currentReviewDocument.status = 'Approved';
  const request = documentRequests.get(selectedCustomer.id);
  if (request && pendingReviewDocuments(selectedCustomer.id).length === 0) request.status = 'Completed';
  closeDocumentReview();
  renderDocumentRequestState(selectedCustomer);
  renderTravellerTab(selectedCustomer);
  renderVault();
  showToast(`${name} approved and added to ${traveller}`);
});
$('#replaceDocument').addEventListener('click', () => {
  if (!currentReviewDocument) return;
  documentReplacementFile.click();
});
documentReplacementFile.addEventListener('change', () => {
  const file = documentReplacementFile.files?.[0];
  if (!file || !currentReviewDocument) return;
  const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
  const isImage = ['image/jpeg', 'image/png'].includes(file.type) || /\.(jpe?g|png)$/i.test(file.name);
  const maxBytes = isPdf ? 10 * 1024 * 1024 : 5 * 1024 * 1024;
  if ((!isPdf && !isImage) || file.size > maxBytes) {
    showToast(file.size > maxBytes
      ? `${file.name} is too large. Images must be under 5 MB and PDFs under 10 MB.`
      : 'Choose a JPEG, PNG, or PDF file.');
    documentReplacementFile.value = '';
    return;
  }
  const documentId = currentReviewDocument.id;
  const documentName = currentReviewDocument.name;
  const storedDocument = storedDocumentById(documentId);
  if (!storedDocument) {
    showToast('This document could not be replaced');
    documentReplacementFile.value = '';
    return;
  }
  if (storedDocument.documentItem.fileUrl?.startsWith('blob:')) URL.revokeObjectURL(storedDocument.documentItem.fileUrl);
  storedDocument.documentItem.fileName = file.name;
  storedDocument.documentItem.fileUrl = URL.createObjectURL(file);
  storedDocument.documentItem.mimeType = file.type || (isPdf ? 'application/pdf' : 'image/png');
  storedDocument.documentItem.fileSize = file.size;
  storedDocument.documentItem.uploadedAt = new Date().toISOString();
  storedDocument.documentItem.activity = 'updated just now';
  storedDocument.documentItem.source = 'Agency replacement';
  storedDocument.documentItem.status = currentReviewDocument.status === 'Pending review' ? 'Pending review' : 'Valid';
  documentReplacementFile.value = '';
  renderDocumentRequestState(selectedCustomer);
  renderTravellerTab(selectedCustomer);
  renderVault();
  const rowTrigger = document.querySelector(`[data-document-review="${CSS.escape(documentId)}"]`);
  reviewDocumentById(documentId, rowTrigger ?? $('#replaceDocument'));
  showToast(`${documentName} replaced`);
});
$('#deleteDocument').addEventListener('click', () => {
  if (!currentReviewDocument) return;
  documentReviewManagementActions.hidden = true;
  $('#approveDocument').hidden = true;
  documentDeleteConfirmation.hidden = false;
  $('#cancelDocumentDelete').focus();
});
$('#cancelDocumentDelete').addEventListener('click', () => {
  documentDeleteConfirmation.hidden = true;
  documentReviewManagementActions.hidden = false;
  $('#approveDocument').hidden = currentReviewDocument?.status !== 'Pending review';
  $('#deleteDocument').focus();
});
$('#confirmDocumentDelete').addEventListener('click', () => {
  if (!currentReviewDocument) return;
  const documentId = currentReviewDocument.id;
  const documentName = currentReviewDocument.name;
  const storedDocument = storedDocumentById(documentId);
  if (!storedDocument) {
    showToast('This document could not be deleted');
    return;
  }
  if (storedDocument.documentItem.fileUrl?.startsWith('blob:')) URL.revokeObjectURL(storedDocument.documentItem.fileUrl);
  storedDocument.collection.splice(storedDocument.collection.indexOf(storedDocument.documentItem), 1);
  const request = documentRequests.get(selectedCustomer.id);
  if (request && pendingReviewDocuments(selectedCustomer.id).length === 0) request.status = 'Completed';
  closeDocumentReview();
  renderDocumentRequestState(selectedCustomer);
  renderTravellerTab(selectedCustomer);
  renderVault();
  showToast(`${documentName} deleted`);
});
$('#printDocument').addEventListener('click', printCurrentDocument);


vaultSearch.addEventListener('input', () => {
  vaultPage = 1;
  if (vaultSearchVisible && vaultSearchVisible.value !== vaultSearch.value) vaultSearchVisible.value = vaultSearch.value;
  renderVault();
});
vaultSearchVisible.addEventListener('input', () => {
  if (vaultSearch.value === vaultSearchVisible.value) {
    vaultPage = 1;
    renderVault();
    return;
  }
  vaultSearch.value = vaultSearchVisible.value;
  shellSearch.value = vaultSearchVisible.value;
  vaultPage = 1;
  renderVault();
});
$('#clearVaultSearch').addEventListener('click', () => {
  vaultSearch.value = '';
  shellSearch.value = '';
  if (vaultSearchVisible) vaultSearchVisible.value = '';
  Object.assign(appliedVaultFilters, { tier: null, category: null, expiring: false });
  Object.assign(pendingVaultFilters, appliedVaultFilters);
  renderVaultFilterChips();
  vaultPage = 1;
  expandedVaultCustomer = null;
  renderVault();
  shellSearch.focus();
});
vaultFilterButton.addEventListener('click', () => {
  if (vaultFilterPopover.hidden) openVaultFilterPopover();
  else closeVaultFilterPopover();
});
vaultTierButton.addEventListener('click', () => {
  const open = vaultTierOptions.hidden;
  setOptionsOpen(vaultCategoryButton, vaultCategoryOptions, false);
  setOptionsOpen(vaultTierButton, vaultTierOptions, open);
});
vaultCategoryButton.addEventListener('click', () => {
  const open = vaultCategoryOptions.hidden;
  setOptionsOpen(vaultTierButton, vaultTierOptions, false);
  setOptionsOpen(vaultCategoryButton, vaultCategoryOptions, open);
});
vaultTierOptions.addEventListener('click', (event) => {
  const option = event.target.closest('[data-vault-tier]');
  if (!option) return;
  const value = option.dataset.vaultTier;
  const selected = tierSelection(pendingVaultFilters.tier);
  pendingVaultFilters.tier = selected.includes(value) ? selected.filter((tier) => tier !== value) : [...selected, value];
  syncVaultFilterControls();
});
vaultCategoryOptions.addEventListener('click', (event) => {
  const option = event.target.closest('[data-vault-category]');
  if (!option) return;
  const value = option.dataset.vaultCategory;
  pendingVaultFilters.category = pendingVaultFilters.category === value ? null : value;
  syncVaultFilterControls();
});
vaultExpiringFilter.addEventListener('change', () => {
  pendingVaultFilters.expiring = vaultExpiringFilter.checked;
  syncVaultFilterControls();
});
$('#vaultCancelFilters').addEventListener('click', closeVaultFilterPopover);
vaultApplyFiltersButton.addEventListener('click', applyVaultFiltersAndRender);
vaultAppliedFiltersElement.addEventListener('click', (event) => {
  const remove = event.target.closest('[data-clear-vault-filter]');
  if (!remove) return;
  const key = remove.dataset.clearVaultFilter;
  if (key === 'tier' && remove.dataset.tierValue) {
    appliedVaultFilters.tier = tierSelection(appliedVaultFilters.tier).filter((tier) => tier !== remove.dataset.tierValue);
  } else {
    appliedVaultFilters[key] = typeof appliedVaultFilters[key] === 'boolean' ? false : key === 'tier' ? [] : null;
  }
  Object.assign(pendingVaultFilters, appliedVaultFilters);
  pendingVaultFilters.tier = tierSelection(appliedVaultFilters.tier);
  vaultPage = 1;
  expandedVaultCustomer = null;
  renderVaultFilterChips();
  renderVault();
});
vaultList.addEventListener('click', (event) => {
  const travellerToggle = event.target.closest('[data-traveller-toggle]');
  if (travellerToggle) {
    const expanded = travellerToggle.getAttribute('aria-expanded') === 'true';
    travellerToggle.setAttribute('aria-expanded', String(!expanded));
    $(`#${travellerToggle.getAttribute('aria-controls')}`).hidden = expanded;
    return;
  }
  const vaultCustomerElement = event.target.closest('[data-vault-customer]');
  const vaultCustomer = vaultCustomers.find((item) => item.id === vaultCustomerElement?.dataset.vaultCustomer);
  const profileCustomer = customers.find((item) => item.id === vaultCustomer?.id && item.name === vaultCustomer?.name) ?? vaultCustomer;
  const missingDocument = event.target.closest('[data-request-missing-document]');
  if (missingDocument && profileCustomer) {
    selectedCustomer = profileCustomer;
    openRequestDocumentDialog(missingDocument, missingDocument.dataset.documentType, missingDocument.dataset.travellerName);
    return;
  }
  const reviewButton = event.target.closest('[data-document-review]');
  if (reviewButton && profileCustomer) {
    selectedCustomer = profileCustomer;
    reviewDocumentById(reviewButton.dataset.documentReview, reviewButton);
    return;
  }
  const toggle = event.target.closest('[data-vault-toggle]');
  if (!toggle) return;
  expandedVaultCustomer = expandedVaultCustomer === toggle.dataset.vaultToggle ? null : toggle.dataset.vaultToggle;
  renderVault();
});
vaultPagination.addEventListener('click', (event) => {
  const button = event.target.closest('[data-vault-page]');
  if (!button || button.disabled || button.hasAttribute('data-pagination-blocked')) return;
  const totalPages = Math.max(1, Math.ceil(filteredVaultCustomers().length / VAULT_PAGE_SIZE));
  if (button.dataset.vaultPage === 'prev') vaultPage = Math.max(1, vaultPage - 1);
  else if (button.dataset.vaultPage === 'next') vaultPage = Math.min(totalPages, vaultPage + 1);
  else vaultPage = Number(button.dataset.vaultPage);
  expandedVaultCustomer = null;
  renderVault();
  $('[aria-current="page"]', vaultPagination)?.focus();
});

fileCustomer.innerHTML = vaultCustomers.map((customer) => `<option value="${escapeHTML(customer.id)}">${escapeHTML(customer.name)}</option>`).join('');
$('#addFileButton').addEventListener('click', () => openModal(fileModalBackdrop, fileCustomer));
$('#closeFileModal').addEventListener('click', () => closeModal(fileModalBackdrop, fileForm, $('#addFileButton')));
$('#cancelFileModal').addEventListener('click', () => closeModal(fileModalBackdrop, fileForm, $('#addFileButton')));
fileModalBackdrop.addEventListener('click', (event) => { if (event.target === fileModalBackdrop) closeModal(fileModalBackdrop, fileForm, $('#addFileButton')); });
fileForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const values = new FormData(fileForm);
  const customer = vaultCustomers.find((item) => item.id === values.get('customer'));
  const [year, month] = String(values.get('expiry')).split('-');
  const expiry = new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(new Date(Number(year), Number(month) - 1, 1));
  const file = values.get('file');
  customer.documents.unshift({ traveller: values.get('traveller').trim(), name: values.get('document').trim(), type: values.get('type'), expiry, activity: 'updated just now', kind: file.name.toLocaleLowerCase().endsWith('.pdf') ? 'pdf' : 'doc' });
  vaultSearch.value = customer.name;
  shellSearch.value = customer.name;
  vaultPage = 1;
  expandedVaultCustomer = customer.id;
  renderVault();
  closeModal(fileModalBackdrop, fileForm, $('#addFileButton'));
  showToast(`${values.get('document').trim()} was added`);
});

pagination.addEventListener('click', (event) => {
  const button = event.target.closest('[data-page]');
  if (!button || button.disabled || button.hasAttribute('data-pagination-blocked')) return;
  const totalPages = customerTotalPages();
  if (button.dataset.page === 'prev') currentPage = Math.max(1, currentPage - 1);
  else if (button.dataset.page === 'next') currentPage = Math.min(totalPages, currentPage + 1);
  else currentPage = Number(button.dataset.page);
  renderCustomers();
  renderPagination();
  $('[aria-current="page"]', pagination)?.focus();
});

queryListPagination.addEventListener('click', (event) => {
  const button = event.target.closest('[data-query-list-page]');
  if (!button || button.disabled || button.hasAttribute('data-pagination-blocked')) return;
  const queryRecords = queryCategoryRecords();
  const statusRecords = activeQueryStatus === 'All' ? queryRecords : queryRecords.filter((query) => query.status === activeQueryStatus);
  const totalPages = Math.max(1, Math.ceil(statusRecords.length / WORKSPACE_LIST_PAGE_SIZE));
  if (button.dataset.queryListPage === 'prev') queryListPage = Math.max(1, queryListPage - 1);
  else if (button.dataset.queryListPage === 'next') queryListPage = Math.min(totalPages, queryListPage + 1);
  else queryListPage = Number(button.dataset.queryListPage);
  renderQueryModule();
  $('[aria-current="page"]', queryListPagination)?.focus();
});

taskListPagination.addEventListener('click', (event) => {
  const button = event.target.closest('[data-task-list-page]');
  if (!button || button.disabled || button.hasAttribute('data-pagination-blocked')) return;
  const taskRecordsInView = filteredTaskRecords();
  const statusTasks = activeTaskStatus === 'All' ? taskRecordsInView : taskStatusRecords(taskRecordsInView, activeTaskStatus);
  const totalPages = Math.max(1, Math.ceil(statusTasks.length / WORKSPACE_LIST_PAGE_SIZE));
  if (button.dataset.taskListPage === 'prev') taskListPage = Math.max(1, taskListPage - 1);
  else if (button.dataset.taskListPage === 'next') taskListPage = Math.min(totalPages, taskListPage + 1);
  else taskListPage = Number(button.dataset.taskListPage);
  renderTaskBoard();
  $('[aria-current="page"]', taskListPagination)?.focus();
});

inboxCreateButton.addEventListener('click', () => openInboxCreate(inboxCreateButton));
inboxSearch.addEventListener('input', renderInboxList);
inboxConversationList.addEventListener('click', (event) => {
  const button = event.target.closest('[data-inbox-conversation]');
  if (button) selectInboxConversation(button.dataset.inboxConversation, true);
});
function syncInboxFilterTabs() {
  if (!inboxFilterTabs) return;
  $$('[data-inbox-filter]', inboxFilterTabs).forEach((item) => {
    const selected = item.dataset.inboxFilter === inboxConversationFilter;
    item.classList.toggle('is-active', selected);
    item.setAttribute('aria-selected', String(selected));
    item.tabIndex = selected ? 0 : -1;
  });
}
inboxFilterTabs.addEventListener('click', (event) => {
  const button = event.target.closest('[data-inbox-filter]');
  if (!button) return;
  inboxConversationFilter = button.dataset.inboxFilter;
  syncInboxFilterTabs();
  renderInboxList();
});
inboxFilterTabs.addEventListener('keydown', (event) => {
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
  event.preventDefault();
  const options = $$('[data-inbox-filter]', inboxFilterTabs);
  const currentIndex = options.findIndex((option) => option.dataset.inboxFilter === inboxConversationFilter);
  const nextIndex = event.key === 'Home'
    ? 0
    : event.key === 'End'
      ? options.length - 1
      : (currentIndex + (event.key === 'ArrowRight' ? 1 : -1) + options.length) % options.length;
  inboxConversationFilter = options[nextIndex].dataset.inboxFilter;
  syncInboxFilterTabs();
  renderInboxList();
  options[nextIndex].focus();
});
inboxThreadPanel.addEventListener('click', (event) => {
  if (event.target.closest('[data-inbox-close]')) {
    closeInboxConversation();
    return;
  }
  if (event.target.closest('[data-inbox-reply]')) {
    inboxComposerOpen = true;
    renderInboxThread();
    window.setTimeout(() => $('#inboxEmailSubject', inboxThreadPanel)?.focus(), 0);
    return;
  }
  if (event.target.closest('[data-inbox-collapse]')) {
    inboxComposerOpen = false;
    renderInboxThread();
    window.setTimeout(() => $('[data-inbox-reply]', inboxThreadPanel)?.focus(), 0);
    return;
  }
  const startButton = event.target.closest('[data-inbox-start]');
  if (startButton) {
    openInboxCreate(startButton);
    return;
  }
  const sendButton = event.target.closest('[data-inbox-send]');
  if (sendButton) {
    sendInboxMessage(sendButton.dataset.inboxSend);
    return;
  }
  if (event.target.closest('[data-inbox-mark-unread]')) {
    const conversation = currentInboxConversation();
    if (!conversation) return;
    const latestIncoming = [...conversation.messages].reverse().find((message) => message.direction === 'incoming');
    if (!latestIncoming) {
      showToast('No incoming message to mark unread');
      return;
    }
    latestIncoming.read = false;
    renderInboxList();
    showToast(`${conversation.name} marked unread`);
    return;
  }
  if (event.target.closest('[data-inbox-template-button]')) {
    const menu = $('[data-inbox-template-menu]', inboxThreadPanel);
    const button = $('[data-inbox-template-button]', inboxThreadPanel);
    if (!menu || !button) return;
    const open = menu.hidden;
    menu.hidden = !open;
    button.setAttribute('aria-expanded', String(open));
    return;
  }
  const inboxTemplate = event.target.closest('[data-inbox-template]');
  if (inboxTemplate) {
    applyInboxTemplate(inboxTemplate.dataset.inboxTemplate);
    return;
  }
  if (event.target.closest('[data-inbox-discard]')) {
    closeInboxTemplateMenu();
    const subject = $('#inboxEmailSubject', inboxThreadPanel);
    const body = $('#inboxEmailBody', inboxThreadPanel);
    if (subject) subject.value = '';
    if (body) body.value = '';
    $('[data-inbox-send="email"]', inboxThreadPanel).disabled = true;
    subject?.focus();
  }
});
inboxThreadPanel.addEventListener('input', () => {
  const whatsappInput = $('#inboxMessageInput', inboxThreadPanel);
  const emailSubject = $('#inboxEmailSubject', inboxThreadPanel);
  const emailBody = $('#inboxEmailBody', inboxThreadPanel);
  const sendButton = $('[data-inbox-send]', inboxThreadPanel);
  if (!sendButton) return;
  sendButton.disabled = whatsappInput
    ? !whatsappInput.value.trim()
    : !emailSubject?.value.trim() || !emailBody?.value.trim();
});
inboxThreadPanel.addEventListener('change', (event) => {
  if (event.target.id !== 'inboxAttachmentInput') return;
  const fileName = event.target.files?.[0]?.name ?? '';
  const label = $('#inboxAttachmentName', inboxThreadPanel);
  if (label) label.textContent = fileName;
});
inboxThreadPanel.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  const menu = $('[data-inbox-template-menu]', inboxThreadPanel);
  if (menu && !menu.hidden) {
    event.preventDefault();
    closeInboxTemplateMenu();
    $('[data-inbox-template-button]', inboxThreadPanel)?.focus();
  } else if (inboxComposerOpen) {
    event.preventDefault();
    inboxComposerOpen = false;
    renderInboxThread();
    window.setTimeout(() => $('[data-inbox-reply]', inboxThreadPanel)?.focus(), 0);
  } else if (activeInboxConversationId) {
    event.preventDefault();
    closeInboxConversation();
  }
});
$('#closeInboxCreate').addEventListener('click', closeInboxCreate);
$('#cancelInboxCreate').addEventListener('click', closeInboxCreate);
inboxCreateBackdrop.addEventListener('click', (event) => { if (event.target === inboxCreateBackdrop) closeInboxCreate(); });
inboxCustomerSearch.addEventListener('input', renderInboxCustomers);
inboxCustomerList.addEventListener('click', (event) => {
  const button = event.target.closest('[data-inbox-customer]');
  if (!button) return;
  selectedInboxCustomerId = button.dataset.inboxCustomer;
  renderInboxCustomers();
  startInboxConversationButton.focus();
});
startInboxConversationButton.addEventListener('click', startInboxConversation);

function closeInboxSent(returnToInbox = false) {
  inboxSentBackdrop.hidden = true;
  document.body.style.overflow = '';
  if (returnToInbox) {
    closeInboxConversation();
    return;
  }
  $('#inboxMessageInput, #inboxEmailSubject', inboxThreadPanel)?.focus();
}

$('#closeInboxSent').addEventListener('click', () => closeInboxSent(true));
$('#viewSentConversation').addEventListener('click', () => closeInboxSent(false));
inboxSentBackdrop.addEventListener('click', (event) => { if (event.target === inboxSentBackdrop) closeInboxSent(false); });

$$('.tasks-tab').forEach((tab) => tab.addEventListener('click', () => setTaskView(tab.dataset.taskView)));
$$('[data-task-layout]').forEach((button) => button.addEventListener('click', () => {
  activeTaskLayout = button.dataset.taskLayout;
  saveLayoutPreference('tasks', activeTaskLayout);
  taskListPage = 1;
  renderTaskBoard();
}));
taskStatusTabs.addEventListener('click', (event) => {
  const tab = event.target.closest('[data-task-status-tab]');
  if (!tab) return;
  activeTaskStatus = tab.dataset.taskStatusTab;
  taskListPage = 1;
  renderTaskBoard();
});
tasksSearch.addEventListener('input', () => {
  taskListPage = 1;
  renderTaskBoard();
});
tasksFilterButton.addEventListener('click', () => {
  const open = tasksFilterPopover.hidden;
  if (open) syncTaskFilterControls();
  tasksFilterPopover.hidden = !open;
  tasksFilterButton.setAttribute('aria-expanded', String(open));
  syncThemedControls(tasksFilterPopover);
  if (open) $('.themed-btn', tasksFilterPopover)?.focus();
});
$('#clearTaskFilters').addEventListener('click', clearTaskFilters);
applyTaskFiltersButton.addEventListener('click', () => {
  const invalidRange = Boolean(tasksDateFrom.value && tasksDateTo.value && tasksDateTo.value < tasksDateFrom.value);
  tasksDateTo.setCustomValidity(invalidRange ? 'End date must be on or after the start date.' : '');
  if (!tasksDateTo.reportValidity()) return;
  taskFilters.priority = tasksPriorityFilter.value;
  taskFilters.entity = tasksEntityFilter.value;
  taskFilters.assignee = tasksAssigneeFilter.value;
  taskFilters.sort = tasksSort.value;
  taskFilters.from = tasksDateFrom.value;
  taskFilters.to = tasksDateTo.value;
  closeTaskFilterPopover();
  taskListPage = 1;
  renderTaskBoard();
});
[tasksPriorityFilter, tasksEntityFilter, tasksAssigneeFilter, tasksSort].forEach((select) => {
  select.addEventListener('change', syncTaskFilterApplyState);
});
[tasksDateFrom, tasksDateTo].forEach((input) => input.addEventListener('input', () => {
  tasksDateTo.setCustomValidity('');
  syncTaskFilterApplyState();
}));
newTaskButton.addEventListener('click', () => openTaskModal({ returnFocus: newTaskButton }));
$('#newProfileTaskButton').addEventListener('click', (event) => openCustomerTaskModal(event.currentTarget));
profileTaskSearch.addEventListener('input', () => {
  profileTaskSearchQuery = profileTaskSearch.value;
  profileTaskPage = 1;
  renderProfileTasks(selectedCustomer);
});
profileTaskFilterButton.addEventListener('click', () => {
  if (profileTaskFilterPopover.hidden) openProfileTaskFilterPopover();
  else closeProfileTaskFilterPopover();
});
[profileTaskPriorityFilter, profileTaskEntityFilter, profileTaskAssigneeFilter, profileTaskSort].forEach((select) => {
  select.addEventListener('change', () => {
    pendingProfileTaskFilters.priority = profileTaskPriorityFilter.value;
    pendingProfileTaskFilters.entity = profileTaskEntityFilter.value;
    pendingProfileTaskFilters.assignee = profileTaskAssigneeFilter.value;
    pendingProfileTaskFilters.sort = profileTaskSort.value;
    applyProfileTaskFiltersButton.disabled = !profileTaskFilterChanged();
  });
});
[profileTaskDateFrom, profileTaskDateTo].forEach((input) => input.addEventListener('input', () => {
  pendingProfileTaskFilters.from = profileTaskDateFrom.value;
  pendingProfileTaskFilters.to = profileTaskDateTo.value;
  applyProfileTaskFiltersButton.disabled = !profileTaskFilterChanged();
}));
$('#applyProfileTaskFilters').addEventListener('click', () => {
  Object.assign(profileTaskFilters, pendingProfileTaskFilters);
  profileTaskPage = 1;
  closeProfileTaskFilterPopover();
  renderProfileTasks(selectedCustomer);
});
$('#clearProfileTaskFilters').addEventListener('click', () => {
  Object.assign(pendingProfileTaskFilters, { priority: 'all', entity: 'all', assignee: 'all', sort: 'created-desc', from: '', to: '' });
  Object.assign(profileTaskFilters, pendingProfileTaskFilters);
  profileTaskSearchQuery = '';
  profileTaskSearch.value = '';
  profileTaskPage = 1;
  closeProfileTaskFilterPopover();
  renderProfileTasks(selectedCustomer);
});
document.addEventListener('click', (event) => {
  if (!profileTaskFilterPopover.hidden && !event.target.closest('.profile-tasks-toolbar')) closeProfileTaskFilterPopover();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !profileTaskFilterPopover.hidden) closeProfileTaskFilterPopover();
});
document.addEventListener('click', (event) => {
  const queryPopover = queryTaskField('queryTaskFilterPopover');
  if (queryPopover && !queryPopover.hidden && !event.target.closest('.query-tasks-toolbar')) closeQueryTaskFilterPopover();
});
document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  const queryPopover = queryTaskField('queryTaskFilterPopover');
  if (queryPopover && !queryPopover.hidden) closeQueryTaskFilterPopover();
});
profileTaskPagination.addEventListener('click', (event) => {
  const pageButton = event.target.closest('[data-profile-task-page]');
  if (!pageButton || pageButton.disabled || pageButton.hasAttribute('data-pagination-blocked')) return;
  const totalPages = Math.max(1, Math.ceil(filteredProfileTasks(selectedCustomer).length / PROFILE_TASKS_PAGE_SIZE));
  const key = pageButton.dataset.profileTaskPage;
  if (key === 'prev') profileTaskPage = Math.max(1, profileTaskPage - 1);
  else if (key === 'next') profileTaskPage = Math.min(totalPages, profileTaskPage + 1);
  else profileTaskPage = Number(key) || 1;
  renderProfileTasks(selectedCustomer);
  $('[aria-current="page"]', profileTaskPagination)?.focus();
});
profileTaskRows.addEventListener('click', (event) => {
  const row = event.target.closest('[data-profile-task-id]');
  if (!row) return;
  const task = taskRecords.find((record) => record.id === row.dataset.profileTaskId);
  if (task) openCustomerTaskModal(row, task);
});
profileTaskRows.addEventListener('keydown', (event) => {
  if (!['Enter', ' '].includes(event.key)) return;
  const row = event.target.closest('[data-profile-task-id]');
  if (!row) return;
  event.preventDefault();
  const task = taskRecords.find((record) => record.id === row.dataset.profileTaskId);
  if (task) openCustomerTaskModal(row, task);
});
overviewTaskCards.addEventListener('click', (event) => {
  const row = event.target.closest('[data-customer-task-id]');
  if (!row) return;
  const task = taskRecords.find((record) => record.id === row.dataset.customerTaskId);
  if (task) openCustomerTaskModal(row, task);
});
overviewTaskCards.addEventListener('keydown', (event) => {
  if (!['Enter', ' '].includes(event.key)) return;
  const row = event.target.closest('[data-customer-task-id]');
  if (!row) return;
  event.preventDefault();
  const task = taskRecords.find((record) => record.id === row.dataset.customerTaskId);
  if (task) openCustomerTaskModal(row, task);
});
overviewReferralTree.addEventListener('click', (event) => {
  const node = event.target.closest('[data-referral-customer]');
  if (!node) return;
  const customer = referralCustomer(node.dataset.referralCustomer);
  if (!customer) return;
  setView('detail', customer);
});
$('#trioViewAllTasks').addEventListener('click', () => setProfileTab('tasks'));
$('#trioViewReferral').addEventListener('click', (event) => openReferralTree(event.currentTarget));
$('#saveReferralReferrer').addEventListener('click', saveReferralReferrer);
$('#closeReferralTree').addEventListener('click', () => closeReferralTree());
$('#doneReferralTree').addEventListener('click', () => closeReferralTree());
referralTreeBackdrop.addEventListener('click', (event) => {
  if (event.target === referralTreeBackdrop) closeReferralTree();
});
referralTreeStage.addEventListener('click', (event) => {
  const node = event.target.closest('[data-referral-customer]');
  if (!node) return;
  const customer = referralCustomer(node.dataset.referralCustomer);
  if (!customer) return;
  closeReferralTree(false);
  setView('detail', customer);
});
$('#tasksEmptyCreate').addEventListener('click', (event) => openTaskModal({ returnFocus: event.currentTarget }));
tasksRefreshButton.addEventListener('click', () => {
  renderTaskBoard();
  showToast('Tasks refreshed');
});
taskDueDate.addEventListener('change', syncTaskDueTime);
taskForm.addEventListener('submit', saveTask);
$('#closeTaskDetails').addEventListener('click', () => closeTaskDetails());
taskDetailsBackdrop.addEventListener('click', (event) => {
  if (event.target === taskDetailsBackdrop) closeTaskDetails();
});
taskDetailsBackdrop.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    event.preventDefault();
    event.stopPropagation();
    if (!taskDeleteConfirm.hidden) {
      taskDeleteConfirm.hidden = true;
      taskDetailActions.hidden = false;
      taskDeleteButton.focus();
    } else closeTaskDetails();
    return;
  }
  if (event.key !== 'Tab') return;
  const focusable = [...taskDetailsBackdrop.querySelectorAll('button:not([disabled])')]
    .filter((button) => !button.closest('[hidden]') && button.getClientRects().length);
  if (!focusable.length) return;
  if (event.shiftKey && document.activeElement === focusable[0]) {
    event.preventDefault();
    focusable.at(-1).focus();
  } else if (!event.shiftKey && document.activeElement === focusable.at(-1)) {
    event.preventDefault();
    focusable[0].focus();
  }
});
taskCompleteButton.addEventListener('click', () => {
  const taskIdValue = taskDetailsId;
  closeTaskDetails(false);
  updateTaskStatus(taskIdValue, 'Done');
  newTaskButton.focus();
});
taskEditButton.addEventListener('click', () => {
  const task = taskRecords.find((item) => item.id === taskDetailsId);
  const returnFocus = taskDetailsReturnFocus;
  closeTaskDetails(false);
  if (task) openTaskModal({ task, edit: true, returnFocus });
});
taskDeleteButton.addEventListener('click', () => {
  taskDetailActions.hidden = true;
  taskDeleteConfirm.hidden = false;
  $('#cancelTaskDelete').focus();
});
$('#cancelTaskDelete').addEventListener('click', () => {
  taskDeleteConfirm.hidden = true;
  taskDetailActions.hidden = false;
  taskDeleteButton.focus();
});
$('#confirmTaskDelete').addEventListener('click', () => {
  const index = taskRecords.findIndex((task) => task.id === taskDetailsId);
  if (index < 0) return;
  const [task] = taskRecords.splice(index, 1);
  closeTaskDetails(false);
  saveTaskRecordsStore();
  refreshTaskViews(task);
  taskBoardAnnouncement.textContent = `${task.title} deleted.`;
  newTaskButton.focus();
  showToast('Task deleted');
});
$('#closeTaskModal').addEventListener('click', closeTaskModalDialog);
$('#cancelTaskModal').addEventListener('click', closeTaskModalDialog);
taskModalBackdrop.addEventListener('click', (event) => {
  if (event.target === taskModalBackdrop) closeTaskModalDialog();
});
taskModalBackdrop.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    event.preventDefault();
    closeTaskModalDialog();
    return;
  }
  if (event.key !== 'Tab') return;
  const focusable = [...taskModalBackdrop.querySelectorAll('button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')]
    .filter((element) => !element.closest('[hidden]') && element.getClientRects().length);
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
});
taskBoard.addEventListener('click', (event) => {
  const addButton = event.target.closest('[data-task-add-status]');
  if (addButton) {
    openTaskModal({ status: addButton.dataset.taskAddStatus, returnFocus: addButton });
    return;
  }
  const card = event.target.closest('[data-task-id]');
  if (!card) return;
  const task = taskRecords.find((item) => item.id === card.dataset.taskId);
  if (task) openTaskModal({ task, returnFocus: card });
});
taskBoard.addEventListener('keydown', (event) => {
  if (!['Enter', ' '].includes(event.key)) return;
  const card = event.target.closest('[data-task-id]');
  if (!card) return;
  event.preventDefault();
  const task = taskRecords.find((item) => item.id === card.dataset.taskId);
  if (task) openTaskModal({ task, returnFocus: card });
});
taskListBody.addEventListener('click', (event) => {
  const row = event.target.closest('[data-task-id]');
  if (!row) return;
  const task = taskRecords.find((item) => item.id === row.dataset.taskId);
  if (task) openTaskModal({ task, returnFocus: row });
});
taskListBody.addEventListener('keydown', (event) => {
  if (!['Enter', ' '].includes(event.key)) return;
  const row = event.target.closest('[data-task-id]');
  if (!row) return;
  event.preventDefault();
  const task = taskRecords.find((item) => item.id === row.dataset.taskId);
  if (task) openTaskModal({ task, returnFocus: row });
});
taskBoard.addEventListener('dragstart', (event) => {
  const card = event.target.closest('[data-task-id]');
  if (!card) return;
  draggedTaskId = card.dataset.taskId;
  event.dataTransfer.effectAllowed = 'move';
  event.dataTransfer.setData('text/plain', draggedTaskId);
  window.setTimeout(() => card.classList.add('is-dragging'), 0);
});
taskBoard.addEventListener('dragend', (event) => {
  event.target.closest('[data-task-id]')?.classList.remove('is-dragging');
  $$('.task-column.is-drag-over', taskBoard).forEach((column) => column.classList.remove('is-drag-over'));
  draggedTaskId = null;
});
taskBoard.addEventListener('dragover', (event) => {
  const column = event.target.closest('[data-task-status]');
  if (!column || !draggedTaskId) return;
  event.preventDefault();
  event.dataTransfer.dropEffect = 'move';
  $$('.task-column.is-drag-over', taskBoard).forEach((item) => item.classList.toggle('is-drag-over', item === column));
});
taskBoard.addEventListener('dragleave', (event) => {
  const column = event.target.closest('[data-task-status]');
  if (column && !column.contains(event.relatedTarget)) column.classList.remove('is-drag-over');
});
taskBoard.addEventListener('drop', (event) => {
  const column = event.target.closest('[data-task-status]');
  if (!column) return;
  event.preventDefault();
  const droppedTaskId = draggedTaskId || event.dataTransfer.getData('text/plain');
  updateTaskStatus(droppedTaskId, column.dataset.taskStatus);
  draggedTaskId = null;
});

document.addEventListener('click', (event) => {
  if (!filterPopover.hidden && !event.target.closest('.filter-anchor')) closeFilterPopover();
  if (vaultFilterPopover && !vaultFilterPopover.hidden && !event.target.closest('.vault-controls .filter-anchor')) closeVaultFilterPopover();
  if (!tasksFilterPopover.hidden && !event.target.closest('.task-filter-anchor')) closeTaskFilterPopover();
  if (!queriesFilterPopover.hidden && !event.target.closest('.query-filter-anchor')) {
    closeQueryFilterPopover();
  }
  const detailMenu = $('#queryDetailMenu', queryDetailContent);
  if (detailMenu && !detailMenu.hidden && !event.target.closest('.query-detail-menu-wrap')) detailMenu.hidden = true;
  if (!customerMailTemplateMenu.hidden && !event.target.closest('.customer-mail-template-anchor')) closeCustomerMailTemplateMenu();
  const inboxTemplateMenu = $('[data-inbox-template-menu]', inboxThreadPanel);
  if (inboxTemplateMenu && !inboxTemplateMenu.hidden && !event.target.closest('[data-inbox-template-menu], [data-inbox-template-button]')) closeInboxTemplateMenu();
});

document.addEventListener('keydown', (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLocaleLowerCase() === 'k') {
    event.preventDefault();
    if (globalSearchBackdrop?.hidden) openGlobalSearch(document.activeElement);
    else closeGlobalSearch();
    return;
  }
  if (event.key === 'Escape' && globalSearchBackdrop && !globalSearchBackdrop.hidden) {
    event.preventDefault();
    closeGlobalSearch();
    return;
  }
  if (event.key === 'Escape' && notificationCenterBackdrop && !notificationCenterBackdrop.hidden) {
    event.preventDefault();
    closeNotificationCenter();
    return;
  }
  if (event.key === 'Escape' && accountMenuBackdrop && !accountMenuBackdrop.hidden) {
    event.preventDefault();
    closeAccountMenu();
    return;
  }
  if (event.key !== 'Escape') return;
  if (!customerNotesBackdrop.hidden) closeCustomerNotes();
  if (!vendorModalBackdrop.hidden) closeVendorOnboarding();
  if (!queryTypeModalBackdrop.hidden) closeQueryTypeSelector(true);
  if (!queryModalBackdrop.hidden) closeQueryOnboarding();
  if (!bookingModalBackdrop.hidden) closeBookingOnboarding();
  if (!fileModalBackdrop.hidden) closeModal(fileModalBackdrop, fileForm, $('#addFileButton'));
  if (!requestDocumentBackdrop.hidden) closeRequestDocumentDialog();
  if (!requestUploadBackdrop.hidden) closeRequestUpload();
  if (!documentReviewBackdrop.hidden) closeDocumentReview();
  if (!importModalBackdrop.hidden) closeImportModal();
  if (!filterPopover.hidden) closeFilterPopover();
  if (vaultFilterPopover && !vaultFilterPopover.hidden) closeVaultFilterPopover();
  if (!inboxCreateBackdrop.hidden) closeInboxCreate();
  if (!inboxSentBackdrop.hidden) closeInboxSent(false);
  if (!taskModalBackdrop.hidden) closeTaskModalDialog();
  if (!referralTreeBackdrop.hidden) closeReferralTree();
  if (!tasksFilterPopover.hidden) closeTaskFilterPopover();
  if (!queriesFilterPopover.hidden) {
    closeQueryFilterPopover();
  }
  if (!customerMailTemplateMenu.hidden) closeCustomerMailTemplateMenu();
});

window.addEventListener('popstate', (event) => {
  const hashCategory = QUERY_TYPES.find((type) => location.hash === `#${type.toLocaleLowerCase()}`);
  const hashQueryId = location.hash.match(/^#query-(QRY-[A-Z0-9-]+)$/)?.[1];
  const hashQuery = queryModuleRecords.find((query) => query.id === hashQueryId);
  const fallbackView = hashQuery ? 'query-detail' : hashCategory ? 'queries' : location.hash === '#dashboard' ? 'dashboard' : location.hash === '#inbox' ? 'inbox' : location.hash === '#tasks' ? 'tasks' : location.hash === '#notifications' ? 'notifications' : location.hash === '#account' ? 'account' : location.hash === '#document-vault' ? 'vault' : location.hash === '#new-customer' ? 'new-customer' : 'customers';
  const view = event.state?.view ?? fallbackView;
  pruneViewBackStackForArrival(event.state, fallbackView);
  if (view === 'queries') activeQueryCategory = event.state?.queryCategory ?? hashCategory ?? activeQueryCategory;
  if (view === 'query-detail') {
    selectedQuery = queryModuleRecords.find((query) => query.id === event.state?.queryId) ?? hashQuery ?? selectedQuery;
    activeQueryDetailTab = QUERY_DETAIL_TABS.includes(event.state?.queryDetailTab) ? event.state.queryDetailTab : 'overview';
  }
  const customer = customers.find((item) => item.id === event.state?.customerId) ?? selectedCustomer;
  vaultSourceCustomer = view === 'vault'
    ? customers.find((item) => item.id === event.state?.sourceCustomerId) ?? null
    : vaultSourceCustomer;
  setView(view, customer, false);
  if (view === 'detail') setProfileTab(event.state?.profileTab ?? 'overview');
  if (location.hash === '#finance') setAllFinancesCurrent();
});
shellBackButton.addEventListener('click', navigateBack);
shellBreadcrumbRoot.addEventListener('click', () => setView(shellBreadcrumbRoot.dataset.view || 'dashboard'));
shellBreadcrumbCustomer.addEventListener('click', () => {
  if (vaultSourceCustomer) openCustomerDocuments(vaultSourceCustomer);
});
shellSearchLabel.addEventListener('click', () => openGlobalSearch(shellSearchLabel));
shellSearch.addEventListener('click', () => openGlobalSearch(shellSearch));
shellSearch.addEventListener('focus', () => {
  if (suppressShellSearchFocus) {
    suppressShellSearchFocus = false;
    return;
  }
  openGlobalSearch(shellSearch);
});
globalSearchInput?.addEventListener('input', filterGlobalSearchResults);
globalSearchInput?.addEventListener('keydown', (event) => {
  if (!['ArrowDown', 'ArrowUp', 'Enter'].includes(event.key)) return;
  const results = visibleGlobalSearchResults();
  if (!results.length) return;
  event.preventDefault();
  const currentIndex = results.findIndex((item) => item.classList.contains('is-active'));
  if (event.key === 'Enter') {
    results[currentIndex < 0 ? 0 : currentIndex].click();
    return;
  }
  const direction = event.key === 'ArrowDown' ? 1 : -1;
  const nextIndex = currentIndex < 0
    ? (direction > 0 ? 0 : results.length - 1)
    : (currentIndex + direction + results.length) % results.length;
  results.forEach((item, index) => {
    item.classList.toggle('is-active', index === nextIndex);
    item.setAttribute('aria-selected', String(index === nextIndex));
  });
  results[nextIndex].scrollIntoView({ block: 'nearest' });
});
globalSearchResults?.addEventListener('mousemove', (event) => {
  const result = event.target.closest('[data-global-search-target]');
  if (!result || result.hidden) return;
  visibleGlobalSearchResults().forEach((item) => item.classList.toggle('is-active', item === result));
});
globalSearchResults?.addEventListener('click', (event) => {
  const result = event.target.closest('[data-global-search-target]');
  if (!result) return;
  closeGlobalSearch(false);
  navigateGlobalSearchTarget(result.dataset.globalSearchTarget);
});
globalSearchBackdrop?.addEventListener('click', (event) => {
  if (event.target === globalSearchBackdrop) closeGlobalSearch();
});

shellNotificationsButton?.addEventListener('click', () => {
  if (notificationCenterBackdrop?.hidden) openNotificationCenter(shellNotificationsButton);
  else closeNotificationCenter();
});
closeNotificationCenterButton?.addEventListener('click', () => closeNotificationCenter());
notificationCenterBackdrop?.addEventListener('click', (event) => {
  if (event.target === notificationCenterBackdrop) closeNotificationCenter();
});
notificationsUnreadTab?.addEventListener('click', () => {
  notificationFilter = 'unread';
  renderShellNotifications();
});
notificationsAllTab?.addEventListener('click', () => {
  notificationFilter = 'all';
  renderShellNotifications();
});
markNotificationsRead?.addEventListener('click', () => {
  shellNotifications.forEach((item) => { item.unread = false; });
  renderShellNotifications();
  showToast('All notifications marked as read');
});
viewAllNotifications?.addEventListener('click', () => {
  closeNotificationCenter(false);
  setView('notifications');
});
notificationPreferences?.addEventListener('click', () => {
  closeNotificationCenter(false);
  openAccountView('preferences');
  showToast('Notification preferences opened');
});
notificationList?.addEventListener('click', (event) => {
  const row = event.target.closest('[data-notification-id]');
  const notification = shellNotifications.find((item) => item.id === row?.dataset.notificationId);
  if (!notification || !notification.unread) return;
  notification.unread = false;
  renderShellNotifications();
});
notificationsView?.addEventListener('click', (event) => {
  if (event.target.closest('[data-mark-notifications-read]')) {
    shellNotifications.forEach((item) => { item.unread = false; });
    renderShellNotifications();
    showToast('All notifications marked as read');
    return;
  }
  if (event.target.closest('[data-notification-preferences]')) {
    openAccountView('preferences');
    showToast('Notification preferences opened');
    return;
  }
  if (event.target.closest('[data-notification-filter="unread"]')) {
    notificationPageUnreadOnly = !notificationPageUnreadOnly;
    renderShellNotifications();
    return;
  }
  const row = event.target.closest('[data-notification-id]');
  const notification = shellNotifications.find((item) => item.id === row?.dataset.notificationId);
  if (notification?.unread) {
    notification.unread = false;
    renderShellNotifications();
  }
});

shellAccountButton?.addEventListener('click', () => {
  if (accountMenuBackdrop?.hidden) openAccountMenu(shellAccountButton);
  else closeAccountMenu();
});
accountMenuBackdrop?.addEventListener('click', (event) => {
  if (event.target === accountMenuBackdrop) closeAccountMenu();
});
accountMenu?.addEventListener('click', (event) => {
  const section = event.target.closest('[data-account-section]')?.dataset.accountSection;
  if (!section) return;
  closeAccountMenu(false);
  openAccountView(section);
});
shellSignOut?.addEventListener('click', () => {
  closeAccountMenu();
  showToast('Signed out of this preview');
});
accountView?.addEventListener('click', (event) => {
  const section = event.target.closest('[data-account-section]')?.dataset.accountSection;
  if (!section) return;
  activateAccountSection(section, true);
});
restoreAccountProfile();
saveAccountProfile?.addEventListener('click', () => {
  accountFullName.value = accountFullName.value.trim();
  accountEmail.value = accountEmail.value.trim();
  accountPhone.value = accountPhone.value.trim();
  if (![accountFullName, accountEmail, accountPhone].every((input) => input.reportValidity())) return;
  syncAccountProfileIdentity();
  try {
    localStorage.setItem(ACCOUNT_PROFILE_STORAGE_KEY, JSON.stringify({
      name: accountFullName.value,
      email: accountEmail.value,
      phone: accountPhone.value,
    }));
    showToast('Profile changes saved');
  } catch {
    showToast('Profile updated for this session');
  }
});
accountChangePhoto?.addEventListener('click', () => accountPhotoInput?.click());
accountPhotoInput?.addEventListener('change', () => {
  const photo = accountPhotoInput.files?.[0];
  if (!photo) return;
  if (!['image/png', 'image/jpeg'].includes(photo.type) || photo.size > 5 * 1024 * 1024) {
    accountPhotoInput.value = '';
    showToast('Choose a PNG or JPG image under 5 MB');
    return;
  }
  if (accountPhotoPreviewUrl) URL.revokeObjectURL(accountPhotoPreviewUrl);
  accountPhotoPreviewUrl = URL.createObjectURL(photo);
  const image = document.createElement('img');
  image.alt = '';
  image.src = accountPhotoPreviewUrl;
  accountProfileAvatar.replaceChildren(image);
  showToast('Profile photo updated for this session');
});
shellHelpButton?.addEventListener('click', () => {
  showToast('Help is available from your Paryatech workspace administrator');
});

[brandHomeLink, dashboardNavLink].forEach((item) => item.addEventListener('click', (event) => {
  event.preventDefault();
  setView('dashboard');
  if (mobileSidebarQuery.matches) setMobileSidebarOpen(false);
}));

customersNavLink.addEventListener('click', (event) => {
  event.preventDefault();
  setView('customers');
  if (mobileSidebarQuery.matches) setMobileSidebarOpen(false);
});

inboxNavLink.addEventListener('click', (event) => {
  event.preventDefault();
  setView('inbox');
  if (mobileSidebarQuery.matches) setMobileSidebarOpen(false);
});

tasksNavLink.addEventListener('click', (event) => {
  event.preventDefault();
  setView('tasks');
  if (mobileSidebarQuery.matches) setMobileSidebarOpen(false);
});
$('#financeFullLedgerLink').addEventListener('click', navigateToAllFinances);


$$('.sidebar a:not(#brandHomeLink):not(#dashboardNavLink):not(#inboxNavLink):not(#tasksNavLink):not(#queryNavLink):not(#customersNavLink), .signout-button').forEach((item) => item.addEventListener('click', (event) => {
  event.preventDefault();
  const queryCategory = QUERY_TYPES.find((type) => item.matches(`a[href="#${type.toLocaleLowerCase()}"]`));
  if (queryCategory) {
    setQueryCategory(queryCategory);
    setView('queries');
  } else if (item.matches('a[href="#bookings"]')) {
    openBookingOnboarding(activeView === 'detail' ? selectedCustomer : null, item);
  } else if (item.matches('a[href="#finance"]')) {
    navigateToAllFinances(event);
  } else {
    showToast(`${item.textContent.trim()} is outside this module preview`);
  }
  if (mobileSidebarQuery.matches) setMobileSidebarOpen(false);
}));

/* Themed replacements for system controls (calendar popover and
   searchable country-code list) plus shared popover management.
   Native inputs stay in the DOM as the form value source; the themed
   trigger is the visible control. */
const THEMED_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const THEMED_WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const COUNTRY_DIAL_CODES = [
  ['Afghanistan', '+93'], ['Albania', '+355'], ['Algeria', '+213'], ['American Samoa', '+1'],
  ['Andorra', '+376'], ['Angola', '+244'], ['Anguilla', '+1'], ['Argentina', '+54'],
  ['Armenia', '+374'], ['Australia', '+61'], ['Austria', '+43'], ['Azerbaijan', '+994'],
  ['Bahamas', '+1'], ['Bahrain', '+973'], ['Bangladesh', '+880'], ['Belarus', '+375'],
  ['Belgium', '+32'], ['Belize', '+501'], ['Benin', '+229'], ['Bhutan', '+975'],
  ['Bolivia', '+591'], ['Bosnia and Herzegovina', '+387'], ['Botswana', '+267'], ['Brazil', '+55'],
  ['Brunei', '+673'], ['Bulgaria', '+359'], ['Burkina Faso', '+226'], ['Cambodia', '+855'],
  ['Cameroon', '+237'], ['Canada', '+1'], ['Chile', '+56'], ['China', '+86'],
  ['Colombia', '+57'], ['Costa Rica', '+506'], ['Croatia', '+385'], ['Cyprus', '+357'],
  ['Czech Republic', '+420'], ['Denmark', '+45'], ['Dominican Republic', '+1'], ['Ecuador', '+593'],
  ['Egypt', '+20'], ['El Salvador', '+503'], ['Estonia', '+372'], ['Ethiopia', '+251'],
  ['Fiji', '+679'], ['Finland', '+358'], ['France', '+33'], ['Georgia', '+995'],
  ['Germany', '+49'], ['Ghana', '+233'], ['Greece', '+30'], ['Guatemala', '+502'],
  ['Honduras', '+504'], ['Hong Kong', '+852'], ['Hungary', '+36'], ['Iceland', '+354'],
  ['India', '+91'], ['Indonesia', '+62'], ['Iran', '+98'], ['Iraq', '+964'],
  ['Ireland', '+353'], ['Israel', '+972'], ['Italy', '+39'], ['Jamaica', '+1'],
  ['Japan', '+81'], ['Jordan', '+962'], ['Kazakhstan', '+7'], ['Kenya', '+254'],
  ['Kuwait', '+965'], ['Laos', '+856'], ['Latvia', '+371'], ['Lebanon', '+961'],
  ['Lithuania', '+370'], ['Luxembourg', '+352'], ['Malaysia', '+60'], ['Maldives', '+960'],
  ['Malta', '+356'], ['Mauritius', '+230'], ['Mexico', '+52'], ['Morocco', '+212'],
  ['Myanmar', '+95'], ['Nepal', '+977'], ['Netherlands', '+31'], ['New Zealand', '+64'],
  ['Nicaragua', '+505'], ['Nigeria', '+234'], ['Norway', '+47'], ['Oman', '+968'],
  ['Pakistan', '+92'], ['Panama', '+507'], ['Peru', '+51'], ['Philippines', '+63'],
  ['Poland', '+48'], ['Portugal', '+351'], ['Qatar', '+974'], ['Romania', '+40'],
  ['Russia', '+7'], ['Saudi Arabia', '+966'], ['Senegal', '+221'], ['Serbia', '+381'],
  ['Singapore', '+65'], ['Slovakia', '+421'], ['South Africa', '+27'], ['South Korea', '+82'],
  ['Spain', '+34'], ['Sri Lanka', '+94'], ['Sweden', '+46'], ['Switzerland', '+41'],
  ['Taiwan', '+886'], ['Tanzania', '+255'], ['Thailand', '+66'], ['Turkey', '+90'],
  ['Uganda', '+256'], ['Ukraine', '+380'], ['United Arab Emirates', '+971'], ['United Kingdom', '+44'],
  ['United States', '+1'], ['Uruguay', '+598'], ['Uzbekistan', '+998'], ['Venezuela', '+58'],
  ['Vietnam', '+84'], ['Yemen', '+967'], ['Zambia', '+260'], ['Zimbabwe', '+263'],
  ['Åland Islands', '+358'],
];
const themedPopoverState = { pop: null, anchor: null };

function themedSvg(symbol) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('aria-hidden', 'true');
  const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
  use.setAttribute('href', `#${symbol}`);
  svg.append(use);
  return svg;
}

function positionThemedPop(pop, anchor) {
  pop.classList.remove('is-align-right', 'is-drop-up');
  if (window.matchMedia('(max-width: 650px)').matches) return;
  const anchorRect = anchor.getBoundingClientRect();
  const popRect = pop.getBoundingClientRect();
  const gutter = 12;
  const modalRect = pop.closest('.modal')?.getBoundingClientRect();
  const boundary = modalRect ?? { top: gutter, right: window.innerWidth - gutter, bottom: window.innerHeight - gutter, left: gutter };
  const below = boundary.bottom - anchorRect.bottom - 8;
  const above = anchorRect.top - boundary.top - 8;
  if (anchorRect.left + popRect.width > boundary.right) pop.classList.add('is-align-right');
  if (popRect.height > below && above > below) pop.classList.add('is-drop-up');
}

function closeThemedPops() {
  const { pop, anchor } = themedPopoverState;
  if (pop) {
    pop.hidden = true;
    pop.classList.remove('is-align-right', 'is-drop-up');
  }
  if (anchor) anchor.setAttribute('aria-expanded', 'false');
  themedPopoverState.pop = null;
  themedPopoverState.anchor = null;
}

function trackThemedPop(pop, anchor) {
  const alreadyOpen = themedPopoverState.pop === pop && !pop.hidden;
  closeThemedPops();
  if (alreadyOpen) return false;
  pop.hidden = false;
  positionThemedPop(pop, anchor);
  anchor.setAttribute('aria-expanded', 'true');
  themedPopoverState.pop = pop;
  themedPopoverState.anchor = anchor;
  return true;
}

document.addEventListener('click', (event) => {
  if (themedPopoverState.pop && !event.target.closest('.themed-anchor')) closeThemedPops();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && themedPopoverState.pop) {
    const { anchor } = themedPopoverState;
    event.stopPropagation();
    closeThemedPops();
    anchor?.focus();
  }
}, true);
window.addEventListener('resize', closeThemedPops);
window.addEventListener('scroll', closeThemedPops, { passive: true });

function formatThemedDate(iso) {
  if (!iso) return '';
  const parts = iso.split('-').map(Number);
  if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) return '';
  return `${parts[2]} ${THEMED_MONTHS[parts[1] - 1]} ${parts[0]}`;
}

function themedDateView(input) {
  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth();
  if (input.value) {
    const parts = input.value.split('-').map(Number);
    if (parts[0] && parts[1]) {
      year = parts[0];
      month = parts[1] - 1;
    }
  }
  return { year, month };
}

function renderThemedCalendar(wrap) {
  const input = $('input[type="date"]', wrap);
  const pop = $('.themed-cal', wrap);
  const view = wrap._themedView ?? themedDateView(input);
  wrap._themedView = view;
  pop.innerHTML = '';
  const head = document.createElement('div');
  head.className = 'themed-cal-head';
  const prev = document.createElement('button');
  prev.type = 'button';
  prev.className = 'themed-cal-nav';
  prev.setAttribute('aria-label', 'Previous month');
  prev.append(themedSvg('i-chevron-left'));
  prev.addEventListener('click', () => {
    view.month -= 1;
    if (view.month < 0) {
      view.month = 11;
      view.year -= 1;
    }
    renderThemedCalendar(wrap);
  });
  const monthPick = document.createElement('div');
  monthPick.className = 'themed-cal-pick';
  const monthButton = document.createElement('button');
  monthButton.type = 'button';
  monthButton.setAttribute('aria-haspopup', 'listbox');
  monthButton.setAttribute('aria-expanded', 'false');
  const monthLabel = document.createElement('span');
  monthLabel.textContent = THEMED_MONTHS[view.month];
  monthButton.append(monthLabel, themedSvg('i-chevron-down'));
  const monthList = document.createElement('div');
  monthList.className = 'themed-list';
  monthList.setAttribute('role', 'listbox');
  monthList.hidden = true;
  THEMED_MONTHS.forEach((name, index) => {
    const option = document.createElement('button');
    option.type = 'button';
    option.className = 'themed-option';
    option.setAttribute('role', 'option');
    option.setAttribute('aria-selected', String(index === view.month));
    const label = document.createElement('span');
    label.textContent = name;
    option.append(label);
    option.addEventListener('click', () => {
      view.month = index;
      renderThemedCalendar(wrap);
    });
    monthList.append(option);
  });
  monthButton.addEventListener('click', (event) => {
    event.stopPropagation();
    const willOpen = monthList.hidden;
    monthList.hidden = !willOpen;
    yearList.hidden = true;
    yearButton.setAttribute('aria-expanded', 'false');
    monthButton.setAttribute('aria-expanded', String(willOpen));
  });
  monthPick.append(monthButton, monthList);
  const yearPick = document.createElement('div');
  yearPick.className = 'themed-cal-pick';
  const yearButton = document.createElement('button');
  yearButton.type = 'button';
  yearButton.setAttribute('aria-haspopup', 'listbox');
  yearButton.setAttribute('aria-expanded', 'false');
  const yearLabel = document.createElement('span');
  yearLabel.textContent = String(view.year);
  yearButton.append(yearLabel, themedSvg('i-chevron-down'));
  const yearList = document.createElement('div');
  yearList.className = 'themed-list';
  yearList.setAttribute('role', 'listbox');
  yearList.hidden = true;
  const currentYear = new Date().getFullYear();
  for (let year = currentYear + 10; year >= currentYear - 100; year -= 1) {
    const option = document.createElement('button');
    option.type = 'button';
    option.className = 'themed-option';
    option.setAttribute('role', 'option');
    option.setAttribute('aria-selected', String(year === view.year));
    const label = document.createElement('span');
    label.textContent = String(year);
    option.append(label);
    option.addEventListener('click', () => {
      view.year = year;
      renderThemedCalendar(wrap);
    });
    yearList.append(option);
  }
  yearButton.addEventListener('click', (event) => {
    event.stopPropagation();
    const willOpen = yearList.hidden;
    yearList.hidden = !willOpen;
    monthList.hidden = true;
    monthButton.setAttribute('aria-expanded', 'false');
    yearButton.setAttribute('aria-expanded', String(willOpen));
  });
  yearPick.append(yearButton, yearList);
  const next = document.createElement('button');
  next.type = 'button';
  next.className = 'themed-cal-nav';
  next.setAttribute('aria-label', 'Next month');
  next.append(themedSvg('i-chevron-right'));
  next.addEventListener('click', () => {
    view.month += 1;
    if (view.month > 11) {
      view.month = 0;
      view.year += 1;
    }
    renderThemedCalendar(wrap);
  });
  head.append(prev, monthPick, yearPick, next);
  const grid = document.createElement('div');
  grid.className = 'themed-cal-grid';
  grid.setAttribute('role', 'grid');
  THEMED_WEEKDAYS.forEach((day) => {
    const cell = document.createElement('span');
    cell.className = 'themed-cal-dow';
    cell.textContent = day;
    grid.append(cell);
  });
  const firstOffset = new Date(view.year, view.month, 1).getDay();
  for (let cell = 0; cell < 42; cell += 1) {
    const date = new Date(view.year, view.month, 1 - firstOffset + cell);
    const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const day = document.createElement('button');
    day.type = 'button';
    day.className = 'themed-cal-day';
    day.textContent = String(date.getDate());
    if (date.getMonth() !== view.month) day.classList.add('is-outside');
    day.setAttribute('aria-selected', String(input.value === iso));
    const disabled = (input.min && iso < input.min) || (input.max && iso > input.max);
    day.disabled = Boolean(disabled);
    day.addEventListener('click', () => {
      input.value = iso;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      syncThemedDate(wrap);
      closeThemedPops();
    });
    grid.append(day);
  }
  pop.append(head, grid);
}

function syncThemedDate(wrap) {
  const input = $('input[type="date"]', wrap);
  const label = $('.themed-btn-label', wrap);
  if (!input || !label) return;
  const text = formatThemedDate(input.value);
  label.textContent = text || input.dataset.placeholder || 'Select date';
  label.classList.toggle('is-placeholder', !text);
}

function enhanceDateInput(input) {
  if (input.dataset.themedDate) return;
  input.dataset.themedDate = '1';
  const wrap = document.createElement('span');
  wrap.className = 'themed-anchor themed-date';
  input.before(wrap);
  wrap.append(input);
  input.classList.add('themed-native');
  input.tabIndex = -1;
  input.setAttribute('aria-hidden', 'true');
  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'themed-btn';
  trigger.setAttribute('aria-haspopup', 'dialog');
  trigger.setAttribute('aria-expanded', 'false');
  const datePlaceholder = input.dataset.placeholder || 'Select date';
  trigger.setAttribute('aria-label', input.getAttribute('aria-label') || 'Select date');
  const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  icon.setAttribute('viewBox', '0 0 24 24');
  icon.setAttribute('aria-hidden', 'true');
  icon.innerHTML = '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M3.5 9.5h17M8 3v3.5M16 3v3.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>';
  const label = document.createElement('span');
  label.className = 'themed-btn-label is-placeholder';
  label.textContent = datePlaceholder;
  trigger.append(icon, label);
  const pop = document.createElement('div');
  pop.className = 'themed-pop themed-cal';
  pop.hidden = true;
  pop.setAttribute('role', 'dialog');
  pop.setAttribute('aria-label', 'Choose date');
  wrap.append(trigger, pop);
  trigger.addEventListener('click', () => {
    wrap._themedView = themedDateView(input);
    renderThemedCalendar(wrap);
    if (trackThemedPop(pop, trigger)) {
      const selected = $('.themed-cal-day[aria-selected="true"]', pop);
      selected?.scrollIntoView({ block: 'nearest' });
    }
  });
  syncThemedDate(wrap);
}

function renderCountryOptions(wrap, term = '') {
  const select = $('select', wrap);
  const list = $('.themed-list', wrap);
  const query = term.trim().toLowerCase();
  list.innerHTML = '';
  const matches = COUNTRY_DIAL_CODES.filter(([name, code]) => !query
    || name.toLowerCase().includes(query)
    || code.replace(/\s/g, '').includes(query.replace(/\s/g, '')));
  if (!matches.length) {
    const empty = document.createElement('p');
    empty.className = 'themed-empty';
    empty.textContent = 'No countries match your search.';
    list.append(empty);
    return;
  }
  matches.forEach(([name, code]) => {
    const option = document.createElement('button');
    option.type = 'button';
    option.className = 'themed-option';
    option.setAttribute('role', 'option');
    option.setAttribute('aria-selected', String(select.value === code));
    const nameLabel = document.createElement('span');
    nameLabel.textContent = name;
    const codeLabel = document.createElement('span');
    codeLabel.className = 'themed-option-code';
    codeLabel.textContent = code;
    option.append(nameLabel, codeLabel);
    option.addEventListener('click', () => {
      if (![...select.options].some((item) => item.value === code || item.text === code)) {
        select.append(new Option(code, code));
      }
      select.value = code;
      select.dispatchEvent(new Event('change', { bubbles: true }));
      syncThemedCountry(wrap);
      closeThemedPops();
    });
    list.append(option);
  });
}

function syncThemedCountry(wrap) {
  const select = $('select', wrap);
  const label = $('.themed-btn-label', wrap);
  if (!select || !label) return;
  label.textContent = select.value || '+91';
  label.classList.remove('is-placeholder');
}

function enhanceCountrySelect(select) {
  if (select.dataset.themedCountry) return;
  select.dataset.themedCountry = '1';
  const wrap = document.createElement('span');
  wrap.className = 'themed-anchor themed-country';
  select.before(wrap);
  wrap.append(select);
  select.classList.add('themed-native');
  select.tabIndex = -1;
  select.setAttribute('aria-hidden', 'true');
  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'themed-btn';
  trigger.setAttribute('aria-haspopup', 'listbox');
  trigger.setAttribute('aria-expanded', 'false');
  trigger.setAttribute('aria-label', select.getAttribute('aria-label') || 'Country code');
  const label = document.createElement('span');
  label.className = 'themed-btn-label';
  trigger.append(label, themedSvg('i-chevron-down'));
  trigger.lastChild.classList.add('themed-btn-chevron');
  const pop = document.createElement('div');
  pop.className = 'themed-pop';
  pop.hidden = true;
  pop.setAttribute('role', 'dialog');
  pop.setAttribute('aria-label', 'Choose country code');
  const searchRow = document.createElement('div');
  searchRow.className = 'themed-search';
  searchRow.append(themedSvg('i-search'));
  const search = document.createElement('input');
  search.type = 'search';
  search.placeholder = 'Search country or code';
  search.setAttribute('aria-label', 'Search country or code');
  search.autocomplete = 'off';
  searchRow.append(search);
  const list = document.createElement('div');
  list.className = 'themed-list';
  list.setAttribute('role', 'listbox');
  pop.append(searchRow, list);
  wrap.append(trigger, pop);
  search.addEventListener('input', () => renderCountryOptions(wrap, search.value));
  search.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    $('.themed-option', list)?.click();
  });
  trigger.addEventListener('click', () => {
    search.value = '';
    renderCountryOptions(wrap, '');
    if (trackThemedPop(pop, trigger)) {
      window.setTimeout(() => search.focus(), 0);
      $('.themed-option[aria-selected="true"]', list)?.scrollIntoView({ block: 'nearest' });
    }
  });
  syncThemedCountry(wrap);
}

function selectOptionText(option) {
  return (option?.text ?? '').trim();
}

function fieldCaptionFor(select) {
  const field = select.closest('label');
  const caption = field ? [...field.children].find((node) => node.tagName === 'SPAN') : null;
  return caption?.textContent.trim() || select.getAttribute('aria-label') || select.name || 'Select option';
}

function focusThemedOption(list, direction) {
  const items = [...list.querySelectorAll('.filter-options button:not([disabled]), .themed-option:not([disabled])')];
  if (!items.length) return;
  const index = items.indexOf(document.activeElement);
  items[(index + direction + items.length) % items.length].focus();
}

document.addEventListener('keydown', (event) => {
  const trigger = event.target.closest('.filter-select-button');
  if (trigger && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
    const list = $('.filter-options', trigger.parentElement);
    if (!list) return;
    event.preventDefault();
    if (list.hidden) trigger.click();
    window.setTimeout(() => {
      const options = [...$$('button:not([disabled])', list)];
      const selected = options.find((option) => option.getAttribute('aria-selected') === 'true');
      (selected || options[event.key === 'ArrowDown' ? 0 : options.length - 1])?.focus();
    }, 0);
    return;
  }
  const list = event.target.closest('.filter-options:not(.themed-pick-list):not(.inbox-filter-options)');
  if (!list) return;
  const options = [...$$('button:not([disabled])', list)];
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault();
    focusThemedOption(list, event.key === 'ArrowDown' ? 1 : -1);
  } else if (event.key === 'Home' || event.key === 'End') {
    event.preventDefault();
    options[event.key === 'Home' ? 0 : options.length - 1]?.focus();
  } else if (event.key === 'Escape') {
    event.preventDefault();
    list.hidden = true;
    const listTrigger = list.parentElement?.querySelector('.filter-select-button');
    listTrigger?.setAttribute('aria-expanded', 'false');
    listTrigger?.focus();
  } else if (event.key === 'Tab') {
    list.hidden = true;
    list.parentElement?.querySelector('.filter-select-button')?.setAttribute('aria-expanded', 'false');
  }
});

function renderSelectOptions(wrap, term = '') {
  const select = $('select', wrap);
  const trigger = $('.themed-btn', wrap);
  const list = $('.themed-pick-list', wrap);
  if (!select || !list) return;
  const query = term.trim().toLowerCase();
  list.innerHTML = '';
  const options = [...select.options].filter((option) => !query || selectOptionText(option).toLowerCase().includes(query));
  if (!options.length) {
    const empty = document.createElement('p');
    empty.className = 'themed-empty';
    empty.textContent = 'No matches found.';
    list.append(empty);
    return;
  }
  options.forEach((option) => {
    const item = document.createElement('button');
    item.type = 'button';
    item.disabled = option.disabled;
    item.setAttribute('role', 'option');
    item.setAttribute('aria-selected', String(option.selected));
    if (select.dataset.avatar === 'initials') {
      const avatar = document.createElement('span');
      avatar.className = 'themed-option-avatar';
      avatar.textContent = option.value === 'Unassigned' ? '—' : initials(option.value);
      const optionLabel = document.createElement('span');
      optionLabel.className = 'themed-option-label';
      optionLabel.textContent = selectOptionText(option) || '(Blank)';
      item.append(avatar, optionLabel);
  } else if (activeProfileEditSection === 'dates') {
    const dateKeys = values.getAll('dateKey');
    const dateTypes = values.getAll('dateType');
    const dateLabels = values.getAll('dateLabel');
    const dateValues = values.getAll('dateValue');
    let labelIndex = 0;
    customer.importantDates = dateKeys.map((key, index) => {
      const previous = customer.importantDates.find((item) => item.key === key);
      const type = dateTypes[index] ?? previous?.type ?? 'Custom date';
      const isCustom = type === 'Custom date';
      const label = isCustom
        ? (String(dateLabels[labelIndex++] ?? '').trim() || 'Custom date')
        : (previous?.label ?? type);
      return { key, type, label, date: dateValues[index] ?? '' };
    });
  } else {
      item.textContent = selectOptionText(option) || '(Blank)';
    }
    const dot = document.createElement('span');
    dot.className = 'themed-option-dot';
    dot.setAttribute('aria-hidden', 'true');
    item.append(dot);
    item.addEventListener('click', () => {
      select.value = option.value;
      select.dispatchEvent(new Event('change', { bubbles: true }));
      syncThemedSelect(wrap);
      closeThemedPops();
      trigger?.focus();
    });
    list.append(item);
  });
}

function syncThemedSelect(wrap) {
  const select = $('select', wrap);
  const trigger = $('.themed-btn', wrap);
  const label = $('.themed-btn-label', wrap);
  if (!select || !trigger || !label) return;
  const selected = select.options[select.selectedIndex];
  const text = selected ? selectOptionText(selected) : '';
  label.textContent = text || 'Select';
  label.classList.toggle('is-placeholder', !selected || selected.value === '');
  const avatar = $('.themed-btn-avatar', trigger);
  if (avatar) {
    avatar.textContent = selected?.value === 'Unassigned' ? '—' : initials(selected?.value || '');
    avatar.hidden = !selected;
  }
  trigger.disabled = select.disabled;
  trigger.setAttribute('aria-label', fieldCaptionFor(select));
}

function enhanceSelect(select) {
  if (select.dataset.themedSelect || select.dataset.themedCountry || select.multiple) return;
  select.dataset.themedSelect = '1';
  const wrap = document.createElement('span');
  wrap.className = 'themed-anchor themed-select';
  select.before(wrap);
  wrap.append(select);
  select.classList.add('themed-native');
  select.tabIndex = -1;
  select.setAttribute('aria-hidden', 'true');
  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'themed-btn';
  trigger.setAttribute('aria-haspopup', 'listbox');
  trigger.setAttribute('aria-expanded', 'false');
  trigger.setAttribute('aria-label', fieldCaptionFor(select));
  const label = document.createElement('span');
  label.className = 'themed-btn-label';
  if (select.dataset.avatar === 'initials') {
    const avatar = document.createElement('span');
    avatar.className = 'themed-btn-avatar';
    avatar.setAttribute('aria-hidden', 'true');
    trigger.append(avatar);
  }
  trigger.append(label, themedSvg('i-chevron-down'));
  trigger.lastChild.classList.add('themed-btn-chevron');
  const pop = document.createElement('div');
  pop.className = 'themed-pop themed-select-pop';
  pop.hidden = true;
  pop.setAttribute('aria-label', trigger.getAttribute('aria-label'));
  const searchRow = document.createElement('div');
  searchRow.className = 'themed-search';
  searchRow.hidden = true;
  searchRow.append(themedSvg('i-search'));
  const search = document.createElement('input');
  search.type = 'search';
  search.placeholder = 'Search options';
  search.setAttribute('aria-label', 'Search options');
  search.autocomplete = 'off';
  searchRow.append(search);
  const list = document.createElement('div');
  list.className = 'filter-options themed-pick-list';
  list.setAttribute('role', 'listbox');
  list.setAttribute('aria-label', trigger.getAttribute('aria-label'));
  pop.append(searchRow, list);
  wrap.append(trigger, pop);
  // The native select stays the form value source: mirror its changes and
  // route programmatic focus onto the visible trigger.
  select.addEventListener('change', () => syncThemedSelect(wrap));
  select.addEventListener('focus', () => {
    if (document.activeElement === select) trigger.focus();
  });
  trigger.addEventListener('click', () => {
    if (select.disabled) return;
    search.value = '';
    searchRow.hidden = select.options.length <= 8;
    renderSelectOptions(wrap, '');
    if (trackThemedPop(pop, trigger)) {
      if (!searchRow.hidden) window.setTimeout(() => search.focus(), 0);
      else $('.filter-options button[aria-selected="true"]', list)?.scrollIntoView({ block: 'nearest' });
    }
  });
  trigger.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    event.preventDefault();
    if (pop.hidden) trigger.click();
    window.setTimeout(() => {
      const options = [...$$('.filter-options button:not([disabled])', list)];
      const selected = options.find((option) => option.getAttribute('aria-selected') === 'true');
      (selected || options[event.key === 'ArrowDown' ? 0 : options.length - 1])?.focus();
    }, 0);
  });
  search.addEventListener('input', () => renderSelectOptions(wrap, search.value));
  search.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      $('.filter-options button:not([disabled])', list)?.click();
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      focusThemedOption(list, event.key === 'ArrowDown' ? 1 : -1);
    }
  });
  list.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      focusThemedOption(list, event.key === 'ArrowDown' ? 1 : -1);
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      const options = [...$$('button:not([disabled])', list)];
      options[event.key === 'Home' ? 0 : options.length - 1]?.focus();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      closeThemedPops();
      trigger.focus();
    } else if (event.key === 'Tab') {
      closeThemedPops();
    }
  });
  syncThemedSelect(wrap);
}

const THEMED_FULL_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function formatThemedMonth(value) {
  if (!value) return '';
  const parts = String(value).split('-').map(Number);
  if (!parts[0] || !parts[1] || parts[1] < 1 || parts[1] > 12) return '';
  return `${THEMED_FULL_MONTHS[parts[1] - 1]} ${parts[0]}`;
}

function themedMonthView(input) {
  const now = new Date();
  const state = { year: null, month: null };
  if (input.value) {
    const parts = String(input.value).split('-').map(Number);
    if (parts[0]) state.year = parts[0];
    if (parts[1] >= 1 && parts[1] <= 12) state.month = parts[1];
  }
  if (!state.year) state.year = now.getFullYear();
  return state;
}

function themedMonthYears() {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let year = currentYear - 30; year <= currentYear + 30; year += 1) years.push(year);
  return years;
}

function renderMonthPicker(wrap) {
  const input = $('input', wrap);
  const monthList = $('.themed-month-months', wrap);
  const yearList = $('.themed-month-years', wrap);
  if (!input || !monthList || !yearList) return;
  const pending = wrap._themedMonth ?? themedMonthView(input);
  wrap._themedMonth = pending;
  monthList.innerHTML = '';
  THEMED_FULL_MONTHS.forEach((name, index) => {
    const month = index + 1;
    const option = document.createElement('button');
    option.type = 'button';
    option.className = 'themed-option';
    option.setAttribute('role', 'option');
    option.setAttribute('aria-selected', String(pending.month === month));
    const label = document.createElement('span');
    label.textContent = name;
    option.append(label);
    option.addEventListener('click', () => {
      pending.month = month;
      commitThemedMonth(wrap);
    });
    monthList.append(option);
  });
  yearList.innerHTML = '';
  themedMonthYears().forEach((year) => {
    const option = document.createElement('button');
    option.type = 'button';
    option.className = 'themed-option';
    option.setAttribute('role', 'option');
    option.setAttribute('aria-selected', String(pending.year === year));
    const label = document.createElement('span');
    label.textContent = String(year);
    option.append(label);
    option.addEventListener('click', () => {
      pending.year = year;
      commitThemedMonth(wrap);
    });
    yearList.append(option);
  });
}

function commitThemedMonth(wrap) {
  const input = $('input', wrap);
  if (!input) return;
  const pending = wrap._themedMonth;
  if (!pending || !pending.year || !pending.month) {
    renderMonthPicker(wrap);
    return;
  }
  input.value = `${pending.year}-${String(pending.month).padStart(2, '0')}`;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
  syncThemedMonth(wrap);
  closeThemedPops();
}

function syncThemedMonth(wrap) {
  const input = $('input', wrap);
  const trigger = $('.themed-btn', wrap);
  const label = $('.themed-btn-label', wrap);
  if (!input || !trigger || !label) return;
  const text = formatThemedMonth(input.value);
  label.textContent = text || 'Select month';
  label.classList.toggle('is-placeholder', !text);
  trigger.disabled = input.disabled;
}

function enhanceMonthInput(input) {
  if (input.dataset.themedMonth) return;
  input.dataset.themedMonth = '1';
  const wrap = document.createElement('span');
  wrap.className = 'themed-anchor themed-month';
  input.before(wrap);
  wrap.append(input);
  input.classList.add('themed-native');
  input.tabIndex = -1;
  input.setAttribute('aria-hidden', 'true');
  // No manual typing: the native month control is hidden and the value can
  // only be set through the Month + Year picker below.
  input.readOnly = true;
  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'themed-btn';
  trigger.setAttribute('aria-haspopup', 'dialog');
  trigger.setAttribute('aria-expanded', 'false');
  trigger.setAttribute('aria-label', fieldCaptionFor(input) || 'Expiry month');
  const label = document.createElement('span');
  label.className = 'themed-btn-label is-placeholder';
  label.textContent = 'Select month';
  trigger.append(label, themedSvg('i-chevron-down'));
  trigger.lastChild.classList.add('themed-btn-chevron');
  const pop = document.createElement('div');
  pop.className = 'themed-pop themed-month-pop';
  pop.hidden = true;
  pop.setAttribute('role', 'dialog');
  pop.setAttribute('aria-label', 'Choose expiry month and year');
  const cols = document.createElement('div');
  cols.className = 'themed-month-cols';
  const monthCol = document.createElement('div');
  const monthCap = document.createElement('span');
  monthCap.className = 'themed-month-cap';
  monthCap.textContent = 'Month';
  const monthList = document.createElement('div');
  monthList.className = 'themed-list themed-month-months';
  monthList.setAttribute('role', 'listbox');
  monthList.setAttribute('aria-label', 'Month');
  monthCol.append(monthCap, monthList);
  const yearCol = document.createElement('div');
  const yearCap = document.createElement('span');
  yearCap.className = 'themed-month-cap';
  yearCap.textContent = 'Year';
  const yearList = document.createElement('div');
  yearList.className = 'themed-list themed-month-years';
  yearList.setAttribute('role', 'listbox');
  yearList.setAttribute('aria-label', 'Year');
  yearCol.append(yearCap, yearList);
  cols.append(monthCol, yearCol);
  pop.append(cols);
  wrap.append(trigger, pop);
  input.addEventListener('change', () => syncThemedMonth(wrap));
  input.addEventListener('focus', () => {
    if (document.activeElement === input) trigger.focus();
  });
  trigger.addEventListener('click', () => {
    if (input.disabled) return;
    wrap._themedMonth = themedMonthView(input);
    renderMonthPicker(wrap);
    if (trackThemedPop(pop, trigger)) {
      $('.themed-month-months .themed-option[aria-selected="true"]', pop)?.scrollIntoView({ block: 'nearest' });
      $('.themed-month-years .themed-option[aria-selected="true"]', pop)?.scrollIntoView({ block: 'nearest' });
    }
  });
  [monthList, yearList].forEach((list) => {
    list.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        focusThemedOption(list, event.key === 'ArrowDown' ? 1 : -1);
      } else if (event.key === 'Escape') {
        event.preventDefault();
        closeThemedPops();
        trigger.focus();
      }
    });
  });
  syncThemedMonth(wrap);
}

function enhanceThemedControls(root = document) {
  $$('input[type="date"]:not([data-themed-date])', root).forEach(enhanceDateInput);
  $$('input[type="month"]:not([data-themed-month])', root).forEach(enhanceMonthInput);
  $$('select[name="phoneCountry"]:not([data-themed-country]), select[name="whatsappCountry"]:not([data-themed-country])', root).forEach(enhanceCountrySelect);
  $$('select:not([data-themed-select]):not([data-themed-country])', root).forEach(enhanceSelect);
  syncThemedControls(root);
}

function syncThemedControls(root = document) {
  $$('.themed-date', root).forEach(syncThemedDate);
  $$('.themed-month', root).forEach(syncThemedMonth);
  $$('.themed-country', root).forEach(syncThemedCountry);
  $$('.themed-select', root).forEach(syncThemedSelect);
}

// Dynamically rendered views (query detail, profile editors, option rebuilds)
// inject or mutate selects after init: pick those up automatically and re-sync
// labels/disabled state. The dataset flags keep every sweep idempotent.
let themedSweepQueued = false;
function queueThemedSweep() {
  if (themedSweepQueued) return;
  themedSweepQueued = true;
  window.setTimeout(() => {
    themedSweepQueued = false;
    enhanceThemedControls(document);
  }, 0);
}
if ('MutationObserver' in window) {
  const themedObserver = new MutationObserver(() => queueThemedSweep());
  themedObserver.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['disabled'] });
}

syncSidebarForViewport();
renderCustomers();
renderPagination();
renderVault();
renderInboxList();
renderInboxThread();
renderTaskBoard();
renderQueryModule();
renderShellNotifications();
enhanceThemedControls(document);
updateDashboardClock();
const homeViewParam = new URLSearchParams(location.search).get('view');
setDashboardHomeMode(homeViewParam === 'new-user' || homeViewParam === 'new' ? 'new' : 'returning');
setDashboardDensity('normal');

const initialCustomerId = location.hash.match(/^#customer-(CUST-\d+)$/)?.[1];
const initialCustomer = customers.find((customer) => customer.id === initialCustomerId);
const initialQueryId = location.hash.match(/^#query-(QRY-[A-Z0-9-]+)$/)?.[1];
const initialQuery = queryModuleRecords.find((query) => query.id === initialQueryId);
const initialQueryCategory = QUERY_TYPES.find((type) => location.hash === `#${type.toLocaleLowerCase()}`);
if (location.hash === '#new-customer') {
  resetCustomerOnboarding();
  history.replaceState({ view: 'new-customer', canGoBack: false }, '', '#new-customer');
  setView('new-customer', selectedCustomer, false);
} else if (location.hash === '#finance') {
  history.replaceState({ view: 'customers', canGoBack: false, destination: 'finance' }, '', '#finance');
  setView('customers', selectedCustomer, false);
  setAllFinancesCurrent();
} else if (location.hash === '#inbox') {
  history.replaceState({ view: 'inbox', canGoBack: false }, '', '#inbox');
  setView('inbox', selectedCustomer, false);
} else if (location.hash === '#tasks') {
  history.replaceState({ view: 'tasks', canGoBack: false }, '', '#tasks');
  setView('tasks', selectedCustomer, false);
} else if (location.hash === '#notifications') {
  history.replaceState({ view: 'notifications', canGoBack: false }, '', '#notifications');
  setView('notifications', selectedCustomer, false);
} else if (location.hash === '#account') {
  history.replaceState({ view: 'account', canGoBack: false }, '', '#account');
  setView('account', selectedCustomer, false);
} else if (initialQuery) {
  selectedQuery = initialQuery;
  activeQueryCategory = initialQuery.type;
  history.replaceState({ view: 'query-detail', queryId: initialQuery.id, queryDetailTab: 'overview', canGoBack: false }, '', location.hash);
  setView('query-detail', queryDetailCustomer(initialQuery) ?? selectedCustomer, false);
} else if (initialQueryCategory) {
  activeQueryCategory = initialQueryCategory;
  history.replaceState({ view: 'queries', queryCategory: initialQueryCategory, canGoBack: false }, '', location.hash);
  setView('queries', selectedCustomer, false);
} else if (location.hash === '#document-vault') {
  history.replaceState({ view: 'vault', canGoBack: false }, '', '#document-vault');
  setView('vault', selectedCustomer, false);
} else if (initialCustomer) {
  history.replaceState({ view: 'detail', customerId: initialCustomer.id, profileTab: 'overview', canGoBack: false }, '', location.hash);
  setView('detail', initialCustomer, false);
} else if (location.hash === '#customers') {
  history.replaceState({ view: 'customers', canGoBack: false }, '', '#customers');
  setView('customers', selectedCustomer, false);
} else {
  history.replaceState({ view: 'dashboard', canGoBack: false }, '', '#dashboard');
  setView('dashboard', selectedCustomer, false);
}

const publicRequestParams = new URLSearchParams(location.search);
const publicRequestToken = publicRequestParams.get('document-request');
const publicRequestCustomerId = publicRequestParams.get('customer-id');
const publicRequestCustomer = publicRequestParams.get('customer');
const publicRequestTypes = publicRequestParams.getAll('document').filter(Boolean);
if (publicRequestToken && publicRequestCustomer) {
  publicDocumentRequestMode = true;
  appShell.hidden = true;
  requestUploadBackdrop.classList.add('is-public-request');
  $('#closeRequestUpload').hidden = true;
  $('#cancelRequestUpload').hidden = true;
  prepareRequestUpload({
    customerId: publicRequestCustomerId || 'public-request',
    traveller: publicRequestCustomer,
    types: publicRequestTypes.length ? publicRequestTypes : ['Document'],
    message: '',
    link: location.href,
    status: 'Sent',
  });
  requestReturnFocus = null;
  openModal(requestUploadBackdrop, requestUploadType);
}

// Recalculate pagination when the viewport, filters or selection bar use space.
const customerPageObserver = new ResizeObserver(() => requestAnimationFrame(fitCustomerPage));
for (const element of [
  $('#customerListView'),
  $('#customerListView').closest('.main-content'),
  $('#customerListView .page-header'),
  $('#customerListView .customer-controls'),
  $('#customerListView .workspace-bulk-bar'),
]) {
  if (element) customerPageObserver.observe(element);
}

initializeWorkspaceParity({
  queryActions: (id, trigger) => {
    const query = queryModuleRecords.find(item => item.id === id);
    if (!query) return [];
    return [
      { label: 'View query', icon: 'file', run: () => openQueryDetail(query) },
      { label: 'Edit query', icon: 'edit', run: () => { openQueryDetail(query); openQueryPositionEditor($('[data-query-detail-action="edit-position"]', queryDetailContent)); } },
      { label: 'Add task', icon: 'tasks', run: () => openTaskModal({ queryLock: query, returnFocus: trigger }) },
    ];
  },
  taskActions: (id, trigger) => {
    const task = taskRecords.find(item => item.id === id);
    if (!task) return [];
    return [
      { label: 'View task', icon: 'file', run: () => openTaskDetails(task, trigger) },
      { label: 'Edit task', icon: 'edit', run: () => openTaskModal({ task, edit: true, returnFocus: trigger }) },
      ...(task.status === 'Done' ? [] : [{ label: 'Mark completed', icon: 'check', run: () => updateTaskStatus(id, 'Done') }]),
      { label: 'Delete task', icon: 'trash', danger: true, run: () => { openTaskDetails(task, trigger); taskDeleteButton.click(); } },
    ];
  },
});
