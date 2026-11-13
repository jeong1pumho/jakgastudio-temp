const {displayBrand}=require('./seo');
'use strict';
const {esc}=require('./core');
const optimized=require('./key-visual-optimized.json');
const initial=require('./key-visual-initial.json');
const mobileMedia='(max-width:700px) and (orientation:portrait)';
const desktopMedia='(min-width:701px), (orientation:landscape)';
function render(html,rows){
 const published=rows?.[0]?.slides;
 const slides=Array.isArray(published)&&published.length>=1&&published.length<=10?published:initial;
 const items=slides.map(item=>({desktop:optimized[item.desktop]?.desktop||item.desktop,mobile:optimized[item.mobile]?.mobile||item.mobile,alt:item.alt||''}));
 const slide=(item,i,clone=false)=>`<div class="kv-slide" role="group" aria-roledescription="슬라이드" aria-label="${i+1} / ${items.length}"${clone?' aria-hidden="true"':''}><picture class="kv-mobile-picture"><source media="${mobileMedia}" srcset="${esc(item.mobile)}"><img src="${esc(item.desktop)}" alt="${clone?'':esc(displayBrand(item.alt))}" draggable="false" loading="${i===0&&!clone?'eager':'lazy'}" decoding="async"${i===0&&!clone?' fetchpriority="high"':''}></picture></div>`;
 const viewport=`<div class="kv-carousel-viewport" id="kv-carousel" role="region" aria-roledescription="캐러셀" aria-label="작가작업실 제주의 ${items.length}장 사진"><div class="kv-carousel-track" id="kv-carousel-track">${slide(items.at(-1),items.length-1,true)}${items.map((item,i)=>slide(item,i)).join('')}${slide(items[0],0,true)}</div></div>\n  `;
 const start=html.indexOf('<div class="kv-carousel-viewport" id="kv-carousel"'),end=html.indexOf('<div class="kv-carousel-scrim"',start);
 if(start<0||end<0)throw Error('Key visual template markers missing');
 html=html.slice(0,start)+viewport+html.slice(end);
 html=html.replace(/(<div class="kv-carousel-dots"[^>]*>)[\s\S]*?(<\/div>)/,(_,open,close)=>open+items.map((_,i)=>`<button type="button" class="kv-dot" data-slide="${i+1}" aria-label="${i+1}번 사진 보기" aria-current="${i===0}"></button>`).join('')+close);
 html=html.replace(/(<span class="sr-only" id="kv-carousel-status"[^>]*>)[^<]*/,`$1사진 1 / ${items.length}`);
 const preload=`<link rel="preload" as="image" href="${esc(items[0].desktop)}" media="${desktopMedia}" fetchpriority="high"><link rel="preload" as="image" href="${esc(items[0].mobile)}" media="${mobileMedia}" fetchpriority="high">`;
 return html.replace('<meta charset="utf-8"/>','<meta charset="utf-8"/>'+preload);
}
module.exports={render};
