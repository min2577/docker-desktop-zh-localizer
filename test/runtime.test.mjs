import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {buildRuntime} from '../scripts/build-runtime.mjs';

test('dynamic UI becomes Chinese without changing user data, logs or button handlers',async()=>{
  const dom=new JSDOM('<!doctype html><body><nav>Containers</nav><main></main><input placeholder="Search MCP profiles" value="Volumes"><pre>Images</pre><div class="xterm">Start</div><table><tbody><tr><td>Models</td></tr></tbody></table><button>Start</button></body>',{runScripts:'outside-only',pretendToBeVisual:true});
  try{
    const doc=dom.window.document;let clicks=0;doc.querySelector('button').addEventListener('click',()=>clicks++);
    dom.window.eval(buildRuntime());doc.dispatchEvent(new dom.window.Event('DOMContentLoaded'));
    assert.equal(doc.querySelector('nav').textContent,'容器');
    assert.equal(doc.querySelector('input').placeholder,'搜索 MCP 配置方案');
    assert.equal(doc.querySelector('input').value,'Volumes');
    assert.equal(doc.querySelector('pre').textContent,'Images');
    assert.equal(doc.querySelector('.xterm').textContent,'Start');
    assert.equal(doc.querySelector('td').textContent,'Models');
    doc.querySelector('button').click();assert.equal(clicks,1);
    const node=doc.createElement('span');node.textContent='Create a profile';doc.querySelector('main').append(node);
    await new Promise(resolve=>setTimeout(resolve,70));assert.equal(node.textContent,'创建配置方案');
    node.firstChild.data='Catalog';await new Promise(resolve=>setTimeout(resolve,70));assert.equal(node.textContent,'工具目录');
  }finally{dom.window.close();}
});
