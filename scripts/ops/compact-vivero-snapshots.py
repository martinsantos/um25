#!/usr/bin/env python3
"""Share identical XFS blocks in a fixed set of historical SQLite snapshots."""
import argparse
import contextlib
import fcntl
import hashlib
import json
import os
import shutil
import sqlite3
import stat
import struct
import time
from pathlib import Path

ROOT = Path('/opt/gestion-vivero/shared/backups/snapshots')
CHUNK = 65536
MAX_RANGE = 1048576
FIDEDUPERANGE = 0xC0189436
AUDITED = {
    "20260731-063054": "ba4e6c9587fa6073ca9a423dc03eb0c3ba5a266bfe9bfd8817c2bf782c8cbe4c",
    "20260831-063148": "aeefe454c47c40dcf3812b565a1c63022a9a4f261f568e7132a1d2cc7d70789b",
    "20260913-063110": "f215ea89989081eacd04ee5df5f11891e8af7b87dd6c3b1973ef1e7d1fa267ef",
    "20260914-063109": "68c20757b63e27ca6cfb3b325ef06e6b96c41fa536c50cdbdc1b666281fe3e70",
    "20260915-063028": "0e5cfe40b7c06b4973673c8301a49069e2d3860170208935e3104aeaf5d4d212",
    "20260916-063306": "ea5f7b1160741890c973c62fa6c75db8f468dd199a2567b9d170f5ed1f4f6907",
    "20260917-063215": "4485a8fa6356ac3c0974a72c9f29a0c63b241264a92af4b063e0766b9a5b1e35",
    "20260918-063044": "4c9dd27a24f237013acc8398bc183395b0c2679588e1201ce09ae5cb672aff35",
    "20260919-063253": "05e6207eca21d4e001340c0aa13d26fa5b91c8db9b5ffefce5c5b35207cc8c5b",
    "20260920-063024": "ead4a2f3e45ebc826f063544dff0cd2c9111fe048d6c1a447c24ab06b54f8a2a",
    "20260921-063111": "f128b5030a7dbfe0d88ed47379a65ef13c8185e8ae978356eb2c69ef805c668e",
    "20260922-063459": "71c6cdc7e5d66c0ccee486a78f29b9abae78656821f947e6ad741b81a2d12530",
    "20260922-122730": "dc40169005f38552039966338a89da881f71c9169fefef214a4e20c1a76b8ae7",
    "20260922-124119": "21e2a59414ff0909c9170c73375ff0b71b001168561ec581c919036c131ab54c",
    "20260922-131940": "108b6180f865bf87691d5991be3c020a2e4307da481d6e3cf7027da3abe1cf97",
    "20260922-132545": "25098e4887714a2700e2b15219fa4ecab38ff7213b9c975ce37d2fe11efe3ac6",
    "20260922-134845": "3e4479967f9dabaa53d05e76608eda4b3518de1f8a8da1c9c319de8474e2503c",
    "20260922-145049": "968e096bdbaa3c5e508a6fb3329bbc5148011ceeb4138cf1e7dac19434f9c448",
    "20260922-145633": "8ec7077ba39d49dde5e476db9137b0e1fcfd7185098931093fbc0670fbcecdff",
    "20260922-145706": "3eca0cda768d5f5040c70e817d037958b6337cab43341c53eced5ed97968dccd",
    "20260923-063138": "14a3a87c16d4e5f792a734bad600e0b9e51696007c05438a99d406258455f3fc",
    "20260924-063107": "8d99af09157b0e421b770aef6b821f2200f4cbbd756cfaad2b5d7d8f1525dc24",
    "20260925-063405": "dbe79c7d95f479d670350204560abc9ee4eb7534dae8ef1cfe389327e123c0a7",
    "20260926-063044": "470102bf86dcbd6db557aa6f8030ab8718bbc2cd06b22b1714f99f744adfbb36",
    "20260927-063323": "cb0e7b5ddcc82926f0a75b1a33ef4bc268cff974a0e2c248dfd8842a5704afca",
    "20260927-112444": "f748ff88d73f00c8b756f28db154e506ef40120bdfa33ac7e9c0062821ee7383",
    "20260927-112854": "70ae9ff93eac6908fae0c7bd658f054a94d5c969b2542b7462d05fd5d6435ae1",
    "20260927-113009": "ad89558a82db5d417488b9ff734468567c85138d7b7fdfa9df496d7d87fa3b56",
    "20260927-113047": "f18b950c4f8eae2c60bcac76653a193cfc6bda06cfe9e7e6a4175e6964aa83ce",
    "20260927-113115": "2b289f3f8773133abacb0a39f2f72bb148d42830373ff1e562ebc85621c3c963",
    "20260928-063213": "81ef850f05536ca87893ec9697bf405e24ed28a708eaa85963a3e483af638fcb",
    "20260929-063341": "d4326c0151c6bf4259f4aea2110c11c8d93c51a6b95bc482bc4d068e4dfce2bf",
    "20260930-063240": "a43ea4c043a562e65446e871abcb5bca6704e4533e54f4580c351eefb533fac4",
    "20261001-063120": "64b94cc761e7fe9e9362f1fad385c618dc9f319f66b912797a7d6bebd11b3772",
    "20261002-063258": "6bd2d6fa7686bcea8380edd178a8827a9da41b375d217f8596f31fc1aa5c32eb",
    "20261002-113722": "5ea26b5329fdf601255d58e1c36e7fba1a238051d39c5615754936f9a2272e58",
    "20261002-161145": "c13cf031dc9861d0a3a491dfa705e2ad7a798b6776d0151d18fc4f0dc9b4c545",
    "20261002-162723": "50dd34927fc2ee90f0ccb4b950d0fc0628e0e3239cae76b1a128ba32010764bb",
    "20261002-163442": "33202016ef5c5c718ae12aabeaf49192808d957192b63ca2a203409abb960300",
    "20261002-170602": "d2f4207c52d4c8e18a70419a1877db21325c7a7a846e64ce7f6b28e9e64739fd",
    "20261002-171054": "95232cc2236d619e0219aabd8e054b47b67065a939ffa5b9a1f19c6fd096620f",
    "20261002-220656": "f67a30596d8bca0ac810a8a3e42e7204d8eeec0fd03a63962210ca8b887db7c5",
    "20261003-063257": "5a4db0b906ee2cc3234233fd040b54cd587c49eb48f5f91350a31242b9a8793d",
    "20261004-063420": "6de0c5d36b4c0017f3be5d33c853735350a74add15f1973473a0367f417d0267",
    "20261005-063425": "ecfec5dfa654521877f278be53008aeaa9c8e16b9aea40fc620e1a60de43e0ca",
    "20261006-063124": "bf987708b2b9354b850a0f2a67ca6722e5d44cfa58ef956dc0768937b4f32c34",
    "20261007-063442": "910d8ccebb1e5c71fa5aa827d58ef0abc9190269af2b044f31f1497abb8b35c3",
    "20261008-063351": "e2aae963a2202a47572e5167aee6fc7b89f9c7fbe38eac05a8243ec017dfb25f",
    "20261009-063019": "2bcbf37b7b3a5c47d6a5316417f8aa750d16b8877c640a2496769ec519ffec6c",
    "20261010-063028": "c9a115b82aa5058276ae98f09a6800ebd53596ff00e665778eefb10679495e76",
    "20261011-063206": "2fcaf2463c14bbae54d3c51530355e46800c8e5af274102dc4cd24b1a23c029d",
    "20261012-063425": "86e368acbd638c637ce9a32ca9515e94f1ae501843f670140c4052e295c48176",
    "20261013-063051": "30d3e8b9d708d331d4666897ff8b64c2d99e946d80fb9ab39ce56ce1c2556765"
}

