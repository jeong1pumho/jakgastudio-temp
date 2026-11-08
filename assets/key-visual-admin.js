'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const message = text => { $('message').textContent = text; };
  const session = window.JAKAdminSession;
  const token = session?.read();
  const list = $('list');
  const cropDialog = $('cropDialog');
  const canvas = $('cropCanvas');
  const context = canvas.getContext('2d');
  const previewDialog = $('previewDialog');
  const ranges = ['cropX','cropY','cropSize'].map($);
  let slides = [], revision = 0, busy = false, editIndex = -1, crop, previewSlide, drag;

  async function api(path, options = {}) {
    const response = await fetch(path, {...options, headers:{
      Authorization:'Bearer '+token, 'Content-Type':'application/json'
    }});
    const data = await response.json();
    if (!response.ok) throw Error(data.error || '요청에 실패했습니다.');
    return data;
  }
  function button(label, action, disabled = false) {
    const el = document.createElement('button');
    el.type = 'button'; el.textContent = label; el.disabled = disabled;
    el.addEventListener('click', action);
    return el;
  }
  function release(item) {
    Object.values(item.pending || {}).forEach(file => URL.revokeObjectURL(file.preview));
  }
  function photo(item, mode) {
    return item.pending?.[mode]?.preview || item[mode];
  }
  function render() {
    $('add').disabled = busy || slides.length >= 10;
    $('publish').disabled = busy || !slides.length;
    $('count').textContent = slides.length+' / 10장';
    list.replaceChildren(...slides.map((item, i) => {
      const card = document.createElement('li');
      card.className = 'card';
      const img = document.createElement('img');
      img.className = 'thumb'; img.src = photo(item,'desktop'); img.alt = '';
      const details = document.createElement('div'); details.className = 'details';
      const label = document.createElement('label');
      label.textContent = (i+1)+'번 사진 설명 ';
      const input = document.createElement('input'); input.value = item.alt;
      input.maxLength = 150; input.required = true; input.disabled = busy;
      input.placeholder = '사진에 보이는 내용을 입력하세요';
      input.addEventListener('input',()=>{item.alt=input.value;});
      label.append(input);
      const actions = document.createElement('div'); actions.className = 'actions';
      const move = direction => {
        [slides[i],slides[i+direction]] = [slides[i+direction],slides[i]]; render();
      };
      actions.append(
        button('위로',()=>move(-1),busy || i===0),
        button('아래로',()=>move(1),busy || i===slides.length-1),
        button('PC·모바일 미리보기',()=>{previewSlide=item; showPreview('fhd'); previewDialog.showModal();}),
        button('원본 선택·크롭',()=>choose(i),busy),
        button('목록에서 제거',()=>{release(item);slides.splice(i,1);render();},busy)
      );
      details.append(label,actions); card.append(img,details); return card;
    }));
  }
  function showPreview(mode) {
    const mobile = mode==='mobile';
    $('previewPhoto').src = photo(previewSlide,mobile?'mobile':'desktop');
    $('previewPhoto').alt = previewSlide.alt;
    $('previewFrame').classList.toggle('mobile',mobile);
    $('previewInfo').textContent = {fhd:'Full HD · 1920 × 1080',qhd:'QHD · 2560 × 1440',mobile:'모바일 · 9:16'}[mode]+' 화면 비율 미리보기';
    previewDialog.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===mode)));
  }
  previewDialog.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>showPreview(b.dataset.mode)));
  function choose(i) {editIndex=i; $('file').value=''; $('file').click();}
  $('add').addEventListener('click',()=>choose(-1));
  $('file').addEventListener('change',async () => {
    const [file] = $('file').files;
    if (!file) return;
    if (!['image/jpeg','image/png','image/webp','image/avif'].includes(file.type) || file.size > 30*1024*1024) {
      message('JPG·PNG·WebP·AVIF 파일을 30MB 이하로 선택해 주세요.'); return;
    }
    const url = URL.createObjectURL(file);
    try {
      const image = new Image(); image.src=url; await image.decode();
      crop = {image,url,mode:'desktop',pending:{}};
      setCropMode('desktop'); cropDialog.showModal();
    } catch {
      URL.revokeObjectURL(url); crop=null; message('사진 파일을 열 수 없습니다.');
    }
  });
  function setCropMode(mode) {
    crop.mode = mode;
    ranges[0].value=50; ranges[1].value=50; ranges[2].value=100;
    $('cropTitle').textContent=mode==='desktop'?'PC 영역 선택 (16:9)':'모바일 영역 선택 (9:16)';
    $('acceptCrop').textContent=mode==='desktop'?'모바일 영역 선택하기':'두 크롭 적용';
    const {naturalWidth:w,naturalHeight:h}=crop.image;
    const scale=Math.min(1,650/w,480/h);
    canvas.width=Math.max(1,Math.round(w*scale)); canvas.height=Math.max(1,Math.round(h*scale));
    draw();
  }
  function bounds() {
    const {naturalWidth:w,naturalHeight:h}=crop.image;
    const [rw,rh]=crop.mode==='desktop'?[16,9]:[9,16];
    const units=Math.max(1,Math.floor(Math.min(w/rw,h/rh)*Number(ranges[2].value)/100));
    const width=units*rw,height=units*rh;
    return {x:Math.round((w-width)*Number(ranges[0].value)/100),
      y:Math.round((h-height)*Number(ranges[1].value)/100),width,height};
  }
  function draw() {
    const {image,mode}=crop;
    const {x,y,width,height}=bounds();
    const w=canvas.width,h=canvas.height,sx=w/image.naturalWidth,sy=h/image.naturalHeight;
    const left=x*sx,top=y*sy,right=(x+width)*sx,bottom=(y+height)*sy;
    context.drawImage(image,0,0,w,h);
    context.fillStyle='#0009';
    context.fillRect(0,0,w,top); context.fillRect(0,bottom,w,h-bottom);
    context.fillRect(0,top,left,bottom-top); context.fillRect(right,top,w-right,bottom-top);
    context.strokeStyle='#ffef32'; context.lineWidth=2;
    context.strokeRect(left,top,right-left,bottom-top);
    $('dimensions').textContent=width+' × '+height+' px'+(mode==='desktop'&&width<2560?' · QHD 권장 너비 2560px 미만':'');
  }
  ranges.forEach(r=>r.addEventListener('input',draw));
  canvas.addEventListener('pointerdown',event=>{
    canvas.setPointerCapture(event.pointerId);
    drag={...bounds(),clientX:event.clientX,clientY:event.clientY};
  });
  canvas.addEventListener('pointermove',event=>{
    if (!drag || !canvas.hasPointerCapture(event.pointerId)) return;
    const rect=canvas.getBoundingClientRect(),w=crop.image.naturalWidth,h=crop.image.naturalHeight;
    if (w>drag.width) ranges[0].value=(drag.x+(event.clientX-drag.clientX)*w/rect.width)*100/(w-drag.width);
    if (h>drag.height) ranges[1].value=(drag.y+(event.clientY-drag.clientY)*h/rect.height)*100/(h-drag.height);
    draw();
  });
  canvas.addEventListener('lostpointercapture',()=>{drag=null;});
  $('cancelCrop').addEventListener('click',()=>cropDialog.close());
  cropDialog.addEventListener('cancel',event=>{if($('acceptCrop').disabled)event.preventDefault();});
  cropDialog.addEventListener('close',()=>{
    if(!crop)return;
    release(crop); URL.revokeObjectURL(crop.url); crop=null;
  });
  $('acceptCrop').addEventListener('click',async () => {
    const accept=$('acceptCrop'),cancel=$('cancelCrop');
    accept.disabled=true;cancel.disabled=true;
    try {
      const {x,y,width,height}=bounds();
      if (width<9 || height<9 || x<0 || y<0) throw Error('크롭할 수 있는 크기의 원본을 선택해 주세요.');
      const output=document.createElement('canvas'); output.width=width; output.height=height;
      output.getContext('2d').drawImage(crop.image,x,y,width,height,0,0,width,height);
      const blob=await new Promise(resolve=>output.toBlob(resolve,'image/png'));
      if (!blob || blob.size > 24*1024*1024) throw Error('크롭 이미지가 24MB를 초과합니다. 선택 영역을 줄이거나 용량이 작은 원본을 사용해 주세요.');
      crop.pending[crop.mode]={blob,preview:URL.createObjectURL(blob)};
      if(crop.mode==='desktop'){setCropMode('mobile');return;}
      const item={alt:slides[editIndex]?.alt || '',pending:crop.pending};
      if(editIndex===-1)slides.push(item);
      else{release(slides[editIndex]);slides[editIndex]=item;}
      crop.pending={};cropDialog.close();render();message('크롭을 적용했습니다. 발행하면 홈페이지에 표시됩니다.');
    }catch(error){$('dimensions').textContent=error.message;}
    finally{accept.disabled=false;cancel.disabled=false;}
  });
  async function upload(file, config) {
    if(file.url)return file.url;
    const name=crypto.randomUUID()+'.png';
    const base=config.url+'/storage/v1/object/';
    const response=await fetch(base+'key-visual/'+name,{method:'POST',
      headers:{apikey:config.key,Authorization:'Bearer '+token,'Content-Type':'image/png','x-upsert':'false'},body:file.blob});
    if(!response.ok)throw Error('사진 업로드에 실패했습니다. (HTTP '+response.status+')');
    file.url=base+'public/key-visual/'+name;
    return file.url;
  }
  $('publish').addEventListener('click',async () => {
    if(busy)return;
    if(slides.some(item=>!item.alt.trim())){message('모든 사진에 설명을 입력해 주세요.');return;}
    busy=true;render();message('사진을 업로드하고 있습니다…');
    try {
      const config=await api('/api/admin?action=config');
      if(config.url!=='https://qrbavxempotptnmflqoq.supabase.co')throw Error('테스트 저장소 연결을 확인해 주세요.');
      const published=[];
      for(const item of slides){
        const desktop=item.pending?await upload(item.pending.desktop,config):item.desktop;
        const mobile=item.pending?await upload(item.pending.mobile,config):item.mobile;
        published.push({desktop,mobile,alt:item.alt.trim()});
      }
      const saved=await api('/api/key-visual',{method:'PUT',body:JSON.stringify({slides:published,revision})});
      slides.forEach(release);slides=published;revision=saved.revision;message('테스트 홈페이지에 반영했습니다.');
    }catch(error){message('반영 실패 · '+error.message);}
    finally{busy=false;render();}
  });
  async function init() {
    if(!token){message('관리자 홈에서 로그인한 뒤 다시 열어 주세요.');return;}
    try {
      const data=await api('/api/key-visual?admin=1');
      slides=data.slides;revision=data.revision;
      $('editor').hidden=false;render();
    }catch(error){message(error.message);}
  }
  init();
})();
