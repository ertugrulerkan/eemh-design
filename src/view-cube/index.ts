/* Revit's view cube, one for every 3D view of the panel (patron 23.10.2026: "renderdaki ve mies deki viewcube farklı. renderdakini baz
   alalım"): Render's, moved here whole (eemh-render src/engine/viewCube.ts as of 1.4.22) so Render and Mies draw the one cube, with
   its look (cubeLook) from the design's tokens. It is drawn in three.js's own frame (+Y up, the front face +Z); a host whose model
   stands otherwise turns what it hands the cube and what the cube hands back (Mies: +Z up, its front -Y). */
import {
  BoxGeometry, CanvasTexture, Color, DoubleSide, EdgesGeometry, Group, LinearMipmapLinearFilter, LineBasicMaterial, LineSegments, Matrix4, Mesh,
  MeshBasicMaterial, OrthographicCamera, PlaneGeometry, Quaternion, Raycaster, Scene, SRGBColorSpace, Vector2, Vector3, WebGLRenderer,
  type WebGLRendererParameters,
} from "three";

/** How the view cube looks: its size in CSS pixels, its words (face names, compass points) and its colours (any CSS colour). */
export interface ViewCubeLook {
  size: number;
  font: string;
  labels: { front: string; back: string; left: string; right: string; top: string; bottom: string };
  compass: { n: string; e: string; s: string; w: string };
  face: string;
  text: string;
  edge: string;
  hover: string;
  ring: string;
  ringText: string;
}

export interface ViewCubeHandlers {
  /** a face, an edge or a corner clicked: the direction (from the target to the eye) to look from, components -1, 0 or 1 */
  pick(direction: Vector3): void;
  /** the cube dragged: the pointer's move since the last call, in CSS pixels */
  orbit(dx: number, dy: number): void;
  orbitStart(): void;
  orbitEnd(): void;
}

/* A face is cut in three along each of its sides, as Revit's cube is: the middle square is the face, the strips along its sides the
   edges, the squares at its corners the corners; T is where the middle ends (the cube runs from -1 to 1). */
const T = 0.6;
/* how far the compass ring reaches, and the camera's half view that holds the ring and the cube from any side */
const RING_IN = 1.5, RING_OUT = 2.08, HALF = 2.22;
/* a light from over the viewer's left shoulder: a face turned to it is the face's own colour, one turned away a little darker */
const LIGHT = new Vector3(-0.55, 0.8, 0.55).normalize();
const SHADE = 0.74;

const AXES = [new Vector3(1, 0, 0), new Vector3(0, 1, 0), new Vector3(0, 0, 1)];

/** The direction a point on the cube's surface (in its own space) stands for: per axis, ±1 past the middle third, else 0. */
export function cubeZone(point: Vector3): Vector3 {
  const v = [point.x, point.y, point.z];
  const top = Math.max(...v.map(Math.abs));
  // the face the point is on counts whatever its depth; the other two axes count past T
  return new Vector3(...v.map((c) => (Math.abs(c) >= top - 1e-6 || Math.abs(c) > T ? Math.sign(c) : 0)));
}

/** The patches of the cube's surface that make up a zone: one on each face the zone touches. */
function zonePatches(dir: Vector3): Matrix4[] {
  const d = [dir.x, dir.y, dir.z];
  const out: Matrix4[] = [];
  for (let a = 0; a < 3; a++) {
    if (!d[a]) continue;
    const [b, c] = [0, 1, 2].filter((i) => i !== a);
    const span = (s: number) => (s === 0 ? [-T, T] : s > 0 ? [T, 1] : [-1, -T]);
    const [b0, b1] = span(d[b]), [c0, c1] = span(d[c]);
    const centre = new Vector3();
    centre.setComponent(a, d[a] * 1.004).setComponent(b, (b0 + b1) / 2).setComponent(c, (c0 + c1) / 2);
    out.push(new Matrix4().makeBasis(AXES[b].clone().multiplyScalar(b1 - b0), AXES[c].clone().multiplyScalar(c1 - c0), AXES[a]).setPosition(centre));
  }
  return out;
}

/** CSS colour to a three.js colour (sRGB in, three's working space out). */
const color = (css: string) => new Color(css);

/** A face's picture: its colour and its name, as large as the face holds. */
function faceTexture(look: ViewCubeLook, label: string, px: number) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = px;
  const g = canvas.getContext("2d")!;
  g.fillStyle = look.face;
  g.fillRect(0, 0, px, px);
  let size = px * 0.25;
  g.font = `600 ${size}px ${look.font}`;
  const room = px * 0.84;
  const wide = g.measureText(label).width;
  if (wide > room) size *= room / wide;
  g.font = `600 ${size}px ${look.font}`;
  g.fillStyle = look.text;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(label, px / 2, px / 2 + size * 0.04);
  return texture(canvas);
}

