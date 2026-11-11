(()=>{
 'use strict';
 const key='jeju-navigation-source';
 const local=value=>{try{const u=new URL(value,location.href);return u.origin===location.origin?u:null;}catch{return null;}};
 const ref=document.referrer?local(document.referrer):null;
 let previous=ref&&ref.href!==location.href?ref.href:null;
 try{const saved=JSON.parse(sessionStorage.getItem(key)||'null');if(saved&&saved.to===location.href&&Date.now()-saved.at<300000&&ref){const from=local(saved.from);if(from&&from.pathname===ref.pathname&&from.search===ref.search)previous=from.href;}}catch{}
 // Keep the entry's return destination stable across reloads and browser back/forward.
 const stored=local(history.state?.jejuReturn||'');
 if(history.state?.jejuReturn&&stored&&stored.href!==location.href)previous=stored.href;
 else if(previous)history.replaceState({...history.state,jejuReturn:previous},'');
 window.jejuGoBack=fallback=>{if(previous&&history.length>1)history.back();else location.assign(previous||fallback);};
 document.querySelectorAll('[data-page-return]').forEach(link=>{
  if(previous)link.href=previous;
  link.addEventListener('click',event=>{
   if(previous&&history.length>1&&!event.ctrlKey&&!event.metaKey&&!event.shiftKey&&!event.altKey&&event.button===0){event.preventDefault();history.back();}
  });
 });
 document.addEventListener('click',event=>{
  const link=event.target.closest('a[href]');if(!link||link.hasAttribute('data-page-return')||link.hasAttribute('download'))return;
  const target=local(link.href);if(!target)return;
  try{sessionStorage.setItem(key,JSON.stringify({from:location.href,to:target.href,at:Date.now()}));}catch{}
 });
})();
