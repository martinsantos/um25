#!/usr/bin/env python3
"""Install a verified runtime and rebuild the private Cannaval documentation."""
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import socket
import subprocess
import sys
import tarfile
import urllib.request

STAGE = Path('/srv/umsa-migration')
ROOT = Path('/opt/umsa-clean-runtime')
PLAN = Path('/srv/umsa-clean-plan')
NODE_ARCHIVE = 'c514127107ebf6e3885f793b06674574d71fe22e3df91a78c52c5a6f84b3b5b0'


def plan_credentials(text):
    result = {}
    for line in text.splitlines():
        if not line or line.strip().startswith('#') or '=' not in line:
            continue
        key,value = line.split('=',1)
        key = key.strip()
        if key in ('ADMIN_USER','ADMIN_PASSWORD'):
            if key in result:
                raise RuntimeError('Duplicate Plan credential setting')
            result[key] = re.sub(r'''^["']|["']$''','',value.strip())
    if set(result) != {'ADMIN_USER','ADMIN_PASSWORD'} or not all(result.values()) or result['ADMIN_PASSWORD'] == 'change-me':
        raise RuntimeError('Existing Plan login credentials missing')
    return result


def finish_configuration():
    if not (STAGE / 'clean-tools-plan.ready').is_file() or not (STAGE / 'clean-php-rehearsal.ready').is_file():
        raise RuntimeError('Completed isolated runtimes required')
    env_path = STAGE / 'internal-credentials/node-environments.json'
    nodes = json.loads(env_path.read_text())
    credentials = plan_credentials(Path('/home/umbot.com.ar/cannaval-plan-repo/admin/.env').read_text())
    nodes['cannaval-plan-admin'].update(credentials)
    env_path.write_text(json.dumps(nodes,indent=2) + '\n')
    environment = STAGE / 'clean-plan.environment'
    text = environment.read_text()
    for key,value in credentials.items():
        if re.search(r'(?m)^' + key + '=',text):
            raise RuntimeError('Plan login already supplied; inspect before retry')
        text += key + '="' + value.replace('\\','\\\\').replace('"','\\"') + '"\n'
    environment.write_text(text)
    # Public worker traversal only; config files and vault keep their private modes.
    Path('/srv/umsa-clean-php').chmod(0o755)
    with (STAGE / 'receipts/clean-runtime-finish.log').open('ab') as log:
        subprocess.run(['systemctl','start','umsa-clean-plan'],check=True,stdout=log,stderr=log)
    (STAGE / 'clean-runtime-configuration.complete').write_text('Preserved Plan login and corrected public-root traversal.\n')
    print('Existing Plan login restored without changing its rotated session secret. PHP worker traversal corrected.')


