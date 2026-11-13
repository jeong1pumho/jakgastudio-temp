'use strict';
const {cleanHtml}=require('./rich');
const {plainDescription}=require('./seo');

const richMarker='<!--book-rich-->';
const isRich=value=>String(value??'').startsWith(richMarker);
const bookHtml=value=>cleanHtml(String(value).slice(richMarker.length));
function bookText(value){
 return isRich(value)
  ? plainDescription(bookHtml(value).replace(/<\/?(?:a|span|b|strong|em|i|u|s)\b[^>]*>/gi,''),5000)
  : String(value??'').trim();
}

// Store both fields together in the existing recommendation column.
const fieldsMarker='<!--book-fields-v1-->';
function packRecommendation(label,body){
 return fieldsMarker+JSON.stringify({label,body});
}

function bookFields(book){
 const value=String(book.recommendation??'');
 if(value.startsWith(fieldsMarker)){
  try{
   const {label,body}=JSON.parse(value.slice(fieldsMarker.length));
   if(typeof label==='string'&&typeof body==='string')return {title:book.title,label,body};
  }catch{}
 }
 if(isRich(value)){
  const html=bookHtml(value);
  const sections=html.match(/^([\s\S]*?)<u>\s*유미경 리뷰\s*:\s*<\/u>\s*(?:<br>\s*)?([\s\S]*)$/);
  if(sections){
   const headings=[...sections[1].matchAll(/<p(?:\s[^>]*)?>([\s\S]*?)<\/p>/g)]
    .map(match=>plainDescription(match[1],5000)).filter(Boolean);
   if(headings.length===2&&headings[0].startsWith(book.title)&&headings[0].length<=150&&headings[1].length<=150){
    return {title:headings[0],label:headings[1],body:richMarker+sections[2]};
   }
  }
 }
 return {title:book.title,label:'',body:value};
}

module.exports={richMarker,isRich,bookHtml,bookText,bookFields,packRecommendation};
