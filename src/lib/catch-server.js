import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireUser } from "@/lib/auth-middleware";
import { cropMetrics } from "@/lib/crop-performance";
const today=()=>new Intl.DateTimeFormat("en-CA",{timeZone:"Europe/London",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
async function all(entity,filter){const rows=[];for(let skip=0;;skip+=200){const batch=await entity.filter(filter,"-created_date",200,skip);rows.push(...batch);if(batch.length<200)return rows;if(skip>=19800)throw Error("Record limit reached.");}}
export const saveCatch=createServerFn({method:"POST"}).middleware([requireUser]).validator(z.object({crop_id:z.string().min(1),shed:z.string().min(1),catch_date:z.iso.date(),catch_type:z.enum(["Thinning","Final Clearance"]),birds_caught:z.number().int().positive(),live_weight_kg:z.number().positive(),rejects:z.number().int().nonnegative(),request_id:z.string().uuid()})).handler(async({context,data})=>{
 const u=context.user;if(u.role!=="admin")throw Error("Farm owner access required.");const db=context.getBase44().asServiceRole.entities;
 const prior=await db.CropCatch.filter({owner_id:u.id,request_id:data.request_id});if(prior.length)return prior[0];
 const [crops,logs,catches,meds]=await Promise.all([all(db.CropCycle,{created_by_id:u.id}),all(db.ShedCheck,{owner_id:u.id,shed:data.shed}),all(db.CropCatch,{owner_id:u.id,crop_id:data.crop_id}),all(db.MedicineLog,{owner_id:u.id,shed:data.shed})]);
 const crop=crops.find(c=>c.id===data.crop_id&&c.shed===data.shed);if(!crop)throw Error("Crop or shed not found.");
 const next=crops.filter(c=>c.shed===crop.shed&&c.placement_date>crop.placement_date).map(c=>c.placement_date).sort()[0];
 if(data.catch_date<crop.placement_date||data.catch_date>today()||(next&&data.catch_date>=next))throw Error("Catch date must fall within this crop.");
 if(catches.some(c=>c.catch_type==="Final Clearance"||c.catch_date>data.catch_date))throw Error("A later catch or final clearance is already recorded.");
 if(meds.some(m=>m.date_administered<=data.catch_date&&data.catch_date<m.clearance_date))throw Error("Withdrawal hold active on catch date. Verify clearance before recording dispatch.");
 const stats=cropMetrics(crop,logs,data.catch_date,next,catches);
 if(stats.live===null||data.birds_caught>stats.live)throw Error("Birds caught exceeds recorded live headcount.");
 if(data.rejects>data.birds_caught)throw Error("Rejects cannot exceed birds caught.");
 if(data.catch_type==="Final Clearance"&&data.birds_caught!==stats.live)throw Error("Final clearance must account for all remaining birds. Reconcile mortality records first.");
 if(data.catch_type==="Thinning"&&data.birds_caught===stats.live)throw Error("Use Final Clearance for all remaining birds.");
 return db.CropCatch.create({...data,owner_id:u.id,logged_at:new Date().toISOString(),logged_by:u.full_name||u.email});
});
