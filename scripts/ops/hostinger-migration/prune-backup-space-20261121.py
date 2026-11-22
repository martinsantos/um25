# Fixed scope for the approved maintenance following release 44951482589.
ACTIVE = '9d6b7c00f53be508bf0414f61c5788ba060d2472-44951482589-1'
RETAIN = (ACTIVE,
          '2e3f76b99044bbd05fe3bc30a555f6dba598398a-44924065945-1',
          'cd55cedf308e4904916cf57e8a3a29871c6cbd82-44913286978-1')
PACKAGE_RELEASE = 'd0a039d6e0071ed34af96ea28561dde1eb19b347-44841673780-1'
APPLICATION_RELEASE = 'fc700046c18762e623c227460edcd76ed94d00e5-44898838665-1'
RETIRED = (PACKAGE_RELEASE, APPLICATION_RELEASE)
# Counts internal hard links once; no links to files outside the two directories.
FREE_EXPECTED = 5124157440

if __name__ == '__main__':
    execute(*sys.argv[1:])
