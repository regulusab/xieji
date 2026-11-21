/* 協紀擇日：介面 */
(function(){
'use strict';
var C=XiejiCal, R=XiejiRules, E=XiejiEngine, S=XiejiSearch, P=XiejiPlaces;
var $=function(id){ return document.getElementById(id); };
function esc(t){ return String(t==null?'':t).replace(/[&<>"']/g,function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
var PEND='<span class="pend" title="尚未逐字核對原典">來源待核</span>';
var WEEK='日一二三四五六';
var st={tab:'day', place:'taipei', lon:121.57, zi:'0', mode:'basic', d:'', ym:'', monEv:'', ev:'jiaqu', from:'', to:'', people:[], showEx:false};
function todayYmd(){ var t=new Date(); return t.getFullYear()+'-'+String(t.getMonth()+1).padStart(2,'0')+'-'+String(t.getDate()).padStart(2,'0'); }
function addDays(ymd,n){ return C.ymdOf(C.dayNum.apply(null, ymd.split('-').map(Number))+n); }
function lon(){ return st.lon; }
function src(r){ return esc(r.src||'')+(r.verified?'':' '+PEND); }

/* ---------- URL ---------- */
function readUrl(){
  var q=new URLSearchParams(location.search);
  ['tab','place','zi','mode','d','ym','ev','from','to'].forEach(function(k){ if(q.get(k)) st[k]=q.get(k); });
  if(q.get('monEv')!=null) st.monEv=q.get('monEv');
  if(q.get('lon')!=null && q.get('lon')!=='' && !isNaN(+q.get('lon'))) st.lon=+q.get('lon');
  else { var p=P.filter(function(x){ return x.id===st.place; })[0]; if(p&&p.lon!=null) st.lon=p.lon; }
  if(q.get('p')) st.people=q.get('p').split('|').map(function(s){ var a=s.split('_'); return {ymd:a[0]||'', hm:a[1]||'', lon:a[2]||''}; });
  if(q.get('ex')==='1') st.showEx=true;
}
function writeUrl(){
  var q=new URLSearchParams();
  q.set('tab',st.tab); q.set('place',st.place); q.set('lon',st.lon); if(st.zi!=='0') q.set('zi',st.zi); if(st.mode!=='basic') q.set('mode',st.mode);
  if(st.tab==='day') q.set('d',st.d);
  if(st.tab==='month'){ q.set('ym',st.ym); if(st.monEv) q.set('monEv',st.monEv); }
  if(st.tab==='search'){ q.set('ev',st.ev); q.set('from',st.from); q.set('to',st.to); if(st.showEx) q.set('ex','1');
    var ps=st.people.filter(function(p){ return p.ymd; }).map(function(p){ return [p.ymd,p.hm||'',p.lon===''?'':p.lon].join('_'); });
    if(ps.length) q.set('p', ps.join('|')); }
  history.replaceState(null,'','?'+q.toString());
}

/* ---------- settings ---------- */
function initSettings(){
  $('place').innerHTML=P.map(function(p){ return '<option value="'+p.id+'">'+esc(p.name)+(p.lon!=null?'（'+p.lon+'）':'')+'</option>'; }).join('');
  $('place').value=st.place; $('lon').value=st.lon; $('zi').value=st.zi; $('mode').value=st.mode;
  $('place').onchange=function(){ st.place=this.value; var p=P.filter(function(x){ return x.id===st.place; })[0]; if(p&&p.lon!=null){ st.lon=p.lon; $('lon').value=p.lon; } render(); };
  $('lon').onchange=function(){ var v=parseFloat(this.value); if(isNaN(v)||v<-180||v>180){ this.value=st.lon; return; } st.lon=v; st.place='custom'; $('place').value='custom'; render(); };
  $('zi').onchange=function(){ st.zi=this.value; render(); };
  $('mode').onchange=function(){ st.mode=this.value; render(); };
  Array.prototype.forEach.call(document.querySelectorAll('#tabs button'), function(b){ b.onclick=function(){ st.tab=b.dataset.tab; render(); }; });
}

/* ---------- day page ---------- */
function starTxt(n){ return E.STAR_NAME[n]+E.STAR_ELEM[n]; }
function lunarTxt(L){ return L.text||''; }
function dayCard(r){
  var i=r.info, lunar=i.lunar, h=[];
  var hp=C.pillars(i.y,i.m,i.d,12,0,lon(),{zi:st.zi});
  h.push('<div class="card"><h2>'+esc(i.ymd)+'（星期'+WEEK[i.weekday]+'）</h2>');
  h.push('<div class="grid"><div><div class="kv">');
  h.push('<b>農曆</b><span>'+esc(lunarTxt(lunar))+'</span>');
  h.push('<b>日家干支</b><span>'+esc(i.year)+'年 '+esc(i.month)+'月 '+esc(i.day)+'日</span>');
  if(i.jieqiToday.length) h.push('<b>今日節氣</b><span>'+i.jieqiToday.map(function(x){ return esc(x.name)+' '+esc(C.stamp(x.ms).slice(11))+'（地方平時）'; }).join('、')+'</span>');
  var nx=C.nextJieqi(Date.UTC(i.y,i.m-1,i.d,0,0), i.y, i.lon); if(nx) h.push('<b>下一節氣</b><span>'+esc(nx.name)+' '+esc(C.stamp(nx.ms))+'</span>');
  h.push('<b>建除</b><span><span class="tag '+(r.jianchu.good?'g':'b')+'">'+esc(r.jianchu.name)+'日</span></span>');
  h.push('<b>黃黑道</b><span><span class="tag '+(r.huangdao.yellow?'g':'b')+'">'+esc(r.huangdao.name)+(r.huangdao.yellow?'（黃道）':'（黑道）')+'</span></span>');
  h.push('<b>二十八宿</b><span><span class="tag '+(r.xiu.luck==='吉'?'g':'b')+'">'+esc(r.xiu.name)+'宿（'+r.xiu.luck+'）</span></span>');
  h.push('<b>紫白九星</b><span>年 '+starTxt(r.stars.year)+'・月 '+starTxt(r.stars.month)+'・日 '+starTxt(r.stars.day)+'（'+(r.stars.yang?'陽遁':'陰遁')+'）</span>');
  h.push('<b>沖煞</b><span>沖'+esc(r.chong.shengxiao)+'（'+esc(r.chong.zhi)+'）・煞'+esc(r.chong.sha)+'</span>');
  h.push('<b>旬空</b><span>'+esc(r.xunkong)+'</span>');
  h.push('<b>彭祖百忌</b><span>'+esc(r.pengzu)+'</span>');
  h.push('<b>胎神占方</b><span>'+esc(r.taishen)+'</span>');
  h.push('</div></div><div>');
  h.push('<h3>吉神</h3><div>'+(r.good.length? r.good.map(function(x){ return '<span class="tag g" title="'+esc(x.src)+'">'+esc(x.name)+'</span>'; }).join(''):'<span class="sub">（本站所列吉神本日未值）</span>')+'</div>');
  h.push('<h3>凶煞</h3><div>'+(r.bad.length? r.bad.map(function(x){ return '<span class="tag b" title="'+esc(x.src)+'">'+esc(x.name)+'</span>'; }).join(''):'<span class="sub">（本站所列凶煞本日未值）</span>')+'</div>');
  h.push('<h3>中午 12:00 四柱</h3><div class="pillars">'+[['年',hp.year],['月',hp.month],['日',hp.day],['時',hp.hour]].map(function(x){ return '<div><small>'+x[0]+'</small><b>'+esc(x[1])+'</b></div>'; }).join('')+'</div>');
  h.push('</div></div>');
  var notes=[];
  if(i.west) notes.push(C.WEST_TEXT+'：本日原日期干支為 '+esc(i.rawDay)+'，日柱用 '+esc(i.day)+'；建除、黃黑道、神煞、紫白等以日柱干支起算者隨之，農曆、節氣、二十八宿依日期不動。');
  notes.push('節氣、合朔換算為經度 '+esc(i.lon)+'° 的地方平時（世界時＋經度×4 分鐘，不含夏令）。'+esc(lunar.note||''));
  if(i.y<1929) notes.push('1929 年以前的節氣資料源以北京地方時刊印，換算可能與當時鐘點差約 14 分鐘。');
  h.push('<div class="note">'+notes.join('<br>')+'</div>');
  if(st.mode==='pro'){
    h.push('<details><summary>神煞出處（專業模式）</summary><table><tr><th>神煞</th><th>出處</th><th>備註</th></tr>'+r.good.concat(r.bad).map(function(x){ return '<tr><td>'+esc(x.name)+'</td><td>'+src(x)+'</td><td>'+esc(x.note||'')+'</td></tr>'; }).join('')+'</table></details>');
  }
  h.push('</div>');
  return h.join('');
}
function hourTable(r){
  var h=['<div class="card"><h2>吉時表</h2><table><tr><th>時辰</th><th>地方平時</th><th>干支</th><th>黃黑道</th><th>時家紫白</th><th>吉凶神</th><th>沖</th>'+(st.mode==='pro'?'<th>分</th>':'')+'</tr>'];
  r.hours.forEach(function(x){
    var t=(x.late?'晚子 ':'')+String(x.from).padStart(2,'0')+':00–'+String(x.to%24===0&&x.to?24:x.to).padStart(2,'0')+':00';
    h.push('<tr><td>'+esc(x.zhi)+'時'+(x.late?'（晚子）':'')+'</td><td>'+t+'</td><td><b>'+esc(x.gz)+'</b></td><td>'+esc(x.huangdao.name)+'</td><td>'+starTxt(x.star)+'</td><td style="text-align:left">'+
      x.tags.map(function(g){ return '<span class="tag '+(g.good?'g':'b')+'" title="'+esc(g.src||'')+'">'+esc(g.t)+'</span>'; }).join('')+'</td><td>沖'+esc(x.chong)+'</td>'+(st.mode==='pro'?'<td>'+x.score+'</td>':'')+'</tr>');
  });
  h.push('</table><p class="cite">子時換日：'+(st.zi==='0'?'0:00（23:00–24:00 為晚子時，日柱不換，時干依次日日干五鼠遁）':'23:00（23:00 起日柱換為次日）')+'。時家黃道以日支起青龍；日祿、天乙貴人、截路空亡、五不遇時各家說法不一，均'+PEND+'。</p></div>');
  return h.join('');
}
function renderDay(){
  if(!st.d) st.d=todayYmd(); $('dayDate').value=st.d;
  var p=C.parseYmd(st.d);
  try{ var r=E.day(p.y,p.m,p.d,lon(),{zi:st.zi}); $('dayOut').innerHTML=dayCard(r)+hourTable(r); }
  catch(e){ $('dayOut').innerHTML='<div class="err">無法計算：'+esc(e.message||e)+'（支援 1900–2100 年）</div>'; }
}

/* ---------- month ---------- */
function renderMonth(){
  if(!st.ym) st.ym=(st.d||todayYmd()).slice(0,7); $('monthYm').value=st.ym; $('monEvent').value=st.monEv;
  var y=+st.ym.slice(0,4), m=+st.ym.slice(5,7), first=C.dayNum(y,m,1), days=new Date(Date.UTC(y,m,0)).getUTCDate(), wd=new Date(first*C.D).getUTCDay(), today=todayYmd();
  var h=['<div class="card"><h2>'+y+' 年 '+m+' 月</h2><div class="cal">'];
  for(var k=0;k<7;k++) h.push('<div class="h">'+WEEK[k]+'</div>');
  for(k=0;k<wd;k++) h.push('<div></div>');
  try{
    for(var d=1; d<=days; d++){
      var r=E.day(y,m,d,lon(),{zi:st.zi}), i=r.info, cls='c '+(r.huangdao.yellow?'y':'k'), mark='';
      if(st.monEv){ var e=S.evalDay(r, st.monEv, [], {}); if(e.excluded) cls+=' ex'; mark='<div><span class="gr '+e.grade+'">'+e.grade+'</span>'+(st.mode==='pro'&&!e.excluded?' '+e.score:'')+'</div>'; }
      if(i.ymd===today) cls+=' today';
      var ld=i.lunar.day===1? (i.lunar.leap?'閏':'')+['','正','二','三','四','五','六','七','八','九','十','冬','臘'][i.lunar.month]+'月' : ['','初一','初二','初三','初四','初五','初六','初七','初八','初九','初十','十一','十二','十三','十四','十五','十六','十七','十八','十九','二十','廿一','廿二','廿三','廿四','廿五','廿六','廿七','廿八','廿九','三十'][i.lunar.day];
      h.push('<div class="'+cls+'" data-d="'+i.ymd+'"><div class="n">'+d+'</div><div>'+esc(ld)+'</div><div>'+esc(i.day)+' '+esc(r.jianchu.name)+'</div><div class="hd">'+esc(r.huangdao.name)+'</div>'+
        (i.jieqiToday.length?'<div>'+esc(i.jieqiToday.map(function(x){return x.name;}).join(' '))+'</div>':'')+mark+'</div>');
    }
  }catch(e){ h.push('<div class="err">無法計算：'+esc(e.message||e)+'</div>'); }
  h.push('</div><p class="cite">綠字為黃道日。點日期可看日頁與吉時表。'+(st.monEv?'事項標示只用日家神煞（未含相關人），完整條件請用「擇吉搜尋」。':'')+'</p></div>');
  $('monthOut').innerHTML=h.join('');
  Array.prototype.forEach.call(document.querySelectorAll('.cal .c'), function(c){ c.onclick=function(){ st.d=c.dataset.d; st.tab='day'; render(); }; });
}

/* ---------- search ---------- */
function peopleForm(){
  var ev=S.EVENTS[st.ev], roles=ev.roles;
  while(st.people.length<roles.length) st.people.push({ymd:'',hm:'',lon:''});
  st.people=st.people.slice(0,roles.length);
  $('evNote').textContent=ev.note||'';
  $('people').innerHTML=roles.map(function(role,k){ var p=st.people[k];
    return '<div class="form" data-k="'+k+'"><label>'+esc(role)+' 生日<input type="date" data-f="ymd" value="'+esc(p.ymd)+'"></label><label>時刻<input type="time" data-f="hm" value="'+esc(p.hm)+'"></label><label>出生地經度<input type="number" step="0.01" data-f="lon" value="'+esc(p.lon)+'" placeholder="同上方地點" style="width:8em"></label><span class="sub" data-out="'+k+'"></span></div>'; }).join('');
  Array.prototype.forEach.call(document.querySelectorAll('#people input'), function(inp){
    inp.onchange=function(){ var k=+inp.closest('[data-k]').dataset.k; st.people[k][inp.dataset.f]=inp.value; showPeople(); writeUrl(); };
  });
  showPeople();
}
function persons(){
  var roles=S.EVENTS[st.ev].roles;
  return st.people.map(function(p,k){ if(!p.ymd) return null; var l=p.lon===''||isNaN(+p.lon)? lon() : +p.lon;
    try{ return S.personFrom(roles[k], p.ymd, p.hm||'12:00', l, st.zi); }catch(e){ return null; } });
}
function showPeople(){
  persons().forEach(function(p,k){ var el=document.querySelector('[data-out="'+k+'"]'); if(!el) return;
    el.textContent=p? '四柱 '+p.pillars.year+' '+p.pillars.month+' '+p.pillars.day+' '+p.pillars.hour+'（生肖'+E.SHENGXIAO[C.ZHI.indexOf(p.pillars.year[1])]+'）'+(st.people[k].hm?'':'・未填時刻，以 12:00 計，只用年日柱') : ''; });
}
var lastResults=[];
function runSearch(){
  var out=$('searchOut');
  try{
    var t0=Date.now();
    var res=S.search({event:st.ev, from:st.from, to:st.to, lon:lon(), zi:st.zi, people:persons().filter(Boolean), includeExcluded:st.showEx});
    lastResults=res;
    var ev=S.EVENTS[st.ev], h=['<div class="card"><h2>'+esc(ev.name)+'：'+esc(st.from)+' 至 '+esc(st.to)+'</h2>'];
    h.push('<div class="form"><button id="share">複製分享連結</button><button id="ics">匯出 iCal（前 10 日）</button><button onclick="window.print()">列印</button><span class="sub">共 '+res.length+' 日，計算 '+(Date.now()-t0)+' 毫秒</span></div>');
    if(!res.length) h.push('<p>範圍內沒有可取的日子，請放寬日期範圍。</p>');
    res.slice(0,60).forEach(function(x){
      var e=x.ev, i=x.day.info;
      h.push('<div class="res"><div><span class="gr '+e.grade+'">'+e.grade+'</span> <b>'+esc(x.ymd)+'</b>（'+WEEK[i.weekday]+'）'+esc(i.lunar.text||'')+'・'+esc(i.day)+'日・'+esc(x.day.jianchu.name)+'・'+esc(x.day.huangdao.name)+(st.mode==='pro'?'・<b>'+e.score+' 分</b>':'')+'</div>');
      if(e.bestHours.length) h.push('<div class="sub">建議時辰：'+e.bestHours.map(function(b){ return esc(b.h.gz)+'（'+(b.h.late?'晚子 23–24':String(b.h.from).padStart(2,'0')+'–'+String(b.h.to).padStart(2,'0'))+'）'; }).join('、')+'</div>');
      h.push('<details><summary>理由</summary><ul>'+
        e.excl.map(function(r){ return '<li><span class="tag b">排除</span>'+esc(r.t)+' <span class="cite">'+esc(r.src)+'</span></li>'; }).join('')+
        e.plus.map(function(r){ return '<li><span class="tag g">＋'+(st.mode==='pro'?r.v:'')+'</span>'+esc(r.t)+' <span class="cite">'+esc(r.src)+'</span></li>'; }).join('')+
        e.minus.map(function(r){ return '<li><span class="tag b">－'+(st.mode==='pro'?Math.abs(r.v):'')+'</span>'+esc(r.t)+' <span class="cite">'+esc(r.src)+'</span></li>'; }).join('')+
        e.bestHours.map(function(b){ return '<li>時辰 '+esc(b.h.gz)+'：'+b.why.map(function(w){ return esc(w.t); }).join('、')+'</li>'; }).join('')+
        '</ul></details></div>');
    });
    h.push('<p class="cite">評分：事項宜取神煞依等級加分，建除、黃黑道、二十八宿各加減，月破、歲破、四離、四絕、楊公忌日與沖相關人生肖一律不取；德神可化解部分月家凶煞。事項表為本站初稿，'+PEND+'。等級：大吉 ≥7、吉 4–6、平 0–3、不宜 &lt;0。</p></div>');
    out.innerHTML=h.join('');
    $('share').onclick=function(){ writeUrl(); var u=location.href; if(navigator.clipboard) navigator.clipboard.writeText(u); this.textContent='已複製'; };
    $('ics').onclick=exportIcs;
  }catch(e){ out.innerHTML='<div class="err">'+esc(e.message||e)+'</div>'; }
}
function exportIcs(){
  var ev=S.EVENTS[st.ev], lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//xieji//zeri//ZH','CALSCALE:GREGORIAN'];
  lastResults.filter(function(x){ return !x.ev.excluded; }).slice(0,10).forEach(function(x,k){
    var d=x.ymd.replace(/-/g,''), nd=addDays(x.ymd,1).replace(/-/g,'');
    var desc=x.ev.grade+'；'+x.day.info.day+'日；建議時辰：'+x.ev.bestHours.map(function(b){ return b.h.gz; }).join('、')+'（地方平時）';
    lines.push('BEGIN:VEVENT','UID:xieji-'+d+'-'+k+'@regulusab.github.io','DTSTAMP:'+new Date().toISOString().replace(/[-:]/g,'').slice(0,15)+'Z','DTSTART;VALUE=DATE:'+d,'DTEND;VALUE=DATE:'+nd,'SUMMARY:'+ev.name+' 候選日（'+x.ev.grade+'）','DESCRIPTION:'+desc.replace(/[,;]/g,' '),'END:VEVENT');
  });
  lines.push('END:VCALENDAR');
  var a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([lines.join('\r\n')],{type:'text/calendar'})); a.download='xieji-'+st.ev+'.ics'; a.click();
}
function renderSearch(){
  $('ev').innerHTML=Object.keys(S.EVENTS).map(function(k){ return '<option value="'+k+'">'+esc(S.EVENTS[k].name)+'</option>'; }).join('');
  $('ev').value=st.ev; if(!st.from) st.from=todayYmd(); if(!st.to) st.to=addDays(st.from,90);
  $('from').value=st.from; $('to').value=st.to; $('showEx').checked=st.showEx;
  peopleForm();
}
var DEMO={jiaqu:[['1992-03-08','10:20',121.57],['1994-11-21','15:40',120.68]], dinghun:[['1992-03-08','10:20',121.57],['1994-11-21','15:40',120.68]], anzang:[['1931-05-02','06:10',121.57],['1960-09-14','21:30',121.57]], pouchan:[['1990-06-15','08:30',121.57],['1992-12-03','19:05',120.31]]};
function demo(){ var d=DEMO[st.ev]||[['1988-06-15','09:30',121.57]]; st.people=d.map(function(x){ return {ymd:x[0], hm:x[1], lon:x[2]}; }); peopleForm(); writeUrl(); }

/* ---------- saved ---------- */
var KEY='xieji-saved-v1';
function loadSaved(){ try{ return JSON.parse(localStorage.getItem(KEY)||'[]'); }catch(e){ return []; } }
function storeSaved(a){ try{ localStorage.setItem(KEY, JSON.stringify(a)); }catch(e){} }
function renderSaved(){
  var a=loadSaved();
  $('savedOut').innerHTML=a.length? '<table><tr><th>名稱</th><th>事項</th><th>範圍</th><th>地點經度</th><th></th></tr>'+a.map(function(s,k){
    return '<tr><td>'+esc(s.name)+'</td><td>'+esc((S.EVENTS[s.ev]||{}).name||s.ev)+'</td><td>'+esc(s.from)+'～'+esc(s.to)+'</td><td>'+esc(s.lon)+'</td><td><button data-load="'+k+'">載入</button> <button data-del="'+k+'">刪除</button></td></tr>'; }).join('')+'</table>' : '<p class="sub">尚無存檔。</p>';
  Array.prototype.forEach.call(document.querySelectorAll('[data-load]'), function(b){ b.onclick=function(){ var s=loadSaved()[+b.dataset.load]; ['ev','from','to','place','lon','zi'].forEach(function(k){ if(s[k]!=null) st[k]=s[k]; }); st.people=s.people||[]; st.tab='search'; $('place').value=st.place; $('lon').value=st.lon; $('zi').value=st.zi; render(); }; });
  Array.prototype.forEach.call(document.querySelectorAll('[data-del]'), function(b){ b.onclick=function(){ var a=loadSaved(); a.splice(+b.dataset.del,1); storeSaved(a); renderSaved(); }; });
}

/* ---------- library ---------- */
function renderLib(){
  var h=[];
  h.push('<div class="card"><h2>曆法基準（依老師裁定）</h2><ul>'+
    '<li>時間一律用「地方平時」：請自行換算後輸入（含去除夏令時間），本站照寫使用，不做時辰邊界警告；時刻誤差由輸入者自行吸收。</li>'+
    '<li>交節氣時刻、合朔時刻都換算為該地經度的地方平時：世界時＋經度×4 分鐘，不含夏令。</li>'+
    '<li>農曆以當地地方平時的合朔所在日為初一；月序、閏月依中國農曆。農曆日一律重算，不是把日期「挪一天」。</li>'+
    '<li>'+C.WEST_TEXT+'：只有日柱干支進一位，時干依五鼠遁重推；年、月柱仍以原地方平時對當地節氣。例：西經 122.68°，2026-10-07 22:10 為丙午 丁酉 乙卯 丁亥。</li>'+
    '<li>子時換日預設 0:00；可在上方改為 23:00。</li>'+
    '<li>日家建除、神煞以「交節當日起用新月」（通書慣例'+PEND+'）；時刻四柱以交節時刻為準。</li>'+
    '<li>合朔表：DE440s，1899–2101；節氣：lunar-javascript（東八區印記，世界時＝印記−8 小時）。1929 年以前約有 14 分鐘差。</li></ul></div>');
  h.push('<div class="card"><h2>建除十二神</h2><p>'+esc(R.jianchu.rule)+'</p><p class="cite">'+src(R.jianchu)+'</p>');
  h.push('<h2 style="margin-top:12px">黃道黑道十二神</h2><p>'+esc(R.huangdao.rule)+' 黃道：青龍、明堂、金匱、天德、玉堂、司命。</p><p class="cite">'+src(R.huangdao)+'</p>');
  h.push('<h2 style="margin-top:12px">二十八宿</h2><p class="cite">'+esc(R.xiu.src)+' '+PEND+'</p>');
  h.push('<h2 style="margin-top:12px">紫白九星</h2><p>年星依三元（2026 丙午年一白）；月星：子午卯酉年正月八白、辰戌丑未年正月五黃、寅申巳亥年正月二黑，逐月逆行；日星：冬至前後最近之甲子日起一白順行，夏至前後最近之甲子日起九紫逆行；時星：陽遁子午卯酉日子時一白、辰戌丑未日四綠、寅申巳亥日七赤順行，陰遁九紫、六白、三碧逆行。</p><p class="cite">'+esc('《協紀辨方書》')+' '+PEND+'；日家起遁法（置閏與否）待第二期再議。</p></div>');
  h.push('<div class="card"><h2>神煞表（'+R.shensha.length+' 條）</h2><table><tr><th>名稱</th><th>吉凶</th><th>等級</th><th>查法</th><th>出處</th><th>備註</th></tr>'+
    R.shensha.map(function(r){ var tbl=typeof r.table==='string'? R.months.split('').map(function(m,k){ return m+'月'+(r.table[k]==='-'?'無':r.table[k]); }).join(' ') : (r.terms? r.terms.join('、')+' 前一日' : (r.type==='yearClash'?'日支沖年支':'見程式資料表'));
      return '<tr><td>'+esc(r.name)+'</td><td>'+(r.good?'吉':'凶')+'</td><td>'+r.grade+'</td><td style="text-align:left;font-size:.85em">'+esc(tbl)+'</td><td style="text-align:left">'+src(r)+'</td><td style="text-align:left">'+esc(r.note||'')+'</td></tr>'; }).join('')+'</table></div>');
  h.push('<div class="card"><h2>事項規則表（本站初稿）</h2><table><tr><th>事項</th><th>宜取</th><th>建除宜</th><th>建除忌</th><th>扣分</th></tr>'+
    Object.keys(S.EVENTS).map(function(k){ var e=S.EVENTS[k], nm=function(ids){ return ids.map(function(id){ var r=R.shensha.filter(function(x){ return x.id===id; })[0]; return r?r.name:id; }).join('、'); };
      return '<tr><td>'+esc(e.name)+'</td><td>'+esc(nm(e.good))+'</td><td>'+esc(e.jcGood.join(''))+'</td><td>'+esc(e.jcBad.join(''))+'</td><td>'+esc(nm(e.bad))+'</td></tr>'; }).join('')+
    '</table><p class="cite">所有事項一律不取：月破、歲破、四離、四絕、楊公忌日、日支沖相關人生肖；安葬另不取重喪，出行另不取往亡。德神（天德、月德、天德合、月德合、天赦）可化解月厭、劫煞、災煞、月煞、天罡、河魁、月刑、小耗、土符、歸忌。'+PEND+'</p></div>');
  h.push('<div class="card"><h2>內容規範</h2><ul><li>引文標明出處；尚未逐字核對原典者標「來源待核」。</li><li>不大段抄錄現代書籍。</li><li>無廣告。</li><li>不做健康、壽命判斷；剖腹生產擇時只比較時辰命盤條件，以醫師安排為準。</li><li>示範命例全為虛構。</li><li>神煞以《協紀辨方書》月表為主要對照，並與開源曆法庫 lunar-javascript 的日神煞逐日比對（差異列於測試報告）。</li></ul></div>');
  $('libOut').innerHTML=h.join('');
}

/* ---------- main ---------- */
function render(){
  Array.prototype.forEach.call(document.querySelectorAll('#tabs button'), function(b){ b.classList.toggle('on', b.dataset.tab===st.tab); });
  ['day','month','search','saved','lib'].forEach(function(t){ $('tab-'+t).hidden=(t!==st.tab); });
  if(st.tab==='day') renderDay();
  if(st.tab==='month') renderMonth();
  if(st.tab==='search'){ renderSearch(); if(lastResults.length) runSearch(); }
  if(st.tab==='saved') renderSaved();
  if(st.tab==='lib') renderLib();
  writeUrl();
}
function wire(){
  $('dayDate').onchange=function(){ if(this.value){ st.d=this.value; render(); } };
  $('dayPrev').onclick=function(){ st.d=addDays(st.d,-1); render(); };
  $('dayNext').onclick=function(){ st.d=addDays(st.d,1); render(); };
  $('dayToday').onclick=function(){ st.d=todayYmd(); render(); };
  $('monthYm').onchange=function(){ if(this.value){ st.ym=this.value; render(); } };
  $('monPrev').onclick=function(){ var y=+st.ym.slice(0,4), m=+st.ym.slice(5,7)-1; if(m<1){ m=12; y--; } st.ym=y+'-'+String(m).padStart(2,'0'); render(); };
  $('monNext').onclick=function(){ var y=+st.ym.slice(0,4), m=+st.ym.slice(5,7)+1; if(m>12){ m=1; y++; } st.ym=y+'-'+String(m).padStart(2,'0'); render(); };
  $('monEvent').innerHTML='<option value="">（不標示）</option>'+Object.keys(S.EVENTS).filter(function(k){ return k!=='pouchan'; }).map(function(k){ return '<option value="'+k+'">'+esc(S.EVENTS[k].name)+'</option>'; }).join('');
  $('monEvent').onchange=function(){ st.monEv=this.value; render(); };
  $('ev').onchange=function(){ st.ev=this.value; lastResults=[]; $('searchOut').innerHTML=''; peopleForm(); writeUrl(); };
  $('from').onchange=function(){ st.from=this.value; writeUrl(); };
  $('to').onchange=function(){ st.to=this.value; writeUrl(); };
  $('showEx').onchange=function(){ st.showEx=this.checked; writeUrl(); };
  $('go').onclick=function(){ runSearch(); writeUrl(); };
  $('demo').onclick=demo;
  $('saveNow').onclick=function(){ var a=loadSaved(); a.push({name:$('saveName').value||('擇吉 '+st.from), ev:st.ev, from:st.from, to:st.to, place:st.place, lon:st.lon, zi:st.zi, people:st.people, savedAt:new Date().toISOString()}); storeSaved(a); $('saveName').value=''; renderSaved(); };
  $('exportJson').onclick=function(){ var a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([JSON.stringify(loadSaved(),null,1)],{type:'application/json'})); a.download='xieji-saved.json'; a.click(); };
  $('importJson').onchange=function(){ var f=this.files[0]; if(!f) return; f.text().then(function(t){ try{ var a=JSON.parse(t); if(Array.isArray(a)){ storeSaved(loadSaved().concat(a.filter(function(x){ return x&&x.ev&&x.from; }))); renderSaved(); } }catch(e){ alert('檔案格式不符'); } }); };
}
readUrl(); initSettings(); wire(); render();
if(st.tab==='search' && st.people.some(function(p){ return p.ymd; })) runSearch();
})();
