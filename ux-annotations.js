/* Review notes stay outside the device at stable, screen-specific heights. */
(()=>{
 if(new URLSearchParams(location.search).has('docPreview'))return;
 const wrap=document.querySelector('.center-wrap'),screen=document.getElementById('screen');
 const host=document.createElement('aside');host.className='ux-annotations';host.setAttribute('aria-label','화면별 UX 설계 의도');wrap.appendChild(host);
 const notes=[
  [{target:'#egg',point:[.84,.5],title:'호기심으로 여는 첫 만남',body:'익숙한 탭으로 알을 깨우며\n친구와의 첫 상호작용을 유도'}],
  [{target:'.stage .character',point:[.86,.32],title:'대화 상대가 되는 캐릭터',body:'가까이 다가와 듣는 몸짓으로\n음성 입력 상태를 함께 전달'},
   {target:'.bottom .greeting-mic',point:[.8,.5],title:'행동으로 익히는 음성 조작',body:'누르고 말하는 조작을 한국어 인사로 익힘\n인식한 말은 흐르는 텍스트로 확인'}],
  [{target:'.copy',point:[1,.65],title:'대화로 수집하는 이름 정보',body:'개인화에 필요한 이름을 목소리로 받고\n다음 질문에서 이름을 불러 응답'},
   {target:'.bottom .greeting-mic',point:[.8,.5],title:'익숙한 음성 조작의 재사용',body:'인사할 때 쓴 같은 버튼으로 응답해\n새 입력 방식을 배울 부담을 덜도록 설계'}],
  [{target:'.topbar .skip',point:[1,.5],title:'사용자에게 맡긴 진행 속도',body:'이전/건너뛰기로 사용자가 속도를 조절'},
   {target:'.choices',point:[1,.45],title:'대화 맥락으로 바꾼 선택지',body:'여행/일상/업무 중 편하게 고르게 해\n긴 입력 없이 대화 목적을 수집'}],
  [{target:'.copy',point:[1,.6],title:'시험을 대신하는 자기 평가',body:'정답을 요구하지 않는 질문으로\n스스로 느끼는 말하기 수준을 파악'},
   {target:'.choices',point:[1,.6],title:'불확실한 수준도 수용하는 선택지',body:'‘잘 모르겠어’와 건너뛰기를 제공해\n수준을 확신하지 못해도 다음으로 진행'}],
  [{target:'.copy',point:[1,.5],title:'온보딩 안에서의 첫 영어 발화',body:'쉬운 영어 인사로 발화 목표를 좁혀\n홈 진입 전에 서비스의 핵심 가치를 체험'},
   {target:'.bottom .greeting-mic',point:[.8,.5],title:'음성 인식 확인과 재시도 지원',body:'다가와 듣는 반응과 인식 문구로 확인\n다시 듣기/재시도로 첫 시도를 지원'}],
  [{target:'.stage .character',point:[.9,.4],title:'첫 발화와 연결된 돌봄 보상',body:'캐릭터의 축하와 포인트를 함께 제공\n대화 보상을 친구에게 먹이 주는 경험에 연결'},
   {target:'.bottom .primary',point:[1,.5],title:'완료 이후 이어지는 다음 대화',body:'첫 영어 발화로 온보딩의 목표를 달성하고\n추가 학습 설정 없이 홈으로 진입'}],
  [{target:'.stage .character',point:[.9,.35],title:'확장 구상 · 일상 속 대화 상대',body:'밤에는 저녁 공간, 카페에서는 바리스타로\n시간/주제에 맞는 배경과 역할을 제안할 계획'},
   {target:'.bottom .greeting-mic',point:[.8,.5],title:'대화와 돌봄의 순환 구조',body:'온보딩과 같은 버튼으로 영어 대화를 이어가고\n모은 포인트를 친구에게 먹이 주는 데 사용'}]
 ];
 let queued=false,lastStep=-1,listenTimer=0,listeningShown=false;
 let cachedPositions=null,layoutKey='';
 function syncListening(step){
  if(step!==lastStep){clearTimeout(listenTimer);listenTimer=0;listeningShown=false;lastStep=step;cachedPositions=null;}
  const listening=step===1&&!!screen.querySelector('.stage.is-listening');
  if(listening&&!listeningShown&&!listenTimer){
   listenTimer=setTimeout(()=>{listenTimer=0;if(Number(screen.dataset.step)===1&&screen.querySelector('.stage.is-listening')){listeningShown=true;queue();}},700);
  }else if(!listening&&listenTimer){clearTimeout(listenTimer);listenTimer=0;}
 }
 function setRowState(row,step,index){
  const englishReady=/Hello!\s*Nice to meet you/i.test(screen.querySelector('.copy h2')?.textContent||'')&&!screen.querySelector('.copy h2 span[style*="hidden"]');
  const contextual=screen.classList.contains('speech-missed')||!!screen.querySelector('.stage.is-idle-cue');
  row.hidden=(step===1&&index===0&&!listeningShown&&!contextual)||(step===5&&!englishReady&&!contextual);
  // The button note can be read before recording; the listening note is revealed on first use.
  row.style.setProperty('--note-delay',step===1?'0s':(index*1.45)+'s');
 }

 function render(){
  queued=false;
  const step=Number(screen.dataset.step)||0;
  syncListening(step);
  host.hidden=document.body.classList.contains('intro-playing')||document.body.classList.contains('doc-mode')||document.body.classList.contains('character-mode')||(step===0&&!wrap.classList.contains('note-ready'));
  if(host.hidden)return;
  const missed=screen.classList.contains('speech-missed'),idle=!!screen.querySelector('.stage.is-idle-cue');
  const context=missed?'missed':idle?'idle':'default';
  const descriptions=(notes[step]||notes[0]).map(item=>({...item}));
  if(missed)descriptions[0]={title:'인식 실패의 부담을 덜어주는 피드백',body:'잘 듣지 못한 상황을 캐릭터의 조심스러운 표정으로 전달\n사용자의 실수로 느끼지 않도록 다시 말할 기회를 안내'};
  else if(idle)descriptions[0]={title:'망설임에 반응하는 맥락형 행동 안내',body:'대화가 시작되지 않으면 캐릭터가 발화 버튼을 가리켜\n별도 설명 없이 다음 행동을 알아차리도록 유도'};
  // Use the middle of each screen's movement range, never the moving character bounds.
  const stableHeights=[[.52],[.46,.77],[.23,.77],[.16,.74],[.23,.74],[.23,.77],[.46,.77],[.46,.77]];
  const positions=stableHeights[step]||stableHeights[0];
  const nextLayoutKey=context+':'+step+':'+wrap.offsetWidth+':'+wrap.offsetHeight+':'+(step===5?screen.querySelector('.copy h2')?.textContent:'');
  if(!cachedPositions||layoutKey!==nextLayoutKey){
   layoutKey=nextLayoutKey;
   const origin=wrap.getBoundingClientRect(),scaleY=origin.height/wrap.offsetHeight||1;
   cachedPositions=positions.map(ratio=>wrap.offsetHeight*ratio);
   const centerOf=selector=>{
    const el=screen.querySelector(selector);if(!el)return null;
    const bounds=el.getBoundingClientRect();if(!bounds.height)return null;
    return (bounds.top+bounds.height/2-origin.top)/scaleY;
   };
   // Only stationary controls/title are measured, once per screen size.
   if(step===1||step===2){const button=centerOf('.bottom .greeting-mic');if(button!==null)cachedPositions[1]=button;}
   if([2,3,4,5].includes(step)){const title=centerOf('.copy h2');if(title!==null)cachedPositions[0]=title;}
   if(step===3){const skip=document.querySelector('.phone .topbar .skip');if(skip){const bounds=skip.getBoundingClientRect();cachedPositions[0]=(bounds.top+bounds.height/2-origin.top)/scaleY;}}
   if(step===3||step===4){const choice=centerOf('.choices .pill');if(choice!==null)cachedPositions[1]=choice;}
   if(step===5){const retry=centerOf('.replay-question');if(retry!==null)cachedPositions[1]=retry;}
   if(step===6){const action=centerOf('.bottom .primary');if(action!==null)cachedPositions[1]=action;}
   if(step===7){const profile=centerOf('.home-my'),mic=centerOf('.bottom .greeting-mic');if(profile!==null)cachedPositions[0]=profile;if(mic!==null)cachedPositions[1]=mic;}
   if(missed){const title=centerOf('.copy h2');if(title!==null)cachedPositions[0]=title;}
   else if(idle){cachedPositions[0]=wrap.offsetHeight*.59;}
  }
  const topFor=index=>cachedPositions[index];
  if(host.dataset.step===step+':'+context&&host.children.length===descriptions.length){
   descriptions.forEach((item,index)=>{const row=host.children[index];row.style.top=topFor(index)+'px';setRowState(row,step,index);});
   return;
  }
  const fragment=document.createDocumentFragment();
  for(const [index,item] of descriptions.entries()){
   const row=document.createElement('div');row.className='ux-annotation';row.style.top=topFor(index)+'px';setRowState(row,step,index);
   const line=document.createElement('span');line.className='ux-annotation-line';row.appendChild(line);
   const label=document.createElement('div');label.className='ux-annotation-label';
   const title=document.createElement('strong');title.textContent=item.title;const body=document.createElement('p');body.textContent=item.body;label.append(title,body);row.appendChild(label);fragment.appendChild(row);
  }
  host.replaceChildren(fragment);host.dataset.step=step+':'+context;
 }
 function queue(){if(queued)return;queued=true;requestAnimationFrame(render);}
 window.renderUXAnnotations=queue;
 new ResizeObserver(queue).observe(wrap);
 new MutationObserver(queue).observe(wrap,{attributes:true,attributeFilter:['class']});
 new MutationObserver(queue).observe(document.body,{attributes:true,attributeFilter:['class']});
 window.addEventListener('resize',queue);document.fonts.ready.then(()=>{cachedPositions=null;queue();});
 new MutationObserver(queue).observe(screen,{subtree:true,attributes:true,attributeFilter:['class','data-step','style'],childList:true,characterData:true});
 // Pose transitions do not affect note positions or replay their entrance.
 queue();
})();
