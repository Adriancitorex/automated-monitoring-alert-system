# REGLAS DEL PROYECTO — AVISAMULTAS JALISCO

- Este proyecto es propiedad de un único desarrollador.
- El usuario final nunca tendrá acceso al código fuente.
- Antes de realizar cambios importantes, analiza primero el proyecto existente.
- No elimines archivos ni reestructures partes importantes sin explicar primero el motivo.
- No inventes APIs, endpoints, datos oficiales ni información legal.
- Nunca pongas API keys, contraseñas o secretos dentro del código.
- Usa variables de entorno para secretos.
- Mantén frontend y backend separados cuando corresponda.
- Prioriza seguridad, mantenibilidad y simplicidad.
- No agregues dependencias innecesarias.
- Después de modificar código, ejecuta las pruebas correspondientes.
- Si encuentras un error, intenta diagnosticar su causa antes de aplicar cambios.
- Mantén compatibilidad con las decisiones arquitectónicas ya tomadas.
- Cuando una decisión tenga impacto importante en producción, explícala antes de ejecutarla.

# FORMA DE TRABAJAR

Antes de implementar una funcionalidad:

1. Inspecciona el proyecto actual.
2. Identifica los archivos relevantes.
3. Explica brevemente qué vas a modificar.
4. Implementa los cambios.
5. Ejecuta las pruebas necesarias.
6. Comprueba que no hayas roto funcionalidades existentes.
7. Resume qué cambió.

# CONCEPTO DEL NEGOCIO

Servicio de suscripción automatizado de monitoreo de multas vehiculares en México, comenzando por Jalisco:
**REGISTRARSE → REGISTRAR VEHÍCULO → PAGAR → EL SISTEMA HACE TODO AUTOMÁTICAMENTE**

El servicio monitorea periódicamente la fuente oficial de Jalisco y alerta por WhatsApp al usuario en cuanto detecta una nueva infracción para aprovechar beneficios y descuentos legales por pronto pago (hasta 50%).

# REGLA FUNDAMENTAL DE DATOS Y AUTOMATIZACIÓN

- No inventar APIs, endpoints, descuentos, campos de respuesta, procedimientos gubernamentales ni capacidades técnicas.
- Cuando algo no esté confirmado, marcarlo explícitamente como NO VERIFICADO.
- Prohibido diseñar o implementar soluciones que dependan de:
  - Evadir CAPTCHA.
  - Saltarse sistemas de seguridad o anti-bot.
  - Manipular mecanismos de protección o acceder por vulnerabilidades.
  - Evadir bloqueos de red o saltarse autenticación.
  - Incumplir términos de uso o condiciones legales de portales oficiales.
