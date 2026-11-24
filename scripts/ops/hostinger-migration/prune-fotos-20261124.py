# One publication. The third archive was copied and SHA-256 verified on the Mac.
ACTIVE = '1d6710163b0181bb35b7f85664246708208d4743-45449832120-1'
RETAIN = (ACTIVE,
          '28f931c73838064aaafe0febde1a58ebb75a4910-45432902505-1',
          'ed55f07fbcf4a28869996a71bb0e29b2638d6441-45249789027-1')
ARCHIVED = 'fc700046c18762e623c227460edcd76ed94d00e5-44898838665-1'
ARCHIVED_SHA256 = '6a10d79ea27c06d26d20e4cb270641f1862090f3bb958775cbe3b6692e8fe2b0'
EXPECTED_ARCHIVE_SIZES = {
    '8ed527635d8c0f3bbdf869c7cb31c3d38457df05-45209428218-1': 2120448529,
    '14f54947c91902fe9bdb390d41aa16d1c74f8a37-45188287522-1': 2120433786,
    ARCHIVED: 2120167257,
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
    expected = dict(port=4322, unit=unit, config=str(directory / 'nginx'),
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
