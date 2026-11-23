# Loaded after the reviewed two-transport inspector by the production workflow.
ACTIVE = 'e4c8024ab6231aa6e8eab99dc9191ce77cbd5bf2-45165225906-1'
RETAIN = (ACTIVE,
          '18ad104d50345dccd160a53796ffd78d3af77ba3-45073185167-1',
          'bb35338156cbb55fe87109e1e824090140d644ac-45032835173-1')
EXPECTED_ARCHIVE_SIZES = {
    'cd55cedf308e4904916cf57e8a3a29871c6cbd82-44913286978-1': 2120166417,
    '2e3f76b99044bbd05fe3bc30a555f6dba598398a-44924065945-1': 2120176915,
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
