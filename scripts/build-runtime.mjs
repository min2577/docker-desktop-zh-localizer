import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
export const root = fileURLToPath(new URL('../', import.meta.url));
export function buildRuntime() {
  const dictionary = JSON.parse(fs.readFileSync(path.join(root,'locales/zh-CN.json'),'utf8'));
  if (!Object.values(dictionary).every(value=>typeof value==='string')) throw new Error('Dictionary values must be strings');
  const template = fs.readFileSync(path.join(root,'src/runtime-template.js'),'utf8');
  return template.replace('__DICTIONARY__',JSON.stringify(dictionary));
}
if (process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  fs.mkdirSync(path.join(root,'dist'),{recursive:true});
  fs.writeFileSync(path.join(root,'dist/runtime-zh.js'),buildRuntime());
  console.log('Generated dist/runtime-zh.js from the bundled dictionary. No network translation is used.');
}
