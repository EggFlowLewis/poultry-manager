// Water is a cumulative meter reading in litres; feed is per-shift kg.
export function priorDay(day){return new Date(Date.parse(day+"T00:00:00Z")-86400000).toISOString().slice(0,10);}
const valid=n=>typeof n==="number"&&Number.isFinite(n)&&n>=0;
function reading(logs,shed,day,shift){const rows=logs.filter(r=>r.shed===shed&&r.day===day&&r.shift===shift);return rows.length===1?rows[0]:null;}
export function waterDay(logs,shed,day){
 const start=reading(logs,shed,priorDay(day),"Evening Check"),am=reading(logs,shed,day,"Morning Check"),pm=reading(logs,shed,day,"Evening Check");
 if(!start||!am||!pm||![start.water,am.water,pm.water,am.feed,pm.feed].every(valid)||am.water<start.water||pm.water<am.water)return null;
 const water=pm.water-start.water,feed=am.feed+pm.feed;
 return {water,feed,ratio:feed>0?water/feed:null};
}
export function waterAlerts(logs,sheds,day){return [...new Set(sheds)].flatMap(shed=>{const current=waterDay(logs,shed,day),previous=waterDay(logs,shed,priorDay(day));if(!current||!previous||previous.water<=0)return [];const drop=100*(previous.water-current.water)/previous.water;return drop>10+1e-9?[{shed,drop,day,current:current.water,previous:previous.water}]:[];});}
