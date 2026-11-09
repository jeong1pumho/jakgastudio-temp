const {query,send,admin,root}=require('../core');
const uuid=/^[a-f0-9]{8}-[a-f0-9-]{27}$/i;
function validate(b){
 const title=String(b.title||'').trim(),recommendation=String(b.recommendation||'').trim();
 if(!title||title.length>150||!recommendation||recommendation.length>5000)throw Object.assign(Error('책 제목과 추천 내용을 입력해 주세요. 제목 150자, 추천 내용 5,000자 이내입니다.'),{status:400});
 const prefix=root()+'/storage/v1/object/public/book-media/books/';
 if(!Array.isArray(b.images)||b.images.length<1||b.images.length>20||!b.images.every(x=>typeof x==='string'&&x.startsWith(prefix)&&!x.includes('..')&&x.length<1000))throw Object.assign(Error('정사각형 사진을 1~20장 등록해 주세요.'),{status:400});
 const order=Number(b.sort_order);if(!Number.isSafeInteger(order)||Math.abs(order)>1000000)throw Object.assign(Error('노출 순서를 확인해 주세요.'),{status:400});
 return {title,recommendation,images:b.images,sort_order:order,published:b.published===true,updated_at:new Date().toISOString()};
}
module.exports=async(req,res)=>{try{
 if(req.method==='GET'&&req.query?.admin!=='1')return send(res,200,{items:await query('/rest/v1/recommended_books?published=eq.true&order=sort_order.desc,created_at.desc&limit=100')});
 const token=await admin(req);
 if(req.method==='GET')return send(res,200,{items:await query('/rest/v1/recommended_books?order=sort_order.desc,created_at.desc&limit=1000','GET',undefined,token)});
 if(req.method==='POST'||req.method==='PATCH'){
  const data=validate(req.body||{});let path='/rest/v1/recommended_books';
  if(req.method==='PATCH'){if(!uuid.test(req.body.id||''))return send(res,400,{error:'도서 ID 오류'});path+='?id=eq.'+req.body.id;}
  const rows=await query(path,req.method,data,token);if(!rows?.length)return send(res,404,{error:'도서를 찾을 수 없습니다.'});return send(res,req.method==='POST'?201:200,{item:rows[0]});
 }
 if(req.method==='DELETE'){if(!uuid.test(req.query.id||''))return send(res,400,{error:'도서 ID 오류'});await query('/rest/v1/recommended_books?id=eq.'+req.query.id,'DELETE',undefined,token);return send(res,200,{ok:true});}
 return send(res,405,{error:'허용되지 않은 요청입니다.'});
}catch(e){return send(res,e.status||500,{error:e.status&&e.status<500?e.message:'도서 정보를 처리하지 못했습니다.'});}};
module.exports.validate=validate;
