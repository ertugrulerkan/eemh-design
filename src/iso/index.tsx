import type { CSSProperties, ReactNode } from "react";
import { isoDrawing, isoFaceClass, isoPartStyle, type IsoDrawn, type IsoMotif } from "./geometry.js";

export { CYCLE, isoDrawing, isoFaceClass, isoPartStyle } from "./geometry.js";
export type { IsoDrawing, IsoDrawn, IsoFace, IsoMotif, IsoMotion, IsoPart } from "./geometry.js";

/* Every wait and every empty place, drawn isometric (the owner, 23.10.2026; ui-rules M1, M2): the drawing of ./geometry.ts as an SVG,
   its faces in the theme's own tones (iso.css), only transform and opacity moving, still and whole where motion is asked to be
   reduced. One drawing sized by where it stands (`size`), its motif by the room (`motif`). A wait holds the box of what it stands
   for, so nothing moves when that comes. The panel and Render each wrap it with their own words for "Loading…". */

export type IsoSize = "screen" | "section" | "card" | "fit" | "row" | "button";

// the classes given, the unset ones left out (no class merger: a page's first wait draws this too, and carries nothing more)
const cn = (...names: (string | false | null | undefined)[]) => names.filter(Boolean).join(" ");

const SIZES: Record<IsoSize, { box: string; drawing: string }> = {
  // a page or a room opening: the drawing in the middle of what it stands for, its words under it
  screen: { box: "flex min-h-full w-full flex-1 flex-col items-center justify-center gap-4 py-8", drawing: "h-28 w-40" },
  // a section or a card: as large as the box of what is coming, the drawing in its middle
  section: { box: "flex h-full min-h-24 w-full flex-col items-center justify-center gap-2 py-8", drawing: "h-24 w-32" },
  card: { box: "flex h-full min-h-16 w-full flex-col items-center justify-center gap-2 py-4", drawing: "h-16 w-24" },
  // exactly the box it is given (its `style`: a few rows of figures), the drawing as tall as that box, words beside it
  fit: { box: "flex w-full items-center justify-center gap-3", drawing: "h-full max-h-20 w-auto" },
  // in a line of text, and on a button: one block
  row: { box: "inline-flex items-center gap-2 align-middle", drawing: "size-4" },
  button: { box: "inline-flex items-center", drawing: "size-3.5" },
};

/** The drawing alone: `idle`, an empty place's, whole and breathing slowly. */
export function IsoDrawingSvg({ motif, className, idle = false }: { motif: IsoDrawn; className?: string; idle?: boolean }) {
  const drawn = isoDrawing(motif);
  return (
    <svg viewBox={drawn.view} aria-hidden="true" className={cn("iso shrink-0 overflow-visible", idle && "iso-idle", className)}>
      <g className={idle ? "iso-float" : undefined}>
        {drawn.parts.map((part, k) => (
          <g key={k} className={`iso-${part.motion}`} style={isoPartStyle(part) as CSSProperties}>
            {part.faces.map((face, f) => <polygon key={f} className={isoFaceClass(face)} points={face.points} />)}
          </g>
        ))}
      </g>
    </svg>
  );
}

/** A wait: the drawing, unseen under 150 ms, said to a screen reader as `label` (what is coming); `said`: the words under it where
 * the person reads them (a page, a room; in a row, beside it in the line's own type). `quiet`: one of several inside a wait already
 * said (a figure among figures, a button's own), drawn and never said again. `style`: the box of what it stands for, where that is
 * no class's (rows of figures). */
export function IsoLoader({ size = "section", motif = "blocks", label, said, quiet = false, className, style }: {
  size?: IsoSize; motif?: IsoMotif; label?: string; said?: ReactNode; quiet?: boolean; className?: string; style?: CSSProperties;
}) {
  const small = size === "row" || size === "button";
  return (
    <span role={quiet ? undefined : "status"} aria-hidden={quiet || undefined} className={cn("iso-wait", SIZES[size].box, className)} style={style}>
      <IsoDrawingSvg motif={small ? "block" : motif} className={SIZES[size].drawing} />
      {said ? <span className={small ? undefined : "text-[13.5px] text-muted-foreground"}>{said}</span>
        : quiet || !label ? null : <span className="sr-only">{label}</span>}
    </span>
  );
}

/** A map's or a canvas's wait (its style and tiles, its drawing's code): its whole box, the drawing in its middle. */
export function IsoFill({ motif = "building", label }: { motif?: IsoMotif; label?: string }) {
  return (
    <div className="absolute inset-0 grid place-items-center bg-muted/40">
      <IsoLoader motif={motif} label={label} />
    </div>
  );
}

/** An empty place: the drawing at rest, breathing slowly, over its one honest sentence (ui-rules M2); `title`: what the place
 * holds when it holds something, over the sentence; `action`: the one way to fill it; size `row`: a line among others. Every room's
 * empty place is this one. */
export function IsoEmpty({ motif = "grid", size = "section", title, children, action, className }: {
  motif?: IsoMotif; size?: Exclude<IsoSize, "button">; title?: ReactNode; children?: ReactNode; action?: ReactNode; className?: string;
}) {
  // a line among others (a panel's short list, a table's row): one block at rest before its words, in the line's own type
  if (size === "row") return <span className={cn(SIZES.row.box, className)}><IsoDrawingSvg motif="block" className={SIZES.row.drawing} idle /><span>{children}</span></span>;
  return (
    <div className={cn(SIZES[size].box, "text-center", className)}>
      <IsoDrawingSvg motif={motif} className={SIZES[size].drawing} idle />
      {title ? <p className="text-[15px] font-medium text-foreground">{title}</p> : null}
      {children ? <p className="max-w-md text-[13.5px] text-muted-foreground">{children}</p> : null}
      {action ? <div className="mt-2 flex flex-wrap justify-center gap-2">{action}</div> : null}
    </div>
  );
}
