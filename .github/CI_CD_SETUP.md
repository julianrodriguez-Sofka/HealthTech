# 🔧 CI/CD Setup Guide

Guía para configurar el pipeline de CI/CD con SonarCloud y GitHub Actions.

## 📋 Prerequisitos

1. Repositorio en GitHub
2. Cuenta en [SonarCloud](https://sonarcloud.io/)
3. Permisos de administrador en el repositorio

---

## 🔐 Configurar Secrets de GitHub

### 1. SONAR_TOKEN

1. Ir a [SonarCloud](https://sonarcloud.io/) → My Account → Security
2. Generar un nuevo token con nombre: `github-actions-healthtech`
3. Copiar el token generado
4. En GitHub: Settings → Secrets and variables → Actions → New repository secret
5. Nombre: `SONAR_TOKEN`
6. Valor: (pegar el token)

### 2. GITHUB_TOKEN

Este token se genera automáticamente por GitHub Actions. No requiere configuración manual.

---

## 📊 Configurar SonarCloud

### 1. Importar Proyecto

1. Ir a [SonarCloud](https://sonarcloud.io/)
2. Click en "+" → "Analyze new project"
3. Seleccionar el repositorio `HealthTech`
4. Elegir "GitHub Actions" como método de análisis

### 2. Verificar Configuración

Asegurar que `sonar-project.properties` tenga:

```properties
sonar.organization=julianrodriguez-sofka
sonar.projectKey=julianrodriguez-Sofka_HealthTech
```

### 3. Configurar Quality Gate

En SonarCloud → Project Settings → Quality Gates:

| Métrica | Condición | Valor |
|---------|-----------|-------|
| Coverage on New Code | is less than | 70% |
| Duplicated Lines on New Code | is greater than | 3% |
| Maintainability Rating | is worse than | A |
| Reliability Rating | is worse than | A |
| Security Rating | is worse than | A |

---

## 🛡️ Configurar Branch Protection

En GitHub: Settings → Branches → Add rule

### Para `main`:

- [x] Require a pull request before merging
- [x] Require approvals: 1
- [x] Require status checks to pass before merging
  - [x] `🔐 PR Validation` (required)
  - [x] `📊 SonarCloud Analysis` (required)
- [x] Require branches to be up to date before merging
- [x] Do not allow bypassing the above settings

### Para `develop`:

- [x] Require status checks to pass before merging
  - [x] `🔐 PR Validation` (required)
- [ ] Require approvals (opcional)

---

## 🔄 Workflows Disponibles

### 1. CI Quality Gate (`ci.yml`)

Se ejecuta en: Push y PR a `main`/`develop`

| Job | Descripción |
|-----|-------------|
| 🔍 Lint | ESLint code style |
| 🔨 Build | TypeScript compilation |
| 🧪 Unit Tests | Jest con coverage |
| 📊 SonarCloud | Análisis de calidad |
| ✅ Quality Gate | Verificación final |
| 📝 PR Summary | Comentario en PR |

### 2. PR Check (`pr-check.yml`)

Se ejecuta en: PRs a `main`/`develop`

Validación mínima requerida para aprobar PRs:
- Lint
- Build
- Tests con coverage

---

## 🚀 Comandos Locales

```bash
# Ejecutar lint
npm run lint

# Ejecutar tests con coverage
npm run test:coverage

# Build del proyecto
npm run build

# Ver reporte de coverage
open coverage/lcov-report/index.html
```

---

## 📈 Métricas de Calidad

### Cobertura Mínima: 70%

```bash
# Verificar cobertura local
npm run test:coverage

# Output esperado:
# Statements: >70%
# Branches: >70%
# Functions: >70%
# Lines: >70%
```

### Lint: 0 Errores

```bash
npm run lint
# Debe completar sin errores
```

---

## 🔍 Troubleshooting

### Error: SONAR_TOKEN not set

```
Error: SONAR_TOKEN is not set
```

**Solución**: Agregar el secret `SONAR_TOKEN` en GitHub Settings → Secrets

### Error: Project not found in SonarCloud

```
Project 'julianrodriguez-Sofka_HealthTech' not found
```

**Solución**: Verificar que:
1. El proyecto existe en SonarCloud
2. `sonar.projectKey` coincide exactamente
3. `sonar.organization` es correcta

### Error: Coverage report not found

```
WARN: No coverage report found
```

**Solución**: Asegurar que se ejecute `npm run test:coverage` antes del análisis

---

## 📝 Checklist de Configuración

- [ ] Secret `SONAR_TOKEN` configurado
- [ ] Proyecto importado en SonarCloud
- [ ] Quality Gate configurado
- [ ] Branch protection activada en `main`
- [ ] Workflows ejecutan correctamente
- [ ] PR muestra status checks

---

## 🔗 Links Útiles

- [SonarCloud Dashboard](https://sonarcloud.io/project/overview?id=julianrodriguez-Sofka_HealthTech)
- [GitHub Actions](../../actions)
- [Branch Protection Rules](../../settings/branches)
- [Repository Secrets](../../settings/secrets/actions)
