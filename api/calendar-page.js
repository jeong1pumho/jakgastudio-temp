'use strict';
/*
 * Public, server-rendered calendar discovery pages.
 * The existing interactive calendar at /calendar remains unchanged.
 * Load the memo only for an eligible individual event detail.
 */
const {nav}=require('../lib/home-content');
const {query,ready,esc}=require('../lib/core');
const {renderContent}=require('../lib/rich');
const {origin,robots,jsonLd,faviconLinks,safeImage,plainDescription}=require('../lib/seo');
const {publicCalendarEnd}=require('../lib/public-calendar-range');
const idPattern=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const COLS='id,event_date,category,category_label,title,start_time,end_time,updated_at';
const visibleCategories='meeting,custom';
const webName='작가작업실 제주';
const place={name:webName,address:'제주특별자치도 제주시 이호일동 375-3 1층'};
function dateNow(){
 const parts=new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Seoul',year:'numeric',month:'numeric',day:'numeric'}).formatToParts(new Date());
 const val=key=>Number(parts.find(p=>p.type===key)?.value||0);
 return {year:val('year'),month:val('month'),day:val('day')};
}
const pad=n=>String(n).padStart(2,'0');
const onlyDate=v=>String(v||'').slice(0,10);
const onlyTime=v=>String(v||'').slice(0,5);
const categoryName=e=>e.category==='meeting'?'작가작업실 모임':e.category_label||'특별일정';
const weekday=date=>['일','월','화','수','목','금','토'][new Date(date+'T00:00:00Z').getUTCDay()];
function prettyDate(d){return d.replace(/-/g,'.')+' ('+weekday(d)+')';}
function safeTitle(v){return String(v??'').trim().slice(0,150);}
// Structured data for real, public calendar meetings and special sessions only.
// Marketing posts and private rentals are never passed to this handler.
function eventSchema(base,e,date,title,description,linked=null){
 const url=base+'/calendar/events/'+e.id;
 const newsUrl=linked?.slug?base+'/news/'+encodeURIComponent(linked.slug):url;
 return {'@type':'Event','@id':url+'#event',url,name:title,description,
  startDate:date+'T'+onlyTime(e.start_time)+':00+09:00',
  endDate:date+'T'+onlyTime(e.end_time)+':00+09:00',
  eventAttendanceMode:'https://schema.org/OfflineEventAttendanceMode',
  eventStatus:'https://schema.org/EventScheduled',
  location:{'@type':'Place',name:place.name,address:{'@type':'PostalAddress',
    streetAddress:'이호일동 375-3 1층',addressLocality:'제주시',
    addressRegion:'제주특별자치도',addressCountry:'KR'}},
  ...(linked?.cover?{image:linked.cover}:{}),
  ...(linked&&Number.isInteger(linked.price_krw)?{offers:{'@type':'Offer',price:linked.price_krw,priceCurrency:'KRW',url:newsUrl}}:{}),
  ...(e.category==='meeting'?{organizer:{'@id':base+'/#bookstore','@type':'BookStore',name:webName,url:base+'/'}}:{}),
  ...(e.updated_at?{dateModified:e.updated_at}:{})};
}
function output(req,res,status,title,description,body,meta={}){
 const base=origin(req),url=base+(meta.path||'/calendar');
 const headSchema=meta.schema||{'@context':'https://schema.org','@type':'WebPage',name:title,url,inLanguage:'ko-KR'};
 const seo='<title>'+esc(title)+'</title>'+
  '<meta name="description" content="'+esc(description)+'">'+
  '<link rel="canonical" href="'+esc(url)+'">'+
  '<meta property="og:url" content="'+esc(url)+'">'+
  '<meta property="og:title" content="'+esc(title)+'">'+
  '<meta property="og:description" content="'+esc(description)+'">'+
  '<script type="application/ld+json">'+jsonLd(meta.schema?{'@context':'https://schema.org','@graph':[headSchema,require('../lib/search-info').breadcrumb(base,[['월간 캘린더','/calendar'],[headSchema.name,meta.path]])]}:headSchema)+'</script>'+require('../lib/search-info').sharing(base,title,description);
 const css='*{box-sizing:border-box}body{margin:0;font-family:"Apple SD Gothic Neo","Malgun Gothic",sans-serif;background:#fffdfa;color:#38332e;line-height:1.75}a{color:inherit}a:focus-visible{outline:2px solid #a37d67;outline-offset:3px}.bar{background:#302d2a;color:white;padding:19px 24px}.bar-inner{max-width:1000px;margin:auto;display:flex;align-items:center;justify-content:space-between;gap:12px}.bar a{text-decoration:none}.brand{font-size:18px;font-weight:600}.bar .back{font-size:13px}.container{max-width:1000px;margin:0 auto;padding:42px 22px 85px}.eyebrow{font-size:12px;letter-spacing:.19em;font-weight:600;color:#aa8674;margin:0 0 18px}h1{font-size:32px;font-weight:500;letter-spacing:-.045em;line-height:1.4;margin:0 0 18px}h2{font-size:21px;font-weight:600;margin:28px 0 14px}p{margin:0 0 16px}.lead{color:#75695e;font-size:15px}.hint{font-size:13px;color:#796e64;background:#f4efe9;padding:15px 19px;border-radius:5px}.cards{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:13px;margin:24px 0 34px}.card{display:block;background:#fff;border:1px solid #e4ddd6;border-left:4px solid #ad705b;border-radius:5px;padding:20px 22px;text-decoration:none}.card:hover{background:#faf5f0}.card .cat{display:block;color:#8e6954;font-size:12px;margin-bottom:5px}.card strong{display:block;font-size:18px;line-height:1.55}.card time{display:block;color:#6f665e;margin-top:10px;font-size:14px}.details{border-top:1px solid #ded6ce;border-bottom:1px solid #ded6ce;margin:28px 0;padding:20px 0}.event-memo{overflow-wrap:anywhere}.related-event{border-top:1px solid #e2d9d0;margin:24px 0;padding:20px 0}.related-event img{display:block;width:100%;max-width:580px;height:auto;border-radius:4px;margin-bottom:16px}.related-event a{color:#7d5542}.related-event p{margin:0 0 11px}.related-price{font-weight:650}.event-memo p{margin:0}.event-memo .legacy-text{white-space:pre-wrap}.muted{color:#82776d;font-size:13px}.links{margin-top:28px;display:flex;gap:18px;flex-wrap:wrap}.links a{font-size:14px;color:#7d5542}.empty{padding:50px 0;color:#81756b;text-align:center}@media(max-width:660px){.container{padding:28px 17px 60px}.cards{grid-template-columns:1fr}h1{font-size:26px}.brand{font-size:15px}.bar{padding:15px}.card strong{font-size:16px}}';
 res.statusCode=status;
 res.setHeader('Content-Type','text/html; charset=utf-8');
 res.setHeader('Cache-Control','public, max-age=0, s-maxage=180');
 // Retain test-domain deindexing; Vercel blanket header also applies.
 res.setHeader('X-Robots-Tag',status===200?robots(req):'noindex, follow');
 const directive=status===200?robots(req):'noindex, follow';
 const back=meta.path?.startsWith('/calendar/events/')?'<div class="calendar-detail-return"><a data-page-return href="/calendar">← 월간 캘린더로 돌아가기</a></div>':'';
 res.end('<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="'+directive+'">'+seo+faviconLinks()+'<style>'+css+'</style><link rel="stylesheet" href="/assets/home-approved.css"><style>body{background:#fffdfa;color:#38332e}.kv-sticky-header{padding:0;font-family:HomeKakao,sans-serif;font-size:15px;line-height:1.86;letter-spacing:-.025em;-webkit-font-smoothing:antialiased}.kv-sticky-inner{margin:auto}.calendar-detail-return{margin-top:36px}.calendar-detail-return a{display:inline-flex;border:1px solid #ded6ce;border-radius:4px;padding:10px 16px;text-decoration:none;font-size:14px}</style></head><body><header class="kv-sticky-header"><div class="kv-sticky-inner">'+nav('/calendar')+'</div></header><main class="container">'+body+back+'</main><script defer src="/assets/home-menu.js"></script><script defer src="/assets/page-return.js"></script><script defer src="/assets/site-analytics.js?v=owner-exclude-20261121"></script><script defer src="/assets/site-visitor.js?v=owner-exclude-20261121"></script></body></html>');
}
function monthSpan(){
 const now=dateNow(),first=now.year+'-'+pad(now.month)+'-01';
 const until=publicCalendarEnd();
 const today=now.year+'-'+pad(now.month)+'-'+pad(now.day);
 return {today,first,until};
}
function errorHtml(req,res,code,message){
 return output(req,res,code,(code===404?'일정을 찾을 수 없습니다':'일정을 불러올 수 없습니다')+' | '+webName,
 message,'<h1>'+esc(message)+'</h1><p><a href="/calendar">월간 캘린더 보기</a></p>',{path:'/calendar'});
}
module.exports=async(req,res)=>{
 try{
  if(req.method!=='GET')return res.status(405).end();
  if(!ready())return errorHtml(req,res,503,'일정 데이터베이스에 연결할 수 없습니다.');
  const inputId=typeof req.query?.event_id==='string'?req.query.event_id:
   ((req.url||'').match(/\/calendar\/events\/([0-9a-f-]+)/i)||[])[1]||'';
  const base=origin(req);
  if(inputId){
   if(!idPattern.test(inputId))return errorHtml(req,res,404,'일정을 찾을 수 없습니다.');
   const url='/rest/v1/schedule_events?select='+COLS+'&id=eq.'+encodeURIComponent(inputId)+
      '&event_date=gte.2026-10-22&event_date=lt.'+publicCalendarEnd()+'&category=in.('+visibleCategories+')&limit=1';
   const rows=await query(url);
   if(!rows.length)return errorHtml(req,res,404,'일정을 찾을 수 없습니다.');
   const e=rows[0],date=onlyDate(e.event_date),title=safeTitle(e.title);
   const urlPath='/calendar/events/'+e.id;
   const eventDesc=prettyDate(date)+' '+onlyTime(e.start_time)+'–'+onlyTime(e.end_time)+' · '+categoryName(e)+
     ' · '+place.address;
   const memo=await query('/rest/v1/rpc/public_calendar_event_memo?p_event_id='+encodeURIComponent(e.id));
   const links=await query('/rest/v1/calendar_event_news?select=price_krw,news_posts(slug,title,content,images,cover_index)&event_id=eq.'+
    encodeURIComponent(e.id)+'&limit=1');
   const link=links[0],post=Array.isArray(link?.news_posts)?link.news_posts[0]:link?.news_posts;
   const images=Array.isArray(post?.images)?post.images:[];
   const cover=safeImage(images[post?.cover_index]||images[0]);
   const linked=post?.slug?{slug:post.slug,title:String(post.title||'').slice(0,150),
    description:plainDescription(post.content,240),cover,
    price_krw:Number.isInteger(link?.price_krw)?link.price_krw:null}:null;
   const newsHref=linked?'/news/'+encodeURIComponent(linked.slug):'';
   const structuredDesc=eventDesc+(linked?.description?' · '+linked.description:'');
   const body='<p class="eyebrow">CALENDAR / 일정 상세</p>'+
    '<h1>'+esc(title)+'</h1><p class="lead">'+esc(eventDesc)+'</p>'+
    (memo?.trim()?'<div class="details event-memo">'+renderContent(memo)+'</div>':'')+
    (linked?'<section class="related-event" aria-label="연결된 모임·행사">'+
     (linked.cover?'<a href="'+esc(newsHref)+'"><img src="'+esc(linked.cover)+'" alt="'+esc(linked.title)+' 대표 이미지" loading="lazy"></a>':'')+
     (linked.price_krw!==null?'<p class="related-price">참가비: 1인 '+linked.price_krw.toLocaleString('ko-KR')+'원</p>':'')+
     (linked.description?'<p>'+esc(linked.description)+'</p>':'')+
     '<p><a href="'+esc(newsHref)+'">모임·행사 소개 및 신청 안내 보기</a></p></section>':'')+
    '<p class="hint">이 페이지는 월간 캘린더에 공개된 일정 정보입니다. 참가·예약 가능 여부와 신청 방법은 별도로 확인해 주세요.</p>'+
    '<div class="links"><a href="/news">모임·행사 확인</a></div>';
   return output(req,res,200,title+' | 제주 '+categoryName(e)+' · '+webName,eventDesc,body,{
    path:urlPath,schema:eventSchema(base,e,date,title,structuredDesc,linked)
   });
  }
  // Avoid endless /calendar?year=... crawling: one bounded rolling list of events.
  const {today,first,until}=monthSpan();
  const url='/rest/v1/schedule_events?select='+COLS+
   '&event_date=gte.'+first+'&event_date=lt.'+until+
   '&category=in.('+visibleCategories+')&order=event_date.asc,start_time.asc&limit=300';
  const rows=await query(url);
  const visible=rows.filter(e=>onlyDate(e.event_date)>=today&&['meeting','custom'].includes(e.category));
  const description='제주 이호테우 작가작업실 제주에서 공개한 독서모임, 글쓰기 모임과 특별행사의 날짜·시간·장소를 확인하세요.';
  const cards=visible.map(e=>{
   const date=onlyDate(e.event_date),href='/calendar/events/'+encodeURIComponent(e.id);
   return '<a class="card" href="'+href+'"><span class="cat">'+esc(categoryName(e))+'</span>'+
    '<strong>'+esc(safeTitle(e.title))+'</strong>'+
    '<time datetime="'+esc(date)+'">'+esc(prettyDate(date))+' · '+esc(onlyTime(e.start_time))+'–'+esc(onlyTime(e.end_time))+'</time></a>';
  }).join('');
  const body='<p class="eyebrow">JEJU / CALENDAR</p><h1>작가작업실 제주 모임·행사 일정</h1>'+
   '<p class="lead">'+esc(description)+'</p>'+
   '<p class="hint">기본 운영시간은 화~토 09:00–17:00이며 점심시간은 12–13시입니다. 일·월은 정기휴무입니다. 자유방문 가능 시간과 임시휴무·대관 현황은 <a href="/calendar">월간 캘린더</a>에서 확인해 주세요.</p>'+
   '<h2>예정된 공개 모임·행사</h2>'+
   (cards?'<div class="cards">'+cards+'</div>':'<p class="empty">현재 등록된 공개 모임·행사가 없습니다. 새로운 일정은 월간 캘린더에서 확인해 주세요.</p>')+
   '<div class="links"><a data-page-return href="/calendar">이전 페이지로 돌아가기</a><a href="/news">운영 소식 전체 보기</a></div>';
  const schema={'@context':'https://schema.org','@type':'CollectionPage',
    name:'작가작업실 제주 모임·행사 일정',description,url:base+'/calendar',inLanguage:'ko-KR',
    mainEntity:{'@type':'ItemList',itemListElement:visible.map((e,i)=>({
     '@type':'ListItem',position:i+1,name:safeTitle(e.title),
     url:base+'/calendar/events/'+encodeURIComponent(e.id)
    }))}};
  return output(req,res,200,'제주 독서모임·글쓰기 모임 일정 | '+webName,description,body,{path:'/calendar',schema});
 }catch(error){
  return errorHtml(req,res,error.status||500,'일정을 불러오는 중 문제가 발생했습니다.');
 }
};
module.exports.eventSchema=eventSchema;
