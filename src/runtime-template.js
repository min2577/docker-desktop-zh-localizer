/* LOCAL_DOCKER_ZH_BEGIN */
(() => {
  'use strict';
  if (typeof document === 'undefined' || globalThis.__LOCAL_DOCKER_ZH__) return;
  const dictionary = __DICTIONARY__;
  const normalize = text => text.normalize('NFC').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
  const exact = new Map(Object.entries(dictionary).map(([source,target]) => [normalize(source),target.trim()]));
  const escape = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const patterns = [];
  for (const [source, target] of exact) {
    const variables = [...source.matchAll(/\{(\d+)\}/g)];
    if (!variables.length || variables.length > 4 || source.replace(/\{\d+\}/g,'').length < 8) continue;
    let cursor = 0;
    let pattern = '^';
    const slots = [];
    for (const match of variables) {
      pattern += escape(source.slice(cursor,match.index)) + '(.{1,512}?)';
      slots.push(match[1]);
      cursor = match.index + match[0].length;
    }
    pattern += escape(source.slice(cursor)) + '$';
    patterns.push({expression:new RegExp(pattern), slots, target});
  }
  patterns.sort((a,b)=>b.expression.source.length-a.expression.source.length);
  const protectedData = [
    'pre','code','kbd','samp','script','style','noscript',
    '.xterm','.monaco-editor','.cm-editor','[contenteditable="true"]',
    '[role="log"]','td','[role="cell"]','[role="gridcell"]','.MuiDataGrid-cell',
    '[data-testid="container-name"]','[data-testid="image-name"]',
    '[data-testid="volume-name"]','[data-testid="logs-content"]',
    '[data-testid="container-logs-terminal"]','[data-testid="message-content"]'
  ].join(',');
  const isProtected = element => !element || Boolean(element.closest(protectedData));
  function translate(text) {
    if (!text || text.length > 3000) return text;
    const source = normalize(text);
    if (!/[A-Za-z]/.test(source)) return text;
    let target = exact.get(source);
    if (target === undefined) {
      for (const pattern of patterns) {
        const match = pattern.expression.exec(source);
        if (!match) continue;
        const values = new Map(pattern.slots.map((slot,index)=>[slot,match[index+1]]));
        target = pattern.target.replace(/\{(\d+)\}/g,(whole,slot)=>values.get(slot) ?? whole);
        break;
      }
    }
    if (target === undefined || target === source) return text;
    return text.replace(/^(\s*)[\s\S]*?(\s*)$/,(_,left,right)=>left+target+right);
  }
  function textNode(node) {
    const element = node.parentElement;
    if (isProtected(element) || element.tagName === 'TEXTAREA') return;
    const translated = translate(node.data);
    if (translated !== node.data) node.data = translated;
  }
  const attributes = ['placeholder','title','aria-label','aria-description','alt'];
  function elementNode(element) {
    if (isProtected(element)) return;
    for (const attribute of attributes) {
      const current = element.getAttribute(attribute);
      if (!current) continue;
      const translated = translate(current);
      if (translated !== current) element.setAttribute(attribute,translated);
    }
  }
  function scan(node) {
    if (node.nodeType === 3) { textNode(node); return; }
    if (node.nodeType !== 1 && node.nodeType !== 9) return;
    if (node.nodeType === 1) {
      if (isProtected(node)) return;
      elementNode(node);
    }
    const walker = document.createTreeWalker(node,NodeFilter.SHOW_ELEMENT|NodeFilter.SHOW_TEXT,{
      acceptNode(candidate) {
        if (candidate.nodeType === 1 && isProtected(candidate)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    let current;
    while ((current=walker.nextNode())) {
      if (current.nodeType===3) textNode(current); else elementNode(current);
    }
  }
  const queue = new Set();
  let scheduled = false;
  function flush() {
    scheduled = false;
    const nodes = [...queue];
    queue.clear();
    for (const node of nodes) if (node.isConnected) scan(node);
  }
  function enqueue(node) {
    queue.add(node);
    if (!scheduled) {
      scheduled = true;
      requestAnimationFrame(flush);
    }
  }
  function start() {
    if (!document.body) return;
    const observer = new MutationObserver(records=>{
      for (const record of records) {
        if (record.type==='characterData' || record.type==='attributes') enqueue(record.target);
        else for (const node of record.addedNodes) enqueue(node);
      }
    });
    observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:attributes});
    scan(document.body);
  }
  globalThis.__LOCAL_DOCKER_ZH__ = Object.freeze({version:2,entries:exact.size});
  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
/* LOCAL_DOCKER_ZH_END */
