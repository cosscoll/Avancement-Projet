import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const frame={window:{}};
vm.runInNewContext(readFileSync('assets/control-operator-core.js','utf8'),frame);
const parse=frame.window.CONTROL_OPERATOR_CORE.parseDate;
test('reject truncated or incomplete minutes',()=>{
 for(const s of ['RDV le 05/11/2026 à 14h3','RDV le 05/11/2026 à 14:3','RDV le 05/11/2026 à 14h305','RDV le 05/11/2026 à 14:305'])
  assert.equal(parse(s),null,s);
});
test('reject explicit attached time zones',()=>{
 for(const suffix of ['UTC','GMT','CET','CEST','EST','BST','Europe/Paris'])
  assert.equal(parse('Rendez-vous le 26/10/2026 à 14h30'+suffix),null,suffix);
});
test('accept unambiguous local times',()=>{
 assert.equal(parse('RDV le 05/11/2026 à 14h30'),'2026-11-05T14:30');
 assert.equal(parse('Rendez-vous le 26/10/2026 à 14h30 pour UCP'),'2026-10-26T14:30');
});
