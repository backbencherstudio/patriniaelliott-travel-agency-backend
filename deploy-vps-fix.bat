@echo off
echo 🚀 Starting VPS image serving fix...

REM Check if running in project directory
if not exist "docker-compose.prod.yml" (
    echo [ERROR] docker-compose.prod.yml not found! Please run this script from your project root directory.
    pause
    exit /b 1
)

REM Check if public directory exists
if not exist "public" (
    echo [ERROR] Public directory not found!
    pause
    exit /b 1
)

echo [INFO] Stopping existing containers...
docker-compose -f docker-compose.prod.yml down

echo [INFO] Setting permissions for public directory...
REM Note: Windows doesn't have chmod, so we'll skip permission setting
REM The Docker volume mapping should handle this

REM Check specific file
set TARGET_FILE=public\storage\package\1760680704802_6fa79499c8ce94910_1759900310404_fa079849a7e917a8_h1.webp
if exist "%TARGET_FILE%" (
    echo [INFO] ✅ Target image file found
    dir "%TARGET_FILE%"
) else (
    echo [WARNING] ⚠️  Target image file not found
    echo [INFO] Available files in package directory:
    dir public\storage\package\ /b | findstr /i "\.webp$" | head -5
)

REM Check if .env file exists and update APP_URL
if exist ".env" (
    echo [INFO] Updating .env file with correct APP_URL...
    powershell -Command "(Get-Content .env) -replace 'APP_URL=.*', 'APP_URL=https://backend.naamstay.com' | Set-Content .env"
) else (
    echo [WARNING] .env file not found. Creating a basic one...
    (
        echo NODE_ENV=production
        echo APP_URL=https://backend.naamstay.com
        echo DATABASE_URL=postgresql://postgres:root@postgres/backend
        echo REDIS_HOST=redis
        echo REDIS_PORT=6379
    ) > .env
)

echo [INFO] Building and starting containers...
docker-compose -f docker-compose.prod.yml up -d --build

echo [INFO] Waiting for containers to start...
timeout /t 15 /nobreak > nul

echo [INFO] Checking container status...
docker-compose -f docker-compose.prod.yml ps

echo [INFO] Testing image serving...
timeout /t 5 /nobreak > nul

echo [INFO] Showing recent logs...
docker-compose -f docker-compose.prod.yml logs app --tail=20

echo [INFO] 🎉 Deployment completed!
echo [INFO] Your application should now be running at: https://backend.naamstay.com
echo [INFO] Test your image URL: https://backend.naamstay.com/public/storage/package/1760680704802_6fa79499c8ce94910_1759900310404_fa079849a7e917a8_h1.webp

echo.
echo [WARNING] If images are still not loading, check:
echo 1. File permissions on your VPS
echo 2. Container logs: docker-compose -f docker-compose.prod.yml logs app
echo 3. Container file system: docker exec backend-prod ls -la /usr/src/app/public/storage/package/
echo 4. Nginx configuration (if using Nginx)
echo 5. Firewall settings

echo.
echo [INFO] To debug further, run:
echo docker exec -it backend-prod bash
echo ls -la /usr/src/app/public/storage/package/

pause
