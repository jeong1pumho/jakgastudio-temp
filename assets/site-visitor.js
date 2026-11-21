(()=>{
'use strict';
if(location.hostname!=='jakgastudio-temp.vercel.app'||/^\/(?:admin|api)(?:\/|$)/.test(location.pathname))return;
const ck='jakgastudio.visitor-insights-consent.v1',ex='jakgastudio.analytics-excluded.v1',last='jakgastudio.visit-last-path.v1';
const exclusionCookie='jakgastudio_analytics_excluded_v1';
const excluded=()=>{
 const value=document.cookie.split(';').map(x=>x.trim()).find(x=>x.startsWith(exclusionCookie+'='))?.slice(exclusionCookie.length+1);
 if(value==='1'||value==='0')return value==='1';
 return get(ex)==='1';
};
const valid=/^\/(?:$|news(?:\/[a-z0-9-]{1,90})?|books(?:\/[a-z0-9-]{1,90})?|calendar(?:\/events\/[a-f0-9-]{36})?|programs(?:\/[a-z0-9-]{1,90})?|space|visit)$/i;
const page=valid.test(location.pathname)?location.pathname:null;
function get(k,s=localStorage){try{return s.getItem(k)}catch{return null}}
function put(k,v,s=localStorage){try{s.setItem(k,v)}catch{}}
if(excluded())return;
// A previously open public tab must stop tracking when the admin excludes this browser.
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&excluded())location.reload();});
window.addEventListener('pageshow',()=>{if(excluded())location.reload();});
window.addEventListener('storage',event=>{
 if((event.key===ex||event.key===null)&&excluded())location.reload();
});
function emit(kind,path,detail){
 if(get(ck)!=='yes'||excluded()||!path||!valid.test(path))return;
 fetch('/api/visit-analytics',{method:'POST',headers:{'Content-Type':'application/json'},
 body:JSON.stringify({kind,path,detail}),keepalive:true,credentials:'omit'}).catch(()=>{});
}
function source(){
 const utm=new URLSearchParams(location.search).get('utm_source')?.toLowerCase();
 if(['naver','google','instagram','threads','kakao'].includes(utm))return utm;
 if(!document.referrer)return '직접 방문';
 try{const h=new URL(document.referrer).hostname;
  if(h===location.hostname)return '사이트 내부';
  for(const [re,label] of [[/(^|\.)google\./,'Google'],[/(^|\.)naver\.com$/,'Naver'],[/(^|\.)instagram\.com$/,'Instagram'],[/(^|\.)threads\.(com|net)$/,'Threads']])if(re.test(h))return label;
  return '기타 외부';
 }catch{return '출처 미확인'}
}
function clarity(id){
 if(!/^[a-z0-9]{5,24}$/i.test(id||'')||excluded()||window.clarity)return;
 (function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
 t=l.createElement(r);t.async=1;t.src='https://www.clarity.ms/tag/'+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
 })(window,document,'clarity','script',id);
}
function start(){
 if(!page||get(ck)!=='yes'||excluded())return;
 emit('page_view',page,source());
 const before=get(last,sessionStorage);
 if(before&&before!==page&&valid.test(before))emit('transition',before,page);
 put(last,page,sessionStorage);
 fetch('/api/visit-analytics?config=1',{cache:'no-store'}).then(x=>x.ok?x.json():null).then(x=>{if(get(ck)==='yes'&&!excluded())clarity(x?.projectId)}).catch(()=>{});
}
document.addEventListener('click',e=>{
 if(!page||get(ck)!=='yes'||excluded()||!(e.target instanceof Element))return;
 const a=e.target.closest('a[href],button');if(!a)return;
 let detail='';
 if(a.matches('a[href]')){
  const href=a.getAttribute('href')||'';
  if(href.startsWith('tel:'))detail='전화 클릭';
  else if(href.startsWith('mailto:'))detail='이메일 클릭';
  else if(/(?:map\.naver\.com|naver\.me|maps\.google|map\.kakao)/.test(href))detail='길찾기 클릭';
  else try{const url=new URL(a.href);if(url.origin===location.origin&&valid.test(url.pathname))detail='내부 링크 클릭'}catch{}
 }else if(a.id==='sms-subscribe-open')detail='문자 신청 열기';
 else if(a.matches('.sc-day'))detail='캘린더 날짜';
 if(detail)emit('click',page,detail);
},{passive:true});
// A visitor can withdraw or renew analytics consent without clearing site data.
const settings=document.createElement('button');
settings.type='button';settings.textContent='방문 분석 설정';
settings.style.cssText='border:0;background:transparent;color:#75685d;cursor:pointer;font:12px/1.5 system-ui,sans-serif;text-decoration:underline;padding:6px';
settings.addEventListener('click',()=>{
 const choice=window.confirm('추가 방문 분석(Microsoft Clarity 및 페이지 이동·클릭 집계)에 동의하시겠습니까?\n확인: 동의 / 취소: 거부');
 put(ck,choice?'yes':'no');location.reload();
});
const footer=document.querySelector('footer');
if(footer)footer.append(settings);
else{settings.style.cssText+=';position:fixed;z-index:99998;bottom:6px;right:6px;background:#fff';document.body.append(settings);}
if(get(ck)==='yes'){start();return}if(get(ck)==='no')return;
const banner=document.createElement('aside');
banner.setAttribute('aria-label','방문 분석 동의');
banner.style.cssText='position:fixed;z-index:99999;bottom:14px;left:14px;right:14px;max-width:470px;padding:15px 18px;background:#f9f7f3;color:#352d27;border:1px solid #c9b9a8;box-shadow:0 5px 22px #0002;border-radius:9px;font:13px/1.6 system-ui,sans-serif';
const p=document.createElement('p');p.textContent='홈페이지 개선을 위해 방문 페이지·이동 경로·클릭을 집계하고, 동의 시 Microsoft Clarity로 이용 화면을 분석합니다. 입력한 연락처와 이름은 분석 이벤트에 저장하지 않습니다.';p.style.margin='0 0 10px';
const actions=document.createElement('div');actions.style.cssText='display:flex;gap:8px;justify-content:flex-end';
for(const [label,value] of [['거부','no'],['동의','yes']]){
 const b=document.createElement('button');b.type='button';b.textContent=label;b.style.cssText='cursor:pointer;padding:6px 14px;border:1px solid #b5a08d;border-radius:4px;background:'+(value==='yes'?'#3e5847':'#fff')+';color:'+(value==='yes'?'#fff':'#352d27');
 b.addEventListener('click',()=>{put(ck,value);banner.remove();if(value==='yes')start()});actions.append(b);
}
banner.append(p,actions);document.body.append(banner);
})();