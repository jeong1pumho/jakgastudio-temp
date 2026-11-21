'use strict';
// First-response HTML for the existing interactive monthly calendar.
// Keep the public-day rules aligned with assets/schedule.js.
const {query,esc}=require('./core');
const {holidaysForYear}=require('./holidays');
const {displayBrand}=require('./seo');
const OPEN_DATE='2026-10-22';
const OPEN_MONTH='2026-10';
const weekdays=['일','월','화','수','목','금','토'];
const names={meeting:'작가작업실 JEJU',rental:'대관',free:'자유방문',closure:'임시 휴무',opening:'OPEN'};
const pad=n=>String(n).padStart(2,'0');
const key=(y,m,d)=>y+'-'+pad(m)+'-'+pad(d);
const timeToMin=value=>Number(String(value).slice(0,2))*60+Number(String(value).slice(3,5));
const toTime=value=>pad(Math.floor(value/60))+':'+pad(value%60);
function context(req,now=new Date()){
 const parts=new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Seoul',year:'numeric',month:'numeric',day:'numeric'}).formatToParts(now);
 const value=k=>Number(parts.find(p=>p.type===k)?.value||0);
 const today=key(value('year'),value('month'),value('day'));
 const next=new Date(Date.UTC(value('year'),value('month'),1));
 const lastMonth=key(next.getUTCFullYear(),next.getUTCMonth()+1,1).slice(0,7);
 let selected=today.slice(0,7);
 const inputMonth=req.query?.month;
 if(typeof inputMonth==='string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(inputMonth) && inputMonth>=OPEN_MONTH && inputMonth<=lastMonth)selected=inputMonth;
 const inputDay=req.query?.date;
 if(typeof inputDay==='string' && /^\d{4}-\d{2}-\d{2}$/.test(inputDay) && inputDay>OPEN_DATE && inputDay.slice(0,7)<=lastMonth && inputDay.slice(0,7)>=OPEN_MONTH){
  const parsed=new Date(inputDay+'T00:00:00Z');
  if(!Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0,10)===inputDay)selected=inputDay.slice(0,7);
 }
 const [year,month]=selected.split('-').map(Number);
 const first=selected==='2026-10'?OPEN_DATE:selected+'-01';
 const nextFirst=new Date(Date.UTC(year,month,1)).toISOString().slice(0,10);
 return {year,month,selected,today,first,nextFirst,lastMonth};
}
function dayInfo(y,m,d,items,holidays){
 const day=key(y,m,d);
 if(day<OPEN_DATE)return {preOpen:true,closed:false,events:[]};
 const events=items.filter(e=>e.event_date===day).slice().sort((a,b)=>String(a.start_time).localeCompare(String(b.start_time)));
 const opening=events.find(e=>e.category==='opening');
 if(opening)return {opening:true,closed:false,events:[opening]};
 const closure=events.find(e=>e.category==='closure');
 if(closure)return {closed:true,temporaryClosed:true,events:[closure]};
 if(holidays[day])return {closed:events.length===0,holiday:holidays[day],events};
 if([0,1].includes(new Date(Date.UTC(y,m-1,d)).getUTCDay()))return {closed:events.length===0,events};
 const free=[];
 const addFree=(start,end)=>{
  for(const [wStart,wEnd] of [[540,720],[780,1020]]){
   const a=Math.max(start,wStart),b=Math.min(end,wEnd);
   if(a<b)free.push({category:'free',title:'자유롭게 책 읽고 글쓰기',start_time:toTime(a),end_time:toTime(b)});
  }
 };
 let pointer=540;
 for(const e of events){
  const a=Math.max(540,timeToMin(e.start_time)),b=Math.min(1020,timeToMin(e.end_time));
  if(a>=b)continue;
  if(pointer<a)addFree(pointer,a);
  pointer=Math.max(pointer,b);
 }
 if(pointer<1020)addFree(pointer,1020);
 const wholeDay=free.length===2 &&
  free[0].start_time==='09:00' && free[0].end_time==='12:00' &&
  free[1].start_time==='13:00' && free[1].end_time==='17:00';
 const displayFree=wholeDay?[{category:'free',title:'자유롭게 책 읽고 글쓰기',start_time:'09:00',end_time:'17:00',lunch_excluded:true}]:free;
 return {closed:false,events:[...events,...displayFree].sort((a,b)=>String(a.start_time).localeCompare(String(b.start_time)))};
}
function monthGrid(ctx,items,holidays){
 const {year,month,today}=ctx;
 const firstDow=new Date(Date.UTC(year,month-1,1)).getUTCDay();
 const lastDay=new Date(Date.UTC(year,month,0)).getUTCDate();
 const count=Math.ceil((firstDow+lastDay)/7)*7;
 let html='';
 for(let index=0;index<count;index++){
  const dayNumber=index-firstDow+1;
  if(dayNumber<1||dayNumber>lastDay){
   html+='<div class="sc-day is-other" aria-hidden="true"></div>';
   continue;
  }
  const date=key(year,month,dayNumber);
  const dow=new Date(Date.UTC(year,month-1,dayNumber)).getUTCDay();
  const data=dayInfo(year,month,dayNumber,items,holidays);
  const type=data.preOpen||data.opening?'div':'a';
  let cls='sc-day';
  if(holidays[date])cls+=' is-holiday';
  if(dow===0)cls+=' is-sunday';
  if(data.closed)cls+=' is-closed';
  if(data.preOpen)cls+=' is-pre-open';
  if(data.opening)cls+=' is-opening';
  if(date===today)cls+=' is-today';
  const label=data.opening?'10월 22일 작가작업실 제주 OPEN':data.preOpen?month+'월 '+dayNumber+'일 오픈 전':month+'월 '+dayNumber+'일 '+weekdays[dow]+'요일 일정 보기';
  html+='<'+type+' class="'+cls+'"';
  if(type==='a')html+=' href="/calendar?date='+date+'#schedule"';
  html+=' aria-label="'+esc(label)+'"><span class="sc-date-num">'+dayNumber+'</span>';
  if(data.closed){
   const closeLabel=data.temporaryClosed?'임시휴무':data.holiday?data.holiday+' · 휴무':'휴무';
   html+='<span class="sc-closed-label">'+esc(closeLabel)+'</span>';
  }else{
   for(const event of data.events.slice(0,4)){
    const category=Object.prototype.hasOwnProperty.call(names,event.category)?event.category:'custom';
    const kind=event.category==='free'?names.free:event.category==='opening'?displayBrand(event.title||''):String(event.title||'')||(event.category==='custom'?(event.category_label||'기타'):(names[event.category]||'기타'));
    const range=event.category==='closure'?'종일 휴무':String(event.start_time).slice(0,5)+'–'+String(event.end_time).slice(0,5);
    html+='<span class="sc-entry '+category+'"><strong class="sc-kind" title="'+esc(kind)+'">'+esc(kind)+'</strong>';
    if(event.category!=='opening')html+='<span class="sc-clock">'+esc(range)+'</span>';
    if(event.lunch_excluded)html+='<span class="sc-lunch">(점심시간 12-13시)</span>';
    html+='</span>';
   }
   if(data.events.length>4)html+='<span class="sc-more">+'+(data.events.length-4)+'개 더보기</span>';
  }
  html+='</'+type+'>';
 }
 return html;
}
function inject(template,ctx,items,holidays){
 const days='<div id="sc-days" class="sc-days" aria-live="polite"></div>';
 if(!template.includes(days))throw Error('Monthly calendar grid placeholder not found');
 let out=template.replace(days,'<div id="sc-days" class="sc-days" aria-live="polite">'+monthGrid(ctx,items,holidays)+'</div>');
 out=out.replace('<strong id="sc-month-title" class="sc-month-label"></strong>',
  '<strong id="sc-month-title" class="sc-month-label">'+ctx.year+'년 '+ctx.month+'월</strong>');
 if(ctx.selected===OPEN_MONTH)out=out.replace('id="sc-prev"','id="sc-prev" disabled');
 if(ctx.selected===ctx.lastMonth)out=out.replace('id="sc-next"','id="sc-next" disabled');
 return out;
}
async function render(req,template){
 const ctx=context(req);
 try{
  const url='/rest/v1/schedule_events?select=id,event_date,category,category_label,title,start_time,end_time'
   +'&event_date=gte.'+ctx.first+'&event_date=lt.'+ctx.nextFirst
   +'&order=event_date.asc,start_time.asc&limit=500';
  const rows=await query(url);
  return inject(template,ctx,rows,holidaysForYear(ctx.year));
 }catch(error){
  console.error('Monthly calendar initial HTML failed:',error.status||500);
  return template.replace('<p id="sc-state" class="sc-info" role="status" aria-live="polite" hidden></p>',
   '<p id="sc-state" class="sc-info" role="status" aria-live="polite">일정을 불러오지 못했습니다. 새로고침하여 다시 확인해 주세요.</p>');
 }
}
module.exports={context,dayInfo,monthGrid,inject,render};
