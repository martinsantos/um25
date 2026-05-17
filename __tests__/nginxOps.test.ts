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
});
