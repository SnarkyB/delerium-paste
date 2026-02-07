/**
 * Loading Indicator Component
 * 
 * Provides contextual loading indicators with progress feedback.
 */

export interface LoadingIndicatorOptions {
  message?: string;
  showProgress?: boolean;
  progress?: number; // 0-100
}

/**
 * Loading indicator component
 */
export class LoadingIndicator {
  private indicatorElement: HTMLDivElement | null = null;
  private isVisible = false;

  /**
   * Show loading indicator
   */
  show(options: LoadingIndicatorOptions = {}): void {
    if (this.isVisible) {
      this.update(options);
      return;
    }

    this.createIndicator(options);
    this.isVisible = true;
  }

  /**
   * Update loading indicator message/progress
   */
  update(options: LoadingIndicatorOptions): void {
    if (!this.indicatorElement) return;

    const messageElement = this.indicatorElement.querySelector('.loading-message');
    const progressElement = this.indicatorElement.querySelector('.loading-progress') as HTMLElement | null;
    const progressBar = this.indicatorElement.querySelector('.loading-progress-bar') as HTMLElement | null;

    if (messageElement && options.message !== undefined) {
      messageElement.textContent = options.message;
    }

    if (options.showProgress && progressElement && progressBar) {
      progressElement.style.display = 'block';
      if (options.progress !== undefined) {
        progressBar.style.width = `${Math.max(0, Math.min(100, options.progress))}%`;
      }
    } else if (progressElement) {
      progressElement.style.display = 'none';
    }
  }

  /**
   * Hide loading indicator
   */
  hide(): void {
    if (!this.isVisible || !this.indicatorElement) return;

    this.indicatorElement.classList.remove('loading-indicator-visible');
    
    // Remove from DOM after animation
    setTimeout(() => {
      if (this.indicatorElement) {
        this.indicatorElement.remove();
        this.indicatorElement = null;
      }
      this.isVisible = false;
    }, 200);
  }

  /**
   * Create loading indicator DOM
   */
  private createIndicator(options: LoadingIndicatorOptions): void {
    const { message = 'Loading...', showProgress = false, progress = 0 } = options;

    this.indicatorElement = document.createElement('div');
    this.indicatorElement.className = 'loading-indicator';
    this.indicatorElement.setAttribute('role', 'status');
    this.indicatorElement.setAttribute('aria-live', 'polite');
    this.indicatorElement.setAttribute('aria-busy', 'true');

    // Spinner
    const spinner = document.createElement('div');
    spinner.className = 'spinner spinner-lg';

    // Message
    const messageElement = document.createElement('div');
    messageElement.className = 'loading-message';
    messageElement.textContent = message;

    // Progress bar (optional)
    const progressElement = document.createElement('div');
    progressElement.className = 'loading-progress';
    progressElement.style.display = showProgress ? 'block' : 'none';

    const progressBar = document.createElement('div');
    progressBar.className = 'loading-progress-bar';
    progressBar.style.width = `${Math.max(0, Math.min(100, progress))}%`;

    progressElement.appendChild(progressBar);

    // Assemble
    this.indicatorElement.appendChild(spinner);
    this.indicatorElement.appendChild(messageElement);
    if (showProgress) {
      this.indicatorElement.appendChild(progressElement);
    }

    // Add to DOM
    document.body.appendChild(this.indicatorElement);

    // Trigger animation
    requestAnimationFrame(() => {
      if (this.indicatorElement) {
        this.indicatorElement.classList.add('loading-indicator-visible');
      }
    });
  }
}

/**
 * Global loading indicator instance
 */
let loadingInstance: LoadingIndicator | null = null;

/**
 * Get or create loading indicator instance
 */
export function getLoadingIndicator(): LoadingIndicator {
  if (!loadingInstance) {
    loadingInstance = new LoadingIndicator();
  }
  return loadingInstance;
}

/**
 * Show loading indicator (convenience function)
 */
export function showLoading(message?: string, showProgress?: boolean, progress?: number): void {
  const indicator = getLoadingIndicator();
  indicator.show({ message, showProgress, progress });
}

/**
 * Update loading indicator (convenience function)
 */
export function updateLoading(message?: string, progress?: number): void {
  const indicator = getLoadingIndicator();
  indicator.update({ message, showProgress: progress !== undefined, progress });
}

/**
 * Hide loading indicator (convenience function)
 */
export function hideLoading(): void {
  const indicator = getLoadingIndicator();
  indicator.hide();
}
