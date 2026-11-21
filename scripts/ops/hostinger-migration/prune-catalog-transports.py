# Transports approved for the catalog publication from cd55cedf.
ACTIVE = 'cd55cedf308e4904916cf57e8a3a29871c6cbd82-44913286978-1'
RETAIN = (ACTIVE,
          'fc700046c18762e623c227460edcd76ed94d00e5-44898838665-1',
          'd0a039d6e0071ed34af96ea28561dde1eb19b347-44841673780-1')
EXPECTED_ARCHIVE_SIZES = {
    '22bfe60bbcd4ec829a012d9c0b5fd1deabe6e972-44757462414-1': 2120059077,
    '50a46ceb966aaa68f64c1560ccb9d8a0d23dab48-44776779756-1': 2120186079,
    'a5d3fbaf8dfecd08c43aba7900eab486c1ba573b-44789660605-1': 2120161938,
}
RETIRED = tuple(EXPECTED_ARCHIVE_SIZES)
FREE_EXPECTED = 6360412160

if __name__ == '__main__':
    required_bytes = int(sys.argv[2])
    if sys.argv[1] == 'apply' and free_space() >= required_bytes:
        print(json.dumps({'status': 'sufficient_space'}))
    else:
        execute(*sys.argv[1:])
