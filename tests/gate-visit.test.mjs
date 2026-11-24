import test from "node:test";import assert from "node:assert/strict";import {validMemory,onSite,normalizePlate} from "../src/lib/gate-visit.js";
const now=Date.parse("2026-11-24T20:00:00Z"),m={visitId:"visit",secret:"secret",arrived:now-3600000};
test("recognises active browser memory under 12 hours",()=>assert.equal(validMemory(m,now),true));
test("expires memory at 12 hours",()=>assert.equal(validMemory({...m,arrived:now-12*3600000},now),false));
test("rejects malformed or future browser memory",()=>{assert.equal(validMemory(null,now),false);assert.equal(validMemory({...m,secret:undefined},now),false);assert.equal(validMemory({...m,arrived:now+1},now),false);});
test("departure retains visit but removes on-site status",()=>{assert.equal(onSite({}),true);assert.equal(onSite({departure_at:"2026-11-24T20:00:00Z"}),false);});
test("plate normalisation",()=>assert.equal(normalizePlate("ab12 cde"),"AB12CDE"));
