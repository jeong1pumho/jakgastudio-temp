'use strict';
const {esc}=require('./core');
const author=[
  "남들 기준에 맞춰 살기 싫다고 외쳐대더니 『그렇게 남들 기준에 맞추며 살지 않아도 돼』라는 첫 책을 냈고, 온 세상 빌런들을 향해 삿대질을 해대더니 『빌런도감』이라는 두 번째 책까지 내버렸다.",
  "그러고도 성에 안 찼는지 두 번째 책 출간과 동시에 그토록 꿈꿔왔던 작고 소중한 책방을 제주 이호테우 앞에 떡하니 차려냈다.",
  "사람들과의 소소한 대화를 좋아하고, 주접 떠는 걸 좋아하고, 낭만이라면 사족을 못 쓴다.\n와인을 사랑하고 맥주는 매일 마신다.",
  "좋아하는 일을 하며 살겠다는 일념으로 책방을 찾는 손님들에게 느닷없이 와인을 건네기도 하고,\n처음 보는 사람과도 인생 이야기를 나누며 이호테우 앞에서 사랑방 같은 책방을 꾸려가는 중이다.",
  "책, 술, 고양이, 만담, 낭만, 고기, SNS, OTT…",
  "좋아하는 게 너무 많아 하루 24시간이 늘 부족하고, 덕분에 하루 종일 눈이 벌게져 있다.",
  "물론 대부분의 날은 낭만과 와인에 취해 벌게져 있는 편이다.",
  "인생은 짧고 하고 싶은 건 더럽게 많다.",
  "그러니 오늘도 읽고, 쓰고, 마시고, 떠들고, 사랑하며 살아가는 중."
];
const portrait='/assets/yoo-mi-kyung.png';
const books=[
  {title:'빌런도감',id:'197172702',date:'2026.10.06',pages:308,summary:'읽고도 답하지 않는 친구, 퇴근 직전에 일을 건네는 상사, 그리고 내 안의 자기검열까지. 일상 속 빌런을 유형별로 살펴보며, 그들에게 휘둘리지 않고 유머를 잃지 않는 법을 이야기한다.'},
  {title:'그렇게 남들 기준에 맞추며 살지 않아도 돼',id:'130024313',date:'2024.08.22',pages:280,summary:'학벌과 직장, 결혼과 육아를 지나며 당연하다고 믿었던 기준들을 하나씩 돌아본다. 타인의 기대에 맞춰 살던 저자가 자신에게 맞는 삶의 방식을 찾아가는 과정을 솔직하게 풀어낸 첫 에세이다.'}
];
const cover=(book,alt)=>'<img src="https://image.yes24.com/goods/'+book.id+'/XL" alt="'+esc(alt)+'" referrerpolicy="no-referrer">';

function render(gallery){
  return `
<section class="author-editorial-profile" aria-labelledby="author-name">
  <div class="author-editorial-composition">
    <figure class="author-editorial-portrait"><img src="${portrait}" alt="책을 읽고 있는 유미경 작가" width="1536" height="2048"></figure>
    <div class="author-editorial-intro"><h2 id="author-name">작가 유미경</h2><p class="author-editorial-lead">제주로 이주하자마자 글빨의 기운을<br>온몸으로 받아들여 에세이 두 권을 출간한 여자.</p><p>${esc(author[0])}</p></div>
  </div>
  <div class="author-editorial-story"><p class="author-editorial-turn">${esc(author[1]).replace(/(꿈꿔왔던 .+)$/, '<wbr><span class="author-editorial-turn-line">$1</span>')}</p><div class="author-editorial-prose">${author.slice(2).map(line=>'<p>'+esc(line).replace(/\n/g,'<br>')+'</p>').join('')}</div></div>
</section>
<section class="author-editorial-publications" aria-labelledby="author-publications"><h2 id="author-publications">유미경 작가의 책</h2>
  <div class="author-editorial-book-grid">${books.map(book=>`<article class="author-editorial-book"><figure>${cover(book,book.title+' 표지')}</figure><div><h3>${esc(book.title)}</h3><p class="author-editorial-meta">꿈공장플러스 · ${book.date} · ${book.pages}쪽</p><p>${esc(book.summary)}</p><a class="author-editorial-store" href="https://www.yes24.com/product/goods/${book.id}" target="_blank" rel="noopener">예스24에서 책 정보 보기 <span aria-hidden="true">↗</span></a></div></article>`).join('')}</div>
</section>
<section class="author-gallery" aria-labelledby="author-gallery"><h2 id="author-gallery">공간 사진 갤러리</h2>${gallery}</section>
<section class="author-section author-programs" aria-labelledby="author-programs"><h2 id="author-programs">운영 프로그램</h2><div><p>책방, 독서모임, 글쓰기 클래스, 공간 대관과 행사 기획을 만나보세요.</p><a class="author-link" href="/programs">운영 프로그램 바로가기 <span aria-hidden="true">↗</span></a></div></section>`;
}

function schema(base,title,description){
  return {'@type':'AboutPage',name:title,description,url:base+'/space',inLanguage:'ko-KR',
    mainEntity:{'@type':'Person','@id':base+'/space#author',name:'유미경',jobTitle:'작가',image:base+portrait,
      url:base+'/space',worksFor:{'@id':base+'/#bookstore'},
      subjectOf:books.map(({title:name})=>({'@type':'Book',name,author:{'@id':base+'/space#author'}}))}};
}

module.exports={render,schema,portrait};
