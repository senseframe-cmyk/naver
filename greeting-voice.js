/* Hold-to-talk greeting with real interim transcription and deterministic replies. */
(() => {
  class GreetingVoice {
    constructor({button,character,screen,fallback,onReply,onContinue,onHint,lang='ko-KR',preserveTitle=false,idleCueEnabled=true,onBeforeListen=()=>{},listeningTitle='듣고 있어요\n편하게 말해 주세요'}){
      Object.assign(this,{button,character,screen,fallback,onReply,onContinue,onHint,lang,preserveTitle,idleCueEnabled,onBeforeListen,listeningTitle});
      this.held=false;this.disposed=false;this.busy=false;this.transcript='';this.base='';this.recognition=null;this.timers=[];this.originalSrc=character.src;this.hasUsedMicrophone=!!window.montalkMicUsed;
      this.stage=character.closest('.stage');this.title=screen.querySelector('.copy h2');this.defaultTitle=this.title?.textContent||'';
      this.ticker=document.createElement('div');this.ticker.className='greeting-transcript';this.ticker.setAttribute('aria-hidden','true');
      this.track=document.createElement('div');this.track.className='greeting-transcript-track';this.ticker.appendChild(this.track);this.stage.appendChild(this.ticker);
      this.bubble=document.createElement('span');this.bubble.className='idle-speech-bubble';this.bubble.textContent='Here!';this.stage.appendChild(this.bubble);
      this.down=e=>{if(e.button!==0)return;e.preventDefault();if(this.begin()&&e.pointerId!==undefined){this.pointerId=e.pointerId;button.setPointerCapture(e.pointerId)}};
      this.up=e=>{if(this.pointerId!==undefined&&e.pointerId!==this.pointerId)return;this.end();if(button.hasPointerCapture?.(e.pointerId))button.releasePointerCapture(e.pointerId);this.pointerId=undefined};
      this.keydown=e=>{if((e.key===' '||e.key==='Enter')&&!e.repeat){e.preventDefault();this.begin()}};
      this.keyup=e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();this.end()}};
      this.blur=()=>{if(!this.awaitingPermission)this.end()};this.cancel=()=>this.cancelHold();
      button.addEventListener('pointerdown',this.down);button.addEventListener('pointerup',this.up);button.addEventListener('pointercancel',this.cancel);button.addEventListener('lostpointercapture',this.blur);
      button.addEventListener('keydown',this.keydown);button.addEventListener('keyup',this.keyup);window.addEventListener('blur',this.blur);
      fallback.onclick=()=>{const text=window.prompt('친구에게 인사해 주세요','안녕!');if(text?.trim()){this.transcript=text.trim();this.write(this.transcript);this.finish()}};
      if(!(window.SpeechRecognition||window.webkitSpeechRecognition))fallback.hidden=false;
      this.activity=()=>{if(this.disposed||this.held||this.busy)return;this.leaveIdle();this.armIdle()};
      screen.addEventListener('pointerdown',this.activity);screen.addEventListener('keydown',this.activity);this.armIdle();
    }
    showNotHeard(){
      this.leaveIdle();this.restore();this.neutralSrc=this.originalSrc;
      this.character.src='img/sad.png';this.screen.classList.add('speech-missed');
      if(this.title){this.title.classList.remove('speech-target');this.title.textContent='잘 못 들었어\n다시 한 번 말해줄래?';this.title.setAttribute('aria-live','polite')}
      this.onHint('꾹 누르고 친구에게 인사해 보세요');this.armIdle();
    }
    armIdle(){
      clearTimeout(this.idleTimer);
      if(!this.idleCueEnabled||this.hasUsedMicrophone||window.montalkMicUsed)return;
      this.idleTimer=setTimeout(()=>{
        if(this.disposed||this.held||this.busy||this.hasUsedMicrophone||window.montalkMicUsed||!this.character.isConnected)return;
        this.idleReturnSrc=this.character.src;this.idleReturnTitle=this.title?.textContent;this.idleCue=true;
        if(this.title)this.title.textContent='아래 버튼을 누르고 말하면\n나와 대화할 수 있어';
        this.character.classList.remove('hatch-hop','pose-fading');
        this.character.src='img/sit.png';this.stage.classList.add('is-idle-cue');
      },7000);
    }
    leaveIdle(){
      if(!this.idleCue)return;
      this.idleCue=false;this.stage.classList.remove('is-idle-cue');
      if(this.title&&this.idleReturnTitle!==undefined)this.title.textContent=this.idleReturnTitle;
      if(this.character.isConnected)this.character.src=this.idleReturnSrc;
    }
    later(fn,ms){const id=setTimeout(()=>{if(!this.disposed)fn()},ms);this.timers.push(id);return id}
    begin(){
      if(this.disposed||this.busy||this.held)return false;
      this.hasUsedMicrophone=true;window.montalkMicUsed=true;clearTimeout(this.idleTimer);
      const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
      if(!SR){this.fallback.hidden=false;this.onHint('이 브라우저에서는 텍스트로 인사해 주세요.');return false}
      clearTimeout(this.idleTimer);
      this.held=true;this.awaitingPermission=true;this.cancelledBeforeStart=false;this.transcript='';this.base='';this.finishing=false;this.failed=false;
      window.speechSynthesis?.cancel();this.write('');this.startRecognition(SR);return true;
    }
    activateListeningPose(){
      this.awaitingPermission=false;this.leaveIdle();
      if(this.screen.classList.contains('speech-missed')){this.character.src=this.neutralSrc||this.originalSrc;this.screen.classList.remove('speech-missed')}
      this.character.classList.remove('hatch-hop','pose-fading');this.stage.querySelector('.pose-overlay')?.remove();
      this.originalSrc=this.character.src;this.listeningPose=true;
      this.character.src='img/listen.png';this.stage.classList.add('is-listening');this.button.classList.add('active');this.button.setAttribute('aria-pressed','true');
      this.onBeforeListen();
      if(this.preserveTitle&&this.title){this.title.classList.add('speech-target');this.preparePrompt()}
      else if(this.title)this.title.textContent=this.listeningTitle;this.screen.classList.add('greeting-recording');
      this.onHint('꾹 누르고 친구에게 인사해 보세요');
    }
    startRecognition(SR){
      if(this.disposed||!this.held)return;
      const recognition=new SR();this.recognition=recognition;recognition.lang=this.lang;recognition.continuous=true;recognition.interimResults=true;
      recognition.onstart=()=>{this.awaitingPermission=false;if(!this.held||this.disposed){try{recognition.stop()}catch{};return}if(!this.listeningPose)this.activateListeningPose()};
      const streamId=(this.streamId||0)+1;this.streamId=streamId;
      recognition.onresult=event=>{
        if(this.disposed||this.failed||recognition!==this.recognition)return;
        const words=Array.from(event.results,result=>result[0].transcript).join(' ');
        this.transcript=(this.base+' '+words).trim();
        for(let i=event.resultIndex||0;i<event.results.length;i++)this.write(event.results[i][0].transcript,streamId+':'+i);
      };
      recognition.onerror=event=>{
        if(this.disposed)return;
        if(event.error==='no-speech')return;
        this.failed=true;this.held=false;this.restore();this.fallback.hidden=false;
        if(event.error==='not-allowed'||event.error==='service-not-allowed')this.onHint('마이크 권한을 확인하거나 텍스트로 인사해 주세요.');else this.showNotHeard();
      };
      recognition.onend=()=>{
        if(this.disposed||recognition!==this.recognition)return;
        this.recognition=null;
        if(this.failed||this.cancelledBeforeStart)return;
        if(this.held){this.base=this.transcript;this.later(()=>this.startRecognition(SR),100)}
        else this.finish();
      };
      try{recognition.start()}catch{this.failed=true;this.held=false;this.restore();this.fallback.hidden=false;this.onHint('마이크를 시작하지 못했어요. 텍스트로 인사해 주세요.')}
    }
    preparePrompt(){
      const tokens=this.defaultTitle.match(/\S+|\s+/g)||[];this.promptWords=[];
      const spans=tokens.map(token=>{const span=document.createElement('span');span.textContent=token;if(token.trim())this.promptWords.push(span);return span});
      this.title.replaceChildren(...spans);
    }
    write(text,key='live'){
      if(!text){this.track.replaceChildren();this.speechSegments=new Map();this.laneUntil=[0,0,0,0];this.ticker.classList.remove('has-text');return}
      this.speechSegments ||= new Map();this.laneUntil ||= [0,0,0,0];
      const existing=this.speechSegments.get(key);
      // Interim recognition only updates its own moving sentence; never restart it.
      if(existing){existing.textContent=text;return}
      const span=document.createElement('span');span.textContent=text;
      const now=Date.now(),lane=this.laneUntil.indexOf(Math.min(...this.laneUntil));
      const delay=Math.max(0,this.laneUntil[lane]-now),duration=Math.max(10000,text.length*400);
      this.laneUntil[lane]=now+delay+duration+300;
      span.style.top=(lane*45)+'px';
      span.style.setProperty?.('--speech-start',(this.stage.clientWidth||393)+'px');
      span.style.animationDuration=duration+'ms';span.style.animationDelay=delay+'ms';
      this.speechSegments.set(key,span);this.track.appendChild(span);this.ticker.classList.add('has-text');
      this.later(()=>{span.remove();if(!this.track.children.length)this.ticker.classList.remove('has-text')},delay+duration);
    }
    end(){
      if(!this.held)return;this.held=false;
      if(this.awaitingPermission){this.cancelledBeforeStart=true;return}
      this.restore();
      this.onHint('인사를 듣고 있어요…');
      try{this.recognition?.stop()}catch{}
      if(!this.recognition)this.finish();
      else this.later(()=>{if(!this.held&&!this.failed)this.finish()},1300);
    }
    restore(){
      if(!this.listeningPose)return;
      this.listeningPose=false;
      this.stage.classList.remove('is-listening');this.screen.classList.remove('greeting-recording');if(this.title&&!this.preserveTitle)this.title.textContent=this.defaultTitle;this.button.classList.remove('active');this.button.setAttribute('aria-pressed','false');
      if(this.character.isConnected)this.character.src=this.originalSrc;
    }
    finish(){
      if(this.disposed||this.held||this.finishing||this.failed)return;this.finishing=true;
      if(!this.transcript.trim()){this.finishing=false;this.showNotHeard();return}
      this.busy=true;this.screen.classList.remove('speech-missed');this.restore();this.button.disabled=true;this.onHint('반가운 인사를 나눴어요');
      const text=this.transcript;
      const reply=/이름/.test(text)?'내 이름은 몬톡이야!\n만나서 반가워.':/안녕|반가/.test(text)?'반가워!\n네 목소리를 들으니 정말 좋아':'인사해 줘서 고마워!\n우리 친하게 지내자';
      this.later(()=>{this.onReply(reply,text);this.later(()=>this.onContinue(text),3500)},420);
    }
    cancelHold(){
      if(!this.held)return;this.held=false;this.failed=true;this.restore();try{this.recognition?.abort()}catch{}this.write('');this.onHint('꾹 누르고 친구에게 인사해 보세요');this.armIdle();
    }
    dispose(){
      this.disposed=true;clearTimeout(this.idleTimer);this.leaveIdle();this.screen.removeEventListener('pointerdown',this.activity);this.screen.removeEventListener('keydown',this.activity);this.held=false;this.timers.forEach(clearTimeout);try{this.recognition?.abort()}catch{}this.restore();
      const b=this.button;b.removeEventListener('pointerdown',this.down);b.removeEventListener('pointerup',this.up);b.removeEventListener('pointercancel',this.cancel);b.removeEventListener('lostpointercapture',this.blur);b.removeEventListener('keydown',this.keydown);b.removeEventListener('keyup',this.keyup);window.removeEventListener('blur',this.blur);this.ticker.remove();this.bubble.remove();
    }
  }
  if(typeof window!=='undefined')window.GreetingVoice=GreetingVoice;
  if(typeof module!=='undefined'&&module.exports)module.exports=GreetingVoice;
})();
