import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker/index.js';
import {inspectBytes} from '../scripts/check-encoding.mjs';
test('static report shared links resolve before D1',async()=>{
 const response=await worker.fetch(new Request('https://example.com/report/sample'),{ASSETS:{fetch:async()=>new Response('static report')},DB:{prepare:()=>{throw Error('must not query D1')}}});
 assert.equal(await response.text(),'static report');
});
test('dynamic reports and missing reports retain UTF-8',async()=>{
 for(const html of ['<!doctype html><html><head><meta charset="utf-8"></head><body>Report</body></html>',null]){
 const response=await worker.fetch(new Request('https://example.com/report/run-id'),{ASSETS:{fetch:async()=>new Response(null,{status:404})},DB:{prepare:()=>({bind:()=>({first:async()=>html?{report_html:html}:null})})}});
 assert.equal(response.status,html?200:404);assert.match(response.headers.get('content-type'),/charset=utf-8/);assert.deepEqual(inspectBytes(Buffer.from(await response.text()),'report.html'),[]);
 }
});
