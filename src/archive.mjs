import crypto from 'node:crypto';
import pickle from 'chromium-pickle-js';

export const sha256 = buffer=>crypto.createHash('sha256').update(buffer).digest('hex');
export function readArchive(buffer) {
  if(buffer.length<16)throw new Error('Archive header is truncated');
  const headerSize=pickle.createFromBuffer(buffer.subarray(0,8)).createIterator().readUInt32();
  if(headerSize<8||8+headerSize>buffer.length)throw new Error('Invalid archive header size');
  const headerText=pickle.createFromBuffer(buffer.subarray(8,8+headerSize)).createIterator().readString();
  const header=JSON.parse(headerText);
  if(!header.files)throw new Error('Archive has no files');
  return {header,headerText,headerSize};
}
export function entries(buffer) {
  const {header,headerSize}=readArchive(buffer);
  const result=new Map();
  function visit(files,prefix='') {
    for(const [name,entry] of Object.entries(files)) {
      const key=prefix?`${prefix}/${name}`:name;
      if(entry.files){visit(entry.files,key);continue;}
      if(entry.unpacked||entry.link){result.set(key,{entry,data:null});continue;}
      const offset=Number(entry.offset);
      const start=8+headerSize+offset;
      if(!Number.isSafeInteger(offset)||offset<0||!Number.isSafeInteger(entry.size)||entry.size<0||start+entry.size>buffer.length)throw new Error(`Invalid file bounds: ${key}`);
      result.set(key,{entry,data:buffer.subarray(start,start+entry.size)});
    }
  }
  visit(header.files);
  return result;
}
export function replaceEntry(buffer,target,replacement) {
  const {header}=readArchive(buffer);
  const originals=entries(buffer);
  const chunks=[];
  let offset=0,changed=0;
  function visit(files,prefix='') {
    for(const [name,entry] of Object.entries(files)) {
      const key=prefix?`${prefix}/${name}`:name;
      if(entry.files){visit(entry.files,key);continue;}
      if(entry.unpacked||entry.link)continue;
      const data=key===target?replacement:originals.get(key).data;
      if(key===target){
        changed++;
        entry.size=data.length;
        if(entry.integrity){
          const blockSize=entry.integrity.blockSize;
          if(!Number.isSafeInteger(blockSize)||blockSize<1)throw new Error('Invalid integrity block size');
          const blocks=[];
          for(let i=0;i<data.length;i+=blockSize)blocks.push(sha256(data.subarray(i,i+blockSize)));
          entry.integrity={algorithm:'SHA256',hash:sha256(data),blockSize,blocks};
        }
      }
      entry.offset=String(offset);offset+=data.length;chunks.push(data);
    }
  }
  visit(header.files);
  if(changed!==1)throw new Error('Expected exactly one packed renderer entry');
  const hp=pickle.createEmpty();hp.writeString(JSON.stringify(header));
  const hb=hp.toBuffer();const sp=pickle.createEmpty();sp.writeUInt32(hb.length);
  const output=Buffer.concat([sp.toBuffer(),hb,...chunks]);
  const packed=entries(output);
  if(packed.size!==originals.size)throw new Error('Archive entry count changed');
  for(const [key,before] of originals){
    const after=packed.get(key);
    if(!after)throw new Error(`Missing archive entry: ${key}`);
    if(before.data===null){if(JSON.stringify(before.entry)!==JSON.stringify(after.entry))throw new Error(`Unpacked metadata changed: ${key}`);}
    else if(!(key===target?replacement:before.data).equals(after.data))throw new Error(`Content verification failed: ${key}`);
  }
  return output;
}
export function updateExecutableDigest(executable,originalArchive,patchedArchive) {
  const originalDigest=sha256(Buffer.from(readArchive(originalArchive).headerText));
  const patchedDigest=sha256(Buffer.from(readArchive(patchedArchive).headerText));
  const matches=[...executable.toString('latin1').matchAll(/("file":"resources\\\\app\.asar","alg":"SHA256","value":")([0-9a-fA-F]{64})(")/g)];
  if(matches.length!==1)throw new Error('Unsupported executable archive-integrity layout');
  const output=Buffer.from(executable);
  for(const match of matches){
    if(match[2].toLowerCase()!==originalDigest)throw new Error('Original executable/archive integrity does not match');
    output.write(patchedDigest,match.index+match[1].length,64,'ascii');
  }
  return output;
}
