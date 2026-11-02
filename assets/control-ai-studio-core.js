/* CONTROL AI Studio — local-only verified import and private agent state. No network calls. */
(()=>{'use strict';
const KEY='control-ai-studio-v1';
const LIMIT_BYTES=1750000;
const clean=(s,n=4000)=>String(s??'').slice(0,n);
const isObj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const list=x=>Array.isArray(x)?x:[];
const empty=()=>({version:1,imports:[],memories:[],agents:[]});
const safeId=id=>typeof id==='string'&&/^[a-z0-9_-]{1,100}$/i.test(id);
function read(storage){
 let raw;try{raw=storage.getItem(KEY)}catch{return {state:null,raw:null,error:'Stockage local indisponible.'}}
 if(raw===null)return {state:empty(),raw:null,error:null};
 try{
  const v=JSON.parse(raw);
  if(!isObj(v)||v.version!==1||!Array.isArray(v.imports)||!Array.isArray(v.memories)||!Array.isArray(v.agents))throw Error('invalid');
  return {state:v,raw,error:null};
 }catch{return {state:null,raw,error:'Données IA Studio illisibles. Ne les écrase pas : récupère-les avant toute modification.'}}
}
function write(storage,state,raw){
 if(!isObj(state)||state.version!==1)throw Error('Structure de données non valide.');
 const next=JSON.stringify(state);
 if(next.length>LIMIT_BYTES)throw Error('Espace local presque plein : archive trop volumineuse pour cette version. Aucune donnée importée.');
 if(storage.getItem(KEY)!==raw)throw Error('Les données ont changé dans un autre onglet. Recharge CONTROL avant de modifier.');
 storage.setItem(KEY,next);
 return next;
}
function hash(text){let h=2166136261;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619)}return (h>>>0).toString(36)}
function parts(x){
 if(typeof x==='string')return x;
 if(Array.isArray(x))return x.map(parts).filter(Boolean).join('\n');
 if(isObj(x)&&typeof x.text==='string')return x.text;
 if(isObj(x)&&typeof x.content==='string')return x.content;
 if(isObj(x)&&Array.isArray(x.parts))return parts(x.parts);
 return '';
}
function role(x){const v=String(x||'').toLowerCase();if(['user','human'].includes(v))return 'user';if(['assistant','ai','model'].includes(v))return 'assistant';return null}
function messages(rows){
 const out=[];
 for(const x of list(rows)){
  const r=role(x?.role||x?.sender||x?.author?.role);
  const content=clean(parts(x?.content??x?.text??x?.message?.content),3500).trim();
  if(r&&content)out.push({role:r,content});
  if(out.length>1500)throw Error('Plus de 1 500 messages dans une discussion. Import refusé : aucune troncature silencieuse.');
 }
 return out;
}
function chatgptMessage(node){
 const m=node?.message;
 if(!m||m.status==='in_progress')return null;
 const r=role(m.author?.role);
 const content=clean(parts(m.content?.parts||m.content),3500).trim();
 return r&&content?{role:r,content,time:Number(m.create_time)||0}:null;
}
function chatgptConversation(x){
 const mapping=x.mapping;
 if(!isObj(mapping))return null;
 const nodes=Object.entries(mapping).slice(0,8000);
 const chain=[];let current=typeof x.current_node==='string'?x.current_node:null;
 if(current&&mapping[current]){
  const seen=new Set();
  while(current&&mapping[current]&&!seen.has(current)&&seen.size<8000){seen.add(current);const n=mapping[current];const m=chatgptMessage(n);if(m)chain.push(m);current=n.parent}
  chain.reverse();
 }else{
  for(const [,node] of nodes){const m=chatgptMessage(node);if(m)chain.push(m)}
  chain.sort((a,b)=>a.time-b.time);
 }
 return {title:clean(x.title||'Conversation ChatGPT',120),sourceId:clean(x.id||x.conversation_id||'',100),messages:chain.map(({role,content})=>({role,content}))};
}
function parse(provider,text,filename='export.json'){
 if(!['chatgpt','claude','gemini'].includes(provider))throw Error('Fournisseur inconnu.');
 if(typeof text!=='string'||!text.trim()||text.length>9000000)throw Error('Fichier vide ou supérieur à 9 Mo : import refusé.');
 if(/\.txt$/i.test(filename)&&text.length>3500)throw Error('Fichier TXT trop long (3 500 caractères) : import refusé pour ne pas tronquer son contenu.');
 let rows;
 if(/\.txt$/i.test(filename)){
  rows=[{title:clean(filename,120),sourceId:'',messages:[{role:'user',content:clean(text,3500)}]}];
 }else{
  let input;try{input=JSON.parse(text)}catch{throw Error('JSON invalide : choisis une archive JSON ou un fichier .txt. Les archives ZIP doivent être décompressées.')}
  const data=Array.isArray(input)?input:Array.isArray(input?.conversations)?input.conversations:[];
  if(!data.length)throw Error('Aucune discussion reconnue. Décompresse l’export et choisis conversations.json, ou importe du texte.');
  rows=[];
  for(const c of data){
   if(!isObj(c))continue;
   if(provider==='chatgpt'&&isObj(c.mapping)){
    const conv=chatgptConversation(c);if(conv&&conv.messages.length)rows.push(conv);
   }else if(provider==='claude'&&Array.isArray(c.chat_messages)){
    const conv={title:clean(c.name||c.title||'Conversation Claude',120),sourceId:clean(c.uuid||c.id||'',100),messages:messages(c.chat_messages)};
    if(conv.messages.length)rows.push(conv);
   }else if(Array.isArray(c.messages)){
    const conv={title:clean(c.title||c.name||'Conversation importée',120),sourceId:clean(c.id||c.uuid||'',100),messages:messages(c.messages)};
    if(conv.messages.length)rows.push(conv);
   }else if(provider==='gemini'&&typeof c.title==='string'&&(c.header||c.time||c.details)){
    // Google Takeout activity can expose prompts only; never invent assistant answers.
    const content=clean(c.title,3500).trim();if(content)rows.push({title:'Activité Gemini',sourceId:clean(c.time||'',100),messages:[{role:'user',content}]});
   }
   if(rows.length>180)throw Error('Plus de 180 conversations : export trop volumineux pour ce stockage local.');
  }
 }
 if(!rows.length)throw Error('Aucun message textuel exploitable dans cet export. Les contenus multimodaux ne sont pas importés.');
 return rows.map((x,i)=>{
  const data={provider,title:x.title||'Conversation importée',messages:x.messages,sourceId:x.sourceId||''};
  const fingerprint=hash(JSON.stringify(data));
  return {...data,id:'imp-'+provider+'-'+fingerprint, fingerprint, importedAt:'',fileName:clean(filename,120),index:i};
 });
}
function importRows(state,rows){
 const next=structuredClone(state);let added=0;
 const ids=new Set(next.imports.map(c=>c.id));
 for(const row of rows){if(ids.has(row.id))continue;next.imports.push({...row,importedAt:new Date().toISOString()});ids.add(row.id);added++}
 return {state:next,added,duplicates:rows.length-added};
}
function memory(state,{title,content,conversationId='',projectId='general'}){
 if(!clean(title,100).trim()||!clean(content,1600).trim())throw Error('Renseigne un titre et un contenu de mémoire.');
 if(conversationId&&!state.imports.some(c=>c.id===conversationId))throw Error('Conversation source introuvable.');
 const id='mem-'+hash(String(Date.now())+Math.random()+title);
 return {id,title:clean(title.trim(),100),content:clean(content.trim(),1600),conversationId,projectId:clean(projectId,100),createdAt:new Date().toISOString()};
}
function agent(state,{name,instructions,projectId='general',conversationIds=[],memoryIds=[]}){
 if(!String(name||'').trim()||!String(instructions||'').trim())throw Error('Nom et instructions requis.');
 const sources=[...new Set(conversationIds)].filter(id=>state.imports.some(x=>x.id===id));
 const memories=[...new Set(memoryIds)].filter(id=>state.memories.some(x=>x.id===id&&(x.projectId==='general'||x.projectId===projectId)));
 return {id:'agt-'+hash(Date.now()+'-'+Math.random()+'-'+name),name:clean(name.trim(),90),instructions:clean(instructions.trim(),1300),projectId:clean(projectId,100),conversationIds:sources,memoryIds:memories,threads:[{id:'thr-'+hash(Date.now()+'-'+Math.random()),name:'Première discussion',messages:[]}],createdAt:new Date().toISOString()};
}
function context(state,ag){
 const allowed=ag.memoryIds.map(id=>state.memories.find(m=>m.id===id)).filter(x=>x&&(x.projectId==='general'||x.projectId===ag.projectId));
 const sources=ag.conversationIds.map(id=>state.imports.find(c=>c.id===id)).filter(Boolean);
 let result='Rôle de l’agent (choisi par l’utilisateur) : '+clean(ag.instructions,900)+'\n';
 for(const m of allowed)result+='\nMémoire validée '+clean(m.title,60)+' : '+clean(m.content,550)+'\n';
 for(const c of sources)result+='\nSource importée en lecture seule ('+c.provider+', '+clean(c.title,60)+') : '+c.messages.slice(-2).map(x=>x.role+' : '+clean(x.content,140)).join(' | ')+'\n';
 return result.slice(0,1800);
}
window.CONTROL_AI_STUDIO_CORE=Object.freeze({KEY,read,write,parse,importRows,memory,agent,context,empty});
})();