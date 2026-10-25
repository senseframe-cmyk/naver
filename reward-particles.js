/* Lightweight circular paper confetti: flutter, settle without bouncing, dissolve. */
(() => {
 class RewardRain {
  constructor(host){this.host=host;this.frame=0;this.layer=null;this.items=[]}
  start(){
   this.stop();if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
   this.layer=document.createElement('div');this.layer.className='reward-rain';this.layer.setAttribute('aria-hidden','true');this.host.appendChild(this.layer);
   const width=this.host.clientWidth,height=this.host.clientHeight,colors=['#7bd4b9','#49b8dc','#a9e2d2','#b7ddeb','#e7e9d3','#72c7cc'];
   this.layer.style.perspective='600px';
   this.items=Array.from({length:80},(_,i)=>{const element=document.createElement('i'),r=4+Math.random()*6;Object.assign(element.style,{width:r*2+'px',height:r*2+'px',background:colors[i%colors.length],opacity:'0'});this.layer.appendChild(element);return {element,r,x:r+Math.random()*(width-r*2),y:-r*3,phase:Math.random()*Math.PI*2,speed:150+Math.random()*95,spin:Math.random()*360,delay:i*12,landed:0}});
   const landscapeFloor=()=>{
    const ground=this.host.querySelector?.('.character-contact-shadow'),box=this.host.getBoundingClientRect?.();
    if(ground&&box&&ground.style.visibility!=='hidden'){
     const rect=ground.getBoundingClientRect(),scale=box.height/height||1;
     return (rect.top+rect.height/2-box.top)/scale;
    }
    return height*.7;
   };
   let start=0,last=0;
   const tick=now=>{
    if(!this.layer?.isConnected)return;
    if(!start){start=now;last=now}const elapsed=now-start,dt=Math.min((now-last)/1000,.025);last=now;
    let alive=false;const groundY=landscapeFloor();
    for(const item of this.items){
     if(elapsed<item.delay)continue;
     const time=(elapsed-item.delay)/1000,floor=groundY-item.r+(item.phase/Math.PI-1)*5;
     if(!item.landed){
      item.x+=Math.sin(time*2.2+item.phase)*34*dt;item.y+=item.speed*(.84+.16*Math.sin(time*2+item.phase))*dt;
      if(item.y>=floor){item.y=floor;item.landed=elapsed}
     }
     const opacity=item.landed?Math.max(0,1-(elapsed-item.landed-250)/650):1;
     const turn=item.landed?82:Math.sin(time*3+item.phase)*75;
     item.element.style.opacity=String(opacity);
     item.element.style.transform=`translate3d(${item.x-item.r}px,${item.y-item.r}px,0) rotateZ(${item.spin+time*50}deg) rotateY(${turn}deg) rotateX(${item.landed?72:Math.sin(time*2+item.phase)*35}deg)`;
     if(opacity>0)alive=true;
    }
    if((alive||elapsed<1200)&&elapsed<9500)this.frame=requestAnimationFrame(tick);else this.stop();
   };this.frame=requestAnimationFrame(tick);
  }
  stop(){cancelAnimationFrame(this.frame);this.layer?.remove();this.layer=null;this.items=[]}
 }
 if(typeof window!=='undefined')window.RewardRain=RewardRain;
 if(typeof module!=='undefined'&&module.exports)module.exports=RewardRain;
})();
