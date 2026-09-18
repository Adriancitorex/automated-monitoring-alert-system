# GUÍA DE CONFIGURACIÓN Y OPERACIÓN DE POSTGRESQL REAL
## AvisaMultas Jalisco

Esta guía describe los pasos para conectar, migrar, validar y operar una base de datos **PostgreSQL administrada externamente** con AvisaMultas Jalisco.

---

## 1. Qué necesitamos

Para conectar el sistema a PostgreSQL real necesitas contar con:

1. **Instancia de PostgreSQL (versión 14 o superior)**:
   - Puede ser un proveedor gestionado en la nube: **Neon, Supabase, Google Cloud SQL, AWS RDS, Render, Railway, DigitalOcean**, etc.
   - O bien un contenedor Docker local de desarrollo (`postgres:16-alpine`).
2. **Cadena de Conexión (`DATABASE_URL`)**:
   - Formato estándar:
     ```text
     postgres://USUARIO:CONTRASEÑA@HOST:PUERTO/NOMBRE_BASE_DATOS?sslmode=require
     ```
3. **Acceso de Red**:
   - Si la base está en la nube, asegúrate de que el firewall o Security Group permita conexiones entrantes desde la IP o rango donde corra la aplicación (o `0.0.0.0/0` con autenticación por contraseña robusta y SSL requerido).

---

## 2. Cómo configurar `DATABASE_URL` y variables de entorno

### En Entornos de Desarrollo Local / Contenedor
1. Crea o edita el archivo `.env` en la raíz del proyecto (nunca lo subas a control de versiones).
2. Agrega la variable con tu URL real:
   ```env
   DATABASE_URL="postgres://tu_usuario:tu_password_seguro@ep-cool-db.us-east-1.aws.neon.tech/neondb?sslmode=require"
   ```

### Variables Opcionales de SSL
El pool de conexiones detecta automáticamente si la URL contiene `sslmode=require` o `ssl=true`, y en modo producción activa SSL por defecto. Si requieres control explícito:

```env
# Forzar SSL habilitado (recomendado para proveedores en la nube como Neon o Supabase)
DATABASE_SSL=true

# Si el proveedor usa certificados proxy / autofirmados y se requiere omitir validación estricta de CA:
DATABASE_SSL_REJECT_UNAUTHORIZED=false

# Para bases de datos locales en Docker sin SSL:
# DATABASE_SSL=false
```

### En AI Studio / Cloud Run
- Configura `DATABASE_URL` mediante el panel de **Settings / Secrets** del entorno. La plataforma inyecta la variable en tiempo de ejecución sin exponerla en el repositorio.

---

## 3. Cómo ejecutar las migraciones (DDL)

El proyecto incluye un script de migración transaccional e idempotente que lee el esquema canónico `src/db/schema.sql`.

### Comando:
```bash
npm run migrate
```

### Qué realiza el script:
1. Verifica la existencia de `DATABASE_URL`.
2. Realiza un `SELECT 1` para comprobar latencia y conectividad.
3. Abre una transacción (`BEGIN`).
4. Aplica las sentencias DDL de `src/db/schema.sql`:
   - Crea las 7 tablas (`usuarios`, `vehiculos`, `suscripciones`, `infracciones`, `revisiones`, `notificaciones`, `auditoria`).
   - Aplica `CREATE TABLE IF NOT EXISTS` y `CREATE INDEX IF NOT EXISTS` (seguro de re-ejecutar sin borrar datos).
   - Aplica llaves foráneas con `ON DELETE RESTRICT`.
   - Configura restricciones de unicidad compuestas para deduplicación (`uq_infraccion_fuente_externa`).
5. Confirma con `COMMIT`. Si algo falla, hace `ROLLBACK` y aborta con código de error.

---

## 4. Cómo verificar la salud con `/api/health`

Una vez configurada la base de datos y ejecutada la aplicación (`npm run dev`), consulta el endpoint de salud:

```bash
curl -s http://localhost:3000/api/health
```

### Respuesta esperada con PostgreSQL conectado (HTTP 200):
```json
{
  "status": "ok",
  "modo": "POSTGRESQL",
  "estadoPostgres": "POSTGRESQL_CONNECTED",
  "cantidadVehiculos": 0,
  "version": "1.0.0",
  "servicio": "AvisaMultas Jalisco - Monitoreo Vehicular",
  "detalles": "PostgreSQL conectado correctamente (latencia 15ms).",
  "timestamp": "2026-09-03T19:00:00.000Z"
}
```

