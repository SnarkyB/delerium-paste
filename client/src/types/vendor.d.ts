/**
 * Global type declarations for vendor scripts loaded via <script> tags.
 * These are IIFE/UMD builds that expose globals on window.
 */

declare const marked: {
  parse: (src: string, options?: { gfm?: boolean; breaks?: boolean }) => string;
};

declare const hljs: {
  highlightElement: (el: HTMLElement) => void;
};
