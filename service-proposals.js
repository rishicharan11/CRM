import catalog from './data/vendor-service-catalog.json';
import { paginationMarkup } from './table-pagination.js';
import './service-proposals.css';

import { categoryFor, requirementsFor, serviceMatches, matchingProducts, productSuppliedBy, place, validDate } from './query-service-matching.js';
export { requirementsFor, serviceMatches } from './query-service-matching.js';

export function quoteBlocker(option, query, now = new Date().toISOString().slice(0, 10)) {
  if (!option || option.availability !== 'Available') return 'Confirm availability with the vendor.';
  const req = option.requirements;
  if (!req) return 'Set the query requirements.';
  const service = catalog.services.find((item) => item.id === option.serviceId);
  const connection = catalog.connections.find((item) => item.id === option.connectionId && item.serviceId === option.serviceId && item.vendorId === option.vendorId);
  const vendor = catalog.vendors.find((item) => item.id === option.vendorId);
  if (!service || !connection || connection.status === 'Draft' || vendor?.status !== 'Active' || !serviceMatches(service, query.type, option.requirements)) return 'This supplier or service is no longer eligible.';
  if (!matchingProducts(service, query.type, req).some((product) => product.id === option.productId && productSuppliedBy(product, connection))) return 'This supplier product does not match the query requirements.';
  const current = requirementsFor(query);
  for (const key of ['origin', 'destination', 'startDate', 'endDate', 'cabin', 'mealPlan', 'journeyType']) {
    if (current[key] && (key === 'origin' || key === 'destination' ? place(current[key]) !== place(req[key]) : current[key] !== req[key])) return 'The supplier quote must match the query requirements.';
  }
  for (const key of ['preferredAirlines', 'preferredProperties', 'starRatings', 'vehicles', 'routeStops', 'flightLegs']) {
    if (JSON.stringify(current[key]) !== JSON.stringify(req[key])) return 'The supplier quote must match the query requirements.';
  }
  for (const key of ['departureTime', 'returnTime', 'arrivalPort', 'accommodationType', 'roomType', 'visaType', 'nationality', 'processingSpeed', 'cruiseLine']) {
    if (current[key] && current[key] !== req[key]) return 'The supplier quote must match the query requirements.';
  }
  for (const key of ['adults', 'children', 'infants']) {
    if (query[key] !== undefined && Number(query[key]) !== Number(req[key])) return 'The supplier quote must cover all query travellers.';
  }
  if ((query.details?.rooms || query.details?.cabins) && current.rooms !== req.rooms) return 'The supplier quote must cover all query rooms or cabins.';
  if (!req.destination || !validDate(req.startDate) || req.startDate < now) return 'Set the destination and a future service date.';
  if (!['adults', 'children', 'infants', 'rooms'].every((key) => Number.isSafeInteger(req[key]) && req[key] >= (key === 'adults' || key === 'rooms' ? 1 : 0))) return 'Set valid traveller and room counts.';
  if (['Flight', 'Transport', 'Cruise'].includes(query.type) && !req.origin) return 'Set the departure point for this query.';
  if ((query.type === 'Accommodation' || (query.type === 'Flight' && req.journeyType === 'Round trip')) && !req.endDate) return 'Set the end date for this query.';
  if (req.endDate && (!validDate(req.endDate) || req.endDate < req.startDate)) return 'End date must be valid and on or after the start date.';
  if (query.type === 'Accommodation' && req.endDate === req.startDate) return 'Check-out must be after check-in.';
  if (!option.quoteReference?.trim() || !option.description?.trim()) return 'Record the supplier quote reference and product details.';
  if (!validDate(option.quotedAt) || option.quotedAt > now || !validDate(option.validUntil) || option.validUntil < now || option.validUntil < option.quotedAt) return 'Record a current, unexpired supplier quote.';
  if (!Number.isSafeInteger(option.amountMinor) || option.amountMinor <= 0) return 'Record the quoted total for all travellers.';
  return '';
}

export function serviceProposalReady(proposal, query) {
  return Boolean(proposal.serviceOptions?.length) && proposal.serviceOptions.every((option) => !quoteBlocker(option, query));
}

