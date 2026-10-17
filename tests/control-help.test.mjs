import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const file=(name)=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
const code=file('assets/control-help.js');
const faq=JSON.parse(file('data/help-center.json'));
const deployments=JSON.parse(file('data/deployment-guides.json'));
const catalog=JSON.parse(file('data/ai-tool-libraries.json'));
const responses={
 './data/help-center.json':faq,
 './data/deployment-guides.json':deployments,
 './data/ai-tool-libraries.json':catalog,
};
function createApp(mode='personal',summary={projects:3,current:'UCP',openActions:2,missions:4}){
 const w={};
 const document={readyState:'loading',addEventListener(){}};
 const pathname=mode==='cloud'?'/Avancement-Projet/app.html':'/Avancement-Projet/index.html';
 const fetch=async path=>({ok:true,json:async()=>responses[path]});
 new Function('window','document','fetch','location',code)(w,document,fetch,{pathname,hash:''});
 w.CONTROL_HELP.setAdapter({mode,isAuthenticated:()=>mode!=='cloud',getSummary:()=>summary});
 return w.CONTROL_HELP;
}
test('Help engine reads editorial sources, not external private services',async()=>{
 assert.ok(faq.entries.length>=30);
 const bot=createApp(),counts=await bot.load();
 assert.equal(counts.kb,faq.entries.length);
 assert.equal(counts.guides,10);
 assert.equal(counts.tools,87);
 assert.doesNotMatch(code,/Bearer\s+[^'"\s]+|service_role\s*:/);
});
test('Grounded questions route to the relevant CONTROL module or official guide',async()=>{
 const bot=createApp();
 const questions=[
 ['Comment connecter mon projet ChatGPT ?','chatgpt'],
 ['Comment publier mon site sur GitHub Pages ?','guide:github-pages'],
 ['Comment mettre en ligne sur IONOS en SFTP ?','guide:ionos-sftp'],
 ['Comment publier sur Vercel ?','guide:vercel'],
 ['Quels outils pour créer un site 3D ?','course:3d'],
 ['Quels outils pour créer un agent IA ?','course:agents'],
 ['Comment utiliser Three.js ?','tool:web3d-three-js'],
 ['Comment synchroniser Claude ?','claude'],
 ['Combien de projets ai-je ?','my-projects'],
 ['Combien de missions ai-je ?','my-tasks'],
 ['Comment sauvegarder mes projets ?','sauvegarde'],
 ['Comment connecter GitHub à CONTROL ?','integrations'],
 ['Erreur 404 après le déploiement','deploy-check'],
 ];
 for(const [q,id] of questions){const result=await bot.lookup(q);assert.equal(result.subject,id,q);assert.ok(result.answer.length>55,q)}
});
test('Unknown or sensitive questions do not receive made-up answers',async()=>{
 const bot=createApp();
 const res=await bot.lookup("Quel est le code secret du compte bancaire de mon voisin ?");
 assert.match(res.title,/pas trouvé/);
 assert.doesNotMatch(res.answer,/\d{6,}/);
});
test('Cloud beta help never pretends an account is active',async()=>{
 const bot=createApp('cloud',null);
 const answer=await bot.lookup('Comment publier un site sur GitHub Pages ?');
 assert.match(answer.answer,/Cloud.*préparation/);
 assert.equal(answer.actions.length,0);
});
test('No user chat transcript, auth secret, or provider cookie is stored in app code',()=>{
 assert.doesNotMatch(code,/localStorage\.setItem|sessionStorage\.setItem|indexedDB\.open/);
 assert.doesNotMatch(code,/createClient|Authorization:\s*['"]/);
 assert.match(file('index.html'),/assets\/control-help\.js/);
 assert.match(file('app.html'),/assets\/control-help\.js/);
 assert.match(file('service-worker.js'),/help-center\.json/);
 assert.equal(JSON.parse(file('config/cloud.json')).enabled,false);
});
