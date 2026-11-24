import {createFileRoute} from "@tanstack/react-router";
import {Page} from "./staff-shifts";
export const Route=createFileRoute("/staff-checkin")({ssr:false,head:()=>({meta:[{title:"Staff Check-In | Poultry Manager"}]}),component:Page});
