# HealthTech

Proyecto de gestión de salud desarrollado con TypeScript siguiendo principios SOLID y arquitectura en capas.

## 📋 Descripción

HealthTech es un sistema diseñado para gestionar información y procesos relacionados con el sector de la salud, implementando patrones de diseño modernos y buenas prácticas de desarrollo de software.

## 🏗️ Arquitectura

Este proyecto está estructurado bajo una **Arquitectura de 3 Capas** que garantiza la **Separación de Responsabilidades** y facilita el **Testing**, cumpliendo con los principios SOLID:

### Estructura de Capas

```
HealthTech/
├── domain/                    # Capa de Dominio
├── application/               # Capa de Aplicación
├── infrastructure/            # Capa de Infraestructura
└── tests/                     # Pruebas
```

### 1. **Domain Layer** (Capa de Dominio)

**Responsabilidad:** Contiene la lógica de negocio pura y las entidades del dominio.

```
domain/
├── entities/          # Entidades del negocio
├── value-objects/     # Objetos de valor inmutables
├── repositories/      # Interfaces de repositorios (abstracciones)
└── services/          # Servicios de dominio puros
```

**Principios SOLID aplicados:**
- **SRP (Single Responsibility):** Cada entidad tiene una única razón para cambiar
- **OCP (Open/Closed):** Abierto a extensión, cerrado a modificación
- **DIP (Dependency Inversion):** Define interfaces sin depender de implementaciones concretas

**Ventajas para Testing:**
- ✅ Lógica de negocio aislada, fácil de testear unitariamente
- ✅ Sin dependencias externas (frameworks, bases de datos)
- ✅ Tests rápidos y determinísticos

---

### 2. **Application Layer** (Capa de Aplicación)

**Responsabilidad:** Orquesta los casos de uso y coordina las operaciones entre dominio e infraestructura.

```
application/
├── services/          # Servicios de aplicación (casos de uso)
├── observers/         # Implementación del patrón Observer
└── dtos/              # Data Transfer Objects
```

**Principios SOLID aplicados:**
- **ISP (Interface Segregation):** Interfaces específicas para cada caso de uso
- **DIP (Dependency Inversion):** Depende de abstracciones del dominio
- **LSP (Liskov Substitution):** Los observers pueden ser sustituidos sin afectar el comportamiento

**Ventajas para Testing:**
- ✅ Casos de uso independientes y testeables por separado
- ✅ Fácil mockeo de dependencias mediante inyección de dependencias
- ✅ Patrón Observer permite testing de eventos sin acoplamiento

---

### 3. **Infrastructure Layer** (Capa de Infraestructura)

**Responsabilidad:** Maneja los detalles técnicos de implementación (APIs, CLI, persistencia).

```
infrastructure/
├── api/               # Controladores REST/GraphQL
├── cli/               # Interfaz de línea de comandos
├── persistence/       # Implementaciones de repositorios
└── config/            # Configuraciones y variables de entorno
```

**Principios SOLID aplicados:**
- **DIP (Dependency Inversion):** Implementa las interfaces definidas en el dominio
- **ISP (Interface Segregation):** Adaptadores específicos para cada tecnología
- **SRP (Single Responsibility):** Separación entre entrada (API/CLI) y persistencia

**Ventajas para Testing:**
- ✅ Componentes de infraestructura pueden ser reemplazados por mocks/stubs
- ✅ Testing de integración aislado por tecnología
- ✅ Fácil cambio de proveedores (base de datos, frameworks) sin afectar el negocio

---

## 🧪 Testing Strategy

```
tests/
├── unit/              # Tests unitarios (domain + application)
└── integration/       # Tests de integración (infrastructure)
```

### Beneficios de la Arquitectura en Capas para Testing

| Aspecto | Ventaja |
|---------|---------|
| **Independencia** | Cada capa puede testearse independientemente |
| **Velocidad** | Tests unitarios ultra-rápidos sin I/O |
| **Cobertura** | Fácil alcanzar alta cobertura de código |
| **Mantenibilidad** | Cambios en infraestructura no afectan tests de dominio |
| **Mocking** | Inyección de dependencias facilita el uso de mocks |
| **TDD/BDD** | Estructura ideal para Test-Driven Development |

### Flujo de Testing

1. **Unit Tests (domain/)**: Validar reglas de negocio puras
2. **Unit Tests (application/)**: Validar orquestación de casos de uso
3. **Integration Tests (infrastructure/)**: Validar conexión con sistemas externos

---

## 🚀 Tecnologías

- **Lenguaje:** TypeScript
- **Arquitectura:** 3-Layer Architecture + SOLID
- **Patrones:** Repository, Observer, Dependency Injection

---

## 📦 Instalación

```bash
# Clonar el repositorio
git clone <repository-url>

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
```

---

## 🔧 Uso

```bash
# Desarrollo
npm run dev

# Build
npm run build

# Tests
npm test

# Tests con cobertura
npm run test:coverage
```

---

## 🎯 Principios SOLID en Práctica

| Principio | Implementación |
|-----------|----------------|
| **S**RP | Cada clase/módulo tiene una única responsabilidad |
| **O**CP | Extensible mediante interfaces sin modificar código existente |
| **L**SP | Los subtipos pueden sustituir a sus tipos base |
| **I**SP | Interfaces pequeñas y específicas en lugar de interfaces grandes |
| **D**IP | Dependencias hacia abstracciones, no implementaciones concretas |

---

## 📚 Estructura Detallada

### Domain Layer
- **Entities:** Objetos con identidad única que representan conceptos del negocio
- **Value Objects:** Objetos inmutables sin identidad definidos por sus atributos
- **Repository Interfaces:** Contratos para acceso a datos sin detalles de implementación
- **Domain Services:** Lógica que no pertenece naturalmente a una entidad

### Application Layer
- **Use Cases:** Orquestación de operaciones de dominio
- **DTOs:** Objetos para transferencia de datos entre capas
- **Observers:** Listeners de eventos del sistema

### Infrastructure Layer
- **API Controllers:** Endpoints HTTP/REST
- **CLI Commands:** Comandos de consola
- **Repository Implementations:** Acceso real a bases de datos
- **Config:** Gestión de configuración y secretos

---

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request


