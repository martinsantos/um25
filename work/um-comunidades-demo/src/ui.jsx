import React,{useRef,useEffect} from 'react';
import {X} from 'lucide-react';
export const money=v=>new Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS',minimumFractionDigits:Number.isInteger(v)?0:2,maximumFractionDigits:2}).format(v);
export const date=v=>v?new Date(v.length===10?v+'T12:00:00':v).toLocaleDateString('es-AR',{day:'2-digit',month:'short',year:'numeric'}):'Sin fecha declarada';
export const initials=name=>name.split(' ').filter(Boolean).slice(0,2).map(x=>x[0]).join('');
export function download(content,name,type){const url=URL.createObjectURL(new Blob([content],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
export function Badge({children,tone}){let t=tone||(children==='Vigente'||children==='Resuelto'||children==='Finalizado'||children==='Al día'||children==='Pago simulado'?'green':children==='Suspendida'||children==='Vencida'?'red':'amber');return <span className={'badge '+t}>{children}</span>}
export function Modal({title,children,onClose}){const ref=useRef();useEffect(()=>{let old=document.activeElement;const el=ref.current;el.showModal();el.querySelector('input,select,textarea,button')?.focus();return()=>{el.close();old?.focus();};},[]);return <dialog ref={ref} onCancel={e=>{e.preventDefault();onClose();}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}><div className="modal-head"><h2>{title}</h2><button className="icon-btn" aria-label="Cerrar" onClick={onClose}><X size={21}/></button></div>{children}</dialog>}
