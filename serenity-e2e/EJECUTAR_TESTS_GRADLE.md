# Guía para Ejecutar los Tests con Gradle

## ✅ Migración Completada

El proyecto ha sido migrado de Maven a Gradle para resolver problemas de compatibilidad.

## 🚀 Ejecutar los Tests

### Opción 1: Ejecutar todos los tests

```powershell
cd F:\HealthTech\serenity-e2e
.\gradlew.bat clean test aggregate
```

### Opción 2: Ejecutar solo tests de enfermería

```powershell
.\gradlew.bat clean test aggregate -Dcucumber.filter.tags="@nurse"
```

### Opción 3: Ejecutar solo tests de doctor

```powershell
.\gradlew.bat clean test aggregate -Dcucumber.filter.tags="@doctor"
```

### Opción 4: Ejecutar solo tests críticos

```powershell
.\gradlew.bat clean test aggregate -Dcucumber.filter.tags="@critical"
```

## 📊 Ver Reportes

Después de ejecutar los tests, los reportes se generan en:

```
build/reports/serenity/index.html
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

## 🔧 Comandos Útiles

### Limpiar proyecto
```powershell
.\gradlew.bat clean
```

### Compilar sin ejecutar tests
```powershell
.\gradlew.bat compileJava compileTestJava
```

### Ver dependencias
```powershell
.\gradlew.bat dependencies
```

### Ejecutar tests con más información
```powershell
.\gradlew.bat test aggregate --info
```

## 📋 Requisitos Previos

Antes de ejecutar los tests, asegúrate de:

1. **Aplicación corriendo:**
   - Frontend: `http://localhost:3003`
   - Backend: `http://localhost:3000`

2. **Usuarios de prueba existan en la BD:**
   - Enfermero: `ana.garcia@healthtech.com` / `password123`
   - Doctor: `carlos.mendoza@healthtech.com` / `password123`

## 🎯 Primera Ejecución

La primera vez que ejecutes `.\gradlew.bat`, Gradle descargará automáticamente:
- Gradle 8.5
- Todas las dependencias del proyecto
- ChromeDriver (si es necesario)

Esto puede tardar varios minutos. Las siguientes ejecuciones serán más rápidas.

## 💡 Ventajas de Gradle sobre Maven

- ✅ Mejor manejo de compatibilidades
- ✅ Builds más rápidos
- ✅ Mejor resolución de dependencias
- ✅ Scripts más flexibles
- ✅ No requiere instalación (usa Gradle Wrapper)

## 📚 Archivos Importantes

- **build.gradle**: Configuración de Gradle y dependencias
- **settings.gradle**: Configuración del proyecto
- **gradlew.bat**: Script para Windows
- **gradlew**: Script para Unix/Linux
- **gradle/wrapper/**: Archivos del Gradle Wrapper

## 🔍 Solución de Problemas

### Error: "Gradle no se reconoce"

El proyecto usa Gradle Wrapper, no necesitas instalar Gradle. Usa:
```powershell
.\gradlew.bat
```

### Error: "No se puede conectar a la aplicación"

- Verifica que el frontend esté corriendo en `http://localhost:3003`
- Verifica la URL en `serenity.conf`
- Verifica que no haya firewall bloqueando

### Error: "Elemento no encontrado"

- Los selectores pueden necesitar ajuste según tu UI
- Revisa los Page Objects en `src/test/java/com/healthtech/pages/`
- Aumenta los tiempos de espera si es necesario

## 📝 Notas Importantes

1. **Primera ejecución**: Puede tardar varios minutos mientras descarga Gradle y dependencias

2. **Chrome se abrirá automáticamente**: Los tests abrirán Chrome para ejecutar las pruebas

3. **No cierres Chrome manualmente**: Déjalo que los tests lo controlen

4. **Screenshots**: Se capturan automáticamente en caso de fallos
