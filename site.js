(function(){
  var id=location.hash.slice(1), routes=['cases','works','lab','services','about','updates','contact'];
  if((location.pathname==='/'||location.pathname==='/index.html')&&routes.includes(id))location.replace('/'+id+'.html');
})();
/* GA4 互動事件：事件名稱直接帶內容（如 view_case_delta），不用另外設定自訂維度就能在「事件」報表看到 */
function ariesTrack(name,params){try{if(typeof gtag==='function')gtag('event',name,params||{});}catch(e){}}
(function(){
  document.addEventListener('click',function(e){
    var a=e.target.closest&&e.target.closest('a[href]');
    if(!a) return;
    var h=a.getAttribute('href')||'';
    if(h.indexOf('mailto:')===0) ariesTrack('contact_email_click');
    else if(/\.pdf($|\?)/i.test(h)) ariesTrack('pdf_open',{file:h.split('/').pop()});
    else if(/github\.com/.test(h)) ariesTrack('github_click',{link_url:h});
  },true);
})();

document.getElementById('copy')?.addEventListener('click',function(){
  ariesTrack('contact_email_copy');
  var b=this,t=document.getElementById('mail').textContent;
  function done(){b.textContent='已複製';setTimeout(function(){b.textContent='複製'},1600)}
  function sel(){var r=document.createRange();r.selectNodeContents(document.getElementById('mail'));var s=getSelection();s.removeAllRanges();s.addRange(r);b.textContent='已選取，請按複製'}
  try{navigator.clipboard.writeText(t).then(done,sel)}catch(e){sel()}
});

/* 身分偏好跨頁保存；儲存不可用時仍可正常瀏覽。 */
(function(){
  var MISSIONS={game:['04','06','08','01','02','05','03','07'],ai:['03','07','02','05','01','08','04','06'],client:['01','08','02','03','07','04','05','06']};
  var ORDER={game:['cases','about','works','lab','services','updates','contact'],ai:['cases','about','works','services','lab','updates','contact'],client:['works','lab','services','cases','about','updates','contact']};
  var btns=Array.from(document.querySelectorAll('[data-aud]'));
  var cases=document.querySelector('#cases .case-grid')||document.getElementById('cases'), cards={};
  if(cases)cases.querySelectorAll('[data-mission]').forEach(function(card){cards[card.dataset.mission]=card;});
  var method=document.getElementById('method'), explore=document.getElementById('explore');
  function apply(k,scroll){
    if(!MISSIONS[k])k='game';
    if(cases)MISSIONS[k].forEach(function(n){if(cards[n])cases.appendChild(cards[n]);});
    /* 首頁：AI 專案與合作模式先看導入方法；遊戲公司模式放在探索區之後 */
    if(method&&explore){if(k==='game')explore.after(method);else explore.before(method);}
    ORDER[k].forEach(function(id,i){var card=document.querySelector('[data-page="'+id+'"]');if(card)card.style.order=i;});
    btns.forEach(function(b){b.setAttribute('aria-pressed',String(b.dataset.aud===k));});
    try{sessionStorage.setItem('aries-audience',k);}catch(e){}
    if(scroll){var hub=document.getElementById('explore');if(hub)hub.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});}
  }
  btns.forEach(function(b){b.addEventListener('click',function(){apply(b.dataset.aud,true);ariesTrack('audience_'+b.dataset.aud);});});
  var initial='game';try{initial=sessionStorage.getItem('aries-audience')||initial;}catch(e){}
  apply(initial,false);
})();

/* 案例卡片：點「看重點」開啟詳情視窗；網址 #case-xxx 可直接開啟 */
(function(){
  var dialogs=Array.from(document.querySelectorAll('.case-dialog'));
  if(!dialogs.length) return;
  function open(d,push){
    if(!d||d.open) return;
    if(typeof d.showModal==='function')d.showModal();else d.setAttribute('open','');
    document.documentElement.classList.add('dlg-lock');
    var art=d.closest('.case');
    if(art&&art.id)ariesTrack('view_'+art.id.replace(/-/g,'_'),{via:push?'click':'link'});
    if(push&&art&&art.id){try{history.replaceState(null,'','#'+art.id);}catch(e){}}
  }
  function close(d){if(d.open){if(typeof d.close==='function')d.close();else d.removeAttribute('open');}}
  dialogs.forEach(function(d){
    d.addEventListener('close',function(){
      document.documentElement.classList.remove('dlg-lock');
      if(location.hash){try{history.replaceState(null,'',location.pathname+location.search);}catch(e){}}
      var btn=document.querySelector('[aria-controls="'+d.id+'"]');if(btn)btn.focus();
    });
    d.querySelector('.dlg-close').addEventListener('click',function(){close(d);});
    d.addEventListener('click',function(e){if(e.target===d)close(d);});
  });
  document.querySelectorAll('.case-open').forEach(function(b){
    b.addEventListener('click',function(){open(document.getElementById(b.getAttribute('aria-controls')),true);});
  });
  function fromHash(){
    var art=location.hash&&document.getElementById(location.hash.slice(1));
    if(art&&art.classList.contains('case')){art.scrollIntoView({block:'center'});open(art.querySelector('.case-dialog'),false);}
  }
  fromHash();
  window.addEventListener('hashchange',fromHash);
})();

