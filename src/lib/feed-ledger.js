export const rations=["Starter Crumb","Grower Pellets","Finisher Pellets","Withdrawal Ration"];
// FIFO book inventory, not a physical assertion about mixed feed.
export function feedLedger(silo,deliveries,logs,crop=null,end=null){
 const ds=deliveries.filter(d=>d.silo_id===silo.id),seen=new Set();
 const ls=logs.filter(l=>l.shed===silo.shed&&l.logged_at>=silo.started_at).sort((a,b)=>a.logged_at.localeCompare(b.logged_at)).filter(l=>{const k=l.day+"|"+l.shift;if(seen.has(k))return false;seen.add(k);return true;});
 const events=[...ds.map(d=>({time:d.logged_at,delivery:d})),...ls.map(l=>({time:l.logged_at,log:l}))].sort((a,b)=>a.time.localeCompare(b.time)||Number(!!b.delivery)-Number(!!a.delivery));
 const lots=[];let shortfall=0,cost=0,unknown=0,used=0;
 for(const e of events){if(e.delivery){let kg=e.delivery.tonnes_added*1000;const fill=Math.min(shortfall,kg);shortfall-=fill;kg-=fill;if(kg>1e-6)lots.push({kg,ration:e.delivery.ration_type||"Unrecorded ration",price:e.delivery.cost_per_tonne});continue;}
 const l=e.log;let kg=l.feed;const scoped=crop&&l.day>=crop.placement_date&&l.day<=end; if(scoped)used+=kg;
 while(kg>1e-6&&lots.length){const lot=lots[0],take=Math.min(kg,lot.kg);if(scoped){if(typeof lot.price==="number"&&Number.isFinite(lot.price))cost+=take*lot.price/1000;else unknown+=take;}kg-=take;lot.kg-=take;if(lot.kg<1e-6)lots.shift();}
 if(kg>1e-6){shortfall+=kg;if(scoped)unknown+=kg;}
 }
 const types=[...new Set(lots.map(l=>l.ration))];return {ration:types.length===1?types[0]:types.length>1?"Mixed rations":"Empty / unconfirmed",cost,unknown,used,shortfall};
}
export function cropFeedCost(crop,logs,silos,deliveries,end){const silo=silos.find(s=>s.shed===crop.shed);if(!silo||!end||!crop.birds_placed)return null;const relevant=logs.filter(l=>l.shed===crop.shed&&l.day>=crop.placement_date&&l.day<=end);if(!relevant.length||relevant.some(l=>l.logged_at<silo.started_at))return null;const result=feedLedger(silo,deliveries,logs,crop,end);return result.unknown>1e-6||result.used<=0?null:result.cost/crop.birds_placed;}
