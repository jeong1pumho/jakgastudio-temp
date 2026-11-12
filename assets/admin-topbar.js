(()=>{'use strict';const header=document.getElementById('admin-topbar');if(!header)return;
 const size=()=>document.documentElement.style.setProperty('--admin-top-height',Math.ceil(header.getBoundingClientRect().height)+'px');
 size();if('ResizeObserver'in window)new ResizeObserver(size).observe(header);else window.addEventListener('resize',size);
 // These two pages previously hid logout together with their authenticated panel.
 // Keep their existing logout handlers and mirror that visibility after moving it.
 const logout=header.querySelector('[data-auth-panel]');if(logout){const panel=document.getElementById(logout.dataset.authPanel);if(panel){const sync=()=>{logout.hidden=panel.hidden;size();};sync();new MutationObserver(sync).observe(panel,{attributes:true,attributeFilter:['hidden']});}}
})();
