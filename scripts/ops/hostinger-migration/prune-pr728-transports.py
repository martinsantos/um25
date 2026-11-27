# Loaded after prune-reviewed-migration.py and prune-20261115-equipment-packages.py.
ACTIVE = '5db725a2f8af15564cb355b2d0f557d4118f03db-46014069327-1'
RETAIN = (
    ACTIVE,
    '5b3126173e887f1cb51879b39f8ff4d2def3a05c-45978067788-1',
    '22d51a5e7b55947a320ce8a976eaf3e63b1c368e-45722065914-1',
)
LOCAL_COPY_RELEASE = '330cff915a3fe4e1d7087c812986dc40080e7471-44152432935-1'
RETIRED = (
    '855a98433a502f18dfcd593fa82b4ceb6c5af8ea-45621741427-1',
    LOCAL_COPY_RELEASE,
)
EXPECTED_ARCHIVE_SIZES = {RETIRED[0]: 2120452228, RETIRED[1]: 2118587114}
MAC_COPY_SHA256 = '538f2b0b768db1f441b62c19fee7fd57e412812a745397b511b971b5a9bce91c'
FREE_EXPECTED = None

installed_receipt = web_release_receipt
review_snapshot = snapshot_exact


def web_release_receipt(release):
    if release != LOCAL_COPY_RELEASE:
        return installed_receipt(release)
    directory = RELEASES / release
    secure_ancestors(directory)
    receipt = directory / 'publication.complete'
    if not stat.S_ISREG(receipt.lstat().st_mode) or os.path.lexists(directory / 'application'):
        raise RuntimeError('Expected only the receipt for the release archived to the Mac')
    state = json.loads(receipt.read_text())
    if state.get('port') not in (4321, 4322) or state != {
        'port': state.get('port'),
        'unit': f'umsa-web-{release}.service',
        'config': str(directory / 'nginx'),
        'assets': str(directory / 'application/dist/client'),
    }:
        raise RuntimeError('Archived release receipt differs from the reviewed identity')
    return state


def verify_mac_copy(archive, expected_metadata):
    fd = os.open(archive, os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK)
    with os.fdopen(fd, 'rb') as package:
        if metadata(os.fstat(package.fileno())) != expected_metadata:
            raise RuntimeError('Archive changed before SHA-256 verification')
        archive_hash = hashlib.sha256()
        for chunk in iter(lambda: package.read(8 * 1024 * 1024), b''):
            archive_hash.update(chunk)
        if archive_hash.hexdigest() != MAC_COPY_SHA256:
            raise RuntimeError('Hostinger archive differs from the verified Mac copy')
        if metadata(os.fstat(package.fileno())) != expected_metadata:
            raise RuntimeError('Archive changed during SHA-256 verification')


def snapshot_exact(required):
    backup = run([
        'systemctl', 'show', 'umsa-active-backup.service',
        '--property=ActiveState,Result',
    ])
    if dict(line.split('=', 1) for line in backup.splitlines()) != {
        'ActiveState': 'inactive', 'Result': 'success',
    }:
        raise RuntimeError('The last backup is not successful or a backup is in progress')
    snapshot, consumer_check = review_snapshot(required)
    if snapshot['status'] == 'ready':
        archive = archive_path(LOCAL_COPY_RELEASE)
        verify_mac_copy(archive, snapshot['artifacts'][str(archive)]['meta'])
    return snapshot, consumer_check


if __name__ == '__main__':
    execute(*sys.argv[1:])