/** The compass ring seen from above, north up: a band with the four points on it, upright as a plan's compass rose reads. */
function ringTexture(look: ViewCubeLook, px: number) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = px;
  const g = canvas.getContext("2d")!;
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
  const points: [string, number][] = [[look.compass.n, 0], [look.compass.e, 90], [look.compass.s, 180], [look.compass.w, 270]];
  g.font = `700 ${(RING_OUT - RING_IN) * unit * 0.9}px ${look.font}`;
  for (const [letter, deg] of points) {
    const a = (deg * Math.PI) / 180;
    g.fillText(letter, c + Math.sin(a) * mid, c - Math.cos(a) * mid);
  }
  return texture(canvas);
}

function texture(canvas: HTMLCanvasElement) {
  const t = new CanvasTexture(canvas);
  t.colorSpace = SRGBColorSpace;
  t.minFilter = LinearMipmapLinearFilter;
  t.anisotropy = 4;
  return t;
}

/**
 * Revit's view cube, drawn by a small renderer of its own: a shaded cube seen straight on (an orthographic camera, no
 * perspective), its faces named, its 26 zones (6 faces, 12 edges, 8 corners) lit under the pointer, and the compass ring at its
 * foot. It turns as `render` is handed the orbit camera's orientation; what the pointer does is handed back (ViewCubeHandlers).
 */
export class ViewCube {
  readonly canvas: HTMLCanvasElement;
  private renderer: WebGLRenderer;
  private scene = new Scene();
  private camera = new OrthographicCamera(-HALF, HALF, HALF, -HALF, 0.1, 20);
  private cube = new Mesh(new BoxGeometry(2, 2, 2), [0, 1, 2, 3, 4, 5].map(() => new MeshBasicMaterial()));
  private edges = new LineSegments(new EdgesGeometry(new BoxGeometry(2.004, 2.004, 2.004)), new LineBasicMaterial());
  private ring = new Mesh(new PlaneGeometry(RING_OUT * 2, RING_OUT * 2), new MeshBasicMaterial({ transparent: true, depthWrite: false, side: DoubleSide }));
  private lit = new Group();
  private litMaterial = new MeshBasicMaterial({ transparent: true, opacity: 0.55, depthWrite: false, side: DoubleSide, polygonOffset: true, polygonOffsetFactor: -1 });
  private patch = new PlaneGeometry(1, 1);
  private hovered: Vector3 | null = null;
  private turned = new Quaternion(NaN, 0, 0, 0);
  private dirty = true;
  private size = 0;
  private press: { x: number; y: number; dragging: boolean } | null = null;
  private ray = new Raycaster();

  /** `renderer`: how its renderer is made, where a host makes every renderer one way (Mies's, which says a browser without WebGL in
   * the page's words); three's own by default. */
  constructor(
    private handlers: ViewCubeHandlers,
    renderer: (options: WebGLRendererParameters) => WebGLRenderer = (options) => new WebGLRenderer(options),
  ) {
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

  /** Its size and colours (night or day) and its words (the language); called again whenever one of them changes. */
  style(look: ViewCubeLook) {
    if (look.size !== this.size) {
      this.size = look.size;
      this.renderer.setSize(look.size, look.size);
    }
    const px = 256;
    const l = look.labels;
    // BoxGeometry's groups: +x, -x, +y, -y, +z, -z
    [l.right, l.left, l.top, l.bottom, l.front, l.back].forEach((label, i) => {
      const m = (this.cube.material as MeshBasicMaterial[])[i];
      m.map?.dispose();
      m.map = faceTexture(look, label, px);
      m.needsUpdate = true;
    });
    const ring = this.ring.material as MeshBasicMaterial;
    ring.map?.dispose();
    ring.map = ringTexture(look, px * 2);
    ring.needsUpdate = true;
    (this.edges.material as LineBasicMaterial).color = color(look.edge);
    this.litMaterial.color = color(look.hover);
    this.dirty = true;
  }

  /** North's bearing in the scene, in degrees (the sky's north offset: 0 puts north at -Z). */
  setNorth(degrees: number) {
    const y = (-degrees * Math.PI) / 180;
    if (this.ring.rotation.y === y) return;
    this.ring.rotation.y = y;
    this.dirty = true;
  }

  /** Draws the cube turned as the orbit camera is turned; nothing is drawn when nothing changed. */
  render(orientation: Quaternion) {
    if (!this.dirty && this.turned.equals(orientation)) return;
    this.turned.copy(orientation);
    this.dirty = false;
    this.camera.quaternion.copy(orientation);
    this.camera.position.set(0, 0, 10).applyQuaternion(orientation);
    this.camera.updateMatrixWorld();
    // the shading: each face as bright as it is turned to the light, which stands with the viewer
    const light = LIGHT.clone().applyQuaternion(orientation);
    const normals = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
    (this.cube.material as MeshBasicMaterial[]).forEach((m, i) => {
      const lit = Math.max(0, new Vector3(...normals[i]).dot(light));
      m.color.setScalar(SHADE + (1 - SHADE) * lit);
    });
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.canvas.remove();
    for (const m of this.cube.material as MeshBasicMaterial[]) { m.map?.dispose(); m.dispose(); }
    (this.ring.material as MeshBasicMaterial).map?.dispose();
    for (const o of [this.cube, this.ring, this.edges]) { o.geometry.dispose(); (o.material as MeshBasicMaterial).dispose?.(); }
    this.patch.dispose();
    this.litMaterial.dispose();
    this.renderer.dispose();
    // its WebGL context at once: disposed alone it stays until a collection, and past the browser's few live contexts the oldest is
    // lost, a long-lived view among them (vps-bulut, Mies 28.10.2026)
    this.renderer.forceContextLoss();
  }

  /** The zone under a pointer, or null off the cube. */
  private zoneAt(e: PointerEvent): Vector3 | null {
    const r = this.canvas.getBoundingClientRect();
    this.ray.setFromCamera(new Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), this.camera);
    const hit = this.ray.intersectObject(this.cube, false)[0];
    return hit ? cubeZone(hit.point) : null;
  }

