'use strict';
const {query,ready,send}=require('../lib/core');
module.exports=async(req,res)=>{
 try{
  if(req.method!=='GET')return send(res,405,{error:'Method not allowed'});
  if(!ready())return send(res,503,{error:'Database not configured'});
  const rows=await query('/rest/v1/space_gallery?select=images,version&id=eq.1&limit=1');
  if(!rows.length)return send(res,503,{error:'SPACE gallery not configured'});
  return send(res,200,{images:rows[0].images,version:rows[0].version});
 }catch(e){return send(res,e.status||500,{error:'공간 사진을 불러오지 못했습니다.'});}
};
