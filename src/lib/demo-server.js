import { createServerFn } from "@tanstack/react-start";
import { requireUser } from "@/lib/auth-middleware";
const day=d=>new Intl.DateTimeFormat("en-CA",{timeZone:"Europe/London",year:"numeric",month:"2-digit",day:"2-digit"}).format(d);
const add=(d,n)=>new Date(Date.parse(d)+n*86400000).toISOString().slice(0,10);
function owner(context){if(context.user.role!=="admin")throw Error("Farm owner access required.");return context.user;}
export const getFarmProfile=createServerFn({method:"GET"}).middleware([requireUser]).handler(async({context})=>{const u=owner(context),db=context.getBase44().asServiceRole.entities;const rows=await db.FarmProfile.filter({owner_id:u.id});return rows[0]||null;});
export const loadDemoFarm=createServerFn({method:"POST"}).middleware([requireUser]).handler(async({context})=>{const u=owner(context),client=context.getBase44(),db=client.asServiceRole.entities,scope={owner_id:u.id};const profiles=await db.FarmProfile.filter(scope);if(profiles.length){if(profiles[0].demo&&profiles[0].demo_status==="ready")return {loaded:true,already:true};throw Error("A farm profile or unfinished demo already exists. No further records were added.");}
const existing=await Promise.all([db.CropCycle.filter({created_by_id:u.id}),...["StaffAssignment","ShedCheck","AuditCheckEvent","MedicineLog","FeedSilo","SiloDelivery","GateVisit","FarmGate"].map(n=>db[n].filter(scope))]);if(existing.some(rows=>rows.length))throw Error("Sample data may only be loaded into an empty farm to protect existing records.");
const now=new Date(),today=day(now),placement=add(today,-28),start=add(today,-4)+"T00:00:00.000Z",shed1="Shed 1 — 32,000 Birds",shed2="Shed 2 — 32,000 Birds";
const p=await db.FarmProfile.create({...scope,farm_name:"Wentworth Valley Poultry Ltd",cph:"49/123/0045",red_tractor_id:"RT-88412",demo:true,demo_day:today,demo_status:"loading"});
try{
await client.entities.CropCycle.create({crop_name:"Crop #14",shed:shed1,placement_date:placement,birds_placed:32000,breed:"Ross 308",target_days:42,samples:[{day:7,weight:195},{day:14,weight:485},{day:21,weight:960},{day:28,weight:1540}]});
for(const [name,email,shed] of [["J. Davies","j.davies@example.invalid",shed1],["T. Evans","t.evans@example.invalid",shed2]])await db.StaffAssignment.create({...scope,staff_name:name,staff_email:email,sheds:[shed]});
const checks=[];for(let i=0;i<=28;i++){const d=add(placement,i);for(const [shed,staff,feed] of [[shed1,"J. Davies",900],[shed2,"T. Evans",1400]]){if(shed===shed2&&i<25)continue;for(const shift of ["Morning Check","Evening Check"]){if(i===28&&shift==="Evening Check")continue;const ts=d+(shift==="Morning Check"?"T06:30:00.000Z":"T17:30:00.000Z");checks.push({...scope,staff_id:"demo-"+(shed===shed1?"davies":"evans"),staff_name:staff+" (DEMO)",shed,shift,dead:shed===shed1?3:2,culls:1,feed,water:feed*2,temp:24,humidity:65,logged_at:i===28?now.toISOString():ts,day:d});}}}
await db.ShedCheck.bulkCreate(checks);
for(const [name,shed,remaining] of [["Silo 1 Starter/Grower",shed1,17.2],["Silo 2 Finisher",shed2,4.1]]){const silo=await db.FeedSilo.create({...scope,silo_name:name,shed,capacity_tonnes:24,started_at:start});const used=checks.filter(c=>c.shed===shed&&c.logged_at>=start).reduce((n,c)=>n+c.feed/1000,0);await db.SiloDelivery.create({...scope,silo_id:silo.id,tonnes_added:remaining+used,logged_at:start,logged_by:"DEMO opening stock and deliveries",request_id:crypto.randomUUID()});}
await db.AuditCheckEvent.bulkCreate(["water","footbath","rodent","disposal"].map(check_key=>({...scope,check_key,completed:true,logged_at:now.toISOString(),logged_by:"DEMO – sample checklist",user_id:u.id,day:today})));
await db.FarmProfile.update(p.id,{demo_status:"ready"});return {loaded:true};
}catch(e){await db.FarmProfile.update(p.id,{demo_status:"failed"});throw Error("Sample loading interrupted. Demo records may be partial; contact support before retrying. "+e.message);}
});
