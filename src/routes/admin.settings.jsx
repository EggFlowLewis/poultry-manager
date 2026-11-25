import {createFileRoute} from "@tanstack/react-router";
import {PlatformAdmin} from "@/components/PlatformAdmin";
export const Route=createFileRoute("/admin/settings")({ssr:false,head:()=>({meta:[{title:"Super Admin | Poultry Manager"},{name:"robots",content:"noindex,nofollow"}]}),component:()=> <PlatformAdmin page="settings"/>});
