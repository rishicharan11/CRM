import reference from './data/report-reference.json';
import { buildReport, presetRange, validRange, dateLabel, currency, GROUPS } from './reports-model.js';
import { REPORT_TEMPLATES, DEFAULT_BRAND } from './reports-config.js';
import { ChartCard, AreaChart, BarChart, DonutChart, AgeingChart, Sparkline, mountReportCharts } from './reports-charts.js';

const logo=new URL('./assets/paryatech-lockup.png',import.meta.url).href;
const escape=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const icon=name=>`<svg aria-hidden="true"><use href="#i-${name}" /></svg>`;
const storage={read:(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))??fallback;}catch{return fallback;}},write:(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));}catch{}}};
const presets=[['today','Today'],['yesterday','Yesterday'],['last7','Last 7 days'],['lastWeek','Last week'],['last30','Last 30 days'],['thisMonth','This month'],['lastMonth','Last month'],['all','Year to date'],['custom','Custom dates']];
const tabs=[['overview','Overview'],['sales','Sales & customers'],['operations','Operations'],['finance','Finance'],['directory','KPI directory']];
export function createReportsPage({root,getData,onNavigate,onMobileNav,onToast,onRefresh}) {
  let saved=storage.read('paryatech.reports.period',{});
  let preset=presets.some(([id])=>id===saved.preset)?saved.preset:'last30';
  let range=preset==='custom'&&validRange(saved.range)?saved.range:presetRange(preset);
  let activeTab='overview',compare=true,report,drillMetric=null,drillPage=1,disposeCharts=()=>{};
  const storedBrand=storage.read('paryatech.reports.brand',{});
  let brand={...DEFAULT_BRAND,...Object.fromEntries(Object.keys(DEFAULT_BRAND).filter(key=>typeof storedBrand[key]==='string').map(key=>[key,storedBrand[key]]))};
  if(!/^#[\da-f]{6}$/i.test(brand.accent))brand.accent=DEFAULT_BRAND.accent;
  if(brand.logo&&!/^data:image\/(png|jpeg|webp);base64,/.test(brand.logo))brand.logo='';
  const storedConfig=storage.read('paryatech.reports.document',{});
  let config={template:REPORT_TEMPLATES[storedConfig.template]?storedConfig.template:'executive',title:typeof storedConfig.title==='string'?storedConfig.title:'Business overview',sections:GROUPS.map(group=>group.id),definitions:Boolean(storedConfig.definitions)};
  if(Array.isArray(storedConfig.sections)&&storedConfig.sections.some(id=>GROUPS.some(group=>group.id===id)))config.sections=storedConfig.sections.filter(id=>GROUPS.some(group=>group.id===id));
  root.classList.add('reports-view');
  root.innerHTML=`<header class="reports-page-head"><div class="reports-heading"><button class="shell-icon reports-mobile-nav" type="button" aria-label="Open navigation" aria-controls="primarySidebar" aria-expanded="false">${icon('menu')}</button><div><h1>Reports</h1><p>Performance, work and financial health in one place.</p></div></div><div class="reports-header-actions"><button class="button button-secondary button-icon" id="reportsRefresh" type="button" aria-label="Refresh report">${icon('refresh')}</button><button class="button button-secondary" id="reportsPrint" type="button">${icon('print')}<span>Print</span></button><button class="button button-secondary" id="reportsBranding" type="button">${icon('settings')}<span>Company template</span></button><button class="button button-primary" id="reportsDownload" type="button">${icon('download')}<span>Download report</span></button></div></header>
    <form class="reports-period-bar" id="reportsPeriodForm"><label class="reports-preset"><span>Report period</span><select id="reportsPreset" aria-label="Report period">${presets.map(([id,label])=>`<option value="${id}"${id===preset?' selected':''}>${label}</option>`).join('')}</select></label><label><span>From</span><input id="reportsStart" type="date" value="${range.start}" required aria-label="Report start date"></label><span class="reports-date-arrow" aria-hidden="true">${icon('chevron-right')}</span><label><span>To</span><input id="reportsEnd" type="date" value="${range.end}" required aria-label="Report end date"></label><button class="button button-secondary" type="submit">Apply dates</button><label class="reports-compare"><input id="reportsCompare" type="checkbox" checked><span>Compare previous period</span></label><p class="reports-period-error" id="reportsPeriodError" role="alert" hidden></p></form>
    <div class="reports-scope"><span>${icon('booking')}<strong id="reportsPeriodLabel"></strong></span><button class="reports-text-button" id="reportsSources" type="button">${icon('info')}<span>Local demo data · View report basis</span></button></div>
    <nav class="reports-tabs" role="tablist" aria-label="Report sections">${tabs.map(([id,label])=>`<button type="button" role="tab" id="report-tab-${id}" aria-controls="reportsContent" aria-selected="${id===activeTab}" tabindex="${id===activeTab?0:-1}" data-report-tab="${id}">${label}</button>`).join('')}</nav><div id="reportsContent" role="tabpanel" aria-label="Report content"></div>
    <footer class="reports-page-footer"><span id="reportsUpdated"></span><span>INR · Inclusive dates · Local calendar</span></footer>`;
  const $=selector=>root.querySelector(selector);
  const dialogs=document.createElement('div');dialogs.innerHTML=`
    <dialog class="reports-dialog reports-drill-dialog" id="reportDrillDialog" aria-modal="true" aria-labelledby="reportDrillTitle"><header><div><span class="reports-eyebrow">Supporting records</span><h2 id="reportDrillTitle"></h2></div><button class="shell-icon" type="button" data-close-dialog aria-label="Close KPI details">${icon('x')}</button></header><div class="reports-dialog-body" id="reportDrillBody"></div><footer><p id="reportDrillRange"></p><div id="reportDrillPager"></div></footer></dialog>
    <dialog class="reports-dialog reports-source-dialog" id="reportSourceDialog" aria-modal="true" aria-labelledby="reportSourceTitle"><header><h2 id="reportSourceTitle">What this report includes</h2><button class="shell-icon" type="button" data-close-dialog aria-label="Close report basis">${icon('x')}</button></header><div class="reports-dialog-body" id="reportSourceBody"></div><footer><button class="button button-primary" type="button" data-close-dialog>Got it</button></footer></dialog>
    <dialog class="reports-dialog reports-export-dialog" id="reportExportDialog" aria-modal="true" aria-labelledby="reportExportTitle"><header><div><span class="reports-eyebrow">Company documents</span><h2 id="reportExportTitle">Prepare your report</h2></div><button class="shell-icon" type="button" data-close-dialog aria-label="Close report export">${icon('x')}</button></header><form id="reportExportForm"><div class="reports-export-body"><div class="reports-export-settings">
      <fieldset class="reports-template-picker"><legend>Document template</legend>${Object.entries(REPORT_TEMPLATES).map(([id,template])=>`<label><input type="radio" name="template" value="${id}"${config.template===id?' checked':''}><span><strong>${template.name}</strong><small>${template.description}</small></span></label>`).join('')}</fieldset>
      <label class="reports-field"><span>Report title</span><input name="title" maxlength="100" required></label>
      <details class="reports-brand-details" open><summary>Company branding</summary><div class="reports-brand-fields"><label class="reports-field"><span>Company name</span><input name="company" maxlength="64" required></label><label class="reports-field"><span>Prepared by <small>Optional</small></span><input name="preparedBy" maxlength="80" placeholder="Name or team"></label><label class="reports-field"><span>Contact details <small>Optional</small></span><textarea name="contact" maxlength="180" rows="2" placeholder="Website, email, phone or address"></textarea></label><div class="reports-logo-control"><img id="reportLogoPreview" alt="Report logo"><div><label class="button button-secondary button-small reports-logo-upload">${icon('upload')}Upload logo<input id="reportLogoFile" type="file" accept="image/png,image/jpeg,image/webp"></label><button class="reports-text-button" id="reportResetLogo" type="button">Use Paryatech logo</button><small>PNG, JPG or WebP · Up to 2 MB</small></div><label class="reports-colour"><span>Brand colour</span><input name="accent" type="color" aria-label="Brand colour"></label></div><label class="reports-field"><span>Footer</span><input name="footer" maxlength="150"></label></div></details>
      <details class="reports-section-picker"><summary>Sections to include <span id="reportSectionCount"></span></summary><div>${GROUPS.map(group=>`<label><input name="section" type="checkbox" value="${group.id}"><span>${group.title}</span></label>`).join('')}</div></details><label class="reports-export-definitions"><input name="definitions" type="checkbox"><span>Include KPI definitions</span></label><p class="reports-export-error" id="reportExportError" role="alert" hidden></p>
      </div><aside class="reports-document-preview"><span class="reports-preview-label">A4 document preview</span><div class="reports-paper" id="reportPaperPreview"></div><p>PDF includes all selected sections. Operations and Finance templates add supporting records.</p></aside></div><footer><span class="reports-export-period" id="reportExportPeriod"></span><div><button class="button button-secondary" type="button" data-export-action="save">Save template</button><button class="button button-secondary" type="button" data-export-action="csv">Export CSV</button><button class="button button-secondary" type="button" data-export-action="preview">Preview PDF</button><button class="button button-primary" type="submit" data-export-action="pdf">${icon('download')}Download PDF</button></div></footer></form></dialog>`;
  document.body.append(dialogs);
  const drill=dialogs.querySelector('#reportDrillDialog'),sourceDialog=dialogs.querySelector('#reportSourceDialog'),exportDialog=dialogs.querySelector('#reportExportDialog'),form=dialogs.querySelector('#reportExportForm');
  let returnFocus=null,editingLogo='';
  const openDialog=dialog=>{returnFocus=document.activeElement;dialog.showModal();dialog.querySelector('button, input')?.focus();};
  dialogs.querySelectorAll('dialog').forEach(dialog=>{
    dialog.addEventListener('click',event=>{if(event.target.closest('[data-close-dialog]'))dialog.close();});
    dialog.addEventListener('close',()=>{if(returnFocus?.isConnected)returnFocus.focus();});
  });
  function metricCard(metric,compact=false) {
    const periodMetric=metric.basis==='Selected period';
    const comparison=compare&&periodMetric?metric.before===0?(metric.value?'No activity in previous period':'No change from previous period'):`${metric.delta>0?'+':''}${metric.unit==='money'?currency(metric.delta):metric.unit==='percent'?metric.delta.toFixed(1)+' pp':metric.delta.toLocaleString('en-IN')} vs previous period`:periodMetric?metric.dateBasis:metric.source;
    const sparkValues=compact&&periodMetric?report.trend.map(bin=>metric.id==='finance-receipts'?bin.incoming:metric.id==='finance-payments'?bin.outgoing:metric.records.filter(row=>row.date>=bin.start&&row.date<=bin.end).length):null;
    return `<button class="reports-metric reports-metric-${metric.tone}${compact?' reports-strip-metric':''}" type="button" data-report-metric="${metric.id}">${compact?`<span class="reports-metric-icon">${icon(GROUPS.find(group=>group.id===metric.groupId).icon)}</span>`:''}<span class="reports-metric-top"><span>${escape(metric.label)}</span>${compact?'':icon('chevron-right')}</span><strong data-metric-id="${metric.id}">${escape(metric.formatted)}</strong><span class="reports-metric-bottom"><span class="reports-basis ${periodMetric?'is-period':''}">${periodMetric?'In period':'Snapshot'}</span><small>${escape(comparison)}</small></span>${sparkValues?Sparkline(sparkValues):''}</button>`;
  }
  function moduleSection(group) {
    return `<section class="reports-module-section" id="reports-group-${group.id}"><header><div>${icon(group.icon)}<div><h2>${group.title}</h2><p>${group.description}</p></div></div><span class="reports-source-caption">${escape(group.source)}</span></header><div class="reports-metric-grid">${group.metrics.map(metric=>metricCard(metric)).join('')}</div><button class="reports-text-button reports-record-link" type="button" data-report-register="${group.id}">View ${['proposals','finance','customerLedger','vouchers'].includes(group.id)?'period records':'current register'} ${icon('chevron-right')}</button>${(group.relatedRegisters||[]).map((register,index)=>`<button class="reports-text-button reports-record-link" type="button" data-report-related="${group.id}:${index}">${register.title} ${icon('chevron-right')}</button>`).join('')}</section>`;
  }
  function overview() {
    const lookup=id=>report.metrics.find(metric=>metric.id===id),periodMetrics=report.overviewIds.slice(0,4).map(lookup),snapshots=report.overviewIds.slice(4).map(lookup);
    const cashSummary=`<div class="reports-chart-summary"><span>Recorded receipts · Selected period</span><div><strong>${lookup('finance-receipts').formatted}</strong>${compare?`<span class="reports-chart-comparison">${escape(lookup('finance-receipts').before===0?'No receipts in previous period':currency(lookup('finance-receipts').delta)+' vs previous period')}</span>`:''}</div></div>`;
    const action=area=>`<button class="reports-text-button" type="button" data-report-switch="${area}">View ${area} ${icon('chevron-right')}</button>`;
    const cash=ChartCard({id:'report-cash',title:'Recorded cash movements',description:'Dated activity · INR · Transfers excluded',action:action('finance'),summary:cashSummary,chart:AreaChart({data:report.trend,label:'Recorded receipts and outgoing by date'})});
    const pipeline=ChartCard({id:'report-pipeline',title:'Sales pipeline',description:'Current query counts by stage · All service types',action:action('sales'),chart:BarChart({data:report.pipeline.map(stage=>({label:stage.status,value:stage.count})),label:'Current sales pipeline'}),footer:`<div class="reports-panel-foot"><span>Open pipeline value</span><strong>${lookup('pipeline-value').formatted}</strong></div>`});
    const mix=ChartCard({id:'report-customer-mix',title:'Customers by category',description:'Share of current customer records',chart:DonutChart({data:report.chartData.customerMix,label:'Current customer category mix',caption:'Customers'})});
    const ageing=ChartCard({id:'report-ageing',title:'Collections ageing',description:'Outstanding at '+dateLabel(reference.finance.REVIEW_DATE)+' · INR',chart:AgeingChart({data:report.chartData.collectionsAgeing,series:report.chartData.ageingSeries,label:'Agency receivables aged at the Finance source date'}),footer:`<div class="reports-panel-foot"><span>Agency receivables</span><strong>${lookup('finance-receivables').formatted}</strong></div>`});
    return `<section class="reports-summary-section"><div class="reports-section-title"><h2>Activity in the selected period</h2><span>${compare?'Compared with '+dateLabel(report.previous.start)+' – '+dateLabel(report.previous.end):'Period activity'}</span></div><div class="reports-metric-grid reports-kpi-strip">${periodMetrics.map(metric=>metricCard(metric,true)).join('')}</div></section>
      <section class="reports-summary-section"><div class="reports-section-title"><h2>Workspace health</h2><span>Current records · Source dates shown in KPI details</span></div><div class="reports-metric-grid reports-kpi-strip">${snapshots.map(metric=>metricCard(metric,true)).join('')}</div></section>
      <div class="reports-dashboard-columns"><div class="reports-dashboard-main">${cash}${pipeline}</div><aside class="reports-dashboard-rail" aria-label="Customer mix and collections">${mix}${ageing}</aside></div>
      <section class="reports-panel reports-attention"><header><div><h2>Needs attention</h2><p>Work that keeps the next step moving</p></div><span class="reports-count">${report.alerts.length} queues</span></header><div>${report.alerts.length?report.alerts.map(alert=>`<button class="reports-attention-row" type="button" data-report-metric="${alert.metric.id}"><span class="reports-alert-icon ${alert.tone}">${icon('alert')}</span><span><strong>${alert.title}</strong><small>${alert.action}</small></span><span class="reports-alert-value">${alert.metric.formatted}</span>${icon('chevron-right')}</button>`).join(''):'<p class="reports-empty">No attention queues in the available records.</p>'}</div></section>
      <section class="reports-summary-section"><div class="reports-section-title"><h2>Across your workspace</h2><span>${report.metrics.length} available indicators · ${report.groups.length} reporting areas</span></div><div class="reports-module-grid">${report.groups.map(group=>`<button class="reports-module-card" type="button" data-report-group="${group.id}">${icon(group.icon)}<span><strong>${group.title}</strong><small>${group.metrics.slice(0,2).map(metric=>`${metric.formatted} ${metric.label.toLowerCase()}`).join(' · ')}</small></span>${icon('chevron-right')}</button>`).join('')}</div></section>`;
  }
  function directoryRows(query='',filter='all') {
    const match=(label,description,groupId)=>(filter==='all'||filter===groupId)&&`${label} ${description} ${groupId}`.toLowerCase().includes(query.toLowerCase());
    const available=report.metrics.filter(metric=>match(metric.label,metric.description,metric.groupId));
    const unavailable=report.unavailable.filter(metric=>match(metric.label,metric.description,metric.groupId));
    $('#reportsDirectoryCount').textContent=`${available.length} available · ${unavailable.length} awaiting data`;
    return available.map(metric=>`<tr><td><button class="reports-text-button" type="button" data-report-metric="${metric.id}">${escape(metric.label)}</button><small>${GROUPS.find(group=>group.id===metric.groupId).title}</small></td><td><span class="reports-basis ${metric.basis==='Selected period'?'is-period':''}">${metric.basis}</span><small>${escape(metric.dateBasis)}</small></td><td>${escape(metric.description)}</td><td>${escape(metric.source)}</td><td><strong>${metric.formatted}</strong></td></tr>`).join('')+unavailable.map(metric=>`<tr class="reports-unavailable"><td>${escape(metric.label)}<small>${GROUPS.find(group=>group.id===metric.groupId).title}</small></td><td><span class="reports-basis">Awaiting data</span></td><td>${escape(metric.description)}</td><td>Not measured</td><td>—</td></tr>`).join('')||'<tr><td colspan="5" class="reports-empty">No indicators match your search.</td></tr>';
  }
  function content() {
    disposeCharts();
    $('#reportsContent').setAttribute('aria-labelledby','report-tab-'+activeTab);
    $('#reportsPeriodLabel').textContent=`${dateLabel(range.start)} – ${dateLabel(range.end)}`;
    $('#reportsUpdated').textContent=`Updated ${new Date(report.generatedAt).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})}`;
    root.querySelectorAll('[data-report-tab]').forEach(button=>{button.setAttribute('aria-selected',String(button.dataset.reportTab===activeTab));button.tabIndex=button.dataset.reportTab===activeTab?0:-1;});
    if(activeTab==='overview')$('#reportsContent').innerHTML=overview();
    else if(activeTab==='directory'){
      $('#reportsContent').innerHTML=`<section class="reports-directory"><div class="reports-directory-heading"><div><h2>What the application tracks</h2><p>Definitions, date basis and source for every report indicator.</p></div><span id="reportsDirectoryCount"></span></div><div class="reports-directory-controls"><label class="search-field">${icon('search')}<input id="reportsKpiSearch" type="search" placeholder="Search KPIs or definitions" aria-label="Search KPI directory"></label><select id="reportsKpiGroup" aria-label="Filter KPI module"><option value="all">All modules</option>${GROUPS.map(group=>`<option value="${group.id}">${group.title}</option>`).join('')}</select></div><div class="reports-table-scroll"><table class="reports-directory-table"><thead><tr><th>Indicator</th><th>Date basis</th><th>Definition</th><th>Source</th><th>Value</th></tr></thead><tbody id="reportsDirectoryRows"></tbody></table></div></section>`;
      $('#reportsDirectoryRows').innerHTML=directoryRows();
    }else $('#reportsContent').innerHTML=`<div class="reports-area-intro"><h2>${tabs.find(([id])=>id===activeTab)[1]}</h2><p>Period activity and source-dated snapshots. Select any indicator to inspect the supporting records.</p></div>${report.groups.filter(group=>group.area===activeTab).map(moduleSection).join('')}`;
    disposeCharts=mountReportCharts($('#reportsContent'));
  }
  function render() {report=buildReport({...getData(),reference},range);content();}
  function setTab(tab){activeTab=tab;content();root.closest('main')?.scrollTo({top:0,behavior:'instant'});}
  function sourceBasis(){
    dialogs.querySelector('#reportSourceBody').innerHTML=`<div class="reports-source-note"><strong>Period activity and snapshots</strong><p>A date range filters dated activity. Snapshot indicators reflect current records or the date of their source snapshot.</p></div><dl class="reports-source-list"><div><dt>Customer workspace</dt><dd>Customers, queries, proposals, tasks, inbox, documents, vouchers and CRM ledger records. Refreshed when you open this page or use Refresh.</dd></div><div><dt>Finalized module sample</dt><dd>Packages, catalogue proposals, bookings, vendors, services and rate cards. Local sample captured ${escape(new Date(reference.capturedAt).toLocaleString('en-GB'))}.</dd></div><div><dt>Agency Finance source date</dt><dd>${dateLabel(reference.finance.REVIEW_DATE)}. Financial balances and controls retain this date; they are not historical balances for your chosen report period.</dd></div></dl>${report.notes.map(note=>`<p>${escape(note)}</p>`).join('')}<p>KPIs without sufficient timestamps or financial history are listed as awaiting data in the KPI directory.</p>`;
    openDialog(sourceDialog);
  }
  function drillRows(){
    const records=drillMetric.records,start=(drillPage-1)*12,shown=records.slice(start,start+12);
    dialogs.querySelector('#reportDrillTitle').textContent=drillMetric.label;
    dialogs.querySelector('#reportDrillBody').innerHTML=`<div class="reports-drill-summary"><strong>${escape(drillMetric.formatted)}</strong><span class="reports-basis">${escape(drillMetric.basis)}</span><p>${escape(drillMetric.description)}</p><small>${escape(drillMetric.source)} · ${escape(drillMetric.dateBasis)}</small></div>${records.length?`<div class="reports-table-scroll"><table class="reports-record-table"><thead><tr><th>Record</th><th>State</th><th>Record date</th><th>Amount</th><th>Action</th></tr></thead><tbody>${shown.map((row,index)=>`<tr><td><strong>${escape(row.title)}</strong><small>${escape(row.id)}</small></td><td>${escape(row.status||'—')}</td><td>${row.date?dateLabel(row.date):'Not recorded'}</td><td>${row.amount?currency(row.amount):'—'}</td><td><button class="button button-secondary button-small" type="button" data-report-record="${start+index}">${['customer','query','task','inbox','document'].includes(row.kind)?'Open':'Details'}</button></td></tr>`).join('')}</tbody></table></div>`:'<p class="reports-empty">No individual records in this indicator. The definition above explains the calculation or source balance.</p>'}<div id="reportRecordDetail"></div>`;
    dialogs.querySelector('#reportDrillRange').textContent=records.length?`Showing ${start+1}–${Math.min(start+12,records.length)} of ${records.length} records`:'No matching records';
    dialogs.querySelector('#reportDrillPager').innerHTML=records.length>12?`<button class="page-button" type="button" data-report-page="prev" aria-label="Previous records"${drillPage===1?' disabled':''}>${icon('chevron-left')}</button><span>${drillPage} / ${Math.ceil(records.length/12)}</span><button class="page-button" type="button" data-report-page="next" aria-label="Next records"${start+12>=records.length?' disabled':''}>${icon('chevron-right')}</button>`:'';
  }
  function openMetric(metric){drillMetric=metric;drillPage=1;drillRows();openDialog(drill);}
  function currentConfig() {
    const values=new FormData(form);
    return {template:values.get('template'),title:String(values.get('title')||'').trim(),sections:values.getAll('section'),definitions:values.has('definitions'),brand:{...brand,logo:editingLogo,company:String(values.get('company')||'').trim(),preparedBy:String(values.get('preparedBy')||'').trim(),contact:String(values.get('contact')||'').trim(),footer:String(values.get('footer')||'').trim(),accent:values.get('accent')}};
  }
  function previewPaper(){
    const draft=currentConfig();dialogs.querySelector('#reportSectionCount').textContent=draft.sections.length;
    const colour=/^#[\da-f]{6}$/i.test(draft.brand.accent)?draft.brand.accent:DEFAULT_BRAND.accent;
    const highlights=report.metrics.filter(metric=>draft.sections.includes(metric.groupId)).slice(0,4);
    dialogs.querySelector('#reportPaperPreview').style.setProperty('--report-brand',colour);
    dialogs.querySelector('#reportPaperPreview').innerHTML=`<header><img src="${escape(draft.brand.logo||logo)}" alt="Company logo"><span>${escape(draft.brand.company||'Company name')}</span></header><h3>${escape(draft.title||REPORT_TEMPLATES[draft.template].name)}</h3><p>${dateLabel(range.start)} – ${dateLabel(range.end)}</p><span class="reports-paper-template">${REPORT_TEMPLATES[draft.template].name}</span><div class="reports-paper-kpis">${highlights.map(metric=>`<div><small>${escape(metric.label)}</small><strong>${metric.formatted}</strong></div>`).join('')}</div><h4>Workspace overview</h4>${report.groups.filter(group=>draft.sections.includes(group.id)).slice(0,4).map(group=>`<div class="reports-paper-row"><span>${group.title}</span><b>${group.metrics.length} KPIs</b></div>`).join('')}<p>${draft.sections.length} sections · ${REPORT_TEMPLATES[draft.template].detailed?'Supporting records included':'Summary and priority actions'}</p><small class="reports-paper-source">Snapshot indicators retain source dates.</small><footer>${escape(draft.brand.footer)}<span>A4</span></footer>`;
    dialogs.querySelector('#reportLogoPreview').src=draft.brand.logo||logo;
  }
  function openExport(focusBrand=false){
    editingLogo=brand.logo;
    for(const key of ['company','preparedBy','contact','footer','accent'])form.elements[key].value=brand[key];
    form.elements.title.value=config.title;
    form.querySelector(`[name="template"][value="${config.template}"]`).checked=true;
    form.querySelectorAll('[name="section"]').forEach(input=>input.checked=config.sections.includes(input.value));
    form.elements.definitions.checked=config.definitions;
    dialogs.querySelector('#reportExportPeriod').textContent=`${dateLabel(range.start)} – ${dateLabel(range.end)}`;
    dialogs.querySelector('#reportExportError').hidden=true;previewPaper();openDialog(exportDialog);
    if(focusBrand)form.elements.company.focus();
  }
  async function exportAction(action){
    if(!form.reportValidity())return;
    const draft=currentConfig(),error=dialogs.querySelector('#reportExportError');error.hidden=true;
    if(!draft.sections.length){error.textContent='Choose at least one report section.';error.hidden=false;return;}
    if(!draft.title||!draft.brand.company){error.textContent='Enter a report title and company name.';error.hidden=false;return;}
    const popup=action==='preview'?window.open('','_blank'):null;
    if(action==='preview'&&!popup){error.textContent='Allow pop-ups to preview the PDF, or use Download PDF.';error.hidden=false;return;}
    config={...draft};delete config.brand;brand=draft.brand;storage.write('paryatech.reports.brand',brand);storage.write('paryatech.reports.document',config);
    if(action==='save'){exportDialog.close();onToast('Company branding and report template saved');return;}
    form.setAttribute('aria-busy','true');form.querySelectorAll('[data-export-action]').forEach(button=>button.disabled=true);
    try{
      const documents=await import('./report-document.js');
      if(action==='csv')documents.downloadReportCsv(report,draft);
      else{
        const pdf=await documents.createReportPdf(report,draft);
        if(action==='preview'){const url=URL.createObjectURL(pdf.output('blob'));popup.location.replace(url);setTimeout(()=>URL.revokeObjectURL(url),300000);}
        else documents.downloadBlob(pdf.output('blob'),documents.documentName(report,draft)+'.pdf');
      }
      onToast(action==='csv'?'Report CSV downloaded':action==='preview'?'PDF preview opened':'Branded report downloaded');
    }catch(err){popup?.close();error.textContent=err.message||'Unable to create the report. Please try again.';error.hidden=false;}
    finally{form.removeAttribute('aria-busy');form.querySelectorAll('[data-export-action]').forEach(button=>button.disabled=false);}
  }
  root.addEventListener('click',event=>{
    const tab=event.target.closest('[data-report-tab]');if(tab){setTab(tab.dataset.reportTab);return;}
    const switcher=event.target.closest('[data-report-switch]');if(switcher){setTab(switcher.dataset.reportSwitch);return;}
    const groupButton=event.target.closest('[data-report-group]');if(groupButton){const group=report.groups.find(group=>group.id===groupButton.dataset.reportGroup);setTab(group.area);document.getElementById('reports-group-'+group.id).scrollIntoView({block:'start',behavior:'smooth'});return;}
    const metric=event.target.closest('[data-report-metric]');if(metric){openMetric(report.metrics.find(item=>item.id===metric.dataset.reportMetric));return;}
    const related=event.target.closest('[data-report-related]');if(related){const [groupId,index]=related.dataset.reportRelated.split(':'),group=report.groups.find(group=>group.id===groupId),register=group.relatedRegisters[index];openMetric({label:register.title,formatted:String(register.records.length),basis:'Snapshot',description:register.description,source:group.source,dateBasis:'Source snapshot; not filtered by report period',records:register.records});return;}
    const register=event.target.closest('[data-report-register]');if(register){const group=report.groups.find(group=>group.id===register.dataset.reportRegister),periodRecords=['proposals','finance','customerLedger','vouchers'].includes(group.id);openMetric({label:group.title+' register',formatted:String(periodRecords?group.periodRecords.length:group.records.length),basis:periodRecords?'Selected period':'Snapshot',description:group.description,source:group.source,dateBasis:periodRecords?'Record date':'Current register',records:periodRecords?group.periodRecords:group.records});}
  });
  root.addEventListener('input',event=>{if(event.target.matches('#reportsKpiSearch'))$('#reportsDirectoryRows').innerHTML=directoryRows($('#reportsKpiSearch').value,$('#reportsKpiGroup').value);});
  root.addEventListener('change',event=>{
    if(event.target.matches('#reportsKpiGroup'))$('#reportsDirectoryRows').innerHTML=directoryRows($('#reportsKpiSearch').value,$('#reportsKpiGroup').value);
    if(event.target.matches('#reportsCompare')){compare=event.target.checked;content();}
    if(event.target.matches('#reportsStart,#reportsEnd')){$('#reportsPreset').value='custom';}
    if(event.target.matches('#reportsPreset')&&event.target.value!=='custom'){
      range=presetRange(event.target.value);preset=event.target.value;$('#reportsStart').value=range.start;$('#reportsEnd').value=range.end;$('#reportsPeriodError').hidden=true;storage.write('paryatech.reports.period',{preset,range});render();
    }
  });
  $('#reportsPeriodForm').addEventListener('submit',event=>{
    event.preventDefault();const next={start:$('#reportsStart').value,end:$('#reportsEnd').value};
    if(!validRange(next)){$('#reportsPeriodError').textContent='The start date must be on or before the end date.';$('#reportsPeriodError').hidden=false;return;}
    range=next;preset=$('#reportsPreset').value;$('#reportsPeriodError').hidden=true;storage.write('paryatech.reports.period',{preset,range});render();
  });
  $('#reportsRefresh').addEventListener('click',()=>onRefresh($('#reportsRefresh'),'Workspace report is up to date',render));
  $('#reportsDownload').addEventListener('click',()=>openExport());$('#reportsBranding').addEventListener('click',()=>openExport(true));$('#reportsSources').addEventListener('click',sourceBasis);
  $('.reports-mobile-nav').addEventListener('click',onMobileNav);
  $('#reportsPrint').addEventListener('click',async()=>{
    const button=$('#reportsPrint');button.disabled=true;
    try{const documents=await import('./report-document.js');await documents.printReport(report,{...config,brand});}
    catch(err){onToast(err.message||'Unable to open the printable report.');}finally{button.disabled=false;}
  });
  dialogs.addEventListener('click',event=>{
    const page=event.target.closest('[data-report-page]');if(page){drillPage+=page.dataset.reportPage==='next'?1:-1;drillRows();return;}
    const record=event.target.closest('[data-report-record]');if(record){const row=drillMetric.records[Number(record.dataset.reportRecord)];
      if(['customer','query','task','inbox','document'].includes(row.kind)){drill.close();onNavigate(row);}
      else{dialogs.querySelector('#reportRecordDetail').innerHTML=`<section class="reports-record-detail"><h3>${escape(row.title)}</h3><p>${escape(row.id)} · ${escape(row.status)}</p><dl>${Object.entries(row.details).map(([key,value])=>`<div><dt>${escape(key)}</dt><dd>${escape(value)}</dd></div>`).join('')}</dl></section>`;dialogs.querySelector('#reportRecordDetail').scrollIntoView({block:'nearest'});}return;}
    const action=event.target.closest('[data-export-action]');if(action&&action.type!=='submit')exportAction(action.dataset.exportAction);
  });
  form.addEventListener('submit',event=>{event.preventDefault();exportAction('pdf');});
  form.addEventListener('input',event=>{if(!event.target.matches('[type=file]'))previewPaper();});
  form.addEventListener('change',event=>{
    if(event.target.matches('[name=template]')){
      const template=event.target.value;form.elements.title.value=template==='executive'?'Business overview':REPORT_TEMPLATES[template].name;
      form.querySelectorAll('[name=section]').forEach(input=>input.checked=template==='executive'||template==='finance'?template==='executive'||['finance','customerLedger'].includes(input.value):!['finance','customerLedger'].includes(input.value));
    }previewPaper();
  });
  dialogs.querySelector('#reportLogoFile').addEventListener('change',async event=>{
    const file=event.target.files[0],error=dialogs.querySelector('#reportExportError');if(!file)return;error.hidden=true;
    if(file.size>2097152||!['image/png','image/jpeg','image/webp'].includes(file.type)){error.textContent='Choose a PNG, JPG or WebP logo smaller than 2 MB.';error.hidden=false;event.target.value='';return;}
    try{const url=URL.createObjectURL(file);try{editingLogo=(await (await import('./report-document.js')).logoImage(url)).data;}finally{URL.revokeObjectURL(url);}previewPaper();}
    catch{error.textContent='This image could not be read. Choose another logo.';error.hidden=false;}
  });
  dialogs.querySelector('#reportResetLogo').addEventListener('click',()=>{editingLogo='';previewPaper();});
  return {render,getReport:()=>report};
}
