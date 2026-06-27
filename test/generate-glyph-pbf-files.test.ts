import { readFile } from 'node:fs/promises';
import { basename } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  allBmpRanges,
  basicLatinRanges,
  generateGlyphPbfFiles,
  latinRanges,
  range256,
} from '../src/index.js';

const fixturesUrl = new URL('./fixtures/', import.meta.url);

describe('range helpers', () => {
  it('creates aligned MapLibre glyph ranges', () => {
    expect(range256(256)).toEqual({ start: 256, end: 511 });
    expect(basicLatinRanges()).toEqual([{ start: 0, end: 255 }]);
    expect(latinRanges()).toEqual([
      { start: 0, end: 255 },
      { start: 256, end: 511 },
      { start: 512, end: 767 },
    ]);
  });

  it('creates every BMP range explicitly', () => {
    const ranges = allBmpRanges();

    expect(ranges).toHaveLength(256);
    expect(ranges[0]).toEqual({ start: 0, end: 255 });
    expect(ranges.at(-1)).toEqual({ start: 65280, end: 65535 });
  });

  it('rejects unaligned ranges', () => {
    expect(() => range256(1)).toThrow('aligned to 256');
    expect(() => range256(65_536)).toThrow('BMP range');
  });
});

describe('generateGlyphPbfFiles', () => {
  it('generates expected filenames and bytes for the upstream sample font', async () => {
    const fontBytes = new Uint8Array(await readFile(new URL('Barlow-Regular.ttf', fixturesUrl)));
    const files = await generateGlyphPbfFiles({
      fontstack: 'Barlow Regular',
      fonts: [
        {
          name: 'Barlow Regular',
          bytes: fontBytes,
        },
      ],
      ranges: [range256(0), range256(256)],
    });

    expect(files.map((file) => file.filename)).toEqual([
      'Barlow Regular/0-255.pbf',
      'Barlow Regular/256-511.pbf',
    ]);

    for (const file of files) {
      expect(file.bytes.byteLength).toBeGreaterThan(0);

      const expected = await readFile(new URL(`expected/${basename(file.filename)}`, fixturesUrl));
      expect(Buffer.compare(Buffer.from(file.bytes), expected)).toBe(0);
    }
  });

  it('rejects invalid inputs before entering WASM generation', async () => {
    const fontBytes = new Uint8Array(await readFile(new URL('Barlow-Regular.ttf', fixturesUrl)));
    const validOptions = {
      fontstack: 'Barlow Regular',
      fonts: [{ name: 'Barlow Regular', bytes: fontBytes }],
      ranges: [range256(0)],
    };

    await expect(generateGlyphPbfFiles({ ...validOptions, fontstack: '' })).rejects.toThrow(
      'fontstack must be a non-empty string',
    );
    await expect(generateGlyphPbfFiles({ ...validOptions, fonts: [] })).rejects.toThrow(
      'fonts must contain at least one font',
    );
    await expect(
      generateGlyphPbfFiles({
        ...validOptions,
        fonts: [{ name: 'not a font', bytes: new Uint8Array([1, 2, 3, 4]) }],
      }),
    ).rejects.toThrow('not a supported TTF or OTF font');
    await expect(
      generateGlyphPbfFiles({ ...validOptions, ranges: [{ start: 0, end: 254 }] }),
    ).rejects.toThrow('must be a 256-codepoint range');
    await expect(
      generateGlyphPbfFiles({ ...validOptions, ranges: [range256(0), range256(0)] }),
    ).rejects.toThrow('Duplicate glyph range');
  });
});
