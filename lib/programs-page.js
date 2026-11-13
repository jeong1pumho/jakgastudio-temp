'use strict';
const {esc}=require('./core');
const programs=[
 {slug:"bookstore",heading:"제주 이호테우 독립서점",description:"유미경 작가가 직접 읽고 고른 책을 만날 수 있는 제주 이호테우의 독립서점입니다. 추천 도서와 방문 정보를 확인하세요.",links:[["작가 추천 도서","/books"],["방문 안내","/visit"]],title:'책방',note:'작가가 추천하는 베스트셀러\n(10% 할인)',photo:'bookshop',alt:'서가에서 책을 소개하는 작가',paragraphs:['제주 이호테우에 자리한 작은 동네서점, 작가작업실 JEJU입니다.','작가 유미경이 직접 읽고 오래 마음에 남은 책들과 많은 독자에게 사랑받은 베스트셀러를 마련해 두었습니다.','천천히 책을 둘러보며 지금 나에게 필요한 한 권을 만나보세요.']},
 {slug:"book-club",heading:"제주 독서모임",description:"제주 이호테우에서 작가와 책을 읽고 마음에 남은 문장과 이야기를 나누는 독서모임입니다. 모집 공지에서 신청 방법을 확인하세요.",links:[["모임·행사 안내","/news"],["월간 캘린더","/calendar"]],title:'독서모임',note:'작가와 책을 읽고,\n삶을 이야기하는 독서모임.',photo:'reading',alt:'조명과 펼친 책이 놓인 독서 테이블',paragraphs:['제주 이호테우의 작가작업실 JEJU에서는 작가와 함께 책을 읽고 이야기를 나누는 독서모임을 합니다.','깊은 해석이나 멋진 독후감은 없어도 괜찮습니다. 마음에 남은 한 문장만 있으면 충분해요.','작가작업실 JEJU에서 책 속 이야기와 우리의 이야기를 함께 나누세요.']},
 {slug:"writing-class",heading:"제주 글쓰기 클래스",description:"제주 이호테우에서 글쓰기를 시작하는 분을 위한 1일·4주 클래스입니다. 모집 공지에서 일정과 신청 방법을 확인하세요.",links:[["클래스 모집 안내","/news"],["월간 캘린더","/calendar"]],title:'글쓰기 클래스',note:'(4주, 1일)',photo:'writing',alt:'작가작업실 테이블에서 함께하는 글쓰기 모임',paragraphs:['글쓰기를 시작해 보고 싶지만 어디서부터 시작해야 할지 막막한 적 없으세요?','출간한 저 또한 처음 시작할 때는 어렵게만 느껴졌었습니다.','제주 이호테우에서 진행하는 글쓰기 클래스는 응원받으며 글쓰기를 시작할 수 있는 공간입니다.','작가작업실 JEJU는 언제나 기다릴게요.']},
 {slug:"space-rental",heading:"제주 이호테우 공간 대관",description:"독서모임, 글쓰기 모임, 소규모 북토크를 위한 제주 이호테우 공간 대관입니다. 이용 문의와 실제 대관 사례를 확인하세요.",links:[["공간 사진 보기","/space#author-gallery"],["방문 안내","/visit"]],title:'공간 대관',note:'(독서모임, 글쓰기 모임,\n북토크 등)',photo:'rental',alt:'창가와 모임 테이블이 있는 대관 공간',contact:'공간 대관',paragraphs:['제주 이호테우에서 독서모임이나 글쓰기 모임, 소규모 북토크를 열 공간을 찾고 계신가요?','작가작업실 JEJU에서 책과 이야기에만 집중할 수 있는 독립적인 공간을 대관합니다.','방해받지 않고 우리만의 편안한 시간을 만들어보세요.']},
 {slug:"event-planning",heading:"제주 북토크 행사 기획 및 운영",description:"제주에서 북토크와 작가와 독자의 만남을 준비하는 분을 위해 행사 기획과 현장 운영을 함께합니다.",links:[["모임·행사 기록","/news"],["공간 사진 보기","/space#author-gallery"]],title:'행사 기획 및 운영',note:'(북토크 등)',photo:'events',alt:'작가와 독자가 함께하는 북토크 현장',contact:'작가매니저',paragraphs:['제주에서 북토크나 작가와 독자의 만남을 준비하고 계시나요?','작가작업실 JEJU의 작가매니저가 행사 기획부터 현장 운영까지 함께합니다.','책과 독자와의 뜻깊은 만남을 만드세요.']}
];
const types={reading:'독서',writing:'글쓰기',themed:'주제모임',special:'특별행사'};
function date(value){if(!value)return '';return value.replaceAll('-','.')+' ('+['일','월','화','수','목','금','토'][new Date(value+'T00:00:00Z').getUTCDay()]+')';}
function rentalCases(items){return `<section class="program-cases" aria-labelledby="rental-cases-title"><div class="program-case-list">${items.slice(0,3).map(e=>`<article class="program-case"><a href="/news/${encodeURIComponent(e.slug)}">${e.images?.length?`<img src="${esc(e.images[e.cover_index]||e.images[0])}" alt="${esc(e.title)}" width="180" height="180" loading="lazy">`:'<div class="program-case-empty">모임·행사</div>'}<p class="program-case-tags"><span>대관 행사</span>${types[e.event_type]?`<span>${esc(types[e.event_type])}</span>`:''}</p><h3>${esc(e.title)}</h3><p class="program-case-date">${esc(date(e.event_date_start))}</p></a></article>`).join('')||'<p class="program-cases-empty">등록된 대관 사례가 없습니다.</p>'}</div><div class="program-cases-intro"><h2 id="rental-cases-title">이 공간에서 열린 모임·행사</h2><p>작가작업실 JEJU를 대관해 진행한 모임과 행사의 기록을 소개합니다.</p><a class="program-button" href="/news?operator=rental">대관 사례 전체 보기 <span aria-hidden="true">↗</span></a></div></section>`;}
function render(items){return '<div class="approved-program-list">'+programs.map((p,i)=>`<section class="approved-program-row" aria-labelledby="program-${p.photo}"><div class="program-summary"><p class="program-number">${String(i+1).padStart(2,'0')}</p><h2 id="program-${p.photo}">${p.title}</h2><p class="program-note">${p.note}</p><a class="program-button program-detail-link" href="/programs/${p.slug}">${p.title} 자세히 보기 <span aria-hidden="true">↗</span></a>${p.contact?'<a class="program-button" href="tel:01050657776">전화 문의 <span aria-hidden="true">↗</span></a>':''}</div><div class="approved-program-copy">${p.paragraphs.map(t=>`<p>${esc(t)}</p>`).join('')}${['reading','writing'].includes(p.photo)?'<p>일정·참가비·신청 방법은 <a href="/news">모집 중인 모임·행사 안내</a>에서 확인해 주세요.</p>':p.photo==='rental'?'<p>희망 날짜와 시간, 모임 내용, 인원을 알려주시면 이용 가능 여부와 비용을 안내합니다. <a href="/calendar">월간 캘린더</a> · <a href="/visit">위치·주차 안내</a></p>':''}${p.contact?`<p class="program-contact">${p.contact} 연락처 | <a href="tel:01050657776">010-5065-7776</a></p>`:''}</div><img class="program-photo program-photo-${p.photo}" src="/assets/program-${p.photo}.jpg" alt="${p.alt}" width="600" height="800" loading="${i?'lazy':'eager'}" decoding="async"></section>`+(i===3?rentalCases(items):'')).join('')+'</div>';}
function renderDetail(program,items,heading){
  const links=program.links.map(([label,href])=>`<a class="program-button" href="${href}">${label} <span aria-hidden="true">↗</span></a>`).join('');
  const contact=program.contact?'<a class="program-button" href="tel:01050657776">전화 문의 · 010-5065-7776</a>':'';
  const practical={
    'book-club':'일정, 참가비와 신청 방법은 모임·행사 안내에서 확인해 주세요.',
    'writing-class':'일정, 참가비와 신청 방법은 클래스 모집 안내에서 확인해 주세요.',
    'space-rental':'희망 날짜와 시간, 모임 내용, 인원을 알려주시면 이용 가능 여부와 비용을 안내합니다.'
  }[program.slug];
  return `
    <nav class="program-breadcrumb" aria-label="현재 위치"><a href="/programs">운영 프로그램</a><span aria-hidden="true">/</span><span aria-current="page">${program.title}</span></nav>
    ${heading}
    <section class="program-detail-grid" aria-labelledby="program-description">
      <img class="program-photo program-photo-${program.photo}" src="/assets/program-${program.photo}.jpg" alt="${program.alt}" width="600" height="800" decoding="async">
      <div class="approved-program-copy">
        <h2 id="program-description">${program.title} 안내</h2>
        <p class="program-note">${program.note}</p>
        ${program.paragraphs.map(paragraph=>'<p>'+esc(paragraph)+'</p>').join('')}
        ${practical?'<p>'+esc(practical)+'</p>':''}
        <div class="program-detail-actions">${contact}${links}</div>
      </div>
    </section>
    ${program.slug==='space-rental'?rentalCases(items):''}
    <nav class="program-related" aria-label="다른 운영 프로그램"><h2>다른 운영 프로그램</h2>${programs.filter(item=>item!==program).map(item=>`<a href="/programs/${item.slug}">${item.title} <span aria-hidden="true">↗</span></a>`).join('')}</nav>`;
}

function schema(base,program,title){
  const url=base+'/programs/'+program.slug;
  const mainEntity=program.slug==='bookstore'
    ?{'@id':base+'/#bookstore'}
    :{'@type':'Service',name:program.title,description:program.description,url,provider:{'@id':base+'/#bookstore'}};
  return {'@type':'WebPage',name:title,description:program.description,url,inLanguage:'ko-KR',mainEntity,
    breadcrumb:{'@type':'BreadcrumbList',itemListElement:[
      {'@type':'ListItem',position:1,name:'운영 프로그램',item:base+'/programs'},
      {'@type':'ListItem',position:2,name:program.title,item:url}
    ]}};
}

module.exports={programs,render,renderDetail,rentalCases,schema};
