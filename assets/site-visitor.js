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
function emit(kind,path,detail,campaign=''){
 if(denied()||excluded()||!valid.test(path))return;
 fetch('/api/visit-analytics',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',
  referrerPolicy:'no-referrer',keepalive:true,body:JSON.stringify({kind,path,detail,campaign})}).catch(()=>{});
}
function externalAllowed(){
 return !excluded()&&!denied()&&!document.hidden&&!location.search&&!location.hash;
}
async function startExternal(){
 if(!externalAllowed())return;
 const response=await fetch('/api/visit-analytics?config=2',{cache:'no-store',referrerPolicy:'no-referrer'});
 if(!response.ok)return;
 const ids=await response.json();
 if(!externalAllowed())return;
 const addScript=src=>{
  const script=document.createElement('script');
  script.async=true;script.referrerPolicy='no-referrer';script.src=src;document.head.append(script);
 };
 let active=false;
 if(/^G-[A-Z0-9]+$/.test(ids.ga||'')){
  active=true;
  window.dataLayer=window.dataLayer||[];
  function gtag(){window.dataLayer.push(arguments)}
  window.gtag=gtag;
  gtag('consent','default',{analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
  gtag('set','ads_data_redaction',true);
  gtag('js',new Date());
  gtag('config',ids.ga,{send_page_view:false,allow_google_signals:false,allow_ad_personalization_signals:false,page_location:location.origin+page,page_referrer:'',page_title:'공개 페이지'});
  gtag('event','page_view',{send_to:ids.ga});
  addScript('https://www.googletagmanager.com/gtag/js?id='+ids.ga);
 }
 if(/^[a-z0-9]{5,24}$/i.test(ids.clarity||'')){
  active=true;
  document.documentElement.setAttribute('data-clarity-mask','true');
  window.clarity=function(){(window.clarity.q=window.clarity.q||[]).push(arguments)};
  window.clarity('consentv2',{ad_Storage:'denied',analytics_Storage:'denied'});
  addScript('https://www.clarity.ms/tag/'+ids.clarity);
 }
 if(active){
  const stop=()=>{if(excluded()||denied()){if(ids.ga)window['ga-disable-'+ids.ga]=true;window.clarity?.('stop');location.reload()}};
  window.addEventListener('storage',stop);window.addEventListener('pageshow',stop);document.addEventListener('visibilitychange',stop);
 }
}
startExternal().catch(()=>{});
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
emit('page_view',page,source(),campaign);
if(previous?.origin===location.origin&&previous.pathname!==page&&valid.test(previous.pathname))
 emit('transition',previous.pathname,page);
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