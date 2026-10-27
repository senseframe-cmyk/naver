/* Continuous curved flight and flower pauses; the character keeps its default pose. */
(()=>{
 const screen=document.getElementById('screen');if(!screen||new URLSearchParams(location.search).has('docPreview'))return;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let layer=null,visitors=[],frame=0,sizeKey='',lastTime=0;
 const clamp=v=>Math.max(0,Math.min(1,v));
 function stop(){cancelAnimationFrame(frame);layer?.remove();layer=null;visitors=[];sizeKey='';lastTime=0;}
 function flower(selector,x,y){
  const base=screen.getBoundingClientRect(),box=screen.querySelector(selector)?.getBoundingClientRect();
  return box?{x:(box.left-base.left+box.width*x)*screen.clientWidth/base.width,y:(box.top-base.top+box.height*y)*screen.clientHeight/base.height-7}:{x:screen.clientWidth*x,y:screen.clientHeight*.7};
 }
 function curve(points,t){const u=1-t;return {x:u*u*u*points[0].x+3*u*u*t*points[1].x+3*u*t*t*points[2].x+t*t*t*points[3].x,y:u*u*u*points[0].y+3*u*u*t*points[1].y+3*u*t*t*points[2].y+t*t*t*points[3].y};}
 function start(){
  stop();const w=screen.clientWidth,h=screen.clientHeight;if(!w||!h)return;sizeKey=w+':'+h;
  const flowers={left:flower('.home-prop-left',.5,.36),right:flower('.home-prop-right',.43,.47)};
  layer=document.createElement('div');layer.className='home-butterfly-layer';layer.setAttribute('aria-hidden','true');screen.appendChild(layer);
  const started=performance.now();
  for(let i=0;i<1;i++){
   const actor=document.createElement('div');actor.className='home-butterfly';
   for(const side of ['left','right']){const wing=document.createElement('img');wing.src='img/home-butterfly.png';wing.alt='';wing.className='wing-'+side;actor.appendChild(wing);}layer.appendChild(actor);
   const first=i?'right':'left',second=i?'left':'right',a=flowers[first],b=flowers[second],sign=i?-1:1;
   visitors.push({actor,first,second,a,b,duration:i?39000:34000,delay:i?5300:1100,angle:i?-70:70,routes:[
    [{x:i?w*1.1:-w*.1,y:h*.38},{x:w*(i?.78:.22),y:h*.31},{x:a.x-sign*w*.13,y:a.y-h*.16},a],
    [a,{x:a.x+sign*w*.2,y:a.y-h*.25},{x:b.x-sign*w*.22,y:b.y-h*.18},b],
    [b,{x:b.x+sign*w*.15,y:b.y-h*.2},{x:w*(i?.2:.8),y:h*.36},{x:i?-w*.12:w*1.12,y:h*.3}]
   ]});
  }
  function tick(now){
   if(!layer?.isConnected)return;const dt=Math.min((now-(lastTime||now))/1000,.05);lastTime=now;
   for(const v of visitors){
    const age=now-started-v.delay;if(age<0){v.actor.style.opacity=0;continue;}
    const phase=(age%v.duration)/v.duration;let p,tangent,perched=false,side='',opacity=1;
    if(phase>=.27&&phase<.4){p=v.a;perched=true;side=v.first;}
    else if(phase>=.69&&phase<.82){p=v.b;perched=true;side=v.second;}
    else{
     const leg=phase<.27?0:phase<.69?1:2,from=[0,.4,.82][leg],to=[.27,.69,1][leg];
     const t=clamp((phase-from)/(to-from)),e=t*t*(3-2*t);p=curve(v.routes[leg],e);
     const near=curve(v.routes[leg],Math.min(1,e+.003)),prior=curve(v.routes[leg],Math.max(0,e-.003));tangent=Math.atan2(near.y-prior.y,near.x-prior.x)*180/Math.PI+90;
     // Small airborne flutter tapers smoothly to zero on landing.
     p.y+=Math.sin(age*.004)*2*Math.sin(t*Math.PI);p.x+=Math.sin(age*.0027)*1.3*Math.sin(t*Math.PI);
     if(leg===0)opacity=clamp(t*6);if(leg===2)opacity=clamp((1-t)*5);
    }
    const target=perched?(side==='left'?-18:18):tangent,diff=((target-v.angle+540)%360)-180;v.angle+=diff*Math.min(1,dt*4);
    v.actor.style.transform=`translate3d(${p.x-21.75}px,${p.y-21.75}px,0) rotate(${v.angle}deg) scale(${perched ? .84 : 1})`;
    v.actor.style.opacity=opacity;v.actor.classList.toggle('perched',perched);
   }
   frame=requestAnimationFrame(tick);
  }frame=requestAnimationFrame(tick);
 }
 function sync(){const enabled=screen.dataset.step==='7'&&!reduced.matches&&!document.hidden&&!document.body.matches('.doc-mode,.character-mode,.intro-playing');if(!enabled){if(layer)stop();return;}if(!layer?.isConnected||sizeKey!==screen.clientWidth+':'+screen.clientHeight)start();}
 new MutationObserver(sync).observe(screen,{attributes:true,attributeFilter:['data-step'],childList:true});new MutationObserver(sync).observe(document.body,{attributes:true,attributeFilter:['class']});new ResizeObserver(sync).observe(screen);document.addEventListener('visibilitychange',sync);reduced.addEventListener('change',sync);sync();
})();
