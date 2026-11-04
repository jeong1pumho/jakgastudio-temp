'use strict';
const {root,key,ready,esc,selected}=require('../lib/core');
const {origin,safeImage,jsonLd}=require('../lib/seo');
const typeNames={reading:'독서',writing:'글쓰기',themed:'주제모임',special:'특별행사'};
const opNames={studio:'작가작업실 JEJU 운영',rental:'대관 행사'};
const pageSize=9;
const urlFor=(n,rental)=>'/news'+(rental?'?operator=rental'+(n>1?'&page='+n:''):n>1?'?page='+n:'');
function formatDate(s){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(String(s||'')))return '';
 const v=String(s);
 const weekday=['일','월','화','수','목','금','토'][new Date(v+'T00:00:00Z').getUTCDay()];
 return esc(v.replace(/-/g,'.')+' ('+weekday+')');
}
function card(p){
 const cover=safeImage(Array.isArray(p.images)?p.images[p.cover_index]||p.images[0]:'');
 const types=[typeNames[p.event_type],opNames[p.operator_type]].filter(Boolean);
 const badges=types.length?'<div class="tags">'+types.map(t=>'<span>'+esc(t)+'</span>').join('')+'</div>':'';
 const date=formatDate(p.event_date_start);
 return '<a class="card" href="/news/'+encodeURIComponent(p.slug)+'">'+
  (cover?'<img src="'+esc(cover)+'" alt="'+esc(p.title)+'" loading="lazy" decoding="async">':'<div class="placeholder">사진 없음</div>')+
  badges+'<h2>'+esc(p.title)+'</h2>'+(date?'<p class="date">'+date+(p.event_date_end?' ~ '+formatDate(p.event_date_end):'')+'</p>':'')+
  '<span class="state">종료</span></a>';
}
function pager(page,max,rental){
 if(max<=1)return '';
 const ns=[...new Set([1,max,page-2,page-1,page,page+1,page+2].filter(i=>i>0&&i<=max))].sort((a,b)=>a-b);
 let h='<nav class="pagination" aria-label="지난 행사 페이지">';
 if(page>1)h+='<a rel="prev" href="'+urlFor(page-1,rental)+'" aria-label="이전 페이지">‹</a>';
 let prev=0;for(const n of ns){
  if(n-prev>1)h+='<span aria-hidden="true">…</span>';
  h+='<a href="'+urlFor(n,rental)+'"'+(page===n?' class="current" aria-current="page"':'')+'>'+n+'</a>';prev=n;
 }
 if(page<max)h+='<a rel="next" href="'+urlFor(page+1,rental)+'" aria-label="다음 페이지">›</a>';
 return h+'</nav>';
}
const style=`
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;color:#3d3834;background:#fff;font-family:'Apple SD Gothic Neo','Malgun Gothic',sans-serif;line-height:1.7}a{color:inherit;text-decoration:none}
header{background:#302c29;color:#fff;padding:17px 0}.header-inner{max-width:1160px;margin:auto;padding:0 22px;display:flex;justify-content:space-between;gap:12px;align-items:center}.header-inner a{font-size:13px}
main{max-width:1130px;margin:auto;padding:55px 24px 105px}.section-title{border-bottom:1px solid #e5dfd9;padding-bottom:25px;margin-bottom:29px}.eyebrow{color:#94765f;font-size:13px;letter-spacing:.12em;margin:0 0 10px}h1{font-size:32px;letter-spacing:-.04em;margin:0;font-weight:600}.intro{font-size:15px;color:#71675e;line-height:1.9;margin:0 0 27px;max-width:830px}
.tabs{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:29px}.tabs a{border:1px solid #d6c8ba;padding:9px 19px;font-size:13px}.tabs a.current{background:#483b30;color:white;border-color:#483b30}.tabs a:hover{background:#eee8e1;color:#3d3834}
.count{font-size:13px;color:#80766d;margin:0 0 24px}.cards{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:38px 25px}.card{text-align:center}.card img,.placeholder{display:block;width:100%;aspect-ratio:4/3;object-fit:cover;background:#f5f1ec}.placeholder{display:flex;align-items:center;justify-content:center;color:#999;font-size:13px}
.card h2{font-size:19px;line-height:1.5;font-weight:500;overflow-wrap:anywhere;margin:13px 0 5px}.tags{display:flex;align-items:center;justify-content:center;gap:5px;flex-wrap:wrap;margin-top:12px}.tags span{font-size:11px;padding:3px 8px;background:#f1ebe5;color:#5d5147}.date{font-size:13px;color:#857b70;margin:5px 0}.state{font-size:12px;color:#77726d;background:#f3f2f1;padding:4px 12px;border-radius:30px;display:inline-block;margin-top:5px}
.pagination{display:flex;justify-content:center;align-items:center;gap:7px;flex-wrap:wrap;margin:49px 0}.pagination a,.pagination span{display:inline-flex;min-width:40px;min-height:40px;padding:0 8px;align-items:center;justify-content:center;border:1px solid #d5c5b6}.pagination span{border:0}.pagination a.current{background:#483b30;color:white;border-color:#483b30}.pagination a:hover{background:#ede7e0;color:#3d3834}.return{display:block;width:max-content;border:1px solid #bba99a;padding:11px 25px;font-size:14px;margin:48px auto 0}.return:hover{background:#f3eee9}.empty{text-align:center;color:#85796e;padding:75px 0}
@media(max-width:740px){main{padding:38px 17px 75px}h1{font-size:25px}.intro{font-size:13px}.cards{grid-template-columns:repeat(2,minmax(0,1fr));gap:23px 12px}.card h2{font-size:15px}.tabs a{font-size:12px;padding:8px 10px}.pagination{gap:4px}.pagination a,.pagination span{min-width:35px;min-height:36px;padding:0 6px}}
`;
module.exports=async(req,res)=>{
 try{
  if(req.method!=='GET')return res.status(405).end();
  if(!ready())return res.status(503).send('DB not configured');
  const rawPage=typeof req.query?.page==='string'?req.query.page:'1';
  if(!/^[1-9][0-9]{0,5}$/.test(rawPage))return res.status(400).send('올바르지 않은 페이지 번호입니다.');
  const page=Number(rawPage),op=req.query?.operator||'';
  if(op&&op!=='rental')return res.status(400).send('올바르지 않은 행사 분류입니다.');
  const rental=op==='rental',offset=(page-1)*pageSize;
  const path='/rest/v1/news_posts?select='+selected+'&status=eq.ended'+
   (rental?'&operator_type=eq.rental':'')+
   '&order=published_at.desc.nullslast,created_at.desc&limit='+pageSize+'&offset='+offset;
  const r=await fetch(root()+path,{headers:{apikey:key(),Accept:'application/json',Prefer:'count=exact'}});
  if(!r.ok)throw Object.assign(Error('목록을 불러오지 못했습니다.'),{status:r.status});
  const items=await r.json(),range=r.headers.get('content-range')||'';
  const total=Number(range.split('/').pop());
  if(!Number.isSafeInteger(total))throw Object.assign(Error('목록 페이지 수량을 확인할 수 없습니다.'),{status:503});
  const pages=Math.max(1,Math.ceil(total/pageSize));
  if(page>pages)return res.status(404).send('해당 페이지에 지난 모임·행사가 없습니다.');
  const base=origin(req),self=base+urlFor(page,rental);
  const pageTitle=(rental?'제주 공간대관 사례 · 지난 모임·행사':'제주 독서모임·글쓰기·북토크 지난 모임·행사')+
   (page>1?' · '+page+'페이지':'')+' | 작가작업실 JEJU';
  const intro=rental
   ?'제주 이호테우 작가작업실 JEJU에서 외부 주최자가 진행한 실제 독서모임, 글쓰기, 특강, 북토크 대관 사례입니다.'
   :'작가작업실 JEJU에서 함께한 독서, 글쓰기, 대화와 특별한 만남의 기록입니다.';
  const schema={'@context':'https://schema.org','@type':'CollectionPage','@id':self+'#webpage',url:self,name:pageTitle,description:intro,inLanguage:'ko-KR',
   mainEntity:{'@type':'ItemList',itemListElement:items.map((p,i)=>({'@type':'ListItem',position:offset+i+1,name:p.title,url:base+'/news/'+encodeURIComponent(p.slug)}))}};
  const body='<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'+
   '<meta name="robots" content="noindex,nofollow"><title>'+esc(pageTitle)+'</title>'+
   '<meta name="description" content="'+esc(intro)+'"><link rel="canonical" href="'+esc(self)+'">'+
   '<meta property="og:title" content="'+esc(pageTitle)+'"><meta property="og:description" content="'+esc(intro)+'">'+
   '<script type="application/ld+json">'+jsonLd(schema)+'</script><style>'+style+'</style></head><body>'+
   '<header><div class="header-inner"><a href="/#news">작가작업실 JEJU</a><a href="/#news">모임·행사</a></div></header>'+
   '<main><div class="section-title"><p class="eyebrow">02 — MEETINGS &amp; EVENTS</p><h1>'+(rental?'대관 사례':'지난 모임·행사')+'</h1></div>'+
   '<p class="intro">'+esc(intro)+'</p>'+
   '<nav class="tabs" aria-label="지난 행사 분류"><a href="/news"'+(!rental?' class="current" aria-current="page"':'')+'>전체 지난 모임·행사</a>'+
   '<a href="/news?operator=rental"'+(rental?' class="current" aria-current="page"':'')+'>대관 행사만 보기</a></nav>'+
   '<p class="count">총 '+total+'개 · 최신 게시순</p>'+
   (items.length?'<div class="cards">'+items.map(card).join('')+'</div>':'<p class="empty">등록된 지난 모임·행사가 없습니다.</p>')+
   pager(page,pages,rental)+
   (rental?'<a class="return" href="/#prog-04">공간 대관 안내 보기 ↗</a>':'')+
   '<a class="return" href="/#news">모임·행사로 돌아가기</a></main></body></html>';
  res.setHeader('Content-Type','text/html; charset=utf-8');
  res.setHeader('Cache-Control','no-store');
  res.setHeader('X-Robots-Tag','noindex, nofollow, noarchive');
  return res.status(200).send(body);
 }catch(e){return res.status(e.status||500).send('지난 모임·행사를 불러오지 못했습니다.');}
};