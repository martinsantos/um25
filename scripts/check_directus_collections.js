import { createDirectus, rest, authentication, readCollections } from '@directus/sdk';

const DIRECTUS_URL = 'http://localhost:8055';
const EMAIL = 'admin@umbot.com.ar';
const PASSWORD = 'UmbotAdmin2025!';

const client = createDirectus(DIRECTUS_URL)
    .with(rest())
    .with(authentication('json', { autoRefresh: true }));

async function checkCollections() {
  try {
    await client.login(EMAIL, PASSWORD);
    console.log('✅ Authenticated.');
    const collections = await client.request(readCollections());
    console.log('Collections:', collections.map(c => c.collection).filter(name => !name.startsWith('directus_')));
  } catch (error) {
    console.error('Error fetching collections:', error.message);
  }
}

checkCollections();
