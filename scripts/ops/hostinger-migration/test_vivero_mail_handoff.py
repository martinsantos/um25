import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('handoff', Path(__file__).with_name('handoff-vivero-mail-client.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class ViveroHandoff(unittest.TestCase):
    def setUp(self):
        self.policy = '# policy\n' + module.OLD + ' verify match=gestion.viveroloscocos.com.ar\n'
        self.sasl = '# original ' + module.OLD + '\n' + module.OLD + ' service:password-with:colon\n'
        self.transport = '/^first$/ smtp:' + module.OLD + '\n/^second$/ smtp:' + module.OLD + '\n/.*/ error:denied\n'

    def test_preserves_credentials_and_unrelated_routes(self):
        policy, sasl, transport, credential = module.replacements(self.policy, self.sasl, self.transport)
        self.assertIn(module.NEW + ' verify match=www.ultimamilla.com.ar', policy)
        self.assertIn('# original ' + module.OLD + '\n' + module.NEW + ' service:password-with:colon', sasl)
        self.assertEqual(credential, ['service', 'password-with:colon'])
        self.assertIn('/.*/ error:denied', transport)
        self.assertEqual(transport.count('smtp:' + module.NEW), 2)

    def test_refuses_unexpected_existing_routes(self):
        for policy, sasl, transport in ((self.policy.replace(module.OLD, module.NEW), self.sasl, self.transport),
                                        (self.policy, self.sasl + self.sasl, self.transport),
                                        (self.policy, self.sasl, self.transport.replace('smtp:', 'other:', 1))):
            with self.assertRaises(ValueError):
                module.replacements(policy, sasl, transport)


if __name__ == '__main__':
    unittest.main()
