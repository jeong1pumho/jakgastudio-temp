/* SPACE gallery data: preserve the approved grid and lightbox styles. */
(function(){
 'use strict';
 const grid=document.getElementById('space-gallery');
 if(!grid)return;
 async function load(){
  try{
   const response=await fetch('/api/space',{cache:'no-store'});
   if(!response.ok)throw Error('SPACE API '+response.status);
   const result=await response.json();
   if(!Array.isArray(result.images))throw Error('Invalid SPACE images');
   const images=result.images;
   const existing=[...grid.querySelectorAll('.space-gallery-item')];
   if(existing.length===images.length&&existing.every((node,i)=>
      node.dataset.full===images[i].src&&node.dataset.alt===images[i].alt))return;
   const frag=document.createDocumentFragment();
   images.forEach((item,i)=>{
    if(!item||typeof item.src!=='string')return;
    const button=document.createElement('button');
    button.type='button';button.className='gallery-photo space-gallery-item'+(i===0?' space-photo-primary':'');
    button.dataset.full=item.src;button.dataset.alt=item.alt||'작가작업실 JEJU 공간';
    button.setAttribute('aria-label',button.dataset.alt+' 사진 확대');
    const img=document.createElement('img');img.src=item.src;img.alt=button.dataset.alt;
    img.loading='lazy';img.decoding='async';button.appendChild(img);frag.appendChild(button);
   });
   if(!images.length){const empty=document.createElement('p');empty.textContent='공간 사진을 준비하고 있습니다.';empty.style.gridColumn='1 / -1';frag.appendChild(empty);}
   grid.replaceChildren(frag);
  }catch(e){console.warn('SPACE 사진 목록을 불러오지 못했습니다.',e);}
 }
 load();
})();
