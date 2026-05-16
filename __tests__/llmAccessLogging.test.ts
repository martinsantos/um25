import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const repoRoot = process.cwd();

describe('LLM access logging operations', () => {
  test('versions an Nginx http-level analytics snippet for AI crawlers and referrals', () => {
    const nginxSnippet = fs.readFileSync(path.join(repoRoot, 'ops/nginx/00-ultimamilla-llm-analytics.conf'), 'utf8');

    expect(nginxSnippet).toContain('real_ip_header CF-Connecting-IP;');
    expect(nginxSnippet).toContain('map $http_user_agent $umsa_llm_bot');
    expect(nginxSnippet).toContain('log_format umsa_llm_json escape=json');
    expect(nginxSnippet).toContain('access_log /var/log/nginx/ultimamilla-llm-access.log umsa_llm_json if=$umsa_log_llm_request;');
    expect(nginxSnippet).toContain('OAI-SearchBot');
    expect(nginxSnippet).toContain('ChatGPT-User');
    expect(nginxSnippet).toContain('Claude-SearchBot');
    expect(nginxSnippet).toContain('Claude-User');
    expect(nginxSnippet).toContain('PerplexityBot');
    expect(nginxSnippet).toContain('Google-Extended');
    expect(nginxSnippet).toContain('$http_cf_connecting_ip');
    expect(nginxSnippet).toContain('$http_x_forwarded_for');
  });

  test('adds a guarded installer and manual workflow for production Nginx logging', () => {
    const installer = fs.readFileSync(path.join(repoRoot, 'scripts/ops/install-llm-nginx-logging.sh'), 'utf8');
    const workflow = fs.readFileSync(path.join(repoRoot, '.github/workflows/install-llm-nginx-logging.yml'), 'utf8');
    const logrotate = fs.readFileSync(path.join(repoRoot, 'ops/logrotate.d/ultimamilla-llm-access'), 'utf8');

    expect(installer).toContain('nginx -t');
    expect(installer).toContain('systemctl reload nginx');
    expect(installer).toContain('/etc/nginx/conf.d/00-ultimamilla-llm-analytics.conf');
    expect(installer).toContain('/etc/logrotate.d/ultimamilla-llm-access');
    expect(installer).toContain('BACKUP_DIR=');
    expect(workflow).toContain('workflow_dispatch');
    expect(workflow).toContain('scripts/ops/install-llm-nginx-logging.sh');
    expect(logrotate).toContain('/var/log/nginx/ultimamilla-llm-access.log');
    expect(logrotate).toContain('rotate 30');
  });

  test('reports LLM bot and referral activity from JSON access logs', () => {
    const output = execFileSync('node', [
      'scripts/ops/report-llm-access.mjs',
      '__tests__/fixtures/llm-access-sample.jsonl',
    ], { cwd: repoRoot, encoding: 'utf8' });

    expect(output).toContain('LLM bot requests by bot');
    expect(output).toContain('OAI-SearchBot 2');
    expect(output).toContain('/geo/authority.json 2');
    expect(output).toContain('/servicios-it-empresas-mendoza 1');
    expect(output).toContain('LLM referral requests');
    expect(output).toContain('chatgpt.com 1');
  });
});