### Comportamiento ante fallas de base de datos (HTTP 503):
Si `DATABASE_URL` existe pero la base de datos está apagada, rechaza la autenticación o no responde al `SELECT 1`:
```json
{
  "status": "degraded",
  "modo": "POSTGRESQL",
  "estadoPostgres": "POSTGRESQL_UNAVAILABLE",
  "cantidadVehiculos": 0,
  "version": "1.0.0",
  "detalles": "DATABASE_URL configurada pero la base de datos no responde a SELECT 1: connect ECONNREFUSED",
  "timestamp": "2026-09-03T19:00:00.000Z"
}
```
> **Nota de Seguridad e Integridad:** El sistema tiene **estrictamente prohibido hacer fallback silencioso a memoria** cuando `DATABASE_URL` está configurada pero inaccesible. Las peticiones de onboarding devolverán error 503 para proteger la consistencia de los datos.

---

## 5. Cómo ejecutar los tests de integración

El proyecto cuenta con dos suites de pruebas separadas:

### 1. Solo Tests de PostgreSQL Real:
```bash
npm run test:postgres
```
- **Sin `DATABASE_URL`:** La suite se marca como `[OMITIDO / SKIPPED]` (no genera falsos positivos).
- **Con `DATABASE_URL`:** Se conecta a PostgreSQL y valida:
  1. Inserción de usuarios con email único.
  2. Cumplimiento de Foreign Keys (`ON DELETE RESTRICT`).
  3. Precisión de moneda `NUMERIC(12, 2)`.
  4. Deduplicación por folio y fuente (`UNIQUE(vehiculo_id, fuente_identificador, identificador_externo)`).
  5. Detección de duplicidad por hecho material.
  6. Bitácora de revisiones y notificaciones.
  7. Inmutabilidad de auditoría.
  8. **Rollback transaccional ante fallos.**

### 2. Suite Completa (Memoria + PostgreSQL):
```bash
npm run test
```
Ejecuta la suite en memoria y la suite de integración en PostgreSQL, mostrando un reporte consolidado.

---

## 6. Cómo destruir / recrear una base de datos de desarrollo

Durante el ciclo de desarrollo o pruebas, si deseas resetear el esquema a un estado completamente limpio:

### Opción A: Mediante CLI `psql`
Conéctate a tu base de datos y ejecuta:
```sql
-- SOLO EN AMBIENTES DE DESARROLLO / TEST
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO public;
```

Luego vuelve a ejecutar las migraciones:
```bash
npm run migrate
```

### Opción B: Contenedor Docker Local
Si usas Docker localmente:
```bash
# Detener y borrar volumen
docker rm -f avisamultas-postgres
docker volume rm avisamultas-pgdata

# Iniciar contenedor nuevo
docker run --name avisamultas-postgres \
  -e POSTGRES_USER=app_user \
  -e POSTGRES_PASSWORD=app_pass \
  -e POSTGRES_DB=avisamultas_db \
  -p 5432:5432 \
  -v avisamultas-pgdata:/var/lib/postgresql/data \
  -d postgres:16-alpine

# Aplicar migraciones
DATABASE_URL="postgres://app_user:app_pass@localhost:5432/avisamultas_db?sslmode=disable" npm run migrate
```

---

## 7. Buenas prácticas para no subir secretos al repositorio

1. **Archivo `.gitignore`**:
   - Comprueba siempre que `.env`, `.env.local`, `.env.production` y cualquier archivo con credenciales esté listado en `.gitignore`.
2. **Plantilla `.env.example`**:
   - Mantén `.env.example` actualizado únicamente con los nombres de las variables sin valores reales:
     ```env
     DATABASE_URL=
     ADMIN_SECRET_KEY=
     ```
3. **Prohibido Hardcodear Credenciales**:
   - Nunca escribas contraseñas, tokens de WhatsApp ni cadenas de conexión dentro de archivos `.ts`, `.js`, `.json` ni `.sql`.
4. **Validación Pre-Commit**:
   - Antes de realizar un commit, revisa con `git status` y `git diff` que no se incluyan cadenas sensibles.
