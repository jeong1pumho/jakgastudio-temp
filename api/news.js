const {query,ready,send,selected}=require('../lib/core');
module.exports=async(req,res)=>{try{
 if(req.method!=='GET')return send(res,405,{error:'Method not allowed'});
 if(!ready())return send(res,503,{error:'Database not configured'});
 const items=await query('/rest/v1/news_posts?select='+selected+'&status=eq.ongoing&order=sort_order.desc,published_at.desc.nullslast,created_at.desc&limit=6');
 return send(res,200,{items:items.map(x=>({...x,cover:x.images?.[x.cover_index]||x.images?.[0]||''}))});
}catch(e){return send(res,e.status||500,{error:e.message})}};