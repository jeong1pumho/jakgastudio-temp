'use strict';
function timestamp(date,time){
 if(time==='24:00:00'){
  const next=new Date(date+'T00:00:00Z');
  next.setUTCDate(next.getUTCDate()+1);
  return next.toISOString().slice(0,10)+'T00:00:00+09:00';
 }
 return date+'T'+time.slice(0,8)+'+09:00';
}
function eventGraph(post,sessions,url,description,cover){
 if(post.operator_type!=='studio')return [];
 const occurrences=sessions.map(e=>({key:e.id,start:timestamp(e.event_date,e.start_time),end:timestamp(e.event_date,e.end_time)}));
 if(!occurrences.length&&post.event_date_start)occurrences.push({key:'',start:post.event_date_start,end:post.event_date_end});
 return occurrences.map(({key,start,end})=>({
  '@type':'Event','@id':url+'#event'+(key?'-'+key:''),url,name:post.title,description,startDate:start,
  ...(end?{endDate:end}:{}),...(cover?{image:cover}:{}),
  location:{'@type':'Place',name:'작가작업실 JEJU',address:{'@type':'PostalAddress',streetAddress:'이호일동 375-3 1층',addressLocality:'제주시',addressRegion:'제주특별자치도',addressCountry:'KR'}},
  organizer:{'@type':'Organization',name:'작가작업실 JEJU'},
  ...(Number.isInteger(post.price_krw)?{offers:{'@type':'Offer',price:post.price_krw,priceCurrency:'KRW',url}}:{})
 }));
}
module.exports={eventGraph};
