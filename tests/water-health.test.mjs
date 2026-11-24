import test from "node:test";import assert from "node:assert/strict";import {waterDay,waterAlerts} from "../src/lib/water-health.js";
const row=(day,shift,water,feed=500,shed="Shed 1")=>({day,shift:shift+" Check",water,feed,shed});
const logs=[row("2026-11-22","Evening",1000),row("2026-11-23","Morning",2000),row("2026-11-23","Evening",3000),row("2026-11-24","Morning",3800),row("2026-11-24","Evening",4720)];
test("meter differences and daily feed",()=>assert.deepEqual(waterDay(logs,"Shed 1","2026-11-24"),{water:1720,feed:1000,ratio:1.72}));
test("14 percent drop triggers once per shed",()=>{const a=waterAlerts(logs,["Shed 1","Shed 1"],"2026-11-24");assert.equal(a.length,1);assert.equal(a[0].drop,14);});
test("exactly 10 percent is not an alert",()=>assert.equal(waterAlerts([...logs.slice(0,-1),row("2026-11-24","Evening",4800)],["Shed 1"],"2026-11-24").length,0));
test("partial day and reset do not trigger",()=>{assert.equal(waterAlerts(logs.slice(0,-1),["Shed 1"],"2026-11-24").length,0);assert.equal(waterDay([...logs.slice(0,-1),row("2026-11-24","Evening",20)],"Shed 1","2026-11-24"),null);});
test("zero feed and missing baseline",()=>{assert.equal(waterDay(logs.slice(1),"Shed 1","2026-11-23"),null);const r=logs.map(x=>({...x,feed:0}));assert.equal(waterDay(r,"Shed 1","2026-11-24").ratio,null);});
test("duplicate shift invalidates day and other sheds isolated",()=>{assert.equal(waterDay([...logs,logs.at(-1)],"Shed 1","2026-11-24"),null);assert.equal(waterDay(logs,"Shed 2","2026-11-24"),null);});