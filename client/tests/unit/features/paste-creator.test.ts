/**
 * paste-creator.test.ts - Tests for paste creation (meta includes allowChat)
 */

import * as pasteCreator from '../../../src/features/paste-creator.js';
import * as security from '../../../src/security.js';
import * as api from '../../../src/infrastructure/api/http-client.js';
import * as validators from '../../../src/core/validators/index.js';
import * as uiManager from '../../../src/ui/ui-manager.js';
import * as storage from '../../../src/utils/storage.js';

describe('paste-creator allowChat', () => {
  let createPasteSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    createPasteSpy = jest.spyOn(api.HttpApiClient.prototype, 'createPaste').mockResolvedValue({
      id: 'test-id',
      deleteToken: 'test-token'
    });
    jest.spyOn(api.HttpApiClient.prototype, 'getPowChallenge').mockResolvedValue(null);
    jest.spyOn(security, 'encryptWithPassword').mockResolvedValue({
      encryptedData: new ArrayBuffer(0),
      salt: new ArrayBuffer(16),
      iv: new ArrayBuffer(12)
    });
    jest.spyOn(security, 'deriveDeleteAuth').mockResolvedValue('derived-auth');
    jest.spyOn(security, 'secureClear').mockImplementation(() => {});
    jest.spyOn(validators, 'validateContentSize').mockReturnValue({ isValid: true, errors: [] });
    jest.spyOn(validators, 'validateExpiration').mockReturnValue({ isValid: true, errors: [] });
    jest.spyOn(validators, 'validatePassword').mockReturnValue({ isValid: true, errors: [] });
    jest.spyOn(validators, 'isValidUTF8').mockReturnValue(true);
    jest.spyOn(uiManager, 'showLoading').mockImplementation(() => {});
    jest.spyOn(uiManager, 'showError').mockImplementation(() => {});
    jest.spyOn(uiManager, 'showSuccess').mockImplementation(() => {});
    jest.spyOn(storage, 'storeDeleteToken').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  function setupForm(allowKeyCachingChecked = false) {
    jest.spyOn(document, 'getElementById').mockImplementation((id: string) => {
      const els: Record<string, Partial<HTMLInputElement & HTMLTextAreaElement>> = {
        paste: { value: 'hello' },
        mins: { value: '60' },
        password: { value: 'pass123' },
        allowKeyCaching: { checked: allowKeyCachingChecked }
      };
      return els[id] as HTMLElement ?? null;
    });
  }

  it('should send allowChat true in meta when creating a paste', async () => {
    setupForm();
    await (pasteCreator as { createPaste: () => Promise<void> }).createPaste();
    expect(createPasteSpy).toHaveBeenCalled();
    const call = createPasteSpy.mock.calls[0][0];
    expect(call.meta.allowChat).toBe(true);
  });
});
