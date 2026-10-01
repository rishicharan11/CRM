// Closed chart components following the Paryatech Charts reference.
// Colour belongs to a series, not its value or its current rank.
import { currency, dateLabel } from './reports-model.js';

const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const colour = index => `var(--pt-color-chart-${index + 1})`;
const number = value => Number(value).toLocaleString('en-IN');
const share = (value, total) => total ? Number((value / total * 100).toFixed(1)) : 0;
const formatted = (value, money) => money ? currency(value) : number(value);
const short = (value, money) => {
  const prefix = money ? '₹' : '';
  if (value >= 10000000) return prefix + Number((value / 10000000).toFixed(1)) + 'Cr';
  if (value >= 100000) return prefix + Number((value / 100000).toFixed(1)) + 'L';
  if (value >= 1000) return prefix + Number((value / 1000).toFixed(1)) + 'K';
  return prefix + number(value);
};
const ceiling = value => {
  if (value <= 4) return 4;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  return Math.ceil(value / magnitude / .5) * magnitude * .5;
};
const svg = (width, height, label, contents) => `<svg class="reports-plot" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="group" aria-label="${escape(label)}">${contents}</svg>`;
const tip = (label, values) => escape(JSON.stringify({label, values}));
const dataTable = (headers, rows) => `<details class="reports-chart-data"><summary>View chart data</summary><div class="reports-table-scroll"><table><thead><tr>${headers.map(label=>`<th scope="col">${escape(label)}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${row.map(value=>`<td>${escape(value)}</td>`).join('')}</tr>`).join('')}</tbody></table></div></details>`;

