// All paged lists use the query list's previous / current / next controls.
export function paginationMarkup(page, totalPages, totalItems, pageSize, pageKey = 'page', entityLabel = 'customers') {
  const activePage = Math.max(1, Math.min(page, totalPages));
  const firstItem = totalItems ? ((activePage - 1) * pageSize) + 1 : 0;
  const lastItem = Math.min(activePage * pageSize, totalItems);
  const previousBlocked = activePage === 1;
  const nextBlocked = activePage === totalPages;
  const navigation = (direction, blocked, icon, label) => `<button class="page-button page-button-nav${blocked ? ' is-blocked' : ''}" type="button" data-${pageKey}="${direction}" aria-label="${label}"${blocked ? ' disabled aria-disabled="true" data-pagination-blocked' : ''}><svg aria-hidden="true"><use href="#i-${icon}" /></svg></button>`;
  return `<span class="pagination-range">Showing ${firstItem}–${lastItem} of ${totalItems} ${entityLabel}</span>
    <span class="pagination-pages">
      ${navigation('prev', previousBlocked, 'chevron-left', 'Previous page')}
      <button class="page-button is-active" type="button" data-${pageKey}="${activePage}" aria-label="Page ${activePage}" aria-current="page">${activePage}</button>
      ${navigation('next', nextBlocked, 'chevron-right', 'Next page')}
    </span>`;
}

// Measure the space assigned to the table, rather than the number of records
// currently rendered. Short last pages and filters must not shrink capacity.
export function fitRows(availableHeight, headerHeight, rowHeight) {
  return Math.max(1, Math.floor((availableHeight - headerHeight + .5) / rowHeight));
}

export function observeViewportPagination(lists) {
  let frame;
  const observed = new Set();
  const resize = new ResizeObserver(schedule);
  const mutations = new MutationObserver(schedule);

  function schedule() {
    if (!frame) frame = requestAnimationFrame(update);
  }

  function update() {
    frame = null;
    const targets = new Set();
    for (const list of lists) {
      const footer = document.querySelector(list.footer);
      const scroller = document.querySelector(list.scroller);
      if (!scroller || !footer) continue;
      targets.add(scroller);
      targets.add(footer);
      const header = scroller.querySelector('thead');
      if (header) targets.add(header);
      if (!scroller.getClientRects().length || !footer.getClientRects().length || !scroller.clientHeight) continue;

      const row = scroller.querySelector(list.rowSelector);
      let rowHeight = parseFloat(getComputedStyle(scroller).getPropertyValue('--sheet-row-height'));
      if (list.rowSelector === '.vault-customer-head') {
        // Expanded document details scroll within the list without changing
        // how many customer headers belong to a page.
        if (!row) continue;
        rowHeight = row.getBoundingClientRect().height + 1;
      }
      if (!(rowHeight > 0)) continue;
      const nextSize = fitRows(scroller.clientHeight, header?.getBoundingClientRect().height || 0, rowHeight);
      const size = list.getSize();
      if (nextSize === size) continue;
      const firstRecord = (list.getPage() - 1) * size;
      list.setSize(nextSize);
      list.setPage(Math.floor(firstRecord / nextSize) + 1);
      const focusedCheckbox = scroller.contains(document.activeElement)
        ? document.activeElement.dataset.sheetCheck : undefined;
      list.render();
      // Showing bulk actions changes capacity and replaces rows. Keep keyboard
      // selection usable when that happens, including a row moving off this page.
      if (focusedCheckbox) {
        const checkbox = [...scroller.querySelectorAll('[data-sheet-check]')]
          .find(input => input.dataset.sheetCheck === focusedCheckbox)
          ?? scroller.querySelector('[data-sheet-check="all"]');
        checkbox?.focus({ preventScroll: true });
      }
      scroller.scrollTop = 0;
    }
    for (const target of observed) {
      if (!targets.has(target)) { resize.unobserve(target); observed.delete(target); }
    }
    for (const target of targets) {
      if (!observed.has(target)) { resize.observe(target); observed.add(target); }
    }
  }

  // Detail tabs recreate their tables. Filters, selection bars and navigation
  // can change the available height without a window resize.
  const root = document.querySelector('.main-content');
  mutations.observe(root, {
    subtree: true, childList: true, attributes: true, attributeFilter: ['hidden', 'class'],
  });
  root.addEventListener('click', event => {
    const button = event.target.closest('.pagination .page-button');
    if (!button || button.disabled) return;
    const footer = button.closest('.pagination');
    const list = lists.find(item => footer.matches(item.footer));
    const scroller = list && document.querySelector(list.scroller);
    if (scroller) scroller.scrollTop = 0;
  });
  window.addEventListener('resize', schedule);
  document.fonts.ready.then(schedule);
  schedule();
}
