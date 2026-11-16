const {displayBrand}=require('./seo');
'use strict';
const {esc}=require('./core');
const programs=[
 {slug:"bookstore",heading:"제주 이호테우 독립서점",description:"유미경 작가가 직접 읽고 고른 책을 만날 수 있는 제주 이호테우의 독립서점입니다. 추천 도서와 방문 정보를 확인하세요.",links:[["작가 추천 도서","/books"],["방문 안내","/visit"]],title:'책방',note:'작가가 추천하는 베스트셀러\n(10% 할인)',photo:'bookshop',alt:'서가에서 책을 소개하는 작가',paragraphs:['제주 이호테우에 자리한 작은 동네서점, 작가작업실 제주입니다.','작가 유미경이 직접 읽고 오래 마음에 남은 책들과 많은 독자에게 사랑받은 베스트셀러를 마련해 두었습니다.','천천히 책을 둘러보며 지금 나에게 필요한 한 권을 만나보세요.']},
 {slug:"book-club",heading:"제주 독서모임",description:"제주 이호테우에서 작가와 책을 읽고 마음에 남은 문장과 이야기를 나누는 독서모임입니다. 모집 공지에서 신청 방법을 확인하세요.",links:[["모임·행사 안내","/news"],["월간 캘린더","/calendar"]],title:'독서모임',note:'작가와 책을 읽고,\n삶을 이야기하는 독서모임.',photo:'reading',alt:'조명과 펼친 책이 놓인 독서 테이블',paragraphs:['제주 이호테우의 작가작업실 제주에서는 작가와 함께 책을 읽고 이야기를 나누는 독서모임을 합니다.','깊은 해석이나 멋진 독후감은 없어도 괜찮습니다. 마음에 남은 한 문장만 있으면 충분해요.','작가작업실 제주에서 책 속 이야기와 우리의 이야기를 함께 나누세요.']},
 {slug:"writing-class",heading:"제주 글쓰기 클래스",description:"제주 이호테우에서 글쓰기를 시작하는 분을 위한 1일·4주 클래스입니다. 모집 공지에서 일정과 신청 방법을 확인하세요.",links:[["클래스 모집 안내","/news"],["월간 캘린더","/calendar"]],title:'글쓰기 클래스',note:'(4주, 1일)',photo:'writing',alt:'펼친 노트에 연필로 글을 쓰는 손',paragraphs:['글쓰기를 시작해 보고 싶지만 어디서부터 시작해야 할지 막막한 적 없으세요?','출간한 저 또한 처음 시작할 때는 어렵게만 느껴졌었습니다.','제주 이호테우에서 진행하는 글쓰기 클래스는 응원받으며 글쓰기를 시작할 수 있는 공간입니다.','작가작업실 제주는 언제나 기다릴게요.']},
 {slug:"space-rental",heading:"제주 이호테우 공간 대관",description:"독서모임, 글쓰기 모임, 소규모 북토크를 위한 제주 이호테우 공간 대관입니다. 이용 문의와 실제 대관 사례를 확인하세요.",links:[["공간 사진 보기","/space#author-gallery"],["방문 안내","/visit"]],title:'공간 대관',note:'(독서모임, 글쓰기 모임,\n북토크 등)',photo:'rental',alt:'창가와 모임 테이블이 있는 대관 공간',contact:'공간 대관',paragraphs:['제주 이호테우에서 독서모임이나 글쓰기 모임, 소규모 북토크를 열 공간을 찾고 계신가요?','작가작업실 제주에서 책과 이야기에만 집중할 수 있는 독립적인 공간을 대관합니다.','방해받지 않고 우리만의 편안한 시간을 만들어보세요.']},
 {slug:"event-planning",heading:"제주 북토크 행사 기획 및 운영",description:"제주에서 북토크와 작가와 독자의 만남을 준비하는 분을 위해 행사 기획과 현장 운영을 함께합니다.",links:[["모임·행사 기록","/news"],["공간 사진 보기","/space#author-gallery"]],title:'행사 기획 및 운영',note:'(북토크 등)',photo:'events',alt:'작가와 독자가 함께하는 북토크 현장',contact:'작가매니저',paragraphs:['제주에서 북토크나 작가와 독자의 만남을 준비하고 계시나요?','작가작업실 제주의 작가매니저가 행사 기획부터 현장 운영까지 함께합니다.','책과 독자와의 뜻깊은 만남을 만드세요.']}
];
const detailData={
  "bookstore": {
    "headline": "작가가 만든 제주의 작은 책방",
    "subtitle": "(모든 도서 10% 할인)",
    "paragraphs": [
      "제주 이호테우에 자리한 작가작업실 JEJU의 책방은\n유미경 작가가 직접 읽고, 오래 마음에 남았던 책들로 채워놓은 공간입니다.",
      "국내외 베스트셀러, 에세이와 소설, 고전, 그림책부터\n유미경 작가의 소장책까지\n500여권의 책들을 전시하고 있습니다.",
      "단순히 책만을 판매하려 하지 않습니다.\n작가가 어떤 이유로 책을 선택했는지 이야기를 나누고, 책을 추천받을 수 있는 공간으로 만들었습니다.",
      "유미경 작가만의 시선이 담긴 책 큐레이션도 만나볼 수 있죠.",
      "마음에 남을 책을 찾고 싶을 때,\n작가가 만든 책방 작가작업실 JEJU로 오세요."
    ],
    "photos": [
      "/assets/bookstore-photo-1.webp",
      "/assets/bookstore-photo-2.webp",
      "/assets/bookstore-photo-3.webp"
    ],
    "buttons": [
      [
        "작가 추천 도서 보기",
        "/books"
      ],
      [
        "방문 안내",
        "/visit"
      ]
    ]
  },
  "book-club": {
    "headline": "작가와 함께 책을 읽고, 서로의 생각을 나누는 시간",
    "subtitle": "",
    "paragraphs": [
      "제주 이호테우에서\n출간 작가 유미경이 직접 주관하는\n작가작업실 JEJU의 독서모임입니다.",
      "내가 바라보는 문장,\n작가가 바라보는 문장,\n그리고 책 속에 담긴 의미를 함께 나누며\n한 권의 책을 조금 더 깊이 읽어 볼 수 있습니다.",
      "깊은 해석이나 멋진 독후감은 없어도 괜찮습니다.\n마음에 남은 한 문장만 있으면 충분해요.",
      "책을 통해 떠오르는 각자의 생각과 삶의 이야기를\n작가작업실 JEJU에서 자유롭게 나누세요."
    ],
    "photos": [
      "/assets/book-club-photo-1.webp",
      "/assets/book-club-photo-2.webp",
      "/assets/book-club-photo-3.webp"
    ],
    "buttons": [
      [
        "모임·행사 보기",
        "/news"
      ],
      [
        "월간 캘린더",
        "/calendar"
      ]
    ]
  },
  "writing-class": {
    "headline": "마음속에 담아두었던 이야기를 처음으로 글로 꺼내는 시간",
    "subtitle": "",
    "paragraphs": [
      "글쓰기를 시작해 보고 싶지만 어디서부터 시작해야 할지 막막한 적 있으실 겁니다.\n지금은 작가인 저 역시 글쓰기를 처음 시작할 때는 어렵게만 느껴졌어요.",
      "글을 잘 쓰거나 책을 출간할 필요는 없습니다.",
      "그동안 마음속에 담아두었지만\n쉽게 꺼내지 못했던 자신의 이야기를\n한 번 꺼내 글로 담아보는 시간을 가져보시면 됩니다.",
      "이제 나의 이야기를 글로 시작할 수 있습니다.\n출간 작가 유미경과 제주 작가작업실 JEJU에서 함께해요."
    ],
    "photos": [
      "/assets/writing-class-photo-1.webp",
      "/assets/writing-class-photo-2.webp",
      "/assets/writing-class-photo-3.webp"
    ],
    "buttons": [
      [
        "모임·행사 보기",
        "/news"
      ],
      [
        "월간 캘린더",
        "/calendar"
      ]
    ]
  },
  "space-rental": {
    "headline": "제주 이호테우의 감성과 예술적 분위기를 담은 독립된 모임 공간",
    "subtitle": "",
    "paragraphs": [
      "제주 이호테우에 자리한 작가작업실 JEJU는\n독서모임, 글쓰기 모임, 북토크 등\n다양한 소규모 모임을 위한 공간 대관을 제공합니다.",
      "갤러리와 같은 건물에 자리하여 예술적인 분위기를 느낄 수 있고,\n이호테우만의 조용하고 여유로운 감성을 간직한 공간입니다.",
      "대관 시간에는 일반 방문객을 받지 않아,\n예약한 모임만 공간을 단독으로 사용할 수 있습니다.",
      "우리 모임만의 공간을 원하신다면,\n작가작업실 JEJU로 예약하세요."
    ],
    "contactLabel": "공간 대관 연락처",
    "phone": "010-5065-7776",
    "photos": [
      "/assets/program-rental.jpg",
      "/assets/space-refresh-20261104-11.webp",
      "/assets/space-refresh-20261104-16.webp"
    ],
    "buttons": [
      [
        "방문 안내",
        "/visit"
      ],
      [
        "공간 대관 문의",
        "tel:01050657776"
      ]
    ]
  },
  "event-planning": {
    "headline": "첫 북토크를 준비하는 작가를 위한 행사 기획과 운영",
    "subtitle": "",
    "paragraphs": [
      "작가작업실 JEJU는 북토크를 처음 준비하는 작가를 위해 행사 기획부터 현장 운영까지 함께하는 제주 북토크 기획·운영 서비스를 제공합니다.",
      "다양한 기업 행사와 프로모션을 기획하고 운영해 온 작가매니저의 경험을 바탕으로, 작가와 책의 특성에 맞는 북토크를 기획합니다.",
      "행사 프로그램 구성과 진행 준비는 물론, 홍보 비주얼과 초청장 이미지 제작까지 지원하여 북토크 경험이 없는 작가도 자신의 책과 독자와의 만남에 집중할 수 있도록 돕습니다."
    ],
    "contactLabel": "작가매니저 연락처",
    "phone": "010-5065-7776",
    "photos": [
      "/assets/program-events.jpg",
      "/assets/space-refresh-20261104-17.webp",
      "/assets/space-refresh-20261104-11.webp"
    ],
    "buttons": [
      [
        "행사 문의",
        "tel:01050657776"
      ],
      [
        "방문 안내",
        "/visit"
      ]
    ]
  }
};
programs.forEach(p=>Object.assign(p,detailData[p.slug]));
const types={reading:'독서',writing:'글쓰기',themed:'주제모임',special:'특별행사'};
function date(value){if(!value)return '';return value.replaceAll('-','.')+' ('+['일','월','화','수','목','금','토'][new Date(value+'T00:00:00Z').getUTCDay()]+')';}
function rentalCases(items){return `<section class="program-cases" aria-labelledby="rental-cases-title"><div class="program-case-list">${items.slice(0,3).map(e=>`<article class="program-case"><a href="/news/${encodeURIComponent(e.slug)}">${e.images?.length?`<img src="${esc(e.images[e.cover_index]||e.images[0])}" alt="${esc(displayBrand(e.title))}" width="180" height="180" loading="lazy">`:'<div class="program-case-empty">모임·행사</div>'}<p class="program-case-tags"><span>대관 행사</span>${types[e.event_type]?`<span>${esc(types[e.event_type])}</span>`:''}</p><h3>${esc(displayBrand(e.title))}</h3><p class="program-case-date">${esc(date(e.event_date_start))}</p></a></article>`).join('')||'<p class="program-cases-empty">등록된 대관 사례가 없습니다.</p>'}</div><div class="program-cases-intro"><h2 id="rental-cases-title">이 공간에서 열린 모임·행사</h2><p>작가작업실 제주를 대관해 진행한 모임과 행사의 기록을 소개합니다.</p><a class="program-button" href="/news?operator=rental">대관 사례 전체 보기 <span aria-hidden="true">↗</span></a></div></section>`;}
function coverPhoto(program){
 return ['bookstore','book-club','writing-class'].includes(program.slug)?program.photos[0]:'/assets/program-'+program.photo+'.jpg';
}
function render(items){return '<div class="approved-program-list">'+programs.map((p,i)=>`<section class="approved-program-row" aria-labelledby="program-${p.photo}"><div class="program-summary"><p class="program-number">${String(i+1).padStart(2,'0')}</p><h2 id="program-${p.photo}">${p.title}</h2><p class="program-note">${p.note}</p><a class="program-button program-detail-link" href="/programs/${p.slug}">${p.title} 자세히 보기 <span aria-hidden="true">↗</span></a>${p.contact?'<a class="program-button" href="tel:01050657776">전화 문의 <span aria-hidden="true">↗</span></a>':''}</div><div class="approved-program-copy">${p.paragraphs.map(t=>`<p>${esc(t)}</p>`).join('')}${['reading','writing'].includes(p.photo)?'<p>일정·참가비·신청 방법은 <a href="/news">모집 중인 모임·행사 안내</a>에서 확인해 주세요.</p>':p.photo==='rental'?'<p>희망 날짜와 시간, 모임 내용, 인원을 알려주시면 이용 가능 여부와 비용을 안내합니다. <a href="/calendar">월간 캘린더</a> · <a href="/visit">위치·주차 안내</a></p>':''}${p.contact?`<p class="program-contact">${p.contact} 연락처 | <a href="tel:01050657776">010-5065-7776</a></p>`:''}</div><img class="program-photo program-photo-${p.photo}" src="${coverPhoto(p)}" alt="${p.slug==='bookstore'?'책방 서가에 진열된 도서':p.alt}" width="600" height="800" loading="${i?'lazy':'eager'}" decoding="async"></section>`+(i===3?rentalCases(items):'')).join('')+'</div>';}

