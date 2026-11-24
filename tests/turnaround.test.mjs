import test from "node:test";import assert from "node:assert/strict";import {turnaround,steps} from "../src/lib/turnaround.js";
const crop={id:"c1",shed:"S1",placement_date:"2026-10-01"},final={id:"f1",crop_id:"c1",catch_type:"Final Clearance"};
const events=steps.map((_,i)=>({shed:"S1",cycle_key:"c1:f1",step:i+1,completed:true,logged_at:"2026-11-24T09:00:00Z",logged_by:"Staff"}));
test("six distinct steps clear only current cycle",()=>{assert.equal(turnaround("S1",[crop],[final],events).count,6);assert.equal(turnaround("S2",[crop],[final],events).count,0);});
test("occupied shed cannot be cleared",()=>{const r=turnaround("S1",[crop],[],events);assert.equal(r.occupied,true);assert.equal(r.count,0);});
test("new placement resets previous turnaround",()=>{const r=turnaround("S1",[crop,{...crop,id:"c2",placement_date:"2026-11-24"}],[final],events);assert.equal(r.count,0);assert.equal(r.occupied,true);});
test("reopening a step invalidates completion and retains attribution",()=>{const r=turnaround("S1",[crop],[final],[...events,{...events[0],completed:false,logged_at:"2026-11-24T10:00:00Z",logged_by:"Owner"}]);assert.equal(r.count,5);assert.equal(r.steps[0].last.logged_by,"Owner");});
test("initial shed checklist independent of old crops",()=>{assert.equal(turnaround("S1",[],[],events).count,0);assert.equal(turnaround("S1",[],[],[{...events[0],cycle_key:"initial"}]).count,1);});
