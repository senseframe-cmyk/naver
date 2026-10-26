/* Start in daylight on every visit; keep document phone previews in sync. */
(()=>{
 if(new URLSearchParams(location.search).has('docPreview'))return;
 const root=document.documentElement,tabs=document.querySelector('.view-switch');
 const button=document.createElement('button');
 button.type='button';button.className='theme-toggle';button.setAttribute('aria-pressed','false');
 button.innerHTML='<svg class="theme-sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/></svg><svg class="theme-moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 14A8.5 8.5 0 0 1 10 3.5 8.5 8.5 0 1 0 20.5 14Z"/></svg>';
 document.querySelector('.layout').appendChild(button);
 const syncFrame=frame=>{try{frame.contentDocument.documentElement.dataset.theme=root.dataset.theme;}catch{ /* A preview may still be loading. */ }};
 function apply(night){
  root.dataset.theme=night?'night':'day';
  button.setAttribute('aria-pressed',String(night));
  button.setAttribute('aria-label',night?'낮 모드로 전환':'밤 모드로 전환');button.title=night?'낮 모드로 전환':'밤 모드로 전환';
  document.querySelectorAll('.doc-screen-viewport iframe').forEach(syncFrame);
 }
 function align(){
  const bounds=tabs.getBoundingClientRect();
  const brand=document.querySelector('.page-brand'),brandBounds=brand?.getBoundingClientRect();
  if(brandBounds?.width)button.style.right=`${Math.max(14,brandBounds.left)}px`;
  if(bounds.height)button.style.top=`${bounds.top+(bounds.height-button.offsetHeight)/2}px`;
 }
 button.addEventListener('click',()=>apply(root.dataset.theme!=='night'));
 window.addEventListener('resize',align);
 new ResizeObserver(align).observe(tabs);
 new MutationObserver(align).observe(document.body,{attributes:true,attributeFilter:['class']});
 document.addEventListener('load',event=>{if(event.target.matches?.('.doc-screen-viewport iframe'))syncFrame(event.target);},true);
 apply(false);align();
})();