/* 雲月 3D：區塊進入畫面時自動載入並旋轉（約 2MB）；不支援自動偵測時保留按鈕，案例視窗與 IP 頁共用 */
(function(){
  var btns=Array.from(document.querySelectorAll('.yy-3d-load'));
  if(!btns.length) return;
  var lib=null;
  function loadLib(){
    if(lib) return lib;
    lib=new Promise(function(ok,fail){
      if(customElements.get('model-viewer')) return ok();
      var sc=document.createElement('script'); sc.type='module'; sc.src='/media/vendor/model-viewer-3.5.0.min.js';
      sc.onload=function(){ok();}; sc.onerror=function(){lib=null;fail();};
      document.head.appendChild(sc);
    });
    return lib;
  }
  function start(btn){
      if(btn.dataset.started) return; btn.dataset.started='1';
      var stage=btn.closest('.yy-3d-stage');
      btn.disabled=true; btn.textContent='載入中…';
      loadLib().then(function(){
        var mv=document.createElement('model-viewer');
        mv.setAttribute('src','/media/yunyue/yunyue-v2-web.glb');
        mv.setAttribute('alt','雲月靜態 3D 模型，可拖曳旋轉、滾輪縮放');
        mv.setAttribute('camera-controls',''); mv.setAttribute('auto-rotate',''); mv.setAttribute('shadow-intensity','0.6');
        mv.setAttribute('exposure','1.05'); mv.setAttribute('camera-orbit','90deg 80deg auto'); mv.setAttribute('rotation-per-second','18deg'); mv.className='yy-mv';
        stage.innerHTML=''; stage.appendChild(mv);
        var tip=document.createElement('p'); tip.className='cap'; tip.textContent='拖曳旋轉・滾輪或雙指縮放';
        stage.appendChild(tip);
        ariesTrack('yunyue_3d_load');
      },function(){btn.disabled=false;delete btn.dataset.started;btn.textContent='載入失敗，點此重試';});
  }
  var io='IntersectionObserver' in window ? new IntersectionObserver(function(entries){
    entries.forEach(function(e){if(e.isIntersecting){io.unobserve(e.target);start(e.target.querySelector('.yy-3d-load'));}});
  },{rootMargin:'200px'}) : null;
  btns.forEach(function(btn){
    btn.addEventListener('click',function(){start(btn);});
    if(io) io.observe(btn.closest('.yy-3d-stage'));
  });
})();

/* 前後對比滑桿 */
(function(){
  var f=document.getElementById('baFrame'), r=document.getElementById('baRange');
  if(!f) return;
  function set(v){ v=Math.max(0,Math.min(100,v)); f.style.setProperty('--pos',v+'%'); r.value=v; }
  r.addEventListener('input',function(){ set(+r.value); });
  var drag=false;
  function at(e){ var b=f.getBoundingClientRect(); set((e.clientX-b.left)/b.width*100); }
  f.addEventListener('pointerdown',function(e){ drag=true; f.setPointerCapture(e.pointerId); at(e); });
  f.addEventListener('pointermove',function(e){ if(drag) at(e); });
  f.addEventListener('pointerup',function(){ drag=false; });
  f.addEventListener('pointercancel',function(){ drag=false; });
})();



/* FOL 小電視：點擊後才載入 aries 確認的賽事影片 */
(function(){
  var btn=document.getElementById('tvPlay'), scr=document.getElementById('tvScreen');
  if(!btn) return;
  var VIDEO='hCn4XBZ6HPg';
  btn.addEventListener('click',function(){
    ariesTrack('fol_video_play');
    var f=document.createElement('iframe');
    f.src='https://www.youtube-nocookie.com/embed/'+VIDEO+'?autoplay=1&rel=0';
    f.title='DBD黎明死線生命盃 比賽影片現場（一）';
    f.referrerPolicy='strict-origin-when-cross-origin';
    f.allow='autoplay; encrypted-media; picture-in-picture; fullscreen';
    f.allowFullscreen=true; f.loading='lazy';
    scr.innerHTML=''; scr.appendChild(f);
    var n=document.createElement('p'); n.className='tv-note';
    n.innerHTML='畫面沒有出現的話，可以 <a href="https://www.youtube.com/watch?v=hCn4XBZ6HPg" target="_blank" rel="noopener">直接到 YouTube 觀看 ↗</a>';
    scr.parentNode.appendChild(n);
  });
})();

