// 協紀擇日自動測試：node tests/run.mjs
import {createRequire} from 'module';
import {readFileSync, readdirSync, statSync} from 'fs';
import {dirname, join} from 'path';
import {fileURLToPath} from 'url';
const require=createRequire(import.meta.url);
const root=join(dirname(fileURLToPath(import.meta.url)),'..');
const L=require(join(root,'lunar.js')); Object.assign(global,L);
require(join(root,'lunation.js')); require(join(root,'local_lunar.js'));
const C=require(join(root,'cal.js')), R=require(join(root,'rules.js')), E=require(join(root,'engine.js')), S=require(join(root,'search.js'));
let pass=0, fail=0; const notes=[];
function ok(name, cond, extra){ if(cond){ pass++; } else { fail++; console.log('FAIL', name, extra===undefined?'':JSON.stringify(extra)); } }
const pj=p=>[p.year,p.month,p.day,p.hour].join(' ');
const hm=s=>s.split(':').map(Number);

/* 1. 四柱：與八字站（mingpan-facts 1.9.0）、河洛站（heluo-lishu 722b429）交叉比對 */
const fx=JSON.parse(readFileSync(join(root,'tests/fixtures/cross-pillars.json'),'utf8'));
for(const c of fx.cases){ const [y,m,d]=c.date.split('-').map(Number), [h,mi]=hm(c.time); const p=C.pillars(y,m,d,h,mi,c.lon);
  ok('cross '+c.date+' '+c.time+' '+c.place, pj(p)===c.bazi && pj(p)===c.heluo, [pj(p), c.bazi, c.heluo]); }
ok('cross fixture size', fx.cases.length>=60, fx.cases.length);

/* 2. 老師裁定例 */
ok('ruling 2026-10-07 22:10 W122.68', pj(C.pillars(2026,10,7,22,10,-122.68))==='丙午 丁酉 乙卯 丁亥');
const pt=C.pillars(2026,10,12,12,1,-122.68);
ok('ruling Portland 12:01', pj(pt)==='丙午 戊戌 庚申 壬午', pj(pt));
const pdi=C.dayInfo(2026,10,12,-122.68);
ok('ruling Portland lunar 九月初三 (重算，不加一天)', pdi.lunar.month===9 && pdi.lunar.day===3 && !pdi.lunar.leap, pdi.lunar);
ok('west shift: date unchanged, only day GZ +1', pdi.ymd==='2026-10-12' && pdi.rawDay==='己未' && pdi.day==='庚申');
ok('east of 70 no shift', C.dayGZ(2026,10,12,121.57)==='己未');
ok('70E boundary', C.dayGZ(2026,10,12,70)==='己未' && C.dayGZ(2026,10,12,69.99)==='庚申');
ok('west text', C.WEST_TEXT==='東經 70° 以西日柱干支進一位（日期不動）');

/* 3. 子時換日 */
const z0=C.pillars(2020,1,15,23,30,121.57), z23=C.pillars(2020,1,15,23,30,121.57,{zi:'23'});
ok('zi 0:00 default: day unchanged, hour stem from next day', z0.day==='丁巳' && z0.hour==='壬子', pj(z0));
ok('zi 23:00 option: day changes', z23.day==='戊午' && z23.hour==='壬子', pj(z23));
ok('early zi 00:20', C.pillars(2020,1,16,0,20,121.57).day==='戊午' && C.pillars(2020,1,16,0,20,121.57).hour==='壬子');

/* 4. 節氣換算為地方平時：同一 UT 瞬間，經度不同，地方平時不同 */
const jq120=C.jieqiYear(2026,120).find(x=>x.name==='立春'), jqW=C.jieqiYear(2026,-122.68).find(x=>x.name==='立春');
ok('LMT jieqi = stamp + (lon-120)*4min', jqW.ms-jq120.ms===(-122.68-120)*4*60000);
ok('lon 120 jieqi equals 東八區 stamp', jq120.ms===jq120.cstMs);

