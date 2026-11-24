// Mixed-sex (as-hatched) metric objectives, breeder publications 2022.
// Aviagen Ross 308/308 FF, page 3; Cobb500 supplement, page 2.
export const targets={"Ross 308":[44,62,81,102,125,151,181,213,249,288,330,376,425,477,533,592,655,720,789,860,935,1012,1092,1174,1258,1345,1434,1524,1616,1710,1805,1901,1999,2097,2196,2296,2396,2496,2597,2697,2798,2898,2998,3097,3197,3295,3393,3490,3586,3681,3776,3869,3961,4052,4142,4230,4318],"Cobb 500":[42,55,71,90,112,138,168,202,240,283,330,382,440,503,570,639,711,786,864,945,1029,1116,1205,1296,1390,1486,1583,1682,1783,1886,1989,2094,2200,2306,2413,2521,2629,2738,2846,2954,3062,3170,3278,3384,3490,3595,3699,3801,3902,4001,4099,4195,4289,4380,4470,4557,4641]};
export const targetSources={"Ross 308":"https://en.aviagen.com/assets/Tech_Center/Ross_Broiler/RossxRoss308-BroilerPerformanceObjectives2022-EN.pdf","Cobb 500":"https://www.cobbgenetics.com/assets/Cobb-Files/2022-Cobb500-Broiler-Performance-Nutrition-Supplement.pdf"};
const sum=(rows,k)=>rows.reduce((a,r)=>a+Number(r[k]),0);
const shiftNames=["Morning Check","Evening Check"];
export function cropMetrics(crop,logs,day,nextPlacement,catches=[]){
 const events=catches.filter(c=>c.crop_id===crop.id&&c.catch_date>=crop.placement_date&&c.catch_date<=day).sort((a,b)=>a.catch_date.localeCompare(b.catch_date));
 const final=events.find(c=>c.catch_type==="Final Clearance");
 const naturalEnd=nextPlacement&&nextPlacement<=day?new Date(Date.parse(nextPlacement)-86400000).toISOString().slice(0,10):day;
 const end=final&&final.catch_date<=naturalEnd?final.catch_date:naturalEnd;
 const age=Math.max(0,Math.floor((Date.parse(end)-Date.parse(crop.placement_date))/86400000));
 const scoped=logs.filter(l=>l.shed===crop.shed&&l.day>=crop.placement_date&&l.day<=end);
 const caught=events.filter(c=>c.catch_date<=end);
 const complete=through=>{for(let i=0;i<=through;i++){const d=new Date(Date.parse(crop.placement_date)+i*86400000).toISOString().slice(0,10);const r=scoped.filter(l=>l.day===d);if(r.length!==2||!shiftNames.every(s=>r.some(l=>l.shift===s))||r.some(l=>["dead","culls","feed"].some(k=>typeof l[k]!=="number"||!Number.isFinite(l[k])||l[k]<0)))return false;}return true;};
 const latest=[...(crop.samples||[])].filter(s=>s.day<=age).sort((a,b)=>b.day-a.day)[0];
 const dead=sum(scoped,"dead")+sum(scoped,"culls"),removed=sum(caught,"birds_caught"),live=crop.birds_placed-dead-removed;
 const liv=(scoped.length||caught.length)&&live>=0?100*(live+removed)/crop.birds_placed:null;
 let fcr=null,epef=null,metricDay=null;
 const closed=!!final||end!==day;
 const sampleDay=final?age:latest?.day;
 if(sampleDay>0&&complete(sampleDay)){
 const cutoff=new Date(Date.parse(crop.placement_date)+sampleDay*86400000).toISOString().slice(0,10);
 const r=scoped.filter(l=>l.day<=cutoff),c=caught.filter(x=>x.catch_date<=cutoff),n=sum(c,"birds_caught"),remaining=crop.birds_placed-sum(r,"dead")-sum(r,"culls")-n,feed=sum(r,"feed"),mass=sum(c,"live_weight_kg")+(remaining>0&&latest?remaining*latest.weight/1000:0);
 const totalBirds=remaining+n,weightedAge=(c.reduce((s,x)=>s+x.birds_caught*(Date.parse(x.catch_date)-Date.parse(crop.placement_date))/86400000,0)+remaining*sampleDay)/totalBirds;
 if(remaining>=0&&(!final||remaining===0)&&totalBirds>0&&mass>0&&feed>0&&weightedAge>0){fcr=feed/mass;epef=(totalBirds/crop.birds_placed*100)*(mass/totalBirds)*100/(weightedAge*fcr);metricDay=sampleDay;}
 }
 const daily=scoped.filter(r=>r.day===end),startBirds=crop.birds_placed-sum(scoped.filter(r=>r.day<end),"dead")-sum(scoped.filter(r=>r.day<end),"culls")-sum(caught.filter(r=>r.catch_date<end),"birds_caught");
 const feedPerBird=!caught.some(c=>c.catch_date===end)&&daily.length===2&&shiftNames.every(s=>daily.some(r=>r.shift===s))&&startBirds>0&&live>0?sum(daily,"feed")*1000/((startBirds+live)/2):null;
 return {age,liv,fcr,epef,latest,coverage:complete(age),closed,end,live:live>=0?live:null,removed,feedPerBird,metricDay,logCount:scoped.length};
}
