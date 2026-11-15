# Loaded after the established Hostinger pruning primitives by the workflow.
# Only one reviewed package and one retired application are in scope.
ACTIVE = 'ca2687432b782b462e9a065da52acb6c8163c38e-43731266984-1'
RETAIN = (ACTIVE, '497cf0f7f55e16602dee602bf8122bdf775067c4-43725394543-1', '1f0a270655dc4230d521fc2bfb1dca1a1ed2e413-43718585597-1')
PACKAGE_RELEASE = '9577d566e464c47da19c50aa187dd5f79d71e2b1-43709697407-1'
APPLICATION_RELEASE = '6e47d2941dc5c472f8137aa639360c832de3a241-43417070085-1'
RETIRED = (PACKAGE_RELEASE, APPLICATION_RELEASE)
BACKUPS = (Path('/srv/umsa-operational-backups'), Path('/root/fumbling-field/backups'))
FREE_EXPECTED = 4665913344
EXPECTED_ARCHIVE_SIZE = 2117862219

def free_space():
    disk = os.statvfs('/srv')
    return disk.f_bavail * disk.f_frsize

def reviewed_targets():
    return (archive_path(PACKAGE_RELEASE), RELEASES / APPLICATION_RELEASE / 'application')

def keep_paths(targets):
    protected = [STATE, STAGE / 'production.active', *BACKUPS]
    for directory in RELEASES.iterdir():
        if directory.is_dir() and (directory/'publication.complete').is_file():
            protected.extend((directory, directory/'publication.complete'))
            application = directory/'application'
            if application.exists() and application not in targets:
                protected.extend((application, application/'dist/server/entry.mjs'))
    protected.extend(path for path in (STAGE/'incoming').iterdir() if path not in targets)
    return [p for p in protected if p.exists()]

def identities(paths):
    return {str(p): metadata(p.lstat())[:5] if p.is_dir() else metadata(p.lstat()) for p in paths}

def snapshot_exact(required):
    verify_target()
    targets = reviewed_targets()
    present = tuple(os.path.lexists(p) for p in targets)
    if not any(present):
        return {'status':'already_removed','targets':[]}, None
    if not all(present):
        raise RuntimeError('Partially removed batch; review required')
    state = json.loads(STATE.read_text())
    if state != web_release_receipt(ACTIVE):
        raise RuntimeError('Active release changed')
    for release in RETAIN:
        web_release_receipt(release)
        path = archive_path(release)
        secure_ancestors(path.parent)
        if not stat.S_ISREG(path.lstat().st_mode) or path.stat().st_size<=2_000_000_000:
            raise RuntimeError('A retained package is missing or redirected')
    for path in BACKUPS:
        secure_ancestors(path, ownership=False)
    for release in RETIRED:
        receipt = RELEASES / release / 'publication.complete'
        web_release_receipt(release)
        if not stat.S_ISREG(receipt.lstat().st_mode):
            raise RuntimeError('Release receipt is missing or redirected')
        if json.loads(receipt.read_text())['unit'] != 'umsa-web-' + release + '.service':
            raise RuntimeError('Release receipt differs from the reviewed identity')
    archive, application = targets
    secure_ancestors(archive.parent)
    if not stat.S_ISREG(archive.lstat().st_mode) or archive.lstat().st_size != EXPECTED_ARCHIVE_SIZE:
        raise RuntimeError('Unexpected transport archive')
    secure_ancestors(application)
    if set(p.name for p in application.iterdir()) != {'dist', 'node_modules', 'package.json', 'package-lock.json'}:
        raise RuntimeError('Unexpected retired application')
    if archive_path(APPLICATION_RELEASE).exists():
        raise RuntimeError('Unexpected transport for the retired application')
    if any(overlaps(candidate, path) for candidate in targets for path in PROTECTED):
        raise RuntimeError('Reviewed scope overlaps protected data')
    consumer_check = lambda: consumers(targets, RETIRED, tuple(RELEASES / r / 'nginx' for r in RETAIN))
    consumer_check()
    artifacts = inventory(targets,True)
    inodes, counts = {}, collections.Counter()
    for name,row in artifacts.items():
        vals=row['meta']
        if stat.S_ISREG(vals[2]):
            key=tuple(vals[:2]); inodes[key]=(name,vals); counts[key]+=1
    found=0
    for key,(name,vals) in inodes.items():
        if counts[key]!=vals[8]:
            raise RuntimeError('File has links outside the reviewed paths')
        size=unshared_bytes(name)
        if size>vals[9]:
            raise RuntimeError('Unexpected extent accounting')
        found+=size
    if (FREE_EXPECTED is not None and found != FREE_EXPECTED) or free_space()+found<required:
        raise RuntimeError('Space changed since review or will not meet publisher requirement')
    before=runtime()
    if state['unit'] not in before['units']:
        raise RuntimeError('Active release is not running')
    health()
    return {'status':'ready','targets':[str(p) for p in targets],'verified_bytes':found,'state':state,
            'artifacts':artifacts,'protected':identities(keep_paths(targets)),'runtime':before},consumer_check

def execute(phase, required, expected=''):
    if phase not in ('inspect','apply') or not re.fullmatch(r'[0-9]{9,12}',required):
        raise RuntimeError('Unexpected invocation')
    if phase=='apply' and (os.environ.get('GITHUB_ACTIONS')!='true' or not re.fullmatch(r'[0-9a-f]{64}',expected)):
        raise RuntimeError('Apply requires GitHub Actions and matching inspection')
    os.nice(19)
    subprocess.run(['ionice','-c','3','-p',str(os.getpid())],check=True,capture_output=True)
    with open('/run/umsa-web-publish.lock','rb') as lock:
        fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
        snapshot,consumer_check=snapshot_exact(int(required))
        sig=digest(snapshot)
        if phase=='inspect':
            print(json.dumps({k:v for k,v in snapshot.items() if k in ('status','targets','verified_bytes')}|{'snapshot_sha256':sig}))
            return
        if sig!=expected:
            raise RuntimeError('Release, targets or protected files changed')
        if snapshot['status']=='already_removed':
            print(json.dumps({'status':'already_removed','targets':[]}))
            return
        targets=reviewed_targets()
        consumer_check()
        if (inventory(targets,True)!=snapshot['artifacts'] or
            identities(keep_paths(targets))!=snapshot['protected'] or
            runtime()!=snapshot['runtime']):
            raise RuntimeError('State changed before cleanup')
        free_before=free_space()
        if free_before+snapshot['verified_bytes']<int(required):
            raise RuntimeError('Projected capacity below publisher requirement')
        remove_reviewed(targets,snapshot['artifacts'])
        if any(os.path.lexists(p) for p in targets):
            raise RuntimeError('An authorized artifact remains')
        if identities(keep_paths(targets))!=snapshot['protected'] or runtime()!=snapshot['runtime']:
            raise RuntimeError('The cleanup changed protected data or a running service')
        health()
        print(json.dumps({'status':'removed','targets':snapshot['targets'],'verified_bytes':snapshot['verified_bytes'],
                          'free_before':free_before,'free_after':free_space(),'preserved':list(RETAIN),
                          'runtime_unchanged':True}))

if __name__=='__main__':
    execute(*sys.argv[1:])
