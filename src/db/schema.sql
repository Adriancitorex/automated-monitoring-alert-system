-- ====================================================================
-- ESQUEMA DE BASE DE DATOS POSTGRESQL - AVISAMULTAS JALISCO
-- ====================================================================
-- Reglas de integridad:
-- 1. FOREIGN KEYS con ON DELETE RESTRICT para proteger datos históricos.
-- 2. NUMERIC(12, 2) para importes monetarios (evitar floats).
-- 3. Restricciones UNIQUE compuestas para deduplicación estricta.
-- 4. Soporte multivariado de fuentes de identificador.
-- ====================================================================

-- 1. TABLA DE USUARIOS (Clientes y Titulares de Mandato)
CREATE TABLE IF NOT EXISTS usuarios (
  id VARCHAR(64) PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  telefono_whatsapp VARCHAR(32) NOT NULL,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. TABLA DE VEHÍCULOS (Objetos de Monitoreo)
CREATE TABLE IF NOT EXISTS vehiculos (
  id VARCHAR(64) PRIMARY KEY,
  usuario_id VARCHAR(64) NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
  placa VARCHAR(16) NOT NULL UNIQUE,
  numero_serie_5 VARCHAR(10) NOT NULL,
  alias VARCHAR(128),
  estado_suscripcion VARCHAR(32) NOT NULL DEFAULT 'PENDIENTE_PAGO',
  plan VARCHAR(32) NOT NULL DEFAULT 'MENSUAL_BASICO',
  monto_plan_mxn NUMERIC(12, 2) NOT NULL DEFAULT 99.00,
  ultima_revision_en TIMESTAMPTZ,
  proxima_revision_estimada_en TIMESTAMPTZ,
  total_multas_registradas INTEGER NOT NULL DEFAULT 0,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vehiculos_usuario ON vehiculos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_vehiculos_placa ON vehiculos(placa);

-- 3. TABLA DE SUSCRIPCIONES (Facturación y Ciclo de Vida)
CREATE TABLE IF NOT EXISTS suscripciones (
  id VARCHAR(64) PRIMARY KEY,
  usuario_id VARCHAR(64) NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
  vehiculo_id VARCHAR(64) NOT NULL REFERENCES vehiculos(id) ON DELETE RESTRICT,
  plan VARCHAR(32) NOT NULL,
  monto_mxn NUMERIC(12, 2) NOT NULL,
  estado VARCHAR(32) NOT NULL DEFAULT 'PENDIENTE_PAGO',
  periodo_inicio TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  periodo_fin TIMESTAMPTZ,
  pasarela_pago_id VARCHAR(128),
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_suscripciones_vehiculo ON suscripciones(vehiculo_id);

-- 4. TABLA DE INFRACCIONES (Datos Canónicos de Multas y Fotoinfracciones)
CREATE TABLE IF NOT EXISTS infracciones (
  id_interno VARCHAR(64) PRIMARY KEY,
  vehiculo_id VARCHAR(64) NOT NULL REFERENCES vehiculos(id) ON DELETE RESTRICT,
  placa VARCHAR(16) NOT NULL,
  identificador_externo VARCHAR(128) NOT NULL,
  fuente_identificador VARCHAR(64) NOT NULL,
  
  fecha_infraccion DATE NOT NULL,
  fecha_notificacion DATE,
  fecha_consulta TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  concepto TEXT NOT NULL,
  tipo_infraccion VARCHAR(64) NOT NULL,
  autoridad VARCHAR(64) NOT NULL,
  
  monto_original_mxn NUMERIC(12, 2) NOT NULL,
  monto_vigente_mxn NUMERIC(12, 2) NOT NULL,
  recargos_mxn NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  gastos_ejecucion_mxn NUMERIC(12, 2) DEFAULT 0.00,
  
  descuento_vigente_mxn NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  porcentaje_descuento NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
  fecha_limite_descuento DATE,
  nivel_confianza_descuento VARCHAR(32) NOT NULL DEFAULT 'UNKNOWN',
  regla_descuento_aplicada TEXT,
  
  url_oficial_pago TEXT,
  fuente_dato VARCHAR(32) NOT NULL DEFAULT 'MANUAL',
  hash_auxiliar VARCHAR(64) NOT NULL,
  
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Restricción estricta de no duplicidad por identificador oficial de la fuente emisora
  CONSTRAINT uq_infraccion_fuente_externa UNIQUE(vehiculo_id, fuente_identificador, identificador_externo)
);

CREATE INDEX IF NOT EXISTS idx_infracciones_vehiculo ON infracciones(vehiculo_id);
CREATE INDEX IF NOT EXISTS idx_infracciones_placa ON infracciones(placa);
CREATE INDEX IF NOT EXISTS idx_infracciones_material ON infracciones(vehiculo_id, fecha_infraccion);

-- 5. TABLA DE REVISIONES Y CONSULTAS (Registro de Auditoría de Verificaciones)
CREATE TABLE IF NOT EXISTS revisiones (
  id VARCHAR(64) PRIMARY KEY,
  vehiculo_id VARCHAR(64) NOT NULL REFERENCES vehiculos(id) ON DELETE RESTRICT,
  placa VARCHAR(16) NOT NULL,
  resultado VARCHAR(64) NOT NULL,
  observaciones TEXT NOT NULL,
  fecha_revision TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_revisiones_vehiculo ON revisiones(vehiculo_id);

-- 6. TABLA DE NOTIFICACIONES (Alertas enviadas al usuario)
CREATE TABLE IF NOT EXISTS notificaciones (
  id VARCHAR(64) PRIMARY KEY,
  infraccion_id VARCHAR(64) REFERENCES infracciones(id_interno) ON DELETE RESTRICT,
  vehiculo_id VARCHAR(64) NOT NULL REFERENCES vehiculos(id) ON DELETE RESTRICT,
  placa VARCHAR(16) NOT NULL,
  telefono_destino VARCHAR(32) NOT NULL,
  canal VARCHAR(32) NOT NULL DEFAULT 'WHATSAPP',
  mensaje TEXT NOT NULL,
  estado VARCHAR(32) NOT NULL DEFAULT 'PENDIENTE',
  proveedor_msg_id VARCHAR(128),
  enviado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notificaciones_vehiculo ON notificaciones(vehiculo_id);

-- 7. TABLA DE AUDITORÍA GENERAL DEL SISTEMA (Inmutable)
CREATE TABLE IF NOT EXISTS auditoria (
  id VARCHAR(64) PRIMARY KEY,
  tipo VARCHAR(64) NOT NULL,
  entidad_id VARCHAR(64),
  usuario_id VARCHAR(64),
  vehiculo_id VARCHAR(64),
  ip_origen VARCHAR(64),
  detalles JSONB NOT NULL DEFAULT '{}'::jsonb,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auditoria_timestamp ON auditoria(timestamp DESC);

-- ====================================================================
-- 8. POLÍTICAS DE SEGURIDAD Y PROTECCIÓN DE DATOS (RLS)
-- ====================================================================
-- Avisamultas Jalisco opera exclusivamente con acceso backend autenticado
-- mediante conexión directa (DATABASE_URL con rol postgres/service_role).
-- Las tablas NUNCA deben exponerse directamente a clientes anónimos ('anon')
-- ni a usuarios autenticados directos de Supabase ('authenticated').

ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehiculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE suscripciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE infracciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE revisiones ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE auditoria ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON TABLE usuarios, vehiculos, suscripciones, infracciones, revisiones, notificaciones, auditoria FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON TABLE usuarios, vehiculos, suscripciones, infracciones, revisiones, notificaciones, auditoria FROM authenticated;
  END IF;
END
$$;
