import { forwardRef } from "react";
// beUI's button and the helpers it moves with, as the registries ship them but for the import paths (src/registry)
import { Button as Base, ButtonLink as BaseLink, type ButtonLinkProps as BaseLinkProps, type ButtonProps as BaseProps } from "./registry/motion/button/base.js";
import { cn } from "./registry/lib/utils.js";
import { IsoLoader } from "../iso/index.js";

/* beUI's own link at its own sizes, for the site's pages (the landing keeps its own stylesheet, outside the panel's rules) */
export { ButtonLink as BeuiButtonLink, type ButtonSize, type ButtonVariant } from "./registry/motion/button/base.js";

/* The measurement standard's control: 28 high, a pill, its name on one line (12c, 20.10.2026: a narrowed control broke its name
   onto a second line the 28 cut off); an icon's button a 28 square with a control's corner. A tile (a card, a list's entry of two
   lines, a choice with its note) is not a control: as high as it holds, its words wrapping. */
const SIZED = {
  sm: "h-7 gap-2 whitespace-nowrap",
  md: "h-7 px-4 whitespace-nowrap",
  lg: "h-7 px-4 whitespace-nowrap",
  icon: "size-7 rounded-md",
  tile: "h-auto px-4 whitespace-normal",
} as const;

/* Every room used to hand-write this on top of the outline variant; now the variant carries it. */
const DESTRUCTIVE = "border-destructive/40 text-destructive hover:bg-destructive/10";

/* A row, a tile or a list entry that is a button: it is pressed and hovered without the control's scale, spread onto the Button
   (a tile, `size="tile"`, has it already). */
export const STILL = { pressScale: 1, whileHover: { scale: 1 } } as const;

/** `loading`: the work the button started still going (the owner, 23.10.2026: every wait isometric): one block where its icon stood
 * (iso.css hides the icon), the button not pressed again meanwhile, said busy. */
export type ButtonProps = Omit<BaseProps, "variant" | "size"> & { variant?: BaseProps["variant"] | "destructive"; size?: keyof typeof SIZED; loading?: boolean };

/* beUI's button as the rooms use it, an icon held at 16px unless it names its own size and its variant named on the element for the
   consumer's stylesheet (the panel's panel.css), said outside the component's file. The panel and Render each kept a copy of it
   until v0.3.0 (12e). */
/* beUI's own default variant, named here too: the element says the variant it is drawn in, the default's as well (a host's dress
   for bare buttons, Mies's .mies-forms, matches a button that names none) */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button({ className, variant = "primary", size = "md", loading = false, disabled, children, ...rest }, ref) {
  const destructive = variant === "destructive";
  const tile = size === "tile";
  return (
    <Base
      ref={ref}
      {...(tile ? STILL : {})}
      variant={destructive ? "outline" : variant}
      size={tile ? "md" : size}
      data-button={destructive ? "destructive" : variant}
      className={cn(SIZED[size], "[&_svg:not([class*='size-'])]:size-4", destructive && DESTRUCTIVE, className)}
      disabled={loading || disabled}
      {...(loading ? { "aria-busy": true, "data-loading": "" } : {})}
      {...rest}
    >
      {loading ? <IsoLoader size="button" quiet /> : null}
      {children}
    </Base>
  );
});

export type ButtonLinkProps = Omit<BaseLinkProps, "size"> & { size?: Exclude<keyof typeof SIZED, "tile"> };

/* The panel's link that looks a button (Aldo's way to a Zaha study): a control as the button is, 28 high, its name on one line, its
   icon at 16 and its variant named on the element; beUI's own link drew it 32 high with a 24px arrow (22.10.2026 scan). */
export const ButtonLink = forwardRef<HTMLAnchorElement, ButtonLinkProps>(function ButtonLink({ className, variant = "primary", size = "md", ...rest }, ref) {
  return (
    <BaseLink
      ref={ref}
      variant={variant}
      size={size}
      data-button={variant}
      className={cn(SIZED[size], "[&_svg:not([class*='size-'])]:size-4", className)}
      {...rest}
    />
  );
});
