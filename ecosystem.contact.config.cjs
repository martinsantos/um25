module.exports = {
  apps: [{
    name: 'astro-ultimamilla',
    script: './dist/server/entry.mjs',
    cwd: '/root/fumbling-field',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      SMTP_HOST: 'smtp.gmail.com',
      SMTP_PORT: '587',
      SMTP_USER: 'santosma@gmail.com',
      SMTP_PASS: 'pwrxasnjzdipbrml',
      PUBLIC_DIRECTUS_URL: 'https://admin.ultimamilla.com.ar',
      PORT: '4321',
      HOST: '0.0.0.0'
    }
  }]
};
