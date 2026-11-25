# Exact transport authorized for retirement to increase the backup headroom.
ACTIVE = '7e944561a9c3be41da67c10b00926612fac9e2ff-45596604717-1'
RETAIN = (ACTIVE, '8abba85ba4faa623fe361dc2b91bb18b4b5789d6-45471738890-1',
          '1d6710163b0181bb35b7f85664246708208d4743-45449832120-1')
RETIRED = ('28f931c73838064aaafe0febde1a58ebb75a4910-45432902505-1',)
EXPECTED_ARCHIVE_SIZES = {RETIRED[0]: 2120459426}
FREE_EXPECTED = None  # Calculated from the file's exclusive extents by snapshot_exact.

if __name__ == '__main__':
    execute(*sys.argv[1:])
