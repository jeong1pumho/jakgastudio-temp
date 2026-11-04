'use strict';
const {query,ready,send,selected}=require('../lib/core');
const base='/rest/v1/news_posts?select='+selected;
const ongoingOrder='&order=sort_order.desc,published_at.desc.nullslast,created_at.desc';
const endedOrder='&order=published_at.desc.nullslast,created_at.desc';
const withCover=item=>({...item,cover:item.images?.[item.cover_index]||item.images?.[0]||''});
async function allOngoing(){
 const items=[];
 for(let offset=0;offset<10000;offset+=200){
  const rows=await query(base+'&status=eq.ongoing'+ongoingOrder+'&limit=200&offset='+offset);
  items.push(...rows);if(rows.length<200)break;
 }
 return items.map(withCover);
}
module.exports=async(req,res)=>{
 try{
  if(req.method!=='GET')return send(res,405,{error:'Method not allowed'});
  if(!ready())return send(res,503,{error:'Database not configured'});
  if(req.query?.view==='ongoing'&&req.query?.all==='1'){
   return send(res,200,{ongoing:await allOngoing()});
  }
  const [current,ended,rentals]=await Promise.all([
   query(base+'&status=eq.ongoing'+ongoingOrder+'&limit=7'),
   query(base+'&status=eq.ended'+endedOrder+'&limit=6'),
   query(base+'&status=eq.ended&operator_type=eq.rental'+endedOrder+'&limit=3')
  ]);
  return send(res,200,{
   ongoing:current.slice(0,6).map(withCover),
   hasMoreOngoing:current.length>6,
   ended:ended.map(withCover),
   rentals:rentals.map(withCover)
  });
 }catch(e){return send(res,e.status||500,{error:'모임·행사 정보를 불러오지 못했습니다.'});}
};