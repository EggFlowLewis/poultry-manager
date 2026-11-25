import {createFileRoute} from "@tanstack/react-router";
import {LoginPage} from "@/components/auth/LoginPage";
export const Route=createFileRoute("/login")({ssr:false,head:()=>({meta:[{title:"Poultry Manager | Account Access"},{name:"robots",content:"noindex,nofollow"}]}),component:LoginPage});