def sha(path):
    digest = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(MAX_RANGE), b''):
            digest.update(block)
    return digest.hexdigest()

def signature(path):
    value = path.stat()
    return [value.st_dev, value.st_ino, value.st_size, value.st_mtime_ns,
            value.st_mode, value.st_uid, value.st_gid]

def regular(path, root):
    if path.is_symlink() or path.resolve() != path or not path.is_file():
        raise RuntimeError('Indirect or missing snapshot file: ' + str(path))
    if path.stat().st_dev != root.stat().st_dev or not stat.S_ISREG(path.stat().st_mode):
        raise RuntimeError('Snapshot is not a regular file on the expected filesystem')

def quick_check(path):
    with contextlib.closing(sqlite3.connect(path.as_uri() + '?mode=ro&immutable=1', uri=True)) as database:
        if database.execute('PRAGMA quick_check').fetchall() != [('ok',)]:
            raise RuntimeError('Historical SQLite integrity check failed: ' + str(path))

def inventory(root, expected):
    if root.is_symlink() or root.resolve() != root or not root.is_dir():
        raise RuntimeError('Snapshot root is indirect or absent')
    records = []
    for name, digest in sorted(expected.items(), reverse=True):
        directory = root / name
        if directory.is_symlink() or directory.resolve() != directory or not directory.is_dir():
            raise RuntimeError('Snapshot directory changed: ' + name)
        path = directory / 'prod.db'
        regular(path, root)
        before = signature(path)
        if sha(path) != digest or signature(path) != before:
            raise RuntimeError('Historical snapshot differs from the reviewed audit: ' + name)
        quick_check(path)
        files = []
        for item in sorted(directory.iterdir()):
            regular(item, root)
            identity = signature(item)
            files.append({'name': item.name, 'signature': identity, 'sha256': sha(item)})
            if signature(item) != identity:
                raise RuntimeError('Snapshot file changed while reading')
        manifest = directory / 'MANIFEST.sha256'
        if manifest.exists():
            by_name = {item['name']: item for item in files}
            for line in manifest.read_text().splitlines():
                checksum, filename = line.split(None, 1)
                filename = filename.strip().lstrip('*')
                if filename not in by_name or by_name[filename]['sha256'] != checksum:
                    raise RuntimeError('Snapshot restoration manifest failed: ' + name)
        records.append({'name': name, 'directory_signature': signature(directory), 'files': files})
    return {'root_signature': signature(root), 'snapshots': records}

