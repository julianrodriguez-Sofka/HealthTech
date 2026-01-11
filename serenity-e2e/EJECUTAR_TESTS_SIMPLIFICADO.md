# Ejecutar Tests Serenity - Guía Simplificada

## ✅ Estado Actual

- ✅ Proyecto migrado a Gradle
- ✅ Step definitions corregidas (sin duplicaciones)
- ✅ Frontend configurado en puerto 3003
- ⚠️ Tests compilan pero requieren ajustes menores

## 🚀 Cómo Ejecutar

### Opción 1: Ejecutar todos los tests

```powershell
cd F:\HealthTech\serenity-e2e
.\gradlew.bat clean test --no-daemon
```

### Opción 2: Ejecutar con más información

```powershell
.\gradlew.bat clean test --no-daemon --info
```

### Opción 3: Ver reportes

Después de ejecutar, los reportes están en:
```
build/reports/tests/test/index.html
```

## 🔧 Problemas Conocidos y Soluciones

### Error: "StoppedByUserException"

Este error generalmente indica que:
1. Hay pasos en los feature files que no tienen step definitions
2. Hay problemas de conexión con el frontend
3. Hay errores en los Page Objects

**Solución:**
1. Verifica que el frontend esté corriendo en `http://localhost:3003`
2. Revisa el reporte HTML para ver qué pasos específicos están fallando
3. Asegúrate de que todos los Page Objects estén implementados

### Error: "DuplicateStepDefinitionException"

Ya resuelto. Si aparece de nuevo:
- Verifica que no haya métodos con la misma anotación en diferentes clases

## 📝 Próximos Pasos

1. **Verificar frontend**: Asegúrate de que esté corriendo
2. **Ejecutar tests**: Usa `.\gradlew.bat clean test --no-daemon`
3. **Revisar reportes**: Abre `build/reports/tests/test/index.html`
4. **Ajustar según errores**: Corrige los pasos que falten o los Page Objects que tengan problemas

## 💡 Tips

- Usa `--info` para ver más detalles de la ejecución
- Los reportes HTML tienen información detallada sobre qué falló
- Verifica que los usuarios de prueba existan en la BD
