import { readFileSync, readdirSync } from 'node:fs';
import { resolve, relative, extname } from 'node:path';
import { pathToFileURL } from 'node:url';

const windows = new TextDecoder('windows-1252');
const reverse = new Map();
for (let b = 0; b < 256; b++) reverse.set(windows.decode(Uint8Array.of(b)), b);
const strictUtf8 = new TextDecoder('utf-8', { fatal: true });
const excluded = new Set(['.git', '.wrangler', 'node_modules', 'tmp', 'dist', '__pycache__']);
const extensions = new Set(['.html','.js','.mjs','.json','.jsonc','.css','.svg','.xml','.txt','.md','.csv','.py','.ps1','.toml']);

// Detect reversible multi-byte corruption, not individual accented letters.
// This is a build-time assertion only; never changes production strings.
export function textProblems(text) {
  const found = [];
  for (let i = 0; i < text.length; i++) {
    const cp = text.charCodeAt(i);
    if (cp === 0xfffd || (cp >= 0x80 && cp <= 0x9f)) found.push({ offset: i, reason: 'replacement character or C1 control' });
    const lead = reverse.get(text[i]);
    const n = lead >= 0xc2 && lead <= 0xdf ? 2 : lead >= 0xe0 && lead <= 0xef ? 3 : lead >= 0xf0 && lead <= 0xf4 ? 4 : 0;
    if (!n) continue;
    const bytes = Array.from(text.slice(i, i+n), c => reverse.get(c));
    if (bytes.length !== n || bytes.some(b => b === undefined)) continue;
    try {
      const decoded = strictUtf8.decode(Uint8Array.from(bytes));
      if ([...decoded].length === 1) { found.push({ offset: i, reason: 'UTF-8 bytes decoded as Windows-1252', intended: decoded }); i += n-1; }
    } catch { /* Valid Unicode is not necessarily a misdecoded byte sequence. */ }
  }
  return found;
}

function entities(s) {
  const names = {acirc:'\u00e2',Acirc:'\u00c2',Atilde:'\u00c3',euro:'\u20ac',trade:'\u2122',ldquo:'\u201c',rdquo:'\u201d',lsquo:'\u2018',rsquo:'\u2019',raquo:'\u00bb',copy:'\u00a9',nbsp:'\u00a0'};
  return s.replace(/&#(x[\da-f]+|\d+);|&([a-z]+);/gi, (all, num, name) => {
    if (!num) return names[name] ?? all;
    const code = num[0].toLowerCase() === 'x' ? parseInt(num.slice(1),16) : Number(num);
    return code <= 0x10ffff ? String.fromCodePoint(code) : '\ufffd';
  });
}

export function inspectBytes(bytes, name) {
  let text;
  try { text = strictUtf8.decode(bytes); } catch { return [{reason:'invalid UTF-8 bytes'}]; }
  const problems = textProblems(text);
  if (name.endsWith('.json')) {
    try { problems.push(...textProblems(JSON.stringify(JSON.parse(text)))); }
    catch { problems.push({reason:'invalid JSON'}); }
  }
  if (name.endsWith('.html')) {
    problems.push(...textProblems(entities(text)));
    const declarations = [...text.matchAll(/<meta\b[^>]*\bcharset\s*=\s*["']?([^\s"'/>;]+)/gi)];
    if (declarations.length !== 1 || declarations[0][1].toLowerCase() !== 'utf-8') problems.push({reason:'expected one UTF-8 HTML charset'});
    else if (Buffer.byteLength(text.slice(0,declarations[0].index)+declarations[0][0]) >= 1024) problems.push({reason:'HTML charset must be within first 1024 bytes'});
  }
  return problems;
}

export function scan(root) {
  const results = []; let files = 0;
  function walk(dir) {
    for (const e of readdirSync(dir,{withFileTypes:true})) {
      if (excluded.has(e.name) || e.name.startsWith('.env')) continue;
      const path = resolve(dir,e.name);
      if (e.isDirectory()) walk(path);
      else if (extensions.has(extname(path)) || e.name === '_headers') {
        files++; const problems = inspectBytes(readFileSync(path),path);
        if (problems.length) results.push({file:relative(root,path),problems});
      }
    }
  }
  walk(root); return {files,results};
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const report = scan(resolve(process.argv[2] || '.'));
  console.log(JSON.stringify(report,null,2));
  if (report.results.length) process.exitCode = 1;
}
