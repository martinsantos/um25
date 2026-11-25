# One transport authorized if the PR 720 deployment still needs space.
ACTIVE = '855a98433a502f18dfcd593fa82b4ceb6c5af8ea-45621741427-1'
RETAIN = (ACTIVE, '7e944561a9c3be41da67c10b00926612fac9e2ff-45596604717-1', '8abba85ba4faa623fe361dc2b91bb18b4b5789d6-45471738890-1')
RETIRED = ('1d6710163b0181bb35b7f85664246708208d4743-45449832120-1',)
EXPECTED_ARCHIVE_SIZES = {RETIRED[0]: 2120435041}
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
