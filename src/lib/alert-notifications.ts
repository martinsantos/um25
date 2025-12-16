/**
 * Alert Notifications Module
 *
 * Purpose: Send alerts to multiple channels (Email, Slack, Discord)
 * Configuration is stored in metrics-store config
 */

import metricsStore from '@/lib/metrics-store';

/**
 * Send alert to Slack webhook
 */
export async function sendSlackAlert(
  severity: 'info' | 'warning' | 'critical',
  title: string,
  message: string,
  extra?: Record<string, any>
) {
  const config = metricsStore.getConfig();

  if (!config.slack_webhook_url) {
    console.log('Slack webhook not configured');
    return false;
  }

  const colors: Record<string, string> = {
    info: '#36a64f',
    warning: '#ff9900',
    critical: '#ff0000'
  };

  const payload = {
    attachments: [
      {
        color: colors[severity] || '#000000',
        title: `🚨 ${title}`,
        text: message,
        fields: extra
          ? Object.entries(extra).map(([key, value]) => ({
              title: key,
              value: String(value),
              short: true
            }))
          : [],
        footer: 'ULTIMA MILLA Monitoring',
        ts: Math.floor(Date.now() / 1000)
      }
    ]
  };

  try {
    const response = await fetch(config.slack_webhook_url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    return response.ok;
  } catch (error) {
    console.error('Error sending Slack alert:', error);
    return false;
  }
}

/**
 * Send alert to Discord webhook
 */
export async function sendDiscordAlert(
  severity: 'info' | 'warning' | 'critical',
  title: string,
  message: string,
  extra?: Record<string, any>
) {
  const config = metricsStore.getConfig();

  if (!config.discord_webhook_url) {
    console.log('Discord webhook not configured');
    return false;
  }

  const colors: Record<string, number> = {
    info: 3066993,    // Green
    warning: 16776960, // Yellow
    critical: 15158332 // Red
  };

  const fields = extra
    ? Object.entries(extra).map(([key, value]) => ({
        name: key,
        value: String(value),
        inline: true
      }))
    : [];

  const payload = {
    embeds: [
      {
        color: colors[severity] || 0,
        title: `🚨 ${title}`,
        description: message,
        fields,
        footer: {
          text: 'ULTIMA MILLA Monitoring',
          icon_url:
            'https://ultimamilla.com.ar/images/um-logo.png'
        },
        timestamp: new Date().toISOString()
      }
    ]
  };

  try {
    const response = await fetch(config.discord_webhook_url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    return response.ok;
  } catch (error) {
    console.error('Error sending Discord alert:', error);
    return false;
  }
}

/**
 * Send alert to Email via mail command
 */
export async function sendEmailAlert(
  severity: 'info' | 'warning' | 'critical',
  title: string,
  message: string,
  extra?: Record<string, any>
) {
  const config = metricsStore.getConfig();

  if (!config.email_recipients) {
    console.log('Email recipients not configured');
    return false;
  }

  const subject = `[${severity.toUpperCase()}] ${title}`;

  const extraHtml = extra
    ? `<ul>${Object.entries(extra)
        .map(([key, value]) => `<li><strong>${key}:</strong> ${value}</li>`)
        .join('')}</ul>`
    : '';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; }
    .header { background: #1a1a1a; color: white; padding: 20px; }
    .content { padding: 20px; background: #f9f9f9; }
    .severity { padding: 10px; margin: 10px 0; border-radius: 5px; }
    .critical { background: #fee; border-left: 4px solid #f44; }
    .warning { background: #ffe; border-left: 4px solid #fa0; }
    .info { background: #efe; border-left: 4px solid #4a4; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>ULTIMA MILLA Alert</h2>
    </div>
    <div class="content">
      <div class="severity ${severity}">
        <strong>${severity.toUpperCase()}</strong>: ${title}
      </div>
      <p>${message}</p>
      ${extraHtml}
      <hr>
      <p style="color: #999; font-size: 12px;">
        Generated: ${new Date().toISOString()}<br>
        <a href="https://ultimamilla.com.ar/status">View Status Dashboard</a>
      </p>
    </div>
  </div>
</body>
</html>
  `;

  try {
    // Use shell to send email
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);

    await execAsync(
      `echo "${html.replace(/"/g, '\\"')}" | mail -H "MIME-Version: 1.0" -H "Content-Type: text/html" -s "${subject}" ${config.email_recipients}`
    );

    return true;
  } catch (error) {
    console.error('Error sending email alert:', error);
    return false;
  }
}

/**
 * Send multi-channel alert
 */
export async function sendAlert(
  severity: 'info' | 'warning' | 'critical',
  title: string,
  message: string,
  extra?: Record<string, any>
) {
  const results = {
    email: await sendEmailAlert(severity, title, message, extra),
    slack: await sendSlackAlert(severity, title, message, extra),
    discord: await sendDiscordAlert(severity, title, message, extra)
  };

  // Store alert event
  metricsStore.storeAlert({
    timestamp: Date.now(),
    alert_type: title,
    severity,
    message,
    email_sent: results.email,
    slack_sent: results.slack,
    discord_sent: results.discord
  });

  return results;
}

export default {
  sendSlackAlert,
  sendDiscordAlert,
  sendEmailAlert,
  sendAlert
};
