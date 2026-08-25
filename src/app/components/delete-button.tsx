"use client";
import { Trash2 } from "lucide-react";
import "./delete-button.css";
export function DeleteButton({action,id,entity,label="Padam",message="Rekod ini akan dipadam secara kekal. Teruskan?"}:{action:(data:FormData)=>void|Promise<void>;id:string;entity?:string;label?:string;message?:string}){
  return <form action={action} onSubmit={e=>{if(!window.confirm(message))e.preventDefault()}}><input type="hidden" name="id" value={id}/>{entity&&<input type="hidden" name="entity" value={entity}/>}<button className="btn-danger" type="submit"><Trash2 size={15}/>{label}</button></form>;
}
