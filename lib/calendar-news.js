'use strict';
const linkColumns='calendar_event_news(news_posts(slug,operator_type,status,published_at))';
function postPath(row){
 const relation=row.calendar_event_news;
 const post=(Array.isArray(relation)?relation[0]:relation)?.news_posts;
 if(post?.operator_type!=='studio'||!post.published_at||!['ongoing','ended'].includes(post.status)||!post.slug)return null;
 return '/news/'+encodeURIComponent(post.slug);
}
module.exports={linkColumns,postPath};
