# Loaded after the established Hostinger pruning primitives by the workflow.
# Only the two reviewed transport packages are in scope.
ACTIVE = '1f0a270655dc4230d521fc2bfb1dca1a1ed2e413-43718585597-1'
RETAIN = ('1f0a270655dc4230d521fc2bfb1dca1a1ed2e413-43718585597-1', '9577d566e464c47da19c50aa187dd5f79d71e2b1-43709697407-1', 'c7498724e330d6e027658cf64b4dc88a7ba84cec-43705919199-1')
RETIRED = ('361c7bdb32cf18222e20383fa1a24cc6fec55bf4-43637604958-1', '74b19dbeed314a9164df21fb5018a24c1af1bf18-43650282175-1')
BACKUPS = (Path('/srv/umsa-operational-backups'), Path('/root/fumbling-field/backups'))
FREE_EXPECTED = 4228071424
EXPECTED_ARCHIVE_SIZES = {'361c7bdb32cf18222e20383fa1a24cc6fec55bf4-43637604958-1': 2113982127, '74b19dbeed314a9164df21fb5018a24c1af1bf18-43650282175-1': 2114086585}

def free_space():
    disk = os.statvfs('/srv')
    return disk.f_bavail * disk.f_frsize

def reviewed_targets():
    return tuple(archive_path(release) for release in RETIRED)

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
    for release, archive in zip(RETIRED, targets):
        receipt = RELEASES / release / 'publication.complete'
        web_release_receipt(release)
        if not stat.S_ISREG(receipt.lstat().st_mode):
            raise RuntimeError('Expected the installed inactive application and its receipt')
        if json.loads(receipt.read_text())['unit'] != 'umsa-web-' + release + '.service':
            raise RuntimeError('Release receipt differs from the reviewed identity')
        secure_ancestors(archive.parent)
        if not stat.S_ISREG(archive.lstat().st_mode) or archive.lstat().st_size != EXPECTED_ARCHIVE_SIZES[release]:
            raise RuntimeError('Unexpected transport archive')
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
