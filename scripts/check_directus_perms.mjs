const DIRECTUS_URL = 'http://localhost:8055';
const EMAIL = 'admin@umbot.com.ar';
const PASSWORD = 'UmbotAdmin2025!';

async function check() {
    console.log(`[CHECK] Connecting to ${DIRECTUS_URL}...`);

    let token = '';
    try {
        const authRes = await fetch(`${DIRECTUS_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: EMAIL, password: PASSWORD })
        });
        const authData = await authRes.json();
        token = authData.data.access_token;
        console.log('[CHECK] Authenticated.');
    } catch (e) {
        console.error('[CHECK] Auth failed:', e);
        return;
    }

    const headers = { 'Authorization': `Bearer ${token}` };

    // 1. Check User Role
    const userRes = await fetch(`${DIRECTUS_URL}/users/me?fields=*,role.*`, { headers });
    const userData = await userRes.json();
    console.log('[CHECK] User Role:', userData.data?.role?.name || userData.data?.role);

    // 2. Check Collections
    const collRes = await fetch(`${DIRECTUS_URL}/collections`, { headers });
    const collData = await collRes.json();
    const collections = collData.data.map(c => c.collection).sort();
    console.log('[CHECK] Collections found:', collections.join(', '));

    // 3. Try to READ one item from Antecedentes
    // Case sensitive check
    const name = collections.find(c => c.toLowerCase() === 'antecedentes');
    if (name) {
        console.log(`[CHECK] Found collection: ${name}`);
        const itemRes = await fetch(`${DIRECTUS_URL}/items/${name}?limit=1`, { headers });
        const itemData = await itemRes.json();
        if (itemData.data && itemData.data.length > 0) {
             console.log('[CHECK] Read success. Sample ID:', itemData.data[0].id);
        } else {
             console.log('[CHECK] Read success but empty.');
        }
    } else {
        console.error('[CHECK] Collection "Antecedentes" NOT FOUND.');
    }
}

check();
