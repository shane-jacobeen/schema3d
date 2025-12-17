/// <reference types="vite/client" />

declare module "*.sql?raw" {
  const content: string;
  export default content;
}

declare module "*.mmd?raw" {
  const content: string;
  export default content;
}

declare module "*.mermaid?raw" {
  const content: string;
  export default content;
}