export function ChartCard({id, title, description, action = '', summary = '', chart, footer = ''}) {
  return `<section class="reports-panel reports-chart-card" aria-labelledby="${id}-title"><header><div><h2 id="${id}-title">${escape(title)}</h2><p class="reports-panel-sub">${escape(description)}</p></div>${action}</header>${summary}${chart}${footer}</section>`;
}
export function Sparkline(values) {
  const max = Math.max(1, ...values), bottom = 25;
  const points = values.map((value,index)=>`${values.length===1?60:index/(values.length-1)*120},${bottom-value/max*22}`).join(' ');
  return `<svg class="reports-sparkline" viewBox="0 0 120 28" aria-hidden="true"><polygon points="0,${bottom} ${points} 120,${bottom}"/><polyline points="${points}"/></svg>`;
}
const host = (type, config) => `<div class="reports-chart-host" data-report-chart="${type}" data-chart-config="${escape(JSON.stringify(config))}"></div>`;
export function AreaChart({data, label}) {
  const series = ['Receipts', 'Outgoing'];
  const legend = `<div class="reports-chart-legend" aria-label="Chart series">${series.map((name,index)=>`<button type="button" data-chart-series="${index}" aria-pressed="true"><i style="background:${colour(index)}"></i>${name}</button>`).join('')}</div>`;
  const chart = data.some(bin=>bin.incoming||bin.outgoing) ? host('area',{data,label,series,money:true}) : `<div class="reports-chart-empty"><strong>No dated money movements in this period</strong><p>Choose another period to review recorded finance activity.</p></div>`;
  return `<div class="reports-chart">${legend}${chart}</div>${dataTable(['Date bucket',...series],data.map(bin=>[dateLabel(bin.start)+(bin.end!==bin.start?' – '+dateLabel(bin.end):''),currency(bin.incoming),currency(bin.outgoing)]))}`;
}
export function BarChart({data, label}) {
  return `<div class="reports-chart"><div class="reports-chart-legend"><span><i style="background:${colour(0)}"></i>Queries</span></div>${host('bar',{data,label})}</div>${dataTable(['Stage','Queries'],data.map(row=>[row.label,number(row.value)]))}`;
}
export function DonutChart({data, label, caption}) {
  const total = data.reduce((sum,row)=>sum+row.value,0);
  const legend = `<ul class="reports-donut-legend">${data.map((row,index)=>`<li><span><i style="background:${row.label==='Other'?'var(--pt-color-chart-other)':colour(index)}"></i>${escape(row.label)}</span><strong>${number(row.value)}</strong><small>${share(row.value,total)}%</small></li>`).join('')}</ul>`;
  return `<div class="reports-chart reports-donut-chart">${host('donut',{data,label,total,caption})}${legend}</div>${dataTable(['Category','Customers','Share'],data.map(row=>[row.label,number(row.value),`${share(row.value,total)}%`]))}`;
}
export function AgeingChart({data, label, series}) {
  const colours = series.map((_,index)=>`var(--pt-color-chart-ordinal-${index+1})`);
  return `<div class="reports-chart"><div class="reports-chart-legend reports-ageing-legend">${series.map((name,index)=>`<span><i style="background:${colours[index]}"></i>${escape(name)}</span>`).join('')}</div>${host('ageing',{data,label,series,colours,money:true})}</div>${dataTable(['Customer',...series,'Total'],data.map(row=>[row.label,...row.values.map(currency),currency(row.values.reduce((a,b)=>a+b,0))]))}`;
}
function areaPlot(config, width, hidden) {
  const height = width < 440 ? 240 : 320, left = 52, right = width-12, top = 10, bottom = height-32;
  const maximum = ceiling(Math.max(1,...config.data.flatMap(row=>[hidden.has(0)?0:row.incoming,hidden.has(1)?0:row.outgoing])));
  const x = index => config.data.length===1?(left+right)/2:left+index/(config.data.length-1)*(right-left);
  const y = value => bottom-value/maximum*(bottom-top);
  const gradientId=index=>'reports-area-'+config.label.replace(/\W/g,'-')+'-'+index;
  let body = `<defs>${[0,1].map(index=>`<linearGradient id="${gradientId(index)}" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="${colour(index)}" stop-opacity=".18"/><stop offset="100%" stop-color="${colour(index)}" stop-opacity=".02"/></linearGradient>`).join('')}</defs>`;
  body += Array.from({length:5},(_,index)=>{const value=maximum*index/4, py=y(value);return `<line class="reports-chart-grid" x1="${left}" x2="${right}" y1="${py}" y2="${py}"/><text class="reports-axis-label" x="${left-9}" y="${py+4}" text-anchor="end">${short(value,true)}</text>`;}).join('');
  const keys = ['incoming','outgoing'];
  keys.forEach((key,index)=>{
    if(hidden.has(index))return;
    const points = config.data.length===1?`${left},${y(config.data[0][key])} ${right},${y(config.data[0][key])}`:config.data.map((row,i)=>`${x(i)},${y(row[key])}`).join(' ');
    body += `<polygon class="reports-area-fill" fill="url(#${gradientId(index)})" points="${left},${bottom} ${points} ${right},${bottom}"/><polyline class="reports-series-line" stroke="${colour(index)}" points="${points}"/>`;
    if(config.data.length===1)body+=`<circle cx="${x(0)}" cy="${y(config.data[0][key])}" r="4" fill="${colour(index)}"/>`;
  });
  const stride = Math.max(1,Math.ceil(config.data.length/(width<440?4:8)));
  config.data.forEach((row,index)=>{
    const px=x(index), gap=config.data.length===1?right-left:(right-left)/(config.data.length-1), start=index===0?left:px-gap/2, end=index===config.data.length-1?right:px+gap/2;
    const label=dateLabel(row.start)+(row.start!==row.end?' – '+dateLabel(row.end):'');
    body+=`<g class="reports-chart-point" tabindex="0" aria-label="${escape(label+', Receipts '+currency(row.incoming)+', Outgoing '+currency(row.outgoing))}" data-chart-tip="${tip(label,keys.map((key,i)=>[config.series[i],currency(row[key])]))}"><rect class="reports-hit-target" x="${start}" y="${top}" width="${Math.max(1,end-start)}" height="${bottom-top}"/><line class="reports-crosshair" x1="${px}" x2="${px}" y1="${top}" y2="${bottom}"/></g>`;
    if(index%stride===0||index===config.data.length-1){const date=new Date(row.start+'T12:00:00');body+=`<text class="reports-axis-label" x="${px}" y="${height-10}" text-anchor="${config.data.length===1?'middle':index===0?'start':index===config.data.length-1?'end':'middle'}">${escape(date.toLocaleDateString('en-GB',{day:'numeric',month:'short'}))}</text>`;}
  });
  return svg(width,height,config.label,body);
}
function barPlot(config,width,stacked=false) {
  const height=stacked?Math.max(160,config.data.length*52+40):270, left=stacked?20:94, right=width-16, top=stacked?36:24, bottom=height-26;
  const value = row => stacked?row.values.reduce((a,b)=>a+b,0):row.value;
  const highest=ceiling(Math.max(1,...config.data.map(value))), max=stacked?highest:Math.ceil(highest/4)*4, plotWidth=right-left;
  let body = Array.from({length:5},(_,i)=>{const px=left+i/4*plotWidth;return `<line class="reports-chart-grid" x1="${px}" x2="${px}" y1="${top-8}" y2="${bottom}"/><text class="reports-axis-label" x="${px}" y="${height-7}" text-anchor="${i===0?'start':i===4?'end':'middle'}">${short(max*i/4,stacked)}</text>`;}).join('');
  config.data.forEach((row,index)=>{
    const py=top+(bottom-top)/config.data.length*(index+.5), barHeight=stacked?14:18;
    const label=stacked?row.label:row.label==='Negotiation'?'Negotiation':row.label;
    body+=`<text class="reports-axis-label" x="${stacked?left:left-10}" y="${stacked?py-16:py+4}" text-anchor="${stacked?'start':'end'}">${escape(label)}</text>`;
    let offset=0;
    (stacked?row.values:[row.value]).forEach((amount,i)=>{
      const bw=amount/max*plotWidth, tooltip=stacked?config.series.map((name,n)=>[name,currency(row.values[n])]):[['Queries',number(row.value)]];
      if(amount>0)body+=`<rect class="reports-bar-mark" tabindex="0" aria-label="${escape(label+', '+(stacked?config.series[i]+', ':'')+formatted(amount,stacked))}" data-chart-tip="${tip(label,tooltip)}" x="${left+offset}" y="${py-barHeight/2}" width="${bw}" height="${barHeight}" rx="${stacked?1:3}" fill="${stacked?config.colours[i]:colour(0)}"/>`;
      offset+=bw;
    });
  });
  return svg(width,height,config.label,body);
}
function donutPlot(config,width) {
  const size=180, radius=70, circumference=2*Math.PI*radius;
  let offset=0;
  const arcs=config.data.map((row,index)=>{
    const length=config.total?row.value/config.total*circumference:0, gap=Math.min(3,length*.15);
    const markup=length?`<circle class="reports-donut-mark" tabindex="0" aria-label="${escape(row.label+', '+row.value+' customers, '+share(row.value,config.total)+' percent')}" data-chart-tip="${tip(row.label,[['Customers',number(row.value)],['Share',share(row.value,config.total)+'%']])}" cx="90" cy="90" r="${radius}" fill="none" stroke="${row.label==='Other'?'var(--pt-color-chart-other)':colour(index)}" stroke-width="23" stroke-dasharray="${length-gap} ${circumference-length+gap}" stroke-dashoffset="${-offset}" transform="rotate(-90 90 90)"/>`:'';
    offset+=length;return markup;
  }).join('');
  return svg(size,size,config.label,`<circle cx="90" cy="90" r="70" fill="none" stroke="var(--pt-color-chart-grid)" stroke-width="23"/>${arcs}<text class="reports-donut-total" x="90" y="88" text-anchor="middle">${number(config.total)}</text><text class="reports-axis-label" x="90" y="107" text-anchor="middle">${escape(config.caption)}</text>`);
}
export function mountReportCharts(root) {
  const hosts=[...root.querySelectorAll('[data-report-chart]')], observers=[];
  hosts.forEach(element=>{
    const config=JSON.parse(element.dataset.chartConfig), type=element.dataset.reportChart, hidden=new Set();
    const draw=()=>{
      const width=Math.max(240,Math.floor(element.clientWidth));
      element.innerHTML=type==='area'?areaPlot(config,width,hidden):type==='donut'?donutPlot(config,width):barPlot(config,width,type==='ageing');
    };
    draw();
    const observer=new ResizeObserver(draw);observer.observe(element);observers.push(observer);
    element.closest('.reports-chart').querySelectorAll('[data-chart-series]').forEach(button=>button.addEventListener('click',()=>{
      const index=Number(button.dataset.chartSeries);
      if(hidden.has(index))hidden.delete(index);else if(hidden.size<config.series.length-1)hidden.add(index);
      button.setAttribute('aria-pressed',String(!hidden.has(index)));draw();
    }));
  });
  const tooltip=document.createElement('div');tooltip.className='reports-chart-tooltip';tooltip.hidden=true;root.append(tooltip);
  const show=event=>{
    const target=event.target.closest('[data-chart-tip]');if(!target)return;
    const data=JSON.parse(target.dataset.chartTip), card=target.closest('.reports-chart-card'), bounds=target.getBoundingClientRect(), page=root.getBoundingClientRect();
    tooltip.innerHTML=`<strong>${escape(data.label)}</strong>${data.values.map(([label,value])=>`<span>${escape(label)}<b>${escape(value)}</b></span>`).join('')}`;
    tooltip.hidden=false;
    const cardBounds=card.getBoundingClientRect();
    tooltip.style.left=Math.max(0,Math.min(bounds.x+bounds.width/2-page.x-tooltip.offsetWidth/2,root.clientWidth-tooltip.offsetWidth))+'px';
    tooltip.style.top=Math.max(0,Math.min(bounds.top-page.top-tooltip.offsetHeight-10,cardBounds.top-page.top+70))+'px';
  };
  const hide=()=>{tooltip.hidden=true;};
  const leave=event=>{
    const target=event.target.closest('[data-chart-tip]');
    if(!target||target===document.activeElement||event.relatedTarget?.closest?.('[data-chart-tip]')===target)return;
    hide();
  };
  const blur=event=>{if(event.target.closest('[data-chart-tip]'))hide();};
  root.addEventListener('pointerover',show);root.addEventListener('focusin',show);root.addEventListener('pointerout',leave);root.addEventListener('focusout',blur);
  const keydown=event=>{
    if(event.key==='Escape')hide();
    const target=event.target.closest('[data-chart-tip]');
    if(target&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(event.key)){
      const marks=[...target.closest('svg').querySelectorAll('[data-chart-tip]')], current=marks.indexOf(target);
      const next=event.key==='Home'?0:event.key==='End'?marks.length-1:(current+(['ArrowLeft','ArrowUp'].includes(event.key)?-1:1)+marks.length)%marks.length;
      event.preventDefault();marks[next].focus();
    }
  };root.addEventListener('keydown',keydown);
  return ()=>{observers.forEach(observer=>observer.disconnect());root.removeEventListener('pointerover',show);root.removeEventListener('focusin',show);root.removeEventListener('pointerout',leave);root.removeEventListener('focusout',blur);root.removeEventListener('keydown',keydown);tooltip.remove();};
}
