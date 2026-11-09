/* One brief desktop arrival pause; release to native scrolling, never replay input. */
(() => {
  'use strict';
  const brand = document.getElementById('brand-story');
  if (!brand) return;
  const desktop = matchMedia('(min-width: 701px) and (hover: hover) and (pointer: fine)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let used = false, holding = false, timer, wheelAt = -Infinity;
  let previousY = window.scrollY;
  const position = () => Math.max(0, window.scrollY + brand.getBoundingClientRect().top -
    (document.querySelector('.kv-sticky-header')?.getBoundingClientRect().height || 0));
  const allowed = () => desktop.matches && !reduced.matches && !document.querySelector('dialog[open],.lightbox:not([hidden])');
  function release() {
    holding = false;
    wheelAt = -Infinity;
    clearTimeout(timer);
  }
  function align() { window.scrollTo({top: position(), behavior: 'instant'}); }
  function pause() {
    used = true;
    holding = true;
    align();
    brand.classList.add('brand-arrived');
    timer = setTimeout(release, 500);
  }
  function nestedScroll(target) {
    for (let el = target instanceof Element ? target : null; el && el !== document.body; el = el.parentElement) {
      if (/auto|scroll/.test(getComputedStyle(el).overflowY) && el.scrollHeight > el.clientHeight) return true;
    }
    return false;
  }
  window.addEventListener('wheel', event => {
    if (!allowed() || event.ctrlKey || event.metaKey || event.shiftKey || nestedScroll(event.target)) { release(); return; }
    if (event.deltaY < 0) { release(); return; }
    if (event.deltaY <= 0 || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
    if (holding) { if (event.cancelable) event.preventDefault(); return; }
    if (used) return;
    const y = window.scrollY, stop = position();
    // Do not pull visitors back if they arrived via a link, history, or scrollbar.
    if (y > stop + 2) { used = true; return; }
    wheelAt = performance.now();
    const distance = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1);
    if (y <= stop && y + distance >= stop && event.cancelable) {
      event.preventDefault();
      pause();
    }
  }, {passive: false});
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (holding) {
      if (!allowed() || y < position() - 2) release();
      else if (Math.abs(y - position()) > 1) align();
    } else if (!used && allowed() && performance.now() - wheelAt < 180 && previousY < position() && y >= position()) {
      pause();
    }
    previousY = window.scrollY;
  }, {passive: true});
  // Navigation, keyboard, touch, and upward movement always remain available.
  for (const name of ['pointerdown', 'touchstart', 'keydown', 'hashchange', 'resize', 'pagehide']) {
    window.addEventListener(name, release, {passive: true});
  }
  desktop.addEventListener('change', release);
  reduced.addEventListener('change', release);
})();
