# 🧪 VPS Test Commands - Correct Way

## ❌ আপনার Error:
```bash
curl -X POST https://backend.naamstay.com/api/admin/package
{"success":false,"message":{"message":"Unauthorized","statusCode":401}}
```

**কারণ:** Admin package endpoint এ authentication required। এটি একটি protected route।

## ✅ সঠিক Test Commands:

### 1. **Public Endpoints Test (Authentication ছাড়াই):**

```bash
# Home page test
curl -s https://backend.naamstay.com/api/page/home

# Package search test
curl -s https://backend.naamstay.com/api/application/packages/search

# Package list test
curl -s https://backend.naamstay.com/api/application/packages
```

### 2. **Image Serving Test:**

```bash
# Direct image URL test
curl -I https://backend.naamstay.com/public/storage/package/1760672456899_8f4e2510bbaabe443_1759900310404_fa079849a7e917a8_h1.webp

# Local image URL test
curl -I http://localhost:4000/public/storage/package/1760672456899_8f4e2510bbaabe443_1759900310404_fa079849a7e917a8_h1.webp
```

### 3. **Container Status Check:**

```bash
# Check container status
docker-compose -f docker-compose.prod.yml ps

# Check container logs
docker-compose -f docker-compose.prod.yml logs app --tail=20

# Check container file system
docker exec backend-prod ls -la /usr/src/app/public/storage/package/
```

### 4. **File System Check:**

```bash
# Check local file system
ls -la public/storage/package/

# Check file permissions
chmod -R 755 public/
find public/ -type f -exec chmod 644 {} \;
```

### 5. **Environment Variables Check:**

```bash
# Check APP_URL
docker exec backend-prod env | grep APP_URL

# Check NODE_ENV
docker exec backend-prod env | grep NODE_ENV
```

## 🚀 Complete Test Script:

```bash
# Run the complete test script
chmod +x test-vps-image-serving-public.sh
./test-vps-image-serving-public.sh
```

## 🔍 Expected Results:

### ✅ **Public Endpoints:**
```bash
curl -s https://backend.naamstay.com/api/page/home
# Should return: {"success":true,"data":{...}}

curl -s https://backend.naamstay.com/api/application/packages/search
# Should return: {"success":true,"data":{...}}
```

### ✅ **Image Serving:**
```bash
curl -I https://backend.naamstay.com/public/storage/package/1760672456899_8f4e2510bbaabe443_1759900310404_fa079849a7e917a8_h1.webp
# Should return: HTTP/1.1 200 OK
```

### ✅ **Container Status:**
```bash
docker-compose -f docker-compose.prod.yml ps
# Should show: backend-prod    Up
```

## 🎯 Quick Test Sequence:

```bash
# 1. Test public endpoints
curl -s https://backend.naamstay.com/api/page/home

# 2. Test image serving
curl -I https://backend.naamstay.com/public/storage/package/1760672456899_8f4e2510bbaabe443_1759900310404_fa079849a7e917a8_h1.webp

# 3. Check container
docker-compose -f docker-compose.prod.yml ps

# 4. Check logs
docker-compose -f docker-compose.prod.yml logs app --tail=10
```

## 🔧 If Issues Found:

### **If public endpoints not working:**
```bash
# Restart container
docker-compose -f docker-compose.prod.yml restart app

# Check logs
docker-compose -f docker-compose.prod.yml logs app
```

### **If image serving not working:**
```bash
# Check file exists
ls -la public/storage/package/1760672456899_8f4e2510bbaabe443_1759900310404_fa079849a7e917a8_h1.webp

# Check container file system
docker exec backend-prod ls -la /usr/src/app/public/storage/package/

# Fix permissions
chmod -R 755 public/
find public/ -type f -exec chmod 644 {} \;
```

### **If container not running:**
```bash
# Start container
docker-compose -f docker-compose.prod.yml up -d

# Check status
docker-compose -f docker-compose.prod.yml ps
```

## 📋 Summary:

**❌ Wrong Command:**
```bash
curl -X POST https://backend.naamstay.com/api/admin/package
# This requires authentication
```

**✅ Correct Commands:**
```bash
# Test public endpoints
curl -s https://backend.naamstay.com/api/page/home

# Test image serving
curl -I https://backend.naamstay.com/public/storage/package/1760672456899_8f4e2510bbaabe443_1759900310404_fa079849a7e917a8_h1.webp

# Run complete test
./test-vps-image-serving-public.sh
```

---

**🎯 Use the correct commands above to test your VPS image serving! 🚀**