def main():
    os.umask(0o077)
    if socket.gethostname() != 'srv2101069.hstgr.cloud' or STAGE.is_symlink() or (STAGE / '.target').read_text().strip() != '179.198.115.115':
        raise RuntimeError('Wrong target')
    if sys.argv[1:] == ['--finish-config']:
        finish_configuration()
        return
    if sys.argv[1:]:
        raise RuntimeError('Unsupported operation')
    if ROOT.exists() or PLAN.exists() or not (STAGE / 'internal-rotation.complete').exists():
        raise RuntimeError('Unexpected destination state')
    artifact = Path((STAGE / 'trusted-plan').read_text().strip())
    if artifact.name != 'plan-d4d462eb50cb26eba53cf0551b1eabe35824935e' or artifact.parent != STAGE / 'trusted' or artifact.is_symlink():
        raise RuntimeError('Unexpected published Plan revision')
    env = json.loads((STAGE / 'internal-credentials/node-environments.json').read_text())['cannaval-plan-admin']
    env.update(plan_credentials(Path('/home/umbot.com.ar/cannaval-plan-repo/admin/.env').read_text()))
    with (STAGE / 'receipts/clean-tools-plan.log').open('ab') as log:
        def run(args, **kwargs):
            subprocess.run(args, check=True, stdout=log, stderr=log, **kwargs)
        ROOT.mkdir(mode=0o755)
        archive = ROOT / 'node.tar.xz'
        with urllib.request.urlopen('https://nodejs.org/dist/v20.19.6/node-v20.19.6-linux-x64.tar.xz',timeout=90) as response, archive.open('wb') as output:
            shutil.copyfileobj(response,output)
        if hashlib.sha256(archive.read_bytes()).hexdigest() != NODE_ARCHIVE:
            raise RuntimeError('Official Node archive differs')
        # GNU tar preserves the npm internal relative links from the pinned official archive.
        run(['tar','-xJf',str(archive),'-C',str(ROOT),'--no-same-owner'])
        node = ROOT / 'node-v20.19.6-linux-x64'
        npm = node / 'lib/node_modules/npm/bin/npm-cli.js'
        runtime_env = {**os.environ, 'PATH':str(node / 'bin') + ':/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin'}
        for key in ('NODE_PATH','NODE_OPTIONS','LD_PRELOAD','LD_LIBRARY_PATH','PYTHONPATH'):
            runtime_env.pop(key,None)
        run([str(node / 'bin/node'),str(npm),'install','--prefix',str(ROOT / 'pm2'),
             '--ignore-scripts','--no-audit','--no-fund','pm2@6.0.14'],env=runtime_env)
        run(['dnf','-y','install','git','python3-pip'])
        run(['python3','-m','venv',str(ROOT / 'mkdocs')])
        run([str(ROOT / 'mkdocs/bin/python'),'-m','pip','install','--disable-pip-version-check',
             'mkdocs==1.6.1','mkdocs-material==9.7.6'])
        run(['cp','-a','--reflink=always',str(artifact / 'application'),str(PLAN)])
        revision = subprocess.check_output(['git','-C',str(PLAN),'rev-parse','HEAD'],text=True).strip()
        if revision != 'd4d462eb50cb26eba53cf0551b1eabe35824935e':
            raise RuntimeError('Plan Git history differs from its pinned build')
        auth = subprocess.run(['git','-C',str(PLAN),'config','--get-regexp',r'http\..*extraheader|credential\..*'],capture_output=True)
        if auth.returncode != 1:
            raise RuntimeError('Plan Git checkout has persisted credentials')
        run([str(ROOT / 'mkdocs/bin/mkdocs'),'build'],cwd=PLAN,env=runtime_env)
        if not (PLAN / 'public/index.html').is_file():
            raise RuntimeError('Plan static build missing')
        values = {key:str(value) for key,value in env.items() if key.startswith(('ADMIN_','LLM_','PLAN_ADMIN_'))}
        values.update(PATH=runtime_env['PATH'],HOME='/root',NODE_ENV='production',PORT='3037',HOST='127.0.0.1',
            CANNAVAL_ROOT=str(PLAN),PUBLIC_PLAN_DIR=str(PLAN / 'public'),MKDOCS_BIN=str(ROOT / 'mkdocs/bin/mkdocs'))
        if any(not re.fullmatch('[A-Za-z_][A-Za-z0-9_]*',key) or '\n' in value or '\r' in value for key,value in values.items()):
            raise RuntimeError('Unsupported environment')
        environment = STAGE / 'clean-plan.environment'
        environment.write_text(''.join(key + '="' + value.replace('\\','\\\\').replace('"','\\"') + '"\n' for key,value in sorted(values.items())))
        unit = '[Unit]\nDescription=Clean isolated Cannaval Plan rehearsal\n[Service]\nType=simple\n'
        unit += 'WorkingDirectory=' + str(PLAN) + '\nEnvironmentFile=' + str(environment) + '\n'
        unit += 'ExecStart=' + str(node / 'bin/node') + ' ' + str(PLAN / 'admin/server.mjs') + '\n'
        unit += 'IPAddressDeny=any\nIPAddressAllow=localhost\nRestart=no\nUMask=0027\n'
        Path('/etc/systemd/system/umsa-clean-plan.service').write_text(unit)
        run(['systemctl','daemon-reload'])
        run(['systemctl','start','umsa-clean-plan'])
        (ROOT / 'python-packages.txt').write_bytes(subprocess.check_output([str(ROOT / 'mkdocs/bin/python'),'-m','pip','freeze']))
    (STAGE / 'clean-tools-plan.ready').write_text(str(ROOT) + '\n')
    print('Fresh Node/npm/PM2 and MkDocs installed in a separate runtime. Plan rebuilt and started with isolated egress; old runtime not executed.')


if __name__ == '__main__':
    main()
