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
    } catch (e) {
        console.error('[CHECK] Auth failed');
        process.exit(1);
    }

    const headers = { 'Authorization': `Bearer ${token}` };

    // REMOVED date_created
    const res = await fetch(`${DIRECTUS_URL}/items/Antecedentes?limit=-1&fields=id,Titulo`, { headers });
    
    if (!res.ok) {
        console.error(`[CHECK] Fetch Failed: ${res.status}`);
        console.error(await res.text());
        return;
    }

    const data = await res.json();
    const items = data.data || [];
    
    console.log(`[CHECK] Total items: ${items.length}`);
    if (items.length > 0) {
        console.log('Sample Old:', JSON.stringify(items[0]));
        console.log('Sample New (Last):', JSON.stringify(items[items.length - 1]));
        
        // Regex for Enhanced Title: Ends with (Month Year) or (Month Year) (N)
        // e.g., (Oct 2024) or (Oct 2024) (2)
        // Pattern: \([A-Za-z]{3} \d{4}\)( \(\d+\))?$
        const regex = /\([A-Za-z]{3} \d{4}\)( \(\d+\))?$/;
        
        const enhanced = items.filter(i => regex.test(i.Titulo));
        const raw = items.filter(i => !regex.test(i.Titulo));
        
        console.log(`[CHECK] Enhanced Format: ${enhanced.length}`);
        console.log(`[CHECK] Raw Format: ${raw.length}`);
    }
}

check();
