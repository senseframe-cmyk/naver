/* Overlay only closed eyelids; never swap the body or alter its contact point. */
(()=>{
 const screen=document.getElementById('screen');if(!screen||new URLSearchParams(location.search).has('docPreview'))return;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),source=new Image();source.src='img/hello-blink.png';
 let candidate=null,timer=0,frame=0,overlay=null,sequence=0;
 function eligible(){
  const img=screen.querySelector('#char');
  return !document.hidden&&!reduced.matches&&!document.body.matches('.doc-mode,.character-mode,.intro-playing')&&img?.src.split('/').pop().split('?')[0]==='hello.png'&&!screen.querySelector('.stage.is-listening,.stage.is-idle-cue,.stage.home-curiosity-active')&&!screen.classList.contains('speech-missed')?img:null;
 }
 function clear(){clearTimeout(timer);cancelAnimationFrame(frame);overlay?.remove();overlay=null;sequence++;}
 function schedule(){timer=setTimeout(blink,2200+Math.random()*1800);}
 function blink(){
  if(!candidate||eligible()!==candidate){sync();return;}
  if(!source.complete||!source.naturalWidth){schedule();return;}
  const stage=candidate.closest('.stage'),ns='http://www.w3.org/2000/svg';
  const svg=document.createElementNS(ns,'svg');overlay=svg;svg.setAttribute('viewBox','0 0 1024 1536');svg.setAttribute('aria-hidden','true');svg.classList.add('character-eyelids');
  svg.innerHTML='<defs><clipPath id="eyelid-patches"><ellipse cx="418" cy="575" rx="88" ry="82"/><ellipse cx="624" cy="575" rx="88" ry="82"/></clipPath></defs><image href="img/hello-blink.png" width="1024" height="1536" clip-path="url(#eyelid-patches)"/>';
  stage.appendChild(svg);
  const mySequence=++sequence,started=performance.now();
  function position(now){
   if(mySequence!==sequence||eligible()!==candidate){svg.remove();if(overlay===svg)overlay=null;sync();return;}
   const base=stage.getBoundingClientRect(),box=candidate.getBoundingClientRect(),sx=base.width/stage.clientWidth||1,sy=base.height/stage.clientHeight||1;
   Object.assign(svg.style,{left:(box.left-base.left)/sx+'px',top:(box.top-base.top)/sy+'px',width:box.width/sx+'px',height:box.height/sy+'px'});
   const bottom=getComputedStyle(candidate).objectPosition.includes('bottom')||getComputedStyle(candidate).objectPosition.includes('100%');svg.setAttribute('preserveAspectRatio',bottom?'xMidYMax meet':'xMidYMid meet');
   const elapsed=now-started;svg.style.opacity=String(Math.min(1,elapsed/45,(190-elapsed)/55));
   if(elapsed<190)frame=requestAnimationFrame(position);else{svg.remove();overlay=null;schedule();}
  }frame=requestAnimationFrame(position);
 }
 function sync(){const next=eligible();if(next===candidate)return;clear();candidate=next;if(candidate)schedule();}
 new MutationObserver(sync).observe(screen,{subtree:true,childList:true,attributes:true,attributeFilter:['src','class','data-step']});
 new MutationObserver(sync).observe(document.body,{attributes:true,attributeFilter:['class']});
 reduced.addEventListener('change',sync);document.addEventListener('visibilitychange',sync);sync();
})();
