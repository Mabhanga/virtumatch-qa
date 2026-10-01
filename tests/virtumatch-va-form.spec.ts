import { test, expect, Locator } from '@playwright/test';

// Fill a field and confirm the value stuck; retry if the page's JS wiped it
async function fillAndVerify(field: Locator, value: string) {
  await expect(async () => {
    await field.fill(value);
    await expect(field).toHaveValue(value, { timeout: 1000 });
  }).toPass({ timeout: 10_000 });
}

test('BUG: VA application form should submit successfully', async ({ page }, testInfo) => {
  // Steps 1-4: navigate to the VA application form
  await page.goto('https://virtumatch.co.za/');
  await page.getByRole('link', { name: 'I’m a VA Looking for Work' }).click();
  await page.getByRole('link', { name: 'Submit Your Application' }).click();
  await page.getByRole('radio', { name: 'Virtual Assistant seeking work' }).check();

  // Let the form finish any re-render triggered by the radio selection
  await page.waitForLoadState('networkidle');
  const nameField = page.getByRole('textbox', { name: 'Full Name *' });
  const emailField = page.getByRole('textbox', { name: 'Email Address *' });
  await expect(nameField).toBeVisible();

  // Step 5: fill in the form
  await fillAndVerify(nameField, 'QA Tester');
  await fillAndVerify(emailField, 'qa.tester@example.com');
  await page.getByRole('textbox', { name: 'Phone Number' }).fill('+27000000000');
  await page.getByLabel('Years of experience * Less').selectOption('More than 5 years');

  // The task checkboxes are visually hidden by the site's custom styling,
  // so toggle the underlying inputs directly instead of using .check()
  const tasks = page.locator('input[name="business-tasks[]"]');
  await tasks.nth(0).evaluate((el: HTMLInputElement) => el.click());
  await tasks.nth(1).evaluate((el: HTMLInputElement) => el.click());
  await expect(tasks.nth(0)).toBeChecked();
  await expect(tasks.nth(1)).toBeChecked();

  await page.getByLabel('Hours available per week *').selectOption('Full time (40+ hours)');
  await page.getByRole('textbox', { name: 'Expected hourly rate (USD)' }).fill('9');
  await page.getByRole('textbox', { name: 'Languages spoken (besides' }).fill('English, Zulu');
  await page.getByRole('textbox', { name: 'e.g. Microsoft Office, Xero,' }).fill('Microsoft Office');
  await page.getByRole('textbox', { name: 'Brief summary of your' }).fill("I'm reliable");

  // Make sure the required fields still hold their values right before submitting
  await expect(nameField).toHaveValue('QA Tester');
  await expect(emailField).toHaveValue('qa.tester@example.com');

  // Step 6: click "Send My Details" and capture the Contact Form 7 response
  const [response] = await Promise.all([
    page.waitForResponse(
      (r) => r.url().includes('/feedback') && r.request().method() === 'POST'
    ),
    page.getByRole('button', { name: 'Send My Details' }).click(),
  ]);

  const body = await response.json();
  await testInfo.attach('cf7-response.json', {
    body: JSON.stringify(body, null, 2),
    contentType: 'application/json',
  });

  // Evidence: request accepted and validation passed
  expect.soft(response.status(), 'HTTP status').toBe(200);
  expect.soft(body.invalid_fields, 'No validation errors').toEqual([]);

  // Expected: application is sent. This FAILS today with status "mail_failed"
  expect(body.status, 'Contact Form 7 status').toBe('mail_sent');
  await expect(
    page.getByRole('form', { name: 'Contact form' }).getByText('There was an error trying to')
  ).toBeHidden();
});