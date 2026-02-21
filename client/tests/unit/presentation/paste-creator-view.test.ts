/**
 * Tests for paste-creator-view.ts
 *
 * Covers: editor tab toggle, paste creation form submission,
 *         submit from Preview tab (switches to Write, reads content correctly).
 */

import { PasteCreatorView } from '../../../src/presentation/components/paste-creator-view.js';
import { CreatePasteUseCase } from '../../../src/application/use-cases/create-paste-use-case.js';
import * as uiManager from '../../../src/ui/ui-manager.js';
import * as storage from '../../../src/utils/storage.js';

describe('PasteCreatorView', () => {
  const mockUseCase = {
    execute: jest.fn()
  } as unknown as CreatePasteUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(uiManager, 'showLoading').mockImplementation(() => {});
    jest.spyOn(uiManager, 'showError').mockImplementation(() => {});
    jest.spyOn(uiManager, 'showSuccess').mockImplementation(() => {});
    jest.spyOn(storage, 'storeDeleteToken').mockImplementation(() => {});
  });

  describe('setup', () => {
    it('should not throw when document elements are missing', () => {
      jest.spyOn(document, 'getElementById').mockReturnValue(null);
      const view = new PasteCreatorView(mockUseCase);
      expect(() => view.setup()).not.toThrow();
    });
  });

  describe('setupEditorTabs', () => {
    it('should return early when required elements are missing', () => {
      jest.spyOn(document, 'getElementById').mockReturnValue(null);
      const view = new PasteCreatorView(mockUseCase);
      expect(() => view.setupEditorTabs()).not.toThrow();
    });
  });

  describe('handleSubmit', () => {
    beforeEach(() => {
      jest.restoreAllMocks();
    });

    it('should read content and create paste when Preview tab is active (textarea hidden)', async () => {
      document.body.innerHTML = '';
      const textarea = document.createElement('textarea');
      textarea.id = 'paste';
      textarea.value = '**hello** world';
      textarea.hidden = true;
      document.body.appendChild(textarea);

      const writeTab = document.createElement('button');
      writeTab.id = 'writeTab';
      document.body.appendChild(writeTab);

      const previewTab = document.createElement('button');
      previewTab.id = 'previewTab';
      document.body.appendChild(previewTab);

      const preview = document.createElement('div');
      preview.id = 'markdownPreview';
      document.body.appendChild(preview);

      const minsInput = document.createElement('input');
      minsInput.id = 'mins';
      minsInput.value = '60';
      document.body.appendChild(minsInput);

      const passwordInput = document.createElement('input');
      passwordInput.id = 'password';
      passwordInput.value = 'testpass';
      document.body.appendChild(passwordInput);

      (mockUseCase.execute as jest.Mock).mockResolvedValue({
        value: { id: 'x', deleteToken: 'y', shareUrl: 'u', deleteUrl: 'd' }
      });

      const view = new PasteCreatorView(mockUseCase);
      await view.handleSubmit();

      expect(mockUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({ content: '**hello** world' })
      );
    });

    it('should switch to Write tab before submitting when Preview is active', async () => {
      document.body.innerHTML = '';
      const textarea = document.createElement('textarea');
      textarea.id = 'paste';
      textarea.value = 'content';
      textarea.hidden = true;
      document.body.appendChild(textarea);

      const writeTab = document.createElement('button');
      writeTab.id = 'writeTab';
      document.body.appendChild(writeTab);

      const previewTab = document.createElement('button');
      previewTab.id = 'previewTab';
      document.body.appendChild(previewTab);

      const preview = document.createElement('div');
      preview.id = 'markdownPreview';
      document.body.appendChild(preview);

      const minsInput = document.createElement('input');
      minsInput.id = 'mins';
      minsInput.value = '60';
      document.body.appendChild(minsInput);

      const passwordInput = document.createElement('input');
      passwordInput.id = 'password';
      passwordInput.value = 'pass';
      document.body.appendChild(passwordInput);

      (mockUseCase.execute as jest.Mock).mockResolvedValue({
        value: { id: 'x', deleteToken: 'y', shareUrl: 'u', deleteUrl: 'd' }
      });

      const view = new PasteCreatorView(mockUseCase);
      await view.handleSubmit();

      expect(textarea.hidden).toBe(false);
      expect(preview.hidden).toBe(true);
    });
  });
});
