module.exports = {
  apps: [{
    name: 'cv-management',
    script: 'npm',
    args: 'start',
    cwd: __dirname,
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    node_args: '--max-old-space-size=2048',
    
    // إعدادات إضافية للإنتاج
    kill_timeout: 5000,
    listen_timeout: 8000,
    restart_delay: 4000,
    
    // متغيرات البيئة الإضافية
    env_vars: {
      NODE_OPTIONS: '--max-old-space-size=2048'
    }
  }],

  deploy: {
    production: {
      user: 'deploy',
      host: ['your-server-ip'],
      ref: 'origin/main',
      repo: 'your-git-repo-url',
      path: '/var/www/cv-management',
      'pre-deploy-local': '',
      'post-deploy': 'npm ci && npm run build && npx prisma migrate deploy && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
}
