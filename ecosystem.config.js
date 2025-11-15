module.exports = {
  apps: [{
    name: 'qsr-system',
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
    // استخدام cluster mode - يستخدم كل الـCPUs المتاحة
    instances: 'max', // أو رقم محدد مثل 2, 4
    exec_mode: 'cluster', // تفعيل cluster mode
    
    autorestart: true,
    watch: false,
    max_memory_restart: '1500M', // زيادة الحد للأداء الأفضل
    
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    
    // تحسينات Node.js
    node_args: '--max-old-space-size=3072 --optimize-for-size --max-old-space-size=3072',
    
    // إعدادات إضافية للإنتاج
    kill_timeout: 5000,
    listen_timeout: 10000, // زيادة الوقت للتطبيقات الثقيلة
    restart_delay: 4000,
    
    // تفعيل graceful shutdown
    wait_ready: true,
    
    // Load balancing
    instance_var: 'INSTANCE_ID',
    
    // متغيرات البيئة الإضافية
    env_vars: {
      NODE_OPTIONS: '--max-old-space-size=3072'
    },
    
    // Monitoring
    merge_logs: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    
    // Performance
    min_uptime: '10s',
    max_restarts: 10,
    
    // Auto restart في حالة الخطأ
    exp_backoff_restart_delay: 100
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
