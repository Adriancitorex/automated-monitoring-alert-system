# ARQUITECTURA DE PERSISTENCIA - AVISAMULTAS JALISCO

Este documento detalla el diseño de almacenamiento, integridad referencial, transacciones, privacidad y políticas de resiliencia del sistema.

---

## 1. Modos de Persistencia: Memoria vs. PostgreSQL

La aplicación implementa un patrón de Repositorio desacoplado mediante una Fábrica de Repositorios (`src/db/repositoriesFactory.ts`).

### A. Modo Demostración (`DEMO_MEMORY`)
- **Condición de activación:** La variable de entorno `DATABASE_URL` no está definida o se encuentra vacía.
- **Comportamiento:**
  - Los datos se almacenan en una instancia en memoria volátil (`MemoryStore`).
  - Se precargan datos iniciales legibles de prueba a través de `src/db/seeds/demoSeed.ts`.
  - Soporta atomicidad en onboarding mediante snapshots y rollback explícito.
  - Diseñado exclusivamente para desarrollo local rápido y demostraciones sin dependencias de infraestructura.

### B. Modo Producción (`POSTGRESQL`)
- **Condición de activación:** La variable `DATABASE_URL` está presente en el entorno con una cadena de conexión válida.
- **Comportamiento:**
  - Se inicializa el pool de conexiones (`pg.Pool`) con límites controlados (máx 10 clientes, timeouts de inactividad).
  - Toda la persistencia es durable sobre tablas relacionales creadas a partir de `src/db/schema.sql`.
  - El endpoint `/api/health` verifica la conectividad ejecutando una consulta explícita `SELECT 1`.

---

## 2. Regla de Oro: Prohibición de Fallback Silencioso

> ⚠️ **REGLA CRÍTICA DE INFRAESTRUCTURA:**
> Si `DATABASE_URL` existe pero la base de datos PostgreSQL no responde, rechaza la conexión o falla el `SELECT 1`, **EL SISTEMA TIENE ESTRICTAMENTE PROHIBIDO HACER UN FALLBACK A MEMORIA**.

### Justificación:
En un SaaS de producción de monitoreo vehicular, un fallback silencioso a memoria causaría que los usuarios se registren y paguen mientras sus vehículos se guardan en memoria volátil. Cualquier reinicio de contenedor destruiría los datos, perdiendo mandatos y pagos de clientes.

### Comportamiento ante fallos:
- El estado de la base se marca como `POSTGRESQL_UNAVAILABLE`.
- El endpoint `/api/health` retorna código HTTP **503 Service Unavailable** y detalla el incidente.
- Las solicitudes de onboarding y registro de infracciones se abortan inmediatamente con error 503 ("Infraestructura no disponible temporalmente"), alertando a los operadores y evitando corrupción o pérdida de datos.

---

## 3. Modelo de Integridad Referencial y Foreign Keys

El esquema (`src/db/schema.sql`) protege la trazabilidad legal y financiera mediante relaciones estrictas:

```text
usuarios
  └── vehiculos (ON DELETE RESTRICT)
        ├── suscripciones (ON DELETE RESTRICT)
        ├── infracciones (ON DELETE RESTRICT)
        │     └── notificaciones (ON DELETE RESTRICT)
        └── revisiones (ON DELETE RESTRICT)
```

- **`ON DELETE RESTRICT`:** Ningún registro de usuario o vehículo puede ser borrado si cuenta con historial de suscripciones, revisiones, infracciones o notificaciones. Esto garantiza que nunca se elimine evidencia histórica de consultas oficiales o alertas de WhatsApp enviadas.
- **Tipos Monetarios `NUMERIC(12, 2)`:** Todos los montos financieros (`monto_plan_mxn`, `monto_original_mxn`, `monto_vigente_mxn`, `descuento_vigente_mxn`) se definen como `NUMERIC` de precisión fija. Se prohíbe el uso de tipos de coma flotante (`FLOAT` / `REAL`) en la base de datos para evitar desajustes por redondeo binario.

