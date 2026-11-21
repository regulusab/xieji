/* 協紀擇日：曆法核心。
   規則依老師 2026-11-19 裁定：
   - 時間一律為使用者自行換算的「地方平時」，照寫使用（不加減夏令，不做時辰邊界警告）。
   - 節氣、合朔換算為地點經度的地方平時：世界時＋經度×4 分鐘（不含夏令）。
   - 農曆以當地重算（見 local_lunar.js），農曆日一律重算、不挪動。
   - 東經 70° 以西日柱干支進一位（日期不動）：只有日柱干支進一位，時干依五鼠遁重推；年、月柱仍以原地方平時對當地節氣。
   - 子時換日預設 0:00（23:00–24:00 日柱不換，時干依次日日干）；可切換為 23:00 換日。 */
(function(root){
'use strict';
var D=864e5;
var GAN='甲乙丙丁戊己庚辛壬癸', ZHI='子丑寅卯辰巳午未申酉戌亥';
var JZ=[]; for(var i=0;i<60;i++) JZ.push(GAN[i%10]+ZHI[i%12]);
var TRAD={惊蛰:'驚蟄',谷雨:'穀雨',小满:'小滿',芒种:'芒種',处暑:'處暑',DONG_ZHI:'冬至',XIAO_HAN:'小寒',DA_HAN:'大寒',LI_CHUN:'立春',YU_SHUI:'雨水',JING_ZHE:'驚蟄',DA_XUE:'大雪'};
var JIE_ZHI={立春:'寅',驚蟄:'卯',清明:'辰',立夏:'巳',芒種:'午',小暑:'未',立秋:'申',白露:'酉',寒露:'戌',立冬:'亥',大雪:'子',小寒:'丑'};
function lib(){ return root.Solar ? root : require('./lunar.js'); }
function LL(){ return root.HeluoLocalLunar || require('./local_lunar.js'); }
function jzIndex(gz){ return JZ.indexOf(gz); }
function jzAdd(gz,n){ return JZ[((jzIndex(gz)+n)%60+60)%60]; }
function dayNum(y,m,d){ return Math.floor(Date.UTC(y,m-1,d)/D); }
function ymdOf(n){ return new Date(n*D).toISOString().slice(0,10); }
function parseYmd(s){ var p=String(s).split('-').map(Number); return {y:p[0],m:p[1],d:p[2]}; }
function pad(n){ return String(n).padStart(2,'0'); }
function stamp(ms){ var d=new Date(ms); return d.getUTCFullYear()+'-'+pad(d.getUTCMonth()+1)+'-'+pad(d.getUTCDate())+' '+pad(d.getUTCHours())+':'+pad(d.getUTCMinutes()); }
function hasLon(lon){ return !(lon==null||lon===''||isNaN(+lon)); }
function lonOr(lon){ return hasLon(lon)? +lon : 120; }

/* 節氣表：lunar-javascript 印記為東八區；世界時＝印記−8 小時；地方平時＝世界時＋經度×4 分鐘。
   以「地方平時的牆鐘毫秒」（Date.UTC 寫法）表示。 */
var jqCache={};
function jieqiYear(y, lon){
  var key=y+'|'+lon; if(jqCache[key]) return jqCache[key];
  var t=lib().Solar.fromYmd(y,6,15).getLunar().getJieQiTable(), out=[], seen={}, k, s, name, cst, ms;
  for(k in t){
    if(!Object.prototype.hasOwnProperty.call(t,k)) continue;
    s=t[k]; if(!s||!s.getYear) continue;
    name=TRAD[k]||k;
    cst=Date.UTC(s.getYear(),s.getMonth()-1,s.getDay(),s.getHour(),s.getMinute(),s.getSecond());
    if(seen[cst]) continue; seen[cst]=1;
    ms=cst+(lon-120)*4*60000;
    out.push({name:name, cstMs:cst, ms:ms, day:Math.floor(ms/D)});
  }
  out.sort(function(a,b){ return a.ms-b.ms; });
  jqCache[key]=out; return out;
}
function jieqiAround(y, lon){
  var a=[], seen={};
  [y-1,y,y+1].forEach(function(yy){ jieqiYear(yy,lon).forEach(function(x){ if(!seen[x.cstMs]){ seen[x.cstMs]=1; a.push(x); } }); });
  a.sort(function(p,q){ return p.ms-q.ms; });
  return a;
}
function monthGZ(yearGZ, zhi){
  var yg=GAN.indexOf(yearGZ[0]), mz=ZHI.indexOf(zhi);
  return GAN[((yg%5)*2+2+((mz-2+12)%12))%10]+zhi;
}
function gzYear(y){ return JZ[((y-4)%60+60)%60]; }
/* 依「比較鍵」取年、月：exact=時刻比較；byDay=交節當日即用新月（日家建除、神煞依此）。 */
function yearMonthAt(key, y, lon, byDay){
  var list=jieqiAround(y, lon), prev=null, lc=null, i, x, v;
  for(i=0;i<list.length;i++){
    x=list[i]; v=byDay? x.day : x.ms;
    if(v<=key){
      if(JIE_ZHI[x.name]) prev=x;
      if(x.name==='立春') lc=x;
    }
  }
  var yearGZ=gzYear(new Date(lc.cstMs).getUTCFullYear());
  return {year:yearGZ, month:monthGZ(yearGZ, JIE_ZHI[prev.name]), monthZhi:JIE_ZHI[prev.name], jie:prev, lichun:lc};
}
function nextJieqi(key, y, lon){ var l=jieqiAround(y,lon); for(var i=0;i<l.length;i++) if(l[i].ms>key) return l[i]; return null; }
function prevJieqi(key, y, lon){ var l=jieqiAround(y,lon), p=null; for(var i=0;i<l.length;i++) if(l[i].ms<=key) p=l[i]; return p; }
function jieqiOnDay(dn, y, lon){ return jieqiAround(y,lon).filter(function(x){ return x.day===dn; }); }

function westShift(lon){ return hasLon(lon) && +lon<70; }
function rawDayGZ(y,m,d){ return lib().Solar.fromYmd(y,m,d).getLunar().getDayInGanZhi(); }
/* 日柱：日期本身的干支；東經 70° 以西日柱干支進一位（日期不動）。 */
function dayGZ(y,m,d,lon){ var g=rawDayGZ(y,m,d); return westShift(lon)? jzAdd(g,1) : g; }
function hourZhiOf(h){ return ZHI[Math.floor(((h+1)%24)/2)]; }
function wuShu(dayStem, hz){ return GAN[((GAN.indexOf(dayStem)%5)*2+ZHI.indexOf(hz))%10]+hz; }

/* 四柱。opts.zi: '0'（預設，0:00 換日）或 '23'（23:00 換日）。 */
function pillars(y,m,d,h,mi,lon,opts){
  opts=opts||{}; var zi=opts.zi==='23'?'23':'0';
  var L=lonOr(lon), key=Date.UTC(y,m-1,d,h,mi||0);
  var ym=yearMonthAt(key, y, L, false);
  var dg=dayGZ(y,m,d,lon), hz=hourZhiOf(h), late=h>=23;
  if(late && zi==='23') dg=jzAdd(dg,1);
  var hg=wuShu((late && zi==='0')? jzAdd(dg,1)[0] : dg[0], hz);
  return {year:ym.year, month:ym.month, day:dg, hour:hg, jie:ym.jie, lichun:ym.lichun, west:westShift(lon), lateZi:late, zi:zi};
}
/* 日家：某日的年、月（交節當日起用新月）與日柱。 */
function dayInfo(y,m,d,lon){
  var L=lonOr(lon), dn=dayNum(y,m,d);
  var ym=yearMonthAt(dn, y, L, true);
  var lunar=LL().forHeluo(hasLon(lon)? +lon : 120, ymdOf(dn));
  return {ymd:ymdOf(dn), dn:dn, y:y, m:m, d:d, lon:L, west:westShift(lon), year:ym.year, month:ym.month, monthZhi:ym.monthZhi,
    day:dayGZ(y,m,d,lon), rawDay:rawDayGZ(y,m,d), jie:ym.jie, lunar:lunar, jieqiToday:jieqiOnDay(dn,y,L),
    weekday:new Date(dn*D).getUTCDay()};
}
var WEST_TEXT='東經 70° 以西日柱干支進一位（日期不動）';
var api={GAN:GAN, ZHI:ZHI, JZ:JZ, D:D, jzIndex:jzIndex, jzAdd:jzAdd, dayNum:dayNum, ymdOf:ymdOf, parseYmd:parseYmd, stamp:stamp,
  hasLon:hasLon, lonOr:lonOr, jieqiYear:jieqiYear, jieqiAround:jieqiAround, yearMonthAt:yearMonthAt, nextJieqi:nextJieqi, prevJieqi:prevJieqi,
  jieqiOnDay:jieqiOnDay, westShift:westShift, rawDayGZ:rawDayGZ, dayGZ:dayGZ, hourZhiOf:hourZhiOf, wuShu:wuShu, pillars:pillars, dayInfo:dayInfo,
  gzYear:gzYear, monthGZ:monthGZ, JIE_ZHI:JIE_ZHI, WEST_TEXT:WEST_TEXT};
root.XiejiCal=api;
if(typeof module!=='undefined') module.exports=api;
})(typeof window!=='undefined'?window:global);
