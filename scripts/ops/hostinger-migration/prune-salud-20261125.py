# The inactive d0a039d6 application was retired previously. Its transport is archived on the Mac.
ACTIVE = '8abba85ba4faa623fe361dc2b91bb18b4b5789d6-45471738890-1'
RETAIN = (ACTIVE,
          '1d6710163b0181bb35b7f85664246708208d4743-45449832120-1',
          '28f931c73838064aaafe0febde1a58ebb75a4910-45432902505-1')
ARCHIVED = 'd0a039d6e0071ed34af96ea28561dde1eb19b347-44841673780-1'
ARCHIVED_SHA256 = 'af2e24d9649d2950feaacf666675aa79358b7550a3d0f2adce025ff53f1a481c'
EXPECTED_ARCHIVE_SIZES = {
    'ed55f07fbcf4a28869996a71bb0e29b2638d6441-45249789027-1': 2120433308,
    ARCHIVED: 2120161411,
}
RETIRED = tuple(EXPECTED_ARCHIVE_SIZES)
FREE_EXPECTED = None  # snapshot_exact measures exclusive extents and checks the actual release size.
installed_receipt = web_release_receipt


def web_release_receipt(release):
    if release != ARCHIVED:
        return installed_receipt(release)
    directory = RELEASES / release
    secure_ancestors(directory / 'nginx')
    unit = 'umsa-web-' + release + '.service'
    if (os.path.lexists(directory / 'application')
            or run(['systemctl', 'show', unit, '--value', '-p', 'ActiveState']).strip() != 'inactive'):
        raise RuntimeError('Archived release state changed')
    receipt = directory / 'publication.complete'
    expected = dict(port=4321, unit=unit, config=str(directory / 'nginx'),
                    assets=str(directory / 'application/dist/client'))
    if not stat.S_ISREG(receipt.lstat().st_mode) or json.loads(receipt.read_text()) != expected:
        raise RuntimeError('Unexpected archived release receipt')
    path = archive_path(release)
    secure_ancestors(path.parent)
    with os.fdopen(os.open(path, os.O_RDONLY | os.O_NOFOLLOW), 'rb') as stream:
        info = os.fstat(stream.fileno())
        if not stat.S_ISREG(info.st_mode) or info.st_size != EXPECTED_ARCHIVE_SIZES[release]:
            raise RuntimeError('Unexpected archived package')
        checksum = hashlib.sha256()
        for chunk in iter(lambda: stream.read(1024 * 1024), b''):
            checksum.update(chunk)
        if checksum.hexdigest() != ARCHIVED_SHA256 or metadata(info) != metadata(path.lstat()):
            raise RuntimeError('Package differs from verified local archive')
    return expected


if __name__ == '__main__':
    execute(*sys.argv[1:])
