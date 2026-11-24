import {createFileRoute} from "@tanstack/react-router";
import {Page} from "@/components/StaffCheckinPage";
export const Route=createFileRoute("/staff-shifts")({ssr:false,head:()=>({meta:[{title:"Staff Check-In | Poultry Manager"}]}),component:Page});
