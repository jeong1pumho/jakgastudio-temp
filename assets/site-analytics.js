(() => {
 'use strict';
 if(location.hostname!=='jakgastudio-temp.vercel.app'||/^\/(?:admin|api)(?:\/|$)/.test(location.pathname))return;
 const events=new Set(['directions_click','phone_click','contact_click','sms_signup_open','sms_signup_complete','calendar_day_select','event_detail_open','program_detail_open','book_detail_open']);
 const pending=[];
 let measurementId;
 const track=(name)=>{
  if(!events.has(name))return;
  if(measurementId)window.gtag('event',name,{send_to:measurementId});
  else if(pending.length<30)pending.push(name);
 };
 window.JakAnalytics=Object.freeze({track});

 document.addEventListener('click',event=>{
  if(!(event.target instanceof Element))return;
  if(event.target.closest('#sms-subscribe-open'))return track('sms_signup_open');
  if(event.target.closest('#sc-days button.sc-day:not(:disabled)'))return track('calendar_day_select');
  const anchor=event.target.closest('a[href]');
  if(!anchor)return;
  const url=new URL(anchor.href);
  if(url.protocol==='tel:')return track('phone_click');
  if(url.protocol==='mailto:')return track('contact_click');
  if(['map.naver.com','naver.me','maps.google.com','map.kakao.com'].includes(url.hostname))return track('directions_click');
  if(url.origin!==location.origin)return;
  if(/^\/(?:news\/[^/]+|calendar\/events\/[^/]+)\/?$/.test(url.pathname))track('event_detail_open');
  else if(/^\/programs\/[^/]+\/?$/.test(url.pathname))track('program_detail_open');
  else if(/^\/books\/[^/]+\/?$/.test(url.pathname))track('book_detail_open');
 });

 fetch('/api/admin?action=analytics',{cache:'no-store'}).then(response=>response.ok?response.json():null).then(config=>{
  if(!/^G-[A-Z0-9]+$/.test(config?.measurementId||''))return;
  measurementId=config.measurementId;
  window.dataLayer=window.dataLayer||[];
  window.gtag=function(){window.dataLayer.push(arguments);};
  const page=new URL(location.pathname,location.origin);
  const input=new URLSearchParams(location.search);
  for(const key of ['utm_source','utm_medium','utm_campaign','utm_content']){
   const value=input.get(key)||'';
   if(/^[a-z][a-z0-9_-]{0,63}$/i.test(value))page.searchParams.set(key,value);
  }
  let referrer='';
  try{const url=new URL(document.referrer);if(/^https?:$/.test(url.protocol))referrer=url.origin+'/';}catch{}
  window.gtag('js',new Date());
  window.gtag('config',measurementId,{send_page_view:false,allow_google_signals:false,allow_ad_personalization_signals:false,page_location:page.href,page_referrer:referrer});
  window.gtag('event','page_view',{send_to:measurementId,page_location:page.href,page_referrer:referrer});
  for(const name of pending.splice(0))track(name);
  const tag=document.createElement('script');
  tag.async=true;
  tag.src='https://www.googletagmanager.com/gtag/js?id='+measurementId;
  document.head.append(tag);
 }).catch(()=>{});
})();
