const {displayBrand}=require('./seo');
const {esc}=require('./core');
const {bookText,bookFields}=require('./book-recommendation');
const {holidayName}=require('./holidays');
const names={meeting:'모임',rental:'대관',free:'자유방문',closure:'임시 휴무',opening:'OPEN'};
const menus=[['/','Home'],['/space','작가와 공간 소개'],['/books','작가 추천 도서'],['/news','모임·행사'],['/calendar','월간 캘린더'],['/programs','운영 프로그램'],['/visit','방문 안내']];
const nav=(active='/')=>'<a class="home-ci" href="/" aria-label="작가작업실 제주 Home"><img src="/assets/ci-approved-two-line.svg" alt="작가작업실 제주 · 책방 그리고 글쓰기와 독서모임" width="299" height="90"></a><button class="home-menu-toggle" aria-expanded="false" aria-controls="home-menu">메뉴</button><nav id="home-menu" aria-label="주요 메뉴">'+menus.map(([url,name])=>`<a href="${url}"${active===url?' aria-current="page"':''}>${name}</a>`).join('')+'</nav>';
const more=(url,text)=>`<div class="home-more"><a href="${url}">${text} <span aria-hidden="true">↗</span></a></div>`;
const heading=(en,title,intro)=>`<p class="home-eyebrow">${en}</p><h2>${title}</h2><p class="home-intro">${intro}</p>`;
function books(items,all=false){return `<section class="home-section" id="recommended-books">${all?'<header class="books-page-heading"><p class="books-page-eyebrow">BOOKS SELECTED BY THE WRITER</p><div class="books-page-title-row"><h1>작가 추천 도서</h1><p class="books-page-intro"><span>작가작업실 JEJU 책방 주인인,</span><br>작가 유미경이 직접 읽고 마음에 남은 책들을 소개합니다.</p></div></header>':heading('BOOKS SELECTED BY THE WRITER','작가 추천 도서','작가작업실 JEJU 책방 주인인<br>작가 유미경이 직접 읽고 마음에 남은 책들입니다.')}<div class="home-three">`+items.map(b=>`<article class="home-book"><a href="/books/${b.id}"><img src="${esc(b.images[0])}" alt="${esc(displayBrand(b.title))}" width="600" height="600" loading="lazy"><h3>${esc(displayBrand(b.title))}</h3><p class="home-recommendation">${esc(displayBrand(bookText(bookFields(b).body)))}</p></a></article>`).join('')+(items.length?'':'<p class="home-empty">추천 도서를 준비하고 있습니다.</p>')+'</div>'+(!all?more('/books','작가 추천 도서 더 보기'):'')+'</section>';}
const date=d=>d?d.replaceAll('-','.')+' ('+['일','월','화','수','목','금','토'][new Date(d+'T00:00:00Z').getUTCDay()]+')':'';
function events(items){return `<section class="home-section" id="news">${heading('MEETINGS & EVENTS','모임·행사','제주 독서모임, 글쓰기 클래스, 북토크 등<br>작가작업실 JEJU에서 열리는 다양한 모임과 행사를 만나보세요.')}<div class="home-three">`+items.map(e=>`<article class="home-event"><a href="/news/${encodeURIComponent(e.slug)}">${e.images?.length?`<img src="${esc(e.images[e.cover_index]||e.images[0])}" alt="${esc(e.title)}" width="600" height="600" loading="lazy">`:'<div class="home-no-image">모임·행사</div>'}<p class="home-tags"><span>${e.operator_type==='rental'?'대관 행사':'작가작업실 JEJU 운영'}</span> ${esc(({reading:'독서',writing:'글쓰기',themed:'주제모임',special:'특별행사'})[e.event_type]||'')}</p><h3>${esc(e.title)}</h3><p class="home-date">${date(e.event_date_start)}${e.event_date_end?' ~ '+date(e.event_date_end):''}</p></a></article>`).join('')+(items.length?'':'<p class="home-empty">현재 진행 중인 모임·행사가 없습니다.</p>')+'</div>'+more('/news','모임·행사 더 보기')+'</section>';}
function weekRange(now=new Date()) {const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);const v=k=>parts.find(x=>x.type===k).value;const today=`${v('year')}-${v('month')}-${v('day')}`;const start=new Date(today+'T00:00:00Z');start.setUTCDate(start.getUTCDate()-(start.getUTCDay()+6)%7);const end=new Date(start);end.setUTCDate(end.getUTCDate()+7);return {start:start.toISOString().slice(0,10),end:end.toISOString().slice(0,10),today};}
function dayEvents(day,rows){const events=rows.filter(e=>e.event_date===day).sort((a,b)=>a.start_time.localeCompare(b.start_time));if(events.some(e=>['closure','opening'].includes(e.category)))return events.filter(e=>['closure','opening'].includes(e.category));const holiday=holidayName(day);if(holiday)return events.length?events:[{category:'closure',title:holiday+' · 휴무',start_time:'00:00',end_time:'23:59',holiday:true}];if([0,1].includes(new Date(day+'T00:00:00Z').getUTCDay()))return events;
 const minutes=t=>Number(t.slice(0,2))*60+Number(t.slice(3,5)),time=n=>String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0');const free=[];
 for(const [begin,end] of [[540,720],[780,1020]]){let p=begin;for(const e of events){const a=Math.max(begin,minutes(e.start_time)),b=Math.min(end,minutes(e.end_time));if(a>=b)continue;if(a>p)free.push({category:'free',start_time:time(p),end_time:time(a)});p=Math.max(p,b);}if(p<end)free.push({category:'free',start_time:time(p),end_time:time(end)});}
 return [...events,...free].sort((a,b)=>a.start_time.localeCompare(b.start_time));}
