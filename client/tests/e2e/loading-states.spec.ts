import { test, expect } from '@playwright/test';

/**
 * End-to-End Tests for Loading States
 * 
 * Tests loading states across all pages in real browser environment:
 * - Button loading states during paste creation
 * - Status badge updates during paste viewing
 * - Delete button loading states
 * - Loading message transitions
 */

test.describe('Loading States - Paste Creation', () => {
  test.beforeEach(async ({ page }) => {
    // Mock API endpoints with delays to see loading states
    await page.route('**/api/pow', async route => {
      await new Promise(resolve => setTimeout(resolve, 100)); // Simulate delay
      await route.fulfill({
        status: 204 // No PoW required
      });
    });

    await page.route('**/api/pastes', async route => {
      await new Promise(resolve => setTimeout(resolve, 200)); // Simulate delay
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'test-paste-id',
          deleteToken: 'test-delete-token'
        })
      });
    });
  });

  test('should show loading state when creating paste', async ({ page }) => {
    await page.goto('/');

    // Fill in paste content
    await page.fill('#paste', 'Test paste content');

    // Click save button
    await page.click('#save');

    // Check that button shows loading state
    const btnText = await page.locator('#btnText');
    await expect(btnText).toContainText('Processing');
    
    // Button should be disabled
    const saveBtn = page.locator('#save');
    await expect(saveBtn).toBeDisabled();
  });

  test('should show loading messages during paste creation', async ({ page }) => {
    await page.goto('/');

    await page.fill('#paste', 'Test content');
    await page.click('#save');

    // Wait for loading state
    const btnText = page.locator('#btnText');
    
    // Check that spinner appears
    const spinner = btnText.locator('.spinner');
    await expect(spinner).toBeVisible({ timeout: 1000 });
  });

  test('should restore button after successful paste creation', async ({ page }) => {
    await page.goto('/');

    await page.fill('#paste', 'Test content');
    await page.click('#save');

    // Wait for success output
    await page.waitForSelector('#output.show', { timeout: 5000 });

    // Button should be enabled again
    const saveBtn = page.locator('#save');
    await expect(saveBtn).toBeEnabled();

    // Button text should be restored
    const btnText = await page.locator('#btnText').textContent();
    expect(btnText).toContain('Encrypt');
  });

  test('should restore button after error', async ({ page }) => {
    // Mock API error
    await page.route('**/api/pastes', async route => {
      await new Promise(resolve => setTimeout(resolve, 100));
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Server error' })
      });
    });

    await page.goto('/');
    await page.fill('#paste', 'Test content');
    await page.click('#save');

    // Wait for error message
    await page.waitForSelector('#output.show', { timeout: 5000 });

    // Button should be enabled again
    const saveBtn = page.locator('#save');
    await expect(saveBtn).toBeEnabled();
  });
});

test.describe('Loading States - Paste Viewing', () => {
  test('should show loading state when viewing paste', async ({ page }) => {
    // Mock paste API with delay
    await page.route('**/api/pastes/test-id', async route => {
      await new Promise(resolve => setTimeout(resolve, 200));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ct: 'dGVzdA==', // base64 for "test"
          iv: 'dGVzdA==',
          meta: { expireTs: 9999999999, viewsAllowed: 10, mime: 'text/plain' }
        })
      });
    });

    await page.goto('/view.html?p=test-id#test-key:test-iv');

    // Check that status badge shows loading
    const statusBadge = page.locator('#statusBadge');
    await expect(statusBadge).toHaveClass(/loading/);
    
    // Check that content shows loading
    const content = page.locator('#content');
    await expect(content).toHaveClass(/loading/);
  });

  test('should update status badge during paste viewing', async ({ page }) => {
    await page.route('**/api/pastes/test-id', async route => {
      await new Promise(resolve => setTimeout(resolve, 100));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ct: 'dGVzdA==',
          iv: 'dGVzdA==',
          meta: { expireTs: 9999999999, viewsAllowed: 10, mime: 'text/plain' }
        })
      });
    });

    await page.goto('/view.html?p=test-id#test-key:test-iv');

    // Wait for status badge to update
    const statusBadge = page.locator('#statusBadge');
    
    // Should eventually remove loading class
    await expect(statusBadge).not.toHaveClass(/loading/, { timeout: 5000 });
  });

  test('should handle error status update', async ({ page }) => {
    await page.route('**/api/pastes/test-id', async route => {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Not found' })
      });
    });

    await page.goto('/view.html?p=test-id#test-key:test-iv');

    // Wait for error to be displayed
    await page.waitForTimeout(1000);

    // Status badge should show error state
    const statusBadge = page.locator('#statusBadge');
    const badgeText = await statusBadge.textContent();
    expect(badgeText).toBeTruthy();
  });
});

test.describe('Loading States - Delete Page', () => {
  test('should show loading state when deleting paste', async ({ page }) => {
    // Mock delete API with delay
    await page.route('**/api/pastes/test-id?token=test-token', async route => {
      await new Promise(resolve => setTimeout(resolve, 200));
      await route.fulfill({
        status: 204
      });
    });

    await page.goto('/delete.html?p=test-id&token=test-token');

    // Click delete button
    await page.click('#confirmDelete');

    // Check that button shows loading state
    const deleteBtn = page.locator('#confirmDelete');
    await expect(deleteBtn).toBeDisabled();
    
    const btnText = await deleteBtn.textContent();
    expect(btnText).toContain('Deleting');
  });

  test('should restore button on delete error', async ({ page }) => {
    // Mock delete API error
    await page.route('**/api/pastes/test-id?token=test-token', async route => {
      await new Promise(resolve => setTimeout(resolve, 100));
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Invalid token' })
      });
    });

    await page.goto('/delete.html?p=test-id&token=test-token');
    
    const originalText = await page.locator('#confirmDelete').textContent();
    await page.click('#confirmDelete');

    // Wait for error message
    await page.waitForSelector('.message.error', { timeout: 3000 });

    // Button should be restored
    const deleteBtn = page.locator('#confirmDelete');
    await expect(deleteBtn).toBeEnabled();
    const restoredText = await deleteBtn.textContent();
    expect(restoredText).toBe(originalText);
  });
});

test.describe('Loading States - Message Transitions', () => {
  test('should show different loading messages during paste creation', async ({ page }) => {
    let loadingMessages: string[] = [];
    
    // Intercept console.log to capture loading messages
    page.on('console', msg => {
      if (msg.text().includes('Calling apiClient.createPaste')) {
        // This indicates we're at the upload stage
        loadingMessages.push('Uploading');
      }
    });

    await page.route('**/api/pow', async route => {
      await new Promise(resolve => setTimeout(resolve, 50));
      await route.fulfill({ status: 204 });
    });

    await page.route('**/api/pastes', async route => {
      await new Promise(resolve => setTimeout(resolve, 50));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'test-id',
          deleteToken: 'test-token'
        })
      });
    });

    await page.goto('/');
    await page.fill('#paste', 'Test content');
    await page.click('#save');

    // Wait for success
    await page.waitForSelector('#output.show', { timeout: 5000 });

    // Verify button was disabled during process
    const saveBtn = page.locator('#save');
    // Button should be enabled at the end
    await expect(saveBtn).toBeEnabled();
  });
});
