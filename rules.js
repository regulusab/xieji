/* 協紀擇日：神煞與建除、黃黑道資料表（JSON 形式）。
   每條：id、name、good（吉神 true／凶煞 false）、grade（1 小、2 中、3 大）、type（查法）、table、src（預定對照典籍）、verified（是否已逐字核對原典）。
   verified=false 的條目在頁面標示「來源待核」。月序以節氣月（月建）為準，表依 寅卯辰巳午未申酉戌亥子丑 排列。 */
(function(root){
'use strict';
var XJ='《協紀辨方書》', TS='《象吉通書》', AT='《鰲頭通書》';
var R={
  months:'寅卯辰巳午未申酉戌亥子丑',
  jianchu:{
    names:['建','除','滿','平','定','執','破','危','成','收','開','閉'],
    good:{除:1,定:1,執:1,危:1,成:1,開:1},
    src:XJ+'卷四〈建除十二神〉', verified:false,
    rule:'月建之支為「建」，依日支順數：建除滿平定執破危成收開閉。交節當日起用新月。'
  },
  huangdao:{
    names:['青龍','明堂','天刑','朱雀','金匱','天德','白虎','玉堂','天牢','玄武','司命','勾陳'],
    yellow:{青龍:1,明堂:1,金匱:1,天德:1,玉堂:1,司命:1},
    start:{寅:'子',申:'子',卯:'寅',酉:'寅',辰:'辰',戌:'辰',巳:'午',亥:'午',子:'申',午:'申',丑:'戌',未:'戌'},
    src:XJ+'（黃道黑道，即「十二神」）、'+TS, verified:false,
    rule:'日家以月建起青龍：寅申月起子、卯酉月起寅、辰戌月起辰、巳亥月起午、子午月起申、丑未月起戌，順行十二支。時家以日支依同表起青龍。'
  },
  shensha:[
    /* 吉神 */
    {id:'tiande', name:'天德', good:true, grade:3, type:'monthStem', table:'丁-壬辛-甲癸-丙乙-庚', src:XJ+'卷五〈月表〉', verified:false, note:'二、五、八、十一月天德在坤、乾、艮、巽四卦位，不配日干支（來源待核）。'},
    {id:'tiandehe', name:'天德合', good:true, grade:2, type:'monthStem', table:'壬-丁丙-己戊-辛庚-乙', src:XJ+'卷五〈月表〉', verified:false, note:'二、五、八、十一月天德在卦位，無天德合日（來源待核）。'},
    {id:'yuede', name:'月德', good:true, grade:3, type:'monthStem', table:'丙甲壬庚丙甲壬庚丙甲壬庚', src:XJ+'卷五〈月表〉', verified:false},
    {id:'yuedehe', name:'月德合', good:true, grade:2, type:'monthStem', table:'辛己丁乙辛己丁乙辛己丁乙', src:XJ+'卷五〈月表〉', verified:false},
    {id:'tianshe', name:'天赦', good:true, grade:3, type:'monthGZ', table:['戊寅','戊寅','戊寅','甲午','甲午','甲午','戊申','戊申','戊申','甲子','甲子','甲子'], src:XJ+'卷五〈月表〉', verified:false, note:'春戊寅、夏甲午、秋戊申、冬甲子。'},
    {id:'tianen', name:'天恩', good:true, grade:2, type:'gzList', table:['甲子','乙丑','丙寅','丁卯','戊辰','己卯','庚辰','辛巳','壬午','癸未','己酉','庚戌','辛亥','壬子','癸丑'], src:XJ+'卷五〈日表〉', verified:false},
    {id:'yueen', name:'月恩', good:true, grade:2, type:'monthStem', table:'丙丁庚己戊辛壬癸庚乙甲辛', src:XJ+'卷五〈月表〉', verified:false},
    {id:'muchang', name:'母倉', good:true, grade:2, type:'monthBranchList', table:['亥子','亥子','亥子','寅卯','寅卯','寅卯','辰戌丑未','辰戌丑未','辰戌丑未','申酉','申酉','申酉'], src:XJ+'卷五〈月表〉', verified:false, note:'四季土王用事之日另取巳午，本站第一期未計土王用事。'},
    {id:'yuekong', name:'月空', good:true, grade:1, type:'monthStem', table:'壬庚丙甲壬庚丙甲壬庚丙甲', src:XJ+'卷五〈月表〉', verified:false},
    {id:'tianxi', name:'天喜', good:true, grade:2, type:'monthBranch', table:'戌亥子丑寅卯辰巳午未申酉', src:XJ+'卷五〈月表〉', verified:false},
    {id:'yima', name:'驛馬', good:true, grade:1, type:'monthBranch', table:'申巳寅亥申巳寅亥申巳寅亥', src:XJ+'卷五〈月表〉', verified:false},
    {id:'tianma', name:'天馬', good:true, grade:1, type:'monthBranch', table:'午申戌子寅辰午申戌子寅辰', src:XJ+'卷五〈月表〉', verified:false},
    {id:'shengqi', name:'生氣', good:true, grade:1, type:'monthBranch', table:'子丑寅卯辰巳午未申酉戌亥', src:XJ+'卷五〈月表〉', verified:false},
    /* 凶煞 */
    {id:'yuepo', name:'月破', good:false, grade:3, type:'monthBranch', table:'申酉戌亥子丑寅卯辰巳午未', src:XJ+'卷五〈月表〉', verified:false, note:'日支沖月建。《協紀辨方書》以月破即大耗（來源待核）。'},
    {id:'suipo', name:'歲破', good:false, grade:3, type:'yearClash', src:XJ+'卷三〈年表〉', verified:false, note:'日支沖太歲。'},
    {id:'yueyan', name:'月厭', good:false, grade:2, type:'monthBranch', table:'戌酉申未午巳辰卯寅丑子亥', src:XJ+'卷五〈月表〉', verified:false},
    {id:'jiesha', name:'劫煞', good:false, grade:2, type:'monthBranch', table:'亥申巳寅亥申巳寅亥申巳寅', src:XJ+'卷五〈月表〉', verified:false},
    {id:'zaisha', name:'災煞', good:false, grade:2, type:'monthBranch', table:'子酉午卯子酉午卯子酉午卯', src:XJ+'卷五〈月表〉', verified:false},
    {id:'yuesha', name:'月煞', good:false, grade:2, type:'monthBranch', table:'丑戌未辰丑戌未辰丑戌未辰', src:XJ+'卷五〈月表〉', verified:false},
    {id:'yuexing', name:'月刑', good:false, grade:1, type:'monthBranch', table:'巳子辰申午丑寅酉未亥卯戌', src:XJ+'卷五〈月表〉', verified:false},
    {id:'tiangang', name:'天罡', good:false, grade:2, type:'monthBranch', table:'巳子未寅酉辰亥午丑申卯戌', src:XJ+'卷五〈月表〉', verified:false},
    {id:'hekui', name:'河魁', good:false, grade:2, type:'monthBranch', table:'亥午丑申卯戌巳子未寅酉辰', src:XJ+'卷五〈月表〉', verified:false},
    {id:'guiji', name:'歸忌', good:false, grade:2, type:'monthBranch', table:'丑寅子丑寅子丑寅子丑寅子', src:XJ+'卷五〈月表〉', verified:false},
    {id:'wangwang', name:'往亡', good:false, grade:2, type:'monthBranch', table:'寅巳申亥卯午酉子辰未戌丑', src:XJ+'卷五〈月表〉', verified:false},
    {id:'xiaohao', name:'小耗', good:false, grade:1, type:'monthBranch', table:'未申酉戌亥子丑寅卯辰巳午', src:XJ+'卷五〈月表〉', verified:false},
    {id:'tufu', name:'土符', good:false, grade:1, type:'monthBranch', table:'丑巳酉寅午戌卯未亥辰申子', src:XJ+'卷五〈月表〉', verified:false},
    {id:'sifei', name:'四廢', good:false, grade:2, type:'monthGZList', table:[['庚申','辛酉'],['庚申','辛酉'],['庚申','辛酉'],['壬子','癸亥'],['壬子','癸亥'],['壬子','癸亥'],['甲寅','乙卯'],['甲寅','乙卯'],['甲寅','乙卯'],['丙午','丁巳'],['丙午','丁巳'],['丙午','丁巳']], src:XJ+'卷五〈月表〉', verified:false},
    {id:'chongsang', name:'重喪', good:false, grade:2, type:'monthStemList', table:['甲庚','乙辛','己戊','丙壬','丁癸','己戊','甲庚','乙辛','己戊','丙壬','丁癸','己戊'], src:TS, verified:false, note:'安葬、喪事大忌。依月建取日干。'},
    {id:'shousi', name:'受死', good:false, grade:2, type:'monthBranch', table:'戌辰亥巳子午丑未寅申卯酉', src:TS+'（《協紀辨方書》辨訛中有論，來源待核）', verified:false},
    {id:'sili', name:'四離', good:false, grade:3, type:'beforeTerm', terms:['春分','夏至','秋分','冬至'], src:TS, verified:false, note:'二分二至前一日。'},
    {id:'sijue', name:'四絕', good:false, grade:3, type:'beforeTerm', terms:['立春','立夏','立秋','立冬'], src:TS, verified:false, note:'四立前一日。'},
    {id:'yanggong', name:'楊公忌日', good:false, grade:3, type:'lunarDay', table:[[1,13],[2,11],[3,9],[4,7],[5,5],[6,3],[7,1],[7,29],[8,27],[9,25],[10,23],[11,21],[12,19]], src:TS+'（民間通書；《協紀辨方書》不取，來源待核）', verified:false, note:'依當地重算之農曆月日。'},
    {id:'sanniang', name:'三娘煞', good:false, grade:1, type:'lunarDayAny', table:[3,7,13,18,22,27], src:'民間通書（來源待核）', verified:false, note:'依當地重算之農曆日。多用於嫁娶。'}
  ],
  hour:{
    lu:{甲:'寅',乙:'卯',丙:'巳',丁:'午',戊:'巳',己:'午',庚:'申',辛:'酉',壬:'亥',癸:'子'},
    guiren:{甲:'丑未',戊:'丑未',乙:'子申',己:'子申',丙:'亥酉',丁:'亥酉',壬:'卯巳',癸:'卯巳',庚:'午寅',辛:'午寅'},
    jielu:{甲:'申酉',己:'申酉',乙:'午未',庚:'午未',丙:'辰巳',辛:'辰巳',丁:'寅卯',壬:'寅卯',戊:'子丑',癸:'子丑'},
    src:{lu:XJ+'〈日祿歸時〉（來源待核）', guiren:'天乙貴人口訣「甲戊兼牛羊，乙己鼠猴鄉，丙丁豬雞位，壬癸兔蛇藏，庚辛逢馬虎」（各家有異，來源待核）',
      jielu:'截路空亡（各家有異，來源待核）', wubuyu:'五不遇時：時干剋日干且陰陽相同（來源待核）', xunkong:'旬空（日柱所在旬之空亡）', huangdao:XJ+'時家黃道（來源待核）'}
  },
  xiu:{
    names:['角','亢','氐','房','心','尾','箕','斗','牛','女','虛','危','室','壁','奎','婁','胃','昴','畢','觜','參','井','鬼','柳','星','張','翼','軫'],
    luck:'吉凶凶吉凶吉吉吉凶凶凶凶吉吉凶吉吉凶吉凶吉吉凶凶凶吉凶吉',
    src:'二十八宿值日（以七曜配日，依日期循環；吉凶依通書，來源待核）', verified:false
  },
  taishen:{ days:'占門碓 外東南|碓磨廁 外東南|廚灶爐 外正南|倉庫門 外正南|房床棲 外正南|占門床 外正南|占碓磨 外正南|廚灶廁 外西南|倉庫爐 外西南|房床門 外西南|占門棲 外西南|碓磨床 外西南|廚灶碓 外西南|倉庫廁 外正西|房床爐 外正西|占大門 外正西|碓磨棲 外正西|廚灶床 外正西|倉庫碓 外西北|房床廁 外西北|占門爐 外西北|碓磨門 外西北|廚灶棲 外西北|倉庫床 外西北|房床碓 外正北|占門廁 外正北|碓磨爐 外正北|廚灶門 外正北|倉庫棲 外正北|占房床 房內北|占門碓 房內北|碓磨廁 房內北|廚灶爐 房內北|倉庫門 房內北|房床棲 房內中|占門床 房內中|占碓磨 房內南|廚灶廁 房內南|倉庫爐 房內南|房床門 房內西|占門棲 房內東|碓磨床 房內東|廚灶碓 房內東|倉庫廁 房內東|房床爐 房內中|占大門 外東北|碓磨棲 外東北|廚灶床 外東北|倉庫碓 外東北|房床廁 外東北|占門爐 外東北|碓磨門 外正東|廚灶棲 外正東|倉庫床 外正東|房床碓 外正東|占門廁 外正東|碓磨爐 外東南|廚灶門 外東南|倉庫棲 外東南|占房床 外東南'.split('|'), src:'胎神占方（依日柱干支六十甲子，民間通書，來源待核）' },
  pengzu:{
    gan:['甲不開倉財物耗散','乙不栽植千株不長','丙不修灶必見災殃','丁不剃頭頭必生瘡','戊不受田田主不祥','己不破券二比並亡','庚不經絡織機虛張','辛不合醬主人不嘗','壬不汲水更難提防','癸不詞訟理弱敵強'],
    zhi:['子不問卜自惹禍殃','丑不冠帶主不還鄉','寅不祭祀神鬼不嘗','卯不穿井水泉不香','辰不哭泣必主重喪','巳不遠行財物伏藏','午不苫蓋屋主更張','未不服藥毒氣入腸','申不安床鬼祟入房','酉不會客醉坐顛狂','戌不吃犬作怪上床','亥不嫁娶不利新郎'],
    src:'彭祖百忌（民間通書，來源待核）'
  }
};
root.XiejiRules=R;
if(typeof module!=='undefined') module.exports=R;
})(typeof window!=='undefined'?window:global);
