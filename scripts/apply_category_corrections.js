
import { createDirectus, rest, authentication, updateItem } from '@directus/sdk';

const DIRECTUS_URL = 'http://localhost:8055';
const EMAIL = 'admin@umbot.com.ar';
const PASSWORD = 'UmbotAdmin2025!';

const CORRECTIONS = [
  {
    "id": 3064,
    "area": "Gobierno & Sector Público"
  },
  {
    "id": 3065,
    "area": "Aeropuertos & Telecomunicaciones"
  },
  {
    "id": 3068,
    "area": "Aeropuertos & Telecomunicaciones"
  },
  {
    "id": 3069,
    "area": "Salud & Sector Salud"
  },
  {
    "id": 3072,
    "area": "Salud & Sector Salud"
  },
  {
    "id": 3073,
    "area": "Salud & Sector Salud"
  },
  {
    "id": 3074,
    "area": "Salud & Sector Salud"
  },
  {
    "id": 3075,
    "area": "Salud & Sector Salud"
  },
  {
    "id": 3076,
    "area": "Aeropuertos & Telecomunicaciones"
  },
  {
    "id": 3080,
    "area": "Aeropuertos & Telecomunicaciones"
  },
  {
    "id": 3085,
    "area": "Salud & Sector Salud"
  },
  {
    "id": 3086,
    "area": "Gobierno & Sector Público"
  },
  {
    "id": 3088,
    "area": "Aeropuertos & Telecomunicaciones"
  },
  {
    "id": 3093,
    "area": "Aeropuertos & Telecomunicaciones"
  },
  {
    "id": 3094,
    "area": "Salud & Sector Salud"
  },
  {
    "id": 3095,
    "area": "Aeropuertos & Telecomunicaciones"
  },
  {
    "id": 3096,
    "area": "Salud & Sector Salud"
  },
  {
    "id": 3097,
    "area": "Aeropuertos & Telecomunicaciones"
  },
  {
    "id": 3101,
    "area": "Salud & Sector Salud"
  },
  {
    "id": 3102,
    "area": "Salud & Sector Salud"
  },
  {
    "id": 3103,
    "area": "Salud & Sector Salud"
  },
  {
    "id": 3107,
    "area": "Aeropuertos & Telecomunicaciones"
  },
  {
    "id": 3109,
    "area": "Gobierno & Sector Público"
  },
  {
    "id": 3111,
    "area": "Aeropuertos & Telecomunicaciones"
  },
  {
    "id": 3112,
    "area": "Salud & Sector Salud"
  },
  {
    "id": 3114,
    "area": "Salud & Sector Salud"
  },
  {
    "id": 3118,
    "area": "Salud & Sector Salud"
  },
  {
    "id": 3122,
    "area": "Aeropuertos & Telecomunicaciones"
  },
  {
    "id": 3126,
    "area": "Aeropuertos & Telecomunicaciones"
  },
  {
    "id": 3130,
    "area": "Aeropuertos & Telecomunicaciones"
  },
  {
    "id": 3137,
    "area": "Aeropuertos & Telecomunicaciones"
  },
  {
    "id": 3140,
    "area": "Aeropuertos & Telecomunicaciones"
  },
  {
    "id": 3144,
    "area": "Salud & Sector Salud"
  },
  {
    "id": 3152,
    "area": "Salud & Sector Salud"
  },
  {
    "id": 3156,
    "area": "Gobierno & Sector Público"
  },
  {
    "id": 3157,
    "area": "Salud & Sector Salud"
  },
  {
    "id": 3159,
    "area": "Gobierno & Sector Público"
  },
  {
    "id": 3164,
    "area": "Aeropuertos & Telecomunicaciones"
  },
  {
    "id": 3172,
    "area": "Aeropuertos & Telecomunicaciones"
  },
  {
    "id": 3174,
    "area": "Aeropuertos & Telecomunicaciones"
  },
  {
    "id": 3178,
    "area": "Gobierno & Sector Público"
  },
  {
    "id": 3179,
    "area": "Aeropuertos & Telecomunicaciones"
  },
  {
    "id": 3189,
    "area": "Salud & Sector Salud"
  },
  {
    "id": 3197,
    "area": "Aeropuertos & Telecomunicaciones"
  },
  {
    "id": 3201,
    "area": "Gobierno & Sector Público"
  },
  {
    "id": 3202,
    "area": "Salud & Sector Salud"
  },
  {
    "id": 3212,
    "area": "Aeropuertos & Telecomunicaciones"
  },
  {
    "id": 3216,
    "area": "Salud & Sector Salud"
  },
  {
    "id": 3221,
    "area": "Aeropuertos & Telecomunicaciones"
  },
  {
    "id": 3223,
    "area": "Salud & Sector Salud"
  },
  {
    "id": 3229,
    "area": "Aeropuertos & Telecomunicaciones"
  },
  {
    "id": 3230,
    "area": "Gobierno & Sector Público"
  },
  {
    "id": 3231,
    "area": "Aeropuertos & Telecomunicaciones"
  },
  {
    "id": 3233,
    "area": "Gobierno & Sector Público"
  },
  {
    "id": 3236,
    "area": "Gobierno & Sector Público"
  },
  {
    "id": 3239,
    "area": "Aeropuertos & Telecomunicaciones"
  },
  {
    "id": 3254,
    "area": "Aeropuertos & Telecomunicaciones"
  },
  {
    "id": 3255,
    "area": "Salud & Sector Salud"
  },
  {
    "id": 3257,
    "area": "Aeropuertos & Telecomunicaciones"
  },
  {
    "id": 3259,
    "area": "Salud & Sector Salud"
  },
  {
    "id": 3260,
    "area": "Gobierno & Sector Público"
  },
  {
    "id": 3269,
    "area": "Gobierno & Sector Público"
  },
  {
    "id": 3276,
    "area": "Gobierno & Sector Público"
  },
  {
    "id": 3277,
    "area": "Gobierno & Sector Público"
  },
  {
    "id": 3278,
    "area": "Aeropuertos & Telecomunicaciones"
  },
  {
    "id": 3280,
    "area": "Salud & Sector Salud"
  },
  {
    "id": 3282,
    "area": "Salud & Sector Salud"
  },
  {
    "id": 3285,
    "area": "Gobierno & Sector Público"
  },
  {
    "id": 3287,
    "area": "Aeropuertos & Telecomunicaciones"
  },
  {
    "id": 3291,
    "area": "Aeropuertos & Telecomunicaciones"
  },
  {
    "id": 3306,
    "area": "Salud & Sector Salud"
  },
  {
    "id": 3310,
    "area": "Salud & Sector Salud"
  },
  {
    "id": 3318,
    "area": "Salud & Sector Salud"
  },
  {
    "id": 3321,
    "area": "Gobierno & Sector Público"
  },
  {
    "id": 3322,
    "area": "Gobierno & Sector Público"
  },
  {
    "id": 3332,
    "area": "Salud & Sector Salud"
  },
  {
    "id": 3335,
    "area": "Aeropuertos & Telecomunicaciones"
  },
  {
    "id": 3336,
    "area": "Aeropuertos & Telecomunicaciones"
  },
  {
    "id": 3337,
    "area": "Aeropuertos & Telecomunicaciones"
  },
  {
    "id": 3340,
    "area": "Aeropuertos & Telecomunicaciones"
  },
  {
    "id": 3346,
    "area": "Aeropuertos & Telecomunicaciones"
  },
  {
    "id": 3373,
    "area": "Salud & Sector Salud"
  },
  {
    "id": 3382,
    "area": "Gobierno & Sector Público"
  },
  {
    "id": 3385,
    "area": "Aeropuertos & Telecomunicaciones"
  },
  {
    "id": 3401,
    "area": "Salud & Sector Salud"
  },
  {
    "id": 3414,
    "area": "Aeropuertos & Telecomunicaciones"
  },
  {
    "id": 3415,
    "area": "Aeropuertos & Telecomunicaciones"
  },
  {
    "id": 3434,
    "area": "Gobierno & Sector Público"
  },
  {
    "id": 3446,
    "area": "Gobierno & Sector Público"
  },
  {
    "id": 3449,
    "area": "Gobierno & Sector Público"
  },
  {
    "id": 3451,
    "area": "Gobierno & Sector Público"
  },
  {
    "id": 3454,
    "area": "Salud & Sector Salud"
  },
  {
    "id": 3459,
    "area": "Gobierno & Sector Público"
  },
  {
    "id": 3477,
    "area": "Salud & Sector Salud"
  },
  {
    "id": 3481,
    "area": "Salud & Sector Salud"
  },
  {
    "id": 3486,
    "area": "Aeropuertos & Telecomunicaciones"
  },
  {
    "id": 3487,
    "area": "Salud & Sector Salud"
  },
  {
    "id": 3491,
    "area": "Gobierno & Sector Público"
  },
  {
    "id": 3492,
    "area": "Salud & Sector Salud"
  },
  {
    "id": 3498,
    "area": "Gobierno & Sector Público"
  },
  {
    "id": 3506,
    "area": "Gobierno & Sector Público"
  },
  {
    "id": 3513,
    "area": "Gobierno & Sector Público"
  },
  {
    "id": 3518,
    "area": "Aeropuertos & Telecomunicaciones"
  },
  {
    "id": 3527,
    "area": "Aeropuertos & Telecomunicaciones"
  },
  {
    "id": 3531,
    "area": "Aeropuertos & Telecomunicaciones"
  },
  {
    "id": 3532,
    "area": "Salud & Sector Salud"
  },
  {
    "id": 3539,
    "area": "Aeropuertos & Telecomunicaciones"
  },
  {
    "id": 3546,
    "area": "Gobierno & Sector Público"
  },
  {
    "id": 3548,
    "area": "Gobierno & Sector Público"
  },
  {
    "id": 3553,
    "area": "Aeropuertos & Telecomunicaciones"
  },
  {
    "id": 3562,
    "area": "Gobierno & Sector Público"
  },
  {
    "id": 3566,
    "area": "Aeropuertos & Telecomunicaciones"
  },
  {
    "id": 3568,
    "area": "Aeropuertos & Telecomunicaciones"
  },
  {
    "id": 3572,
    "area": "Aeropuertos & Telecomunicaciones"
  }
];

const client = createDirectus(DIRECTUS_URL)
    .with(rest())
    .with(authentication('json', { autoRefresh: true }));

async function apply() {
    try {
        await client.login(EMAIL, PASSWORD);
        console.log("✅ Authenticated.");
    } catch (e) {
        console.error("❌ Auth Failed:", e.message);
        process.exit(1);
    }
    
    let success = 0;
    for (const item of CORRECTIONS) {
        try {
            await client.request(updateItem('Antecedentes', item.id, {
                Area: item.area
            }));
            process.stdout.write(".");
            success++;
        } catch (error) {
            console.error(`\n❌ Error ID ${item.id}:`, error.message);
        }
    }
    console.log(`\nFinished. Success: ${success}/${CORRECTIONS.length}`);
}
apply();
