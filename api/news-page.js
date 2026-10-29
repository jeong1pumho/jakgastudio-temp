'use strict';
const {query,ready,esc,selected}=require('../lib/core');
const {renderContent}=require('../lib/rich');
const style="*{box-sizing:border-box}body{font-family:\"Apple SD Gothic Neo\",\"Malgun Gothic\",sans-serif;color:#3d3834;margin:0;background:#fff;line-height:1.7}a{color:inherit;text-decoration:none}button{font:inherit;cursor:pointer}\n.top{background:#302c29;color:#fff;padding:16px 0}.top-inner{max-width:1160px;margin:auto;padding:0 22px;display:flex;justify-content:space-between;align-items:center}.top a{font-size:13px}\n.wrap{max-width:1130px;padding:55px 24px 100px;margin:auto}.section-title{padding:10px 0 34px;border-bottom:1px solid #e4e0db;margin-bottom:36px}.eyebrow{font-size:13px;letter-spacing:.15em;color:#98785f}.eyebrow b{font-size:15px;margin-left:6px}\n.heading{display:flex;align-items:baseline;gap:15px;flex-wrap:wrap;margin:10px 0 0}.heading h1{font-size:32px;font-weight:600;margin:0;letter-spacing:-.05em}.heading span{color:#86786f;font-size:16px}\n.cards{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:44px 24px}.card{text-align:center}.card img,.image-blank{width:100%;aspect-ratio:4/3;object-fit:cover;display:block;background:#f5f1ec}.image-blank{display:flex;align-items:center;justify-content:center;color:#999}\n.card h2{font-size:19px;line-height:1.5;font-weight:500;margin:14px 0 7px;overflow-wrap:anywhere}\n.state{display:inline-block;font-size:12px;border-radius:20px;padding:4px 12px;background:#f2f2f1;color:#686561}.state.ongoing{background:#e9f0e9;color:#466c48}\n.post-title{text-align:center;font-size:29px;line-height:1.4;letter-spacing:-.05em;margin:15px 0 40px}.post-state{text-align:center;margin:-20px 0 35px}\n.photos{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}.photo-button{border:0;padding:0;cursor:zoom-in;background:#f5f3f0;display:block;width:100%}.photo-button img{width:100%;aspect-ratio:4/3;object-fit:cover;display:block}\n.content{max-width:920px;margin:54px auto;line-height:1.95;overflow-wrap:anywhere}.content .legacy-text{white-space:pre-wrap}.content h2{font-size:25px;font-weight:600;line-height:1.4}.content h3{font-size:20px;font-weight:600}.content p{margin:12px 0}.content ul,.content ol{padding-left:28px}.content a{text-decoration:underline;color:#836047}.content div[style*=\"center\"],.content p[style*=\"center\"],.content h2[style*=\"center\"],.content h3[style*=\"center\"]{text-align:center}\n.back{display:block;width:max-content;margin:65px auto 0;border:1px solid #c1b6ab;padding:12px 27px;font-size:14px}.back:hover{background:#f8f3ee}\n.viewer[hidden]{display:none!important}.viewer{position:fixed;inset:0;z-index:2000;background:rgba(11,10,9,.91);display:flex;justify-content:center;align-items:center;padding:65px 70px}.viewer img{width:auto;height:auto;max-width:100%;max-height:100%;object-fit:contain;user-select:none}\n.viewer button{position:absolute;border:0;border-radius:50%;width:44px;height:44px;background:rgba(255,255,255,.18);color:#fff;font-size:28px;line-height:1}.viewer button:hover{background:rgba(255,255,255,.35)}.viewer .close{top:15px;right:20px}.viewer .prev{left:12px;top:50%;transform:translateY(-50%)}.viewer .next{right:12px;top:50%;transform:translateY(-50%)}.viewer .count{position:absolute;bottom:20px;color:white;font-size:13px}body.viewer-open{overflow:hidden}\n@media(max-width:740px){.wrap{padding:38px 17px 70px}.heading h1{font-size:26px}.heading span{font-size:14px}.cards{grid-template-columns:repeat(2,minmax(0,1fr));gap:22px 12px}.card h2{font-size:15px}.photos{grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.post-title{font-size:23px}.viewer{padding:65px 45px}.viewer button{height:36px;width:36px;font-size:22px}}";
const lightboxJs="(()=>{const box=document.getElementById('viewer'),thumbs=[...document.querySelectorAll('[data-viewer]')],image=document.getElementById('viewerImage'),count=document.getElementById('count');let index=0,swipe=0;\nfunction display(i){index=(i+thumbs.length)%thumbs.length;const source=thumbs[index].querySelector('img');image.src=source.src;image.alt=source.alt;count.textContent=(index+1)+' / '+thumbs.length;}\nfunction open(i){display(i);box.hidden=false;document.body.classList.add('viewer-open');document.getElementById('close').focus();}\nfunction close(){box.hidden=true;image.removeAttribute('src');document.body.classList.remove('viewer-open');thumbs[index].focus();}\nthumbs.forEach((t,i)=>t.addEventListener('click',()=>open(i)));\ndocument.getElementById('close').addEventListener('click',close);\ndocument.getElementById('prev').addEventListener('click',()=>display(index-1));\ndocument.getElementById('next').addEventListener('click',()=>display(index+1));\nbox.addEventListener('click',e=>{if(e.target===box)close();});\ndocument.addEventListener('keydown',e=>{if(box.hidden)return;if(e.key==='Escape')close();if(e.key==='ArrowLeft')display(index-1);if(e.key==='ArrowRight')display(index+1);});\nbox.addEventListener('touchstart',e=>{swipe=e.changedTouches[0].clientX},{passive:true});box.addEventListener('touchend',e=>{const diff=e.changedTouches[0].clientX-swipe;if(Math.abs(diff)>40)display(index+(diff<0?1:-1));},{passive:true});\n})();";
function label(status){return status==='ongoing'?'진행중':'종료';}
function thumbnail(url,alt){return '<img src="'+esc(url)+'" alt="'+esc(alt)+'" loading="lazy" decoding="async">';}
function card(p){
 const cover=Array.isArray(p.images)?(p.images[p.cover_index]||p.images[0]):'';
 return '<a class="card" href="/news/'+encodeURIComponent(p.slug)+'">'+
 (cover?thumbnail(cover,p.title):'<div class="image-blank">사진 없음</div>')+
 '<h2>'+esc(p.title)+'</h2><span class="state '+(p.status==='ongoing'?'ongoing':'ended')+'">'+label(p.status)+'</span></a>';
}
module.exports=async(req,res)=>{
 try{
  if(req.method!=='GET')return res.status(405).end();
  if(!ready())return res.status(503).send('DB not configured');
  const urlPath=(req.url||'').split('?')[0];
  const slug=(typeof req.query?.slug==='string'?req.query.slug:'')|| (urlPath.includes('/news/')?decodeURIComponent(urlPath.split('/news/')[1]||''):'');
  const listing=!slug||slug==='news';
  if(!listing&&!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))return res.status(404).send('소식을 찾을 수 없습니다.');
  const q='/rest/v1/news_posts?select='+selected+(listing?'&order=sort_order.desc,published_at.desc.nullslast,created_at.desc&limit=300':'&slug=eq.'+encodeURIComponent(slug)+'&limit=1');
  const rows=await query(q);
  if(!listing&&!rows.length)return res.status(404).send('소식이 없습니다.');
  let body='',script='';
  if(listing){
    body='<div class="cards">'+rows.map(card).join('')+'</div>';
    if(!rows.length)body='<p style="text-align:center;margin:70px 0;color:#857a72">등록된 소식이 없습니다.</p>';
  } else {
    const p=rows[0],images=Array.isArray(p.images)?p.images.slice(0,20):[];
    body='<h2 class="post-title">'+esc(p.title)+'</h2><div class="post-state"><span class="state '+(p.status==='ongoing'?'ongoing':'ended')+'">'+label(p.status)+'</span></div>';
    body+='<div class="photos" id="photos">'+images.map((img,i)=>'<button type="button" class="photo-button" data-viewer="'+i+'" aria-label="'+(i+1)+'번째 사진 크게 보기">'+thumbnail(img,p.title+' 사진 '+(i+1))+'</button>').join('')+'</div>';
    body+='<article class="content">'+renderContent(p.content)+'</article>';
    if(images.length){
      body+='<div class="viewer" id="viewer" role="dialog" aria-modal="true" aria-label="사진 크게 보기" hidden><button class="close" id="close" type="button" aria-label="사진 닫기">×</button><button class="prev" id="prev" type="button" aria-label="이전 사진">‹</button><img id="viewerImage" alt=""><button class="next" id="next" type="button" aria-label="다음 사진">›</button><span class="count" id="count"></span></div>';
      script='<script>'+lightboxJs+'</script>';
    }
  }
  res.setHeader('Content-Type','text/html; charset=utf-8');
  res.setHeader('Cache-Control','no-store');
  res.setHeader('X-Robots-Tag','noindex, nofollow');
  res.end('<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>소식 | 진행 중인 프로그램과 새로운 소식 · 작가작업실 JEJU</title><style>'+style+'</style></head><body><header class="top"><div class="top-inner"><a href="/#news">작가작업실 JEJU</a><a href="/news">지난 소식 보기</a></div></header><main class="wrap"><div class="section-title"><p class="eyebrow">02 <b>NEWS</b></p><div class="heading"><h1>소식</h1><span>| 진행 중인 프로그램과 새로운 소식</span></div></div>'+body+'<a class="back" href="/#news">돌아가기</a></main>'+script+'</body></html>');
 }catch(e){res.status(e.status||500).send('운영 소식을 불러오지 못했습니다.');}
};
