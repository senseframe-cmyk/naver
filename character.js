(()=>{
 if(new URLSearchParams(location.search).has('docPreview'))return;
 const poses=[
 ['hello.png','첫 인사','가까워지는 첫마디','눈을 맞추고 환하게 웃으며 반갑게 맞이합니다. 낯선 서비스의 시작을 친구와의 만남으로 바꿉니다.'],
 ['listen.png','경청','네 이야기에 집중해','가까이 다가와 귀를 기울입니다. 음성 입력 중이라는 상태를 몸짓으로 전달합니다.'],
 ['thinking.png','생각','함께 답을 찾아가는 중','고개를 기울이고 다음 이야기를 생각합니다. 학습 목적을 묻는 순간에도 평가보다 호기심을 표현합니다.'],
 ['happy.png','기쁨','작은 시도도 큰 기쁨으로','활짝 웃는 표정으로 첫 발화를 축하합니다. 맞고 틀림보다 말해본 경험에 긍정적으로 반응합니다.'],
 ['sad.png','다시 시도','괜찮아, 한 번 더','잘 듣지 못했을 때 조심스러운 표정을 보여줍니다. 사용자에게 책임을 돌리지 않고 다시 말할 여지를 만듭니다.'],
 ['thought.png','궁금함','조금 더 알고 싶어','사용자의 이야기를 궁금해하는 표정입니다. 질문이 설문처럼 느껴지지 않도록 대화의 맥락을 만듭니다.'],
 ['surprise.png','놀람','새로운 발견의 순간','새로운 말과 예상하지 못한 이야기에 놀랍니다. 대화에 생동감을 더하는 확장용 표정입니다.'],
 ['sit.png','휴식','서두르지 않아도 괜찮아','몸을 낮추고 편안하게 함께 머무는 모습입니다. 대화 사이의 쉼을 표현하는 확장용 포즈입니다.'],
 ['rotation_1.png','설렘','기쁨이 몸짓이 되는 순간','눈을 감고 몸을 기울여 설렘을 표현합니다. 성취의 순간에 활용할 수 있는 확장용 포즈입니다.'],
 ['rotation_2.png','뒷모습','어느 방향에서도 같은 친구','뒷모습에서도 둥근 실루엣과 털의 색이 이어집니다. 캐릭터의 형태를 살펴보는 방향 연구입니다.'],
 ['somnolence.png','졸림','오늘의 이야기를 마치며','눈꺼풀이 무거워지는 느긋한 표정입니다. 하루의 마무리를 표현하는 확장용 포즈입니다.']
 ];
 const page=document.createElement('section');page.id='characterView';page.className='character-view';page.hidden=true;page.setAttribute('aria-label','Montalk 캐릭터 이야기');page.tabIndex=0;
 page.innerHTML=`<div class="character-content">
 <section class="character-hero"><div class="character-hero-copy"><p class="character-kicker">MEET MONTALK</p><h1>첫마디가 어려울 때<br>먼저 다가오는 친구</h1><p>평가하는 선생님보다, 이야기를 기다려주는 작은 친구.<br>Montalk는 말하기의 시작을 관계의 시작으로 바꿉니다.</p><a href="#character-name" class="character-scroll-link">친구의 이야기 살펴보기 <span>↓</span></a></div><div class="character-hero-art"><img class="character-cloud character-cloud-one" src="img/cloud_01.png" alt="" aria-hidden="true"><img class="character-cloud character-cloud-two" src="img/cloud_02.png" alt="" aria-hidden="true"><img class="character-meadow" src="img/nature.png" alt="" aria-hidden="true"><img src="img/character-hero-clean.png" alt="환하게 웃으며 인사하는 Montalk 캐릭터" fetchpriority="high"></div></section>
 <section class="character-name character-reveal" id="character-name"><p class="character-kicker">THE NAME · 이름에 담는 의미</p><h2 class="character-name-title">작은 몬스터와 시작하는 Talk</h2><div class="character-name-equation"><span><span class="name-part">Mon</span>ster</span><b>+</b><span class="name-part">talk</span></div><p>Montalk는 <strong>Monster에서 가져온 Mon과 Talk</strong>를 합친 이름입니다.<br>영어를 잘해야 만나는 친구가 아니라, 말을 걸면서 조금씩 가까워지는 친구.<br>매일의 작은 대화가 자연스러운 일상이 되기를 바라는 마음을 담았습니다.</p></section>
 <section class="character-studio"><div class="character-studio-sticky"><p class="character-kicker">CHARACTER STUDY</p><h2>부드러운 모습<br>명확한 반응</h2><div class="character-study-art"><img class="character-pencil" src="img/character_sketch.png" alt="정자세 캐릭터의 연필 외곽선 스케치" loading="lazy"><span>Sketch</span></div></div><div class="character-study-notes"><article class="character-reveal"><span>SILHOUETTE</span><h3>둥글게 가까이</h3><p>둥근 몸과 짧은 뿔은 몬스터의 개성을 남기면서 위압감을 덜어냅니다. 큰 눈은 대화 상대와 눈을 맞추는 듯한 인상을 줍니다.</p></article><article class="character-reveal"><span>TEXTURE & COLOR</span><h3>차가운 화면 속<br>따뜻한 촉감</h3><p>민트에서 하늘색으로 이어지는 털의 색과 부드러운 질감. 화면 속에서도 만져보고 싶은 친근함을 표현합니다.</p></article><article class="character-reveal"><span>PERSONALITY</span><h3>정답보다 반응</h3><p>먼저 반기고, 귀 기울여 듣고, 작은 시도를 기뻐합니다. 사용자의 말에 반응하는 태도가 캐릭터의 성격이 됩니다.</p></article></div></section>
 <section class="character-expressions"><header class="character-reveal"><p class="character-kicker">EXPRESSIONS & MOTION</p><h2>표정이 곧<br>대화의 피드백</h2><p>현재 온보딩에 쓰이는 반응부터 다음 대화를 위한 확장 포즈까지.</p></header><div class="character-pose-grid">${poses.map(([src,label,title,desc],i)=>`<article class="character-pose character-reveal"><div class="character-pose-art"><span>${String(i+1).padStart(2,'0')} ${label}</span><img src="img/${src}" alt="${label} 표정의 Montalk 캐릭터" loading="lazy"></div><h3>${title.replace(/[.,]/g,'')}</h3><p>${desc}</p></article>`).join('')}</div></section>
 <section class="character-birth character-reveal"><img class="character-birth-cloud" src="img/cloud_02.png" alt="" aria-hidden="true"><div class="character-birth-images"><img src="img/egg.png" alt="캐릭터가 깨어나기 전의 알" loading="lazy"><span>→</span><img src="img/hatch_first.png" alt="알에서 깨어나는 첫 순간" loading="lazy"><span>→</span><img src="img/hatch_second.png" alt="알을 깨고 모습을 드러낸 친구" loading="lazy"></div><p class="character-kicker">THE FIRST MOMENT</p><h2>톡톡 그 작은 행동이<br>우리의 첫 대화</h2><p>알을 깨우는 호기심에서 인사로, 인사에서 첫 영어 한마디로.<br>캐릭터의 변화가 다음 행동을 자연스럽게 안내합니다.</p></section>
 <footer class="character-ending"><img class="character-ending-meadow" src="img/nature.png" alt="" aria-hidden="true"><p class="character-kicker">GROW TOGETHER</p><h2>한마디씩<br>조금 더 가까이</h2><button type="button" id="characterTry">Montalk 만나러 가기 <span>↗</span></button></footer></div>`;
 document.querySelector('.layout').appendChild(page);
 // Separate Latin runs so every Korean character uses Pretendard.
 const latinWalker=document.createTreeWalker(page,NodeFilter.SHOW_TEXT),latinNodes=[];
 while(latinWalker.nextNode())latinNodes.push(latinWalker.currentNode);
 for(const node of latinNodes){
  if(!/[A-Za-z]/.test(node.textContent))continue;
  const fragment=document.createDocumentFragment();
  for(const part of node.textContent.split(/([A-Za-z][A-Za-z &+/-]*)/g)){
   if(!part)continue;
   if(/[A-Za-z]/.test(part)){const span=document.createElement('span');span.className='character-latin';span.textContent=part;fragment.appendChild(span);}
   else fragment.appendChild(document.createTextNode(part));
  }
  node.replaceWith(fragment);
 }

 // Keep the complete heading available to assistive technology while letters animate visually.
 page.querySelectorAll('h1,h2,h3').forEach(heading=>{
  heading.classList.add('character-write');heading.setAttribute('aria-label',heading.innerText||heading.textContent);
  let index=0;
  const walker=document.createTreeWalker(heading,NodeFilter.SHOW_TEXT),nodes=[];
  while(walker.nextNode())nodes.push(walker.currentNode);
  for(const node of nodes){
   const fragment=document.createDocumentFragment();
   for(const word of node.textContent.split(/(\s+)/)){
    if(!word)continue;
    if(/^\s+$/.test(word)){fragment.appendChild(document.createTextNode(word));continue;}
    const group=document.createElement('span');group.className='character-word';group.setAttribute('aria-hidden','true');
    for(const letter of Array.from(word)){const glyph=document.createElement('span');glyph.className='character-glyph';glyph.textContent=letter;glyph.style.setProperty('--glyph-delay',Math.min(index++*22,900)+'ms');group.appendChild(glyph);}
    fragment.appendChild(group);
   }
   node.replaceWith(fragment);
  }
 });
 page.querySelectorAll('.character-pose').forEach((card,index)=>card.style.setProperty('--reveal-delay',(index%3)*140+'ms'));
 page.querySelectorAll('.character-hero-copy>p,.character-hero-copy>.character-scroll-link,.character-study-notes article>p,.character-expressions header>p:not(.character-kicker)').forEach((el,index)=>{
  el.classList.add('character-reveal');el.style.setProperty('--reveal-delay',(100+(index%3)*100)+'ms');
 });
 const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
  if(entry.isIntersecting){entry.target.classList.add(entry.target.matches('.character-write')?'is-written':'is-visible');observer.unobserve(entry.target);}
 }),{root:page,threshold:.16,rootMargin:'0px 0px -20px 0px'});
 page.querySelectorAll('.character-reveal,.character-write').forEach(el=>observer.observe(el));
 const reduce=matchMedia('(prefers-reduced-motion: reduce)');let ticking=false;
 const update=()=>{if(!reduce.matches){

  const bounds=page.getBoundingClientRect();
  const movements=Array.from(page.querySelectorAll('.character-pose-art')).map(el=>[el,Math.max(-14,Math.min(14,(el.getBoundingClientRect().top-bounds.top-page.clientHeight*.5)*.035))]);
  movements.forEach(([el,y])=>el.style.setProperty('--pose-drift',y+'px'));}ticking=false;};
 page.addEventListener('scroll',()=>{if(!ticking){requestAnimationFrame(update);ticking=true;}},{passive:true});
 page.querySelector('.character-scroll-link').addEventListener('click',event=>{event.preventDefault();page.scrollTo({top:page.querySelector('#character-name').offsetTop-180,behavior:reduce.matches?'instant':'smooth'});});
 document.getElementById('characterTry').onclick=()=>setView('prototype');
 window.addEventListener('resize',update);
 const status=document.createElement('img');status.className='device-status-bar';status.src='img/status_bar.png';status.alt='';status.setAttribute('aria-hidden','true');document.querySelector('.device-shell .phone').appendChild(status);
})();
