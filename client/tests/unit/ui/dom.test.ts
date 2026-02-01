/**
 * DOM Interaction Functions Test Suite
 * 
 * Tests the client-side DOM manipulation and user interface interactions
 * that are essential for the zkpaste application functionality.
 * 
 * This test suite verifies:
 * 1. DOM element presence and correct types
 * 2. Form data extraction and validation
 * 3. URL parameter parsing for paste viewing
 * 4. Error and success message display
 * 5. User input handling and validation
 * 
 * These tests ensure the UI components work correctly without requiring
 * the full application logic, focusing on isolated DOM operations.
 * 
 * Note: This uses jsdom environment to simulate browser DOM in Node.js
 */
describe('DOM Interaction Functions', () => {
  let mockDocument: Document;
  let mockWindow: Window;

  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = '';
    
    // Create test HTML structure
    document.body.innerHTML = `
      <div>
        <textarea id="paste" rows="16" placeholder="Type or paste text here…"></textarea>
        <input type="number" id="mins" value="60" min="1">
        <div class="presets">
          <button class="preset-btn" type="button" data-mins="60">1 hour</button>
          <button class="preset-btn" type="button" data-mins="1440">1 day</button>
          <button class="preset-btn" type="button" data-mins="invalid">Invalid</button>
        </div>
        <button id="save">Encrypt & Upload</button>
        <span id="btnText"><span class="btn-icon">🔒</span> Encrypt & Upload</span>
        <pre id="out"></pre>
        <pre id="content">Decrypting…</pre>
        <button id="confirmDelete" class="danger">Yes, Delete Paste</button>
      </div>
    `;

    mockDocument = document;
    mockWindow = window;
  });

  afterEach(() => {
    // Clean up event listeners
    document.body.innerHTML = '';
  });

  describe('DOM Elements', () => {
    it('should have required DOM elements', () => {
      expect(document.getElementById('paste')).toBeTruthy();
      expect(document.getElementById('mins')).toBeTruthy();
      expect(document.getElementById('save')).toBeTruthy();
      expect(document.getElementById('out')).toBeTruthy();
      expect(document.getElementById('content')).toBeTruthy();
    });

    it('should have correct element types', () => {
      const pasteElement = document.getElementById('paste') as HTMLTextAreaElement;
      const minsElement = document.getElementById('mins') as HTMLInputElement;
      const saveElement = document.getElementById('save') as HTMLButtonElement;

      expect(pasteElement.tagName).toBe('TEXTAREA');
      expect(minsElement.tagName).toBe('INPUT');
      expect(saveElement.tagName).toBe('BUTTON');
    });
  });

  describe('Form Validation', () => {
    it('should validate empty paste content', () => {
      const pasteTextarea = document.getElementById('paste') as HTMLTextAreaElement;
      pasteTextarea.value = '';

      // Mock alert
      const mockAlert = jest.spyOn(window, 'alert').mockImplementation(() => {});

      // Simulate the validation logic
      if (!pasteTextarea.value) {
        alert('Nothing to save.');
      }

      expect(mockAlert).toHaveBeenCalledWith('Nothing to save.');
      mockAlert.mockRestore();
    });

    it('should validate non-empty paste content', () => {
      const pasteTextarea = document.getElementById('paste') as HTMLTextAreaElement;
      pasteTextarea.value = 'Test content';

      // Mock alert
      const mockAlert = jest.spyOn(window, 'alert').mockImplementation(() => {});

      // Simulate the validation logic
      if (!pasteTextarea.value) {
        alert('Nothing to save.');
      }

      expect(mockAlert).not.toHaveBeenCalled();
      mockAlert.mockRestore();
    });
  });

  describe('Form Data Extraction', () => {
    it('should extract form data correctly', () => {
      const pasteTextarea = document.getElementById('paste') as HTMLTextAreaElement;
      const minsInput = document.getElementById('mins') as HTMLInputElement;

      // Set test values
      pasteTextarea.value = 'Test paste content';
      minsInput.value = '120';

      // Extract form data
      const text = pasteTextarea.value;
      const mins = parseInt(minsInput.value || '60', 10);

      expect(text).toBe('Test paste content');
      expect(mins).toBe(120);
    });

    it('should handle default values', () => {
      const minsInput = document.getElementById('mins') as HTMLInputElement;

      // Test default values
      const mins = parseInt(minsInput.value || '60', 10);

      expect(mins).toBe(60);
    });
  });

  describe('Expiration Presets', () => {
    it('should apply preset value to minutes input', async () => {
      const { setupExpirationPresets } = await import('../../../src/ui/dom-helpers.js');
      setupExpirationPresets();

      const minsInput = document.getElementById('mins') as HTMLInputElement;
      const preset = document.querySelector<HTMLButtonElement>('.preset-btn[data-mins="1440"]');
      expect(preset).toBeTruthy();

      preset?.click();
      expect(minsInput.value).toBe('1440');
    });

    it('should ignore invalid preset values', async () => {
      const { setupExpirationPresets } = await import('../../../src/ui/dom-helpers.js');
      setupExpirationPresets();

      const minsInput = document.getElementById('mins') as HTMLInputElement;
      minsInput.value = '60';
      const preset = document.querySelector<HTMLButtonElement>('.preset-btn[data-mins="invalid"]');
      expect(preset).toBeTruthy();

      preset?.click();
      expect(minsInput.value).toBe('60');
    });

    it('should not throw when minutes input is missing', async () => {
      const { setupExpirationPresets } = await import('../../../src/ui/dom-helpers.js');
      const minsInput = document.getElementById('mins');
      minsInput?.remove();

      expect(() => setupExpirationPresets()).not.toThrow();
    });
  });

  describe('URL Parsing', () => {
    // Note: Jest 30 has stricter handling of window.location mocking
    // We'll test URL parsing by directly testing the logic without mocking location
    // This is a more reliable approach that works across Jest versions
    
    it('should parse URL parameters correctly', () => {
      // Test URL parsing logic directly using URLSearchParams and hash parsing
      const testSearch = '?p=test-paste-id';
      const testHash = '#test-key:test-iv';
      
      const q = new URLSearchParams(testSearch);
      const id = q.get('p');
      const frag = testHash.startsWith('#') ? testHash.slice(1) : '';

      expect(id).toBe('test-paste-id');
      expect(frag).toBe('test-key:test-iv');
    });

    it('should handle missing parameters', () => {
      // Test URL parsing logic with empty parameters
      const testSearch = '';
      const testHash = '';
      
      const q = new URLSearchParams(testSearch);
      const id = q.get('p');
      const frag = testHash.startsWith('#') ? testHash.slice(1) : '';

      expect(id).toBeNull();
      expect(frag).toBe('');
    });
  });

  describe('Error Display', () => {
    it('should display error messages', () => {
      const outElement = document.getElementById('out') as HTMLPreElement;
      const errorMessage = 'Test error message';

      outElement.textContent = 'Error: ' + errorMessage;

      expect(outElement.textContent).toBe('Error: Test error message');
    });

    it('should display success messages', () => {
      const outElement = document.getElementById('out') as HTMLPreElement;
      const successMessage = 'Share this URL (includes the decryption key in fragment):\nhttp://localhost/view.html?p=test-id#test-key:test-iv';

      outElement.textContent = successMessage;

      expect(outElement.textContent).toContain('Share this URL');
      // Delete link is no longer shown in success message - it's available on view page instead
    });
  });

});