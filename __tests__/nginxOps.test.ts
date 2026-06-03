import fs from 'fs';
import path from 'path';

const repoRoot = process.cwd();

describe('Nginx operational cleanup', () => {
  test('ships a guarded cleanup for backup files accidentally enabled in Nginx', () => {
    const cleanup = fs.readFileSync(path.join(repoRoot, 'scripts/ops/cleanup-nginx-enabled-backups.sh'), 'utf8');
    const workflow = fs.readFileSync(path.join(repoRoot, '.github/workflows/cleanup-nginx-enabled-backups.yml'), 'utf8');

    expect(cleanup).toContain('nginx -t');
    expect(cleanup).toContain('restore_moved_files');
    expect(cleanup).toContain('systemctl reload nginx');
    expect(cleanup).toContain('/etc/nginx/sites-enabled');
    expect(cleanup).toContain('*.backup');
    expect(cleanup).toContain('*.bak');
    expect(cleanup).toContain('/etc/nginx/disabled-enabled-backups');
    expect(workflow).toContain('workflow_dispatch');
    expect(workflow).toContain('cleanup-nginx-enabled-backups.sh');
  });

  test('ships a guarded www canonical Nginx apply step for production deploys', () => {
    const script = fs.readFileSync(path.join(repoRoot, 'scripts/ops/apply-www-canonical-nginx.sh'), 'utf8');
    const workflow = fs.readFileSync(path.join(repoRoot, '.github/workflows/production-deploy.yml'), 'utf8');

    expect(script).toContain('Apex to WWW Redirect');
    expect(script).toContain('NGINX_UMSA_VALIDATE_ONLY');
    expect(script).toContain('nginx -t');
    expect(script).toContain('systemctl reload nginx');
    expect(script).toContain('https://www.ultimamilla.com.ar/directus/server/ping');
    expect(script).toContain('https://ultimamilla.com.ar/');
    expect(script).not.toContain('Deprecated operation blocked');
    expect(workflow).toContain('Apply WWW canonical routing');
    expect(workflow).toContain('apply-www-canonical-nginx.sh');
  });
});
