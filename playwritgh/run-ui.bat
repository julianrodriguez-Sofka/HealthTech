@echo off
echo ====================================
echo Ejecutando Playwright UI
echo ====================================
echo.
echo Esto abrira la interfaz grafica de Playwright
echo donde podras ver y ejecutar todos los tests
echo.
pause
cd /d %~dp0
npx playwright test --ui
