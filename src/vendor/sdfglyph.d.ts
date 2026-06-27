export type CcallReturnType = 'number' | 'string' | null;

export type CcallArgumentType = 'number' | 'string';

export interface SdfGlyphModule {
  HEAPU8: Uint8Array;
  wasmBinary?: ArrayBuffer | Uint8Array;
  onRuntimeInitialized?: () => void;
  onAbort?: (reason: unknown) => void;
  print?: (...args: unknown[]) => void;
  printErr?: (...args: unknown[]) => void;
  ccall(
    ident: string,
    returnType: CcallReturnType,
    argTypes: CcallArgumentType[],
    args: Array<number | string>,
  ): number | string | null;
  _malloc(size: number): number;
  _free(ptr: number): void;
  UTF8ToString(ptr: number, maxBytesToRead?: number): string;
}
