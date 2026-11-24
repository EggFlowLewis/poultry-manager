import test from "node:test";import assert from "node:assert/strict";import {templates,templateCSV,parseCSV,validateCSV,archiveMetrics} from "../src/lib/csv-import.js";
const now=new Date("2026-11-24T12:00:00Z");
for(const type of Object.keys(templates))test(type+" template round trip",()=>{const p=validateCSV(type,templateCSV(type),now);assert.equal(p.rows.length,2);assert.equal(p.errors.length,0);});
test("quoted CSV, BOM, embedded comma and escaped quote",()=>assert.deepEqual(parseCSV('\uFEFFa,b\r\n"one,two","a""b"'),[["a","b"],["one,two",'a"b']]));
test("missing headers prevent writes",()=>{const p=validateCSV("logs","shed,shift\nShed 1,Morning Check",now);assert.ok(p.missing.includes("logged_at"));assert.equal(p.rows.length,0);});
test("invalid rows rejected without losing valid rows",()=>{const p=validateCSV("logs",templateCSV("logs").replace('"65"','"105"'),now);assert.equal(p.rows.length,1);assert.equal(p.errors[0].row,2);});
test("optional feed price",()=>{const p=validateCSV("deliveries",templateCSV("deliveries").replace('"350"','""'),now);assert.equal(p.rows.length,2);assert.equal(p.rows[0].value.cost_per_tonne,undefined);});
test("historical crop summary",()=>{const r=validateCSV("archive",templateCSV("archive"),now).rows[0].value,m=archiveMetrics(r);assert.equal(m.age,42);assert.equal(m.liv,97);assert.equal(m.fcr,43000/27000);assert.ok(m.epef>0);});
test("invalid quoting rejected",()=>assert.throws(()=>parseCSV('a,b\n"unterminated')));
