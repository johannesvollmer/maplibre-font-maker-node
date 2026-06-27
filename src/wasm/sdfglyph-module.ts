export type Pointer = number;

export type CcallReturnType = 'number' | 'string' | null;

export type CcallArgumentType = 'number' | 'string';

export interface FontMakerModule {
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

export function ccallNumber(
  module: FontMakerModule,
  ident: string,
  argTypes: CcallArgumentType[],
  args: Array<number | string>,
): number {
  const result = module.ccall(ident, 'number', argTypes, args);

  if (typeof result !== 'number') {
    throw new Error(`Expected ${ident} to return a number.`);
  }

  return result;
}

export function ccallVoid(
  module: FontMakerModule,
  ident: string,
  argTypes: CcallArgumentType[],
  args: Array<number | string>,
): void {
  module.ccall(ident, null, argTypes, args);
}
