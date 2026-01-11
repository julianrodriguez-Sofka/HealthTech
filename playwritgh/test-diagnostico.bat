@echo off
echo ========================================
echo DIAGNOSTICO DE TESTS DE PLAYWRIGHT
echo ========================================
echo.

cd /d %~dp0

echo [1/5] Verificando Node.js...
node --version
if errorlevel 1 (
    echo ERROR: Node.js no esta instalado
    exit /b 1
)
echo.

echo [2/5] Verificando Playwright...
npx playwright --version
if errorlevel 1 (
    echo ERROR: Playwright no esta instalado
    exit /b 1
)
echo.

echo [3/5] Verificando archivos de test...
dir /s /b tests\*.spec.ts
echo.

echo [4/5] Verificando que Playwright puede listar los tests...
npx playwright test --list
echo.

echo [5/5] Intentando abrir UI...
echo.
echo Si los tests fueron listados correctamente arriba, ahora se abrira la UI.
echo Presiona Ctrl+C para cancelar.
echo.
timeout /t 3
npx playwright test --ui
