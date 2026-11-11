'use strict';
const {root,key,ready}=require('./core');
const pageSize=12;
const pageUrl=n=>n===1?'/books':'/books?page='+n;
async function loadPage(raw){
 const value=raw===undefined||raw==='books'?'1':raw;
 if(typeof value!=='string'||! /^[1-9][0-9]{0,5}$/.test(value))return {status:400};
 const page=Number(value);if(!ready())throw Error('Database configuration missing');
 const response=await fetch(root()+'/rest/v1/recommended_books?select=id,title,recommendation,images&published=eq.true&order=sort_order.desc,created_at.desc,id.desc&limit='+pageSize+'&offset='+((page-1)*pageSize),{headers:{apikey:key(),Accept:'application/json',Prefer:'count=exact'}});
 if(response.status===416)return {status:404};
 if(!response.ok)throw Error('Book list unavailable');
 const total=Number((response.headers.get('content-range')||'').split('/')[1]);
 if(!Number.isSafeInteger(total)||total<0)throw Error('Invalid book count');
 const pages=Math.max(1,Math.ceil(total/pageSize));if(page>pages)return {status:404};
 return {items:await response.json(),page,pages,total};
}
function pagination(page,pages,total){
 if(pages<=1)return '';
 const start=Math.max(1,Math.min(page-2,pages-4)),end=Math.min(pages,start+4);
 let html='<nav class="books-pagination" aria-label="추천 도서 페이지">';
 if(page>1)html+='<a rel="prev" href="'+pageUrl(page-1)+'">이전</a>';
 for(let n=start;n<=end;n++)html+=n===page?'<span aria-current="page" aria-label="현재 '+n+'페이지">'+n+'</span>':'<a href="'+pageUrl(n)+'" aria-label="'+n+'페이지">'+n+'</a>';
 if(page<pages)html+='<a rel="next" href="'+pageUrl(page+1)+'">다음</a>';
 return html+'</nav><p class="books-page-count">전체 '+total+'개 · '+page+' / '+pages+' 페이지</p>';
}
module.exports={loadPage,pagination,pageUrl};
