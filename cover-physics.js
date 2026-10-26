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
  let sphereFrames=null;
  const sphereFrameCache=new Map();
  function buildSphereFrames(letter=''){
    if(sphereFrameCache.has(letter))return sphereFrameCache.get(letter);
    const frameCount=letter?32:96;
    const size=160,texture=document.createElement('canvas');texture.width=1024;texture.height=512;
    const ctx=texture.getContext('2d',{willReadFrequently:true});ctx.fillStyle='#fff';ctx.fillRect(0,0,1024,512);
    ctx.fillStyle='#151515';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.font='500 58px "IBM Plex Sans",sans-serif';
    if(letter){
      // Latitude bands become circular arcs after spherical projection.
      ctx.strokeStyle='#e4e4e6';ctx.lineWidth=2;
      for(const y of [164,348]){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(1024,y);ctx.stroke();}
      ctx.fillStyle='#151515';ctx.font='500 220px "IBM Plex Mono",monospace';ctx.fillText(letter,512,256);
    }else for(const x of [256,768]){ctx.fillText('Naver Healthcare',x,216,480);ctx.fillText('UX Design',x,286,460);}
    const pixels=ctx.getImageData(0,0,1024,512).data;const frames=[];
    for(let frame=0;frame<frameCount;frame++){
      const canvas=document.createElement('canvas');canvas.width=canvas.height=size;
      const context=canvas.getContext('2d'),image=context.createImageData(size,size),out=image.data;
      for(let y=0;y<size;y++)for(let x=0;x<size;x++){
        const nx=(x+.5-size/2)/(size/2),ny=(y+.5-size/2)/(size/2),r2=nx*nx+ny*ny;
        if(r2>=1)continue;
        const z=Math.sqrt(1-r2),longitude=Math.atan2(nx,z),latitude=Math.asin(ny);
        const u=((longitude/(Math.PI*2)+frame/frameCount+.5)%1+1)%1;
        const v=.5+latitude/Math.PI;
        const tone=pixels[(Math.min(511,Math.floor(v*512))*1024+Math.floor(u*1024))*4]/255;
        const light=Math.max(0,-nx*.35-ny*.45+z*.82);
        const shade=.81+.19*light,i=(y*size+x)*4;
        for(let channel=0;channel<3;channel++)out[i+channel]=[255,255,255][channel]*shade*(.11+.89*tone);
        out[i+3]=Math.round(Math.min(1,(1-Math.sqrt(r2))*size/1.3)*255);
      }
      context.putImageData(image,0,0);frames.push(canvas);
    }
    sphereFrameCache.set(letter,frames);return frames;
  }
  function decorateSphere(element,index){
    const canvas=document.createElement('canvas');canvas.width=canvas.height=160;canvas.style.cssText='display:block;width:100%;height:100%;pointer-events:none';
    element.appendChild(canvas);element._sphereContext=canvas.getContext('2d');element._spherePhase=index*7;
  }
  function decorateFur(element,index){
    const image=document.createElement('img');
    image.src=`img/text_${['N','A','V','E','R'][index%5]}.png`;image.alt='';image.draggable=false;image.decoding='async';
    image.style.cssText='position:absolute;left:-12.5%;top:-12.5%;width:125%;height:125%;max-width:none;object-fit:contain;pointer-events:none;user-select:none';
    element.appendChild(image);element.classList.add('cover-fur-ball');
  }
  function decorateApple(element){
    const image=document.createElement('img');image.src='img/apple.png';image.alt='';image.draggable=false;image.decoding='async';
    image.style.cssText='display:block;width:100%;height:100%;object-fit:contain;pointer-events:none;user-select:none';
    element.appendChild(image);element.classList.add('cover-apple-ball');
  }
  const beadPalette=['#42ba79','#9cdb67','#25a99d','#6fcdea','#8399e5','#eab971','#e991ad','#b8d592'];
  function createBeads(index){
    const beads=[];
    for(let i=0;i<7+index%2;i++){
      const r=.12+Math.random()*.1;let x=0,y=0;
      for(let attempt=0;attempt<100;attempt++){
        x=(Math.random()-.5)*1.5;y=(Math.random()-.5)*1.5;
        if(Math.hypot(x,y)<.9-r&&beads.every(b=>Math.hypot(x-b.x,y-b.y)>r+b.r+.025))break;
      }
      beads.push({x,y,r,vx:(Math.random()-.5)*1.2,vy:(Math.random()-.5)*1.2,color:beadPalette[i],depth:Math.random()});
    }
    return beads;
  }
  function stepBeads(ball,dt){
    const dvx=ball.vx-(ball.beadOuterVx??ball.vx),dvy=ball.vy-(ball.beadOuterVy??ball.vy);
    ball.beadOuterVx=ball.vx;ball.beadOuterVy=ball.vy;
    for(const b of ball.beads){
      b.vx=clamp(b.vx-dvx/ball.r*.55,-12,12);b.vy=clamp(b.vy-dvy/ball.r*.55+2.4*dt,-12,12);
      const drag=Math.exp(-.65*dt);b.vx*=drag;b.vy*=drag;b.x+=b.vx*dt;b.y+=b.vy*dt;
    }
    for(let pass=0;pass<3;pass++){
      for(let i=0;i<ball.beads.length;i++)for(let j=i+1;j<ball.beads.length;j++){
        const a=ball.beads[i],b=ball.beads[j],dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy),min=a.r+b.r;
        if(d>=min)continue;const nx=d>1e-5?dx/d:1,ny=d>1e-5?dy/d:0;
        const overlap=(min-d)/2;a.x-=nx*overlap;a.y-=ny*overlap;b.x+=nx*overlap;b.y+=ny*overlap;
        const speed=(b.vx-a.vx)*nx+(b.vy-a.vy)*ny;
        if(speed<0){a.vx+=.8*speed*nx;a.vy+=.8*speed*ny;b.vx-=.8*speed*nx;b.vy-=.8*speed*ny;}
      }
      for(const b of ball.beads){
        const d=Math.hypot(b.x,b.y),limit=.91-b.r;
        if(d>limit){const nx=b.x/d,ny=b.y/d;b.x=nx*limit;b.y=ny*limit;const speed=b.vx*nx+b.vy*ny;if(speed>0){b.vx-=1.65*speed*nx;b.vy-=1.65*speed*ny;}}
      }
    }
  }
  const beadSprites=new Map();
  function shadedBead(color){
    if(beadSprites.has(color))return beadSprites.get(color);
    const size=80,canvas=document.createElement('canvas');canvas.width=canvas.height=size;
    const ctx=canvas.getContext('2d'),image=ctx.createImageData(size,size),data=image.data;
    const rgb=color.match(/[a-f0-9]{2}/gi).map(v=>parseInt(v,16));
    for(let y=0;y<size;y++)for(let x=0;x<size;x++){
      const nx=(x+.5-40)/39,ny=(y+.5-40)/39,r2=nx*nx+ny*ny;if(r2>=1)continue;
      const nz=Math.sqrt(1-r2),diffuse=Math.max(0,-nx*.44-ny*.55+nz*.71);
      const highlight=Math.pow(Math.max(0,-nx*.24-ny*.3+nz*.923),26);
      const reflection=Math.pow(Math.max(0,nx*.65+ny*.35+nz*.67),9)*.22;
      const rim=Math.pow(1-nz,3)*.2;
      const i=(y*size+x)*4;
      for(let c=0;c<3;c++)data[i+c]=Math.min(255,rgb[c]*(.24+.76*diffuse)+highlight*180+reflection*[115,160,210][c]+rim*65);
      data[i+3]=Math.round(Math.min(1,(1-Math.sqrt(r2))*40)*255);
    }
    ctx.putImageData(image,0,0);beadSprites.set(color,canvas);return canvas;
  }
  function drawGlass(ball){
    const ctx=ball.element._sphereContext;
    if(!ball.glassInterior){ball.glassInterior=document.createElement('canvas');ball.glassInterior.width=ball.glassInterior.height=160;ball.glassInteriorContext=ball.glassInterior.getContext('2d');}
    const inside=ball.glassInteriorContext;inside.clearRect(0,0,160,160);
    for(const b of [...ball.beads].sort((a,b)=>a.depth-b.depth)){
      const depthScale=.8+b.depth*.25,r=b.r*76*depthScale;
      // A gentle lens magnification and depth blur replace the flat colored discs.
      const x=80+b.x*76*1.025,y=80+b.y*76*1.025;
      inside.save();inside.globalAlpha=.76+b.depth*.2;inside.filter=`blur(${1.1+(1-b.depth)*2.2}px)`;
      inside.drawImage(shadedBead(b.color),x-r,y-r,r*2,r*2);inside.restore();
    }
    ctx.clearRect(0,0,160,160);ctx.save();ctx.beginPath();ctx.arc(80,80,76,0,Math.PI*2);ctx.clip();
    const base=ctx.createRadialGradient(52,43,3,80,80,76);base.addColorStop(0,'rgba(255,255,255,.42)');base.addColorStop(.7,'rgba(238,248,248,.2)');base.addColorStop(1,'rgba(167,195,203,.4)');ctx.fillStyle=base;ctx.fillRect(0,0,160,160);
    ctx.save();ctx.filter='blur(1px)';ctx.drawImage(ball.glassInterior,0,0);ctx.restore();
    // Frosted transmission: soften the contents while keeping the outer lens crisp.
    const frost=ctx.createRadialGradient(55,48,5,80,80,82);frost.addColorStop(0,'rgba(255,255,255,.1)');frost.addColorStop(.72,'rgba(248,252,255,.13)');frost.addColorStop(1,'rgba(222,241,247,.5)');ctx.fillStyle=frost;ctx.fillRect(0,0,160,160);
    const edge=ctx.createRadialGradient(80,80,55,80,80,76);edge.addColorStop(0,'rgba(255,255,255,0)');edge.addColorStop(.78,'rgba(255,255,255,.12)');edge.addColorStop(1,'rgba(255,255,255,.85)');ctx.fillStyle=edge;ctx.fillRect(0,0,160,160);
    // Broad studio softbox reflection, rather than a drawn white ring.
    ctx.save();ctx.translate(49,38);ctx.rotate(-.65);ctx.scale(1,.48);
    const softbox=ctx.createRadialGradient(0,0,1,0,0,38);softbox.addColorStop(0,'rgba(255,255,255,.72)');softbox.addColorStop(.5,'rgba(255,255,255,.28)');softbox.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=softbox;ctx.fillRect(-40,-40,80,80);ctx.restore();
    ctx.lineWidth=.8;ctx.strokeStyle='rgba(255,255,255,.64)';ctx.beginPath();ctx.arc(80,80,75.2,0,Math.PI*2);ctx.stroke();ctx.restore();
  }
  class CoverPhysics {
    constructor(cover,button){this.cover=cover;this.button=button;this.balls=[];this.polygons=[];this.raf=0;this.running=false;this.drag=null;this.lastPointer=null;this.onResize=()=>this.resize();this.onMove=e=>this.pointerMove(e);this.onUp=e=>this.release(e);}
    start(){
      this.stop();if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
      this.layer=document.createElement('div');this.layer.className='cover-ball-layer';this.layer.setAttribute('aria-hidden','true');this.cover.appendChild(this.layer);
      this.cover.classList.add('physics-active');
      this.running=true;this.elapsed=0;this.last=0;this.accumulator=0;this.resize();
      sphereFrames=buildSphereFrames();
      const diameter=Math.max(88,Math.min(160,this.width*.085));
      for(let i=0;i<16;i++){
        const element=document.createElement('span');element.className='cover-ball';const kind=i===0?'type':'fur';if(kind==='type')decorateSphere(element,i);else decorateFur(element,i-1);const ballDiameter=diameter;element.style.width=element.style.height=ballDiameter+'px';element.style.visibility='hidden';this.layer.appendChild(element);
        const r=ballDiameter/2;const ball={x:r+Math.random()*Math.max(1,this.width-ballDiameter),y:-r-30,vx:(Math.random()-.35)*190,vy:0,r,angle:0,held:false,active:false,delay:i*.12,element,kind};
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
      for(const b of active)if(b.beads)stepBeads(b,dt);
    }
    frame(time){
      if(!this.running)return;const dt=this.last?Math.min((time-this.last)/1000,.04):0;this.last=time;this.elapsed+=dt;
      this.updateTextColliders();
      for(const b of this.balls)if(!b.active&&this.elapsed>=b.delay){b.active=true;b.element.style.visibility='visible';}
      this.accumulator+=dt;while(this.accumulator>=1/120){this.step(1/120);this.accumulator-=1/120;}
      for(const b of this.balls)if(b.active){
        b.element.style.transform=`translate3d(${b.x-b.r}px,${b.y-b.r}px,0) rotate(${b.kind!=='type'?b.angle:b.angle*.12}rad)`;
        if(b.kind!=='type')continue;
        const frames=b.kind==='letter'?b.element._letterFrames:sphereFrames;
        const phase=b.kind==='letter'?((Math.floor(b.angle/(Math.PI*2)*frames.length)%frames.length)+frames.length)%frames.length:(Math.floor(this.elapsed*16)+b.element._spherePhase)%frames.length;
        if(phase!==b.sphereFrame){const ctx=b.element._sphereContext;ctx.clearRect(0,0,160,160);ctx.drawImage(frames[phase],0,0);b.sphereFrame=phase;}
      }
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
  if(typeof module!=='undefined'&&module.exports)module.exports={hull,circlePolygon,collidePair,CoverPhysics,decorateSphere,createBeads,stepBeads};
  if(typeof window!=='undefined')window.CoverPhysics=CoverPhysics;
})();
