// Bundles each dashboard (three.js included) into one self-contained HTML file — no CDN, works offline.
import { build } from 'esbuild';
import { readFileSync, writeFileSync } from 'node:fs';

const targets = [
  { entry: 'src/app.js', template: 'src/template.html', out: 'cable-dashboard.html' },
  { entry: 'src/structural/main.js', template: 'src/structural/template.html', out: 'structural-dashboard.html' },
];
for (const t of targets) {
  const res = await build({
    entryPoints: [t.entry], bundle: true, minify: true, write: false, format: 'iife', target: 'es2020',
    outdir: 'out', loader: { '.css': 'css', '.json': 'json' }, legalComments: 'none',
  });
  const js = res.outputFiles.find((f) => f.path.endsWith('.js')).text;
  const css = res.outputFiles.find((f) => f.path.endsWith('.css')).text;
  const html = readFileSync(t.template, 'utf8').replace('/*CSS*/', () => css).replace('/*JS*/', () => js.replace(/<\/script/gi, '<\\/script'));
  writeFileSync(t.out, html);
  console.log(`${t.out}  ${(html.length / 1024).toFixed(0)} KB`);
}
