# Loaded after the established Hostinger pruning primitives by the workflow.
# Only one reviewed package and one retired application are in scope.
ACTIVE = '9809f802b129b76f5f3d0dfefa487d294e4540f0-43736907637-1'
RETAIN = (ACTIVE, 'ca2687432b782b462e9a065da52acb6c8163c38e-43731266984-1', '497cf0f7f55e16602dee602bf8122bdf775067c4-43725394543-1')
PACKAGE_RELEASE = '1f0a270655dc4230d521fc2bfb1dca1a1ed2e413-43718585597-1'
APPLICATION_RELEASE = 'fb03ea5a9286ba2189dffc2b1e41e0abba9dbbe6-43448537241-1'
RETIRED = (PACKAGE_RELEASE, APPLICATION_RELEASE)
BACKUPS = (Path('/srv/umsa-operational-backups'), Path('/root/fumbling-field/backups'))
FREE_EXPECTED = 4666982400
EXPECTED_ARCHIVE_SIZE = 2118094442
OPTIONAL_APPLICATION = None
OPTIONAL_BYTES = 0

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
    retired = RETIRED
    expected_bytes = FREE_EXPECTED
    if OPTIONAL_APPLICATION and free_space() + FREE_EXPECTED < required:
        targets += (RELEASES / OPTIONAL_APPLICATION / 'application',)
        retired += (OPTIONAL_APPLICATION,)
        expected_bytes += OPTIONAL_BYTES
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
    for release in retired:
        receipt = RELEASES / release / 'publication.complete'
        web_release_receipt(release)
        if not stat.S_ISREG(receipt.lstat().st_mode):
            raise RuntimeError('Release receipt is missing or redirected')
        if json.loads(receipt.read_text())['unit'] != 'umsa-web-' + release + '.service':
            raise RuntimeError('Release receipt differs from the reviewed identity')
    archive, *applications = targets
    secure_ancestors(archive.parent)
    if not stat.S_ISREG(archive.lstat().st_mode) or archive.lstat().st_size != EXPECTED_ARCHIVE_SIZE:
        raise RuntimeError('Unexpected transport archive')
    for application in applications:
        secure_ancestors(application)
        if set(p.name for p in application.iterdir()) != {'dist', 'node_modules', 'package.json', 'package-lock.json'}:
            raise RuntimeError('Unexpected retired application')
        if archive_path(application.parent.name).exists():
            raise RuntimeError('Unexpected transport for the retired application')
    if any(overlaps(candidate, path) for candidate in targets for path in PROTECTED):
        raise RuntimeError('Reviewed scope overlaps protected data')
    consumer_check = lambda: consumers(targets, retired, tuple(RELEASES / r / 'nginx' for r in RETAIN))
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
    if (expected_bytes is not None and found != expected_bytes) or free_space()+found<required:
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
        targets=tuple(Path(p) for p in snapshot['targets'])
        primary=reviewed_targets()
        if targets[:2] != primary:
            raise RuntimeError('Unrecognized primary artifacts')
        consumer_check()
        if (inventory(targets,True)!=snapshot['artifacts'] or
            identities(keep_paths(targets))!=snapshot['protected'] or
            runtime()!=snapshot['runtime']):
            raise RuntimeError('State changed before cleanup')
        free_before=free_space()
        if free_before+snapshot['verified_bytes']<int(required):
            raise RuntimeError('Projected capacity below publisher requirement')
        removed = list(primary)
        remove_reviewed(primary,snapshot['artifacts'])
        remaining = targets[len(primary):]
        if remaining:
            optional, = remaining
            if optional != RELEASES / OPTIONAL_APPLICATION / 'application':
                raise RuntimeError('Unrecognized conditional artifact')
            subset = {name: row for name, row in snapshot['artifacts'].items()
                      if name == str(optional) or name.startswith(str(optional) + '/')}
            if inventory(remaining,True) != subset:
                raise RuntimeError('Conditional application changed')
            consumers(remaining, (OPTIONAL_APPLICATION,), tuple(RELEASES / r / 'nginx' for r in RETAIN))
            if identities(keep_paths(targets))!=snapshot['protected'] or runtime()!=snapshot['runtime']:
                raise RuntimeError('Protected state changed after primary cleanup')
            available = free_space()
            if available < int(required):
                if available + OPTIONAL_BYTES < int(required):
                    raise RuntimeError('Conditional application is insufficient for publication')
                remove_reviewed(remaining,subset)
                removed.append(optional)
        if any(os.path.lexists(p) for p in removed):
            raise RuntimeError('An authorized artifact remains')
        if identities(keep_paths(targets))!=snapshot['protected'] or runtime()!=snapshot['runtime']:
            raise RuntimeError('The cleanup changed protected data or a running service')
        health()
        print(json.dumps({'status':'removed','targets':list(map(str,removed)),'verified_bytes':snapshot['verified_bytes'] - (OPTIONAL_BYTES if len(removed) < len(targets) else 0),
                          'free_before':free_before,'free_after':free_space(),'preserved':list(RETAIN),
                          'runtime_unchanged':True}))

if __name__=='__main__':
    execute(*sys.argv[1:])
