/**
 * Tests for sanitize.ts - HTML sanitizer
 *
 * High-risk change: runs on untrusted paste content rendered as markdown.
 * Requires 100% test coverage per the High-Risk Change Protocol.
 *
 * Covers: blocked tags, event handler attributes, javascript: URLs,
 *         safe pass-through HTML, empty input, nested dangerous elements.
 */

import { sanitizeHtml } from '../../../../src/core/utils/sanitize.js';

describe('sanitizeHtml', () => {
  // =========================================================================
  // Blocked Tags
  // =========================================================================

  describe('blocked tags', () => {
    it('should remove <script> tags entirely', () => {
      const result = sanitizeHtml('<script>alert("xss")</script><p>hello</p>');
      expect(result).not.toContain('<script');
      expect(result).not.toContain('alert');
      expect(result).toContain('<p>hello</p>');
    });

    it('should remove <iframe> tags entirely', () => {
      const result = sanitizeHtml('<iframe src="https://evil.com"></iframe><p>safe</p>');
      expect(result).not.toContain('<iframe');
      expect(result).toContain('<p>safe</p>');
    });

    it('should remove <object> tags entirely', () => {
      const result = sanitizeHtml('<object data="evil.swf"></object><span>ok</span>');
      expect(result).not.toContain('<object');
      expect(result).toContain('<span>ok</span>');
    });

    it('should remove <embed> tags entirely', () => {
      const result = sanitizeHtml('<embed src="evil.swf"><span>ok</span>');
      expect(result).not.toContain('<embed');
      expect(result).toContain('<span>ok</span>');
    });

    it('should remove <form> tags entirely', () => {
      const result = sanitizeHtml('<form action="https://phish.com"><p>content</p></form>');
      expect(result).not.toContain('<form');
      expect(result).not.toContain('phish');
    });

    it('should remove <input> tags entirely', () => {
      const result = sanitizeHtml('<input type="text" name="cc"><p>safe</p>');
      expect(result).not.toContain('<input');
      expect(result).toContain('<p>safe</p>');
    });

    it('should remove <button> tags entirely', () => {
      const result = sanitizeHtml('<button onclick="evil()">click</button><p>safe</p>');
      expect(result).not.toContain('<button');
      expect(result).toContain('<p>safe</p>');
    });

    it('should remove <link> tags entirely', () => {
      const result = sanitizeHtml('<link rel="stylesheet" href="evil.css"><p>safe</p>');
      expect(result).not.toContain('<link');
      expect(result).toContain('<p>safe</p>');
    });

    it('should remove <meta> tags entirely', () => {
      const result = sanitizeHtml('<meta http-equiv="refresh" content="0;url=evil.com"><p>safe</p>');
      expect(result).not.toContain('<meta');
      expect(result).toContain('<p>safe</p>');
    });

    it('should remove <base> tags entirely', () => {
      const result = sanitizeHtml('<base href="https://evil.com"><p>safe</p>');
      expect(result).not.toContain('<base');
      expect(result).toContain('<p>safe</p>');
    });

    it('should remove <style> tags entirely', () => {
      const result = sanitizeHtml('<style>body{display:none}</style><p>safe</p>');
      expect(result).not.toContain('<style');
      expect(result).not.toContain('display:none');
      expect(result).toContain('<p>safe</p>');
    });
  });

  // =========================================================================
  // Event Handler Attributes
  // =========================================================================

  describe('event handler attributes (on*)', () => {
    it('should strip onclick attribute', () => {
      const result = sanitizeHtml('<p onclick="alert(1)">hello</p>');
      expect(result).not.toContain('onclick');
      expect(result).toContain('<p>hello</p>');
    });

    it('should strip onload attribute', () => {
      const result = sanitizeHtml('<img src="x" onload="evil()">');
      expect(result).not.toContain('onload');
    });

    it('should strip onerror attribute', () => {
      const result = sanitizeHtml('<img src="x" onerror="evil()">');
      expect(result).not.toContain('onerror');
    });

    it('should strip onmouseover attribute', () => {
      const result = sanitizeHtml('<div onmouseover="evil()">hover</div>');
      expect(result).not.toContain('onmouseover');
      expect(result).toContain('hover');
    });

    it('should strip all on* attributes case-insensitively', () => {
      const result = sanitizeHtml('<div ONClick="evil()" ONLOAD="evil()">text</div>');
      expect(result).not.toContain('ONClick');
      expect(result).not.toContain('ONLOAD');
      expect(result).toContain('text');
    });

    it('should strip onsubmit on non-blocked tags', () => {
      // form is blocked, but test with a div that has an on* attr
      const result = sanitizeHtml('<div onsubmit="evil()">content</div>');
      expect(result).not.toContain('onsubmit');
      expect(result).toContain('content');
    });
  });

  // =========================================================================
  // javascript: URL Schemes
  // =========================================================================

  describe('javascript: URL schemes', () => {
    it('should strip javascript: href from anchor tags', () => {
      const result = sanitizeHtml('<a href="javascript:alert(1)">click</a>');
      expect(result).not.toContain('javascript:');
      expect(result).toContain('click');
    });

    it('should strip javascript: src from img tags', () => {
      const result = sanitizeHtml('<img src="javascript:evil()">');
      expect(result).not.toContain('javascript:');
    });

    it('should strip javascript: href with leading whitespace', () => {
      const result = sanitizeHtml('<a href="  javascript:alert(1)">click</a>');
      expect(result).not.toContain('javascript:');
    });

    it('should keep safe https:// href intact', () => {
      const result = sanitizeHtml('<a href="https://example.com">link</a>');
      expect(result).toContain('href="https://example.com"');
    });

    it('should keep safe relative href intact', () => {
      const result = sanitizeHtml('<a href="/about">about</a>');
      expect(result).toContain('href="/about"');
    });
  });

  // =========================================================================
  // Safe HTML Pass-Through
  // =========================================================================

  describe('safe HTML pass-through', () => {
    it('should pass through headings unchanged', () => {
      const result = sanitizeHtml('<h1>Title</h1><h2>Subtitle</h2>');
      expect(result).toContain('<h1>Title</h1>');
      expect(result).toContain('<h2>Subtitle</h2>');
    });

    it('should pass through paragraphs and text formatting', () => {
      const result = sanitizeHtml('<p>Hello <strong>world</strong> and <em>italic</em></p>');
      expect(result).toContain('<strong>world</strong>');
      expect(result).toContain('<em>italic</em>');
    });

    it('should pass through code and pre blocks', () => {
      const result = sanitizeHtml('<pre><code>const x = 1;</code></pre>');
      expect(result).toContain('<pre>');
      expect(result).toContain('<code>');
      expect(result).toContain('const x = 1;');
    });

    it('should pass through safe anchor tags with https', () => {
      const result = sanitizeHtml('<a href="https://example.com" target="_blank">link</a>');
      expect(result).toContain('href="https://example.com"');
      expect(result).toContain('link');
    });

    it('should pass through img tags with safe src', () => {
      const result = sanitizeHtml('<img src="https://example.com/img.png" alt="image">');
      expect(result).toContain('src="https://example.com/img.png"');
      expect(result).toContain('alt="image"');
    });

    it('should pass through unordered and ordered lists', () => {
      const result = sanitizeHtml('<ul><li>item 1</li><li>item 2</li></ul>');
      expect(result).toContain('<ul>');
      expect(result).toContain('<li>item 1</li>');
    });

    it('should pass through blockquotes', () => {
      const result = sanitizeHtml('<blockquote><p>Quote text</p></blockquote>');
      expect(result).toContain('<blockquote>');
      expect(result).toContain('Quote text');
    });

    it('should pass through tables', () => {
      const result = sanitizeHtml('<table><tr><th>H</th><td>D</td></tr></table>');
      expect(result).toContain('<table>');
      expect(result).toContain('<th>H</th>');
    });
  });

  // =========================================================================
  // Edge Cases
  // =========================================================================

  describe('edge cases', () => {
    it('should handle empty string without error', () => {
      const result = sanitizeHtml('');
      expect(result).toBe('');
    });

    it('should handle already-clean HTML without modification', () => {
      const clean = '<p>Hello world</p>';
      const result = sanitizeHtml(clean);
      expect(result).toBe(clean);
    });

    it('should handle nested dangerous elements', () => {
      const result = sanitizeHtml('<div><script>evil()</script><p>safe</p></div>');
      expect(result).not.toContain('<script');
      expect(result).not.toContain('evil()');
      expect(result).toContain('<p>safe</p>');
    });

    it('should handle multiple dangerous elements in sequence', () => {
      const result = sanitizeHtml(
        '<script>a()</script><iframe src="x"></iframe><p>ok</p><embed src="y">'
      );
      expect(result).not.toContain('<script');
      expect(result).not.toContain('<iframe');
      expect(result).not.toContain('<embed');
      expect(result).toContain('<p>ok</p>');
    });

    it('should handle elements with mixed safe and dangerous attrs', () => {
      const result = sanitizeHtml('<a href="https://safe.com" onclick="evil()">link</a>');
      expect(result).toContain('href="https://safe.com"');
      expect(result).not.toContain('onclick');
    });

    it('should return a string type', () => {
      expect(typeof sanitizeHtml('<p>test</p>')).toBe('string');
    });
  });
});
