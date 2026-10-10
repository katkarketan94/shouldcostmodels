// Bundles each page (three.js included) into a self-contained HTML file in site/ — no CDN, works offline.
// Pages share site/commodity-prices.js, which is NOT generated: edit it (or use commodity-prices.html).
import { build } from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const T = 'Should-Cost · ';
const targets = [
  { entry: 'src/index/main.js', out: 'index.html', title: T + 'Models' },
  { entry: 'src/prices-page.js', out: 'commodity-prices.html', title: T + 'Commodity prices' },
  { entry: 'src/app.js', out: 'cables.html', title: T + 'Power cables', item: 'cable' },
  { entry: 'src/app.js', out: 'cable-trays.html', title: T + 'Cable trays', item: 'tray' },
  { entry: 'src/app.js', out: 'busduct.html', title: T + 'Busduct', item: 'busduct' },
  { entry: 'src/app.js', out: 'ahu.html', title: T + 'AHU & FCU', item: 'ahu' },
  { entry: 'src/app.js', out: 'chiller.html', title: T + 'Chillers', item: 'chiller' },
  { entry: 'src/app.js', out: 'ducting.html', title: T + 'Ducting', item: 'duct' },
  { entry: 'src/app.js', out: 'pipes.html', title: T + 'Pipes', item: 'pipes' },
  { entry: 'src/app.js', out: 'dg-sets.html', title: T + 'DG sets', item: 'dg' },
  { entry: 'src/app.js', out: 'transformers.html', title: T + 'Transformers', item: 'xfmr' },
  { entry: 'src/structural/main.js', out: 'structural-steel.html', title: T + 'Structural steel & PEB' },
];
mkdirSync('site', { recursive: true });
const tpl = readFileSync('src/page.html', 'utf8');
for (const t of targets) {
  const res = await build({
    entryPoints: [t.entry], bundle: true, minify: true, write: false, format: 'iife', target: 'es2020',
    outdir: 'out', loader: { '.css': 'css', '.json': 'json' }, legalComments: 'none',
    define: t.item ? { __ITEM__: JSON.stringify(t.item) } : {},
    alias: { 'mfg-model': `./src/mfg/model-${['ahu', 'chiller', 'duct', 'pipes', 'dg', 'xfmr'].includes(t.item) ? t.item : 'none'}.js` },
  });
  const js = res.outputFiles.find((f) => f.path.endsWith('.js')).text;
  const css = res.outputFiles.find((f) => f.path.endsWith('.css')).text;
  const html = tpl.replace('/*TITLE*/', () => t.title).replace('/*CSS*/', () => css).replace('/*JS*/', () => js.replace(/<\/script/gi, '<\\/script'));
  writeFileSync(`site/${t.out}`, html);
  console.log(`site/${t.out}  ${(html.length / 1024).toFixed(0)} KB`);
}