/* ===== 雲月 Anchor 導覽 MVP：保留圖集，無額外套件 ===== */
(function(){
  'use strict';
  var LINES = {
    hello:'你來啦～我是雲月！今天的作品集導覽，就交給我吧。',
    cases:'五個任務都在這裡！先陪我看看，AI 海報怎麼一步步過關吧～',
    works:'海報局部展示中～湊近看看排版和細節，寶藏就藏在這裡。',
    lab:'這裡是我的 IP 頁～動畫、貼圖和 3D 模型都在這裡！',
    services:'想找 Aries 一起做點什麼？AI 導入諮詢在這裡，我替你帶路～',
    updates:'網站的新消息在這裡～一起看看最近的進度吧。',
    about:'來看看 Aries 的冒險足跡～Mission 04 有小電視可以看喔！',
    contact:'有想法就寄信給 Aries 吧～信箱在這裡，我幫你找到啦。',
    bye:'那我先縮回小角落～想我了，就輕輕點一下。',
    sleep:'唔……讓我瞇一下。醒來再陪你找靈感～'
  };
  // 擴充入口：每個裝置／區塊只設定軌道內的 x 偏移及可用高度比例。
  var ANCHORS={
    desktop:{hero:[0,.20],cases:[8,.48],works:[0,.30],lab:[0,.40],services:[8,.65],about:[0,.42],contact:[8,.74]},
    tablet:{hero:[0,.24],cases:[4,.45],works:[0,.32],lab:[0,.40],services:[4,.60],about:[0,.40],contact:[4,.68]},
    mobile:{hero:[0,.28],cases:[2,.42],works:[0,.34],lab:[0,.40],services:[2,.48],about:[0,.38],contact:[2,.52]}
  };
  // 語意狀態與圖片動畫分開，未來可在 renderState 接 Rive／Live2D。
  var ANIM={idle:[0,6,5],move:[1,8,8],point:[10,8,5],greet:[3,4,5],sleep:[5,8,3]};
  var pet=document.getElementById('pet'),body=document.getElementById('petBody'),
      sprite=document.getElementById('sprite'),bubble=document.getElementById('bubble'),
      text=document.getElementById('petText'),choices=document.getElementById('petChoices'),
      closeBtn=document.getElementById('petClose'),slot=document.getElementById('petGuideSlot');
  slot.appendChild(bubble);
  var sections=['hero','cases','works','lab','services','about','updates','contact'].map(function(id){return document.getElementById(id);}).filter(Boolean);
  var motion=matchMedia('(prefers-reduced-motion: reduce)'),reduce=motion.matches;
  var active=null,mode=null,state='idle',frameTimer=null,poseTimer=null,settleTimer=null,sleepTimer=null,raf=0,lastX=null,lastY=null;
  var idlePoses=[[0,6,5],[6,6,5],[7,6,5],[8,6,5],[9,8,5],[10,8,5]],lastIdlePose=-1;
  var MENU=[['回到首頁','hero'],['看 AI 專案','cases'],['看海報作品','works'],['雲月 IP','lab'],['合作方式','services'],['Aries 的相關經歷','about'],['更新日誌','updates'],['聯絡','contact']];
  function frame(row,col){
    // Percentage offsets retain subpixel accuracy on narrow screens.
    sprite.style.backgroundPosition=(col/7*100)+'% '+(row/10*100)+'%';
  }
  function renderState(next){
    clearInterval(frameTimer);clearTimeout(poseTimer);state=next;pet.dataset.state=next;
    var a=ANIM[next],f=0;
    if(next==='idle'&&!reduce){
      var options=idlePoses.filter(function(pose){return pose[0]!==lastIdlePose;});
      a=options[Math.floor(Math.random()*options.length)];lastIdlePose=a[0];
      if(!document.hidden)poseTimer=setTimeout(function(){renderState('idle');},8000);
    }
    frame(a[0],0);
    if(reduce||document.hidden) return;
    frameTimer=setInterval(function(){f=(f+1)%a[1];frame(a[0],f);},1000/a[2]);
  }
  function restLater(){
    clearTimeout(sleepTimer);
    if(!reduce&&!document.hidden) sleepTimer=setTimeout(function(){renderState('sleep');},30000);
  }
  function chooseSection(){
    var line=document.querySelector('header.top').getBoundingClientRect().bottom+
      (innerHeight-document.querySelector('header.top').getBoundingClientRect().bottom)*.32;
    var best=null,distance=Infinity;
    // 依真實 DOM 座標判斷，兼容招募方／合作方的 CSS order。
    sections.forEach(function(el){
      if(el.hidden) return;
      var r=el.getBoundingClientRect();
      var d=r.top<=line&&r.bottom>=line?0:Math.min(Math.abs(r.top-line),Math.abs(r.bottom-line));
      if(d<distance){best=el.id;distance=d;}
    });
    // 文件底部停留於聯絡區，避免短區塊永遠無法被偵測。
    if(document.getElementById('contact')&&scrollY>0&&innerHeight+scrollY>=document.documentElement.scrollHeight-8) best='contact';
    return best||'hero';
  }
  function update(){
    raf=0;
    if(document.hidden) return;
    var nextMode=innerWidth>=1200?'desktop':innerWidth>820?'tablet':'mobile';
    var id=chooseSection(),changed=id!==active||nextMode!==mode;
    mode=nextMode;active=id;
    pet.dataset.section=id;pet.dataset.device=mode;
    var a=ANCHORS[mode][id]||ANCHORS[mode].hero,w=body.offsetWidth,h=body.offsetHeight;
    var rail=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--pet-rail'));
    var top=document.querySelector('header.top').getBoundingClientRect().bottom+14;
    var x=innerWidth-rail+(rail-w)/2+a[0];
    var y=top+Math.max(0,innerHeight-top-h-20)*a[1];
    x=Math.max(0,Math.min(x,innerWidth-w-4));
    y=Math.max(top,Math.min(y,innerHeight-h-12));
    if(x===lastX&&y===lastY) return;
    var first=lastX===null;lastX=x;lastY=y;
    if(first)pet.style.transition='none';
    clearTimeout(settleTimer);
    if(!first&&!reduce) renderState('move');
    pet.style.transform='translate3d('+x+'px,'+y+'px,0)';pet.dataset.ready='true';
    if(first){pet.getBoundingClientRect();requestAnimationFrame(function(){pet.style.transition='';});}
    settleTimer=setTimeout(function(){
      renderState(changed&&!reduce?'point':'idle');
      settleTimer=setTimeout(function(){renderState('idle');restLater();},reduce?0:900);
    },reduce||first?0:850);
  }
  function schedule(){if(!raf)raf=requestAnimationFrame(update);}
  function hideGuide(){bubble.hidden=true;pet.classList.remove('open');}
  function openGuide(){
    clearTimeout(settleTimer);clearTimeout(sleepTimer);
    renderState('greet');
    text.textContent=LINES[active==='hero'?'hello':active]||LINES.hello;
    choices.replaceChildren();
    MENU.forEach(function(m){
      var b=document.createElement('a');b.textContent=m[0];b.href=m[1]==='hero'?'/':'/'+m[1]+'.html';
      
      choices.appendChild(b);
    });
    bubble.hidden=false;pet.classList.add('open');
    slot.scrollIntoView({behavior:reduce?'auto':'smooth',block:'start'});
    closeBtn.focus({preventScroll:true});
    settleTimer=setTimeout(function(){renderState('idle');restLater();},reduce?0:1000);
  }
  body.addEventListener('click',openGuide);
  document.querySelector('.guide-trigger').addEventListener('click',openGuide);
  closeBtn.addEventListener('click',function(){hideGuide();document.querySelector('.guide-trigger').focus({preventScroll:true});schedule();});
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!bubble.hidden){hideGuide();document.querySelector('.guide-trigger').focus({preventScroll:true});schedule();}});
  addEventListener('scroll',schedule,{passive:true});
  addEventListener('resize',function(){
    pet.style.transition='none';lastX=null;frame(ANIM[state][0],0);update();
    requestAnimationFrame(function(){pet.style.transition='';});
  },{passive:true});
  document.querySelectorAll('[data-aud]').forEach(function(b){b.addEventListener('click',schedule);});
  new ResizeObserver(schedule).observe(document.querySelector('main'));
  motion.addEventListener('change',function(e){reduce=e.matches;clearTimeout(settleTimer);clearTimeout(sleepTimer);renderState('idle');lastY=null;schedule();});
  document.addEventListener('visibilitychange',function(){
    clearInterval(frameTimer);clearTimeout(poseTimer);clearTimeout(settleTimer);clearTimeout(sleepTimer);
    if(!document.hidden){renderState('idle');restLater();schedule();}
  });
  renderState('idle');schedule();restLater();
})();
