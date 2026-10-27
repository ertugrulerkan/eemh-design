import { BoxGeometry, CanvasTexture, Color, DoubleSide, EdgesGeometry, Group, LinearMipmapLinearFilter, LineBasicMaterial, LineSegments, Matrix4, Mesh, MeshBasicMaterial, OrthographicCamera, PlaneGeometry, Quaternion, Raycaster, Scene, SRGBColorSpace, Vector2, Vector3, WebGLRenderer, } from "three";
const T = 0.6;
const RING_IN = 1.5, RING_OUT = 2.08, HALF = 2.22;
const LIGHT = new Vector3(-0.55, 0.8, 0.55).normalize();
const SHADE = 0.74;
const AXES = [new Vector3(1, 0, 0), new Vector3(0, 1, 0), new Vector3(0, 0, 1)];
export function cubeZone(point) {
    const v = [point.x, point.y, point.z];
    const top = Math.max(...v.map(Math.abs));
    return new Vector3(...v.map((c) => (Math.abs(c) >= top - 1e-6 || Math.abs(c) > T ? Math.sign(c) : 0)));
}
function zonePatches(dir) {
    const d = [dir.x, dir.y, dir.z];
    const out = [];
    for (let a = 0; a < 3; a++) {
        if (!d[a])
            continue;
        const [b, c] = [0, 1, 2].filter((i) => i !== a);
        const span = (s) => (s === 0 ? [-T, T] : s > 0 ? [T, 1] : [-1, -T]);
        const [b0, b1] = span(d[b]), [c0, c1] = span(d[c]);
        const centre = new Vector3();
        centre.setComponent(a, d[a] * 1.004).setComponent(b, (b0 + b1) / 2).setComponent(c, (c0 + c1) / 2);
        out.push(new Matrix4().makeBasis(AXES[b].clone().multiplyScalar(b1 - b0), AXES[c].clone().multiplyScalar(c1 - c0), AXES[a]).setPosition(centre));
    }
    return out;
}
const color = (css) => new Color(css);
function faceTexture(look, label, px) {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = px;
    const g = canvas.getContext("2d");
    g.fillStyle = look.face;
    g.fillRect(0, 0, px, px);
    let size = px * 0.25;
    g.font = `600 ${size}px ${look.font}`;
    const room = px * 0.84;
    const wide = g.measureText(label).width;
    if (wide > room)
        size *= room / wide;
    g.font = `600 ${size}px ${look.font}`;
    g.fillStyle = look.text;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(label, px / 2, px / 2 + size * 0.04);
    return texture(canvas);
}
function ringTexture(look, px) {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = px;
    const g = canvas.getContext("2d");
    const c = px / 2, unit = px / 2 / RING_OUT;
    g.fillStyle = look.ring;
    g.beginPath();
    g.arc(c, c, RING_OUT * unit, 0, Math.PI * 2);
    g.arc(c, c, RING_IN * unit, 0, Math.PI * 2, true);
    g.fill("evenodd");
    g.fillStyle = look.ringText;
    g.textAlign = "center";
    g.textBaseline = "middle";
    const mid = ((RING_IN + RING_OUT) / 2) * unit;
    const points = [[look.compass.n, 0], [look.compass.e, 90], [look.compass.s, 180], [look.compass.w, 270]];
    g.font = `700 ${(RING_OUT - RING_IN) * unit * 0.9}px ${look.font}`;
    for (const [letter, deg] of points) {
        const a = (deg * Math.PI) / 180;
        g.fillText(letter, c + Math.sin(a) * mid, c - Math.cos(a) * mid);
    }
    return texture(canvas);
}
function texture(canvas) {
    const t = new CanvasTexture(canvas);
    t.colorSpace = SRGBColorSpace;
    t.minFilter = LinearMipmapLinearFilter;
    t.anisotropy = 4;
    return t;
}
export class ViewCube {
    handlers;
    canvas;
    renderer;
    scene = new Scene();
    camera = new OrthographicCamera(-HALF, HALF, HALF, -HALF, 0.1, 20);
    cube = new Mesh(new BoxGeometry(2, 2, 2), [0, 1, 2, 3, 4, 5].map(() => new MeshBasicMaterial()));
    edges = new LineSegments(new EdgesGeometry(new BoxGeometry(2.004, 2.004, 2.004)), new LineBasicMaterial());
    ring = new Mesh(new PlaneGeometry(RING_OUT * 2, RING_OUT * 2), new MeshBasicMaterial({ transparent: true, depthWrite: false, side: DoubleSide }));
    lit = new Group();
    litMaterial = new MeshBasicMaterial({ transparent: true, opacity: 0.55, depthWrite: false, side: DoubleSide, polygonOffset: true, polygonOffsetFactor: -1 });
    patch = new PlaneGeometry(1, 1);
    hovered = null;
    turned = new Quaternion(NaN, 0, 0, 0);
    dirty = true;
    size = 0;
    press = null;
    ray = new Raycaster();
    constructor(handlers, renderer = (options) => new WebGLRenderer(options)) {
        this.handlers = handlers;
        this.renderer = renderer({ alpha: true, antialias: true });
        this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
        this.renderer.setClearColor(0x000000, 0);
        this.canvas = this.renderer.domElement;
        this.canvas.style.display = "block";
        this.canvas.style.touchAction = "none";
        this.ring.geometry.rotateX(-Math.PI / 2);
        this.ring.position.y = -1;
        this.ring.renderOrder = 1;
        this.lit.renderOrder = 2;
        this.scene.add(this.ring, this.cube, this.edges, this.lit);
        this.canvas.addEventListener("pointermove", this.onMove);
        this.canvas.addEventListener("pointerdown", this.onDown);
        this.canvas.addEventListener("pointerup", this.onUp);
        this.canvas.addEventListener("pointercancel", this.onUp);
        this.canvas.addEventListener("pointerleave", this.onLeave);
    }
    style(look) {
        if (look.size !== this.size) {
            this.size = look.size;
            this.renderer.setSize(look.size, look.size);
        }
        const px = 256;
        const l = look.labels;
        [l.right, l.left, l.top, l.bottom, l.front, l.back].forEach((label, i) => {
            const m = this.cube.material[i];
            m.map?.dispose();
            m.map = faceTexture(look, label, px);
            m.needsUpdate = true;
        });
        const ring = this.ring.material;
        ring.map?.dispose();
        ring.map = ringTexture(look, px * 2);
        ring.needsUpdate = true;
        this.edges.material.color = color(look.edge);
        this.litMaterial.color = color(look.hover);
        this.dirty = true;
    }
    setNorth(degrees) {
        const y = (-degrees * Math.PI) / 180;
        if (this.ring.rotation.y === y)
            return;
        this.ring.rotation.y = y;
        this.dirty = true;
    }
    render(orientation) {
        if (!this.dirty && this.turned.equals(orientation))
            return;
        this.turned.copy(orientation);
        this.dirty = false;
        this.camera.quaternion.copy(orientation);
        this.camera.position.set(0, 0, 10).applyQuaternion(orientation);
        this.camera.updateMatrixWorld();
        const light = LIGHT.clone().applyQuaternion(orientation);
        const normals = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
        this.cube.material.forEach((m, i) => {
            const lit = Math.max(0, new Vector3(...normals[i]).dot(light));
            m.color.setScalar(SHADE + (1 - SHADE) * lit);
        });
        this.renderer.render(this.scene, this.camera);
    }
    dispose() {
        this.canvas.remove();
        for (const m of this.cube.material) {
            m.map?.dispose();
            m.dispose();
        }
        this.ring.material.map?.dispose();
        for (const o of [this.cube, this.ring, this.edges]) {
            o.geometry.dispose();
            o.material.dispose?.();
        }
        this.patch.dispose();
        this.litMaterial.dispose();
        this.renderer.dispose();
        this.renderer.forceContextLoss();
    }
    zoneAt(e) {
        const r = this.canvas.getBoundingClientRect();
        this.ray.setFromCamera(new Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), this.camera);
        const hit = this.ray.intersectObject(this.cube, false)[0];
        return hit ? cubeZone(hit.point) : null;
    }
    light(zone) {
        if (zone === this.hovered || (zone && this.hovered?.equals(zone)))
            return;
        this.hovered = zone;
        this.lit.clear();
        if (zone)
            for (const m of zonePatches(zone)) {
                const p = new Mesh(this.patch, this.litMaterial);
                p.matrixAutoUpdate = false;
                p.matrix.copy(m);
                this.lit.add(p);
            }
        this.canvas.style.cursor = zone ? "pointer" : "";
        this.dirty = true;
    }
    onMove = (e) => {
        if (this.press) {
            const dx = e.clientX - this.press.x, dy = e.clientY - this.press.y;
            if (!this.press.dragging && Math.hypot(dx, dy) < 3)
                return;
            if (!this.press.dragging) {
                this.press.dragging = true;
                this.light(null);
                this.handlers.orbitStart();
            }
            this.press.x = e.clientX;
            this.press.y = e.clientY;
            this.handlers.orbit(dx, dy);
            return;
        }
        this.light(this.zoneAt(e));
    };
    onDown = (e) => {
        if (e.button !== 0)
            return;
        this.canvas.setPointerCapture(e.pointerId);
        this.press = { x: e.clientX, y: e.clientY, dragging: false };
    };
    onUp = (e) => {
        const press = this.press;
        this.press = null;
        if (!press)
            return;
        if (press.dragging) {
            this.handlers.orbitEnd();
            return;
        }
        const zone = this.zoneAt(e);
        if (zone && e.type === "pointerup")
            this.handlers.pick(zone);
    };
    onLeave = () => {
        if (!this.press)
            this.light(null);
    };
}
export const CUBE_SIZE = 116;
export const CUBE_TOKENS = {
    light: { card: "oklch(1 0 0)", foreground: "oklch(0.145 0 0)", border: "oklch(0.922 0 0)", brand: "#ff4c00" },
    dark: { card: "oklch(0.205 0 0)", foreground: "oklch(0.985 0 0)", border: "oklch(1 0 0 / 10%)", brand: "#ff4c00" },
};
export function cubeLook(options) {
    const t = options.dark ? CUBE_TOKENS.dark : CUBE_TOKENS.light;
    const card = `var(--card, ${t.card})`, ink = `var(--foreground, ${t.foreground})`, strong = `var(--border-strong, color-mix(in oklch, var(--border, ${t.border}) 45%, ${ink} 55%))`;
    const mix = (a, share, b) => `color-mix(in oklab, ${a} ${share}%, ${b} ${100 - share}%)`;
    const r = options.resolve;
    return {
        size: CUBE_SIZE,
        font: "Inter, system-ui, sans-serif",
        labels: options.labels,
        compass: options.compass,
        face: r(options.dark ? mix(card, 52, ink) : mix(card, 96, ink)),
        text: r(options.dark ? ink : mix(ink, 72, card)),
        edge: r(options.dark ? mix(card, 80, ink) : strong),
        hover: r(`var(--brand, ${t.brand})`),
        ring: r(options.dark ? mix(card, 72, ink) : mix(card, 78, ink)),
        ringText: r(ink),
    };
}
let probe = null;
export function cssColor(where, css) {
    const swatch = document.createElement("i");
    swatch.style.color = css;
    where.append(swatch);
    const resolved = getComputedStyle(swatch).color;
    swatch.remove();
    probe ??= document.createElement("canvas").getContext("2d", { willReadFrequently: true });
    probe.clearRect(0, 0, 1, 1);
    probe.fillStyle = resolved;
    probe.fillRect(0, 0, 1, 1);
    const [r, g, b] = probe.getImageData(0, 0, 1, 1).data;
    return `rgb(${r}, ${g}, ${b})`;
}
export function isDark(where) {
    const scoped = where.closest(".dark, .light");
    return scoped ? scoped.classList.contains("dark") : matchMedia("(prefers-color-scheme: dark)").matches;
}
