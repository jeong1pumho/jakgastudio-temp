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

module.exports={richMarker,isRich,bookHtml,bookText};
