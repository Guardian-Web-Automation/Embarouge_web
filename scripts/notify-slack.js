// Sends a Slack message with the Playwright test results.
// Reads the results.json file created by the JSON reporter.
// The Slack webhook URL comes from the SLACK_WEBHOOK_URL environment variable.

import fs from 'fs';

const webhook = process.env.SLACK_WEBHOOK_URL;
if (!webhook) {
  console.log('No SLACK_WEBHOOK_URL set - skipping Slack notification.');
  process.exit(0);
}

// Read the Playwright JSON report
let report = {};
try {
  report = JSON.parse(fs.readFileSync('results.json', 'utf-8'));
} catch (error) {
  console.log('Could not read results.json:', error.message);
}

// Pull the counts out of the report
const stats = report.stats || {};
const passed = stats.expected || 0;
const failed = stats.unexpected || 0;
const flaky = stats.flaky || 0;
const skipped = stats.skipped || 0;
const total = passed + failed + flaky + skipped;

const allPassed = failed === 0;
const statusText = allPassed ? '✅ TESTS PASSED' : '❌ TESTS FAILED';

// Info about where this ran (GitHub Actions fills these in automatically)
const repo = process.env.GITHUB_REPOSITORY || 'local';
const branch = process.env.GITHUB_REF_NAME || 'local';
const trigger = process.env.GITHUB_EVENT_NAME || 'manual';
const runUrl =
  process.env.GITHUB_SERVER_URL && process.env.GITHUB_RUN_ID
    ? `${process.env.GITHUB_SERVER_URL}/${repo}/actions/runs/${process.env.GITHUB_RUN_ID}`
    : 'https://github.com';

// Build the Slack message (Block Kit format)
const payload = {
  blocks: [
    {
      type: 'header',
      text: { type: 'plain_text', text: 'Embarouge — Playwright Test Report' },
    },
    {
      type: 'section',
      text: { type: 'mrkdwn', text: `*${statusText}*` },
    },
    {
      type: 'section',
      fields: [
        { type: 'mrkdwn', text: `*Total*\n${total}` },
        { type: 'mrkdwn', text: `*Passed*\n${passed}` },
        { type: 'mrkdwn', text: `*Failed*\n${failed}` },
        { type: 'mrkdwn', text: `*Suite*\nSmoke (@smoke)` },
        { type: 'mrkdwn', text: `*Branch*\n${branch}` },
        { type: 'mrkdwn', text: `*Triggered by*\n${trigger}` },
      ],
    },
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: { type: 'plain_text', text: 'View Run & Download Report' },
          url: runUrl,
          style: allPassed ? 'primary' : 'danger',
        },
      ],
    },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `Device: iPhone 14 Pro Max — Mobile Chrome | Repo: ${repo}`,
        },
      ],
    },
  ],
};

// Send the message to Slack
try {
  const response = await fetch(webhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (response.ok) {
    console.log('✓ Slack notification sent');
  } else {
    console.log('Slack notification failed:', response.status, await response.text());
  }
} catch (error) {
  console.log('Slack notification error:', error.message);
}
