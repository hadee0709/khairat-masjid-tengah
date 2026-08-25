"use client";
import {Trash2} from "lucide-react";
export function ConfirmActionButton({action,label,message}:{action:(data:FormData)=>void|Promise<void>;label:string;message:string}){return <button className="btn-danger" type="submit" formAction={action} onClick={e=>{if(!window.confirm(message))e.preventDefault()}}><Trash2 size={15}/>{label}</button>}
