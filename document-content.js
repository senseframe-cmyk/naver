/* Document previews use index.html's renderer so copy, assets and layout have one source. */
(()=>{
 if(new URLSearchParams(location.search).has('docPreview'))return;
 let observers=[];
 const sheets={
  4:[
   [0,'','안녕 작은 친구','- 익숙한 시작 버튼과 탭은 유지해 첫 행동 유도','- 알을 깨우는 호기심을 친구와의 첫 만남으로 연결'],
   [1,'','목소리로 안녕','- 한국어 인사로 누르고 말하는 조작을 먼저 익힘','- 망설이면 버튼을 가리키고 말하면 다가와 듣기'],
   [2,'','이름을 부르면','- 입력 폼 대신 같은 발화 버튼으로 이름 응답','- 다음 질문에서 이름을 불러 정보의 쓰임을 전달'],
   [3,'','무슨 얘기 할까','- 익숙한 2×2 선택지로 학습 목적 선택','- 이전 / 건너뛰기로 진행 속도를 사용자가 조절'],
   [4,'','천천히 시작해','- 시험 대신 스스로 느끼는 말하기 수준을 선택','- 잘 모르겠어도 답으로 받아 첫 이용의 부담 완화']
  ],
  5:[
   [5,'','영어로 첫마디','- 앞서 익힌 버튼으로 쉬운 영어 한 문장 발화','- 설정 완료 전에 영어회화의 핵심 경험 제공'],
   [5,'listen','듣는 중','- 가까이 다가와 귀 기울이며 음성 입력 상태 전달','- 인식한 말은 흐르는 텍스트로 보여 상태 확인 지원'],
   [1,'error','다시 말하기','- 듣지 못한 상황을 조심스러운 표정과 문구로 안내','- 사용자에게 책임을 돌리지 않고 재시도 지원'],
   [6,'','해냈어 우리','- 첫 영어 발화를 캐릭터의 축하와 포인트로 격려','- 관계와 돌봄으로 이어질 보상 경험의 출발점'],
   [7,'','또 만나 우리','- 홈에서도 같은 발화 버튼으로 다음 대화 시작','- 시간 / 주제별 공간과 친구 돌봄은 다음 확장 구상']
  ]
 };
 window.mountDocumentScreens=page=>{
  observers.forEach(o=>o.disconnect());observers=[];
  if(!sheets[page])return;
  const host=document.getElementById('docSlide'),grid=document.createElement('div');grid.className='doc-live-screens';grid.dataset.page=page;
  for(const [index,[step,pose,label,line1,line2]] of sheets[page].entries()){
   const card=document.createElement('figure');card.className='doc-screen-card';
   const heading=document.createElement('figcaption');heading.className='doc-screen-label';heading.textContent=label;
   const viewport=document.createElement('div');viewport.className='doc-screen-viewport';
   const frame=document.createElement('iframe'),url=new URL(location.href);url.search='';url.hash='';url.searchParams.set('docPreview',step);if(pose)url.searchParams.set('pose',pose);
   frame.src=url.href;frame.title=label+' 프로토타입 화면';frame.tabIndex=-1;frame.setAttribute('aria-hidden','true');viewport.appendChild(frame);
   const desc=document.createElement('ul');desc.className='doc-screen-description';
   for(const line of [line1,line2]){const item=document.createElement('li');item.textContent=line.replace(/^[-•]\s*/, '');desc.appendChild(item);}
   card.append(heading,viewport,desc);grid.appendChild(card);
   let arrow=null,touch=null;
   if(page===4||page===5){
    if(index<4){
     arrow=document.createElement('div');arrow.className='doc-flow-arrow';arrow.setAttribute('aria-hidden','true');
     arrow.innerHTML='<svg viewBox="0 0 100 16" preserveAspectRatio="none"><path d="M2 8H91" fill="none" stroke="currentColor" stroke-width="2"/><path d="M89 2L99 8L89 14Z" fill="currentColor"/></svg>';
     if((page===4&&index===0)||(page===5&&index===3)){const label=document.createElement('span');label.textContent='Tap';arrow.appendChild(label);}
     card.appendChild(arrow);
    }
    if(page===4&&index===0){touch=document.createElement('span');touch.className='doc-touch-indicator';touch.setAttribute('aria-hidden','true');viewport.appendChild(touch);}
   }
   const resize=()=>{
    frame.style.transform=`scale(${viewport.clientWidth/393})`;
    if(arrow)arrow.style.top=`${viewport.offsetTop+viewport.clientHeight/2}px`;
    if(touch){
     const egg=frame.contentDocument?.querySelector(page===4?'#egg':index===1?'.mic':'.primary');
     if(egg){const bounds=egg.getBoundingClientRect();touch.style.left=`${(bounds.left+bounds.width/2)/393*100}%`;touch.style.top=`${(bounds.top+bounds.height/2)/854*100}%`;}
    }
   };
   const observer=new ResizeObserver(resize);observer.observe(viewport);observers.push(observer);frame.addEventListener('load',resize);
  }
  host.appendChild(grid);
 };
 window.mountDocumentScreens(typeof slideNo==='number'?slideNo:1);
})();
