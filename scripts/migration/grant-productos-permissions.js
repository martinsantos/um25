#!/usr/bin/env node
/**
 * Grant Permissions to Productos Collection
 * Grants full CRUD permissions to the productos collection
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

const DIRECTUS_URL = process.env.PUBLIC_DIRECTUS_URL || 'http://localhost:8055';
const DIRECTUS_TOKEN = process.env.DIRECTUS_STATIC_TOKEN || process.env.PUBLIC_DIRECTUS_TOKEN;

async function grantPermissions() {
  console.log('🔐 Otorgando permisos a colección "productos"...\n');

  if (!DIRECTUS_TOKEN) {
    console.error('❌ Token no disponible');
    process.exit(1);
  }

  try {
    // 1. Obtener roles existentes
    console.log('1️⃣  Obteniendo roles...');

    const rolesResponse = await fetch(`${DIRECTUS_URL}/roles`, {
      headers: {
        'Authorization': `Bearer ${DIRECTUS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (!rolesResponse.ok) {
      throw new Error(`Failed to get roles: ${await rolesResponse.text()}`);
    }

    const rolesData = await rolesResponse.json();
    const roles = rolesData.data;

    console.log(`✅ Encontrados ${roles.length} roles\n`);

    // 2. Para cada rol, otorgar permisos completos a productos
    console.log('2️⃣  Otorgando permisos CRUD...');

    const permissions = [
      { action: 'create', fields: ['*'] },
      { action: 'read', fields: ['*'] },
      { action: 'update', fields: ['*'] },
      { action: 'delete', fields: ['*'] }
    ];

    for (const role of roles) {
      console.log(`\n   Role: ${role.name} (${role.id})`);

      for (const perm of permissions) {
        const permissionData = {
          role: role.id,
          collection: 'productos',
          action: perm.action,
          fields: perm.fields,
          permissions: {}, // Sin restricciones
          validation: null,
          policy: null // Allow all
        };

        const permResponse = await fetch(`${DIRECTUS_URL}/permissions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${DIRECTUS_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(permissionData)
        });

        if (permResponse.ok) {
          console.log(`   ✅ ${perm.action.toUpperCase()} granted`);
        } else {
          const error = await permResponse.text();
          // Si ya existe, no es un error crítico
          if (error.includes('already exists') || error.includes('duplicate')) {
            console.log(`   ℹ️  ${perm.action.toUpperCase()} ya existe`);
          } else {
            console.log(`   ⚠️  ${perm.action.toUpperCase()}: ${error.substring(0, 80)}`);
          }
        }
      }
    }

    console.log('\n✅ Permisos otorgados exitosamente\n');
    console.log('📋 Siguiente paso: node scripts/migration/migrate-productos-to-directus.js\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

grantPermissions();
