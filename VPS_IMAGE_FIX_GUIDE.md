# VPS Image Serving Fix - Complete Guide

## সমস্যা
আপনার VPS এ image URL hit করলে 404 error পাচ্ছেন:
```
{"success":false,"message":{"message":"Cannot GET /public/storage/package/1760680704802_6fa79499c8ce94910_1759900310404_fa079849a7e917a8_h1.webp","error":"Not Found","statusCode":404}}
```

## সমাধান

### ✅ যা ঠিক করা হয়েছে:

1. **main.ts** - Production path resolution ঠিক করা হয়েছে
2. **app.config.ts** - Storage path ঠিক করা হয়েছে  
3. **docker-compose.prod.yml** - Volume mapping এবং APP_URL add করা হয়েছে
4. **Deployment scripts** - VPS deployment এর জন্য scripts তৈরি করা হয়েছে

### 🚀 VPS এ Deploy করার জন্য:

#### Option 1: Script ব্যবহার করুন (সবচেয়ে সহজ)

**Linux/Mac এর জন্য:**
```bash
# Script executable করুন
chmod +x deploy-vps-fix.sh

# Deploy করুন
./deploy-vps-fix.sh
```

**Windows এর জন্য:**
```cmd
deploy-vps-fix.bat
```

#### Option 2: Manual Commands

```bash
# 1. Container stop করুন
docker-compose -f docker-compose.prod.yml down

# 2. File permissions fix করুন
chmod -R 755 public/
find public/ -type f -exec chmod 644 {} \;

# 3. .env file update করুন
echo "APP_URL=https://backend.naamstay.com" >> .env

# 4. Container start করুন
docker-compose -f docker-compose.prod.yml up -d --build

# 5. Logs check করুন
docker-compose -f docker-compose.prod.yml logs app
```

### 🔍 Debug করার জন্য:

#### 1. Container এর ভিতরে check করুন:
```bash
docker exec -it backend-prod bash
ls -la /usr/src/app/public/storage/package/
```

#### 2. Specific file check করুন:
```bash
ls -la /usr/src/app/public/storage/package/1760680704802_6fa79499c8ce94910_1759900310404_fa079849a7e917a8_h1.webp
```

#### 3. Local test করুন:
```bash
curl -I http://localhost:4000/public/storage/package/1760680704802_6fa79499c8ce94910_1759900310404_fa079849a7e917a8_h1.webp
```

### 📋 Modified Files:

1. **src/main.ts**
   - Production path: `join(__dirname, 'public')` (Docker container path)

2. **src/config/app.config.ts**
   - Storage path: `join(__dirname, '..', 'public', 'storage')` (Docker container path)

3. **docker-compose.prod.yml**
   - Added: `APP_URL=https://backend.naamstay.com`
   - Added: `volumes: - ./public:/usr/src/app/public`

### 🎯 Test URL:
```
https://backend.naamstay.com/public/storage/package/1760680704802_6fa79499c8ce94910_1759900310404_fa079849a7e917a8_h1.webp
```

### ⚠️ Troubleshooting:

#### যদি এখনও 404 error পাচ্ছেন:

1. **File exists কিনা check করুন:**
   ```bash
   ls -la public/storage/package/1760680704802_6fa79499c8ce94910_1759900310404_fa079849a7e917a8_h1.webp
   ```

2. **Container logs check করুন:**
   ```bash
   docker-compose -f docker-compose.prod.yml logs app --tail=50
   ```

3. **Container file system check করুন:**
   ```bash
   docker exec backend-prod ls -la /usr/src/app/public/storage/package/
   ```

4. **Volume mapping check করুন:**
   ```bash
   docker inspect backend-prod | grep -A 10 "Mounts"
   ```

5. **Environment variables check করুন:**
   ```bash
   docker exec backend-prod env | grep APP_URL
   ```

### 🔧 Additional Fixes (যদি প্রয়োজন হয়):

#### Nginx Configuration (যদি Nginx ব্যবহার করেন):
```nginx
server {
    listen 80;
    server_name backend.naamstay.com;
    
    location /public/ {
        alias /path/to/your/project/public/;
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header Access-Control-Allow-Origin "*";
    }
    
    location / {
        proxy_pass http://localhost:4000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 📞 Support:

যদি এখনও সমস্যা থাকে, তাহলে এই information গুলো share করুন:

1. Container logs: `docker-compose -f docker-compose.prod.yml logs app`
2. File permissions: `ls -la public/storage/package/`
3. Container file system: `docker exec backend-prod ls -la /usr/src/app/public/storage/package/`
4. Environment variables: `docker exec backend-prod env | grep APP_URL`

## 🎉 Expected Result:

Deployment এর পর আপনার image URL কাজ করবে এবং আপনি image দেখতে পাবেন browser এ।
