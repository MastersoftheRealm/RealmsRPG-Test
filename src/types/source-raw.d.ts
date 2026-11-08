/** Vitest/Vite `?raw` imports used in guard tests (no runtime bundle). */
declare module '*?raw' {
  const content: string;
  export default content;
}
