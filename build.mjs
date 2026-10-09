// Bundles src/ (three.js included) into one self-contained cable-dashboard.html — no CDN, works offline.
import { build } from 'esbuild';
import { readFileSync, writeFileSync } from 'node:fs';

const res = await build({
  entryPoints: ['src/app.js'], bundle: true, minify: true, write: false, format: 'iife', target: 'es2020',
  outdir: 'out', loader: { '.css': 'css', '.json': 'json' }, legalComments: 'none',
});
const js = res.outputFiles.find((f) => f.path.endsWith('.js')).text;
const css = res.outputFiles.find((f) => f.path.endsWith('.css')).text;
const html = readFileSync('src/template.html', 'utf8')
  .replace('/*CSS*/', () => css)
  .replace('/*JS*/', () => js.replace(/<\/script/gi, '<\\/script'));
writeFileSync('cable-dashboard.html', html);
console.log(`cable-dashboard.html  ${(html.length / 1024).toFixed(0)} KB`);
