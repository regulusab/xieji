/* 協紀擇日：事項規則與區間擇吉。事項表為本站初稿（企劃第四節），條目出處均「來源待核」。
   評分透明：每個候選日列出加分、扣分、排除原因。一般模式只顯示等級，專業模式可展開分數。 */
(function(root){
'use strict';
var C=root.XiejiCal||require('./cal.js');
var E=root.XiejiEngine||require('./engine.js');
var DE=['tiande','yuede','tiandehe','yuedehe','tianshe'];
var RESOLVABLE=['yueyan','jiesha','zaisha','yuesha','tiangang','hekui','yuexing','xiaohao','tufu','guiji'];
var ALWAYS_EXCLUDE=['yuepo','suipo','sili','sijue','yanggong'];
var EVENTS={
  dinghun:{name:'訂婚', roles:['男方','女方'], good:['tiande','yuede','tiandehe','yuedehe','tianxi','tianshe','tianen','yueen'], jcGood:['成','定','開'], jcBad:['破','閉','建'], bad:['shousi','yueyan','sanniang','chongsang','yuesha','jiesha','zaisha']},
  jiaqu:{name:'嫁娶', roles:['新郎','新娘'], good:['tiande','yuede','tiandehe','yuedehe','tianxi','tianshe','tianen','yueen','muchang'], jcGood:['成','定','開'], jcBad:['破','閉','建','收'], bad:['shousi','yueyan','sanniang','chongsang','yuesha','jiesha','zaisha','guiji']},
  kaishi:{name:'開市', roles:['負責人'], good:['tiande','yuede','tiandehe','yuedehe','tianshe','tianen','yueen','muchang','yuekong'], jcGood:['成','滿','開','定'], jcBad:['破','閉','收'], bad:['xiaohao','shousi','yuesha','jiesha','zaisha','sifei']},
  qianyue:{name:'簽約', roles:['簽約人'], good:['tiande','yuede','tiandehe','yuedehe','tianshe','tianen','yueen'], jcGood:['成','定','開','執'], jcBad:['破','閉'], bad:['xiaohao','shousi','yuesha','sifei']},
  ruzhai:{name:'入宅', roles:['宅主'], good:['tiande','yuede','tiandehe','yuedehe','tianshe','tianen','muchang','yueen'], jcGood:['成','開','定','滿'], jcBad:['破','閉','收','建'], bad:['guiji','wangwang','shousi','yuesha','jiesha','zaisha','sifei']},
  yixi:{name:'移徙', roles:['遷居者'], good:['tiande','yuede','tiandehe','yuedehe','tianshe','tianen','yima','tianma'], jcGood:['成','開','定'], jcBad:['破','閉'], bad:['guiji','wangwang','shousi','yuesha','sifei']},
  dongtu:{name:'動土', roles:['主事者'], good:['tiande','yuede','tiandehe','yuedehe','tianshe','yueen'], jcGood:['成','開','定','除'], jcBad:['破','建','閉'], bad:['tufu','yuesha','jiesha','zaisha','yueyan','sifei','shousi']},
  xiuzao:{name:'修造', roles:['宅主'], good:['tiande','yuede','tiandehe','yuedehe','tianshe','yueen'], jcGood:['成','開','定','滿'], jcBad:['破','建','閉'], bad:['tufu','yuesha','jiesha','zaisha','yueyan','sifei']},
  anchuang:{name:'安床', roles:['使用者'], good:['tiande','yuede','tiandehe','yuedehe','tianxi','tianen'], jcGood:['成','開','定','危'], jcBad:['破','閉'], bad:['yueyan','shousi','yuesha','sifei']},
  anzang:{name:'安葬', roles:['亡者','主家'], good:['tiande','yuede','tiandehe','yuedehe','tianshe','tianen'], jcGood:['成','開','除','執'], jcBad:['破','建'], bad:['chongsang','yuesha','jiesha','zaisha','tiangang','hekui','sifei'], exclude:['chongsang']},
  chuxing:{name:'出行', roles:['出行者'], good:['tiande','yuede','tiandehe','yuedehe','yima','tianma','tianen'], jcGood:['成','開','定'], jcBad:['破','閉','收'], bad:['guiji','yuesha','sifei','shousi'], exclude:['wangwang']},
  pouchan:{name:'剖腹生產擇時（只比較時辰命盤條件）', roles:['父親','母親'], good:['tiande','yuede','tianen'], jcGood:[], jcBad:[], bad:[], note:'只比較醫師可安排時段內的命盤條件（時辰沖父母本命、空亡等），不做健康判斷；以醫師安排為準。'}
};
function grade(s){ return s>=7?'大吉':s>=4?'吉':s>=0?'平':'不宜'; }
/* person: {label, pillars:{year,day}} */
function evalDay(dres, evKey, people, opts){
  var ev=EVENTS[evKey], plus=[], minus=[], excl=[], s=0, i;
  var ids={}; dres.good.concat(dres.bad).forEach(function(r){ ids[r.id]=r; });
  var hasDe=DE.some(function(id){ return ids[id]; });
  ALWAYS_EXCLUDE.concat(ev.exclude||[]).forEach(function(id){ if(ids[id]) excl.push({t:ids[id].name+'（大忌）', src:ids[id].src}); });
  ev.good.forEach(function(id){ var r=ids[id]; if(r){ s+=r.grade; plus.push({t:r.name, v:r.grade, src:r.src}); } });
  ev.bad.forEach(function(id){ var r=ids[id]; if(!r||ALWAYS_EXCLUDE.indexOf(id)>=0||(ev.exclude||[]).indexOf(id)>=0) return;
    if(hasDe && RESOLVABLE.indexOf(id)>=0){ minus.push({t:r.name+'（逢德神化解，不扣分）', v:0, src:r.src+'；德能化煞（來源待核）'}); return; }
    var v=r.grade===3?3:r.grade===2?2:1; s-=v; minus.push({t:r.name, v:-v, src:r.src}); });
  var jc=dres.jianchu.name;
  if(ev.jcGood.indexOf(jc)>=0){ s+=2; plus.push({t:'建除：'+jc+'日', v:2, src:'建除十二神（本站事項表，來源待核）'}); }
  if(ev.jcBad.indexOf(jc)>=0){ s-=2; minus.push({t:'建除：'+jc+'日', v:-2, src:'建除十二神（本站事項表，來源待核）'}); }
  if(dres.huangdao.yellow){ s+=1; plus.push({t:'黃道：'+dres.huangdao.name, v:1, src:'黃道黑道十二神'}); } else { s-=1; minus.push({t:'黑道：'+dres.huangdao.name, v:-1, src:'黃道黑道十二神'}); }
  if(dres.xiu.luck==='吉'){ s+=1; plus.push({t:'二十八宿：'+dres.xiu.name+'（吉）', v:1, src:'二十八宿值日（來源待核）'}); } else { s-=1; minus.push({t:'二十八宿：'+dres.xiu.name+'（凶）', v:-1, src:'二十八宿值日（來源待核）'}); }
  (people||[]).forEach(function(p){
    if(!p||!p.pillars) return;
    var dz=dres.info.day[1];
    if(E.CHONG(p.pillars.year[1])===dz) excl.push({t:'日支沖'+p.label+'生肖（'+p.pillars.year[1]+'）', src:'沖本命（避生肖沖）'});
    if(E.CHONG(p.pillars.day[1])===dz){ s-=3; minus.push({t:'日支沖'+p.label+'日柱（'+p.pillars.day+'）', v:-3, src:'沖本命日柱'}); }
    if(p.pillars.day===dres.info.day){ /* 伏吟，不加減，列出 */ minus.push({t:'日柱與'+p.label+'日柱相同（伏吟，僅列出）', v:0, src:'伏吟'}); }
  });
  var hs=dres.hours.map(function(h){
    var bad=h.po, why=h.tags.slice();
    (people||[]).forEach(function(p){ if(p&&p.pillars&&E.CHONG(p.pillars.year[1])===h.zhi){ bad=true; why.push({t:'時沖'+p.label+'生肖', good:false}); } });
    return {h:h, ok:!bad, score:h.score, why:why};
  }).filter(function(x){ return x.ok; }).sort(function(a,b){ return b.score-a.score || a.h.from-b.h.from; });
  return {score:s, grade:excl.length?'不取':grade(s), excluded:excl.length>0, plus:plus, minus:minus, excl:excl, bestHours:hs.slice(0,3)};
}
function search(q){
  /* q: {event, from:'YYYY-MM-DD', to, lon, zi, people:[...], includeExcluded} */
  var a=C.parseYmd(q.from), b=C.parseYmd(q.to), d0=C.dayNum(a.y,a.m,a.d), d1=C.dayNum(b.y,b.m,b.d), out=[], dn, p, r, e;
  if(d1<d0){ var t=d0; d0=d1; d1=t; }
  if(d1-d0>366*3) throw new Error('日期範圍請在三年以內');
  for(dn=d0; dn<=d1; dn++){
    p=C.parseYmd(C.ymdOf(dn));
    r=E.day(p.y,p.m,p.d,q.lon,{zi:q.zi});
    e=evalDay(r, q.event, q.people, q);
    if(e.excluded && !q.includeExcluded) continue;
    out.push({ymd:r.info.ymd, day:r, ev:e});
  }
  out.sort(function(x,y){ return (x.ev.excluded-y.ev.excluded) || (y.ev.score-x.ev.score) || (x.ymd<y.ymd?-1:1); });
  return out;
}
function personFrom(label, ymd, hm, lon, zi){
  var p=C.parseYmd(ymd), t=String(hm||'12:00').split(':').map(Number);
  return {label:label, ymd:ymd, hm:hm, lon:lon, pillars:C.pillars(p.y,p.m,p.d,t[0],t[1]||0,lon,{zi:zi})};
}
var api={EVENTS:EVENTS, evalDay:evalDay, search:search, grade:grade, personFrom:personFrom, ALWAYS_EXCLUDE:ALWAYS_EXCLUDE, RESOLVABLE:RESOLVABLE};
root.XiejiSearch=api;
if(typeof module!=='undefined') module.exports=api;
})(typeof window!=='undefined'?window:global);
