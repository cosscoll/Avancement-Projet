/* CONTROL 24 — Project-only read-only overview: no API or storage writes. */
(function(root){
'use strict';
const obj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function validDate(s){if(typeof s!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(s))return false;const d=new Date(s+'T00:00:00Z');return Number.isFinite(+d)&&d.toISOString().slice(0,10)===s;}
function safeUrl(s){try{const u=new URL(s);return u.protocol==='https:'&&!u.username&&!u.password&&!Array.from(u.searchParams.keys()).some(k=>/^(token|access_token|api_key|secret|password|code)$/i.test(k))?u.href:''}catch{return''}}
function summarize(project,local,raw,now=new Date()){
 if(!obj(project)||typeof project.id!=='string'||!project.id)return{status:'invalid',projectId:''};
 const id=project.id,d=obj(local)?local:{};let actions=[],status='ok';
 try{const data=raw==null||raw===''?{}:typeof raw==='string'?JSON.parse(raw):raw;if(!obj(data)||data.actions!==undefined&&!Array.isArray(data.actions))throw Error('Invalid tasks');actions=data.actions||[]}catch{status='invalid'}
 const day=[now.getFullYear(),String(now.getMonth()+1).padStart(2,'0'),String(now.getDate()).padStart(2,'0')].join('-');
 const assigned=actions.filter(x=>obj(x)&&x.project===id&&typeof x.title==='string'&&x.title.trim()&&x.status!=='cancelled');
 const pending=assigned.filter(x=>x.status!=='done');
 const level=x=>validDate(x.due)&&x.due<day?0:validDate(x.due)&&x.due===day?1:x.priority==='Critique'?2:x.status==='doing'?3:4;
 const tasks=pending.slice().sort((a,b)=>level(a)-level(b)||String(a.due||'9999').localeCompare(String(b.due||'9999'))||a.title.localeCompare(b.title,'fr')).slice(0,3).map(x=>({id:typeof x.id==='string'?x.id:'',title:x.title,label:level(x)===0?'En retard':level(x)===1?'Aujourd’hui':x.status==='doing'?'En cours':'À faire'}));
 const notes=typeof d.memo==='string'?d.memo.trim():'';
 const reports=obj(d.reports)?Object.entries(d.reports).filter(([key,r])=>obj(r)&&typeof r.text==='string'&&r.text.trim()).sort((a,b)=>String(b[1].updatedAt||'').localeCompare(String(a[1].updatedAt||''))):[];
 const links=[],seen=new Set();
 const add=(label,url)=>{const u=safeUrl(url);if(u&&!seen.has(u)){seen.add(u);links.push({label:String(label||'Ressource').slice(0,90),url:u})}};
 if(typeof project.repo==='string'&&/^[\w.-]+$/.test(project.repo))add('Dépôt GitHub','https://github.com/cosscoll/'+encodeURIComponent(project.repo));
 if(obj(project.website))add(project.website.label||'Site web',project.website.url);
 for(const item of [...(Array.isArray(project.other_sites)?project.other_sites:[]),...(Array.isArray(d.links)?d.links:[])])if(obj(item))add(item.label,item.url);
 return{status,projectId:id,open:pending.length,overdue:pending.filter(x=>level(x)===0).length,tasks:status==='ok'?tasks:[],notes,report:reports.length?{provider:reports[0][0],date:String(reports[0][1].updatedAt||'').slice(0,10)}:null,links:links.slice(0,4)};
}
root.CONTROL_PROJECT_BRIEF={summarize,safeUrl,esc};
if(typeof module==='object'&&module.exports)module.exports=root.CONTROL_PROJECT_BRIEF;
})(typeof window==='object'?window:globalThis);
