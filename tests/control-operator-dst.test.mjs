import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const frame={window:{}};
vm.runInNewContext(readFileSync('assets/control-operator-core.js','utf8'),frame);
const core=frame.window.CONTROL_OPERATOR_CORE;
test('DST gap and repeated hour fail closed in Europe/Paris',()=>{
 const old=process.env.TZ;
 try {
  process.env.TZ='Europe/Paris';
  assert.equal(core.validateLocalDateTime('2026-03-29T02:30'),false);
  assert.equal(core.validateLocalDateTime('2026-10-25T02:30'),false);
  assert.equal(core.validateLocalDateTime('2026-03-29T03:30'),true);
  assert.equal(core.validateLocalDateTime('2026-10-25T03:30'),true);
 } finally {if(old===undefined)delete process.env.TZ;else process.env.TZ=old}
});
