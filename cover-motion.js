/* Editorial frame assembly intro. Retains the former start/stop interface for safe replay. */
(()=>{
 class CoverIntroMotion{
  constructor(cover,button){this.cover=cover;this.button=button;this.animations=[];this.sequence=0;}
  stop(){this.sequence++;this.animations.forEach(a=>a.cancel());this.animations=[];this.layer?.remove();this.layer=null;this.cover.classList.remove('motion-intro-active');}
  animate(el,frames,options){const a=el.animate(frames,{fill:'both',...options});this.animations.push(a);return a.finished.catch(()=>{});}
  async start(){
   this.stop();const ticket=this.sequence;
   const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
   const lines=[...this.cover.querySelectorAll('.intro-line')],name=this.cover.querySelector('.intro-name');
   if(reduced){lines.forEach(el=>el.textContent=el.dataset.final);name.textContent=name.dataset.final;return;}
   this.cover.classList.add('motion-intro-active');
   const layer=document.createElement('div');layer.className='intro-assembly';layer.setAttribute('aria-hidden','true');this.cover.appendChild(layer);this.layer=layer;
   const grid=document.createElement('div');grid.className='intro-editorial-grid';layer.appendChild(grid);
   const labels=['FIRST CONTACT','SMALL COURAGE','VOICE / 01','FORM & FEELING','GROW TOGETHER','MONTALK'];
   const tasks=[];
   for(let i=0;i<12;i++){
    const tile=document.createElement('div');tile.className='intro-image-tile';
    const col=i%4,row=Math.floor(i/4);
    tile.style.left=(col*25)+'%';tile.style.top=(row*33.333)+'%';
    tile.style.backgroundPosition=(col/3*100)+'% '+(row/2*100)+'%';
    const caption=document.createElement('span');caption.textContent=labels[i%labels.length]+' / '+String(i+1).padStart(2,'0');tile.appendChild(caption);grid.appendChild(tile);
    const dx=(col-1.5)*160,dy=(row-1)*120;
    tasks.push(this.animate(tile,[
     {opacity:0,transform:`translate3d(${dx}px,${dy}px,-180px) rotate(${(i%2?1:-1)*14}deg) scale(.65)`,offset:0},
     {opacity:1,transform:'translate3d(0,0,0) rotate(0deg) scale(1)',offset:.44},
     {opacity:1,transform:'translate3d(0,0,0) scale(1)',offset:.64},
     {opacity:0,transform:`translate3d(${(col-1.5)*55}px,${(row-1)*30}px,0) scaleX(.06)`,offset:1}
    ],{duration:1850,delay:i*28,easing:'cubic-bezier(.22,1,.36,1)'}));
   }
   for(let i=0;i<4;i++){
    const frame=document.createElement('div');frame.className='intro-motion-frame';frame.style.inset=(7+i*6)+'% '+(8+i*8)+'%';
    frame.innerHTML='<i></i><i></i><i></i><i></i>';layer.appendChild(frame);
    tasks.push(this.animate(frame,[{opacity:0,transform:`perspective(900px) rotateX(${30-i*6}deg) scaleX(.15)`},{opacity:.6,offset:.3,transform:'perspective(900px) rotateX(0deg) scaleX(1)'},{opacity:0,transform:'translateY(-35px) scaleX(1.15)'}],{duration:1800,delay:i*110,easing:'cubic-bezier(.22,1,.36,1)'}));
   }
   lines.forEach((line,row)=>{
    line.replaceChildren();line.setAttribute('aria-label',line.dataset.final);
    Array.from(line.dataset.final).forEach((letter,i)=>{
     const glyph=document.createElement('span');glyph.className='glyph resolved';glyph.textContent=letter===' '?'\u00a0':letter;glyph.setAttribute('aria-hidden','true');line.appendChild(glyph);
     tasks.push(this.animate(glyph,[{opacity:0,transform:'translate3d(0,105%,0) rotateX(-65deg) skewX(-10deg)',filter:'blur(5px)'},{opacity:1,transform:'translate3d(0,-4%,0) rotateX(0deg) skewX(0deg)',filter:'blur(0)',offset:.8},{opacity:1,transform:'translate3d(0,0,0)',filter:'blur(0)'}],{duration:950,delay:1250+row*180+i*16,easing:'cubic-bezier(.16,1,.3,1)'}));
    });
   });
   name.textContent=name.dataset.final;
   tasks.push(this.animate(name,[{opacity:0,transform:'translateY(20px)'},{opacity:1,transform:'translateY(0)'}],{duration:700,delay:2200,easing:'cubic-bezier(.16,1,.3,1)'}));
   await Promise.all(tasks);
   if(ticket!==this.sequence)return;
   layer.remove();this.layer=null;this.cover.classList.remove('motion-intro-active');
  }
 }
 window.CoverPhysics=CoverIntroMotion;
})();
