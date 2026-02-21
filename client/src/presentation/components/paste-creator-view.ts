/**
 * Paste Creator View Component
 *
 * Presentation layer component for paste creation.
 * Handles DOM manipulation and delegates business logic to use cases.
 *
 * Features:
 * - Write/Preview markdown editor tabs
 * - Image upload with EXIF stripping via Canvas API
 * - Encrypted image upload (reuses CreatePasteUseCase)
 */

import { CreatePasteUseCase } from '../../application/use-cases/create-paste-use-case.js';
import { showLoading, showError, showSuccess } from '../../ui/ui-manager.js';
import { secureClear } from '../../security.js';
import { storeDeleteToken } from '../../utils/storage.js';
import { isFailure } from '../../core/models/result.js';
import { sanitizeHtml } from '../../core/utils/sanitize.js';

// Max images and size per image (client-side guard only — server enforces true limit)
const MAX_IMAGES = 3;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Attached image state before submit
 */
interface AttachedImage {
  blob: Blob;
  mime: string;
  name: string;
  objectUrl: string;
}

/**
 * Strip EXIF/XMP/IPTC metadata from an image file by redrawing it on a
 * Canvas element. The canvas re-encodes only pixel data — all metadata is lost.
 */
export async function stripExifViaCanvas(file: File): Promise<Blob> {
  return new Promise<Blob>((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          URL.revokeObjectURL(objectUrl);
          reject(new Error('Canvas 2D context unavailable'));
          return;
        }
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(objectUrl);

        // Determine output MIME — use image/webp for best compression, fallback PNG
        const outputMime = file.type === 'image/jpeg' ? 'image/jpeg' : 'image/png';
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Canvas toBlob returned null'));
              return;
            }
            resolve(blob);
          },
          outputMime,
          0.92
        );
      } catch (err) {
        URL.revokeObjectURL(objectUrl);
        reject(err);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image for EXIF stripping'));
    };

    img.src = objectUrl;
  });
}

/**
 * Convert a Blob to a base64 data URL string.
 */
export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('FileReader failed'));
    reader.readAsDataURL(blob);
  });
}

/**
 * Paste creator view component
 */
export class PasteCreatorView {
  private attachedImages: AttachedImage[] = [];

  constructor(private useCase: CreatePasteUseCase) {}

