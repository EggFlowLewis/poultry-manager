export const memoryHours=12;
export function validMemory(record,now=Date.now()){return !!record&&typeof record.visitId==="string"&&typeof record.secret==="string"&&Number.isFinite(record.arrived)&&now>=record.arrived&&now-record.arrived<12*3600000;}
export function onSite(visit){return !visit.departure_at;}
export function normalizePlate(value){return String(value||"").toUpperCase().replace(/[^A-Z0-9]/g,"");}
