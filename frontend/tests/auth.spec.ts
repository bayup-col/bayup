// frontend/tests/auth.spec.ts
import { test, expect } from '@playwright/test';

// Define a base URL for your application (Next.js frontend)
// This assumes your frontend is running on http://localhost:3000
// and your backend on http://localhost:8000
const FRONTEND_URL = 'http://localhost:3000';
const BACKEND_URL = 'http://localhost:8000';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the home page before each test
    await page.goto(FRONTEND_URL);
  });

  test('should allow a user to register and then login', async ({ page }) => {
    const testEmail = `testuser_${Date.now()}@example.com`;
    const testPassword = 'testpassword123';
    const testFullName = 'Test User';

    // 1. Navigate to Register page
    await page.getByRole('link', { name: /Login to your Admin Dashboard/i }).click();
    await page.getByRole('link', { name: /Register/i }).click();
    await expect(page).toHaveURL(`${FRONTEND_URL}/register`);

    // 2. Fill registration form
    await page.fill('input[id="fullName"]', testFullName);
    await page.fill('input[id="email"]', testEmail);
    await page.fill('input[id="password"]', testPassword);
    await page.getByRole('button', { name: /Register/i }).click();

    // 3. Expect redirect to Login page
    await expect(page).toHaveURL(`${FRONTEND_URL}/login`);
    await expect(page.getByText('Login', { exact: true })).toBeVisible();

    // 4. Fill login form
    await page.fill('input[id="email"]', testEmail);
    await page.fill('input[id="password"]', testPassword);
    await page.getByRole('button', { name: /Sign In/i }).click();

    // 5. Expect redirect to Dashboard
    await expect(page).toHaveURL(`${FRONTEND_URL}/dashboard`);
    await expect(page.getByText(`Welcome to your Dashboard, ${testEmail}!`)).toBeVisible();

    // 6. Logout
    await page.getByRole('button', { name: /Logout/i }).click();
    await expect(page).toHaveURL(FRONTEND_URL);
  });

  test('should show error for duplicate registration', async ({ page }) => {
    const existingEmail = `existing_${Date.now()}@example.com`;
    const password = 'password123';
    const fullName = 'Existing User';

    // Register first time via API to simulate existing user
    await page.request.post(`${BACKEND_URL}/auth/register`, {
      data: { email: existingEmail, password, full_name: fullName },
    });

    // Navigate to Register page
    await page.goto(`${FRONTEND_URL}/register`);

    // Attempt to register again with same email
    await page.fill('input[id="fullName"]', fullName);
    await page.fill('input[id="email"]', existingEmail);
    await page.fill('input[id="password"]', password);
    await page.getByRole('button', { name: /Register/i }).click();

    // Expect error message
    await expect(page.getByText('Email already registered')).toBeVisible();
  });

  test('should show error for invalid login credentials', async ({ page }) => {
    // Navigate to Login page
    await page.goto(`${FRONTEND_URL}/login`);

    // Attempt to login with invalid credentials
    await page.fill('input[id="email"]', 'nonexistent@example.com');
    await page.fill('input[id="password"]', 'wrongpassword');
    await page.getByRole('button', { name: /Sign In/i }).click();

    // Expect error message
    await expect(page.getByText('Incorrect email or password')).toBeVisible();
  });
});
