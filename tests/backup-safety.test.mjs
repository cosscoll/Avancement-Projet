import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const code=readFileSync(new URL('../assets/command-center.js',import.meta.url),'utf8');
const exposed=code.replace('window.CONTROL_CENTER={render};','window.CONTROL_CENTER={render,validateBackupData};');
const window={};
new Function('window',exposed)(window);
const validate=window.CONTROL_CENTER.validateBackupData;

test('Accept prior CONTROL backup shapes without forcing optional newer sections',()=>{
 assert.equal(validate({command:{actions:[],missions:[]},hub:{projects:[]},automations:{}}),true);
 assert.equal(validate({command:{actions:[{id:'a',title:'Action'}],missions:[],meetings:[{id:'m',title:'Visio'}]},hub:{state:{}},automations:{}}),true);
});
test('Reject missing or non-object backup sections and corrupted mission arrays',()=>{
 assert.equal(validate({command:{actions:[],missions:[]},hub:[],automations:{}}),false);
 assert.equal(validate({command:{actions:[],missions:'wrong'},hub:{},automations:{}}),false);
 assert.equal(validate({command:{actions:[],missions:[],meetings:{}},hub:{},automations:{}}),false);
 assert.equal(validate({command:{actions:[null],missions:[]},hub:{},automations:{}}),false);
 assert.equal(validate({command:{actions:[],missions:[]},hub:{},automations:null}),false);
});
test('Reject prototype-mutation JSON keys at any nesting level',()=>{
 const malicious=JSON.parse('{"command":{"actions":[],"missions":[]},"hub":{"projects":[{"__proto__":{"admin":true}}]},"automations":{}}');
 assert.equal(validate(malicious),false);
 const another=JSON.parse('{"command":{"actions":[],"missions":[]},"hub":{"constructor":{"prototype":{"owner_id":"other"}}},"automations":{}}');
 assert.equal(validate(another),false);
});
test('Import has an explicit warning if storage rollback itself fails',()=>{
 assert.match(code,/rollbackUncertain=true/);
 assert.match(code,/Certaines données locales ont pu changer/);
 assert.match(code,/validateBackupData\(data\)/);
});
