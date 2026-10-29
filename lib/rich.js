'use strict';
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, x => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
const ALLOWED = new Set(['p','div','br','strong','b','em','i','u','s','h2','h3','ul','ol','li','a','span']);
function decodeEntities(s){
 return s.replace(/&(#x[0-9a-f]+|#[0-9]+|amp|lt|gt|quot|apos|nbsp|#39);/gi,(full,n)=>{
 const named={amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:' ', '#39':"'"};
 const lower=n.toLowerCase();if(Object.prototype.hasOwnProperty.call(named,lower))return named[lower];
 let code=lower.startsWith('#x')?parseInt(lower.slice(2),16):parseInt(lower.slice(1),10);
 if(!Number.isFinite(code)||code<32||code>0x10ffff||code>=0xd800&&code<=0xdfff)return '';
 return String.fromCodePoint(code);
 });
}
function cleanHtml(input){
 const s=String(input??'').slice(0,120000);const out=[];const tokens=s.match(/<[^>]*>|[^<]+|</g)||[];
 for(const token of tokens){
   if(!token.startsWith('<')||!token.endsWith('>')){out.push(escapeHtml(decodeEntities(token)));continue;}
   if(/^<!--/.test(token))continue;
   const tag=token.match(/^<\s*(\/?)\s*([a-z0-9]+)/i);
   if(!tag)continue;
   const name=tag[2].toLowerCase();if(!ALLOWED.has(name))continue;
   if(tag[1]){if(name!=='br')out.push('</'+name+'>');continue;}
   let attrs='';
   if(['p','div','h2','h3','span'].includes(name)){
     const align=token.match(/(?:text-align\s*:\s*|align\s*=\s*["']?)(left|center|right|justify)\b/i);
     const safeStyles=[];
     if(align)safeStyles.push('text-align:'+align[1].toLowerCase());
     if(name==='span'){
       // Persist only permitted font IDs and bounded numeric pixel sizes, never arbitrary CSS.
       const matchFont=token.match(/\bdata-font\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
       const font=matchFont&&(matchFont[1]||matchFont[2]||matchFont[3]);
       if(['default','kakao','noto-sans','noto-serif','malgun'].includes(font))attrs+=' data-font="'+font+'"';
       const matchStyle=token.match(/\bstyle\s*=\s*(?:"([^"]*)"|'([^']*)')/i);
       const rawStyle=matchStyle&&(matchStyle[1]||matchStyle[2])||'';
       const sizeDeclaration=rawStyle.split(';').map(s=>s.trim()).find(s=>/^font-size\s*:\s*\d{1,3}px$/i.test(s));
       if(sizeDeclaration){
         const size=Number(sizeDeclaration.split(':')[1].trim().slice(0,-2));
         if(Number.isInteger(size)&&size>=10&&size<=72)safeStyles.push('font-size:'+size+'px');
       }
     }
     if(safeStyles.length)attrs+=' style="'+safeStyles.join(';')+'"';
   }
   if(name==='a'){
     const ref=token.match(/\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
     if(ref){try{const url=new URL(decodeEntities(ref[1]||ref[2]||ref[3]));if(['https:','http:','mailto:'].includes(url.protocol))attrs+=' href="'+escapeHtml(url.href)+'" rel="noopener noreferrer"';}catch{}}
   }
   out.push('<'+name+attrs+'>');
 }
 return out.join('');
}
function renderContent(content){
 const value=String(content??'');
 if(!/<\s*\/?\s*(p|div|strong|b|em|i|u|s|h2|h3|ul|ol|li|a|span|br)\b/i.test(value))
   return '<div class="legacy-text">'+escapeHtml(value)+'</div>';
 return cleanHtml(value);
}
module.exports={cleanHtml,escapeHtml,renderContent};