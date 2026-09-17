import { test } from 'node:test';
import assert from 'node:assert/strict';
import { textProblems, inspectBytes } from '../scripts/check-encoding.mjs';

const corrupt = s => new TextDecoder('windows-1252').decode(Buffer.from(s,'utf8'));
test('valid multilingual text, punctuation and emoji remain accepted', () => {
  assert.deepEqual(textProblems('São Tomé, Français, München, naïve, Ã, Â, â, Ελληνικά, 日本語 — what’s · × → 🧪'),[]);
});
test('detect single and double Windows-1252 corruption', () => {
  for (const s of ['—','’','·','×','→','“','”','📓','€','é']) {
    assert.ok(textProblems(corrupt(s)).length);
    assert.ok(textProblems(corrupt(corrupt(s))).length);
  }
});
test('invalid bytes, replacement characters and decoded JSON corruption fail', () => {
  assert.ok(inspectBytes(Uint8Array.of(0xff),'bad.txt').length);
  assert.ok(textProblems(String.fromCharCode(0xfffd)).length);
  const escaped=JSON.stringify(corrupt('—')).replace(/[^\x00-\x7f]/g,c=>'\\u'+c.charCodeAt(0).toString(16).padStart(4,'0'));
  assert.ok(inspectBytes(Buffer.from(escaped),'data.json').length);
});
test('early UTF-8 declaration and metadata/entity corruption', () => {
  const html='<html><head><meta charset="UTF-8"><title>Design — Fractal Infinity</title></head></html>';
  assert.deepEqual(inspectBytes(Buffer.from(html),'page.html'),[]);
  assert.ok(inspectBytes(Buffer.from(html.replace('UTF-8','windows-1252')),'page.html').length);
  assert.ok(inspectBytes(Buffer.from(' '.repeat(1024)+html),'page.html').length);
  const encoded=[...corrupt('—')].map(c=>'&#'+c.codePointAt(0)+';').join('');
  assert.ok(inspectBytes(Buffer.from(html.replace('Design',encoded)),'page.html').length);
});
