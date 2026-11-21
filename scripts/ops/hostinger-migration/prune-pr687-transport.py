# Single transport for the service and sector picker release.
ACTIVE = '2e3f76b99044bbd05fe3bc30a555f6dba598398a-44924065945-1'
RETAIN = (ACTIVE, 'cd55cedf308e4904916cf57e8a3a29871c6cbd82-44913286978-1',
          'fc700046c18762e623c227460edcd76ed94d00e5-44898838665-1')
RETIRED = ('866d00cdb5855c0488dcd74cda7d9f1b318dee00-44828517985-1',)
EXPECTED_ARCHIVE_SIZES = {RETIRED[0]: 2120206676}
FREE_EXPECTED = 2120208384

if __name__ == '__main__':
    required_bytes = int(sys.argv[2])
    if sys.argv[1] == 'apply' and free_space() >= required_bytes:
        print(json.dumps({'status': 'sufficient_space'}))
    else:
        execute(*sys.argv[1:])