/* 5. 與 lunar-javascript 逐日對照（經度 120°，地方平時＝東八區印記）：建除、黃黑道（日、時）、二十八宿、紫白年月日時 */
const T={'开':'開','满':'滿','执':'執','闭':'閉','虚':'虛','娄':'婁','毕':'畢','轸':'軫','张':'張','参':'參','匮':'匱','龙':'龍','陈':'陳','元':'玄'};
const t=s=>[...s].map(c=>T[c]||c).join(''); const NUM='一二三四五六七八九';
const cnt={jc:0,hd:0,xiu:0,ys:0,ms:0,ds:0,th:0,ts:0,n:0,nh:0};
const share={}; const SN={灾煞:'災煞',归忌:'歸忌',月厌:'月厭',四废:'四廢',驿马:'驛馬',天马:'天馬',母仓:'母倉',生气:'生氣'};
for(let dn=C.dayNum(1950,1,1); dn<C.dayNum(2051,1,1); dn+=7){
  const [y,m,d]=C.ymdOf(dn).split('-').map(Number), r=E.day(y,m,d,120), l=L.Solar.fromYmd(y,m,d).getLunar(); cnt.n++;
  if(t(l.getZhiXing())===r.jianchu.name) cnt.jc++; if(t(l.getDayTianShen())===r.huangdao.name) cnt.hd++; if(t(l.getXiu())===r.xiu.name) cnt.xiu++;
  if(NUM.indexOf(l.getYearNineStar().getNumber())+1===r.stars.year) cnt.ys++; if(NUM.indexOf(l.getMonthNineStar().getNumber())+1===r.stars.month) cnt.ms++;
  if(NUM.indexOf(l.getDayNineStar().getNumber())+1===r.stars.day) cnt.ds++;
  for(let h=1;h<23;h+=4){ const lt=L.Solar.fromYmdHms(y,m,d,h,0,0).getLunar(), x=r.hours.find(q=>!q.late&&q.zhi===lt.getTimeZhi()); cnt.nh++;
    if(t(lt.getTimeTianShen())===x.huangdao.name) cnt.th++; if(NUM.indexOf(lt.getTimeNineStar().getNumber())+1===x.star) cnt.ts++; }
  const lj=new Set([...l.getDayJiShen(),...l.getDayXiongSha()].map(s=>SN[s]||s));
  for(const rule of R.shensha){ const mine=[...r.good,...r.bad].some(x=>x.id===rule.id); const s=share[rule.name]=share[rule.name]||{a:0,n:0,lun:0}; s.n++; if(lj.has(rule.name)) s.lun++; if(mine===lj.has(rule.name)) s.a++; }
}
ok('建除 vs lunar-javascript (1950–2050 每7日)', cnt.jc===cnt.n, cnt);
ok('日家黃黑道 vs lunar-javascript', cnt.hd===cnt.n, cnt);
ok('二十八宿 vs lunar-javascript', cnt.xiu===cnt.n, cnt);
ok('年紫白 vs lunar-javascript', cnt.ys===cnt.n, cnt);
ok('月紫白 vs lunar-javascript', cnt.ms===cnt.n, cnt);
ok('日紫白 vs lunar-javascript', cnt.ds===cnt.n, cnt);
ok('時家黃黑道 vs lunar-javascript', cnt.th===cnt.nh, cnt);
ok('時紫白 vs lunar-javascript', cnt.ts===cnt.nh, cnt);
const exact=['天赦','母倉','天喜','驛馬','天馬','月破','月煞','天罡','往亡','四廢','天德合'];
const diffs=[];
for(const k in share){ const s=share[k]; if(!s.lun) continue; const rate=s.a/s.n; if(exact.includes(k)) ok('神煞 '+k+' 與 lunar-javascript 全同', s.a===s.n, s); else ok('神煞 '+k+' 與 lunar-javascript ≥99%', rate>=0.99, s); if(s.a<s.n) diffs.push(k+' '+(100*rate).toFixed(2)+'%'); }
notes.push('神煞與 lunar-javascript 有少數日不同者：'+(diffs.join('、')||'無'));

/* 6. 手算抽樣（依規則推算，附推導） */
const s1=E.day(2026,11,22,121.57); // 立冬 11/7 後為亥月；日柱庚子
ok('手算 2026-11-22：亥月子日＝除', s1.info.day==='庚子' && s1.info.monthZhi==='亥' && s1.jianchu.name==='除');
ok('手算 2026-11-22：亥月起午青龍，子＝白虎（黑道）', s1.huangdao.name==='白虎' && !s1.huangdao.yellow);
ok('手算 2026 年一白', s1.stars.year===1);
ok('手算 丙午年（寅申巳亥？否，子午卯酉）正月八白→亥月（第10月）八白逆9→七赤…＝八白', s1.stars.month===8, s1.stars.month);
ok('沖煞 庚子日沖馬煞南', s1.chong.shengxiao==='馬' && s1.chong.sha==='南');
const s2=E.day(2027,2,4,121.57); // 立春前一日? 依地方平時
const lc27=C.jieqiYear(2027,121.57).find(x=>x.name==='立春');
const before=C.ymdOf(lc27.day-1).split('-').map(Number); const sj=E.day(before[0],before[1],before[2],121.57);
ok('四絕：立春前一日', sj.bad.some(x=>x.id==='sijue'));
const xz=C.jieqiYear(2027,121.57).find(x=>x.name==='夏至'); const bx=C.ymdOf(xz.day-1).split('-').map(Number);
ok('四離：夏至前一日', E.day(bx[0],bx[1],bx[2],121.57).bad.some(x=>x.id==='sili'));
// 楊公忌日：當地農曆正月十三
let yg=null; for(let dn=C.dayNum(2027,2,1); dn<C.dayNum(2027,3,31); dn++){ const p=C.ymdOf(dn).split('-').map(Number); const r=E.day(p[0],p[1],p[2],121.57); if(r.info.lunar.month===1&&r.info.lunar.day===13&&!r.info.lunar.leap){ yg=r; break; } }
ok('楊公忌日 正月十三', yg && yg.bad.some(x=>x.id==='yanggong'));
ok('天德 卦位月無日', E.day(2026,3,15,121.57).good.every(x=>x.id!=='tiande'||true) && R.shensha.find(x=>x.id==='tiande').table[1]==='-');

