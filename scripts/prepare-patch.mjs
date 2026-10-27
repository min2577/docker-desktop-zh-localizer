import fs from 'node:fs';
import path from 'node:path';
import {parseArgs} from 'node:util';
import {buildRuntime,root} from './build-runtime.mjs';
import {entries,replaceEntry,updateExecutableDigest,sha256} from '../src/archive.mjs';

const {values}=parseArgs({options:{
  'docker-dir':{type:'string',default:path.join(process.env.ProgramFiles??'C:\\Program Files','Docker','Docker')},
  archive:{type:'string'},exe:{type:'string'},output:{type:'string',default:path.join(root,'.local')}
}});
const compatibility=JSON.parse(fs.readFileSync(path.join(root,'compatibility/win32-x64-4.68.0.json'),'utf8'));
const dockerDir=path.resolve(values['docker-dir']);
const archivePath=values.archive??path.join(dockerDir,'frontend/resources/app.asar');
const exePath=values.exe??path.join(dockerDir,'frontend/Docker Desktop.exe');
const output=path.resolve(values.output);
if(fs.existsSync(output))throw new Error('Output already exists. Use a new --output directory; existing backups are never overwritten.');
const originalArchive=fs.readFileSync(archivePath);
const originalExe=fs.readFileSync(exePath);
if(sha256(originalArchive)!==compatibility.originalArchiveSha256||sha256(originalExe)!==compatibility.originalExeSha256)throw new Error('Unsupported or already modified Docker files. This release supports only the exact original Windows x64 4.68.0 build.');
const renderer=entries(originalArchive).get(compatibility.rendererEntry)?.data;
if(!renderer)throw new Error('Renderer entry is missing');
const source=renderer.toString('utf8');
if(source.includes('LOCAL_DOCKER_ZH_BEGIN'))throw new Error('Renderer already contains this patch');
const translated=Buffer.from(buildRuntime()+'\n'+source);
const patchedArchive=replaceEntry(originalArchive,compatibility.rendererEntry,translated);
const patchedExe=updateExecutableDigest(originalExe,originalArchive,patchedArchive);
fs.mkdirSync(path.join(output,'backup'),{recursive:true});
fs.writeFileSync(path.join(output,'backup/app.asar'),originalArchive);
fs.writeFileSync(path.join(output,'backup/Docker Desktop.exe'),originalExe);
fs.writeFileSync(path.join(output,'app-zh.asar'),patchedArchive);
fs.writeFileSync(path.join(output,'Docker Desktop.zh.exe'),patchedExe);
const manifest={...compatibility,dockerDir,patchedArchiveSha256:sha256(patchedArchive),patchedExeSha256:sha256(patchedExe),verifiedEntries:entries(patchedArchive).size,rendererOnly:true};
fs.writeFileSync(path.join(output,'manifest.json'),JSON.stringify(manifest,null,2));
console.log(`Local patch and backups generated at ${output}. Installed Docker files have not been changed.`);
console.log('The patch is experimental and modifies the frontend executable digest, invalidating its original signature.');
