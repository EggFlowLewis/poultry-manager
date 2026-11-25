import {createFileRoute} from "@tanstack/react-router";
import {ForgotPasswordPage} from "@/components/auth/ForgotPasswordPage";
export const Route=createFileRoute("/forgot-password")({ssr:false,head:()=>({meta:[{title:"Poultry Manager | Account Access"},{name:"robots",content:"noindex,nofollow"}]}),component:ForgotPasswordPage});