  private light(zone: Vector3 | null) {
    if (zone === this.hovered || (zone && this.hovered?.equals(zone))) return;
    this.hovered = zone;
    this.lit.clear();
    if (zone) for (const m of zonePatches(zone)) { const p = new Mesh(this.patch, this.litMaterial); p.matrixAutoUpdate = false; p.matrix.copy(m); this.lit.add(p); }
    this.canvas.style.cursor = zone ? "pointer" : "";
    this.dirty = true;
  }

  private onMove = (e: PointerEvent) => {
    if (this.press) {
      const dx = e.clientX - this.press.x, dy = e.clientY - this.press.y;
      if (!this.press.dragging && Math.hypot(dx, dy) < 3) return;
      if (!this.press.dragging) { this.press.dragging = true; this.light(null); this.handlers.orbitStart(); }
      this.press.x = e.clientX;
      this.press.y = e.clientY;
      this.handlers.orbit(dx, dy);
      return;
    }
    this.light(this.zoneAt(e));
  };

  private onDown = (e: PointerEvent) => {
    if (e.button !== 0) return;
    this.canvas.setPointerCapture(e.pointerId);
    this.press = { x: e.clientX, y: e.clientY, dragging: false };
  };

  private onUp = (e: PointerEvent) => {
    const press = this.press;
    this.press = null;
    if (!press) return;
    if (press.dragging) { this.handlers.orbitEnd(); return; }
    const zone = this.zoneAt(e);
    if (zone && e.type === "pointerup") this.handlers.pick(zone);
  };

  private onLeave = () => {
    if (!this.press) this.light(null);
  };
}

/** The cube's box in CSS pixels, its compass ring included (Render's). */
export const CUBE_SIZE = 116;

/* The tokens the cube's look is mixed from, with the design's own values where a host defines none (Mies's standalone page): kept
   equal to tokens/ by test/view-cube.test.mjs. */
export const CUBE_TOKENS = {
  light: { card: "oklch(1 0 0)", foreground: "oklch(0.145 0 0)", border: "oklch(0.922 0 0)", brand: "#ff4c00" },
  dark: { card: "oklch(0.205 0 0)", foreground: "oklch(0.985 0 0)", border: "oklch(1 0 0 / 10%)", brand: "#ff4c00" },
};

/**
 * The cube's look as Render wears it, from the design's tokens (the host's where it defines them): a light cube in either theme, a
 * shade off the surfaces round it, its words and edges in the panel's ink, the zone under the pointer in the brand's colour. Each
 * colour a CSS expression; `resolve` turns it into one three.js and a canvas read (cssColor).
 */
export function cubeLook(options: {
  dark: boolean;
  labels: ViewCubeLook["labels"];
  compass: ViewCubeLook["compass"];
  resolve: (css: string) => string;
}): ViewCubeLook {
  const t = options.dark ? CUBE_TOKENS.dark : CUBE_TOKENS.light;
  const card = `var(--card, ${t.card})`,
    ink = `var(--foreground, ${t.foreground})`,
    strong = `var(--border-strong, color-mix(in oklch, var(--border, ${t.border}) 45%, ${ink} 55%))`;
  const mix = (a: string, share: number, b: string) => `color-mix(in oklab, ${a} ${share}%, ${b} ${100 - share}%)`;
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

let probe: CanvasRenderingContext2D | null = null;

/** A CSS colour (a token, or any expression of tokens) as three.js and a canvas read it, resolved where it stands (`where`): the
 * browser resolves it (oklch, color-mix) and a pixel gives it back as sRGB. */
export function cssColor(where: HTMLElement, css: string): string {
  const swatch = document.createElement("i");
  swatch.style.color = css;
  where.append(swatch);
  const resolved = getComputedStyle(swatch).color;
  swatch.remove();
  probe ??= document.createElement("canvas").getContext("2d", { willReadFrequently: true })!;
  probe.clearRect(0, 0, 1, 1);
  probe.fillStyle = resolved;
  probe.fillRect(0, 0, 1, 1);
  const [r, g, b] = probe.getImageData(0, 0, 1, 1).data;
  return `rgb(${r}, ${g}, ${b})`;
}

/** Night where `where` stands: the nearest .dark or .light round it (a host's own choice), else the machine's colour scheme. */
export function isDark(where: HTMLElement): boolean {
  const scoped = where.closest(".dark, .light");
  return scoped ? scoped.classList.contains("dark") : matchMedia("(prefers-color-scheme: dark)").matches;
}
