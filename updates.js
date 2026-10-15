(function(){
 'use strict';
 var root=document.querySelector('[data-updates]');if(!root)return;
 var list=root.querySelector('[data-update-list]'),status=root.querySelector('[data-update-status]'),filters=root.querySelectorAll('[data-update-filter]'),items=[],selected='全部';
 var categories=['重要通知','作品','專案進度'];
 var dialog=document.createElement('dialog');dialog.className='update-dialog';dialog.setAttribute('aria-labelledby','update-dialog-title');document.body.appendChild(dialog);
 var modalSupported=typeof dialog.showModal==='function',previousFocus,previousOverflow;
 function node(tag,cls,text){var el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el}
 function validLink(value){if(typeof value!=='string'||!value.trim())return null;try{var url=new URL(value,location.origin);return ['https:','http:'].includes(url.protocol)?url.href:null}catch(e){return null}}
 function summary(item){if(typeof item.summary==='string'&&item.summary.trim())return item.summary.trim();var text=item.content.trim().replace(/\s+/g,' ');var sentence=text.match(/^.*?[。！？]/);return sentence?sentence[0]:text.length>48?text.slice(0,48)+'…':text}
 function extra(item){return item.content.trim()!==summary(item)||!!validLink(item.image)||!!validLink(item.link)}
 function body(item){
  var wrap=node('div','update-full');
  var meta=node('div','update-meta'),label=node('span','update-label',item.category),date=node('time','',item.date.replaceAll('-',' / '));date.dateTime=item.date;meta.append(label,date);
  var title=node('h2','',item.title||summary(item));title.id='update-dialog-title';
  wrap.append(node('p','label','SYSTEM BULLETIN / ARIES'),title,meta,node('p','update-full-copy',item.content));
  var image=validLink(item.image);if(image){var img=node('img','update-full-image');img.src=image;img.alt=item.imageAlt||item.title||'公告附圖';img.loading='lazy';wrap.appendChild(img)}
  var href=validLink(item.link);if(href){var link=node('a','update-link','查看相關內容 ↗');link.href=href;if(new URL(href).origin!==location.origin){link.target='_blank';link.rel='noopener noreferrer'}wrap.appendChild(link)}
  return wrap;
 }
 function close(){if(modalSupported&&dialog.open)dialog.close()}
 dialog.addEventListener('close',function(){document.body.style.overflow=previousOverflow;if(previousFocus&&previousFocus.isConnected)previousFocus.focus()});
 dialog.addEventListener('click',function(e){if(e.target===dialog){var rect=dialog.getBoundingClientRect();if(e.clientX<rect.left||e.clientX>rect.right||e.clientY<rect.top||e.clientY>rect.bottom)close()}});
 function open(item,card,trigger){
  if(!modalSupported){
   var existing=card.querySelector('.update-inline');if(existing){existing.remove();trigger.focus();return}
   var inline=node('div','update-inline');var content=body(item);content.querySelector('h2').removeAttribute('id');var collapse=node('button','update-close','收合公告');collapse.type='button';collapse.onclick=function(){inline.remove();trigger.focus()};inline.append(collapse,content);card.appendChild(inline);collapse.focus();return;
  }
  previousFocus=trigger;previousOverflow=document.body.style.overflow;dialog.replaceChildren();dialog.dataset.category=item.category;
  var dismiss=node('button','update-close','關閉 ✕');dismiss.type='button';dismiss.setAttribute('aria-label','關閉公告，回到原頁面');dismiss.onclick=close;
  dialog.append(dismiss,body(item));dialog.showModal();document.body.style.overflow='hidden';dismiss.focus();
 }
 function render(){
  var shown=items.filter(function(item){return selected==='全部'||item.category===selected}),limit=Number(root.dataset.limit||0);if(limit)shown=shown.slice(0,limit);
  list.replaceChildren();
  shown.forEach(function(item){
   var card=node('article','update-card');card.dataset.category=item.category;
   var meta=node('div','update-meta'),label=node('span','update-label',item.category),date=node('time','',item.date.replaceAll('-',' / '));date.dateTime=item.date;meta.append(label,date);
   var title=node('h3'),button=node('button','update-title',item.title||summary(item));button.type='button';button.setAttribute('aria-haspopup',modalSupported?'dialog':'true');button.onclick=function(){open(item,card,button)};title.appendChild(button);
   card.append(meta,title,node('p','update-copy',summary(item)));
   if(extra(item)){var detail=node('button','update-detail','查看詳情 ↗');detail.type='button';detail.onclick=function(){open(item,card,detail)};card.appendChild(detail)}
   card.addEventListener('click',function(e){if(!e.target.closest('button,a,.update-inline'))open(item,card,button)});
   list.appendChild(card);
  });
  status.textContent=shown.length?'顯示 '+shown.length+' 則更新'+(!modalSupported?'｜此瀏覽器以原地展開顯示公告':''):'此分類尚無更新';
  filters.forEach(function(button){button.setAttribute('aria-pressed',String(button.dataset.updateFilter===selected))});
 }
 filters.forEach(function(button){button.addEventListener('click',function(){selected=button.dataset.updateFilter;render()})});
 fetch('/updates.json',{cache:'no-cache'}).then(function(response){if(!response.ok)throw Error();return response.json()}).then(function(data){
  if(!Array.isArray(data))throw Error();
  items=data.filter(function(item){return item&&/^\d{4}-\d{2}-\d{2}$/.test(item.date)&&categories.includes(item.category)&&typeof item.content==='string'}).sort(function(a,b){return b.date.localeCompare(a.date)});render();
 }).catch(function(){status.textContent='更新日誌暫時無法載入，請重新整理。'});
})();