def ranges(root, snapshots):
    seen = {}
    selected = []
    for snapshot in snapshots:
        name = snapshot['name']
        path = root / name / 'prod.db'
        offset = 0
        with path.open('rb') as stream:
            for block in iter(lambda: stream.read(CHUNK), b''):
                aligned = len(block) // 4096 * 4096
                if aligned:
                    key = (offset, aligned, hashlib.sha256(block[:aligned]).digest())
                    if key in seen:
                        source = seen[key]
                        previous = selected[-1] if selected else None
                        if (previous and previous['source'] == source and previous['target'] == name
                                and previous['offset'] + previous['length'] == offset):
                            previous['length'] += aligned
                        else:
                            selected.append({'source': source, 'target': name,
                                             'offset': offset, 'length': aligned})
                    else:
                        seen[key] = name
                offset += len(block)
    return selected

def make_plan(root=ROOT, expected=AUDITED):
    before = inventory(root, expected)
    selected = ranges(root, before['snapshots'])
    if inventory(root, expected) != before:
        raise RuntimeError('Snapshot inventory changed during planning')
    return {'root': str(root), 'inventory': before, 'ranges': selected}

def fingerprint(plan):
    return hashlib.sha256(json.dumps(plan, sort_keys=True, separators=(',', ':')).encode()).hexdigest()

