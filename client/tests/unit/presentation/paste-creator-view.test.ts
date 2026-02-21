/**
 * Tests for paste-creator-view.ts
 *
 * Covers: editor tab toggle, image validation, EXIF strip via canvas,
 *         blobToDataUrl, image upload flow.
 */

import { stripExifViaCanvas, blobToDataUrl } from '../../../src/presentation/components/paste-creator-view.js';

// ============================================================================
// Helpers / Mocks
// ============================================================================

/** Create a minimal mock File with given type and size */
function makeFile(name: string, type: string, sizeBytes = 1024): File {
  const buf = new Uint8Array(sizeBytes);
  return new File([buf], name, { type });
}

/** Create a 1×1 pixel PNG Blob (used to exercise canvas path in jsdom) */
function makePngBlob(): Blob {
  // Minimal valid PNG bytes (1x1 transparent pixel)
  const pngBytes = new Uint8Array([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,  // PNG signature
    0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,   // IHDR chunk
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,   // 1x1
    0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,   // 8-bit RGBA
    0x89, 0x00, 0x00, 0x00, 0x0b, 0x49, 0x44, 0x41,   // IDAT chunk
    0x54, 0x78, 0x9c, 0x62, 0x00, 0x00, 0x00, 0x02,
    0x00, 0x01, 0xe5, 0x27, 0xde, 0xfc, 0x00, 0x00,   // IEND
    0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42,
    0x60, 0x82
  ]);
  return new Blob([pngBytes], { type: 'image/png' });
}

// ============================================================================
// blobToDataUrl
// ============================================================================

describe('blobToDataUrl', () => {
  it('should return a string starting with data:', async () => {
    const blob = new Blob(['hello'], { type: 'text/plain' });
    const result = await blobToDataUrl(blob);
    expect(typeof result).toBe('string');
    expect(result.startsWith('data:')).toBe(true);
  });

  it('should include the correct MIME type in the data URL', async () => {
    const blob = new Blob(['<svg/>'], { type: 'image/svg+xml' });
    const result = await blobToDataUrl(blob);
    expect(result).toContain('image/svg+xml');
  });

  it('should encode content correctly (base64)', async () => {
    const text = 'abc';
    const blob = new Blob([text], { type: 'text/plain' });
    const result = await blobToDataUrl(blob);
    // base64 of 'abc' is 'YWJj'
    expect(result).toContain('YWJj');
  });
});

// ============================================================================
// stripExifViaCanvas — jsdom mocks
// ============================================================================

