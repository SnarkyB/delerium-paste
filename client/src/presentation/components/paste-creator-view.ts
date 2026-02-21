/**
 * Paste Creator View Component
 *
 * Presentation layer component for paste creation.
 * Handles DOM manipulation and delegates business logic to use cases.
 *
 * Features:
 * - Write/Preview markdown editor tabs
 */

import { CreatePasteUseCase } from '../../application/use-cases/create-paste-use-case.js';
import { showLoading, showError, showSuccess } from '../../ui/ui-manager.js';
import { secureClear } from '../../security.js';
import { storeDeleteToken } from '../../utils/storage.js';
import { isFailure } from '../../core/models/result.js';
import { sanitizeHtml } from '../../core/utils/sanitize.js';

/**
 * Paste creator view component
 */
export class PasteCreatorView {
  constructor(private useCase: CreatePasteUseCase) {}

  /**
   * Setup markdown toolbar buttons
   */
  setupMarkdownToolbar(): void {
    const textarea = document.getElementById('paste') as HTMLTextAreaElement | null;
    const toolbar = document.querySelector('.markdown-toolbar');
    if (!textarea || !toolbar) return;

    toolbar.addEventListener('click', (e) => {
      const btn = (e.target as HTMLElement).closest('.toolbar-btn');
      if (!btn || !(btn instanceof HTMLButtonElement)) return;

      const wrap = btn.dataset.wrap;
      const wrapEnd = btn.dataset.wrapEnd ?? wrap;
      const placeholder = btn.dataset.placeholder ?? '';
      const insert = btn.dataset.insert;
      const isBlock = btn.hasAttribute('data-block');

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selection = textarea.value.substring(start, end);

      let newValue: string;
      let newStart: number;
      let newEnd: number;

      if (insert) {
        const before = textarea.value.substring(0, start);
        const after = textarea.value.substring(end);
        const insertText = insert.replace(/\\n/g, '\n');
        newValue = before + insertText + after;
        newStart = newEnd = start + insertText.length;
      } else if (wrap) {
        const before = textarea.value.substring(0, start);
        const after = textarea.value.substring(end);
        const insertText = selection || placeholder;
        const wrapped = wrap.replace(/\\n/g, '\n') + insertText + (wrapEnd ?? wrap).replace(/\\n/g, '\n');

        if (isBlock && !selection) {
          const lineStart = textarea.value.lastIndexOf('\n', start - 1) + 1;
          const linePrefix = textarea.value.substring(lineStart, start);
          const needsNewline = linePrefix.trim().length > 0;
          const prefix = needsNewline ? '\n' : '';
          newValue = textarea.value.substring(0, start) + prefix + wrapped + textarea.value.substring(end);
          newStart = start + prefix.length + wrap.replace(/\\n/g, '\n').length;
          newEnd = newStart + insertText.length;
        } else {
          newValue = before + wrapped + after;
          newStart = start + wrap.replace(/\\n/g, '\n').length;
          newEnd = newStart + insertText.length;
        }
      } else {
        return;
      }

      textarea.value = newValue;
      textarea.setSelectionRange(newStart, newEnd);
      textarea.focus();
    });
  }

  /**
   * Setup Write/Preview editor tab toggle
   */
  setupEditorTabs(): void {
    const writeTab = document.getElementById('writeTab') as HTMLButtonElement | null;
    const previewTab = document.getElementById('previewTab') as HTMLButtonElement | null;
    const textarea = document.getElementById('paste') as HTMLTextAreaElement | null;
    const preview = document.getElementById('markdownPreview') as HTMLDivElement | null;
    const toolbar = document.getElementById('markdownToolbar') as HTMLElement | null;

    if (!writeTab || !previewTab || !textarea || !preview) return;

    writeTab.addEventListener('click', () => {
      writeTab.classList.add('active');
      writeTab.setAttribute('aria-selected', 'true');
      previewTab.classList.remove('active');
      previewTab.setAttribute('aria-selected', 'false');
      textarea.hidden = false;
      preview.hidden = true;
      if (toolbar) toolbar.hidden = false;
    });

    previewTab.addEventListener('click', () => {
      previewTab.classList.add('active');
      previewTab.setAttribute('aria-selected', 'true');
      writeTab.classList.remove('active');
      writeTab.setAttribute('aria-selected', 'false');
      textarea.hidden = true;
      preview.hidden = false;
      if (toolbar) toolbar.hidden = true;

      // Render markdown → sanitize → display
      const raw = typeof marked !== 'undefined'
        ? marked.parse(textarea.value, { gfm: true, breaks: true })
        : this.escapeHtmlFallback(textarea.value);

      // SECURITY: sanitizeHtml() strips all dangerous tags/attrs before assignment.
      // This is the only approved innerHTML assignment path in this file.
      const safeHtml = sanitizeHtml(raw);
      preview.innerHTML = safeHtml;

      // Syntax-highlight all code blocks
      if (typeof hljs !== 'undefined') {
        const blocks = preview.querySelectorAll<HTMLElement>('pre code');
        blocks.forEach(block => hljs.highlightElement(block));
      }
    });
  }

  /**
   * Fallback when marked is not available — HTML-escape and preserve newlines
   */
  private escapeHtmlFallback(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return '<pre>' + div.innerHTML + '</pre>';
  }

  /**
   * Switch to Write tab so the textarea is visible (avoids issues when submitting from Preview tab)
   */
  private switchToWriteTab(): void {
    const writeTab = document.getElementById('writeTab') as HTMLButtonElement | null;
    const previewTab = document.getElementById('previewTab') as HTMLButtonElement | null;
    const textarea = document.getElementById('paste') as HTMLTextAreaElement | null;
    const preview = document.getElementById('markdownPreview') as HTMLDivElement | null;
    const toolbar = document.getElementById('markdownToolbar') as HTMLElement | null;
    if (!writeTab || !previewTab || !textarea || !preview) return;
    writeTab.classList.add('active');
    writeTab.setAttribute('aria-selected', 'true');
    previewTab.classList.remove('active');
    previewTab.setAttribute('aria-selected', 'false');
    textarea.hidden = false;
    preview.hidden = true;
    if (toolbar) toolbar.hidden = false;
  }

  /**
   * Handle paste creation form submission
   */
  async handleSubmit(): Promise<void> {
    this.switchToWriteTab();
    const textarea = document.getElementById('paste') as HTMLTextAreaElement | null;
    const text = textarea?.value || '';
    const mins = parseInt((document.getElementById('mins') as HTMLInputElement)?.value || '60', 10);
    const password = (document.getElementById('password') as HTMLInputElement)?.value || '';

    showLoading(true, 'Encrypting...');

    try {
      const result = await this.useCase.execute({
        content: text,
        expirationMinutes: mins,
        password,
        allowChat: true
      });

      if (isFailure(result)) {
        showError(result.error);
        return;
      }

      storeDeleteToken(result.value.id, result.value.deleteToken);
      showSuccess(result.value.shareUrl, result.value.deleteUrl);

      secureClear(text);
      secureClear(password);

      if (textarea) textarea.value = '';
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      showError(errorMessage);
    } finally {
      showLoading(false);
    }
  }

  /**
   * Setup event handlers for paste creation
   */
  setup(): void {
    if (typeof document === 'undefined') return;

    this.setupEditorTabs();
    this.setupMarkdownToolbar();

    const saveButton = document.getElementById('save');
    if (saveButton) {
      saveButton.addEventListener('click', () => {
        void this.handleSubmit();
      });
    }
  }
}