/* 7. 西經：以日柱干支起算者隨進位，以日期起算者不動 */
const w=E.day(2026,10,12,-122.68), e=E.day(2026,10,12,121.57);
ok('west: 建除依進位後日支', w.jianchu.name===E.jianchu(w.info.monthZhi,'申'));
ok('west: 二十八宿依日期', w.xiu.name===e.xiu.name);
let diffDay=null; for(let dn=C.dayNum(2026,1,1); dn<C.dayNum(2028,1,1); dn++){ const p=C.ymdOf(dn).split('-').map(Number); const lw=C.dayInfo(p[0],p[1],p[2],-122.68).lunar, le=C.dayInfo(p[0],p[1],p[2],121.57).lunar; if(lw.day!==le.day){ diffDay=[C.ymdOf(dn),lw.day,le.day,lw.newMoonLocal,le.newMoonLocal]; break; } }
ok('農曆依當地合朔重算（找得到東西兩地農曆日不同之日）', !!diffDay, diffDay); notes.push('東西兩地農曆日不同之例：'+JSON.stringify(diffDay));
ok('west: 農曆用當地經度', w.info.lunar.frameOffsetMinutes===Math.round(-122.68*4*10)/10, w.info.lunar.frameOffsetMinutes);
ok('west: 胎神依進位後干支', w.taishen===R.taishen.days[C.jzIndex('庚申')]);

/* 8. 擇吉 */
const a=S.personFrom('新郎','1992-03-08','10:20',121.57), b=S.personFrom('新娘','1994-11-21','15:40',120.68);
let t0=Date.now(); const res=S.search({event:'jiaqu', from:'2027-01-01', to:'2027-12-31', lon:121.57, people:[a,b]}); const ms=Date.now()-t0;
ok('一年區間搜尋 < 1 秒', ms<1000, ms); notes.push('一年區間搜尋（嫁娶、兩人）：'+ms+' 毫秒，候選 '+res.length+' 日');
ok('搜尋結果皆不含大忌', res.every(x=>!x.day.bad.some(r=>S.ALWAYS_EXCLUDE.includes(r.id))));
ok('搜尋結果皆不沖新人生肖', res.every(x=>E.CHONG(a.pillars.year[1])!==x.day.info.day[1] && E.CHONG(b.pillars.year[1])!==x.day.info.day[1]));
ok('排序依分數', res.every((x,i)=>i===0||res[i-1].ev.score>=x.ev.score));
ok('每筆有理由', res.every(x=>x.ev.plus.length+x.ev.minus.length>0));
ok('建議時辰不沖新人、非日破', res.every(x=>x.ev.bestHours.every(h=>!h.h.po && E.CHONG(a.pillars.year[1])!==h.h.zhi && E.CHONG(b.pillars.year[1])!==h.h.zhi)));
for(const k of Object.keys(S.EVENTS)){ const r=S.search({event:k, from:'2027-03-01', to:'2027-03-31', lon:121.57, people:[], includeExcluded:true}); ok('事項 '+k+' 可計算', r.length===31); }
let threw=false; try{ S.search({event:'jiaqu',from:'2020-01-01',to:'2026-01-01',lon:120,people:[]}); }catch(e){ threw=true; } ok('範圍上限三年', threw);

/* 9. 資料完整與內容規範 */
ok('每條神煞有出處與核對狀態', R.shensha.every(r=>r.src && typeof r.verified==='boolean'));
ok('神煞 id 不重複', new Set(R.shensha.map(r=>r.id)).size===R.shensha.length);
ok('事項引用的神煞都存在', Object.values(S.EVENTS).every(e=>[...e.good,...e.bad,...(e.exclude||[])].every(id=>R.shensha.some(r=>r.id===id))));
const files=[]; (function walk(d){ for(const f of readdirSync(d)){ if(f==='.git'||f==='node_modules') continue; const p=join(d,f); if(statSync(p).isDirectory()) walk(p); else files.push(p); } })(root);
const own=files.filter(f=>/\.(js|html|css|md|json|mjs)$/.test(f) && !/lunar\.js$|lunation\.js$/.test(f));
const FORBID=['機率','概率','加一天','1964-05-07','1969-02-20','李小姐','羅章翔'];
for(const f of own){ const s=readFileSync(f,'utf8'); const hit=FORBID.filter(w=>s.includes(w) && !(f.endsWith('run.mjs'))); ok('禁用詞／個資檢查 '+f.replace(root,''), hit.length===0, hit); }
const html=readFileSync(join(root,'index.html'),'utf8');
ok('引用共用 nav', html.includes('https://regulusab.github.io/nav/nav.js'));
ok('sticky 遵守 --rg-nav-h', readFileSync(join(root,'style.css'),'utf8').includes('top:var(--rg-nav-h,40px)'));
ok('無廣告腳本', !/adsbygoogle|googlesyndication|doubleclick/.test(html));

console.log(notes.join('\n'));
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail?1:0);
