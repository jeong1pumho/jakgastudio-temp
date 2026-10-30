'use strict';
const PRODUCTION_ORIGIN='https://www.jakgastudio.com';
const TEST_ORIGIN='https://jakgastudio-temp.vercel.app';
function isProduction(req){
  const host=String(req.headers.host||'').split(',')[0].trim().toLowerCase().replace(/:\d+$/,'');
  return host==='www.jakgastudio.com'||host==='jakgastudio.com';
}
function origin(req){return isProduction(req)?PRODUCTION_ORIGIN:TEST_ORIGIN;}
function xmlEscape(value){
  return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
}
function plainDescription(html,maxLength=160){
  const text=String(html??'')
   .replace(/<\s*br\b[^>]*>/gi,' ')
   .replace(/<\/(?:div|p|h2|h3|li)>/gi,' ')
   .replace(/<[^>]*>/g,' ')
   .replace(/&nbsp;|&#160;/gi,' ')
   .replace(/&amp;/gi,'&')
   .replace(/&quot;/gi,'"')
   .replace(/&#39;|&apos;/gi,"'")
   .replace(/&lt;/gi,'<').replace(/&gt;/gi,'>')
   .replace(/\s+/g,' ').trim();
  return Array.from(text).slice(0,maxLength).join('');
}
function isoDate(value){
  if(!value)return '';
  const parsed=new Date(value);
  return Number.isNaN(parsed.getTime())?'':parsed.toISOString();
}
function safeImage(value){
  try{const u=new URL(String(value||''));return u.protocol==='https:'?u.href:'';}catch{return '';}
}
function jsonLd(value){return JSON.stringify(value).replace(/</g,'\\u003c');}
module.exports={isProduction,origin,xmlEscape,plainDescription,isoDate,safeImage,jsonLd};