function renderSharedHeading(){
 return '<header class="subpage-heading program-editorial-header">'
  +'<p class="subpage-eyebrow">OUR PROGRAMS</p>'
  +'<h2>운영 프로그램</h2>'
  +'<p class="subpage-intro">책방과 독서모임, 글쓰기 클래스부터 소규모 공간 대관과 북토크 행사까지.<br>작가작업실 제주에서 함께할 수 있는 프로그램을 소개합니다.</p>'
  +'</header>';
}
function renderDetail(program,items,heading){
 const nav=programs.map((p,i)=>'<a class="program-editorial-nav-link'+(p.slug===program.slug?' is-active':'')+'" href="/programs/'+p.slug+'"'+(p.slug===program.slug?' aria-current="page"':'')+'><span class="program-editorial-index">'+String(i+1).padStart(2,'0')+'</span><span>'+esc(p.title)+'</span></a>').join('');
 const body=program.paragraphs.map(paragraph=>'<p>'+esc(paragraph).replace(/\n/g,'<br>')+'</p>').join('');
 const subtitle=program.subtitle?'<p class="program-editorial-subtitle">'+esc(program.subtitle)+'</p>':'';
 const contact=program.phone?'<p class="program-editorial-contact">'+esc(program.contactLabel)+' | <a href="tel:'+program.phone.replace(/\D/g,'')+'">'+esc(program.phone)+'</a></p>':'';
 const actions=program.buttons.map(([label,href])=>'<a class="program-editorial-button" href="'+esc(href)+'">'+esc(label)+' <span aria-hidden="true">›</span></a>').join('');
 const photos=program.photos.map((src,i)=>'<img src="'+esc(src)+'" alt="'+esc(program.title)+' 공간 사진 '+(i+1)+'" width="320" height="235" loading="'+(i?'lazy':'eager')+'" decoding="async">').join('');
 return heading+'<div class="program-editorial-grid">'
  +'<nav class="program-editorial-sidebar" aria-label="운영 프로그램 선택">'+nav+'</nav>'
  +'<article class="program-editorial-article"><h1>'+esc(program.headline)+'</h1>'+subtitle
  +'<div class="program-editorial-body">'+body+'</div>'+contact
  +'<div class="program-editorial-actions">'+actions+'</div></article>'
  +'<aside class="program-editorial-photos" aria-label="'+esc(program.title)+' 사진">'+photos+'</aside>'
  +'</div>';
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

module.exports={programs,coverPhoto,render,renderDetail,renderSharedHeading,rentalCases,schema};
