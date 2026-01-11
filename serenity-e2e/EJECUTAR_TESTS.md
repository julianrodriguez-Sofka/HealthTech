# Guía para Ejecutar los Tests Serenity BDD

## ✅ Estado Actual

- ✅ Java 17 instalado y configurado
- ✅ Maven Wrapper funcionando
- ✅ Dependencias descargadas
- ✅ Código compilado correctamente
- ⚠️  Ejecución de tests requiere ajustes menores

## 📋 Requisitos Previos

Antes de ejecutar los tests, asegúrate de:

1. **Aplicación corriendo:**
   - Frontend: `http://localhost:3003` (o la URL que uses)
   - Backend: `http://localhost:3000`

2. **Usuarios de prueba existan en la BD:**
   - Enfermero: `ana.garcia@healthtech.com` / `password123`
   - Doctor: `carlos.mendoza@healthtech.com` / `password123`

## 🚀 Ejecutar los Tests

### Opción 1: Ejecutar todos los tests

```powershell
cd F:\HealthTech\serenity-e2e
.\mvnw.cmd clean test serenity:aggregate
```

### Opción 2: Ejecutar solo tests de enfermería

```powershell
cd F:\HealthTech\serenity-e2e
.\mvnw.cmd clean test -Dcucumber.filter.tags="@nurse" serenity:aggregate
```

### Opción 3: Ejecutar solo tests de doctor

```powershell
cd F:\HealthTech\serenity-e2e
.\mvnw.cmd clean test -Dcucumber.filter.tags="@doctor" serenity:aggregate
```

### Opción 4: Ejecutar solo tests críticos

```powershell
cd F:\HealthTech\serenity-e2e
.\mvnw.cmd clean test -Dcucumber.filter.tags="@critical" serenity:aggregate
```

## 📊 Ver Reportes

Después de ejecutar los tests, los reportes se generan en:

```
target/site/serenity/index.html
```

Abre este archivo en tu navegador para ver:
- Resumen de tests ejecutados
- Screenshots de fallos
- Detalles de cada escenario
- Tiempos de ejecución

## ⚙️ Configuración

### Cambiar URL de la aplicación

Edita `src/test/resources/serenity.conf`:

```conf
environments {
    default {
        webdriver.base.url = "http://localhost:3003"  # Ajusta aquí
    }
}
```

### Cambiar navegador

Por defecto usa Chrome. Para cambiar, edita `serenity.conf`:

```conf
webdriver {
    driver = firefox  # o edge, safari, etc.
}
```

## 🔧 Solución de Problemas

### Error: "Type [unknown] not present"

Este error puede ocurrir por incompatibilidad de versiones. Solución:

1. Limpia el proyecto:
   ```powershell
   .\mvnw.cmd clean
   ```

2. Recompila:
   ```powershell
   .\mvnw.cmd compile test-compile
   ```

3. Ejecuta de nuevo:
   ```powershell
   .\mvnw.cmd test serenity:aggregate
   ```

### Error: "No se puede conectar a la aplicación"

- Verifica que el frontend esté corriendo
- Verifica la URL en `serenity.conf`
- Verifica que no haya firewall bloqueando

### Error: "Elemento no encontrado"

- Los selectores pueden necesitar ajuste según tu UI
- Revisa los Page Objects en `src/test/java/com/healthtech/pages/`
- Aumenta los tiempos de espera si es necesario

### Tests no se ejecutan

Si los tests no se ejecutan, verifica:

1. Que el runner esté correcto:
   ```powershell
   # Verificar que CucumberTestRunner.java existe
   ls src\test\java\com\healthtech\runners\CucumberTestRunner.java
   ```

2. Que los feature files existan:
   ```powershell
   ls src\test\resources\features\**\*.feature
   ```

## 📝 Notas Importantes

1. **Primera ejecución**: Puede tardar varios minutos mientras descarga ChromeDriver y otras dependencias

2. **Chrome se abrirá automáticamente**: Los tests abrirán Chrome para ejecutar las pruebas

3. **No cierres Chrome manualmente**: Déjalo que los tests lo controlen

4. **Screenshots**: Se capturan automáticamente en caso de fallos

## 🎯 Próximos Pasos

1. Asegúrate de que la aplicación esté corriendo
2. Ejecuta los tests con uno de los comandos anteriores
3. Revisa los reportes en `target/site/serenity/index.html`
4. Ajusta selectores si es necesario según tu UI

## 📚 Archivos Importantes

- **Feature files**: `src/test/resources/features/`
- **Step Definitions**: `src/test/java/com/healthtech/stepdefinitions/`
- **Page Objects**: `src/test/java/com/healthtech/pages/`
- **Configuración**: `src/test/resources/serenity.conf`
- **Test Runner**: `src/test/java/com/healthtech/runners/CucumberTestRunner.java`

## 💡 Tips

- Ejecuta primero un test simple para verificar que todo funciona
- Revisa los logs en la consola para ver qué está pasando
- Los reportes de Serenity son muy detallados y útiles para debugging
