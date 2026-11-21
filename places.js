/* 常用地點（經度供節氣、合朔換算地方平時；時區僅供使用者自行換算參考，站方不用時區） */
(function(root){
var PLACES=[
  {id:'taipei', name:'臺北', lon:121.57},{id:'taichung', name:'臺中', lon:120.68},{id:'tainan', name:'臺南', lon:120.21},{id:'kaohsiung', name:'高雄', lon:120.31},
  {id:'hongkong', name:'香港', lon:114.17},{id:'macau', name:'澳門', lon:113.54},{id:'beijing', name:'北京', lon:116.41},{id:'shanghai', name:'上海', lon:121.47},
  {id:'guangzhou', name:'廣州', lon:113.26},{id:'singapore', name:'新加坡', lon:103.82},{id:'kualalumpur', name:'吉隆坡', lon:101.69},{id:'bangkok', name:'曼谷', lon:100.50},
  {id:'tokyo', name:'東京', lon:139.69},{id:'seoul', name:'首爾', lon:126.98},{id:'sydney', name:'雪梨', lon:151.21},{id:'dubai', name:'杜拜', lon:55.27},
  {id:'london', name:'倫敦', lon:-0.13},{id:'paris', name:'巴黎', lon:2.35},{id:'newyork', name:'紐約', lon:-74.01},{id:'toronto', name:'多倫多', lon:-79.38},
  {id:'losangeles', name:'洛杉磯', lon:-118.24},{id:'sanfrancisco', name:'舊金山', lon:-122.42},{id:'portland', name:'波特蘭', lon:-122.68},{id:'vancouver', name:'溫哥華', lon:-123.12},
  {id:'custom', name:'自訂經度', lon:null}
];
root.XiejiPlaces=PLACES;
if(typeof module!=='undefined') module.exports=PLACES;
})(typeof window!=='undefined'?window:global);
