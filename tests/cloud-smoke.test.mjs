import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const source = read('assets/cloud-app.js');
const sql = read('supabase/migrations/20261017_control_saas_v1.sql');

test('Cloud setup remains disabled until isolated backend is reviewed', () => {
  assert.equal(JSON.parse(read('config/cloud.json')).enabled, false);
  assert.match(read('app.html'), /Content-Security-Policy/);
  assert.match(read('service-worker.js'), /path==='app.html'/);
  assert.doesNotMatch(read('config/cloud.json'), /sb_service_role_/);
});
test('SQL isolates owned rows and project-item relationships', () => {
  assert.equal((sql.match(/create table /g) || []).length, 6);
  assert.equal((sql.match(/create policy /g) || []).length, 22);
  assert.match(sql, /foreign key \(project_id, owner_id\)/);
  assert.match(sql, /revoke all on public\.control_profiles[\s\S]+ from anon/);
  assert.match(sql, /with check \(owner_id = \(select auth\.uid\(\)\)\)/);
});
test('Cloud JavaScript is syntactically valid and renders major pages without data leakage', async () => {
  new Function(source);
  const elements = new Map();
  function node(id) {
    if (!elements.has(id)) elements.set(id, {
      innerHTML:'', textContent:'', value:'', hidden:false, style:{}, disabled:false,
      classList:{add(){},remove(){},toggle(){}}, addEventListener(){},
      querySelector(){return node('child')}, querySelectorAll(){return []},
    });
    return elements.get(id);
  }
  const doc={getElementById:node,querySelectorAll(){return []},addEventListener(){}};
  const win={scrollTo(){}};
  const fetch=async()=>({ok:true,json:async()=>({enabled:false})});
  const fakeNav={clipboard:{writeText:async()=>{}}};
  const location={origin:'https://cosscoll.github.io',pathname:'/Avancement-Projet/app.html'};
  const app=new Function('document','window','fetch','navigator','location',source+
    '\nreturn {setDemo(u,p,i){authUser=u;cache={projects:p,items:i,preferences:null}},nav,setTools(t){toolTab=t;nav("tools")},safeURL};'
  )(doc,win,fetch,fakeNav,location);
  const fakeProject={id:'p1',name:'<img src=x onerror=alert(1)>',category:'Demo'};
  const fakeItem={id:'i1',kind:'ai_space',project_id:'p1',title:'Claude',provider:'Claude',
    url:'https://claude.ai/projects/123',body:'',status:'',updated_at:'2026-10-17T15:00:00Z'};
  app.setDemo({id:'u1',email:'tester@example.org'},[fakeProject],[fakeItem]);
  const pages=['projects','inbox','missions','automations','manager','tools','account'];
  for(const page of pages){app.nav(page);assert.ok(node('page').innerHTML.length>150,page)}
  app.nav('project','p1','ai_space');
  const html=node('page').innerHTML;
  assert.ok(html.includes('&lt;img src=x'));
  assert.ok(!html.includes('<img src=x'));
  assert.ok(html.includes('https://claude.ai/projects/123'));
  for(const t of ['library','calendar','budget','memory','search','backup']) {
    app.setTools(t);
    assert.ok(node('page').innerHTML.length>150,'tools/'+t);
  }
  assert.equal(app.safeURL('https://example.com?access_token=abc'), '');
  assert.equal(app.safeURL('http://example.com'), '');
  assert.equal(app.safeURL('https://example.com/valid'), 'https://example.com/valid');
});
