'use strict';
const {esc}=require('./core');
const intro=[
  "제주로 이주하자마자 글빨을 기를 온몸으로 받아들여 에세이 두 권을 출간한 여자.",
  "남들 기준에 맞춰 살기 싫다고 외쳐대더니 『그렇게 남들 기준에 맞추며 살지 않아도 돼』라는 첫 책을 냈고, 온 세상 빌런들을 향해 삿대질을 해대더니 『빌런도감』이라는 두 번째 책까지 내버렸다.",
  "그러고도 성에 안 찼는지 두 번째 책 출간과 동시에 그토록 꿈꿔왔던 작고 소중한 책방을 제주 이호테우 앞에 떡하니 차려냈다.",
  "사람들과의 소소한 대화를 좋아하고, 주접 떠는 걸 좋아하고, 낭만이라면 사족을 못 쓴다. 와인을 사랑하고 맥주는 매일 마신다.",
  "좋아하는 일을 하며 살겠다는 일념으로 책방을 찾는 손님들에게 느닷없이 와인을 건네기도 하고, 처음 보는 사람과도 인생 이야기를 나누며 이호테우 앞에서 사랑방 같은 책방을 꾸려가는 중이다.",
  "책, 술, 고양이, 만담, 낭만, 고기, SNS, OTT…",
  "좋아하는 게 너무 많아 하루 24시간이 늘 부족하고, 덕분에 하루 종일 눈이 벌게져 있다.",
  "물론 대부분의 날은 낭만과 와인에 취해 벌게져 있는 편이다.",
  "인생은 짧고 하고 싶은 건 더럽게 많다.",
  "그러니 오늘도 읽고, 쓰고, 마시고, 떠들고, 사랑하며 살아가는 중."
];
const portrait='/assets/yoo-mi-kyung.png';
const books=['그렇게 남들 기준에 맞추며 살지 않아도 돼','빌런도감'];

function paragraphs(items){
  return items.map(text=>'<p>'+esc(text)+'</p>').join('');
}

function render(gallery){
  return `
    <section class="author-profile" aria-labelledby="author-title">
      <div class="author-copy">
        <h2 id="author-title">작가 유미경 소개</h2>
        <p class="author-lead">${esc(intro[0])}</p>
        ${paragraphs([intro[3],...intro.slice(5)])}
      </div>
      <figure class="author-portrait"><img src="${portrait}" alt="유미경 작가" width="1536" height="2048" fetchpriority="high" decoding="async"></figure>
    </section>
    <section class="author-section" aria-labelledby="author-books">
      <h2 id="author-books">작가의 책과 글</h2>
      <div>${paragraphs([intro[1]])}<ul class="author-books">${books.map(book=>'<li><cite>『'+esc(book)+'』</cite></li>').join('')}</ul></div>
    </section>
    <section class="author-section" aria-labelledby="author-story">
      <h2 id="author-story">작가작업실을 만든 이유</h2>
      <div>${paragraphs([intro[2],intro[4]])}</div>
    </section>
    <section class="author-gallery" aria-labelledby="author-gallery">
      <h2 id="author-gallery">공간 사진 갤러리</h2>
      ${gallery}
    </section>
    <section class="author-section author-programs" aria-labelledby="author-programs">
      <h2 id="author-programs">운영 프로그램</h2>
      <div><p>책방, 독서모임, 글쓰기 클래스, 공간 대관과 행사 기획을 만나보세요.</p><a class="author-link" href="/programs">운영 프로그램 바로가기 <span aria-hidden="true">↗</span></a></div>
    </section>`;
}

function schema(base,title,description){
  return {'@type':'AboutPage',name:title,description,url:base+'/space',inLanguage:'ko-KR',
    mainEntity:{'@type':'Person','@id':base+'/space#author',name:'유미경',jobTitle:'작가',image:base+portrait,
      url:base+'/space',worksFor:{'@id':base+'/#bookstore'},
      subjectOf:books.map(name=>({'@type':'Book',name,author:{'@id':base+'/space#author'}}))}};
}

module.exports={render,schema,portrait};
