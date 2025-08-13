// Fallback para JSX IntrinsicElements en entornos donde la lib DOM no se aplica correctamente en el linter.
// NOTA: Esto reduce verificación estricta de tipos de elementos HTML, pero evita falsos positivos del linter.
declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

export {};


