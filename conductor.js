// The Conductor — procedural 3D brand character: faceted glass core, titanium gimbal rings, cyan visor, signal network
import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

function makeEnv(renderer) {
  const pm = new THREE.PMREMGenerator(renderer);
  const s = new THREE.Scene(); s.background = new THREE.Color(0x0F1729);
  const add = (c, x, y, z, w, h, i) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: c })); m.material.color.multiplyScalar(i); m.position.set(x, y, z); m.lookAt(0, 0, 0); s.add(m); };
  add(0xffffff, 0, 8, 0, 6, 6, 4); add(0x6E9BFF, -8, 2, -3, 5, 8, 3); add(0xE6C27A, 8, -2, -4, 5, 8, 2); add(0xF4F7FC, 3, 1, 9, 8, 4, 1.5);
  const t = pm.fromScene(s, 0.04).texture; pm.dispose(); return t;
}

export function mount(canvas) {
  const W = () => canvas.clientWidth || 600, H = () => canvas.clientHeight || 600;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75)); renderer.setSize(W(), H(), false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  const scene = new THREE.Scene(); scene.environment = makeEnv(renderer);
  const camera = new THREE.PerspectiveCamera(34, W() / H(), 0.1, 60); camera.position.set(0, 0.3, 14);
  scene.add(new THREE.HemisphereLight(0x9fd8ff, 0x060A14, 0.5));
  const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(4, 6, 6); scene.add(key);
  const cyanL = new THREE.PointLight(0x6E9BFF, 14, 30, 2); cyanL.position.set(-4, 2, -1); scene.add(cyanL);
  const irisL = new THREE.PointLight(0xE6C27A, 22, 30, 2); irisL.position.set(4, -3, -2); scene.add(irisL);

  const root = new THREE.Group(); scene.add(root);
  const wide = () => W() > 960; const zFor = () => 9.7 * Math.max(1, 1.45 / (W() / H())); const xFor = () => wide() ? 1.9 : 0; const yFor = () => wide() ? 0 : 1.4; root.position.x = xFor();
  const glass = new THREE.MeshPhysicalMaterial({ color: 0xdfe9f3, roughness: 0.04, metalness: 0, transmission: 0.95, thickness: 1.2, ior: 1.6, clearcoat: 1, clearcoatRoughness: 0.04, envMapIntensity: 1.5, flatShading: true });
  const ti = new THREE.MeshStandardMaterial({ color: 0x9aa6b8, metalness: 1, roughness: 0.28 });
  const tiDark = new THREE.MeshStandardMaterial({ color: 0x4b5a70, metalness: 1, roughness: 0.42 });
  const glow = new THREE.MeshBasicMaterial({ color: 0x6E9BFF });
  const lime = new THREE.MeshBasicMaterial({ color: 0x3DDC97 });
  const glowSoft = new THREE.MeshBasicMaterial({ color: 0x6E9BFF, transparent: true, opacity: 0.3 });

  // --- character body: crystal core inside a gyroscope ---
  const body = new THREE.Group(); root.add(body);
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.95, 0), glass); body.add(core);
  const inner = new THREE.Mesh(new THREE.OctahedronGeometry(0.34, 0), glow); body.add(inner);
  const heart = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 12), new THREE.MeshBasicMaterial({ color: 0xffffff })); body.add(heart);
  const visor = new THREE.Mesh(new THREE.TorusGeometry(1.08, 0.028, 12, 72, Math.PI * 0.55), glow); visor.position.z = 0.15; visor.rotation.z = Math.PI * 0.225; body.add(visor);
  const gimbals = [];
  [[1.35, ti, 0.05], [1.62, tiDark, 0.035], [1.92, ti, 0.045]].forEach(([r, m, tube], i) => {
    const g = new THREE.Group(); const ring = new THREE.Mesh(new THREE.TorusGeometry(r, tube, 16, 128), m); g.add(ring);
    for (const a of [0, Math.PI]) { const k = new THREE.Mesh(new THREE.SphereGeometry(tube * 2.4, 12, 10), i === 1 ? lime : glow); k.position.set(Math.cos(a) * r, Math.sin(a) * r, 0); g.add(k); }
    body.add(g); gimbals.push(g);
  });
  const pedestal = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.02, 8, 96), tiDark); pedestal.rotation.x = Math.PI / 2; pedestal.position.y = -2.4; body.add(pedestal);

  // --- orbit rings & network ---
  const rings = [];
  [[2.6, 0.4, 0.1], [3.0, -0.6, 0.5], [3.4, 0.2, -0.9]].forEach(([r, rx, rz], i) => { const m = new THREE.Mesh(new THREE.TorusGeometry(r, 0.014, 8, 200), new THREE.MeshStandardMaterial({ color: i === 1 ? 0x4b5a70 : 0x9aa6b8, metalness: 1, roughness: 0.35, transparent: true, opacity: 0 })); m.rotation.set(rx, 0, rz); root.add(m); rings.push(m); });
  const nodes = [], nodeGeo = new THREE.SphereGeometry(0.09, 16, 12), haloGeo = new THREE.SphereGeometry(0.17, 16, 12), linePos = [];
  for (let i = 0; i < 14; i++) {
    const a = i / 14 * Math.PI * 2, r = 2.9 + Math.sin(i * 2.3) * 0.7;
    const p = new THREE.Vector3(Math.cos(a) * r, Math.sin(a * 1.7) * 1.5, Math.sin(a) * r * 0.6);
    const n = new THREE.Mesh(nodeGeo, i % 3 === 0 ? lime : ti); n.position.copy(p); root.add(n);
    const h = new THREE.Mesh(haloGeo, glowSoft); h.position.copy(p); h.visible = i % 3 === 0; root.add(h);
    nodes.push({ m: n, p, h, phase: i * 0.7 }); linePos.push(0, 0, 0, p.x, p.y, p.z);
  }
  const lines = new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(linePos, 3)), new THREE.LineBasicMaterial({ color: 0x6E9BFF, transparent: true, opacity: 0 })); root.add(lines);
  const signals = [];
  for (let i = 0; i < 8; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), glow); root.add(s); signals.push({ m: s, node: (i * 5) % nodes.length, t: Math.random(), speed: 0.25 + Math.random() * 0.3, dir: i % 2 ? 1 : -1 }); }

  let tx = 0, ty = 0, px = 0, py = 0, scroll = 0, raf = 0, alive = true;
  const onMove = e => { const r = canvas.getBoundingClientRect(); tx = ((e.clientX - r.left) / r.width - 0.5) * 2; ty = ((e.clientY - r.top) / r.height - 0.5) * 2; };
  const onScroll = () => { scroll = Math.min(1, window.scrollY / Math.max(1, window.innerHeight)); };
  window.addEventListener('pointermove', onMove, { passive: true }); window.addEventListener('scroll', onScroll, { passive: true });
  const ro = new ResizeObserver(() => { renderer.setSize(W(), H(), false); camera.aspect = W() / H(); camera.updateProjectionMatrix(); }); ro.observe(canvas);
  const clock = new THREE.Clock(), origin = new THREE.Vector3(0, 0, 0); const ease = x => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);

  function tick() {
    if (!alive) return; raf = requestAnimationFrame(tick); if (document.hidden || scroll >= 1) return;
    const t = clock.getElapsedTime(); px += (tx - px) * 0.05; py += (ty - py) * 0.05;
    const intro = ease((t - 0.6) / 2.6); camera.position.z = zFor() + 4.3 * (1 - intro); root.position.x += (xFor() - root.position.x) * 0.05;
    const appear = ease((t - 1.0) / 1.4); body.scale.setScalar(0.001 + appear);
    root.rotation.y = px * 0.25 + Math.sin(t * 0.15) * 0.1; root.rotation.x = py * 0.12;
    root.position.y = yFor() + Math.sin(t * 0.8) * 0.08 - scroll * 2.5; root.scale.setScalar((0.6 + 0.4 * intro) * (1 - scroll * 0.25));
    core.rotation.y = t * 0.25; core.rotation.x = Math.sin(t * 0.4) * 0.2; inner.rotation.y = -t * 0.6; inner.rotation.z = t * 0.3; inner.scale.setScalar(1 + Math.sin(t * 3) * 0.06);
    visor.rotation.y = px * 0.6; visor.rotation.x = py * 0.3;
    gimbals[0].rotation.x = t * 0.5; gimbals[0].rotation.y = Math.sin(t * 0.3) * 0.5;
    gimbals[1].rotation.y = t * 0.35 + 1; gimbals[1].rotation.z = Math.sin(t * 0.25) * 0.6;
    gimbals[2].rotation.z = t * 0.22; gimbals[2].rotation.x = Math.PI / 2 + Math.sin(t * 0.2) * 0.4;
    pedestal.scale.setScalar(1 + Math.sin(t * 2) * 0.04);
    rings.forEach((r, i) => { r.rotation.z += 0.0012 * (i + 1); r.rotation.y += 0.0008 * (i + 1); r.material.opacity = 0.9 * intro; });
    lines.material.opacity = 0.16 * ease((t - 1.4) / 1.5);
    const pos = lines.geometry.attributes.position;
    nodes.forEach((n, i) => { n.m.position.y = n.p.y + Math.sin(t * 0.9 + n.phase) * 0.12; n.h.position.copy(n.m.position); pos.setXYZ(i * 2 + 1, n.m.position.x, n.m.position.y, n.m.position.z); });
    pos.needsUpdate = true; glowSoft.opacity = 0.22 + Math.sin(t * 2) * 0.1;
    signals.forEach(s => { s.t += s.speed * 0.016; if (s.t > 1) { s.t = 0; s.node = (s.node + 3) % nodes.length; } const k = s.dir > 0 ? s.t : 1 - s.t; s.m.position.lerpVectors(origin, nodes[s.node].m.position, k); s.m.scale.setScalar(0.7 + Math.sin(k * Math.PI) * 0.8); });
    renderer.render(scene, camera);
  }
  tick();
  return () => { alive = false; cancelAnimationFrame(raf); ro.disconnect(); window.removeEventListener('pointermove', onMove); window.removeEventListener('scroll', onScroll); renderer.dispose(); };
}
