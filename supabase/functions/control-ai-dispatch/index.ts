// CONTROL Cloud — supervised Claude/Gemini dispatcher.
// NOT DEPLOYED. Fail-closed: require explicit server feature flags, admin
// account allowlist, provider key, model ID, and atomic per-user/day quota.
// User-authenticated mission is owned by caller, never by another account.
// Public browser never sees API keys. No automatic GitHub writes or deploys.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";
const originAllowed = Deno.env.get("CONTROL_ALLOWED_ORIGIN") || "https://cosscoll.github.io";
const cors=(origin:string|null)=>({
 "Access-Control-Allow-Origin": origin===originAllowed?originAllowed:"null",
 "Access-Control-Allow-Headers":"authorization,apikey,x-client-info,content-type",
 "Access-Control-Allow-Methods":"OPTIONS,POST",
 "Content-Type":"application/json; charset=utf-8",
 "Vary":"Origin","Cache-Control":"no-store",
});
const result=(status:number,data:unknown,origin:string|null)=>new Response(JSON.stringify(data),{status,headers:cors(origin)});
const validUUID=(s:unknown)=>typeof s==="string"&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
Deno.serve(async (req)=>{
 const origin=req.headers.get("Origin");
 if(origin!==originAllowed)return result(403,{error:"Origine non autorisée"},origin);
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers:cors(origin)});
 if(req.method!=="POST")return result(405,{error:"POST requis"},origin);
 if(Deno.env.get("CONTROL_AI_DISPATCH_ENABLED")!=="true")return result(503,{error:"Connexion IA non activée"},origin);
 const url=Deno.env.get("SUPABASE_URL"),secret=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
 const bearer=req.headers.get("Authorization")||"";
 if(!url||!secret||!/^Bearer [A-Za-z0-9._-]+$/.test(bearer))return result(401,{error:"Session valide requise"},origin);
 const admin=createClient(url,secret,{auth:{autoRefreshToken:false,persistSession:false}});
 const {data:session,error:sessionError}=await admin.auth.getUser(bearer.slice(7));
 if(sessionError||!session?.user)return result(401,{error:"Session invalide"},origin);
 const uid=session.user.id;
 const allowed=(Deno.env.get("CONTROL_AI_APPROVED_USER_IDS")||"").split(",").map(x=>x.trim()).filter(Boolean);
 if(!allowed.includes(uid))return result(403,{error:"Compte non autorisé à appeler les API IA"},origin);
 let body:Record<string,unknown>;
 try{body=await req.json()}catch{return result(400,{error:"Requête JSON invalide"},origin)}
 if(!validUUID(body?.missionId)||body?.approved!==true)return result(400,{error:"Validation explicite et identifiant mission requis"},origin);
 const {data:m,error:err}=await admin.from("control_items").select("id,owner_id,project_id,provider,kind,body,status,details,updated_at").eq("id",body.missionId).eq("owner_id",uid).eq("kind","mission").single();
 if(err||!m)return result(404,{error:"Mission introuvable pour ce compte"},origin);
 if(!["Claude","Gemini"].includes(m.provider)||m.status!=="todo"||!m.project_id||!m.body?.trim()||m.body.length>7000)
  return result(409,{error:"Mission non exécutable ou déjà traitée"},origin);
 const provider=m.provider as "Claude"|"Gemini";
 // Both provider-specific permissions default to disabled, independently of the global flag.
 if(Deno.env.get("CONTROL_AI_ALLOW_"+provider.toUpperCase())!=="true")return result(403,{error:"Fournisseur non autorisé"},origin);
 const key=Deno.env.get(provider==="Claude"?"CONTROL_CLAUDE_API_KEY":"CONTROL_GEMINI_API_KEY");
 const model=Deno.env.get(provider==="Claude"?"CONTROL_CLAUDE_MODEL":"CONTROL_GEMINI_MODEL");
 if(!key||!model||!/^[a-zA-Z0-9._-]{3,90}$/.test(model))return result(503,{error:"Fournisseur non configuré"},origin);
 const cap=Number(Deno.env.get("CONTROL_AI_DAILY_LIMIT")||"0");
 if(!Number.isInteger(cap)||cap<1||cap>10)return result(503,{error:"Quota de protection non configuré"},origin);
 const claim=await admin.rpc("control_claim_ai_quota",{p_owner:uid,p_provider:provider,p_cap:cap});
 if(claim.error||claim.data!==true)return result(429,{error:"Quota journalier épuisé ou non accessible"},origin);
 // Atomic claim prevents duplicate provider invocations from repeated taps.
 const claimed=await admin.from("control_items").update({status:"doing",updated_at:new Date().toISOString(),
 details:{...(m.details||{}),dispatchState:"working",dispatchStartedAt:new Date().toISOString()}})
 .eq("id",m.id).eq("owner_id",uid).eq("status","todo").eq("updated_at",m.updated_at).select("id").single();
 if(claimed.error||!claimed.data)return result(409,{error:"Mission déjà réclamée; aucune requête API émise"},origin);
 try{
  let endpoint:string,headers:Record<string,string>,payload:unknown;
  if(provider==="Claude"){
   endpoint="https://api.anthropic.com/v1/messages";
   headers={"content-type":"application/json","x-api-key":key,"anthropic-version":"2023-06-01"};
   payload={model,max_tokens:1200,messages:[{role:"user",content:m.body}]};
  }else{
   endpoint="https://generativelanguage.googleapis.com/v1beta/models/"+encodeURIComponent(model)+":generateContent";
   headers={"content-type":"application/json","x-goog-api-key":key};
   payload={contents:[{role:"user",parts:[{text:m.body}]}],generationConfig:{maxOutputTokens:1200}};
  }
  const response=await fetch(endpoint,{method:"POST",headers,body:JSON.stringify(payload),signal:AbortSignal.timeout(50000)});
  if(!response.ok)throw new Error("provider_http_"+response.status);
  const data=await response.json();
  let answer=provider==="Claude"?
   (data.content||[]).filter((x:{type:string})=>x.type==="text").map((x:{text:string})=>x.text).join("\n"):
   (data.candidates?.[0]?.content?.parts||[]).map((x:{text?:string})=>x.text||"").join("\n");
  if(!answer||typeof answer!=="string")throw new Error("empty_provider_response");
  answer=answer.slice(0,14000);
  const now=new Date().toISOString();
  const update=await admin.from("control_items").update({status:"review",updated_at:now,
   details:{...(m.details||{}),dispatchState:"returned",result:answer,origin:"api",resultUpdatedAt:now,model,
    proofUrl:"",verified:false}}).eq("id",m.id).eq("owner_id",uid).eq("status","doing").select("id").single();
  if(update.error||!update.data)throw new Error("result_storage_failed");
  // Never expose model credentials or raw provider diagnostic payloads to browser.
  return result(200,{ok:true,missionId:m.id,provider,status:"review",model,returnedAt:now},origin);
 }catch(error){
  const now=new Date().toISOString();
  await admin.from("control_items").update({status:"error",updated_at:now,
   details:{...(m.details||{}),dispatchState:"failed",errorCode:"provider_or_storage_error",resultUpdatedAt:now}})
   .eq("id",m.id).eq("owner_id",uid).eq("status","doing");
  // Intentionally do not log provider response body, messages, API keys, or tokens.
  return result(502,{error:"Appel IA impossible; consulte les statuts dans CONTROL sans relancer automatiquement"},origin);
 }
});
