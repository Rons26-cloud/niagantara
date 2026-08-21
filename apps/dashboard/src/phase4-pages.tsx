import { FormEvent, useEffect, useState } from 'react';
import { api } from './api';
type Ctx = { permissions:string[]; stores:any[]; accessible_branches:any[] };
function Rows({rows,onOpen}:{rows:any[];onOpen?:(row:any)=>void}) {
  if (!rows.length) return <p className="muted">Belum ada data.</p>;
  const keys=Object.keys(rows[0]).filter(k=>!['notes','address','items','history','receipts','payable','sales','assignments','attendance','work_shifts','transactions'].includes(k)).slice(0,6);
  return <div className="table"><div className="tr head">{keys.map(k=><span key={k}>{k}</span>)}</div>{rows.map((r,i)=><button className="tr phase4-row" key={r.id || i} onClick={()=>onOpen?.(r)}>{keys.map(k=><span key={k}>{String(r[k] || '-')}</span>)}</button>)}</div>;
}
export function CrudPage({kind,company,token,ctx}:{kind:'suppliers'|'customers'|'employees';company:string;token:string;ctx:Ctx}) {
  const singular=kind==='suppliers'?'supplier':kind==='customers'?'customer':'employee';
  const [rows,setRows]=useState<any[]>([]),[detail,setDetail]=useState<any>(),[msg,setMsg]=useState('');
  const [form,setForm]=useState<Record<string,string>>(kind==='employees'?{employeeCode:'',name:'',jobTitle:'',primaryBranchId:ctx.accessible_branches[0]?.id??''}:{code:'',name:'',phone:'',email:''});
  const load=()=>api<any[]>('/'+kind,token,company).then(setRows).catch(()=>setMsg('Data tidak dapat dimuat.'));
  useEffect(()=>{void load()},[kind,company,token]);
  async function submit(e:FormEvent){e.preventDefault();const body=kind==='employees'?form:{[singular+'Code']:form.code,name:form.name,phone:form.phone,email:form.email};try{await api('/'+kind,token,company,{method:'POST',body:JSON.stringify(body)});setMsg('Tersimpan.');load()}catch{setMsg('Validasi atau permission menolak perubahan.')}}
  async function open(r:any){setDetail(await api('/'+kind+'/'+r.id,token,company))}
  async function assign(){const branchId=prompt('Branch ID',ctx.accessible_branches[0]?.id);if(branchId&&detail){await api('/employees/'+detail.id+'/assignments',token,company,{method:'POST',body:JSON.stringify({branchId,isPrimary:true})});setMsg('Branch assigned.');open(detail)}}
  return <><section className="panel"><div className="panel-head"><h2>{kind}</h2><span>{rows.length} records</span></div><Rows rows={rows} onOpen={open}/><p>{msg}</p></section>
  {detail&&<section className="panel"><h2>{detail.name}</h2><Rows rows={[detail]}/>{kind==='customers'&&<Rows rows={detail.sales??[]}/>} {kind==='employees'&&<><Rows rows={detail.assignments??[]}/>{ctx.permissions.includes('employee.assign')&&<button onClick={assign}>Assign branch</button>}</>}</section>}
  {ctx.permissions.includes(singular+'.create')&&<section className="panel"><form className="inline-form" onSubmit={submit}>{Object.keys(form).map(k=><label key={k}>{k}<input required value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})}/></label>)}<button>Simpan</button></form></section>}</>;
}