function week(rows,range,from="home"){let cells='';for(let i=0;i<7;i++){const d=new Date(range.start+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+i);const day=d.toISOString().slice(0,10),items=dayEvents(day,rows);cells+=`<div class="home-day${day===range.today?' is-today':''}"><p class="home-dayhead"><a href="/calendar?date=${day}&amp;from=${from}#schedule" aria-label="${day} 일별 일정 보기">${['월','화','수','목','금','토','일'][i]} <strong>${d.getUTCDate()}</strong>${day===range.today?'<small>오늘</small>':''}</a></p>`+(items.length?items.map(e=>{const label=e.category==='custom'?e.category_label||'행사':names[e.category]||'일정';const url='/calendar?date='+day+'&from='+from+'#schedule';return `<a class="home-slot" href="${url}"><small>${e.category==='closure'?'종일':esc(e.start_time.slice(0,5)+'–'+e.end_time.slice(0,5))}</small>${esc(e.category==='rental'?'공간 대관':e.category==='free'?'자유방문':displayBrand(e.title)||label)}<span>${esc(e.holiday?'공휴일 휴무':label)}</span></a>`}).join(''):`<a class="home-closed" href="/calendar?date=${day}&amp;from=${from}#schedule">쉬어가는 날<br><small>휴무</small></a>`)+'</div>';}
 return `<section class="home-week" id="weekly-schedule"><div class="home-section"><div class="home-week-heading"><div>${heading('THIS WEEK AT JEJU','이번 주 일정','작가작업실 JEJU의 이번주 일정입니다.<br>모임·대관·자유방문 가능 시간과 휴무일을 확인하세요.')}</div><p>${range.start.replaceAll('-','.')} — ${new Date(new Date(range.end+'T00:00:00Z')-86400000).toISOString().slice(5,10).replace('-','.')}</p></div><div class="home-days">${cells}</div><p class="home-calendar-note">점심시간(12–13시)에 방문 가능합니다.<br>방문 전 연락 주세요.</p>${more('/calendar','월간 캘린더 보기')}</div></section>`;}
function links(){
 const {programs}=require('./programs-page');
 const iconPaths=[
  '<path d="M12 6.2C9 4.5 6 4.2 3 5v13c3-.8 6-.5 9 1.2 3-1.7 6-2 9-1.2V5c-3-.8-6-.5-9 1.2z"/><path d="M12 6.2v13"/>',
  '<circle cx="9" cy="8" r="3"/><path d="M3 19v-1a6 6 0 0 1 12 0v1"/><path d="M17 5a3 3 0 0 1 0 6"/><path d="M19 19v-1a5 5 0 0 0-3-4.6"/>',
  '<path d="m4 20 4.8-1.2L20 7.6 16.4 4 5.2 15.2 4 20z"/><path d="m13.5 6.9 3.6 3.6"/>',
  '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18"/><path d="M8 14h2v2H8zM14 14h2v2h-2z"/>',
  '<rect x="9" y="3" width="6" height="12" rx="3"/><path d="M6 11a6 6 0 0 0 12 0M12 17v4M8 21h8"/>'
 ];
 const cards=programs.map((p,i)=>{
  const icon='<span class="home-program-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round">'+iconPaths[i]+'</svg></span>';
  return '<a class="home-program-card" href="/programs/'+esc(p.slug)+'">'
   +'<img src="'+esc(p.photos[0])+'" alt="'+esc(p.title)+' 대표 이미지" width="600" height="400" loading="lazy" decoding="async">'
   +icon
   +'<div class="home-program-card-content"><h3>'+esc(p.title)+'</h3>'
   +'<p>'+esc(p.headline)+'</p>'
   +'<span class="home-program-cta">자세히 보기 <span aria-hidden="true">↗</span></span>'
   +'</div></a>';
 }).join('');
 const info=[
  ['THE SPACE','공간 소개','책과 사람이 머무는 공간.<br>작가작업실 JEJU를 둘러보세요.','/space','공간 둘러보기'],
  ['PLAN YOUR VISIT','방문안내','작가작업실 JEJU로 오는 길.<br>위치와 주차 정보를 확인하세요.','/visit','방문 정보 확인하기']
 ].map(([en,title,intro,url,cta])=>'<article><p class="home-eyebrow">'+en+'</p><h2>'+title+'</h2><p>'+intro+'</p><a href="'+url+'">'+cta+'<span aria-hidden="true">↗</span></a></article>').join('');
 return '<section class="home-section home-programs" aria-labelledby="home-programs-title">'
  +'<header class="home-programs-heading"><p class="home-eyebrow">OUR PROGRAMS</p><h2 id="home-programs-title">운영 프로그램</h2>'
  +'<p class="home-programs-intro">책과 글, 사람들이 있는 작가작업실 JEJU의 다섯 가지 프로그램입니다.</p></header>'
  +'<div class="home-program-grid">'+cards+'</div></section>'
  +'<section class="home-section home-links" aria-label="이용 안내"><div class="home-links-two">'+info+'</div></section>';
}
const pageHeading=(en,title,intro)=>'<div class="subpage-heading"><p class="subpage-eyebrow">'+esc(en)+'</p><h1>'+esc(title)+'</h1><p class="subpage-intro">'+esc(intro).replace(/\n/g,'<br>')+'</p></div>';
module.exports={pageHeading,menus,nav,books,events,weekRange,dayEvents,week,links};
