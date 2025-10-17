# 🔍 VPS Path Issue Analysis & Solution

## ❌ Error Message:
```json
{
  "success": false,
  "message": "File not found",
  "path": "/package/1760672456899_8f4e2510bbaabe443_1759900310404_fa079849a7e917a8_h1.webp",
  "fullPath": "/var/www/naamstay.com/patriniaelliott-travel-agency-backend/dist/public/storage/package/1760672456899_8f4e2510bbaabe443_1759900310404_fa079849a7e917a8_h1.webp"
}
```

## 🔍 Root Cause Analysis:

### **Problem Identified:**
Error message shows the application is looking for files in:
```
/var/www/naamstay.com/patriniaelliott-travel-agency-backend/dist/public/storage/package/
```

But it should be looking in:
```
/var/www/naamstay.com/patriniaelliott-travel-agency-backend/public/storage/package/
```

### **Root Cause:**
**Modified main.ts file not deployed to VPS!** The VPS is still using the old version with `dist/public` path.

## 🔧 Solution:

### **Step 1: Deploy Modified Files to VPS**

You need to upload these modified files to your VPS:

1. **src/main.ts** - With correct production path
2. **src/config/app.config.ts** - With correct storage path  
3. **docker-compose.prod.yml** - With volume mapping and APP_URL
4. **fix-vps-path-issue.sh** - Fix script

### **Step 2: Run Fix Script on VPS**

```bash
# On VPS, run:
chmod +x fix-vps-path-issue.sh
./fix-vps-path-issue.sh
```

### **Step 3: Manual Fix (if script doesn't work)**

```bash
# 1. Stop containers
docker-compose -f docker-compose.prod.yml down

# 2. Fix main.ts production path
sed -i "s|join(process.cwd(), 'dist', 'public')|join(__dirname, 'public')|g" src/main.ts

# 3. Fix app.config.ts storage path
sed -i "s|join(process.cwd(), 'dist', 'public', 'storage')|join(__dirname, '..', 'public', 'storage')|g" src/config/app.config.ts

# 4. Add APP_URL to docker-compose.prod.yml
sed -i '/- REDIS_PORT=6379/a\      - APP_URL=https://backend.naamstay.com' docker-compose.prod.yml

# 5. Add volume mapping to docker-compose.prod.yml
sed -i '/depends_on:/i\    volumes:\n      - ./public:/usr/src/app/public' docker-compose.prod.yml

# 6. Set file permissions
chmod -R 755 public/
find public/ -type f -exec chmod 644 {} \;

# 7. Update .env file
echo "APP_URL=https://backend.naamstay.com" >> .env

# 8. Rebuild and start containers
docker-compose -f docker-compose.prod.yml up -d --build
```

## 📋 Required File Changes:

### **1. src/main.ts**
```typescript
// BEFORE (causing error):
const publicPath = process.env.NODE_ENV === 'production' 
  ? join(process.cwd(), 'dist', 'public')  // ❌ Wrong path

// AFTER (correct):
const publicPath = process.env.NODE_ENV === 'production' 
  ? join(__dirname, 'public')  // ✅ Correct path
```

### **2. src/config/app.config.ts**
```typescript
// BEFORE (causing error):
rootUrl: process.env.NODE_ENV === 'production' 
  ? join(process.cwd(), 'dist', 'public', 'storage')  // ❌ Wrong path

// AFTER (correct):
rootUrl: process.env.NODE_ENV === 'production' 
  ? join(__dirname, '..', 'public', 'storage')  // ✅ Correct path
```

### **3. docker-compose.prod.yml**
```yaml
# ADD these lines:
environment:
  - APP_URL=https://backend.naamstay.com  # ✅ Add this

volumes:
  - ./public:/usr/src/app/public  # ✅ Add this
```

## 🎯 Expected Results After Fix:

### **Before Fix:**
```
Error: /var/www/naamstay.com/patriniaelliott-travel-agency-backend/dist/public/storage/package/
```

### **After Fix:**
```
Success: /var/www/naamstay.com/patriniaelliott-travel-agency-backend/public/storage/package/
```

## 🧪 Test Commands:

```bash
# Test the fix
curl -I https://backend.naamstay.com/public/storage/package/1760672456899_8f4e2510bbaabe443_1759900310404_fa079849a7e917a8_h1.webp

# Should return: HTTP/1.1 200 OK
```

## 🔍 Debug Commands:

```bash
# Check container logs
docker-compose -f docker-compose.prod.yml logs app

# Check file system
docker exec backend-prod ls -la /usr/src/app/public/storage/package/

# Check environment variables
docker exec backend-prod env | grep APP_URL
```

## 📋 Summary:

**Root Cause:** Modified files not deployed to VPS
**Solution:** Deploy modified files and run fix script
**Expected Result:** Image serving will work correctly

## 🚀 Quick Fix:

1. **Upload modified files to VPS**
2. **Run fix script:** `./fix-vps-path-issue.sh`
3. **Test image URL**
4. **Verify success**

---

**🎯 The issue is that your VPS is using old code with wrong paths. Deploy the modified files and run the fix script! 🚀**
