# One transport authorized if the the November 27 UI publication deployment still needs space.
ACTIVE = '22d51a5e7b55947a320ce8a976eaf3e63b1c368e-45722065914-1'
RETAIN = (ACTIVE, '855a98433a502f18dfcd593fa82b4ceb6c5af8ea-45621741427-1', '7e944561a9c3be41da67c10b00926612fac9e2ff-45596604717-1')
RETIRED = ('8abba85ba4faa623fe361dc2b91bb18b4b5789d6-45471738890-1',)
EXPECTED_ARCHIVE_SIZES = {RETIRED[0]: 2120448191}
FREE_EXPECTED = None

review_snapshot = snapshot_exact

def snapshot_exact(required):
    result = subprocess.check_output(
        ['systemctl', 'show', 'umsa-active-backup.service', '-p', 'ActiveState', '--value'],
        text=True,
    ).strip()
    if result != 'inactive':
        raise RuntimeError('Backup running or in transition')
    return review_snapshot(required)

if __name__ == '__main__':
    execute(*sys.argv[1:])