  /**
   * Setup Write/Preview editor tab toggle
   */
  setupEditorTabs(): void {
    const writeTab = document.getElementById('writeTab') as HTMLButtonElement | null;
    const previewTab = document.getElementById('previewTab') as HTMLButtonElement | null;
    const textarea = document.getElementById('paste') as HTMLTextAreaElement | null;
    const preview = document.getElementById('markdownPreview') as HTMLDivElement | null;

    if (!writeTab || !previewTab || !textarea || !preview) return;

    writeTab.addEventListener('click', () => {
      writeTab.classList.add('active');
      writeTab.setAttribute('aria-selected', 'true');
      previewTab.classList.remove('active');
      previewTab.setAttribute('aria-selected', 'false');
      textarea.hidden = false;
      preview.hidden = true;
    });

    previewTab.addEventListener('click', () => {
      previewTab.classList.add('active');
      previewTab.setAttribute('aria-selected', 'true');
      writeTab.classList.remove('active');
      writeTab.setAttribute('aria-selected', 'false');
      textarea.hidden = true;
      preview.hidden = false;

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
   * Setup image upload handling
   */
  setupImageUpload(): void {
    const uploadBtn = document.getElementById('imageUploadBtn') as HTMLButtonElement | null;
    const fileInput = document.getElementById('imageFileInput') as HTMLInputElement | null;
    const previewsDiv = document.getElementById('imagePreviews') as HTMLDivElement | null;

    if (!uploadBtn || !fileInput || !previewsDiv) return;

    uploadBtn.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', async () => {
      const files = Array.from(fileInput.files ?? []);
      fileInput.value = ''; // Reset so same file can be selected again

      for (const file of files) {
        if (this.attachedImages.length >= MAX_IMAGES) {
          showError(`Maximum ${MAX_IMAGES} images allowed`);
          break;
        }

        if (file.size > MAX_IMAGE_BYTES) {
          showError(`"${file.name}" exceeds the 5 MB limit`);
          continue;
        }

        if (!file.type.startsWith('image/')) {
          showError(`"${file.name}" is not an image file`);
          continue;
        }

        try {
          // Strip EXIF metadata via canvas redraw
          const strippedBlob = await stripExifViaCanvas(file);
          const objectUrl = URL.createObjectURL(strippedBlob);

          this.attachedImages.push({
            blob: strippedBlob,
            mime: strippedBlob.type || file.type,
            name: file.name,
            objectUrl
          });

          this.renderImagePreview(previewsDiv, this.attachedImages.length - 1, objectUrl, file.name);
        } catch {
          showError(`Failed to process "${file.name}"`);
        }
      }
    });
  }

  /**
   * Append a thumbnail preview item to the previews container.
   * Uses only DOM methods (createElement, textContent, src) — no innerHTML.
   */
  private renderImagePreview(
    container: HTMLDivElement,
    index: number,
    objectUrl: string,
    name: string
  ): void {
    const item = document.createElement('div');
    item.className = 'image-preview-item';
    item.setAttribute('role', 'listitem');

    const img = document.createElement('img');
    img.src = objectUrl;        // safe: object URL created by URL.createObjectURL
    img.alt = '';               // decorative thumbnail

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'image-preview-remove';
    removeBtn.textContent = '\u00d7'; // × — uses textContent, not innerHTML
    removeBtn.setAttribute('aria-label', `Remove ${name}`);
    removeBtn.dataset.index = String(index);

    removeBtn.addEventListener('click', () => {
      const idx = parseInt(removeBtn.dataset.index ?? '-1', 10);
      if (idx >= 0 && idx < this.attachedImages.length) {
        URL.revokeObjectURL(this.attachedImages[idx].objectUrl);
        this.attachedImages.splice(idx, 1);
        item.remove();
        // Re-index remaining remove buttons
        const btns = container.querySelectorAll<HTMLButtonElement>('.image-preview-remove');
        btns.forEach((btn, i) => { btn.dataset.index = String(i); });
      }
    });

    item.appendChild(img);
    item.appendChild(removeBtn);
    container.appendChild(item);
  }

  /**
   * Upload a single attached image as its own encrypted paste.
   * Returns the share URL of the image paste, or null on failure.
   */
  private async uploadImageAsPaste(
    image: AttachedImage,
    password: string,
    expirationMinutes: number
  ): Promise<string | null> {
    try {
      const dataUrl = await blobToDataUrl(image.blob);
      const result = await this.useCase.execute({
        content: dataUrl,
        expirationMinutes,
        password,
        allowChat: false,
        mime: image.mime
      });

      if (isFailure(result)) return null;
      return result.value.shareUrl;
    } catch {
      return null;
    }
  }

  /**
   * Handle paste creation form submission
   */
  async handleSubmit(): Promise<void> {
    const textarea = document.getElementById('paste') as HTMLTextAreaElement | null;
    let text = textarea?.value || '';
    const mins = parseInt((document.getElementById('mins') as HTMLInputElement)?.value || '60', 10);
    const password = (document.getElementById('password') as HTMLInputElement)?.value || '';

    showLoading(true, 'Preparing...');

    try {
      // Upload any attached images first and prepend markdown links to content
      if (this.attachedImages.length > 0) {
        showLoading(true, 'Uploading images...');
        const imageLinks: string[] = [];

        for (const img of this.attachedImages) {
          const url = await this.uploadImageAsPaste(img, password, mins);
          if (url) {
            imageLinks.push(`![${img.name}](${url})`);
          }
        }

        if (imageLinks.length > 0) {
          text = imageLinks.join('\n') + (text ? '\n\n' + text : '');
        }

        // Clear attached images and revoke object URLs
        this.attachedImages.forEach(img => URL.revokeObjectURL(img.objectUrl));
        this.attachedImages = [];
        const previewsDiv = document.getElementById('imagePreviews');
        if (previewsDiv) previewsDiv.textContent = '';
      }

      showLoading(true, 'Encrypting...');

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
    this.setupImageUpload();

    const saveButton = document.getElementById('save');
    if (saveButton) {
      saveButton.addEventListener('click', () => {
        void this.handleSubmit();
      });
    }
  }
}
