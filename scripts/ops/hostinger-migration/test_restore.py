import copy
import importlib.util
from pathlib import Path
import unittest
import tempfile

spec = importlib.util.spec_from_file_location('restore', Path(__file__).with_name('restore-databases.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class DatabaseRestorePlan(unittest.TestCase):
    def setUp(self):
        self.metadata = [dict(Name='/' + name, Image='sha256:' + 'a' * 64,
            Mounts=[dict(Name=volume, Destination='/var/lib/postgresql/data')],
            Config=dict(Entrypoint=['docker-entrypoint.sh'], Cmd=['postgres'],
                        Env=['POSTGRES_USER=original', 'POSTGRES_DB=app', 'POSTGRES_HOST_AUTH_METHOD=trust']))
            for name, (_, volume, _) in module.DATABASES.items()]

    def test_new_cluster_uses_unique_bootstrap_and_no_trust(self):
        plan = module.database_plan(self.metadata)
        for database in plan:
            self.assertEqual(database['env']['POSTGRES_USER'], module.BOOTSTRAP)
            self.assertEqual(database['env']['POSTGRES_DB'], 'postgres')
            self.assertNotIn('POSTGRES_HOST_AUTH_METHOD', database['env'])
        self.assertEqual(len(plan), 2)

    def test_changed_storage_is_not_guessed(self):
        metadata = copy.deepcopy(self.metadata)
        metadata[0]['Mounts'][0]['Destination'] = '/unknown'
        with self.assertRaises(ValueError):
            module.database_plan(metadata)

    def test_changed_entrypoint_is_not_started(self):
        metadata = copy.deepcopy(self.metadata)
        metadata[0]['Config']['Entrypoint'] = ['unrecognized']
        with self.assertRaises(ValueError):
            module.database_plan(metadata)

    def test_recovery_refuses_initialized_volume_and_existing_containers(self):
        network = dict(Internal=True, Containers={}, IPAM=dict(Config=[dict(Subnet='172.30.250.0/24')]))
        volumes = ['directus-admin_directus_db_data']
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory)
            module.validate_empty_recovery([], volumes, path, network)
            with self.assertRaises(RuntimeError):
                module.validate_empty_recovery(['running-app'], volumes, path, network)
            (path / 'PG_VERSION').write_text('15')
            with self.assertRaises(RuntimeError):
                module.validate_empty_recovery([], volumes, path, network)

    def test_recovery_refuses_unexpected_volumes_or_external_network(self):
        with tempfile.TemporaryDirectory() as directory:
            network = dict(Internal=False, Containers={}, IPAM=dict(Config=[dict(Subnet='172.30.250.0/24')]))
            with self.assertRaises(RuntimeError):
                module.validate_empty_recovery([], ['directus-admin_directus_db_data'], Path(directory), network)
            network['Internal'] = True
            with self.assertRaises(RuntimeError):
                module.validate_empty_recovery([], ['other-data'], Path(directory), network)


if __name__ == '__main__':
    unittest.main()
