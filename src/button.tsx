import { forwardRef } from "react";
// beUI's button and the helpers it moves with, as the registries ship them but for the import paths (src/registry)
import { Button as Base, type ButtonProps as BaseProps } from "./registry/motion/button/base.js";
import { cn } from "./registry/lib/utils.js";

export { ButtonLink, type ButtonLinkProps, type ButtonSize, type ButtonVariant } from "./registry/motion/button/base.js";

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

export type ButtonProps = Omit<BaseProps, "variant" | "size"> & { variant?: BaseProps["variant"] | "destructive"; size?: keyof typeof SIZED };

/* beUI's button as the rooms use it, an icon held at 16px unless it names its own size and its variant named on the element for the
   consumer's stylesheet (the panel's panel.css), said outside the component's file. The panel and Render each kept a copy of it
   until v0.3.0 (12e). */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button({ className, variant, size = "md", ...rest }, ref) {
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
      {...rest}
    />
  );
});
