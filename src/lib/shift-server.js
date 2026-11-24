import { createServerFn } from "@tanstack/react-start";
import { currentBiosecurity } from "@/lib/farm-controls";
import { z } from "zod";
import { requireUser } from "@/lib/auth-middleware";
const today=()=>new Intl.DateTimeFormat("en-CA",{timeZone:"Europe/London",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
const email=u=>String(u.email||"").trim().toLowerCase();
const checkInput=z.object({assignment:z.string().min(1).max(128),shed:z.string().min(1).max(150),shift:z.enum(["Morning Check","Evening Check"]),dead:z.number().int().min(0).max(10000000),culls:z.number().int().min(0).max(10000000),feed:z.number().min(0).max(10000000),water:z.number().min(0).max(1000000000),temp:z.number().min(-50).max(70),humidity:z.number().min(0).max(100),aipz_disinfectant:z.boolean().optional(),aipz_wild_bird:z.boolean().optional()});
export const getShiftData=createServerFn({method:"GET"}).middleware([requireUser]).handler(async({context})=>{
 const u=context.user,db=context.getBase44().asServiceRole.entities,day=today();
 if(u.role==="admin"){const [assignments,crops,checks]=await Promise.all([db.StaffAssignment.filter({owner_id:u.id}),db.CropCycle.filter({created_by_id:u.id}),db.ShedCheck.filter({owner_id:u.id,day})]);return {mode:"owner",assignments,crops:crops.map(c=>({shed:c.shed})),checks,day};}
 const assignments=await db.StaffAssignment.filter({staff_email:email(u)});
 const checks=await db.ShedCheck.filter({staff_id:u.id,day});
 return {mode:"staff",assignments:await Promise.all(assignments.map(async a=>({id:a.id,sheds:a.sheds,aipz:await currentBiosecurity(db,a.owner_id)}))),checks:checks.filter(c=>assignments.some(a=>a.owner_id===c.owner_id&&a.sheds.includes(c.shed))),day};
});
export const saveShift=createServerFn({method:"POST"}).middleware([requireUser]).validator(checkInput).handler(async({context,data})=>{
 const u=context.user;if(u.role==="admin")throw Error("Use a stockperson account to log checks.");
 const db=context.getBase44().asServiceRole.entities;
 const matches=await db.StaffAssignment.filter({id:data.assignment,staff_email:email(u)});
 const assignment=matches[0];if(!assignment||!assignment.sheds.includes(data.shed))throw Error("Shed not assigned to your account.");
 const day=today(),existing=await db.ShedCheck.filter({owner_id:assignment.owner_id,shed:data.shed,shift:data.shift,day});
 if(existing.length)throw Error("This shed shift is already completed today.");
 const aipz=await currentBiosecurity(db,assignment.owner_id);if(aipz&&(!data.aipz_disinfectant||!data.aipz_wild_bird))throw Error("Complete both AIPZ checks before submitting.");const {assignment:ignored,...values}=data;
 return db.ShedCheck.create({...values,aipz_required:aipz,owner_id:assignment.owner_id,staff_id:u.id,staff_name:u.full_name||assignment.staff_name,logged_at:new Date().toISOString(),day});
});
export const saveStaff=createServerFn({method:"POST"}).middleware([requireUser]).validator(z.object({staff_name:z.string().trim().min(1).max(100),staff_email:z.string().trim().email().max(200),sheds:z.array(z.string().trim().min(1).max(150)).min(1).max(200)})).handler(async({context,data})=>{
 const u=context.user;if(u.role!=="admin")throw Error("Owner access required.");
 const db=context.getBase44().asServiceRole.entities;const staff_email=data.staff_email.toLowerCase();if(staff_email===email(u))throw Error("Choose a staff email different from your own.");
 const existing=await db.StaffAssignment.filter({owner_id:u.id,staff_email});
 const values={...data,staff_email,sheds:[...new Set(data.sheds)],owner_id:u.id};
 return existing.length?db.StaffAssignment.update(existing[0].id,values):db.StaffAssignment.create(values);
});
