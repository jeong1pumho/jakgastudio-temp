'use strict';
const {esc}=require('./core');
const {jsonLd,displayBrand}=require('./seo');
function graph(base,page){
 const shop=base+'/#bookstore';
 return {'@context':'https://schema.org','@graph':[
 {'@type':'BookStore','@id':shop,name:'작가작업실 제주',url:base+'/',image:base+'/assets/hero-01.jpg',telephone:'+82-64-744-0376',email:'jakgastudio@gmail.com',address:{'@type':'PostalAddress',streetAddress:'이호일동 375-3 1층',addressLocality:'제주시',addressRegion:'제주특별자치도',addressCountry:'KR'},description:'제주 이호테우에 있는 작가 유미경의 책방.',hasMap:'https://map.naver.com/p/entry/place/2020396707',sameAs:['https://map.naver.com/p/entry/place/2020396707','https://www.instagram.com/jakgastudio/']},
 {'@type':'WebSite','@id':base+'/#website',name:'작가작업실 제주',url:base+'/',inLanguage:'ko-KR',publisher:{'@id':shop}},
 {...page,'@id':page.url+'#webpage',isPartOf:{'@id':base+'/#website'},about:{'@id':shop}}
 ]};
}
function sharing(base,title,description,image){const src=image||base+'/assets/hero-01.jpg';return '<meta property="og:type" content="website"><meta property="og:locale" content="ko_KR"><meta property="og:site_name" content="작가작업실 제주"><meta property="og:image" content="'+esc(src)+'"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="'+esc(title)+'"><meta name="twitter:description" content="'+esc(description)+'"><meta name="twitter:image" content="'+esc(src)+'">';}
function archive(base,title,description,url,items){return '<meta property="og:title" content="'+esc(title)+'"><meta property="og:description" content="'+esc(description)+'"><meta property="og:url" content="'+esc(url)+'">'+sharing(base,title,description)+'<script type="application/ld+json">'+jsonLd(graph(base,{'@type':'CollectionPage',name:title,description,url,inLanguage:'ko-KR',mainEntity:{'@type':'ItemList',itemListElement:items.map((x,i)=>({'@type':'ListItem',position:i+1,name:displayBrand(x.title),url:base+'/news/'+encodeURIComponent(x.slug)}))}}))+'</script>';}
function breadcrumb(base, items){
 return {'@type':'BreadcrumbList',itemListElement:[['홈','/'],...items].map(([name,path],i)=>(
  {'@type':'ListItem',position:i+1,name,item:base+path}
 ))};
}
module.exports={graph,sharing,archive,breadcrumb};
