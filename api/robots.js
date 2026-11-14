'use strict';
const {isProduction,origin}=require('../lib/seo');
module.exports=(req,res)=>{
  if(req.method!=='GET')return res.status(405).end();
  const live=isProduction(req);
  const content=live
    ?'User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /api/\n\nSitemap: '+origin(req)+'/sitemap.xml\n'
    :'User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\n';
  res.setHeader('Content-Type','text/plain; charset=utf-8');
  res.setHeader('Cache-Control','public, max-age=0, s-maxage=300');
  return res.status(200).send(content);
};
