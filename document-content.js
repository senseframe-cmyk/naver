/* Document previews use index.html's renderer so copy, assets and layout have one source. */
(()=>{
 if(new URLSearchParams(location.search).has('docPreview'))return;
 let observers=[];
 const sheets={
  4:[
   [0,'','첫 만남 – 첫 행동 유도','- 알을 터치하는 간단한 행동으로 첫 상호작용 유도','- 캐릭터가 등장하는 과정을 통해 자연스럽게 서비스 진입'],
   [1,'','인사 나누기 – 캐릭터와 관계 형성','- 캐릭터가 먼저 인사하며 음성 대화 시작 유도','- 별도 학습 안내 없이 캐릭터의 반응으로 대화 방식 전달'],
   [2,'','서로 알아가기 – 대화형 정보 수집','- 입력 폼 대신 캐릭터와의 대화로 이름 수집','- 이름을 부르며 개인적인 첫 관계 형성'],
   [3,'','목표 찾기','- 대화를 통해 영어 학습 목적 파악','- 음성 응답이 어려운 경우 선택지로 대체 가능'],
   [4,'','출발점 맞추기','- 레벨 테스트 대신 간단한 자기 평가로 시작 수준 파악','- 정답에 대한 부담 없이 학습 출발점 설정']
  ],
  5:[
   [5,'','첫 대화','- 짧고 쉬운 영어 인사로 첫 발화 유도','- 정답보다 말하기 시도 자체에 집중하도록 안내'],
   [5,'listen','듣는 중','- 캐릭터가 가까이 다가와 귀 기울이는 인터랙션 제공','- 캐릭터의 움직임과 음성 UI로 듣기 상태 전달'],
   [1,'error','다시 말하기','- 음성 인식 실패 시 재시도 안내','- 사용자 실수로 느껴지지 않도록 중립적인 피드백 제공'],
   [6,'','작은 성취','- 첫 영어 발화에 대한 캐릭터의 긍정적 반응 제공','- 첫 대화 완료를 포인트와 함께 시각적으로 전달'],
   [7,'','홈','- 첫 대화 이후 캐릭터와 함께 홈으로 자연스럽게 연결','- 별도 학습 시작 절차 없이 다음 영어 대화로 이어지는 경험 제공']
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
