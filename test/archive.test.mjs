import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import * as asar from '@electron/asar';
import {entries,readArchive,replaceEntry,sha256,updateExecutableDigest} from '../src/archive.mjs';

test('renderer replacement preserves all other archive contents and unpacked native modules',async()=>{
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'docker-zh-test-'));
  try{
    const source=path.join(temp,'source');fs.mkdirSync(path.join(source,'build/desktop-ui-build'),{recursive:true});
    fs.writeFileSync(path.join(source,'build/desktop-ui-build/main.rend.js'),'globalThis.fixture = "Containers";');
    fs.writeFileSync(path.join(source,'package.json'),'{"version":"fixture"}');
    fs.writeFileSync(path.join(source,'native.node'),'synthetic native module, not a Docker file');
    const archive=path.join(temp,'fixture.asar');
    await asar.createPackageWithOptions(source,archive,{unpack:'*.node'});
    const original=fs.readFileSync(archive);
    const target='build/desktop-ui-build/main.rend.js';
    const replacement=Buffer.from('globalThis.fixture = "容器";');
    const patched=replaceEntry(original,target,replacement);
    const output=path.join(temp,'patched.asar');fs.writeFileSync(output,patched);
    assert.equal(asar.extractFile(output,target.replaceAll('/',path.sep)).toString(),replacement.toString());
    assert.equal(asar.extractFile(output,'package.json').toString(),'{"version":"fixture"}');
    assert.deepEqual(entries(original).get('native.node').entry,entries(patched).get('native.node').entry);
    assert.equal(entries(original).size,entries(patched).size);
    assert.throws(()=>replaceEntry(original,'missing.js',replacement),/exactly one/);
    const digest=sha256(Buffer.from(readArchive(original).headerText));
    const executable=Buffer.from('fixture-prefix'+JSON.stringify({file:'resources\\app.asar',alg:'SHA256',value:digest})+'fixture-suffix');
    const exe=updateExecutableDigest(executable,original,patched);
    assert.equal(exe.length,executable.length);
    assert.ok(exe.includes(Buffer.from(sha256(Buffer.from(readArchive(patched).headerText)))));
    assert.throws(()=>updateExecutableDigest(Buffer.from('unsupported'),original,patched),/Unsupported/);
    const mismatched=Buffer.from(executable.toString().replace(digest,'0'.repeat(64)));
    assert.throws(()=>updateExecutableDigest(mismatched,original,patched),/does not match/);
  } finally {
    // Only remove the exact directory returned by mkdtemp, inside the OS temp dir.
    const resolved=path.resolve(temp),parent=path.resolve(os.tmpdir());
    if(path.dirname(resolved)!==parent||!path.basename(resolved).startsWith('docker-zh-test-'))throw Error('Unexpected cleanup target');
    fs.rmSync(resolved,{recursive:true,force:true});
  }
});
test('malformed archives are rejected',()=>assert.throws(()=>readArchive(Buffer.from('bad')),/truncated/));