---

## 4. Transacciones Atómicas (Cero Huérfanos)

El proceso de Onboarding (`/api/onboarding`) realiza múltiples inserciones vinculadas:
1. Verificación de placa no registrada (`SELECT ... WHERE placa = $1`).
2. Creación o vinculación de usuario.
3. Creación del vehículo vinculado al usuario.
4. Creación de la suscripción vinculada en estado `PENDIENTE_PAGO`.
5. Registro de la revisión inicial en la bitácora.
6. Registro inmutable del evento en la tabla `auditoria`.

### Garantía de Atomicidad:
- **En PostgreSQL:** Todo el bloque se ejecuta dentro de `BEGIN ... COMMIT` a través de un único cliente transaccional (`withTransaction`). Si cualquier paso falla (por ejemplo, placa duplicada o fallo de red), se dispara inmediatamente un `ROLLBACK`. No pueden quedar usuarios sin vehículos ni vehículos sin suscripción.
- **En Memoria:** Se toma un snapshot previo del estado; ante cualquier excepción, se restaura el snapshot original.

---

## 5. Deduplicación Multivariada de Infracciones

El sistema no asume un proveedor único ni depende de un formato de folio exclusivo:
1. **Unicidad por Fuente y Folio Externo:**
   - Restricción compuesta: `UNIQUE(vehiculo_id, fuente_identificador, identificador_externo)`
   - Admite diversos namespaces: `JALISCO_SHP_FOLIO`, `GDL_PARQUIMETRO`, `FEDERAL_SICT`, etc.
2. **Deduplicación por Hecho Material:**
   - Se calcula un hash auxiliar sobre `(vehiculoId + fechaInfraccion + conceptoNormalizado)`.
   - Si una autoridad emite un folio provisorio y luego uno definitivo sobre el mismo hecho material en la misma fecha, el motor de deduplicación lo detecta antes de registrarlo.

---

## 6. Privacidad de Datos y Sanitización de Respuestas

Siguiendo principios de privacidad por diseño:
- **Endpoint del Portal del Conductor (`/api/vehiculo/estado/:placa`):**
  - Devuelve únicamente información indispensable para el usuario: placa, alias, estado de suscripción, fechas de revisión y lista de multas oficiales.
  - **Excluye deliberadamente:** los 5 dígitos del número de serie (VIN), teléfonos, IPs de origen y metadatos de auditoría interna.
- **Panel Administrativo (`/api/admin/*`):**
  - Requiere autenticación estricta con cabecera `x-admin-key` vinculada a `ADMIN_SECRET_KEY`.
  - Permite acceso a datos completos únicamente a personal autorizado.

---

## 7. Guía Operativa: Migraciones y Tests

### Ejecutar Migraciones en PostgreSQL
Para aplicar el esquema DDL `src/db/schema.sql` sobre la base de datos configurada en `DATABASE_URL`:
```bash
npm run migrate
```
El script verifica la conexión, inicia una transacción, ejecuta las sentencias DDL y confirma la aplicación exitosa.

### Ejecutar Tests Unitarios (En Memoria)
```bash
npm run test:memory
```
Verifica la lógica de negocio, validaciones de FK en memoria, deduplicación de namespaces y rollback transaccional.

### Ejecutar Tests de Integración Reales (PostgreSQL)
```bash
npm run test:postgres
```
- Si `DATABASE_URL` **no está configurada**, el test se marca automáticamente como **`OMITIDO (SKIPPED)`** para evitar falsos positivos o bloqueos en entornos sin base de datos provisionada.
- Si `DATABASE_URL` **está configurada**, prueba sobre PostgreSQL real la creación de registros, restricciones `UNIQUE`, violación de `FOREIGN KEY`, inserción con `NUMERIC` y `ROLLBACK` forzado de transacciones.

### Ejecutar Toda la Suite de Pruebas
```bash
npm run test
```
Ejecuta de forma secuencial los tests de memoria y los tests de integración con resumen consolidado.
