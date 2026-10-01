# VirtuMatch VA Application Form Bug

Playwright test reproducing a bug on the VirtuMatch "Virtual Assistant seeking work" application form.

## Bug
Submitting the form at https://virtumatch.co.za/contact/ shows:
"There was an error trying to send your message. Please try again later."

## Root cause evidence
The Contact Form 7 `feedback` request returns HTTP 200 with:

```json
{
  "contact_form_id": 58,
  "status": "mail_failed",
  "invalid_fields": []
}
```

`invalid_fields` is empty, so validation passes. The failure happens when the server tries to send the email, which points to a mail/SMTP configuration problem. Applications are not reaching the business.

## Steps to reproduce
1. Go to https://virtumatch.co.za/
2. Click "I'm a VA Looking for Work"
3. Click "Submit Your Application"
4. Select "Virtual Assistant seeking work"
5. Fill in the form
6. Click "Send My Details"

**Expected:** Application is submitted successfully.
**Actual:** Error banner appears and the application is not sent.

## Run the test