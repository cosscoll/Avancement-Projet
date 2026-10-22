import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const inline=html.match(/<script>([\s\S]*?)<\/script>/)?.[1]||'';
const routeCode=inline.slice(inline.indexOf('function routePart('),inline.indexOf('function home(){'));
function readRoute(hash){
 return runInNewContext(routeCode+'\nroute()', {location:{hash}});
}

test('project hash keeps encoded slashes, percent, accents, questions and fragments in the ID',()=>{
 for(const id of ['project A /équipe','demo%test','project?#one','a/b/c','élan privé']){
  const expectedTab='lab';
  const result=readRoute('#/project/'+encodeURIComponent(id)+'/'+expectedTab);
  assert.equal(result.id,id,'Project ID must survive encoding/decoding: '+id);
  assert.equal(result.tab,expectedTab);
 }
});

test('invalid URI escapes cannot crash a CONTROL workspace route',()=>{
 const invalid=readRoute('#/project/broken%ZZ/ai');
 assert.equal(invalid.id,null);
 const normal=readRoute('#/project/ucp/ai');
 assert.equal(normal.id,'ucp');
 assert.equal(readRoute('#/settings').tab,'settings');
 assert.equal(readRoute('#/').tab,'home');
});

test('breadcrumb and route parsing decode the captured ID, never the whole URL',()=>{
 assert.match(inline,/function routePart\(value\)\{try\{return decodeURIComponent\(value\)\}catch\{return null\}\}/);
 assert.match(inline,/const s=location\.hash\.slice\(1\);const m=s\.match/);
 assert.match(inline,/projects\.find\(v=>v\.id===routePart\(match\[1\]\)\)/);
 assert.doesNotMatch(routeCode,/decodeURIComponent\(location\.hash/);
 new Function(inline);
});
