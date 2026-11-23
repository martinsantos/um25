# Only retired transports with installed applications, selected for this release.
ACTIVE = '14f54947c91902fe9bdb390d41aa16d1c74f8a37-45188287522-1'
RETAIN = (ACTIVE,
          'e4c8024ab6231aa6e8eab99dc9191ce77cbd5bf2-45165225906-1',
          '18ad104d50345dccd160a53796ffd78d3af77ba3-45073185167-1')
EXPECTED_ARCHIVE_SIZES = {
    '9d6b7c00f53be508bf0414f61c5788ba060d2472-44951482589-1': 2120170020,
    'bb35338156cbb55fe87109e1e824090140d644ac-45032835173-1': 2120178798,
}
# snapshot_exact measures exclusive extents and verifies the result is enough.
FREE_EXPECTED = None

if __name__ == '__main__':
    required = int(sys.argv[2])
    available = free_space()
    if available >= required:
        result = {'status': 'sufficient_space'}
        if sys.argv[1] == 'inspect':
            result['snapshot_sha256'] = digest(result)
        print(json.dumps(result))
    else:
        RETIRED = tuple(release for release in EXPECTED_ARCHIVE_SIZES
                        if os.path.lexists(archive_path(release)))
        if not RETIRED:
            raise RuntimeError('No approved transport available')
        oldest = archive_path(RETIRED[0])
        secure_ancestors(oldest.parent)
        if not stat.S_ISREG(oldest.lstat().st_mode):
            raise RuntimeError('Unexpected transport type')
        if available + unshared_bytes(str(oldest)) >= required:
            RETIRED = RETIRED[:1]
        execute(*sys.argv[1:])
