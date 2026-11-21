# Scope of the single transport authorized for PR 678.
ACTIVE = 'd0a039d6e0071ed34af96ea28561dde1eb19b347-44841673780-1'
RETAIN = (ACTIVE, '866d00cdb5855c0488dcd74cda7d9f1b318dee00-44828517985-1',
          'a5d3fbaf8dfecd08c43aba7900eab486c1ba573b-44789660605-1')
RETIRED = ('50a46ceb966aaa68f64c1560ccb9d8a0d23dab48-44776779756-1',)
EXPECTED_ARCHIVE_SIZES = {RETIRED[0]: 2120186079}
FREE_EXPECTED = None

if __name__ == '__main__':
    required_bytes = int(sys.argv[2])
    if sys.argv[1] == 'apply' and free_space() >= required_bytes:
        print(json.dumps({'status': 'sufficient_space'}))
    else:
        execute(*sys.argv[1:])
