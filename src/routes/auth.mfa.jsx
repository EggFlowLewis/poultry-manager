import {createFileRoute} from "@tanstack/react-router";
import {MfaPage} from "@/components/auth/MfaPage";
export const Route=createFileRoute("/auth/mfa")({ssr:false,head:()=>({meta:[{title:"Poultry Manager | Account Access"},{name:"robots",content:"noindex,nofollow"}]}),component:MfaPage});
