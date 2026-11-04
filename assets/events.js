/* MEETINGS & EVENTS: public test site feed; no sample events are inserted. */
(()=>{
 'use strict';
 const $=id=>document.getElementById(id);
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const typeLabel={reading:'독서',writing:'글쓰기',themed:'주제모임',special:'특별행사'};
 const opLabel={studio:'작가작업실 JEJU 운영',rental:'대관 행사'};
 const formatDate=value=>{
  const s=String(value||'');if(!/^\d{4}-\d{2}-\d{2}$/.test(s))return '';
  const weekday=['일','월','화','수','목','금','토'][new Date(s+'T00:00:00Z').getUTCDay()];
  return s.replace(/-/g,'.')+' ('+weekday+')';
 };
 function card(p,compact=false){
  const date=formatDate(p.event_date_start),end=formatDate(p.event_date_end);
  const type=typeLabel[p.event_type],operator=opLabel[p.operator_type];
  const tags=(operator?'<span class="operator-label">'+esc(operator)+'</span>':'')+
   (type?'<span>'+esc(type)+'</span>':'');
  const image=p.cover?'<img loading="lazy" decoding="async" src="'+esc(p.cover)+'" alt="'+esc(p.title)+'">':
   '<div class="news-blank" style="aspect-ratio:1;background:#f4f1eb"></div>';
  const text=(tags?'<div class="news-tagline">'+tags+'</div>':'')+
   '<h3>'+esc(p.title)+'</h3>'+
   (date?'<p class="news-date">'+esc(date)+(end?' ~ '+esc(end):'')+'</p>':'');
  return '<a class="news-card" href="/news/'+encodeURIComponent(p.slug||'')+'">'+
   image+(compact?'<div class="rental-card-copy">'+text+'</div>':text)+'</a>';
 }
 function list(node,items,empty,compact=false){
  node.innerHTML=items.length?items.map(p=>card(p,compact)).join(''):'<p class="news-empty">'+esc(empty)+'</p>';
 }
 const current=$('news-cards'),ended=$('ended-cards'),button=$('news-more');
 if(!current||!ended||!button)return;
 let initial=[],expanded=false,all=null;
 const showInitial=()=>{list(current,initial,'현재 진행 중인 모임·행사가 없습니다.');};
 fetch('/api/news').then(r=>{if(!r.ok)throw Error('fetch');return r.json();}).then(data=>{
  initial=Array.isArray(data.ongoing)?data.ongoing:[];
  showInitial();
  list(ended,Array.isArray(data.ended)?data.ended:[],'등록된 지난 모임·행사가 없습니다.');
  button.hidden=!data.hasMoreOngoing;
  const rentals=Array.isArray(data.rentals)?data.rentals:[];
  if(rentals.length&&$('rental-case-showcase')&&$('rental-case-grid')){
   list($('rental-case-grid'),rentals.slice(0,3),'',true);
   $('rental-case-showcase').hidden=false;
  }
  window.dispatchEvent(new Event('jak:events-rendered'));
 }).catch(()=>{
  current.innerHTML='<p class="news-empty">진행 중인 모임·행사를 불러오지 못했습니다.</p>';
  ended.innerHTML='<p class="news-empty">지난 모임·행사를 불러오지 못했습니다.</p>';
  window.dispatchEvent(new Event('jak:events-rendered'));
 });
 button.addEventListener('click',async()=>{
  if(expanded){
   expanded=false;showInitial();button.setAttribute('aria-expanded','false');
   button.innerHTML='진행 중인 모임·행사 더 보기 <span aria-hidden="true">⌄</span>';
   return;
  }
  button.disabled=true;
  try{
   if(!all){
    const res=await fetch('/api/news?view=ongoing&all=1');
    if(!res.ok)throw Error('load');
    const data=await res.json();all=Array.isArray(data.ongoing)?data.ongoing:[];
   }
   expanded=true;list(current,all,'현재 진행 중인 모임·행사가 없습니다.');
   button.setAttribute('aria-expanded','true');
   button.innerHTML='진행 중인 모임·행사 접기 <span aria-hidden="true">⌃</span>';
  }catch{
   current.insertAdjacentHTML('afterend','<p class="news-empty" role="alert" id="news-expand-error">전체 목록을 불러오지 못했습니다. 다시 시도해 주세요.</p>');
   const old=$('news-expand-error');setTimeout(()=>old?.remove(),3500);
  }finally{button.disabled=false;}
 });
})();
