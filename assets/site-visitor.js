(()=>{
'use strict';
if(!['www.jakgastudio.com','jakgastudio-temp.vercel.app'].includes(location.hostname)||/^\/(?:admin|api)(?:\/|$)/.test(location.pathname))return;
const ck='jakgastudio.visitor-insights-consent.v2',ex='jakgastudio.analytics-excluded.v1';
const exclusionCookie='jakgastudio_analytics_excluded_v1';
const excluded=()=>{
 const value=document.cookie.split(';').map(x=>x.trim()).find(x=>x.startsWith(exclusionCookie+'='))?.slice(exclusionCookie.length+1);
 if(value==='1'||value==='0')return value==='1';
 return get(ex)==='1';
};
const valid=/^\/(?:$|news(?:\/[a-z0-9-]{1,90})?|books(?:\/[a-z0-9-]{1,90})?|calendar(?:\/events\/[a-f0-9-]{36})?|programs(?:\/[a-z0-9-]{1,90})?|space|visit)$/i;
const path=location.pathname.replace(/\/$/,'')||'/';
const page=valid.test(path)?path:null;
function get(k){try{return localStorage.getItem(k)}catch{return k===ck?'no':null}}

if(!page)return;
const denied=()=>get(ck)==='no'||(!get(ck)&&get('jakgastudio.visitor-insights-consent.v1')==='no');
function emit(kind,path,detail,campaign='',visit=''){
 if(denied()||excluded()||!valid.test(path))return;
 fetch('/api/visit-analytics',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',
  referrerPolicy:'no-referrer',keepalive:true,body:JSON.stringify({kind,path,detail,campaign,visit,entry:kind==='click'&&ctx?ctx.source:undefined})}).catch(()=>{});
}
const params=new URLSearchParams(location.search);
const sourceNames={instagram:'Instagram',naver:'Naver',google:'Google',threads:'Threads',kakao:'Kakao'};
let previous;
try{previous=new URL(document.referrer)}catch{}
function source(){
 const channel=params.get('utm_source')?.toLowerCase();
 if(Object.hasOwn(sourceNames,channel))return sourceNames[channel];
 if(!previous)return '직접·확인 불가';
 if(previous.origin===location.origin)return '사이트 내부';
 const h=previous.hostname;
 for(const [domain,label] of [['instagram.com','Instagram'],['naver.com','Naver'],['naver.me','Naver'],['threads.com','Threads'],['threads.net','Threads'],['google.com','Google'],['google.co.kr','Google'],['kakao.com','Kakao']]){
  if(h===domain||h.endsWith('.'+domain))return label;
 }
 return '기타 외부';
}
// Only studio campaign codes and creative placements can enter the aggregate.
const campaignPattern=/^(?:booknight|jangsakkunclub|readingclub|bookclub|writing|rental|studio)(?:-20\d{4})?$/;
const creativePattern=/^(?:feed|story|reel|profile|post|poster)(?:-[1-9]\d?)?$/;
const code=params.get('utm_campaign')||'', creative=params.get('utm_content')||'';
const campaign=campaignPattern.test(code)?code+(creativePattern.test(creative)?'/'+creative:''):'';

const sessionKey='jakga.visit.context.v1', idle=30*60*1000;
const thresholds=[10,30,60,120,300,600];
let ctx, elapsed=0, shownAt=null, level=0, recorded=false, available=true;
function blocked(){return denied()||excluded()}
function forget(){ctx=null;recorded=false;shownAt=null;try{sessionStorage.removeItem(sessionKey)}catch{}}
function save(){try{sessionStorage.setItem(sessionKey,JSON.stringify(ctx))}catch{available=false}}
function shortPath(value){
 if(/^\/news\/news-\d{1,18}$/.test(value)||/^\/books\/[a-f0-9-]{36}$/.test(value))return value;
 if(['/','/space','/visit','/calendar','/books','/news','/programs','/programs/bookstore','/programs/book-club','/programs/writing-class','/programs/space-rental','/programs/event-planning'].includes(value))return value;
 return '/'+value.split('/')[1];
}
function marker(seconds){
 if(available)emit('transition',page,['route',ctx.source,ctx.trail.join(','),seconds].join('|'));
}
function begin(resume=false){
 if(blocked()){forget();return}
 let prior;
 try{prior=JSON.parse(sessionStorage.getItem(sessionKey));sessionStorage.setItem(sessionKey,'{}')}catch{available=false}
 const now=Date.now(),channel=source();
 const reload=performance.getEntriesByType('navigation')[0]?.type==='reload';
 const continued=!resume&&prior&&Array.isArray(prior.trail)&&now-prior.last<idle&&now>=prior.last&&
  (reload||(previous?.origin===location.origin&&channel==='사이트 내부'));
 const origin=continued?prior.source:resume||channel==='사이트 내부'?'직접·확인 불가':channel;
 const trail=continued?[...prior.trail,prior.page+'~'+prior.level].slice(-8):[];
 while(trail.join(',').length>128)trail.shift();
 ctx={source:origin,last:now,page:shortPath(page),level:0,trail};
 save();recorded=true;elapsed=0;level=0;shownAt=document.hidden?null:now;
 emit('page_view',page,continued?'사이트 내부':origin,campaign,available?(continued?'continue':'start'):'unknown');
 if(continued&&prior.page!==shortPath(page))emit('transition',prior.page,shortPath(page));
 marker(0);
}
function tick(){
 if(blocked()){forget();return}
 if(!recorded||!ctx||shownAt===null)return;
 const now=Date.now();
 elapsed+=Math.max(0,Math.min(now,ctx.last+idle)-shownAt);shownAt=now;
 while(level<thresholds.length&&elapsed>=thresholds[level]*1000){
  ctx.level=thresholds[level++];marker(ctx.level);save();
 }
}
function activity(){
 if(blocked()){forget();return}
 if(!recorded||Date.now()-ctx.last>=idle){tick();begin(true);return}
 tick();if(Date.now()-ctx.last>1000){ctx.last=Date.now();save()}
}
function show(){
 if(document.hidden){tick();shownAt=null;return}
 activity();shownAt=Date.now();
}
begin();
setInterval(tick,5000);
document.addEventListener('visibilitychange',show);
window.addEventListener('pagehide',()=>{tick();shownAt=null});
window.addEventListener('pageshow',e=>{if(e.persisted)begin()});
for(const name of ['pointerdown','keydown','scroll'])document.addEventListener(name,activity,{passive:true});
window.addEventListener('storage',()=>{if(blocked())forget()});
window.JakAnalytics=Object.freeze({track(name){if(name==='sms_signup_complete')emit('click',page,'문자 신청 완료')}});
document.addEventListener('click',e=>{
 const a=e.target.closest?.('button,a[href]');if(!a)return;
 let detail;
 if(a.id==='sms-subscribe-open')detail='문자 신청 열기';
 else if(a.matches('.sc-day:not(:disabled)'))detail='캘린더 날짜';
 else if(a.href){
  const u=new URL(a.href);
  if(u.protocol==='tel:')detail='전화 클릭';
  else if(u.protocol==='sms:')detail='문자 클릭';
  else if(u.protocol==='mailto:')detail='이메일 클릭';
  else if(['map.naver.com','naver.me','maps.google.com','map.kakao.com'].includes(u.hostname))detail='길찾기 클릭';
  else if(u.origin===location.origin&&valid.test(u.pathname))detail=(a.closest('nav,[role=navigation],header')?'메뉴 ':'링크 ')+u.pathname;
 }
 if(detail)emit('click',page,detail);
},{passive:true});
const settings=document.createElement('a');
settings.href='/visit-privacy.html';settings.textContent='개인정보처리방침 · 방문 분석 설정';
settings.style.cssText='display:inline-block;padding:8px;color:inherit;font:13px/1.6 system-ui';
(document.querySelector('footer')||document.body).append(settings);
})();