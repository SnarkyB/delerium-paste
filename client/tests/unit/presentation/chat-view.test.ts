/**
 * Tests for chat-view.ts
 *
 * Covers: auto-load on setup, 30s polling interval, clearInterval on unload,
 *         duplicate-initialization guard, silent polling (no loading text flash).
 */

import { ChatView } from '../../../src/presentation/components/chat-view.js';
import { ChatUseCase } from '../../../src/application/use-cases/chat-use-case.js';

// ============================================================================
// Helpers / Mocks
// ============================================================================

/** Build the minimal DOM that setup() requires */
function buildChatDom(container: HTMLElement): void {
  const chatSection = document.createElement('div');
  chatSection.id = 'chatSection';
  container.appendChild(chatSection);

  const messagesDiv = document.createElement('div');
  messagesDiv.id = 'chatMessages';
  container.appendChild(messagesDiv);

  const sendBtn = document.createElement('button');
  sendBtn.id = 'sendMessageBtn';
  container.appendChild(sendBtn);

  const chatInput = document.createElement('input');
  chatInput.id = 'chatInput';
  container.appendChild(chatInput);

  const usernameInput = document.createElement('input');
  usernameInput.id = 'usernameInput';
  container.appendChild(usernameInput);

  const chatInfoText = document.createElement('div');
  chatInfoText.id = 'chatInfoText';
  container.appendChild(chatInfoText);
}

/** Create a minimal mock ChatUseCase */
function makeMockUseCase(): jest.Mocked<ChatUseCase> {
  return {
    refreshMessages: jest.fn().mockResolvedValue({ messages: [] }),
    sendMessage: jest.fn().mockResolvedValue({ success: true })
  } as unknown as jest.Mocked<ChatUseCase>;
}

// ============================================================================
// Tests
// ============================================================================

describe('ChatView — auto-load and polling', () => {
  let container: HTMLElement;
  let useCase: jest.Mocked<ChatUseCase>;
  let chatView: ChatView;

  beforeEach(() => {
    jest.useFakeTimers();

    container = document.createElement('div');
    document.body.appendChild(container);
    buildChatDom(container);

    useCase = makeMockUseCase();
    chatView = new ChatView(useCase);
  });

  afterEach(() => {
    document.body.removeChild(container);
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('should call refreshMessages once immediately on setup', async () => {
    const salt = new Uint8Array(16);
    chatView.setup('paste-1', salt, 'pw');

    // Let the async call run
    await Promise.resolve();

    expect(useCase.refreshMessages).toHaveBeenCalledTimes(1);
  });

  it('should call refreshMessages with cached password immediately (no modal)', async () => {
    const salt = new Uint8Array(16);
    chatView.setup('paste-1', salt, 'my-password');

    await Promise.resolve();

    // useCase.refreshMessages is called — that means no modal was shown
    expect(useCase.refreshMessages).toHaveBeenCalledTimes(1);
    expect(useCase.refreshMessages).toHaveBeenCalledWith('paste-1', 'my-password', salt);
  });

  it('should set up a 30s polling interval', () => {
    const setIntervalSpy = jest.spyOn(global, 'setInterval');
    const salt = new Uint8Array(16);

    chatView.setup('paste-2', salt, 'pw');

    const thirtySecCalls = setIntervalSpy.mock.calls.filter(([, ms]) => ms === 30000);
    expect(thirtySecCalls.length).toBeGreaterThanOrEqual(1);
  });

  it('should call refreshMessages again after 30 seconds', async () => {
    const salt = new Uint8Array(16);
    chatView.setup('paste-3', salt, 'pw');

    // Initial call
    await Promise.resolve();
    expect(useCase.refreshMessages).toHaveBeenCalledTimes(1);

    // Advance timer by 30 seconds
    jest.advanceTimersByTime(30000);
    await Promise.resolve();

    expect(useCase.refreshMessages).toHaveBeenCalledTimes(2);
  });

  it('should call clearInterval when beforeunload fires', () => {
    const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
    const salt = new Uint8Array(16);

    chatView.setup('paste-4', salt, 'pw');

    // Fire beforeunload
    window.dispatchEvent(new Event('beforeunload'));

    expect(clearIntervalSpy).toHaveBeenCalled();
  });

  it('should call clearInterval when pagehide fires', () => {
    const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
    const salt = new Uint8Array(16);

    chatView.setup('paste-5', salt, 'pw');

    window.dispatchEvent(new Event('pagehide'));

    expect(clearIntervalSpy).toHaveBeenCalled();
  });

  it('should guard against duplicate initialization', () => {
    const salt = new Uint8Array(16);
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    chatView.setup('paste-6', salt, 'pw');
    chatView.setup('paste-6', salt, 'pw'); // Second call — should be skipped

    expect(warnSpy).toHaveBeenCalledWith('Chat already initialized, skipping duplicate setup');
  });

  it('should not show loading text during silent polling refresh', async () => {
    const salt = new Uint8Array(16);
    chatView.setup('paste-7', salt, 'pw');

    const messagesDiv = document.getElementById('chatMessages')!;

    // Initial load (not silent) — loading text shown then replaced
    await Promise.resolve();
    // After load, messages displayed (empty list)
    const afterInitialContent = messagesDiv.innerHTML;

    // Set some existing content to detect if it gets replaced
    messagesDiv.textContent = 'previous messages';

    // Trigger polling tick (silent)
    jest.advanceTimersByTime(30000);
    await Promise.resolve();

    // Content should NOT have been briefly replaced with "Loading messages..."
    // (it would be replaced by the messages result, not the loading indicator)
    // The key assertion: the loading text string should not be present during silent refresh
    // Since useCase.refreshMessages returns [] immediately, the result will be "No messages yet"
    expect(messagesDiv.innerHTML).not.toContain('chat-loading');
  });

  it('should show chat section after setup', () => {
    const chatSection = document.getElementById('chatSection')!;
    expect(chatSection.style.display).toBe('');

    chatView.setup('paste-8', new Uint8Array(16), 'pw');

    expect(chatSection.style.display).toBe('block');
  });

  it('should update info text to mention auto-refresh', () => {
    chatView.setup('paste-9', new Uint8Array(16), 'pw');

    const chatInfoText = document.getElementById('chatInfoText')!;
    expect(chatInfoText.textContent).toContain('Auto-refreshing');
  });
});
