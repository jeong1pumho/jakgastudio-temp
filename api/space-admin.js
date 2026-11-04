'use strict';
const {admin,query,root,key,send}=require('../lib/core');
const MAX_PHOTOS=80;
const LEGACY=/^\/assets\/space-refresh-20261104-(?:0[1-9]|1[0-9]|2[0-2])\.webp$/;
const IMAGE_NAME=/^photos\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(?:jpg|png|webp|avif)$/i;
const mediaPrefix=()=>root()+'/storage/v1/object/public/space-media/';
const storedPath=src=>{
 if(typeof src!=='string'||!src.startsWith(mediaPrefix()))return null;
 const part=src.slice(mediaPrefix().length);
 return IMAGE_NAME.test(part)?part:null;
};
function cleanImages(items){
 if(!Array.isArray(items)||items.length>MAX_PHOTOS)throw Object.assign(Error('공간 사진은 최대 80장까지 등록할 수 있습니다.'),{status:400});
 const result=[],used=new Set();
 for(const item of items){
  if(!item||typeof item!=='object'||typeof item.src!=='string')throw Object.assign(Error('사진 데이터가 올바르지 않습니다.'),{status:400});
  const src=item.src.trim();
  if(!LEGACY.test(src)&&!storedPath(src))throw Object.assign(Error('허용되지 않은 사진 주소입니다.'),{status:400});
  if(used.has(src))throw Object.assign(Error('동일한 사진은 중복 등록할 수 없습니다.'),{status:400});
  used.add(src);
  const alt=String(item.alt||'작가작업실 JEJU 공간').trim().slice(0,160);
  result.push({src,alt:alt||'작가작업실 JEJU 공간'});
 }
 return result;
}
module.exports=async(req,res)=>{
 try{
  const token=await admin(req);
  if(req.method==='GET'){
   const rows=await query('/rest/v1/space_gallery?select=images,version,updated_at&id=eq.1&limit=1','GET',undefined,token);
   if(!rows.length)return send(res,503,{error:'공간 사진 설정이 없습니다.'});
   return send(res,200,{...rows[0],config:{url:root(),key:key(),maxPhotos:MAX_PHOTOS}});
  }
  if(req.method==='PATCH'){
   const version=req.body?.version;
   if(!Number.isSafeInteger(version)||version<1)return send(res,400,{error:'변경 버전이 올바르지 않습니다.'});
   const images=cleanImages(req.body?.images);
   const rows=await query('/rest/v1/space_gallery?id=eq.1&version=eq.'+version+'&select=images,version,updated_at',
    'PATCH',{images,version:version+1,updated_at:new Date().toISOString()},token);
   if(!rows.length)return send(res,409,{error:'다른 관리자 화면에서 먼저 변경했습니다. 새로고침 후 다시 편집해 주세요.'});
   return send(res,200,{images:rows[0].images,version:rows[0].version,updated_at:rows[0].updated_at});
  }
  if(req.method==='POST'&&req.body?.action==='cleanup'){
   const urls=req.body?.urls;
   if(!Array.isArray(urls)||urls.length>MAX_PHOTOS)return send(res,400,{error:'정리 대상이 올바르지 않습니다.'});
   const paths=urls.map(storedPath);
   if(paths.some(x=>!x))return send(res,400,{error:'업로드한 공간 사진만 정리할 수 있습니다.'});
   const current=await query('/rest/v1/space_gallery?select=images&id=eq.1&limit=1','GET',undefined,token);
   const published=new Set(current[0]?.images?.map(x=>x.src)||[]);
   if(urls.some(url=>published.has(url)))return send(res,409,{error:'현재 게시 중인 사진은 삭제할 수 없습니다.'});
   if(!paths.length)return send(res,200,{ok:true,removed:0});
   const response=await fetch(root()+'/storage/v1/object/space-media',{
    method:'DELETE',headers:{apikey:key(),Authorization:'Bearer '+token,'Content-Type':'application/json'},
    body:JSON.stringify({prefixes:[...new Set(paths)]})
   });
   if(!response.ok)return send(res,502,{error:'저장소 파일 정리 실패 ('+response.status+')'});
   return send(res,200,{ok:true,removed:paths.length});
  }
  return send(res,405,{error:'허용되지 않은 요청입니다.'});
 }catch(e){return send(res,e.status||500,{error:e.status>=500?'공간 사진 처리 중 서버 오류가 발생했습니다.':e.message});}
};
