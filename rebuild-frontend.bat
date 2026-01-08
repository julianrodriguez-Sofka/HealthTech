@echo off
echo ========================================
echo Reconstruyendo Frontend en Docker
echo ========================================
echo.

echo [1/5] Verificando Docker...
docker info >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker no esta disponible
    echo Por favor reinicia Docker Desktop y espera a que este listo
    pause
    exit /b 1
)
echo OK - Docker esta listo

echo.
echo [2/5] Deteniendo contenedor frontend...
docker stop healthtech-frontend 2>nul
docker rm healthtech-frontend 2>nul
echo OK - Contenedor detenido

echo.
echo [3/5] Reconstruyendo imagen (sin cache)...
docker-compose build --no-cache frontend
if errorlevel 1 (
    echo ERROR al construir imagen
    pause
    exit /b 1
)
echo OK - Imagen construida

echo.
echo [4/5] Iniciando contenedor...
docker-compose up -d frontend
if errorlevel 1 (
    echo ERROR al iniciar contenedor
    pause
    exit /b 1
)
echo OK - Contenedor iniciado

echo.
echo [5/5] Esperando 20 segundos para que Vite inicie...
timeout /t 20 /nobreak

echo.
echo ========================================
echo Logs del contenedor:
echo ========================================
docker logs healthtech-frontend --tail 40

echo.
echo ========================================
echo Verificacion final:
echo ========================================
docker ps --filter "name=frontend"

echo.
echo ========================================
echo LISTO! Accede a: http://localhost:3003
echo ========================================
pause
