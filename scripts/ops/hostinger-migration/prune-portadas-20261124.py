# Transport packages approved for the five landing pages on 2026-11-24.
ACTIVE = 'ed55f07fbcf4a28869996a71bb0e29b2638d6441-45249789027-1'
RETAIN = (ACTIVE,
          '8ed527635d8c0f3bbdf869c7cb31c3d38457df05-45209428218-1',
          '14f54947c91902fe9bdb390d41aa16d1c74f8a37-45188287522-1')
EXPECTED_ARCHIVE_SIZES = {
    '18ad104d50345dccd160a53796ffd78d3af77ba3-45073185167-1': 2120181429,
    'e4c8024ab6231aa6e8eab99dc9191ce77cbd5bf2-45165225906-1': 2120441109,
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