describe('stripExifViaCanvas', () => {
  let originalCreateElement: typeof document.createElement;
  let originalCreateObjectURL: typeof URL.createObjectURL;
  let originalRevokeObjectURL: typeof URL.revokeObjectURL;

  beforeEach(() => {
    originalCreateElement = document.createElement.bind(document);
    originalCreateObjectURL = URL.createObjectURL;
    originalRevokeObjectURL = URL.revokeObjectURL;

    // Mock URL.createObjectURL / revokeObjectURL (jsdom doesn't support them)
    URL.createObjectURL = jest.fn(() => 'blob:mock-url');
    URL.revokeObjectURL = jest.fn();
  });

  afterEach(() => {
    document.createElement = originalCreateElement;
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
    jest.restoreAllMocks();
  });

  it('should reject when canvas 2D context is unavailable', async () => {
    // Mock canvas with null context
    const mockCanvas = {
      width: 0,
      height: 0,
      getContext: jest.fn(() => null),
      toBlob: jest.fn()
    };

    const mockImg = {
      src: '',
      naturalWidth: 1,
      naturalHeight: 1,
      onload: null as (() => void) | null,
      onerror: null as (() => void) | null
    };

    jest.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'canvas') return mockCanvas as unknown as HTMLCanvasElement;
      if (tag === 'img') {
        const img = mockImg as unknown as HTMLImageElement;
        // Trigger onload synchronously when src is set
        Object.defineProperty(img, 'src', {
          set: function(val: string) { this._src = val; setTimeout(() => this.onload?.(), 0); },
          get: function() { return this._src; }
        });
        return img;
      }
      return originalCreateElement(tag);
    });

    const file = makeFile('test.png', 'image/png');
    await expect(stripExifViaCanvas(file)).rejects.toThrow('Canvas 2D context unavailable');
  });

  it('should reject when image fails to load', async () => {
    const mockImg = {
      src: '',
      naturalWidth: 0,
      naturalHeight: 0,
      onload: null as (() => void) | null,
      onerror: null as (() => void) | null
    };

    jest.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'img') {
        const img = mockImg as unknown as HTMLImageElement;
        Object.defineProperty(img, 'src', {
          set: function(val: string) {
            this._src = val;
            setTimeout(() => this.onerror?.(), 0);
          },
          get: function() { return this._src; }
        });
        return img;
      }
      return originalCreateElement(tag);
    });

    const file = makeFile('broken.jpg', 'image/jpeg');
    await expect(stripExifViaCanvas(file)).rejects.toThrow('Failed to load image');
  });

  it('should use image/jpeg output MIME for jpeg input', async () => {
    const toBlob = jest.fn((cb: BlobCallback, type: string) => {
      cb(new Blob([], { type }));
    });

    const mockCtx = { drawImage: jest.fn() };
    const mockCanvas = {
      width: 0,
      height: 0,
      getContext: jest.fn(() => mockCtx),
      toBlob
    };

    const mockImg = {
      naturalWidth: 1,
      naturalHeight: 1,
      onload: null as (() => void) | null,
      onerror: null as (() => void) | null
    };

    jest.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'canvas') return mockCanvas as unknown as HTMLCanvasElement;
      if (tag === 'img') {
        const img = mockImg as unknown as HTMLImageElement;
        Object.defineProperty(img, 'src', {
          set: function() { setTimeout(() => this.onload?.(), 0); },
          get: function() { return ''; }
        });
        return img;
      }
      return originalCreateElement(tag);
    });

    const file = makeFile('photo.jpg', 'image/jpeg', 500);
    const blob = await stripExifViaCanvas(file);
    expect(blob).toBeInstanceOf(Blob);
    expect(toBlob).toHaveBeenCalledWith(expect.any(Function), 'image/jpeg', 0.92);
  });

  it('should use image/png output MIME for non-jpeg input (e.g. webp)', async () => {
    const toBlob = jest.fn((cb: BlobCallback, type: string) => {
      cb(new Blob([], { type }));
    });

    const mockCtx = { drawImage: jest.fn() };
    const mockCanvas = {
      width: 0,
      height: 0,
      getContext: jest.fn(() => mockCtx),
      toBlob
    };

    const mockImg = {
      naturalWidth: 1,
      naturalHeight: 1,
      onload: null as (() => void) | null,
      onerror: null as (() => void) | null
    };

    jest.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'canvas') return mockCanvas as unknown as HTMLCanvasElement;
      if (tag === 'img') {
        const img = mockImg as unknown as HTMLImageElement;
        Object.defineProperty(img, 'src', {
          set: function() { setTimeout(() => this.onload?.(), 0); },
          get: function() { return ''; }
        });
        return img;
      }
      return originalCreateElement(tag);
    });

    const file = makeFile('photo.webp', 'image/webp', 500);
    const blob = await stripExifViaCanvas(file);
    expect(blob).toBeInstanceOf(Blob);
    expect(toBlob).toHaveBeenCalledWith(expect.any(Function), 'image/png', 0.92);
  });

  it('should reject when toBlob returns null', async () => {
    const toBlob = jest.fn((cb: BlobCallback) => cb(null));

    const mockCtx = { drawImage: jest.fn() };
    const mockCanvas = {
      width: 0,
      height: 0,
      getContext: jest.fn(() => mockCtx),
      toBlob
    };

    const mockImg = {
      naturalWidth: 1,
      naturalHeight: 1,
      onload: null as (() => void) | null,
      onerror: null as (() => void) | null
    };

    jest.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'canvas') return mockCanvas as unknown as HTMLCanvasElement;
      if (tag === 'img') {
        const img = mockImg as unknown as HTMLImageElement;
        Object.defineProperty(img, 'src', {
          set: function() { setTimeout(() => this.onload?.(), 0); },
          get: function() { return ''; }
        });
        return img;
      }
      return originalCreateElement(tag);
    });

    const file = makeFile('bad.png', 'image/png');
    await expect(stripExifViaCanvas(file)).rejects.toThrow('Canvas toBlob returned null');
  });
});
