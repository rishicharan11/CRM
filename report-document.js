import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import { dateLabel, currency } from './reports-model.js';
import { REPORT_TEMPLATES, DEFAULT_BRAND } from './reports-config.js';
export { REPORT_TEMPLATES, DEFAULT_BRAND } from './reports-config.js';

const defaultLogo = new URL('./assets/paryatech-lockup.png', import.meta.url).href;
const regularFont = new URL('./assets/report-fonts/PublicSans-Regular.ttf', import.meta.url).href;
const boldFont = new URL('./assets/report-fonts/PublicSans-Bold.ttf', import.meta.url).href;
const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const clean = value => String(value ?? '').replace(/[\u2010-\u2015]/g, '-').replaceAll('→', 'to');
const period = report => `${dateLabel(report.range.start)} - ${dateLabel(report.range.end)}`;
const generated = report => new Date(report.generatedAt).toLocaleString('en-GB');
export function documentName(report, config) {
  return `${config.brand.company.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'') || 'company'}-${config.template}-${report.range.start}-to-${report.range.end}`;
}
const selectedGroups = (report, config) => report.groups.filter(group => config.sections.includes(group.id));
const recordList = group => ['proposals','finance','customerLedger','vouchers'].includes(group.id) ? group.periodRecords : group.records;
function registerTable(group, records = recordList(group)) {
  let head = ['Reference','Record','State','Record date','Amount'];
  let columns = row => [row.id,row.title,row.status,row.date ? dateLabel(row.date) : 'Not recorded',row.amount ? currency(row.amount) : '-'];
  if(group.id==='customers') { head=['Reference','Customer','Category','Travellers','CRM outstanding']; columns=row=>[row.id,row.title,row.status,row.details.Travellers,row.details['CRM outstanding']]; }
  if(group.id==='queries') { head=['Reference','Query','Stage','Owner','Expected value']; columns=row=>[row.id,row.title,row.status,row.owner||'Unassigned',currency(row.amount)]; }
  if(group.id==='tasks') { head=['Reference','Task','State / priority','Owner','Due date']; columns=row=>[row.id,row.title,`${row.status} / ${row.details.Priority}`,row.owner||'Unassigned',row.details['Due date']]; }
  if(group.id==='bookings') { head=['Reference','Booking','Stage','State','Next action']; columns=row=>[row.id,row.title,row.details.Stage,row.status,row.details['Next action']]; }
  if(group.id==='inbox') { head=['Reference','Conversation','Channel','Unread messages','Awaiting reply']; columns=row=>[row.id,row.title,row.details.Channel,row.unread,row.waiting?'Yes':'No']; }
  if(group.id==='documents') { head=['Reference','Document','State','Customer / traveller','Valid until']; columns=row=>[row.id,row.title,row.status,`${row.details.Customer} / ${row.details.Traveller||'-'}`,row.details['Valid until']]; }
  if(group.id==='vendors') { head=['Reference','Vendor','State','Location','Owner']; columns=row=>[row.id,row.title,row.status,row.details.Location,row.details.Owner]; }
  if(group.title==='Supplier services') { head=['Reference','Service','Category','Location','State']; columns=row=>[row.id,row.title,row.details.Category,row.details.Location,row.status]; }
  if(group.title==='Outstanding obligations') { head=['Reference','Obligation','State','Due date','Remaining']; columns=row=>[row.id,row.title,row.status,row.details.Due,currency(row.amount)]; }
  if(group.title==='Cash forecast schedule') { head=['Reference','Scheduled movement','Basis','Date','Movement']; }
  if(group.title==='Rate cards') { head=['Reference','Rate card','State','Category','Validity']; columns=row=>[row.id,row.title,row.status,row.details.Category,row.details.Validity]; }
  if(group.title==='Supplier compliance') { head=['Reference','Document','State','Owner','Valid until']; columns=row=>[row.id,row.title,row.status,row.owner,row.details['Valid until']]; }
  if(group.title==='Vendor tasks') { head=['Reference','Task','State','Owner','Due label']; columns=row=>[row.id,row.title,row.status,row.owner,row.details['Due label']]; }
  if(group.title==='Document requests') { head=['Reference','Request','State','Types','Created']; columns=row=>[row.id,row.title,row.status,row.details.Types,row.date?dateLabel(row.date):'Not recorded']; }
  return { head, body:records.map(columns) };
}
let fonts;
async function loadFonts() {
  if (!fonts) fonts = Promise.all([regularFont,boldFont].map(async url=>{
    const response=await fetch(url); if(!response.ok) throw new Error('The report font could not be loaded. Try again.');
    const bytes=new Uint8Array(await response.arrayBuffer()); let binary='';
    for(let start=0;start<bytes.length;start+=32768) binary+=String.fromCharCode(...bytes.subarray(start,start+32768));
    return btoa(binary);
  })).catch(error=>{fonts=null;throw error;});
  return fonts;
}
export async function logoImage(source = defaultLogo) {
  const img = new Image(); img.src=source || defaultLogo;
  await img.decode();
  const width=Math.min(800,img.naturalWidth),height=Math.round(width*img.naturalHeight/img.naturalWidth);
  if(!width||!height) throw new Error('Choose a valid company logo image.');
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
  canvas.getContext('2d').drawImage(img,0,0,width,height);
  return {data:canvas.toDataURL('image/png'),ratio:width/height};
}
export async function createReportPdf(report, config) {
  const [fontData,logo] = await Promise.all([loadFonts(),logoImage(config.brand.logo || defaultLogo)]);
  const doc=new jsPDF({unit:'mm',format:'a4',compress:true});
  doc.addFileToVFS('PublicSans-Regular.ttf',fontData[0]);doc.addFont('PublicSans-Regular.ttf','ReportSans','normal');
  doc.addFileToVFS('PublicSans-Bold.ttf',fontData[1]);doc.addFont('PublicSans-Bold.ttf','ReportSans','bold');
  doc.setFont('ReportSans','normal');
  const rgb=config.brand.accent.match(/[a-f\d]{2}/gi)?.map(value=>parseInt(value,16)) || [16,111,101];
  const groups=selectedGroups(report,config),ids=new Set(groups.map(group=>group.id));
  const template=REPORT_TEMPLATES[config.template];
  const title=clean(config.title || template.name);
  doc.setProperties({title,subject:`Workspace report | ${period(report)}`,author:config.brand.company,creator:'Paryatech Reports'});
  let y=45;
  const ensure=height=>{if(y+height>272){doc.addPage();y=45;}};
  const heading=text=>{ensure(18);doc.setFont('ReportSans','bold');doc.setFontSize(13);doc.setTextColor(25,29,34);doc.text(clean(text),15,y);y+=7;};
  const paragraph=(text,size=8,color=[88,99,112])=>{
    doc.setFont('ReportSans','normal');doc.setFontSize(size);doc.setTextColor(...color);
    const lines=doc.splitTextToSize(clean(text),180);
    for(const line of lines){ensure(5);doc.text(line,15,y);y+=4.2;}y+=3;
  };
  const table=(head,body,options={})=>{
    if(!body.length){paragraph('No matching dated records in this period.');return;}
    ensure(22);
    autoTable(doc,{head:[head.map(clean)],body:body.map(row=>row.map(clean)),startY:y,theme:'grid',margin:{top:43,right:15,bottom:24,left:15},
      styles:{font:'ReportSans',fontSize:8,cellPadding:2.4,lineColor:[224,229,235],lineWidth:.15,textColor:[40,48,60],overflow:'linebreak'},
      headStyles:{fillColor:rgb,textColor:255,fontStyle:'bold'},alternateRowStyles:{fillColor:[249,250,251]},rowPageBreak:'avoid',...options});
    y=doc.lastAutoTable.finalY+8;
  };
  doc.setFont('ReportSans','bold');doc.setFontSize(22);doc.setTextColor(25,29,34);
  const titleLines=doc.splitTextToSize(title,180);doc.text(titleLines,15,y);y+=titleLines.length*9+2;
  paragraph(period(report),11,rgb);
  paragraph(`Prepared ${generated(report)}${config.brand.preparedBy?' | '+config.brand.preparedBy:''}`);
  paragraph('Local demo workspace. Period activity is filtered by the dates above; snapshot indicators retain their source date.');
  const highlights=report.overviewIds.map(id=>report.metrics.find(metric=>metric.id===id)).filter(metric=>ids.has(metric.groupId)).slice(0,8);
  for(let index=0;index<highlights.length;index+=2){
    ensure(29);
    highlights.slice(index,index+2).forEach((metric,column)=>{
      const x=15+column*92;doc.setFillColor(247,250,249);doc.setDrawColor(223,230,232);doc.roundedRect(x,y,88,25,2,2,'FD');
      doc.setFont('ReportSans','normal');doc.setFontSize(8);doc.setTextColor(88,99,112);doc.text(clean(metric.label),x+4,y+6);
      doc.setFont('ReportSans','bold');doc.setFontSize(16);doc.setTextColor(...rgb);doc.text(clean(metric.formatted),x+4,y+14);
      doc.setFont('ReportSans','normal');doc.setFontSize(7);doc.setTextColor(88,99,112);doc.text(metric.basis,x+4,y+21);
    });y+=29;
  }
  const alerts=report.alerts.filter(alert=>ids.has(alert.metric.groupId));
  if(alerts.length){heading('Priority actions');table(['Action','Indicator','Next step'],alerts.map(alert=>[alert.title,alert.metric.formatted,alert.action]),{columnStyles:{0:{cellWidth:46},1:{cellWidth:31},2:{cellWidth:103}}});}
  for(const group of groups){
    ensure(40);heading(group.title);paragraph(group.source);
    table(['Indicator','Value','Basis'],group.metrics.map(metric=>[metric.label,metric.formatted,metric.basis]),{columnStyles:{0:{cellWidth:89},1:{cellWidth:41},2:{cellWidth:50}}});
    if(template.detailed){
      heading(`${group.title} - supporting records`);
      paragraph(['proposals','finance','customerLedger','vouchers'].includes(group.id)?'Dated records in the selected period.':'Current snapshot register. Dates below are record dates, where available.');
      const register=registerTable(group);
      const widths=group.id==='bookings'?[30,50,23,27,50]:[30,60,29,32,29];
      table(register.head,register.body,
        {styles:{font:'ReportSans',fontSize:7.5,cellPadding:2.2,overflow:'linebreak',lineColor:[224,229,235],lineWidth:.15},columnStyles:Object.fromEntries(widths.map((width,index)=>[index,{cellWidth:width}]))});
    }
  }
  if(template.detailed)for(const group of groups)for(const register of group.relatedRegisters||[]){ensure(40);heading(register.title);paragraph(register.description);const rows=registerTable(register,register.records);table(rows.head,rows.body);}
  if(config.definitions){heading('KPI definitions');for(const group of groups)table(['Indicator','Definition'],group.metrics.map(metric=>[metric.label,metric.description]),{columnStyles:{0:{cellWidth:55},1:{cellWidth:125}}});}
  doc.setFont('ReportSans','normal');doc.setFontSize(8);
  ensure(30+report.notes.reduce((height,note)=>height+doc.splitTextToSize(clean(note),180).length*4.2+3,0));
  heading('Report basis');report.notes.forEach(note=>paragraph(note));
  paragraph('Reference sample captured: '+new Date(report.reference.capturedAt).toLocaleString('en-GB')+'. Finance source date: '+dateLabel(report.reference.finance.REVIEW_DATE)+'.');
  const pages=doc.getNumberOfPages();
  for(let page=1;page<=pages;page++){
    doc.setPage(page);doc.setDrawColor(...rgb);doc.setLineWidth(.6);doc.line(15,35,195,35);
    const logoHeight=Math.min(13,42/logo.ratio),logoWidth=logoHeight*logo.ratio;doc.addImage(logo.data,'PNG',15,12,logoWidth,logoHeight);
    doc.setFont('ReportSans','bold');doc.setFontSize(9);doc.setTextColor(...rgb);const companyLines=doc.splitTextToSize(clean(config.brand.company),108).slice(0,2);doc.text(companyLines,195,15,{align:'right'});
    doc.setFont('ReportSans','normal');doc.setFontSize(7);doc.setTextColor(88,99,112);
    const contactLines=doc.splitTextToSize(clean(config.brand.contact),108).slice(0,3);if(contactLines.length)doc.text(contactLines,195,16+companyLines.length*4,{align:'right'});
    doc.setDrawColor(224,229,235);doc.setLineWidth(.2);doc.line(15,279,195,279);
    doc.setFontSize(7);doc.text(doc.splitTextToSize(clean(config.brand.footer),145).slice(0,2),15,284);
    doc.text(`${page} / ${pages}`,195,284,{align:'right'});
  }
  return doc;
}
export function downloadBlob(blob, name) {
  const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),30000);
}
export function downloadReportCsv(report, config) {
  const safe=value=>{let text=String(value??'');if(typeof value==='string'&&/^[=+@\-\t\r]/.test(text))text="'"+text;return '"'+text.replaceAll('"','""')+'"';};
  const rows=[['Company','Report','Start date','End date','Module','KPI','Numeric value','Unit','Basis','Source','Definition'],...selectedGroups(report,config).flatMap(group=>group.metrics.map(metric=>[config.brand.company,config.title||REPORT_TEMPLATES[config.template].name,report.range.start,report.range.end,group.title,metric.label,metric.value,metric.unit,metric.basis,metric.source,metric.description]))];
  downloadBlob(new Blob(['\uFEFF'+rows.map(row=>row.map(safe).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'}),documentName(report,config)+'.csv');
}
export function printableReportHtml(report, config) {
  const groups=selectedGroups(report,config),template=REPORT_TEMPLATES[config.template],title=config.title||template.name;
  const table=(head,body)=>`<table><thead><tr>${head.map(value=>`<th>${escape(value)}</th>`).join('')}</tr></thead><tbody>${body.map(row=>`<tr>${row.map(value=>`<td>${escape(value)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  return `<!doctype html><html><head><meta charset="utf-8"><title>${escape(title)}</title><style>
  @font-face{font-family:Report;src:url('${regularFont}')}@font-face{font-family:Report;src:url('${boldFont}');font-weight:700}
  @page{size:A4;margin:15mm}*{box-sizing:border-box}body{font:10pt Report,Arial,sans-serif;color:#202932;margin:0}h1{font-size:24pt;margin:0 0 10px;color:${config.brand.accent}}h2{font-size:14pt;margin:24px 0 8px;break-after:avoid}p{font-size:9pt;line-height:1.6;color:#586370}header{min-height:21mm;padding-bottom:4mm;margin-bottom:5mm;border-bottom:2px solid ${config.brand.accent};display:flex;justify-content:space-between;align-items:start}header img{max-width:44mm;max-height:13mm}header div{text-align:right;white-space:pre-line;font-size:8pt;max-width:100mm}header strong{display:block;color:${config.brand.accent};font-size:10pt}footer{margin-top:5mm;border-top:1px solid #dfe5eb;padding-top:3mm;font-size:8pt;color:#586370}table{width:100%;border-collapse:collapse;table-layout:fixed;font-size:8pt;margin:8px 0 16px}thead{display:table-header-group}th{background:${config.brand.accent};color:white;text-align:left}th,td{padding:7px;border:1px solid #dfe5eb;overflow-wrap:anywhere;vertical-align:top}tr{break-inside:avoid}tbody tr:nth-child(even){background:#f7faf9}.source{font-size:8pt}.notes{break-before:auto}section{break-inside:auto}img{object-fit:contain} @media print{*{print-color-adjust:exact;-webkit-print-color-adjust:exact}}
  .report-print-layout{margin:0;border:0}.report-print-layout>thead{display:table-header-group}.report-print-layout>tfoot{display:table-footer-group}.report-print-layout>thead>tr>td,.report-print-layout>tfoot>tr>td,.report-print-layout>tbody>tr>td{padding:0;border:0;background:white}.report-print-layout>tbody>tr{break-inside:auto}.report-print-layout>tfoot footer{margin-top:5mm;padding-bottom:3mm}section>h2+p{break-after:avoid}
  </style></head><body><table class="report-print-layout"><thead><tr><td><header><img src="${escape(config.brand.logo||defaultLogo)}" alt="Company logo"><div><strong>${escape(config.brand.company)}</strong>${escape(config.brand.contact)}</div></header></td></tr></thead><tfoot><tr><td><footer>${escape(config.brand.footer)}</footer></td></tr></tfoot><tbody><tr><td>
  <h1>${escape(title)}</h1><p>${escape(period(report))} · Prepared ${escape(generated(report))}${config.brand.preparedBy?' · '+escape(config.brand.preparedBy):''}</p><p>Local demo workspace. Period activity is filtered by the dates above; snapshot indicators retain their source date.</p>
  ${report.alerts.filter(alert=>config.sections.includes(alert.metric.groupId)).length?`<h2>Priority actions</h2>${table(['Action','Indicator','Next step'],report.alerts.filter(alert=>config.sections.includes(alert.metric.groupId)).map(alert=>[alert.title,alert.metric.formatted,alert.action]))}`:''}
  ${groups.map(group=>`<section><h2>${escape(group.title)}</h2><p class="source">${escape(group.source)}</p>${table(['Indicator','Value','Basis'],group.metrics.map(metric=>[metric.label,metric.formatted,metric.basis]))}${template.detailed?`<h2>Supporting records</h2>${table(registerTable(group).head,registerTable(group).body)}`:''}</section>`).join('')}
  ${template.detailed?groups.flatMap(group=>(group.relatedRegisters||[]).map(register=>`<section><h2>${escape(register.title)}</h2><p>${escape(register.description)}</p>${table(registerTable(register,register.records).head,registerTable(register,register.records).body)}</section>`)).join(''):''}
  ${config.definitions?`<h2>KPI definitions</h2>${table(['Indicator','Definition'],groups.flatMap(group=>group.metrics.map(metric=>[metric.label,metric.description])))}`:''}
  <section class="notes"><h2>Report basis</h2>${report.notes.map(note=>`<p>${escape(note)}</p>`).join('')}</section></td></tr></tbody></table></body></html>`;
}
export async function printReport(report,config) {
  const frame=document.createElement('iframe');frame.title='Printable company report';frame.style.cssText='position:fixed;width:0;height:0;left:-9999px;border:0';
  frame.srcdoc=printableReportHtml(report,config);document.body.append(frame);
  await new Promise(resolve=>frame.onload=resolve);
  await frame.contentDocument.fonts.ready;
  await Promise.all([...frame.contentDocument.images].map(img=>img.decode().catch(()=>{})));
  frame.contentWindow.addEventListener('afterprint',()=>frame.remove(),{once:true});
  frame.contentWindow.focus();frame.contentWindow.print();
  // Keep the frame for asynchronous print dialogs, but clean up abandoned previews.
  setTimeout(()=>frame.remove(),300000);
}
