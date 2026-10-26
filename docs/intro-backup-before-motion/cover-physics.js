/* Lightweight circle physics for the cover. No network or third-party runtime. */
(() => {
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  function hull(points) {
    points.sort((a, b) => a.x - b.x || a.y - b.y);
    const cross = (a, b, c) => (b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
    const half = list => { const out=[]; for (const p of list) { while(out.length>1 && cross(out[out.length-2],out[out.length-1],p)<=0) out.pop(); out.push(p); } return out; };
    return half(points).slice(0,-1).concat(half([...points].reverse()).slice(0,-1));
  }
  function circlePolygon(ball, polygon) {
    let depth=Infinity, normal=null;
    const axes=polygon.points.map((p,i)=>{const q=polygon.points[(i+1)%polygon.points.length];return {x:-(q.y-p.y),y:q.x-p.x};});
    let closest=polygon.points[0];for(const p of polygon.points)if(Math.hypot(p.x-ball.x,p.y-ball.y)<Math.hypot(closest.x-ball.x,closest.y-ball.y))closest=p;
    axes.push({x:ball.x-closest.x,y:ball.y-closest.y});
    for(const axis of axes){
      const len=Math.hypot(axis.x,axis.y);if(len<1e-7)continue;
      const nx=axis.x/len,ny=axis.y/len;
      let lo=Infinity,hi=-Infinity;for(const p of polygon.points){const dot=p.x*nx+p.y*ny;lo=Math.min(lo,dot);hi=Math.max(hi,dot);}
      const center=ball.x*nx+ball.y*ny;
      if(center+ball.r<=lo||center-ball.r>=hi)return null;
      const towardLow=center+ball.r-lo,towardHigh=hi-(center-ball.r);
      const overlap=Math.min(towardLow,towardHigh);
      if(overlap<depth){depth=overlap;const sign=towardLow<towardHigh?-1:1;normal={x:nx*sign,y:ny*sign};}
    }
    return normal ? {...normal,depth} : null;
  }
  function collidePair(a,b){
    const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy),target=a.r+b.r;
    if(d>=target)return;
    const nx=d>1e-6?dx/d:1,ny=d>1e-6?dy/d:0;
    const ia=a.held?0:1,ib=b.held?0:1,total=ia+ib;if(!total)return;
    const overlap=target-d;
    a.x-=nx*overlap*ia/total;a.y-=ny*overlap*ia/total;b.x+=nx*overlap*ib/total;b.y+=ny*overlap*ib/total;
    const speed=(b.vx-a.vx)*nx+(b.vy-a.vy)*ny;
    if(speed<0){const impulse=-(1+.62)*speed/total;a.vx-=impulse*nx*ia;a.vy-=impulse*ny*ia;b.vx+=impulse*nx*ib;b.vy+=impulse*ny*ib;}
  }
  const furLetters = ['N','A','V','E','R'];
  function decorateFur(element,index){
    const image=document.createElement('img');
    image.src=`img/text_${furLetters[index%furLetters.length]}.png`;
    image.alt='';image.draggable=false;image.decoding='async';
    // The artwork includes transparent margins; let the fur reach the collision edge.
    image.style.cssText='position:absolute;left:-12.5%;top:-12.5%;width:125%;height:125%;max-width:none;object-fit:contain;pointer-events:none;user-select:none';
    element.style.background='none';element.style.borderRadius='0';
    element.appendChild(image);
  }
  class CoverPhysics {
    constructor(cover,button){this.cover=cover;this.button=button;this.balls=[];this.polygons=[];this.raf=0;this.running=false;this.drag=null;this.lastPointer=null;this.onResize=()=>this.resize();this.onMove=e=>this.pointerMove(e);this.onUp=e=>this.release(e);}
    start(){
      this.stop();if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
      this.layer=document.createElement('div');this.layer.className='cover-ball-layer';this.layer.setAttribute('aria-hidden','true');this.cover.appendChild(this.layer);
      this.cover.classList.add('physics-active');
      this.running=true;this.elapsed=0;this.last=0;this.accumulator=0;this.resize();
      const diameter=(this.button.getBoundingClientRect().width||120)*1.6;
      for(let i=0;i<furLetters.length*3;i++){
        const element=document.createElement('span');element.className='cover-ball';decorateFur(element,i);element.style.width=element.style.height=diameter+'px';element.style.visibility='hidden';this.layer.appendChild(element);
        const r=diameter/2;const ball={x:r+Math.random()*Math.max(1,this.width-diameter),y:-r-30,vx:(Math.random()-.35)*190,vy:0,r,angle:0,held:false,active:false,delay:i*.18,element};
        element.addEventListener('pointerdown',e=>this.grab(e,ball));element.addEventListener('lostpointercapture',e=>this.release(e));element.addEventListener('dragstart',e=>e.preventDefault());this.balls.push(ball);
      }
      window.addEventListener('resize',this.onResize);this.cover.addEventListener('pointermove',this.onMove);this.cover.addEventListener('pointerup',this.onUp);this.cover.addEventListener('pointercancel',this.onUp);
      this.raf=requestAnimationFrame(t=>this.frame(t));
    }
    resize(){
      this.width=this.cover.clientWidth;this.height=this.cover.clientHeight;
      this.glyphShapes=new WeakMap();this.updateTextColliders();
      for(const ball of this.balls){ball.x=clamp(ball.x,ball.r,this.width-ball.r);ball.y=Math.min(ball.y,this.height-ball.r-2);}
    }
    updateTextColliders(){
      const origin=this.cover.getBoundingClientRect();this.polygons=[];
      for(const element of this.cover.querySelectorAll('.intro-line .glyph.resolved')){
        if(!element.textContent.trim())continue;
        const box=element.getBoundingClientRect();if(!box.width||!box.height)continue;
        let points=this.glyphShapes.get(element);
        if(!points){
          const style=getComputedStyle(element),canvas=document.createElement('canvas');
          canvas.width=Math.ceil(box.width);canvas.height=Math.ceil(box.height);
          const ctx=canvas.getContext('2d',{willReadFrequently:true});
          ctx.font=`${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
          const metrics=ctx.measureText(element.textContent),size=parseFloat(style.fontSize);
          const ascent=metrics.fontBoundingBoxAscent??size*.8,descent=metrics.fontBoundingBoxDescent??size*.2;
          ctx.fillText(element.textContent,0,(box.height-ascent-descent)/2+ascent);
          const pixels=ctx.getImageData(0,0,canvas.width,canvas.height).data,samples=[];
          for(let y=0;y<canvas.height;y+=3)for(let x=0;x<canvas.width;x+=3)if(pixels[(y*canvas.width+x)*4+3]>100)samples.push({x,y});
          points=hull(samples);this.glyphShapes.set(element,points);
        }
        if(points.length>2)this.polygons.push({points:points.map(p=>({x:p.x+box.left-origin.left,y:p.y+box.top-origin.top}))});
      }
    }
    step(dt){
      const active=this.balls.filter(b=>b.active);
      for(const b of active){
        if(b.held)continue;b.vy+=1250*dt;b.vx*=Math.exp(-.13*dt);b.vy*=Math.exp(-.03*dt);b.x+=b.vx*dt;b.y+=b.vy*dt;b.angle+=b.vx/b.r*dt;
      }
      for(let pass=0;pass<5;pass++){
        for(const b of active){if(b.held)continue;
          if(b.x<b.r){b.x=b.r;b.vx=Math.abs(b.vx)*.65;}if(b.x>this.width-b.r){b.x=this.width-b.r;b.vx=-Math.abs(b.vx)*.65;}
          if(b.y>this.height-b.r-2){b.y=this.height-b.r-2;if(b.vy>0)b.vy=b.vy>45?-b.vy*.45:0;b.vx*=Math.exp(-3.2*dt);}
          if(b.y< -b.r*2 && b.vy<0){b.y=-b.r*2;b.vy=Math.abs(b.vy)*.45;}
        }
        for(const b of active){
          if(b.held)continue;
          for(const polygon of this.polygons){
            const hit=circlePolygon(b,polygon);if(!hit)continue;
            b.x+=hit.x*(hit.depth+.1);b.y+=hit.y*(hit.depth+.1);
            const speed=b.vx*hit.x+b.vy*hit.y;
            if(speed<0){b.vx-=1.28*speed*hit.x;b.vy-=1.28*speed*hit.y;}
            // Give a resting ball a gentle roll so flat letter tops never trap it.
            if(hit.y<-.45&&Math.abs(b.vx)<65)b.vx+=(b.vx<0?-1:1)*220*dt;
          }
        }
        for(let i=0;i<active.length;i++)for(let j=i+1;j<active.length;j++)collidePair(active[i],active[j]);
      }
    }
    frame(time){
      if(!this.running)return;const dt=this.last?Math.min((time-this.last)/1000,.04):0;this.last=time;this.elapsed+=dt;
      this.updateTextColliders();
      for(const b of this.balls)if(!b.active&&this.elapsed>=b.delay){b.active=true;b.element.style.visibility='visible';}
      this.accumulator+=dt;while(this.accumulator>=1/120){this.step(1/120);this.accumulator-=1/120;}
      for(const b of this.balls)if(b.active)b.element.style.transform=`translate3d(${b.x-b.r}px,${b.y-b.r}px,0) rotate(${b.angle}rad)`;
      this.raf=requestAnimationFrame(t=>this.frame(t));
    }
    position(event){const box=this.cover.getBoundingClientRect();return {x:event.clientX-box.left,y:event.clientY-box.top,time:performance.now()};}
    grab(event,ball){
      if(event.button!==0||this.drag)return;event.preventDefault();event.stopPropagation();window.getSelection()?.removeAllRanges();const p=this.position(event);this.drag={ball,id:event.pointerId,dx:p.x-ball.x,dy:p.y-ball.y,last:p,moved:false};ball.held=true;ball.vx=0;ball.vy=0;ball.element.classList.add('is-held');ball.element.setPointerCapture(event.pointerId);
    }
    pointerMove(event){
      const p=this.position(event);
      if(this.drag&&event.pointerId===this.drag.id){const d=this.drag,b=d.ball,dt=Math.max(.008,(p.time-d.last.time)/1000);b.x=clamp(p.x-d.dx,b.r,this.width-b.r);b.y=clamp(p.y-d.dy,b.r,this.height-b.r-2);b.vx=clamp((p.x-d.last.x)/dt,-2100,2100);b.vy=clamp((p.y-d.last.y)/dt,-2100,2100);d.moved=d.moved||Math.hypot(p.x-d.last.x,p.y-d.last.y)>2;d.last=p;return;}
      if(this.lastPointer){const dt=Math.max(.008,(p.time-this.lastPointer.time)/1000),vx=clamp((p.x-this.lastPointer.x)/dt,-1700,1700),vy=clamp((p.y-this.lastPointer.y)/dt,-1700,1700);
        for(const b of this.balls){if(!b.active)continue;const dx=b.x-p.x,dy=b.y-p.y,dist=Math.hypot(dx,dy);if(dist<b.r+10&&Math.hypot(vx,vy)>80){b.vx+=vx*.3;b.vy+=vy*.3-75;}}
      }this.lastPointer=p;
    }
    release(event){
      if(!this.drag||event.pointerId!==this.drag.id)return;const {ball,moved,last}=this.drag;this.drag=null;ball.held=false;ball.element.classList.remove('is-held');
      if(!moved){ball.vx=(Math.random()-.5)*600;ball.vy=-650;}else if(performance.now()-last.time>100){ball.vx=0;ball.vy=0;}
      if(ball.element.hasPointerCapture(event.pointerId))ball.element.releasePointerCapture(event.pointerId);
    }
    stop(){
      this.cover.classList.remove('physics-active');
      for(const glyph of this.glyphs||[]){glyph.element.classList.remove('ball-overlap');glyph.element.style.removeProperty('background-image');}
      this.glyphs=[];this.running=false;cancelAnimationFrame(this.raf);window.removeEventListener('resize',this.onResize);this.cover.removeEventListener('pointermove',this.onMove);this.cover.removeEventListener('pointerup',this.onUp);this.cover.removeEventListener('pointercancel',this.onUp);this.drag=null;this.layer?.remove();this.layer=null;this.balls=[];
    }
  }
  if(typeof module!=='undefined'&&module.exports)module.exports={hull,circlePolygon,collidePair,CoverPhysics,decorateFur};
  if(typeof window!=='undefined')window.CoverPhysics=CoverPhysics;
})();
