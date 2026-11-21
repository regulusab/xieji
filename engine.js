/* 協紀擇日：日家、時家計算（建除、黃黑道、神煞、二十八宿、紫白九星、沖煞、彭祖百忌、胎神、吉時）。
   凡以日柱干支起算者，用「東經 70° 以西日柱干支進一位（日期不動）」後的干支；
   以日期起算者（農曆月日、節氣前一日、七曜與二十八宿）用原日期。 */
(function(root){
'use strict';
var C=root.XiejiCal||require('./cal.js');
var R=root.XiejiRules||require('./rules.js');
var GAN=C.GAN, ZHI=C.ZHI, D=C.D;
var CHONG=function(z){ return ZHI[(ZHI.indexOf(z)+6)%12]; };
var SHENGXIAO='鼠牛虎兔龍蛇馬羊猴雞狗豬';
var STAR_NAME=['','一白','二黑','三碧','四綠','五黃','六白','七赤','八白','九紫'];
var STAR_ELEM=['','水','土','木','木','土','金','金','土','火'];
function mIdx(monthZhi){ return R.months.indexOf(monthZhi); }
function seasonOf(monthZhi){ return '寅卯辰'.indexOf(monthZhi)>=0?'春':'巳午未'.indexOf(monthZhi)>=0?'夏':'申酉戌'.indexOf(monthZhi)>=0?'秋':'冬'; }
function jianchu(monthZhi, dayZhi){ return R.jianchu.names[(ZHI.indexOf(dayZhi)-ZHI.indexOf(monthZhi)+12)%12]; }
function huangdao(baseZhi, zhi){
  var s=R.huangdao.start[baseZhi], n=R.huangdao.names[(ZHI.indexOf(zhi)-ZHI.indexOf(s)+12)%12];
  return {name:n, yellow:!!R.huangdao.yellow[n]};
}
/* 二十八宿：以 1970-01-01 起算之二十八日循環（依七曜循環推得，與 lunar-javascript 對照一致）。 */
var XIU_ANCHOR=7;
function xiu(dn){ var i=((dn+XIU_ANCHOR)%28+28)%28; return {name:R.xiu.names[i], luck:R.xiu.luck[i], index:i}; }
function xunKong(gz){ var i=C.jzIndex(gz), s=i-(i%10); return ZHI[(s+10)%12]+ZHI[(s+11)%12]; }
function yearStar(yearGZ, approxYear){
  var y=approxYear; for(var k=approxYear-1;k<=approxYear+1;k++) if(C.gzYear(k)===yearGZ) y=k;
  return ((2026-y)%9+9)%9+1;
}
function monthStar(yearGZ, monthZhi){
  var yz=yearGZ[1], first='子午卯酉'.indexOf(yz)>=0?8:'辰戌丑未'.indexOf(yz)>=0?5:2;
  return ((first-1-mIdx(monthZhi))%9+9)%9+1;
}
/* 日家紫白：冬至前後最近之甲子起一白順行，夏至前後最近之甲子起九紫逆行（以進位後日柱干支定甲子日）。 */
function solsticeAnchor(name, y, lon, west){
  var l=C.jieqiYear(y, lon).filter(function(x){ return x.name===name; });
  if(!l.length) return null;
  var dn=l[name==='冬至'?l.length-1:0].day, i=C.jzIndex(C.rawDayGZ.apply(null, ymdArr(dn)));
  if(west) i=(i+1)%60;
  return i>29? dn+(60-i) : dn-i;
}
function ymdArr(dn){ var d=new Date(dn*D); return [d.getUTCFullYear(), d.getUTCMonth()+1, d.getUTCDate()]; }
function dayStar(dn, lon, west){
  var y=new Date(dn*D).getUTCFullYear();
  var a0=solsticeAnchor('冬至', y-1, lon, west), x=solsticeAnchor('夏至', y, lon, west), a1=solsticeAnchor('冬至', y, lon, west);
  var off;
  if(dn>=a0 && dn<x) off=(dn-a0)%9;
  else if(dn>=x && dn<a1) off=8-((dn-x)%9);
  else if(dn>=a1) off=(dn-a1)%9;
  else off=(8+(a0-dn))%9;
  return {star:off+1, yang:!(dn>=x && dn<a1)};
}
function timeStar(dayZhi, hourZhi, yang){
  var z=ZHI.indexOf(dayZhi)%3, h=ZHI.indexOf(hourZhi);
  var off=yang?[0,3,6][z]:[8,5,2][z];
  return (yang? (off+h) : (off+9-h))%9+1;
}
/* 時家紫白：冬至（當地地方平時日）至夏至前用陽遁，夏至至冬至前用陰遁。 */
function timeYang(dn, y, lon){
  var l=C.jieqiYear(y, lon), dz0=null, xz=null, dz1=null;
  l.forEach(function(x){ if(x.name==='冬至'){ if(new Date(x.cstMs).getUTCMonth()===11) dz1=x.day; else dz0=x.day; } if(x.name==='夏至') xz=x.day; });
  var prev=C.jieqiYear(y-1, lon).filter(function(x){ return x.name==='冬至' && new Date(x.cstMs).getUTCMonth()===11; })[0];
  if(prev) dz0=prev.day;
  return (dn>=dz0 && dn<xz) || dn>=dz1;
}
function shaDir(dayZhi){ return '申子辰'.indexOf(dayZhi)>=0?'南':'寅午戌'.indexOf(dayZhi)>=0?'北':'巳酉丑'.indexOf(dayZhi)>=0?'東':'西'; }
function hitRule(r, ctx){
  var mi=mIdx(ctx.monthZhi), ds=ctx.day[0], dz=ctx.day[1];
  switch(r.type){
    case 'monthStem': return r.table[mi]===ds;
    case 'monthBranch': return r.table[mi]===dz;
    case 'monthStemOrBranch': return r.table[mi]===ds||r.table[mi]===dz;
    case 'monthGZ': return r.table[mi]===ctx.day;
    case 'gzList': return r.table.indexOf(ctx.day)>=0;
    case 'monthBranchList': return r.table[mi].indexOf(dz)>=0;
    case 'monthGZList': return r.table[mi].indexOf(ctx.day)>=0;
    case 'monthStemList': return r.table[mi].indexOf(ds)>=0;
    case 'yearClash': return CHONG(ctx.year[1])===dz;
    case 'beforeTerm': return ctx.termsTomorrow.some(function(n){ return r.terms.indexOf(n)>=0; });
    case 'lunarDay': return !ctx.lunar.leap && r.table.some(function(p){ return p[0]===ctx.lunar.month && p[1]===ctx.lunar.day; });
    case 'lunarDayAny': return r.table.indexOf(ctx.lunar.day)>=0;
  }
  return false;
}
function pengzu(gz){
  var g=R.pengzu.gan[GAN.indexOf(gz[0])].slice(0,4), z=gz[1]==='未'? '（本站不列：涉及服藥）' : R.pengzu.zhi[ZHI.indexOf(gz[1])].slice(0,4);
  return g+'　'+z;
}
/* 一日的全部日家資料。opts.zi 只影響時家（晚子時）。 */
function day(y,m,d,lon,opts){
  opts=opts||{};
  var info=C.dayInfo(y,m,d,lon), L=info.lon;
  var tomorrow=C.jieqiOnDay(info.dn+1, y, L).map(function(x){ return x.name; });
  var ctx={monthZhi:info.monthZhi, day:info.day, year:info.year, lunar:info.lunar, termsTomorrow:tomorrow};
  var hits=R.shensha.filter(function(r){ return hitRule(r, ctx); });
  var ds=dayStar(info.dn, L, info.west);
  var tyang=timeYang(info.dn, y, L);
  var jc=jianchu(info.monthZhi, info.day[1]);
  var hd=huangdao(info.monthZhi, info.day[1]);
  var res={info:info, jianchu:{name:jc, good:!!R.jianchu.good[jc]}, huangdao:hd, xiu:xiu(info.dn),
    stars:{year:yearStar(info.year, y), month:monthStar(info.year, info.monthZhi), day:ds.star, yang:ds.yang, timeYang:tyang},
    chong:{zhi:CHONG(info.day[1]), shengxiao:SHENGXIAO[ZHI.indexOf(CHONG(info.day[1]))], gz:info.day, sha:shaDir(info.day[1])},
    pengzu:pengzu(info.day), taishen:R.taishen.days[C.jzIndex(info.day)], xunkong:xunKong(info.day),
    good:hits.filter(function(r){ return r.good; }), bad:hits.filter(function(r){ return !r.good; }), termsTomorrow:tomorrow};
  res.hours=hours(res, opts);
  return res;
}
/* 時家：十二時辰（0:00 換日時另列晚子時 23:00–24:00）。 */
function hours(dres, opts){
  var info=dres.info, zi=(opts&&opts.zi)==='23'?'23':'0', H=R.hour, ds=info.day[0], out=[], i, slots=[];
  for(i=0;i<12;i++) slots.push({zhi:ZHI[i], from:i===0?0:2*i-1, to:i===0?1:2*i+1, late:false});
  slots.push({zhi:'子', from:23, to:24, late:true});
  slots.forEach(function(s){
    var dayGZ=info.day, stemDay=ds;
    if(s.late){ if(zi==='23'){ dayGZ=C.jzAdd(info.day,1); stemDay=dayGZ[0]; } else stemDay=C.jzAdd(info.day,1)[0]; }
    var gz=C.wuShu(stemDay, s.zhi), hd=huangdao(dayGZ[1], s.zhi), tags=[], score=0;
    if(hd.yellow){ tags.push({t:'黃道 '+hd.name, good:true, src:H.src.huangdao}); score+=1; } else { tags.push({t:'黑道 '+hd.name, good:false, src:H.src.huangdao}); score-=1; }
    if(H.lu[dayGZ[0]]===s.zhi){ tags.push({t:'日祿歸時', good:true, src:H.src.lu}); score+=2; }
    if(H.guiren[dayGZ[0]].indexOf(s.zhi)>=0){ tags.push({t:'天乙貴人', good:true, src:H.src.guiren}); score+=2; }
    if(H.jielu[dayGZ[0]].indexOf(s.zhi)>=0){ tags.push({t:'截路空亡', good:false, src:H.src.jielu}); score-=2; }
    if(xunKong(dayGZ).indexOf(s.zhi)>=0){ tags.push({t:'旬空', good:false, src:H.src.xunkong}); score-=1; }
    var dg=GAN.indexOf(dayGZ[0]), hg=GAN.indexOf(gz[0]);
    if((hg-dg+10)%10===6){ tags.push({t:'五不遇時', good:false, src:H.src.wubuyu}); score-=2; }
    var po=CHONG(dayGZ[1])===s.zhi; if(po){ tags.push({t:'日破（時沖日）', good:false, src:'時支沖日支'}); score-=3; }
    out.push({zhi:s.zhi, gz:gz, from:s.from, to:s.to, late:s.late, dayGZ:dayGZ, huangdao:hd, star:timeStar(dayGZ[1], s.zhi, dres.stars.timeYang),
      tags:tags, score:score, po:po, chong:SHENGXIAO[ZHI.indexOf(CHONG(s.zhi))]});
  });
  return out;
}
var api={day:day, hours:hours, jianchu:jianchu, huangdao:huangdao, xiu:xiu, xunKong:xunKong, yearStar:yearStar, monthStar:monthStar,
  dayStar:dayStar, timeStar:timeStar, CHONG:CHONG, SHENGXIAO:SHENGXIAO, STAR_NAME:STAR_NAME, STAR_ELEM:STAR_ELEM, seasonOf:seasonOf, hitRule:hitRule, pengzu:pengzu};
root.XiejiEngine=api;
if(typeof module!=='undefined') module.exports=api;
})(typeof window!=='undefined'?window:global);