def validate(plan, expected):
    root = Path(plan['root'])
    if inventory(root, expected) != plan['inventory']:
        raise RuntimeError('A snapshot or its metadata changed; no blocks modified')

def compact(plan, expected=AUDITED, ioctl=None):
    validate(plan, expected)
    root = Path(plan['root'])
    io = fcntl.ioctl if ioctl is None else ioctl
    before = shutil.disk_usage(root).free
    identities = {item['name']: next(f['signature'] for f in item['files'] if f['name'] == 'prod.db')
                  for item in plan['inventory']['snapshots']}
    if time.time() - max(info[3] / 1_000_000_000 for info in identities.values()) > 86400:
        raise RuntimeError('A recent verified Vivero snapshot is required')
    descriptors = {}
    count = shared = 0
    with contextlib.ExitStack() as stack:
        for name in identities:
            fd = os.open(root / name / 'prod.db', os.O_RDWR | os.O_NOFOLLOW)
            stack.callback(os.close, fd)
            descriptors[name] = fd
        def check(fd, name):
            s = os.fstat(fd)
            current = [s.st_dev, s.st_ino, s.st_size, s.st_mtime_ns, s.st_mode, s.st_uid, s.st_gid]
            if current != identities[name] or signature(root / name / 'prod.db') != current:
                raise RuntimeError('Opened snapshot inode or path changed')
        for entry in plan['ranges']:
            source = descriptors[entry['source']]
            target = descriptors[entry['target']]
            if source == target:
                raise RuntimeError('A snapshot cannot be its own target')
            for offset in range(entry['offset'], entry['offset'] + entry['length'], MAX_RANGE):
                length = min(MAX_RANGE, entry['offset'] + entry['length'] - offset)
                check(source, entry['source'])
                check(target, entry['target'])
                request = bytearray(struct.pack('=QQHHIqQQiI', offset, length,
                                               1, 0, 0, target, offset, 0, 0, 0))
                io(source, FIDEDUPERANGE, request, True)
                deduped, status = struct.unpack_from('=Qi', request, 40)
                if status != 0 or deduped != length:
                    raise RuntimeError('Kernel refused an identical snapshot range: ' + str(status))
                shared += deduped
                count += 1
    validate(plan, expected)
    return {'snapshot_count': len(identities), 'kernel_verified_ranges': count,
            'bytes_shared': shared, 'bytes_reclaimed': shutil.disk_usage(root).free - before,
            'all_snapshot_files_and_hashes_preserved': True,
            'all_sqlite_integrity_checks_passed': True, 'services_restarted': 0}

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--apply', action='store_true')
    parser.add_argument('--expected-plan-sha', default='')
    args = parser.parse_args()
    if len(AUDITED) != 53:
        raise RuntimeError('The reviewed snapshot set must contain exactly 53 versions')
    plan = make_plan()
    digest = fingerprint(plan)
    print(json.dumps({'mode': 'apply' if args.apply else 'plan', 'plan_sha256': digest,
                      'snapshot_count': len(plan['inventory']['snapshots']),
                      'range_count': len(plan['ranges']),
                      'bytes_identical': sum(r['length'] for r in plan['ranges'])}), flush=True)
    if not args.apply:
        return
    if args.expected_plan_sha != digest:
        raise RuntimeError('Reviewed plan differs; no blocks modified')
    receipt = Path('/root/backups') / ('vivero-snapshot-compaction-' + digest + '.json')
    if receipt.exists():
        raise RuntimeError('A receipt already exists; inspect it before repeating')
    with receipt.open('x') as stream:
        os.chmod(receipt, 0o600)
        json.dump({'plan': plan}, stream, sort_keys=True)
    result = compact(plan)
    with receipt.open('w') as stream:
        json.dump({'plan': plan, 'result': result}, stream, sort_keys=True)
    print(json.dumps({**result, 'receipt': str(receipt)}), flush=True)

if __name__ == '__main__':
    main()
