/* Document previews use index.html's renderer so copy, assets and layout have one source. */
(()=>{
 if(new URLSearchParams(location.search).has('docPreview'))return;
 let observers=[];
 const sheets={
  4:[
   [0,'','첫 만남 · 1단계','흔들리는 알로 호기심을 자극해요.','첫 행동으로 친구를 깨워요.'],
   [1,'','인사 나누기 · 2단계','친구에게 짧게 인사해요.','누르고 말하는 방식을 익혀요.'],
   [2,'','서로 알아가기 · 3단계','이름이나 별명을 말해요.','대화 속에서 개인화를 시작해요.'],
   [3,'','목표 찾기 · 4단계','영어를 쓰고 싶은 상황을 골라요.','익숙한 선택지로 부담을 덜어요.'],
   [4,'','출발점 맞추기 · 5단계','스스로 느끼는 수준을 골라요.','평가보다 편안한 시작을 안내해요.']
  ],
  5:[
   [5,'','첫 대화 · 6단계','쉬운 영어 한마디를 말해요.','다시 듣기와 건너뛰기를 제공해요.'],
   [5,'listen','듣는 중 · 6단계','친구가 가까이 와서 들어요.','확장되는 버튼으로 녹음을 알려요.'],
   [1,'error','다시 말하기 · 2단계','못 들은 상황을 타이틀로 알려요.','기존 맥락에서 다시 시도해요.'],
   [6,'','작은 성취 · 7단계','영어 발화의 성공을 축하해요.','포인트와 파티클로 성취를 전해요.'],
   [7,'','우리의 공간 · 홈','다음 영어 대화를 시작해요.','모은 포인트로 성장 경험을 연결해요.']
  ]
 };
 window.mountDocumentScreens=page=>{
  observers.forEach(o=>o.disconnect());observers=[];
  if(!sheets[page])return;
  const host=document.getElementById('docSlide'),grid=document.createElement('div');grid.className='doc-live-screens';
  for(const [step,pose,label,line1,line2] of sheets[page]){
   const card=document.createElement('figure');card.className='doc-screen-card';
   const heading=document.createElement('figcaption');heading.className='doc-screen-label';heading.textContent=label;
   const viewport=document.createElement('div');viewport.className='doc-screen-viewport';
   const frame=document.createElement('iframe'),url=new URL(location.href);url.search='';url.hash='';url.searchParams.set('docPreview',step);if(pose)url.searchParams.set('pose',pose);
   frame.src=url.href;frame.title=label+' 프로토타입 화면';frame.tabIndex=-1;frame.setAttribute('aria-hidden','true');viewport.appendChild(frame);
   const desc=document.createElement('p');desc.className='doc-screen-description';desc.append(document.createTextNode(line1),document.createElement('br'),document.createTextNode(line2));
   card.append(heading,viewport,desc);grid.appendChild(card);
   const resize=()=>frame.style.transform=`scale(${viewport.clientWidth/393})`;
   const observer=new ResizeObserver(resize);observer.observe(viewport);observers.push(observer);frame.addEventListener('load',resize);
  }
  host.appendChild(grid);
 };
 window.mountDocumentScreens(typeof slideNo==='number'?slideNo:1);
})();
