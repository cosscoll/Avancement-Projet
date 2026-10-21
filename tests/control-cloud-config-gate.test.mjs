import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const cloud=readFileSync(new URL('../assets/cloud-app.js',import.meta.url),'utf8');
const actual=JSON.parse(readFileSync(new URL('../config/cloud.json',import.meta.url),'utf8'));
const example=JSON.parse(readFileSync(new URL('../config/cloud.example.json',import.meta.url),'utf8'));
const start=cloud.indexOf('function safeClientConfig(v){');
const end=cloud.indexOf('async function boot(){',start);
assert.ok(start>0&&end>start,'Exact production safeClientConfig function must be extractable');
const safeClientConfig=new Function(cloud.slice(start,end)+'\nreturn safeClientConfig;')();
const ref='rvrmjjtdedidjnrkdery';
const base={enabled:true,independentProjectConfirmed:true,controlProjectRef:ref,
 supabaseUrl:'https://'+ref+'.supabase.co/',supabasePublishableKey:'sb_publishable_controlSafePublic_12345678'};
const accept=x=>safeClientConfig({...base,...x});

test('deployed Cloud is disabled and example is not authorized',()=>{
 assert.equal(actual.enabled,false);
 assert.equal(example.enabled,false);
 assert.equal(example.independentProjectConfirmed,false);
 assert.equal(example.controlProjectRef,'');
 assert.equal(safeClientConfig(actual),false);
 assert.equal(safeClientConfig(example),false);
});
test('the independently confirmed CONTROL project and public-only key pass the schema check',()=>{
 assert.equal(safeClientConfig(base),true);
});
test('self-consistent external Supabase project configuration is refused, including IAgile',()=>{
 for(const different of ['daabfmdlgcwcykevvrcm','unrelated-project-reference']){
  assert.equal(accept({controlProjectRef:different,supabaseUrl:'https://'+different+'.supabase.co/'}),false,different);
 }
});
test('enabling Cloud alone is never enough to request sign-in',()=>{
 assert.equal(accept({independentProjectConfirmed:false}),false);
 assert.equal(accept({independentProjectConfirmed:undefined}),false);
 assert.equal(accept({controlProjectRef:''}),false);
 assert.equal(accept({controlProjectRef:'iagile'}),false);
});
test('mismatched Supabase project reference is rejected before client initialization',()=>{
 assert.equal(accept({controlProjectRef:'another-ref-forbidden'}),false);
 assert.equal(accept({supabaseUrl:'https://another-ref-forbidden.supabase.co/'}),false);
});
test('a service-role JWT is never a valid publishable frontend key',()=>{
 const head=Buffer.from(JSON.stringify({alg:'HS256'})).toString('base64url');
 const payload=Buffer.from(JSON.stringify({role:'service_role',iss:'supabase'})).toString('base64url');
 const jwt=head+'.'+payload+'.mock-signature';
 assert.equal(accept({supabasePublishableKey:jwt}),false);
});
test('legacy anon JWTs are rejected: only explicit sb_publishable_ keys allowed',()=>{
 const fake='eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiYW5vbiJ9.dummy';
 assert.equal(accept({supabasePublishableKey:fake}),false);
});
test('secret, malformed and empty keys cannot be exposed by the client',()=>{
 for(const key of ['','sb_secret_DO_NOT_EXPOSE_abcdefghijklm','sb_publishable_','sb_publishable_a b c','sb_publishable_baddata#','sb_publishable_\ncontrolkey','some-random-api-key']){
  assert.equal(accept({supabasePublishableKey:key}),false,key);
 }
});
test('URL query parameters and hash fragments cannot leak tokens',()=>{
 assert.equal(accept({supabaseUrl:'https://'+ref+'.supabase.co/?access_token=abc'}),false);
 assert.equal(accept({supabaseUrl:'https://'+ref+'.supabase.co/#refresh_token=abc'}),false);
});
test('URL credentials, nested paths and unexpected ports are rejected',()=>{
 assert.equal(accept({supabaseUrl:'https://user:pw@'+ref+'.supabase.co/'}),false);
 assert.equal(accept({supabaseUrl:'https://'+ref+'.supabase.co/auth/v1/'}),false);
 assert.equal(accept({supabaseUrl:'https://'+ref+'.supabase.co:8443/'}),false);
});
test('cross-origin and plaintext endpoints cannot masquerade as independent Supabase',()=>{
 assert.equal(accept({supabaseUrl:'http://'+ref+'.supabase.co/'}),false);
 assert.equal(accept({supabaseUrl:'https://'+ref+'.supabase.co.attacker.test/'}),false);
 assert.equal(accept({supabaseUrl:'https://evil.example/'+ref+'.supabase.co/'}),false);
});
test('malformed configuration types fail closed without throwing',()=>{
 for(const x of [null,undefined,{},[],{enabled:true},'controlled']){
  assert.doesNotThrow(()=>safeClientConfig(x));
  assert.equal(safeClientConfig(x),false);
 }
});
test('real boot never imports a cloud provider when safeClientConfig is false',()=>{
 assert.match(cloud,/if\(!safeClientConfig\(cfg\)\)throw Error\('not configured'\)/);
 assert.match(cloud,/const \{createClient\}=await import\(CDN\)/);
 const gate=cloud.indexOf("if(!safeClientConfig(cfg))throw Error('not configured')");
 const importPosition=cloud.indexOf("await import(CDN)");
 assert.ok(gate>0&&gate<importPosition);
});
