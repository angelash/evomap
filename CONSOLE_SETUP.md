# EvoMap-Lite Console 部署指南

## 前置要求

- Node.js 18+ / npm 10+
- Nginx / Caddy（用于反向代理）
- Let's Encrypt（用于 HTTPS）

## 部署步骤

### 1. 构建 Console

```bash
cd console
npm install
npm run build
```

构建产物在 `console/dist/` 目录。

### 2. 配置 Nginx

创建 Nginx 配置文件 `/etc/nginx/sites-available/evomap-console`：

```nginx
server {
    listen 80;
    server_name console.evomap.local;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name console.evomap.local;

    # SSL 配置
    ssl_certificate /etc/letsencrypt/live/console.evomap.local/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/console.evomap.local/privkey.pem;

    # Console 静态文件
    root /home/shash/clawd/evomap/console/dist;
    index index.html;

    # SPA 路由支持
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API 反向代理
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

启用配置：

```bash
sudo ln -s /etc/nginx/sites-available/evomap-console /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 3. 配置 HTTPS

使用 Certbot 获取 Let's Encrypt 证书：

```bash
sudo certbot --nginx -d console.evomap.local
```

### 4. 环境变量配置

创建在 `console/.env.production`：

```env
VITE_API_BASE_URL=https://console.evomap.local/api
```

### 5. 验证部署

访问 `https://console.evomap.local`，确认：
- 页面正常加载
- API 请求正常
- 资产列表显示正常

## 故障排查

### Console 无法加载

检查 Nginx 日志：

```bash
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

### API 请求失败

检查 Hub API 服务状态：

```bash
curl http://localhost:3000/health
```

检查 CORS 配置，确保 Console 域名在允许列表中。
