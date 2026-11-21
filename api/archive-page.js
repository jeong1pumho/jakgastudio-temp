const {displayBrand}=require('../lib/seo');
'use strict';
const {nav,pageHeading}=require('../lib/home-content');
const {root,key,ready,esc,selected}=require('../lib/core');
const {origin,robots,safeImage,faviconLinks}=require('../lib/seo');
const typeNames={reading:'독서',writing:'글쓰기',themed:'주제모임',special:'특별행사'};
const opNames={studio:'작가작업실 JEJU 운영',rental:'대관 행사'};
function formatDate(s){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(String(s||'')))return '';
 const v=String(s);
 const weekday=['일','월','화','수','목','금','토'][new Date(v+'T00:00:00Z').getUTCDay()];
 return esc(v.replace(/-/g,'.')+' ('+weekday+')');
}
function card(p){
 const cover=safeImage(Array.isArray(p.images)?p.images[p.cover_index]||p.images[0]:'');
 const types=[opNames[p.operator_type],typeNames[p.event_type]].filter(Boolean);
 const badges=types.length?'<div class="tags">'+types.map((t,i)=>'<span'+(i===0?' class="tag-box"':'')+'>'+esc(t)+'</span>').join('')+'</div>':'';
 const date=formatDate(p.event_date_start);
 return '<a class="card" href="/news/'+encodeURIComponent(p.slug)+'">'+
  (cover?'<img src="'+esc(cover)+'" alt="'+esc(displayBrand(p.title))+'" loading="lazy" decoding="async">':'<div class="placeholder">사진 없음</div>')+
  badges+'<h3>'+esc(displayBrand(p.title))+'</h3>'+(date?'<p class="date">'+date+(p.event_date_end?' ~ '+formatDate(p.event_date_end):'')+'</p>':'')+
  '</a>';
}
const subscribe=require('../lib/news-subscribe');
// Footer matches the shared homepage template, including its responsive layout.
const footer="<footer class=\"site-footer\">\n<div class=\"footer-inner content-width\">\n<p class=\"footer-overline\">JAKGA STUDIO JEJU <span></span></p>\n<div class=\"footer-brand\"><img alt=\"작가작업실 제주 | 책방 그리고 글쓰기와 독서모임\" src=\"https://www.jakgastudio.com/assets/JEJU_Standard_two_line.svg\"/></div>\n<div class=\"footer-details\">\n<div class=\"footer-field\"><small>상호 · 대표</small><p>작가작업실 제주<br/>유미경</p><small class=\"second-label\">사업자등록번호</small><p>493-28-01108</p></div>\n<div class=\"footer-field\"><small>주소</small><p>제주시 이호일동 375-3<br/>1층 작가작업실 JEJU</p><a href=\"https://map.naver.com/p/entry/place/2020396707\" rel=\"noopener noreferrer\" target=\"_blank\">네이버 지도에서 위치 확인 ↗</a></div>\n<div class=\"footer-field\"><small>전화 · 이메일</small><p><a href=\"tel:0647440376\">064-744-0376</a><br/><a href=\"mailto:jakgastudio@gmail.com\">jakgastudio@gmail.com</a></p></div>\n</div>\n<nav class=\"footer-social\" aria-label=\"작가작업실 제주 소셜 채널\">\n<p class=\"footer-social-title\">SOCIAL CHANNELS</p>\n<div class=\"footer-social-links\">\n<a href=\"https://www.instagram.com/jakgastudio/\" target=\"_blank\" rel=\"noopener noreferrer\">공식 Instagram ↗</a>\n<a href=\"https://www.instagram.com/pobisiyul/\" target=\"_blank\" rel=\"noopener noreferrer\">유미경 작가 Instagram ↗</a>\n<a href=\"https://www.threads.com/@jakgamanager\" target=\"_blank\" rel=\"noopener noreferrer\">작가매니저 Threads ↗</a>\n</div>\n</nav>\n<p class=\"copyright\">© 2026 작가작업실 JEJU</p>\n</div>\n</footer>";
const footerStyles=".site-footer{background:#302d2a;color:#f2eee8;padding:65px 0 32px}\n.footer-inner{max-width:1180px}\n.footer-overline{font-family:var(--sans);font-size:12px;letter-spacing:.2em;color:#c1aa98;display:flex;gap:30px;align-items:center;margin:0}\n.footer-overline span{width:46px;height:1px;background:#8e857e}\n.footer-brand{border-top:1px solid #665f5a;border-bottom:1px solid #665f5a;margin:23px 0 37px;padding:38px 0 35px}\n.footer-brand img{width:330px;filter:brightness(0) invert(1)}\n.footer-details{display:grid;grid-template-columns:repeat(3,1fr);gap:40px;line-height:1.8}\n.footer-field small{color:#b09b8b;font-size:12px}\n.footer-field p{font-size:14px;color:#f4eee8;margin:10px 0 25px;line-height:1.9}\n.footer-field a{border-bottom:1px solid transparent}\n.footer-field a:hover{border-bottom-color:currentColor}\n.footer-field>a{font-size:13px;color:#d0b9a6;border-bottom:1px solid #9e8c7b;padding-bottom:4px}\n.footer-social{border-top:1px solid #665f5a;margin-top:18px;padding-top:25px}\n.footer-social-title{margin:0 0 14px;color:#b09b8b;font-size:12px;letter-spacing:.12em}\n.footer-social-links{display:flex;align-items:center;flex-wrap:wrap;gap:12px 28px}\n.footer-social-links a{color:#f4eee8;font-size:13px;text-decoration:none;line-height:1.8;border-bottom:1px solid transparent}\n.footer-social-links a:hover{border-bottom-color:#d0b9a6}\n.footer-social-links a:focus-visible{outline:2px solid #d0b9a6;outline-offset:4px}\n\n.second-label{display:block;margin-top:18px}\n.copyright{border-top:1px solid #665f5a;color:#9f9287;font-size:12px;text-align:center;margin:36px 0 0;padding-top:25px}\n\n.site-footer .footer-inner{width:calc(100% - 112px);margin-inline:auto}.site-footer img{display:block;max-width:100%}\n@media(max-width:1000px){.site-footer .footer-inner{width:calc(100% - 70px)}}\n@media(max-width:740px){.site-footer .footer-inner{width:calc(100% - 42px)}.site-footer{padding:45px 0 25px}\n  .footer-overline{font-size:10px}\n  .footer-brand{padding:45px 0;border-top:1px solid #635d58;margin:23px 0 29px}\n  .footer-brand img{width:min(79vw,320px);margin:0 auto}\n  .footer-details{grid-template-columns:1fr;gap:4px}\n  .footer-field p{font-size:14px;margin:7px 0 15px}\n  .footer-field small{font-size:11px}\n  .second-label{margin-top:10px}\n  .copyright{margin-top:29px}\n}\n@media(max-width:390px){.site-footer .footer-inner{width:calc(100% - 34px)}}";
const intro='제주 독서모임, 글쓰기 클래스, 북토크 등 작가작업실 JEJU에서 열리는 다양한 모임과 행사를 만나보세요.';
function pageNumber(raw){if(raw===undefined)return 1;if(typeof raw!=='string'||! /^[1-9][0-9]{0,5}$/.test(raw))throw Object.assign(Error('Invalid page'),{status:400});return Number(raw);}
function urlFor(ongoing,ended,rental,anchor=''){const q=new URLSearchParams();if(ongoing>1)q.set('ongoing',ongoing);if(ended>1)q.set('ended',ended);if(rental)q.set('operator','rental');return '/news'+(q.size?'?'+q:'')+(anchor?'#'+anchor:'');}
async function load(status,page,rental){
 if(status==='ended')return require('../lib/news-order').loadEnded(page,6,rental);
 const response=await fetch(root()+'/rest/v1/news_posts?select='+selected+'&published_at=not.is.null&status=eq.'+status+(rental?'&operator_type=eq.rental':'')+'&order=sort_order.desc,published_at.desc.nullslast,created_at.desc,id.desc&limit=6&offset='+((page-1)*6),{headers:{apikey:key(),Accept:'application/json',Prefer:'count=exact'}});
 if(response.status===416)throw Object.assign(Error('Missing page'),{status:404});
 if(!response.ok)throw Error('List unavailable');
 const total=Number((response.headers.get('content-range')||'').split('/')[1]);if(!Number.isSafeInteger(total)||total<0)throw Error('Invalid count');
 const pages=Math.max(1,Math.ceil(total/6));if(page>pages)throw Object.assign(Error('Missing page'),{status:404});return {items:await response.json(),page,pages,total};
}
function section(data,kind,other,rental){
 const title=kind==='ongoing'?'진행 중인 모임·행사':'종료된 모임·행사';
 const link=n=>kind==='ongoing'?urlFor(n,other,rental,kind):urlFor(other,n,rental,kind);
 let pagination='';if(data.pages>1){const start=Math.max(1,Math.min(data.page-2,data.pages-4)),end=Math.min(data.pages,start+4);pagination='<nav class="books-pagination" aria-label="'+title+' 페이지">';if(data.page>1)pagination+='<a href="'+link(data.page-1)+'">이전</a>';for(let n=start;n<=end;n++)pagination+=n===data.page?'<span aria-current="page">'+n+'</span>':'<a href="'+link(n)+'">'+n+'</a>';if(data.page<data.pages)pagination+='<a href="'+link(data.page+1)+'">다음</a>';pagination+='</nav><p class="books-page-count">전체 '+data.total+'개 · '+data.page+' / '+data.pages+' 페이지</p>';}
 return '<section id="'+kind+'" class="event-section"><div class="section-head"><h2>'+title+'</h2><small>'+(kind==='ended'?'게시 순서 우선 · 최신 종료일순':'게시 순서 우선 · 최신 게시순')+'</small></div>'+(data.items.length?'<div class="cards">'+data.items.map(card).join('')+'</div>':'<p class="empty">등록된 '+title+'가 없습니다.</p>')+pagination+'</section>';
}
module.exports=async(req,res)=>{try{
 if(req.method!=='GET')return res.status(405).end();if(!ready())return res.status(503).send('DB not configured');
 const ongoing=pageNumber(req.query?.ongoing),ended=pageNumber(req.query?.ended??req.query?.page),op=req.query?.operator||'';if(op&&op!=='rental')return res.status(400).send('올바르지 않은 행사 분류입니다.');const rental=op==='rental';
 const [current,past]=await Promise.all([load('ongoing',ongoing,rental),load('ended',ended,rental)]);
 const title='모임·행사 | 작가작업실 제주',self=origin(req)+urlFor(ongoing,ended,rental);
 const pageTitle=ongoing===1&&ended===1&&!rental?'제주 독서모임·글쓰기 클래스·북토크 일정 | 작가작업실 제주':title;
 const body='<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="'+robots(req)+'"><title>'+esc(pageTitle)+'</title><meta name="description" content="'+intro+'"><link rel="canonical" href="'+esc(self)+'"><link rel="stylesheet" href="/assets/home-approved.css"><link rel="stylesheet" href="/assets/news-list.css"><style>'+footerStyles+'</style></head><body><header class="kv-sticky-header"><div class="kv-sticky-inner">'+nav('/news')+'</div></header><main class="news-list">'+pageHeading('MEETINGS & EVENTS',rental?'대관 사례':'모임·행사',intro)+section(current,'ongoing',ended,rental)+'<section class="news-subscribe"><div><h2>빠르게 소식받기</h2><p>새로운 모임, 행사가 등록되면 문자로 알려드립니다.</p></div><button type="button" id="sms-subscribe-open">빠르게 소식받기 ↗</button></section>'+section(past,'ended',ongoing,rental)+'</main>'+footer+subscribe+'<script defer src="/assets/home-menu.js"></script><script defer src="/assets/page-return.js"></script><script defer src="/assets/site-analytics.js?v=owner-exclude-20261121"></script><script defer src="/assets/site-visitor.js?v=owner-exclude-20261121"></script></body></html>';
 res.setHeader('Content-Type','text/html; charset=utf-8');res.setHeader('Cache-Control','no-store');res.setHeader('X-Robots-Tag',robots(req));return res.status(200).send(body.replace('</head>',faviconLinks()+require('../lib/search-info').archive(origin(req),pageTitle,intro,self,[...current.items,...past.items])+'</head>'));
}catch(e){return res.status(e.status||500).send(e.status===400?'올바르지 않은 페이지 번호입니다.':e.status===404?'해당 페이지에 모임·행사가 없습니다.':'모임·행사를 불러오지 못했습니다.');}};
