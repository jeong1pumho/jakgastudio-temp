
(function(){
 const modal=document.getElementById('lightbox');
 const close=modal.querySelector('.lightbox-close');
 const prev=modal.querySelector('.space-lightbox-prev');
 const next=modal.querySelector('.space-lightbox-next');
 const modalImg=modal.querySelector('img');
 const caption=modal.querySelector('.lightbox-caption');
 const grid=document.getElementById('space-gallery');
 const photos=()=>[...grid.querySelectorAll('.space-gallery-item')];
 let last=null,currentIndex=0,touchStart=null;
 function showPhoto(index,animate){
  const list=photos();
   if(!list.length)return;
   currentIndex=(index+list.length)%list.length;
   const photo=list[currentIndex];
  modalImg.src=photo.dataset.full;
  modalImg.alt=photo.dataset.alt||'공간소개 사진';
  caption.textContent=photo.dataset.alt||'';
  if(animate){
   modalImg.classList.remove('space-lightbox-photo-in');
   void modalImg.offsetWidth;
   modalImg.classList.add('space-lightbox-photo-in');
  }
 }
 function hide(){
  modal.hidden=true;
  modalImg.classList.remove('space-lightbox-photo-in');
  document.body.classList.remove('dialog-open');
  if(last?.isConnected)last.focus();
 }
 grid.addEventListener('click',e=>{
   const photo=e.target.closest('.space-gallery-item');
   if(!photo||!grid.contains(photo))return;
   last=photo;
   showPhoto(photos().indexOf(photo),false);
   modal.hidden=false;
   document.body.classList.add('dialog-open');
   close.focus();
  });
 prev.addEventListener('click',()=>showPhoto(currentIndex-1,true));
 next.addEventListener('click',()=>showPhoto(currentIndex+1,true));
 close.addEventListener('click',hide);
 modal.addEventListener('click',e=>{if(e.target===modal)hide()});
 document.addEventListener('keydown',e=>{
  if(modal.hidden)return;
  if(e.key==='Tab'){const controls=[close,prev,next];const i=controls.indexOf(document.activeElement);e.preventDefault();controls[(i+(e.shiftKey?-1:1)+controls.length)%controls.length].focus();}
  else if(e.key==='Escape'){e.preventDefault();hide();}
  else if(e.key==='ArrowLeft'){e.preventDefault();showPhoto(currentIndex-1,true);}
  else if(e.key==='ArrowRight'){e.preventDefault();showPhoto(currentIndex+1,true);}
 });
 modalImg.addEventListener('touchstart',e=>{
  if(e.touches.length===1)touchStart={x:e.touches[0].clientX,y:e.touches[0].clientY};
  else touchStart=null;
 },{passive:true});
 modalImg.addEventListener('touchend',e=>{
  if(!touchStart||e.changedTouches.length!==1){touchStart=null;return;}
  const dx=e.changedTouches[0].clientX-touchStart.x;
  const dy=e.changedTouches[0].clientY-touchStart.y;
  touchStart=null;
  if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)*1.2)showPhoto(currentIndex+(dx<0?1:-1),true);
 },{passive:true});
 modalImg.addEventListener('touchcancel',()=>{touchStart=null;},{passive:true});
})();
