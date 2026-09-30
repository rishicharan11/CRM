// Shared list behavior, matching the finalized Packages / Booking data sheets.
const sheets = new WeakMap();

export function enhanceListSheet(table, entity, recordIds = []) {
  if (!table) return;
  let state = sheets.get(table);
  if (!state) {
    state = { selected: new Set(), records: new Map(), entity };
    sheets.set(table, state);
    table.classList.add('workspace-data-sheet');
    const bar = document.createElement('div');
    bar.className = 'workspace-bulk-bar';
    bar.hidden = true;
    bar.innerHTML = '<span role="status"></span><div><button class="button button-secondary button-small" type="button" data-sheet-export>Export selected</button><button class="button button-secondary button-small" type="button" data-sheet-clear>Clear selection</button></div>';
    table.closest('.table-scroller, .query-table-scroller, .profile-tasks-scroller').before(bar);
    state.bar = bar;
    // Capture before row navigation. Space on a checkbox must select the record.
    for (const type of ['click', 'keydown']) {
      table.addEventListener(type, event => {
        if (event.target.closest('.workspace-check-cell')) event.stopPropagation();
      }, true);
    }
    table.addEventListener('change', event => {
      const input = event.target.closest('[data-sheet-check]');
      if (!input) return;
      const ids = visibleRows(table).map(rowId);
      const targets = input.dataset.sheetCheck === 'all' ? ids : [input.dataset.sheetCheck];
      for (const id of targets) input.checked ? state.selected.add(id) : state.selected.delete(id);
      syncSelection(table, state);
    });
    bar.querySelector('[data-sheet-clear]').addEventListener('click', () => {
      state.selected.clear();
      syncSelection(table, state);
    });
    bar.querySelector('[data-sheet-export]').addEventListener('click', () => {
      const cell = text => '"' + text.replaceAll('"', '""') + '"';
      const headers = [...table.tHead.rows[0].cells].slice(1, -1).map(td => cell(td.textContent.trim()));
      const lines = [...state.selected].map(id => state.records.get(id)).filter(Boolean).map(values => values.map(cell).join(','));
      const url = URL.createObjectURL(new Blob(['\uFEFF' + [headers.join(','), ...lines].join('\r\n')], { type: 'text/csv;charset=utf-8' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `${entity}-selected.csv`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
  }
  table.querySelector('.workspace-sheet-fill')?.remove();
  const head = table.tHead.rows[0];
  if (!head.querySelector('.workspace-check-cell')) head.prepend(checkCell('all', `Select all ${entity} on this page`, true));
  const rows = visibleRows(table);
  // Paging and filtering preserve selection. Select-all affects visible rows.
  const ids = new Set(recordIds);
  if (recordIds.length) for (const id of state.selected) if (!ids.has(id)) { state.selected.delete(id); state.records.delete(id); }
  for (const row of rows) {
    if (!row.querySelector('.workspace-check-cell')) row.prepend(checkCell(rowId(row), `Select ${row.getAttribute('aria-label')?.replace(/^Open /, '').replace(/ profile$/, '') || rowId(row)}`));
    state.records.set(rowId(row), [...row.cells].slice(1, -1).map(td => td.textContent.trim()));
  }
  for (const row of table.tBodies[0].rows) {
    if (!rowId(row) && row.cells.length === 1) row.cells[0].colSpan = head.cells.length;
  }
  if (entity !== 'customers') {
    const fill = document.createElement('tr');
    fill.className = 'workspace-sheet-fill';
    fill.setAttribute('aria-hidden', 'true');
    for (let index = 0; index < head.cells.length; index++) fill.append(document.createElement('td'));
    table.tBodies[0].append(fill);
  }
  syncSelection(table, state);
}

function rowId(row) { return row.dataset.customerId || row.dataset.queryId || row.dataset.taskId || row.dataset.profileTaskId || row.dataset.queryTaskId; }
function visibleRows(table) { return [...table.tBodies[0].rows].filter(row => rowId(row)); }
function checkCell(id, label, header = false) {
  const cell = document.createElement(header ? 'th' : 'td');
  cell.className = 'workspace-check-cell';
  if (header) cell.scope = 'col';
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.dataset.sheetCheck = id;
  input.setAttribute('aria-label', label);
  cell.append(input);
  return cell;
}
function syncSelection(table, state) {
  for (const row of visibleRows(table)) {
    const checked = state.selected.has(rowId(row));
    row.querySelector('[data-sheet-check]').checked = checked;
    row.classList.toggle('is-selected', checked);
  }
  const all = table.querySelector('[data-sheet-check="all"]');
  const count = state.selected.size;
  const selectedOnPage = visibleRows(table).filter(row => state.selected.has(rowId(row))).length;
  all.checked = selectedOnPage > 0 && selectedOnPage === visibleRows(table).length;
  all.indeterminate = selectedOnPage > 0 && !all.checked;
  all.disabled = visibleRows(table).length === 0;
  state.bar.hidden = count === 0;
  state.bar.querySelector('[role="status"]').textContent = `${count} ${state.entity} selected`;
}

export function readLayoutPreference(module) {
  try { return localStorage.getItem(`paryatech.${module}.layout`) === 'kanban' ? 'kanban' : 'list'; }
  catch { return 'list'; }
}
export function saveLayoutPreference(module, layout) {
  try { localStorage.setItem(`paryatech.${module}.layout`, layout); } catch { /* Session remains usable without storage. */ }
}

export function initializeWorkspaceParity({ queryActions, taskActions } = {}) {
  const menu = document.createElement('div');
  menu.className = 'customer-row-action-menu workspace-row-menu';
  menu.role = 'menu';
  menu.hidden = true;
  document.body.append(menu);
  let menuTrigger = null;
  const closeMenu = (restoreFocus = false) => {
    menu.hidden = true;
    menuTrigger?.setAttribute('aria-expanded', 'false');
    if (restoreFocus) menuTrigger?.focus();
    menuTrigger = null;
  };
  document.addEventListener('click', event => {
    const trigger = event.target.closest('.row-menu[data-query-action], .row-menu[data-task-action]');
    if (!trigger) {
      if (!menu.contains(event.target)) closeMenu();
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    if (menuTrigger === trigger && !menu.hidden) { closeMenu(true); return; }
    closeMenu();
    const id = trigger.dataset.queryAction || trigger.dataset.taskAction;
    const items = (trigger.dataset.queryAction ? queryActions : taskActions)?.(id, trigger) || [];
    if (!items.length) return;
    menu.replaceChildren();
    items.forEach(item => {
      const button = document.createElement('button');
      button.type = 'button';
      button.role = 'menuitem';
      if (item.danger) button.className = 'is-danger';
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('aria-hidden', 'true');
      const use = document.createElementNS(svg.namespaceURI, 'use');
      use.setAttribute('href', `#i-${item.icon || 'file'}`);
      svg.append(use);
      button.append(svg, document.createTextNode(item.label));
      button.addEventListener('click', () => { closeMenu(); item.run(); });
      menu.append(button);
    });
    menuTrigger = trigger;
    trigger.setAttribute('aria-haspopup', 'menu');
    trigger.setAttribute('aria-expanded', 'true');
    menu.hidden = false;
    const rect = trigger.getBoundingClientRect();
    const height = menu.offsetHeight;
    menu.style.left = `${Math.max(8, Math.min(rect.right - menu.offsetWidth, innerWidth - menu.offsetWidth - 8))}px`;
    menu.style.top = `${rect.bottom + height + 6 < innerHeight ? rect.bottom + 6 : Math.max(8, rect.top - height - 6)}px`;
    menu.querySelector('button').focus();
  }, true);
  document.addEventListener('keydown', event => {
    if (menu.hidden) return;
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); closeMenu(true); return; }
    if (event.key === 'Tab') { closeMenu(); return; }
    if (!['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const buttons = [...menu.querySelectorAll('button')];
    const index = buttons.indexOf(document.activeElement);
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length;
    buttons[next].focus();
  }, true);
  window.addEventListener('resize', () => closeMenu());
  document.addEventListener('scroll', event => { if (!menu.contains(event.target)) closeMenu(); }, true);
  // Shared tab semantics, including horizontal keyboard navigation and one tab stop.
  const syncTabs = () => document.querySelectorAll('[role="tablist"]').forEach(list => {
    list.querySelectorAll('[role="tab"]').forEach(tab => {
      tab.tabIndex = tab.getAttribute('aria-selected') === 'true' ? 0 : -1;
    });
  });
  syncTabs();
  new MutationObserver(syncTabs).observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['aria-selected'] });
  document.addEventListener('keydown', event => {
      const list = event.target.closest('[role="tablist"]');
      if (!list || event.defaultPrevented) return;
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      // Existing product tab handlers keep their own state and history behavior.
      if (list.matches('.category-tabs, .detail-tabs, .customer-pipeline-tabs, #inboxFilterTabs')) return;
      const tabs = [...list.querySelectorAll('[role="tab"]')];
      if (!tabs.length) return;
      const index = tabs.indexOf(event.target.closest('[role="tab"]'));
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
      event.preventDefault();
      tabs[next].click();
      // Query detail re-renders its tabs when the selected panel changes.
      const currentList = list.isConnected ? list : [...document.querySelectorAll('[role="tablist"]')].find(candidate => candidate.getAttribute('aria-label') === list.getAttribute('aria-label') && candidate.getClientRects().length);
      const currentTab = currentList?.querySelectorAll('[role="tab"]')[next];
      currentTab?.focus();
      currentTab?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  });
  // All modal forms use the reference's contained keyboard focus.
  document.addEventListener('keydown', event => {
    if (event.key !== 'Tab') return;
    const dialogs = [...document.querySelectorAll('[aria-modal="true"]')].filter(dialog => dialog.getClientRects().length);
    const dialog = dialogs.at(-1);
    if (!dialog) return;
    const controls = [...dialog.querySelectorAll('button, input, select, textarea, a[href], [tabindex]')].filter(element => !element.disabled && element.tabIndex >= 0 && element.getClientRects().length);
    if (!controls.length) return;
    const first = controls[0], last = controls.at(-1);
    if (!dialog.contains(document.activeElement) || (!event.shiftKey && document.activeElement === last) || (event.shiftKey && document.activeElement === first)) {
      event.preventDefault();
      (event.shiftKey ? last : first).focus();
    }
  });
}
