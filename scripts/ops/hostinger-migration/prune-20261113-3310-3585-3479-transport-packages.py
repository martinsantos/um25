# Loaded after the established Hostinger pruning primitives by the workflow.
# Exactly two reviewed transports and one retired application are in scope.
ACTIVE = '0f73c46a066deec7ed5c4e345be5e3cf3d93d60d-43496723705-1'
RETAIN = ('0f73c46a066deec7ed5c4e345be5e3cf3d93d60d-43496723705-1', '499ae9b0d8c5b3d7994e9d792f83b4c50e564827-43480855408-1', 'fb03ea5a9286ba2189dffc2b1e41e0abba9dbbe6-43448537241-1')
RETIRED = ('6e47d2941dc5c472f8137aa639360c832de3a241-43417070085-1', 'e9db448ce6b2da93262d6c976f07f3e6618805ea-43404599523-1')
BACKUPS = (Path('/srv/umsa-operational-backups'), Path('/root/fumbling-field/backups'))
RETIRED_APP = 'cad4e9c04ce417a56fc7f9f04c9db55b86bd48f1-42740521036-1'
FREE_EXPECTED = 6753677312
EXPECTED_ARCHIVE_SIZES = {'6e47d2941dc5c472f8137aa639360c832de3a241-43417070085-1': 2108895732, 'e9db448ce6b2da93262d6c976f07f3e6618805ea-43404599523-1': 2107261588}

def free_space():
    disk = os.statvfs('/srv')
    return disk.f_bavail * disk.f_frsize

def reviewed_targets():
    return (*tuple(archive_path(release) for release in RETIRED), RELEASES / RETIRED_APP / 'application')

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
        web_release_receipt(release)
        secure_ancestors(archive.parent)
        if not stat.S_ISREG(archive.lstat().st_mode) or archive.lstat().st_size != EXPECTED_ARCHIVE_SIZES[release]:
            raise RuntimeError('Unexpected transport archive')
    application = targets[-1]
    secure_ancestors(application)
    web_release_receipt(RETIRED_APP)
    if set(p.name for p in application.iterdir()) != {'dist', 'node_modules', 'package.json', 'package-lock.json'}:
        raise RuntimeError('Unexpected retired application')
    if archive_path(RETIRED_APP).exists():
        raise RuntimeError('Unexpected transport for the retired application')
    if any(overlaps(candidate, path) for candidate in targets for path in PROTECTED):
        raise RuntimeError('Reviewed scope overlaps protected data')
    consumer_check = lambda: consumers(targets, (*RETIRED, RETIRED_APP), tuple(RELEASES / r / 'nginx' for r in (*RETAIN, *RETIRED)))
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
    if found != FREE_EXPECTED or free_space()+found<required:
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
