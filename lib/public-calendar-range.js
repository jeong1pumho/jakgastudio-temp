'use strict';

// The first day outside the public window, using the calendar month in Seoul.
function publicCalendarEnd(now=new Date()){
  const parts=new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Seoul',year:'numeric',month:'numeric'}).formatToParts(now);
  const part=type=>Number(parts.find(item=>item.type===type).value);
  return new Date(Date.UTC(part('year'),part('month')+1,1)).toISOString().slice(0,10);
}

module.exports={publicCalendarEnd};
