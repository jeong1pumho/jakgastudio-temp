const fs=require('fs');const path=require('path');const {query,esc}=require('../core');const {origin,jsonLd,plainDescription}=require('../seo');const ui=require('../home-content');
const {isRich,bookHtml,bookText}=require('../book-recommendation');
const template=()=>fs.readFileSync(path.join(__dirname,'../home-template.html'),'utf8');
async function upcomingCalendarEvents(){
 const now=new Date();
 const {today}=ui.weekRange(now);
 const time=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Seoul',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).format(now);
 let body;
 try{
  const events=await query('/rest/v1/schedule_events?select=id,event_date,title,start_time,end_time'+
   '&category=in.(meeting,custom)&or=(event_date.gt.'+today+',and(event_date.eq.'+today+',end_time.gt.'+encodeURIComponent(time)+'))'+
   '&order=event_date.asc,start_time.asc,id.asc&limit=30');
  const items=events.map(event=>{
   const {event_date:date,title,start_time:start,end_time:end}=event;
   return '<li><a href="/calendar/events/'+encodeURIComponent(event.id)+'">'+esc(title)+'</a>'+
    '<time datetime="'+esc(date+'T'+start+'+09:00')+'">'+esc(date+' '+start.slice(0,5))+'</time>–'+
    '<time datetime="'+esc(date+'T'+end+'+09:00')+'">'+esc(end.slice(0,5))+'</time></li>';
  }).join('');
  body=items?'<ul>'+items+'</ul>':'<p>현재 예정된 공개 모임·행사가 없습니다.</p>';
 }catch(error){
  console.error('Upcoming calendar events failed:',error.status||500);
  body='<p>예정된 모임·행사를 불러오지 못했습니다. 잠시 후 다시 확인해 주세요.</p>';
 }
 return '<section class="calendar-upcoming" aria-labelledby="calendar-upcoming-title">'+
  '<h2 id="calendar-upcoming-title">예정된 모임·행사</h2>'+body+'</section>';
}
module.exports=async(req,res)=>{if(req.method!=='GET'&&req.method!=='HEAD')return res.status(405).end();try{
 const route=req.query?._view||req.query?.page||'home',bookId=req.query?.book;let html=template(),content='',title='작가작업실 JEJU | 제주 이호테우 책방·독서모임·글쓰기',description='작가 유미경의 제주 이호테우 책방. 작가 추천 도서, 독서모임과 글쓰기, 모임·행사 및 방문 일정을 확인하세요.',url='/',active='/',schema,shareImage;
 if(route==='home'){
  const range=ui.weekRange();const [books,events,days,keyVisual]=await Promise.all([query('/rest/v1/recommended_books?published=eq.true&order=sort_order.desc,created_at.desc&limit=3'),query('/rest/v1/news_posts?select=slug,title,images,cover_index,event_date_start,event_date_end,operator_type,event_type&status=eq.ongoing&order=sort_order.desc,published_at.desc.nullslast,created_at.desc&limit=3'),query('/rest/v1/schedule_events?select=id,event_date,category,category_label,title,start_time,end_time&event_date=gte.'+range.start+'&event_date=lt.'+range.end+'&order=event_date.asc,start_time.asc&limit=500'),query('/rest/v1/key_visual?id=eq.1&select=slides').catch(()=>[])]);
  html=require('../key-visual-render').render(html,keyVisual);
  content=ui.books(books)+ui.events(events)+ui.week(days,range)+ui.links();
 }else{
  html=html.replace(/<!-- HOME_TOP_START -->[\s\S]*?<!-- HOME_TOP_END -->/,'');active='/'+route;url=active;
  if(route==='calendar'){
   title='월간 캘린더 | 작가작업실 JEJU';description='작가작업실 JEJU의 모임·대관·자유방문 가능 시간과 휴무일을 확인하세요.';
   content='<div class="home-section">'+ui.pageHeading('MONTHLY CALENDAR','월간 캘린더',description+' (자유방문 전 시간을 꼭 확인해 주세요.)')+fs.readFileSync(path.join(__dirname,'../month-calendar.html'),'utf8')+await upcomingCalendarEvents()+'</div>'+'<script defer src="/assets/schedule.js"></script>';
  }else if(route==='books'){
   description='작가작업실JEJU 책방 주인인 작가 유미경이 직접 읽고 마음에 남은 책들을 추천합니다.';title='작가 추천 도서 | 작가작업실 JEJU';
   if(bookId){if(!/^[a-f0-9]{8}-[a-f0-9-]{27}$/i.test(bookId))return res.status(404).send('도서를 찾을 수 없습니다.');const rows=await query('/rest/v1/recommended_books?published=eq.true&id=eq.'+bookId);const b=rows[0];if(!b)return res.status(404).send('도서를 찾을 수 없습니다.');title=b.title+' | 작가 추천 도서 | 작가작업실 JEJU';description=isRich(b.recommendation)?Array.from(bookText(b.recommendation)).slice(0,160).join(''):plainDescription(b.recommendation,160);if(isRich(b.recommendation))html=html.replace('</head>',"<link rel=\"stylesheet\" href=\"https://fonts.googleapis.com/css2?family=Noto+Sans+KR&amp;family=IBM+Plex+Sans+KR&amp;family=Gothic+A1&amp;family=Nanum+Gothic&amp;family=Gowun+Dodum&amp;family=Black+Han+Sans&amp;family=Do+Hyeon&amp;family=Jua&amp;family=Sunflower&amp;family=Noto+Serif+KR&amp;family=Nanum+Myeongjo&amp;family=Gowun+Batang&amp;family=Hahmlet&amp;family=Song+Myung&amp;family=Gaegu&amp;family=Gamja+Flower&amp;family=Single+Day&amp;family=Yeon+Sung&amp;family=Nanum+Pen+Script&amp;family=Nanum+Brush+Script&amp;family=Poor+Story&amp;family=Hi+Melody&amp;family=Cute+Font&amp;display=swap\"><link rel=\"stylesheet\" href=\"/assets/rich-editor.css\"></head>");shareImage=b.images[0];url='/books/'+b.id;content=`<section class="home-section home-subpage"><h1>${esc(b.title)}</h1><div class="book-detail-images">${b.images.map(src=>`<img src="${esc(src)}" alt="${esc(b.title)}" width="600" height="600" loading="lazy">`).join('')}</div>${isRich(b.recommendation)?`<div class="book-detail-copy rich-reading">${bookHtml(b.recommendation)}</div>`:`<p class="book-detail-copy">${esc(b.recommendation)}</p>`}<div class="book-detail-return"><a data-page-return href="/books">← 이전 페이지로 돌아가기</a></div></section>`;schema={'@context':'https://schema.org','@type':'Book',name:b.title,image:b.images,description:isRich(b.recommendation)?bookText(b.recommendation):b.recommendation,url:origin(req)+url};
   }else{const paging=require('../books-pagination');const result=await paging.loadPage(req.query?.page);if(result.status)return res.status(result.status).send(result.status===400?'올바르지 않은 페이지 번호입니다.':'해당 페이지에 추천 도서가 없습니다.');url=paging.pageUrl(result.page);if(result.page>1)title='작가 추천 도서 · '+result.page+'페이지 | 작가작업실 JEJU';content=ui.books(result.items,true).replace('</section>',paging.pagination(result.page,result.pages,result.total)+'</section>');}
  }else if(route==='space'||route==='visit'){
   const visit=route==='visit',label=visit?'방문 안내':'작가와 공간 소개';
   title=label+' | 작가작업실 JEJU';
   description=visit?'작가작업실 JEJU의 운영시간, 주소와 무료주차 안내입니다.':'에세이 작가 유미경의 두 권의 책과 제주 이호테우에 작가작업실 JEJU를 연 이야기, 책방 공간 사진을 만나보세요.';
   const info=require('../info-pages');
   const author=require('../author-page');
   html=html.replace('</head>','<link rel="stylesheet" href="/assets/info-pages.css"></head>');
   const pageIntro=visit?'작가작업실JEJU로 오는 길.\n위치와 주차 정보를 확인하세요.':'제주 이호테우에서 책방을 꾸려가는 작가 유미경과 작가작업실 JEJU를 소개합니다.';
   if(!visit){
    schema=author.schema(origin(req),title,description);
    shareImage=origin(req)+author.portrait;
   }
   content='<section class="home-section home-subpage approved-info '+(visit?'visit-page':'space-page')+'">'+ui.pageHeading(visit?'PLAN YOUR VISIT':'THE WRITER & THE SPACE',label,pageIntro)+(visit?info.visit():author.render(info.space()))+'</section>';
  }else if(route==='programs'||route==='program-detail'){
   const programsPage=require('../programs-page');
   const program=programsPage.programs.find(item=>item.slug===req.query?.program);
   const detail=route==='program-detail';
   if(detail&&!program)return res.status(404).send('프로그램을 찾을 수 없습니다.');
   active='/programs';
   const cases=(!detail||program.slug==='space-rental')?await query('/rest/v1/news_posts?select=slug,title,images,cover_index,event_date_start,event_type&operator_type=eq.rental&status=in.(ongoing,ended)&order=event_date_start.desc.nullslast,published_at.desc.nullslast,created_at.desc,id.desc&limit=3'):[];
   html=html.replace('</head>','<link rel="stylesheet" href="/assets/programs-page.css"></head>');
   if(detail){
    url='/programs/'+program.slug;
    title=program.heading+' | 작가작업실 JEJU';
    description=program.description;
    shareImage=origin(req)+'/assets/program-'+program.photo+'.jpg';
    schema=programsPage.schema(origin(req),program,title);
    content='<section class="home-section home-subpage programs-page program-detail-page">'+programsPage.renderDetail(program,cases,ui.pageHeading('OUR PROGRAMS',program.heading,description))+'</section>';
   }else{
    title='운영 프로그램 | 작가작업실 JEJU';
    description='제주 이호테우 작가작업실 JEJU의 책방, 독서모임, 글쓰기 클래스, 공간 대관과 북토크 기획·운영 안내입니다.';
    content='<section class="home-section home-subpage programs-page">'+ui.pageHeading('OUR PROGRAMS','운영 프로그램','읽고, 쓰고, 함께하는 시간.\n나에게 맞는 프로그램을 만나보세요.')+programsPage.render(cases)+'</section>';
   }
  }else return res.status(404).send('페이지를 찾을 수 없습니다.');
 }
 html=html.replace('<!-- HOME_NAV -->',ui.nav(active)).replace('<!-- HOME_CONTENT -->',()=>content).replace(/<title>[\s\S]*?<\/title>/,`<title>${esc(title)}</title>`).replace(/<meta name="description"[^>]*>/,`<meta name="description" content="${esc(description)}">`).replace(/<link rel="canonical"[^>]*>/,'').replace(/<meta property="og:[^>]*>/g,'');
 html=html.replace(/<link\b[^>]*rel="canonical"[^>]*>/g,'').replace(/<meta\b[^>]*name="twitter:[^"]*"[^>]*>/g,'');
 html=html.replace('</head>',`<link rel="canonical" href="${origin(req)+url}"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${origin(req)+url}"><script type="application/ld+json">${jsonLd(require('../search-info').graph(origin(req),schema||{'@type':'WebPage',name:title,description,url:origin(req)+url,inLanguage:'ko-KR'}))}</script>${require('../search-info').sharing(origin(req),title,description,shareImage)}</head>`);
 res.setHeader('Content-Type','text/html; charset=utf-8');res.setHeader('Cache-Control','no-store');res.setHeader('X-Robots-Tag','noindex, nofollow');return res.status(200).send(html);
}catch(e){console.error('Home rendering failed:',e.status||500);return res.status(503).send('페이지를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');}};