export function createServiceProposalWorkspace({ escapeHTML: esc, formatCurrency: money, render, create, share }) {
  const states = new Map();
  const stateFor = (query) => {
    if (!states.has(query.id)) states.set(query.id, {
      title: `${query.title} proposal`, requirements: requirementsFor(query), perspective: 'services',
      page: 1, serviceId: '', productId: '', vendorId: '', connectionId: '', tab: 'vendors', options: [], quote: {},
    });
    return states.get(query.id);
  };
  const iconFor = (category) => ({ Accommodation: 'accommodation', Flights: 'flight', Transport: 'booking', Visa: 'visa', Activities: 'target', Cruise: 'booking' })[category] || 'package';
  const icon = (name) => `<svg aria-hidden="true"><use href="#i-${name}" /></svg>`;
  const button = (action, label, value = '', primary = false, disabled = false) => `<button class="button button-${primary ? 'primary' : 'secondary'} button-small" type="button" data-service-action="${action}" data-value="${esc(value)}"${disabled ? ' disabled' : ''}>${label}</button>`;
  const field = (label, key, value, type = 'text', locked = false) => `<label class="field"><span>${label}</span><input data-service-requirement="${key}" type="${type}" value="${esc(value)}" ${locked ? 'readonly' : ''}${type === 'number' ? ` min="${key === 'adults' || key === 'rooms' ? 1 : 0}" step="1"` : ''} /></label>`;
  const quoteField = (label, key, value = '', type = 'text') => `<label class="field"><span>${label}</span><input data-service-quote="${key}" type="${type}" value="${esc(value)}"${type === 'number' ? ' min="0.01" step="0.01"' : ''} /></label>`;
  const relationships = (serviceId, query, vendorId = '', productId = '') => {
    const service = catalog.services.find((item) => item.id === serviceId);
    const products = service ? matchingProducts(service, query.type, requirementsFor(query)) : [];
    return catalog.connections.filter((connection) => connection.serviceId === serviceId && connection.status !== 'Draft'
      && (!vendorId || connection.vendorId === vendorId) && catalog.vendors.some((vendor) => vendor.id === connection.vendorId && vendor.status === 'Active')
      && products.some((product) => (!productId || product.id === productId) && productSuppliedBy(product, connection)));
  };
  const eligibleServices = (query, state) => catalog.services.filter((service) => serviceMatches(service, query.type, requirementsFor(query)) && relationships(service.id, query, state.vendorId).length);
  const empty = (title, copy) => `<div class="query-detail-empty">${icon('file')}<strong>${title}</strong><p>${copy}</p></div>`;
  const productName = (service, product) => product.name || (service.category === 'Flights'
    ? product.flightLegs.map((leg) => `${leg.origin} → ${leg.destination}`).join(' · ') : service.name);
  const nameCell = (service) => `<span class="customer-cell">${service.imageUrl ? `<img class="avatar" src="${esc(service.imageUrl)}" alt="" />` : ''}<span><button class="service-name" type="button" data-service-action="open-service" data-value="${esc(service.id)}">${esc(service.name)}</button><small class="customer-id">${esc(service.category)}</small></span></span>`;

  function directory(query, state) {
    const services = eligibleServices(query, state);
    const vendorIds = new Set(services.flatMap((service) => relationships(service.id, query).map((connection) => connection.vendorId)));
    const rows = state.perspective === 'vendors'
      ? catalog.vendors.filter((vendor) => vendorIds.has(vendor.id)) : services.flatMap((service) => matchingProducts(service, query.type, requirementsFor(query))
        .filter((product) => relationships(service.id, query, state.vendorId, product.id).length)
        .map((product) => ({ ...service, id: `${service.id}::${product.id}`, sourceId: service.id, productId: product.id, name: productName(service, product) })));
    const size = 6;
    const pages = Math.max(1, Math.ceil(rows.length / size));
    state.page = Math.max(1, Math.min(state.page, pages));
    const paged = rows.slice((state.page - 1) * size, state.page * size);
    return `<div class="service-proposal-directory">
      <nav class="query-detail-tabs service-directory-tabs" aria-label="Catalogue view">${['vendors', 'services'].map((view) => `<button class="${state.perspective === view ? 'is-active' : ''}" type="button" data-service-action="perspective" data-value="${view}">${view === 'vendors' ? 'Vendors' : 'Services'}</button>`).join('')}</nav>
      ${state.vendorId ? `<div class="service-directory-toolbar">${button('clear-vendor', 'All vendors')}</div>` : ''}
      ${paged.length ? `<div class="service-directory-scroller"><table class="workspace-data-sheet service-directory-table" aria-label="${esc(categoryFor[query.type])} ${state.perspective}"><thead><tr><th class="workspace-check-cell"></th><th>${state.perspective === 'vendors' ? 'Vendor' : 'Service'}</th><th>${state.perspective === 'vendors' ? 'Services offered' : 'Service type'}</th><th>Location</th><th>${state.perspective === 'vendors' ? 'Status' : 'Vendors'}</th><th>Action</th></tr></thead><tbody>${paged.map((row) => state.perspective === 'vendors'
        ? `<tr><td class="workspace-check-cell"></td><td><span class="customer-cell"><span class="avatar">${esc(row.initials || row.name.slice(0, 2))}</span><span><button class="service-name" type="button" data-service-action="vendor-services" data-value="${esc(row.id)}">${esc(row.name)}</button><small class="customer-id">${esc(row.code)}</small></span></span></td><td>${icon(iconFor(categoryFor[query.type]))} ${esc(categoryFor[query.type])}</td><td>${icon('map-pin')} ${esc(row.location)}</td><td>${esc(row.status)}</td><td>${button('vendor-services', 'Services', row.id)}</td></tr>`
        : `<tr><td class="workspace-check-cell"><input type="checkbox" aria-label="Select ${esc(row.name)}" data-service-select="${esc(row.id)}"${state.options.some((item) => item.serviceId === row.sourceId && item.productId === row.productId) ? ' checked' : ''} /></td><td>${nameCell(row)}</td><td>${icon(iconFor(row.category))} ${esc(row.category)}</td><td>${icon('map-pin')} ${esc(row.location)}</td><td>${new Set(relationships(row.sourceId, query, '', row.productId).map((item) => item.vendorId)).size}</td><td>${button('open-service', 'Select', row.id)}</td></tr>`).join('')}</tbody></table></div>` : empty('No services or vendors found', 'No service products and suppliers match the registered requirements of this query.')}
      <footer class="pagination service-directory-pagination">${paginationMarkup(state.page, pages, rows.length, size, 'service-page', state.perspective)}</footer>
    </div>`;
  }

  function requirementsMarkup(query, state) {
    const original = requirementsFor(query);
    const req = state.requirements;
    return `<div class="field-grid service-quote-requirements">
      ${['Flight', 'Transport', 'Cruise'].includes(query.type) ? field('From', 'origin', req.origin, 'text', Boolean(original.origin)) : ''}
      ${field(query.type === 'Visa' ? 'Country' : 'Destination', 'destination', req.destination, 'text', Boolean(original.destination))}
      ${field(query.type === 'Accommodation' ? 'Check-in' : 'Service date', 'startDate', req.startDate, 'date', Boolean(original.startDate))}
      ${query.type !== 'Visa' ? field(query.type === 'Accommodation' ? 'Check-out' : 'Return / end date', 'endDate', req.endDate, 'date', Boolean(original.endDate)) : ''}
      ${field('Adults', 'adults', req.adults, 'number', query.adults !== undefined)}${field('Children', 'children', req.children, 'number', query.children !== undefined)}${field('Infants', 'infants', req.infants, 'number', query.infants !== undefined)}
      ${query.type === 'Accommodation' || query.type === 'Cruise' ? field(query.type === 'Cruise' ? 'Cabins' : 'Rooms', 'rooms', req.rooms, 'number', Boolean(query.details?.rooms || query.details?.cabins)) : ''}
      ${query.type === 'Flight' || query.type === 'Cruise' ? field('Cabin', 'cabin', req.cabin, 'text', Boolean(original.cabin)) : ''}
      ${query.type === 'Accommodation' ? field('Meal plan', 'mealPlan', req.mealPlan, 'text', Boolean(original.mealPlan)) : ''}
    </div>`;
  }

  function serviceDetail(query, state) {
    const service = catalog.services.find((item) => item.id === state.serviceId);
    const product = service && matchingProducts(service, query.type, requirementsFor(query)).find((item) => item.id === state.productId);
    if (!service || !product) return directory(query, state);
    const connections = relationships(service.id, query, state.vendorId, state.productId);
    const connection = connections.find((item) => item.id === state.connectionId);
    const quote = state.quote;
    return `<section class="query-detail-section service-product-detail"><header><div><h2>${esc(productName(service, product))}</h2><p>${esc(service.location)} · ${esc(service.serviceId.toUpperCase())} · ${esc(service.category)}</p></div>${button('directory', 'All services')}</header>
      <nav class="query-detail-tabs service-directory-tabs" aria-label="Service details">${[['overview', 'Overview'], ['vendors', 'Vendors'], ['test-rate', 'Test rate'], ['policies', 'Policies']].map(([tab, label]) => `<button class="${state.tab === tab ? 'is-active' : ''}" type="button" data-service-action="detail-tab" data-value="${tab}">${label}</button>`).join('')}</nav>
      ${state.tab === 'overview' ? `<div class="service-product-copy"><p>${esc(service.description || service.name)}</p><dl><dt>Base location</dt><dd>${esc(service.location)}</dd><dt>Service type</dt><dd>${esc(service.category)}</dd><dt>Vendor coverage</dt><dd>${new Set(connections.map((item) => item.vendorId)).size}</dd></dl></div>`
        : state.tab === 'policies' ? `<div class="service-product-copy"><h3>Inclusions</h3>${service.inclusions.length ? `<ul>${service.inclusions.map((text) => `<li>${esc(text)}</li>`).join('')}</ul>` : '<p>Confirm inclusions with the supplier.</p>'}<h3>Exclusions</h3>${service.exclusions.length ? `<ul>${service.exclusions.map((text) => `<li>${esc(text)}</li>`).join('')}</ul>` : '<p>Confirm exclusions with the supplier.</p>'}</div>`
          : `${state.tab === 'vendors' || !connection ? `<div class="customer-pipeline-table-wrap"><table class="customer-pipeline-table service-supplier-table" aria-label="Suppliers for ${esc(service.name)}"><thead><tr><th>Vendor</th><th>Supplier type</th><th>Products covered</th><th>Rate card / validity</th><th>Action</th></tr></thead><tbody>${connections.map((item) => `<tr><td><strong>${esc(catalog.vendors.find((vendor) => vendor.id === item.vendorId)?.name)}</strong></td><td>${esc(item.supplierType || 'Vendor')}</td><td>${esc(item.productsCovered)}</td><td><strong>${esc(item.rateCardName)}</strong><small>${esc(item.validity || 'Confirm with supplier')}</small></td><td>${button('quote', 'Select vendor', item.id)}</td></tr>`).join('')}</tbody></table></div>` : ''}
          ${state.tab === 'test-rate' && connection ? `<form id="serviceSupplierQuote" class="service-supplier-quote"><h3>${esc(catalog.vendors.find((vendor) => vendor.id === connection.vendorId)?.name)} · ${esc(service.name)}</h3>${requirementsMarkup(query, state)}
            <div class="field-grid"><label class="field"><span>Product details</span><input data-service-quote="description" value="${esc(quote.description || '')}" placeholder="${query.type === 'Flight' ? 'Airline, flight number, times, cabin and baggage' : query.type === 'Accommodation' ? 'Room category, meal plan and room count' : 'Product and inclusions quoted by the supplier'}" /></label><label class="field"><span>Availability</span><select data-service-quote="availability"><option${quote.availability !== 'Available' && quote.availability !== 'Unavailable' ? ' selected' : ''}>Pending confirmation</option><option${quote.availability === 'Available' ? ' selected' : ''}>Available</option><option${quote.availability === 'Unavailable' ? ' selected' : ''}>Unavailable</option></select></label>
            ${quoteField('Supplier quote reference', 'quoteReference', quote.quoteReference)}${quoteField('Quote received', 'quotedAt', quote.quotedAt, 'date')}${quoteField('Quote valid until', 'validUntil', quote.validUntil, 'date')}${quoteField('Total quoted amount (₹)', 'amount', quote.amount, 'number')}</div>
            <p class="service-quote-note">The quote must cover these dates and all travellers. Catalogue rates do not confirm availability.</p><p class="service-quote-error" role="status">${esc(state.error || '')}</p><div class="service-quote-actions"><button class="button button-primary button-small" type="submit">Add option</button></div>
          </form>` : ''}`}
    </section>`;
  }

  function optionTable(options, query, removable = false) {
    return `<div class="customer-pipeline-table-wrap"><table class="customer-pipeline-table" aria-label="Proposal service options"><thead><tr><th>Service</th><th>Vendor</th><th>Product details</th><th>Availability</th><th>Amount</th>${removable ? '<th>Action</th>' : ''}</tr></thead><tbody>${options.map((option) => `<tr><td><strong>${esc(option.serviceName)}</strong><small>${esc(option.location)}</small></td><td>${esc(option.vendorName)}</td><td><strong>${esc(option.description || option.productsCovered)}</strong><small>${esc([option.requirements.origin, option.requirements.destination].filter(Boolean).join(' → '))} · ${esc(option.requirements.startDate || 'Date not set')}${option.requirements.endDate ? `–${esc(option.requirements.endDate)}` : ''}</small></td><td>${esc(option.availability === 'Available' && quoteBlocker(option, query) ? 'Reconfirm quote' : option.availability)}${option.validUntil ? `<small>Quote valid until ${esc(option.validUntil)}</small>` : ''}</td><td class="pipeline-money">${option.amountMinor ? money(option.amountMinor / 100) : 'Not quoted'}</td>${removable ? `<td>${button('remove-option', 'Remove', option.id)}</td>` : ''}</tr>`).join('')}</tbody></table></div>`;
  }

  function markup(query, customer, view, proposal) {
    if (view === 'builder' && proposal?.serviceOptions) {
      const ready = serviceProposalReady(proposal, query);
      return `<section class="query-detail-section"><header><div><h2>${esc(proposal.title)}</h2><p>${esc(customer.name)} · ${esc(query.type)} · ${esc(proposal.status)}</p></div>${button('list', 'All proposals')}</header>${optionTable(proposal.serviceOptions, query)}<footer class="service-proposal-actions">${button('edit-proposal', 'Edit options', proposal.id)}${button('share', 'Share in Communication', proposal.id, true, !ready)}</footer>${!ready ? '<p class="service-quote-note">Confirm a current supplier quote for each option before sharing.</p>' : ''}</section>`;
    }
    const state = stateFor(query);
    return `<section class="query-detail-section service-proposal-creator"><header><div><h2>Build proposal</h2><p>${esc(customer.name)} · ${esc(query.type)}</p></div>${button('list', 'All proposals')}</header>
      <div class="service-proposal-title"><label class="field"><span>Proposal title</span><input data-service-title value="${esc(state.title)}" required /></label></div>
      ${state.serviceId ? serviceDetail(query, state) : directory(query, state)}
      ${state.options.length ? `<section class="service-selected-options"><header><h3>Selected options (${state.options.length})</h3></header>${optionTable(state.options, query, true)}</section>` : ''}
      <footer class="service-proposal-actions"><span>${state.options.length} ${state.options.length === 1 ? 'option' : 'options'} selected</span>${button('save', state.editId ? 'Save changes' : 'Create proposal', '', true, !state.options.length || !state.title.trim())}</footer>
    </section>`;
  }

  function handle(event, query, customer) {
    const target = event.target;
    const state = stateFor(query);
    const actionButton = target.closest?.('[data-service-action]');
    const pageButton = target.closest?.('[data-service-page]');
    if (event.type === 'click' && (actionButton || pageButton)) {
      event.preventDefault();
      if (pageButton) { state.page += pageButton.dataset.servicePage === 'next' ? 1 : pageButton.dataset.servicePage === 'prev' ? -1 : 0; render(); return true; }
      const { serviceAction: action, value } = actionButton.dataset;
      if (action === 'list') { render('list'); return true; }
      if (action === 'share') { share(value); return true; }
      if (action === 'perspective') { state.perspective = value; state.page = 1; state.vendorId = ''; }
      if (action === 'vendor-services') { state.vendorId = value; state.perspective = 'services'; state.page = 1; }
      if (action === 'clear-vendor') state.vendorId = '';
      if (action === 'directory') { state.serviceId = ''; state.connectionId = ''; state.error = ''; }
      if (action === 'open-service') { [state.serviceId, state.productId] = value.split('::'); state.connectionId = ''; state.tab = 'vendors'; state.error = ''; }
      if (action === 'detail-tab') state.tab = value;
      if (action === 'quote') {
        state.connectionId = value;
        state.tab = 'test-rate';
        const previous = state.options.find((option) => option.connectionId === value && option.productId === state.productId);
        state.quote = previous ? { ...previous, amount: previous.amountMinor ? previous.amountMinor / 100 : '' } : { availability: 'Pending confirmation' };
        if (previous) state.requirements = { ...previous.requirements };
        state.error = '';
      }
      if (action === 'remove-option') state.options = state.options.filter((option) => option.id !== value);
      if (action === 'edit-proposal') {
        const proposal = create(null, value);
        if (!proposal?.serviceOptions) return true;
        state.options = structuredClone(proposal.serviceOptions); state.title = proposal.title; state.editId = proposal.id; state.serviceId = ''; render('create'); return true;
      }
      if (action === 'save') {
        if (!state.options.length || !state.title.trim()) return true;
        create({ title: state.title.trim(), options: structuredClone(state.options), editId: state.editId || null });
        states.delete(query.id); return true;
      }
      render();
      if (action === 'quote') document.querySelector('#serviceSupplierQuote')?.scrollIntoView({ block: 'nearest' });
      return true;
    }
    if (event.type === 'change' && target.hasAttribute('data-service-select')) {
      const [serviceId, productId] = target.dataset.serviceSelect.split('::');
      if (!target.checked) { state.options = state.options.filter((option) => option.serviceId !== serviceId || option.productId !== productId); render(); return true; }
      state.serviceId = serviceId; state.productId = productId; state.connectionId = ''; state.tab = 'vendors'; render(); return true;
    }
    if (['input', 'change'].includes(event.type)) {
      if (target.hasAttribute('data-service-title')) {
        state.title = target.value;
        document.querySelector('[data-service-action="save"]')?.toggleAttribute('disabled', !state.title.trim() || !state.options.length); return true;
      }
      if (target.dataset.serviceRequirement) { state.requirements[target.dataset.serviceRequirement] = target.type === 'number' ? Number(target.value) : target.value; state.error = ''; return true; }
      if (target.dataset.serviceQuote) { state.quote[target.dataset.serviceQuote] = target.value; state.error = ''; return true; }
    }
    if (event.type === 'submit' && target.id === 'serviceSupplierQuote') {
      event.preventDefault();
      const service = catalog.services.find((item) => item.id === state.serviceId);
      const connection = relationships(state.serviceId, query, state.vendorId, state.productId).find((item) => item.id === state.connectionId);
      if (!service || !connection) return true;
      const product = matchingProducts(service, query.type, requirementsFor(query)).find((item) => item.id === state.productId && productSuppliedBy(item, connection));
      if (!product) { state.error = 'No services or vendors found for the registered requirements.'; render(); return true; }
      const vendor = catalog.vendors.find((item) => item.id === connection.vendorId);
      const amount = state.quote.amount ? Number(state.quote.amount) * 100 : 0;
      const option = { ...state.quote, id: `${connection.id}::${product.id}`, serviceId: service.id, catalogServiceId: service.serviceId, connectionId: connection.id,
        productId: product.id, vendorId: vendor.id, serviceName: productName(service, product), vendorName: vendor.name, category: service.category, location: service.location,
        productsCovered: connection.productsCovered, rateCardId: connection.rateCardId, rateCardName: connection.rateCardName,
        amountMinor: Math.round(amount), requirements: { ...state.requirements }, inclusions: service.inclusions, exclusions: service.exclusions };
      state.error = option.availability === 'Unavailable' ? 'Choose an available option or wait for confirmation.'
        : option.availability === 'Available' ? quoteBlocker(option, query) : '';
      if (state.error || (state.quote.amount && (!Number.isFinite(amount) || amount <= 0))) { state.error ||= 'Enter a valid quoted amount.'; render(); return true; }
      state.options = [...state.options.filter((item) => item.id !== option.id), option]; state.serviceId = ''; state.connectionId = ''; render(); return true;
    }
    return false;
  }
  return { markup, handle, reset: (query) => states.delete(query.id) };
}
