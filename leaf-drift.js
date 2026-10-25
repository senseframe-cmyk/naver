/* Quiet wind-blown leaves, only on the egg scene and home. */
(()=>{
 const host=document.getElementById('screen');if(!host||new URLSearchParams(location.search).has('docPreview'))return;
 let layer=null,frame=0,items=[],next=0,last=0;
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
 function stop(){cancelAnimationFrame(frame);layer?.remove();layer=null;items=[];last=0}
 function tick(now){
  if(!layer?.isConnected)return;
  const dt=Math.min((now-(last||now))/1000,.04);last=now;
  const w=host.clientWidth,h=host.clientHeight;
  if(now>next&&items.length<6){
   const el=document.createElement('img'),size=31.5+Math.random()*25.5;
   el.src='img/leaf_0'+(1+Math.floor(Math.random()*5))+'.png';el.alt='';el.draggable=false;
   Object.assign(el.style,{width:size+'px',height:size+'px'});layer.appendChild(el);
   items.push({el,x:w*(.08+Math.random()*.84),y:-size,size,speed:30+Math.random()*20,phase:Math.random()*6.28,spin:Math.random()*180,age:0,landed:0,floor:h*(.704+Math.random()*.028)});
   next=now+1600+Math.random()*3600;
  }
  items=items.filter(p=>{
   p.age+=dt;
   if(!p.landed){p.y+=p.speed*dt;p.x+=(Math.sin(p.age*.85+p.phase)*19+7)*dt;if(p.y>=p.floor){p.y=p.floor;p.landed=now}}
   const fade=p.landed?Math.max(0,1-(now-p.landed-400)/1500):Math.min(1,p.age/1.2);
   const sway=p.landed?0:Math.sin(p.age*1.5+p.phase)*22;
   p.el.style.opacity=String(fade*.8);
   p.el.style.transform=`translate3d(${p.x-p.size/2}px,${p.y-p.size/2}px,0) rotate(${p.spin+sway+p.age*9}deg) rotateY(${p.landed?65:Math.sin(p.age*1.1+p.phase)*55}deg)`;
   if(fade===0&&p.landed){p.el.remove();return false}return true;
  });frame=requestAnimationFrame(tick);
 }
 function sync(){
  const enabled=['0','7'].includes(host.dataset.step)&&!reduced.matches;
  if(!enabled){if(layer)stop();return}
  if(layer?.isConnected)return;stop();layer=document.createElement('div');layer.className='leaf-drift';layer.setAttribute('aria-hidden','true');host.appendChild(layer);next=performance.now()+500+Math.random()*1700;frame=requestAnimationFrame(tick);
 }
 new MutationObserver(sync).observe(host,{childList:true,attributes:true,attributeFilter:['data-step']});
 reduced.addEventListener('change',sync);sync();
})();
