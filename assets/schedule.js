(()=>{'use strict';
 const host=document.getElementById('schedule');
 if(!host)return;
 const $=id=>host.querySelector('#'+id);
 const weekdays=['일','월','화','수','목','금','토'];
 const names={meeting:'모임',rental:'대관',free:'자유방문',closure:'임시 휴무',opening:'OPEN'};
 const OPEN_DATE='2026-10-22',OPEN_MONTH='2026-10';
 const now=new Date();
 // Calendar date is interpreted in Korea, independently of the client's local timezone.

 const parts=new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Seoul',year:'numeric',month:'numeric',day:'numeric'}).formatToParts(now);
 const readPart=name=>Number(parts.find(p=>p.type===name)?.value||0);
 const koreanNow=String(readPart('year'))+'-'+String(readPart('month')).padStart(2,'0')+'-'+String(readPart('day')).padStart(2,'0');
 let year=readPart('year'),month=readPart('month'),records=new Map(),holidays={},currentRequest=0;
 const pad=n=>String(n).padStart(2,'0');
 const keyFor=(y,m,d)=>y+'-'+pad(m)+'-'+pad(d);
 const isClosed=(y,m,d)=>[0,1].includes(new Date(Date.UTC(y,m-1,d)).getUTCDay());
 const timeToMin=s=>Number(s.slice(0,2))*60+Number(s.slice(3,5));
 const toTime=n=>pad(Math.floor(n/60))+':'+pad(n%60);
 const text=(tag,className,value)=>{const e=document.createElement(tag);if(className)e.className=className;if(value!==undefined)e.textContent=value;return e;};
 const titleFor=e=>e.category==='custom'?e.category_label||'기타':names[e.category]||'기타';
 const classFor=e=>Object.prototype.hasOwnProperty.call(names,e.category)?e.category:'custom';
 const rangeFor=e=>e.category==='closure'?'종일 휴무':e.start_time.slice(0,5)+'–'+e.end_time.slice(0,5);
 function getDay(y,m,d){
  const day=keyFor(y,m,d);
  if(day<OPEN_DATE)return {preOpen:true,closed:false,events:[]};
  const events=(records.get(day)||[]).slice().sort((a,b)=>a.start_time.localeCompare(b.start_time));
  const opening=events.find(e=>e.category==='opening');
  if(opening)return {opening:true,closed:false,events:[opening]};
  const temporaryClosure=events.find(e=>e.category==='closure');
  if(temporaryClosure)return {closed:true,temporaryClosed:true,events:[temporaryClosure]};
  if(holidays[day])return {closed:events.length===0,holiday:holidays[day],events};
  if(isClosed(y,m,d))return {closed:events.length===0,events};
  const free=[],begin=540,finish=1020;let pointer=begin;
  // Auto-calculated free visits must exclude 12:00–13:00.
  const addFree=(start,end)=>{
    for(const [windowStart,windowEnd] of [[540,720],[780,1020]]){
      const a=Math.max(start,windowStart),b=Math.min(end,windowEnd);
      if(a<b)free.push({category:'free',title:'자유롭게 책 읽고 글쓰기',start_time:toTime(a),end_time:toTime(b)});
    }
  };
  for(const e of events){
    const a=Math.max(begin,timeToMin(e.start_time)),b=Math.min(finish,timeToMin(e.end_time));
    if(a>=b)continue;
    if(pointer<a)addFree(pointer,a);
    pointer=Math.max(pointer,b);
  }
  if(pointer<finish)addFree(pointer,finish);
  // Presentation-only merge: two valid free segments become one informative card.
  const wholeDay=free.length===2 &&
   free[0].start_time==='09:00'&&free[0].end_time==='12:00'&&
   free[1].start_time==='13:00'&&free[1].end_time==='17:00';
  const displayFree=wholeDay?[{category:'free',title:'자유롭게 책 읽고 글쓰기',start_time:'09:00',end_time:'17:00',lunch_excluded:true}]:free;
  return {closed:false,events:[...events,...displayFree].sort((a,b)=>a.start_time.localeCompare(b.start_time))};
 }
 function setState(message,isError=false){
  $('sc-state').textContent=message||'';
  $('sc-state').className=isError?'sc-error':'sc-info';
  $('sc-state').hidden=!message;
 }
 function drawMonth(){
  $('sc-month-title').textContent=year+'년 '+month+'월';
  $('sc-next').disabled=keyFor(year,month,1).slice(0,7)>='2050-12';
  $('sc-prev').disabled=keyFor(year,month,1).slice(0,7)<=OPEN_MONTH;
  const grid=$('sc-days');grid.replaceChildren();
  const first=new Date(Date.UTC(year,month-1,1)).getUTCDay();
  const max=new Date(Date.UTC(year,month,0)).getUTCDate();
  const count=Math.ceil((first+max)/7)*7;
  for(let k=0;k<count;k++){
   const d=k-first+1;
   if(d<1||d>max){
    const blank=text('div','sc-day is-other');blank.setAttribute('aria-hidden','true');grid.appendChild(blank);continue;
   }
   const key=keyFor(year,month,d),dow=new Date(Date.UTC(year,month-1,d)).getUTCDay(),data=getDay(year,month,d);
   const button=text(data.preOpen||data.opening?'div':'a','sc-day');
   if(!data.preOpen&&!data.opening)button.href='/calendar?date='+key+'#schedule';
   if(holidays[key])button.classList.add('is-holiday');
   if(dow===0)button.classList.add('is-sunday');
   if(data.closed)button.classList.add('is-closed');
   if(data.preOpen)button.classList.add('is-pre-open');
   if(data.opening)button.classList.add('is-opening');
   if(key===koreanNow)button.classList.add('is-today');
   button.setAttribute('aria-label',data.opening?'10월 22일 작가작업실 JEJU OPEN':data.preOpen?month+'월 '+d+'일 오픈 전':month+'월 '+d+'일 '+weekdays[dow]+'요일 일정 보기');
   button.appendChild(text('span','sc-date-num',String(d)));
   if(data.closed)button.appendChild(text('span','sc-closed-label',data.temporaryClosed?'임시휴무':data.holiday?data.holiday+' · 휴무':'휴무'));
   else {
    for(const e of data.events.slice(0,4)){
     const chip=text('span','sc-entry '+classFor(e));
     const name=text('strong','sc-kind',e.category==='opening'?e.title:titleFor(e));name.title=e.category==='opening'?e.title:titleFor(e);
     chip.appendChild(name);
     if(e.category!=='opening')chip.appendChild(text('span','sc-clock',rangeFor(e)));
     if(e.lunch_excluded)chip.appendChild(text('span','sc-lunch','(점심시간 12-13시)'));
     button.appendChild(chip);
    }
    if(data.events.length>4)button.appendChild(text('span','sc-more','+'+(data.events.length-4)+'개 더보기'));
   }

   grid.appendChild(button);
  }
 }
 function showDay(y,m,d){
  const helper=host.querySelector('.sc-top small');if(helper)helper.hidden=true;
  $('sc-back').textContent='← 돌아가기';
  $('sc-back').href=fromHome?'/#weekly-schedule':'/calendar?month='+keyFor(y,m,1).slice(0,7)+'#schedule';
  if(keyFor(y,m,d)<=OPEN_DATE)return;
  const dow=new Date(Date.UTC(y,m-1,d)).getUTCDay(),data=getDay(y,m,d);
  $('sc-month').hidden=true;$('sc-detail-view').hidden=false;
  $('sc-detail-date').textContent=y+'년 '+m+'월 '+d+'일 ('+weekdays[dow]+')';
  const list=$('sc-detail-events');list.replaceChildren();
  if(data.temporaryClosed){
    const event=data.events[0],card=text('article','sc-detail closure');
    card.append(
      text('div','sc-detail-kind','임시 휴무'),
      text('div','sc-detail-title',event.title),
      text('div','sc-detail-clock','종일 휴무')
    );
    list.appendChild(card);return;
  }
  if(data.closed){list.appendChild(text('div','sc-closed-detail',data.holiday?data.holiday+' · 휴무입니다.':'정기휴무 · 일요일과 월요일은 쉽니다.'));return;}
  for(const e of data.events){
    const card=text('article','sc-detail '+classFor(e));
    card.append(text('div','sc-detail-kind',titleFor(e)),text('div','sc-detail-title',e.title),text('div','sc-detail-clock',rangeFor(e)));
    if(e.lunch_excluded)card.appendChild(text('div','sc-detail-lunch','(점심시간 12-13시)'));
    if(['meeting','custom'].includes(e.category)&&/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(e.id||'')){const link=text('a','sc-event-link','행사 상세 보기 →');link.href='/calendar/events/'+encodeURIComponent(e.id);card.appendChild(link);}
    list.appendChild(card);
  }
 }
 async function load(){
  const id=++currentRequest;
  $('sc-month').hidden=false;$('sc-detail-view').hidden=true;
  $('sc-month-title').textContent=year+'년 '+month+'월';
  $('sc-days').replaceChildren();setState('일정을 불러오는 중입니다.');
  try{
   const response=await fetch('/api/schedule?month='+keyFor(year,month,1).slice(0,7),{cache:'no-store'});
   const data=await response.json().catch(()=>({}));
   if(!response.ok)throw Error(data.error||'일정 조회에 실패했습니다.');
   if(id!==currentRequest)return;
   holidays=data.holidays||{};
   records=new Map();
   for(const item of (data.items||[])){
    if(typeof item.event_date!=='string')continue;
    if(!records.has(item.event_date))records.set(item.event_date,[]);
    records.get(item.event_date).push(item);
   }
   drawMonth();setState('모바일에서는 캘린더를 좌우로 움직여 확인하세요.');
   if(requestedDay){const [y,m,d]=requestedDay.split('-').map(Number);showDay(y,m,d);setState('');requestedDay=null;}
  }catch(e){
   if(id!==currentRequest)return;
   $('sc-days').replaceChildren();setState('일정 조회 오류: '+e.message,true);
  }
 }
 function changeMonth(delta){const n=new Date(Date.UTC(year,month-1+delta,1));const target=keyFor(n.getUTCFullYear(),n.getUTCMonth()+1,1).slice(0,7);if(target<OPEN_MONTH||target>'2050-12')return;year=n.getUTCFullYear();month=n.getUTCMonth()+1;load();}
 $('sc-prev').addEventListener('click',()=>changeMonth(-1));
 $('sc-next').addEventListener('click',()=>changeMonth(1));
 $('sc-current').addEventListener('click',()=>{year=readPart('year');month=readPart('month');load();});
 $('sc-back').addEventListener('click',event=>{if(fromHome&&window.jejuGoBack&&!event.ctrlKey&&!event.metaKey&&!event.shiftKey&&!event.altKey){event.preventDefault();window.jejuGoBack('/#weekly-schedule');}});
 const params=new URLSearchParams(location.search);
 const fromHome=params.get('from')==='home';
 const requestedMonth=params.get('month');
 if(/^\d{4}-(0[1-9]|1[0-2])$/.test(requestedMonth||'')&&requestedMonth>=OPEN_MONTH&&requestedMonth<='2050-12'){[year,month]=requestedMonth.split('-').map(Number);}
 let requestedDay=params.get('date');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(requestedDay||'')||!Number.isFinite(Date.parse(requestedDay+'T00:00:00Z'))||new Date(requestedDay+'T00:00:00Z').toISOString().slice(0,10)!==requestedDay||requestedDay<=OPEN_DATE||requestedDay>'2050-12-31')requestedDay=null;
 if(requestedDay){const parts=requestedDay.split('-').map(Number);year=parts[0];month=parts[1];}
 load();
})();
