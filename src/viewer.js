// Interactive 3D cable (three.js). Geometry comes from computeCable() so the picture is the costed cable.
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { COLORS, coreColors, corePositions, isAlArmour, isStripArmour } from './visual.js';

function stripeTexture(kind, alum) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = alum ? '#cfd6de' : '#9ea7b2'; g.fillRect(0, 0, 256, 256);
  const n = kind === 'strip' ? 6 : 24;
  g.lineWidth = kind === 'strip' ? 3 : 2;
  for (let i = -n; i <= n * 2; i++) {
    const y = (i / n) * 256;
    g.strokeStyle = 'rgba(70,80,92,.65)'; g.beginPath(); g.moveTo(0, y); g.lineTo(256, y - 256 * 0.35); g.stroke();
    if (kind === 'wire') { g.strokeStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.moveTo(0, y + 3); g.lineTo(256, y + 3 - 256 * 0.35); g.stroke(); }
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}

export function createViewer(host) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  host.appendChild(renderer.domElement);
  const labelsEl = document.createElement('div'); labelsEl.className = 'v3-labels'; host.appendChild(labelsEl);

  const scene = new THREE.Scene();
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; controls.enablePan = false; controls.minDistance = 1.5; controls.maxDistance = 40;
  controls.autoRotate = true; controls.autoRotateSpeed = 1.1;
  const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(4, 7, 5); key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024); key.shadow.camera.left = -8; key.shadow.camera.right = 8; key.shadow.camera.top = 8; key.shadow.camera.bottom = -8;
  scene.add(key, new THREE.HemisphereLight(0xffffff, 0xdfe6ee, 0.55));
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.ShadowMaterial({ opacity: 0.16 }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);

  let model = null, labelPts = [], mode = '3d', userInteracted = false, current = null;
  const home = { dir: new THREE.Vector3(5.6, 2.8, 6.4).normalize(), dist: 12, target: new THREE.Vector3(0.5, 0.5, 0) };

  function resize() {
    const w = host.clientWidth, h = host.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(host);
  controls.addEventListener('start', () => { userInteracted = true; controls.autoRotate = false; });

  const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0, ...o });

  function build(r, view) {
    if (model) { scene.remove(model); model.traverse((o) => { o.geometry?.dispose(); }); }
    labelsEl.innerHTML = ''; labelPts = [];
    model = new THREE.Group();
    const { cfg } = r;
    const k = 2 / r.outerDia; // scene scale: outer diameter -> 2 units
    const cyl = (dia, len, m, x0) => {
      const g = new THREE.CylinderGeometry(dia * k / 2, dia * k / 2, len, 64, 1, false);
      g.rotateZ(-Math.PI / 2); g.translate(x0 + len / 2, 0, 0);
      const me = new THREE.Mesh(g, m); me.castShadow = true; me.receiveShadow = true; return me;
    };
    const L = 5.2, step = view === 'stripped' ? 0.85 : 0.5;
    const armoured = cfg.armour !== 'Unarmored';
    const alum = isAlArmour(cfg.armour);
    const x0 = -L / 2;

    // layer lengths: each deeper layer extends one step further past the outer sheath end
    let ext = 0;
    const layers = [];
    const add = (name, dia, material, sub) => { layers.push({ name, dia, material, ext, sub }); ext += step; };
    add('Outer sheath', r.outerDia, mat(COLORS.outer, { roughness: 0.42, metalness: 0.05 }), `${cfg.outer} · ${r.outerThk} mm`);
    if (armoured) {
      const tex = stripeTexture(isStripArmour(cfg.armour) ? 'strip' : 'wire', alum);
      tex.repeat.set(L / 1.6, 2);
      const am = mat(0xffffff, { map: tex, metalness: 0.75, roughness: 0.38 });
      add('Armour', r.armourDia, am, `${cfg.armour.replace('Galvanised steel', 'GS').replace('Aluminium', 'Al')} · ${r.armourThk} mm`);
    }
    add('Inner sheath', r.innerDia, mat(COLORS.inner, { roughness: 0.7 }), `${cfg.inner} · ${r.innerThk} mm`);

    // deeper layers start a hair further out at the cut end so every layer shows on the end face (no z-fighting)
    const eps = (i) => 0.0015 * i;
    layers.forEach((l, i) => {
      const len = L + l.ext;
      const m = cyl(l.dia, len + eps(i), l.material, x0 - eps(i));
      model.add(m);
      const next = layers[i + 1]?.dia ?? r.laidUp;
      if (view === 'stripped') {
        labelPts.push({ p: new THREE.Vector3(x0 + len - 0.02, (l.dia + next) / 4 * k, 0), name: l.name, sub: l.sub });
      }
    });

    // cores and strands, sticking out beyond the inner sheath
    const cores = corePositions(r), cc = coreColors(cfg.cores);
    const coreExt = ext;
    const condColor = cfg.conductor === 'Copper' ? 0xd98a3d : 0xcfd5de;
    const strandMat = new THREE.MeshStandardMaterial({ color: condColor, metalness: 0.95, roughness: 0.28 });
    const strandGeo = (len, dia) => { const g = new THREE.CylinderGeometry(dia / 2, dia / 2, len, 14); g.rotateZ(-Math.PI / 2); return g; };
    const nRings = (c) => (c > 14 ? 4 : c > 7 ? 3 : c > 3.2 ? 2 : c > 1.4 ? 1 : 0);
    const stripLen = step * 0.9;
    cores.forEach((c, idx) => {
      const y = -c.y * k, z = c.x * k; // lay cores in the YZ plane
      const colr = c.neutral ? 0x2a2d33 : new THREE.Color(cc[idx % cc.length]);
      const insLen = L + coreExt + step * 0.55;
      const e0 = eps(layers.length);
      const scrExt = r.ht ? step * 0.35 : 0;
      if (r.ht) {
        // outer semicon + copper tape over the full length, insulation showing past it
        const tape = cyl(c.d, insLen + e0, mat(0xc98a4b, { metalness: 0.85, roughness: 0.35 }), x0 - e0); tape.position.set(0, y, z); model.add(tape);
        const ins = cyl(c.d * 0.9, insLen + scrExt + e0 + 0.001, mat(colr, { roughness: 0.38 }), x0 - e0 - 0.001); ins.position.set(0, y, z); model.add(ins);
      } else {
        const body = cyl(c.d, insLen + e0, mat(colr, { roughness: 0.38 }), x0 - e0); body.position.set(0, y, z); model.add(body);
      }
      const disc = new THREE.Mesh(new THREE.CircleGeometry(c.c * k / 2, 48), strandMat);
      disc.rotation.y = -Math.PI / 2; disc.position.set(x0 - e0 - 0.0015, y, z); model.add(disc);
      // conductor visible past the insulation
      const cLen = stripLen, cx0 = x0 + insLen + scrExt;
      const rings = nRings(c.c / 2);
      const sr = (c.c * k / 2) / (2 * rings + 1);
      const pts = [[0, 0]];
      for (let q = 1; q <= rings; q++) for (let i = 0; i < 6 * q; i++) { const a = (i / (6 * q)) * Math.PI * 2; pts.push([q * 2 * sr * Math.cos(a), q * 2 * sr * Math.sin(a)]); }
      const im = new THREE.InstancedMesh(strandGeo(cLen, sr * 1.9), strandMat, pts.length);
      const m4 = new THREE.Matrix4();
      pts.forEach(([a, b], i) => { m4.makeTranslation(cx0 + cLen / 2, y + a, z + b); im.setMatrixAt(i, m4); });
      im.castShadow = true; model.add(im);
      if (view === 'stripped' && idx === 0) labelPts.push({ p: new THREE.Vector3(cx0 + cLen, y + c.c * k * 0.2, z), name: 'Conductor', sub: `${cfg.size} mm² ${cfg.conductor}` });
      if (view === 'stripped' && idx === 0 && r.ht) labelPts.push({ p: new THREE.Vector3(x0 + insLen - 0.02, y + c.d * k * 0.5, z), name: 'Screens', sub: 'Semicon + Cu tape' });
      if (view === 'stripped' && idx === 0) labelPts.push({ p: new THREE.Vector3(cx0 - 0.05, y + c.d * k * 0.42, z), name: 'Insulation', sub: `${cfg.insulation} · ${r.insThk} mm` });
    });

    scene.add(model);
    return fit();
  }

  function fit(k = 0.62) {
    model.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(model); const ctr = box.getCenter(new THREE.Vector3());
    floor.position.y = box.min.y - 0.001;
    home.target.copy(ctr);
    const rad = box.getSize(new THREE.Vector3()).length() / 2;
    const vh = (camera.fov * Math.PI) / 360, hh = Math.atan(Math.tan(vh) * camera.aspect), half = Math.min(vh, hh);
    home.dist = (rad / Math.sin(half)) * k;
    return ctr;
  }

  function showGroup(group, preset) {
    if (model) { scene.remove(model); model.traverse((o) => { o.geometry?.dispose(); }); }
    labelsEl.innerHTML = ''; labelPts = []; labelsEl.style.display = 'none'; mode = 'tray';
    const top = preset === 'top';
    if (top) { const w = new THREE.Group(); w.add(group); w.rotation.x = Math.PI / 2; group = w; } // look straight down the model's +y axis
    model = group; scene.add(model);
    fit(top ? 0.8 : Array.isArray(preset) ? 0.8 : 0.72);
    home.dir = top ? new THREE.Vector3(0.0001, 0.0001, 1).normalize() : Array.isArray(preset) ? new THREE.Vector3(...preset).normalize() : new THREE.Vector3(5.6, 3.6, 6.4).normalize();
    userInteracted = false; controls.autoRotate = !top && !Array.isArray(preset); reset();
  }

  function reset() {
    camera.position.copy(home.dir).multiplyScalar(home.dist).add(home.target); controls.target.copy(home.target); controls.update();
  }

  function setModel(r, view) {
    current = r; mode = view; home.dir.set(5.6, 2.8, 6.4).normalize();
    build(r, view);
    labelsEl.style.display = view === 'stripped' ? 'block' : 'none';
    const ord = ['Outer sheath', 'Armour', 'Inner sheath', 'Screens', 'Insulation', 'Conductor'];
    labelPts.sort((a, b) => ord.indexOf(a.name) - ord.indexOf(b.name));
    labelPts.forEach((lp, i) => {
      const d = document.createElement('div'); d.className = 'v3-label'; d.innerHTML = `<span class="pin">${i + 1}</span>`;
      labelsEl.appendChild(d); lp.el = d;
    });
    if (labelPts.length) {
      const lg = document.createElement('div'); lg.className = 'v3-legend';
      lg.innerHTML = labelPts.map((lp, i) => `<div><span class="pin">${i + 1}</span><b>${lp.name}</b> <span>${lp.sub}</span></div>`).join('');
      labelsEl.appendChild(lg);
    }
    if (!userInteracted) { controls.autoRotate = view === '3d'; reset(); }
  }

  const v = new THREE.Vector3();
  function frame() {
    controls.update();
    renderer.render(scene, camera);
    if (mode === 'stripped') {
      const w = host.clientWidth, h = host.clientHeight;
      labelPts.forEach((lp) => {
        v.copy(lp.p).project(camera);
        lp.el.style.transform = `translate(${(v.x * 0.5 + 0.5) * w}px, ${(-v.y * 0.5 + 0.5) * h}px)`;
        lp.el.style.opacity = v.z < 1 ? 1 : 0;
      });
    }
    raf = requestAnimationFrame(frame);
  }
  let raf = requestAnimationFrame(frame);
  resize();

  return {
    setModel, showGroup,
    resetView() { userInteracted = false; controls.autoRotate = mode === '3d'; reset(); },
    toggleSpin() { controls.autoRotate = !controls.autoRotate; return controls.autoRotate; },
    isSpinning: () => controls.autoRotate,
    zoom(f) { const d = camera.position.clone().sub(controls.target); d.multiplyScalar(f); camera.position.copy(controls.target).add(d); },
    resize,
    pause() { cancelAnimationFrame(raf); raf = 0; },
    resume() { if (!raf) { raf = requestAnimationFrame(frame); } resize(); },
  };
}
