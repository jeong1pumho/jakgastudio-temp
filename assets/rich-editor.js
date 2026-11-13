(() => {
  'use strict';
  window.initRichEditor = (editor, message) => {
    const $ = id => document.getElementById(id);
  // Rich text editor: safe clipboard conversion keeps pasted text editable.
  // Convert Word, Google Docs, web pages and plain-text clipboard content into
  // the limited safe HTML supported by both the editor and server sanitizer.
  // Notepad has no text styling to preserve, but its paragraphs remain fully editable.
  const escapePaste=s=>String(s??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const pasteFontNames=[
   [/맑은\s*고딕|malgun\s*gothic/i,'malgun'],
   [/나눔\s*고딕|nanum\s*gothic/i,'nanum-gothic'],
   [/나눔\s*명조|nanum\s*myeongjo/i,'nanum-myeongjo'],
   [/본고딕|noto\s*sans/i,'noto-sans'],
   [/본명조|noto\s*serif/i,'noto-serif'],
   [/카카오|kakao/i,'kakao'],
   [/gowun\s*dodum/i,'gowun-dodum'],
   [/gowun\s*batang/i,'gowun-batang'],
   [/ibm\s*plex/i,'ibm-plex'],
   [/gothic\s*a1/i,'gothic-a1']
  ];
  function pasteColor(input){
   const s=String(input||'').trim();
   if(/^#[0-9a-f]{6}$/i.test(s))return s.toLowerCase();
   if(/^#[0-9a-f]{3}$/i.test(s))return '#'+[...s.slice(1)].map(x=>x+x).join('').toLowerCase();
   const rgb=s.match(/^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*[\d.]+)?\s*\)$/i);
   if(rgb&&rgb.slice(1,4).every(n=>Number(n)<=255))
    return '#'+rgb.slice(1,4).map(n=>Number(n).toString(16).padStart(2,'0')).join('');
   return '';
  }
  function pasteSize(value){
   const v=String(value||'').trim().match(/^(\d+(?:\.\d+)?)\s*(px|pt)$/i);
   if(!v)return '';
   const n=Math.round(Number(v[1])*(v[2].toLowerCase()==='pt'?4/3:1));
   return n>=10&&n<=72?String(n):'';
  }
  function pastedHtmlToEditor(html){
   const body=new DOMParser().parseFromString(String(html),'text/html').body;
   const omit=new Set(['script','style','head','meta','iframe','object','embed','svg','math','canvas','video','audio','img','form','input','button','select','textarea']);
   const safeTags=new Set(['strong','b','em','i','u','s','ul','ol','li']);
   const structural=new Set(['p','div','h1','h2','h3','h4','h5','h6','blockquote']);
   function convert(node){
    if(node.nodeType===Node.TEXT_NODE)return escapePaste(node.nodeValue);
    if(node.nodeType!==Node.ELEMENT_NODE)return '';
    const tag=node.tagName.toLowerCase();
    if(omit.has(tag))return '';
    if(tag==='br')return '<br>';
    const children=[...node.childNodes].map(convert).join('');
    if(tag==='a'){
     const raw=node.getAttribute('href')||'';
     try{
      const url=new URL(raw);
      if(['https:','http:','mailto:'].includes(url.protocol))
       return '<a href="'+escapePaste(url.href)+'">'+children+'</a>';
     }catch{}
     return children;
    }
    let output=children;
    // Apply inline styles inside block/list elements so pasted Word markup
    // remains valid HTML; block tags cannot be children of a span/strong.
    const block=structural.has(tag)?(tag==='h1'?'h2':(['h2','h3'].includes(tag)?tag:'p')):'';
    const align=node.style.textAlign||node.getAttribute('align')||'';
    const alignStyle=/^(left|center|right|justify)$/i.test(align)?' style="text-align:'+align.toLowerCase()+'"':'';
    if(safeTags.has(tag)&&!['ul','ol','li'].includes(tag))output='<'+tag+'>'+output+'</'+tag+'>';
    else if(tag==='td'||tag==='th')output=output+' ';
    else if(tag==='hr')output='<br>';
    // Convert inline formatting stored in CSS (common in Word/Google Docs).
    const size=pasteSize(node.style.fontSize);
    const color=pasteColor(node.style.color||node.getAttribute('color'));
    const family=node.style.fontFamily||node.getAttribute('face')||'';
    const font=node.dataset.font||pasteFontNames.find(([regex])=>regex.test(family))?.[1]||'';
    const attrs=[];
    if(/^[a-z][a-z-]*$/.test(font))attrs.push('data-font="'+font+'"');
    const declarations=[];
    if(size)declarations.push('font-size:'+size+'px');
    if(color)declarations.push('color:'+color);
    if(declarations.length)attrs.push('style="'+declarations.join(';')+'"');
    if(attrs.length)output='<span '+attrs.join(' ')+'>'+output+'</span>';
    const weight=node.style.fontWeight;
    if(weight==='bold'||(Number(weight)>=600))output='<strong>'+output+'</strong>';
    if(node.style.fontStyle==='italic'||node.style.fontStyle==='oblique')output='<em>'+output+'</em>';
    if(node.style.textDecorationLine.includes('underline'))output='<u>'+output+'</u>';
    if(block)output='<'+block+alignStyle+'>'+(output||'<br>')+'</'+block+'>';
    else if(['ul','ol','li'].includes(tag))output='<'+tag+'>'+output+'</'+tag+'>';
    else if(tag==='tr')output='<p>'+output+'</p>';
    return output;
   }
   return [...body.childNodes].map(convert).join('');
  }
  function plainTextToEditor(text){
    return String(text||'').replace(/\r\n?/g,'\n').split('\n')
      .map(line=>'<p>'+(line?escapePaste(line):'<br>')+'</p>').join('');
  }
  function insertSafePaste(markup){
    const active=currentEditorRange();
    editor.focus();
    if(document.execCommand('insertHTML',false,markup))return;
    // Fallback for browsers where execCommand returns false.
    const sel=window.getSelection();
    const range=active||document.createRange();
    if(!active){range.selectNodeContents(editor);range.collapse(false);}
    range.deleteContents();
    const fragment=range.createContextualFragment(markup);
    const last=fragment.lastChild;
    range.insertNode(fragment);
    if(last){
      const caret=document.createRange();caret.setStartAfter(last);caret.collapse(true);
      sel.removeAllRanges();sel.addRange(caret);
    }
  }
  editor.addEventListener('paste',event=>{
    const clipboard=event.clipboardData;
    if(!clipboard)return;
    const html=clipboard.getData('text/html');
    const plain=clipboard.getData('text/plain');
    if(!html&&!plain)return;
    event.preventDefault();
    let markup=html?pastedHtmlToEditor(html):'';
    if(!markup||!markup.replace(/<[^>]*>/g,'').trim())markup=plainTextToEditor(plain);
    if(!markup)return;
    insertSafePaste(markup);
    selectedRange=null;
    $('editorFormatHint').textContent='붙여넣기 완료. 글자를 선택하면 서식 도구를 적용할 수 있습니다. 외부 문서의 지원되는 서식만 유지됩니다.';
  });


  editor.previousElementSibling.querySelectorAll('[data-command]').forEach(btn => {
    btn.addEventListener('mousedown',e=>e.preventDefault());
    btn.addEventListener('click',()=>{
      editor.focus();
      document.execCommand(btn.dataset.command,false,null);
    });
  });
  $('formatBlock').addEventListener('change',e=>{
    editor.focus();
    document.execCommand('formatBlock',false,e.target.value);
  });
  let selectedRange=null;
  function currentEditorRange(){
    const selection=window.getSelection();
    if(!selection||!selection.rangeCount)return null;
    const range=selection.getRangeAt(0);
    return editor.contains(range.startContainer)&&editor.contains(range.endContainer)?range:null;
  }
  function captureEditorRange(clearCollapsed=false){
    const range=currentEditorRange();
    if(!range)return;
    if(range.collapsed){
      if(clearCollapsed)selectedRange=null;
      return;
    }
    selectedRange=range.cloneRange();
  }
  // Freeze the text range before toolbar inputs take focus. Do not replace it
  // with a collapsed caret when the user opens a select or clicks the size field.
  const formatToolbar=editor.previousElementSibling;
  formatToolbar.addEventListener('pointerdown',()=>captureEditorRange(false));
  formatToolbar.addEventListener('mousedown',()=>captureEditorRange(false));
  editor.addEventListener('mouseup',()=>captureEditorRange(true));
  editor.addEventListener('keyup',()=>captureEditorRange(true));
  editor.addEventListener('input',()=>captureEditorRange(true));
  document.addEventListener('selectionchange',()=>captureEditorRange(false));
  function markInline(kind,rawValue){
    const fontIds=["noto-sans","kakao","ibm-plex","gothic-a1","nanum-gothic","gowun-dodum","black-han","do-hyeon","jua","sunflower","noto-serif","nanum-myeongjo","gowun-batang","hahmlet","song-myung","gaegu","gamja-flower","single-day","yeon-sung","nanum-pen","nanum-brush","poor-story","hi-melody","cute-font","default","malgun"];
    const size=Number(rawValue);
    if(kind==='font'&&!fontIds.includes(rawValue))return false;
    if(kind==='color'&&!/^#[0-9a-fA-F]{6}$/.test(String(rawValue)))return false;
    if(kind==='size'&&(!/^\d{1,3}$/.test(String(rawValue))||!Number.isInteger(size)||size<10||size>72))
      return false;
    const active=currentEditorRange();
    const valid=r=>r&&!r.collapsed&&editor.contains(r.startContainer)&&editor.contains(r.endContainer);
    // A live selection takes priority; otherwise apply to the saved range.
    const range=(valid(active)?active:valid(selectedRange)?selectedRange:null);
    if(!range){
      $('editorFormatHint').textContent='먼저 본문에서 서식을 바꿀 글자를 선택해 주세요.';
      return false;
    }
    const walker=document.createTreeWalker(editor,NodeFilter.SHOW_TEXT);
    const parts=[];
    let node;
    while((node=walker.nextNode())){
      if(!node.nodeValue||!range.intersectsNode(node))continue;
      const start=node===range.startContainer?range.startOffset:0;
      const end=node===range.endContainer?range.endOffset:node.nodeValue.length;
      if(end>start)parts.push({node,start,end});
    }
    if(!parts.length){
      $('editorFormatHint').textContent='서식을 적용할 글자를 다시 선택해 주세요.';
      return false;
    }
    const styled=[];
    for(const item of parts){
      let textNode=item.node;
      if(item.start>0)textNode=textNode.splitText(item.start);
      const count=item.end-item.start;
      if(count<textNode.nodeValue.length)textNode.splitText(count);
      // Reuse an existing one-text-node span so using the size spinner
      // repeatedly updates the same element instead of nesting spans.
      let span=textNode.parentNode;
      if(!(span&&span.nodeType===1&&span.tagName==='SPAN'&&span.childNodes.length===1&&span.firstChild===textNode)){
        span=document.createElement('span');
        textNode.replaceWith(span);
        span.appendChild(textNode);
      }
      if(kind==='font')span.dataset.font=rawValue;
      else if(kind==='size')span.style.fontSize=size+'px';
      else span.style.color=rawValue.toLowerCase();
      styled.push(textNode);
    }
    // Keep focus on the font-size input for repeated +/- adjustments.
    // The range stays usable even when the live browser selection disappears.
    const selection=document.createRange();
    selection.setStart(styled[0],0);
    selection.setEnd(styled[styled.length-1],styled[styled.length-1].nodeValue.length);
    selectedRange=selection.cloneRange();
    $('editorFormatHint').textContent='선택한 글자에 서식이 적용되었습니다. 저장 후에도 유지됩니다.';
    return true;
  }
  $('fontFamily').addEventListener('change',e=>{
    if(e.target.value)markInline('font',e.target.value);
  });
  const fontSizeInput=$('fontSize');
  function applySize(){
    const raw=fontSizeInput.value.trim();
    if(/^\d{1,3}$/.test(raw)&&Number(raw)>=10&&Number(raw)<=72)
      markInline('size',raw);
  }
  // Changing a number or using the up/down spinner applies immediately.
  // No extra "적용" click is required.
  fontSizeInput.addEventListener('input',applySize);
  fontSizeInput.addEventListener('change',applySize);
  fontSizeInput.addEventListener('keydown',e=>{
    if(e.key==='Enter'){e.preventDefault();applySize();}
  });


  const colorInput=$('fontColor'),hexInput=$('fontColorHex');
  function applyTextColor(raw){
    if(!/^#[0-9a-fA-F]{6}$/.test(raw))return;
    colorInput.value=raw;
    hexInput.value=raw.toUpperCase();
    markInline('color',raw);
  }
  colorInput.addEventListener('input',()=>applyTextColor(colorInput.value));
  colorInput.addEventListener('change',()=>applyTextColor(colorInput.value));
  hexInput.addEventListener('input',()=>{
    const value=hexInput.value.trim();
    if(/^#[0-9a-fA-F]{6}$/.test(value))applyTextColor(value);
  });
  hexInput.addEventListener('keydown',e=>{
    if(e.key==='Enter'){e.preventDefault();applyTextColor(hexInput.value.trim());}
  });
  // Only show local fonts that can also be delivered to every visitor as a webfont.
  $('localFontsButton').addEventListener('click',async()=>{
    if(typeof window.queryLocalFonts!=='function'){
      $('editorFormatHint').textContent='이 브라우저에서는 PC 폰트 확인을 지원하지 않습니다. 위 웹폰트는 계속 사용 가능합니다.';
      return;
    }
    try{
      const local=await window.queryLocalFonts();
      const norm=s=>String(s||'').normalize('NFKC').toLowerCase().replace(/[\s_-]/g,'');
      const installed=new Set(local.flatMap(f=>[f.family,f.fullName]).map(norm));
      let count=0;
      for(const opt of $('fontFamily').querySelectorAll('option[data-aliases]')){
        const matched=opt.dataset.aliases.split('|').some(f=>installed.has(norm(f)));
        if(matched)count++;
        opt.textContent=(matched?'✓ ':'')+opt.dataset.label+(matched?' (내 PC)':'');
      }
      $('editorFormatHint').textContent='PC에 설치된 웹 호환 폰트 '+count+'개를 ✓로 표시했습니다. 나머지 목록도 웹폰트로 제공됩니다.';
    }catch{
      $('editorFormatHint').textContent='PC 글꼴 접근 권한을 확인할 수 없습니다. 웹폰트 선택과 색상 기능은 정상 사용 가능합니다.';
    }
  });
  $('addLink').addEventListener('mousedown',e=>e.preventDefault());
  $('addLink').addEventListener('click',()=>{
    const href=window.prompt('링크 주소를 입력하세요 (https://...)');if(!href)return;
    try{const url=new URL(href.trim());if(!['https:','http:','mailto:'].includes(url.protocol))throw Error('프로토콜'); 
      editor.focus();if(selectedRange){const s=window.getSelection();s.removeAllRanges();s.addRange(selectedRange);}
      document.execCommand('createLink',false,url.href);
    }catch{message('http 또는 https 주소만 입력해 주세요.',true);}
  });

    return {
      getHtml() { return pastedHtmlToEditor(editor.innerHTML); },
      setContent(value, formatted) {
        selectedRange = null;
        if (formatted) editor.innerHTML = pastedHtmlToEditor(value);
        else editor.innerHTML = escapePaste(value).replace(/\r\n?|\n/g,'<br>');
        $('editorFormatHint').textContent = "글자를 선택한 뒤 글꼴·크기·색상을 바꾸면 즉시 적용됩니다. 저장 후 상세페이지에서도 유지됩니다.";
      },
    };
  };
})();
