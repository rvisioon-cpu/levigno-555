# Plan de integración con Sperant API v3

## Validación inicial

- El mensaje recibido coincide con la documentación oficial: hay entorno de prueba, autenticación con API Key, consumo exclusivamente desde backend, solicitudes JSON y validación en vivo antes de habilitar producción.
- Base de prueba documentada: `https://api.eterniasoft.com`; base de producción: `https://api.sperant.com`.
- La creación de leads/clientes se realiza mediante `POST /v3/clients`. Requiere nombres (`fname`), canal de entrada (`input_channel_id`), medio de captación (`source_id`) y nivel de interés (`interest_type_id`). El proyecto (`project_id`) aparece como opcional en la referencia del endpoint, pero la documentación de Sperant advierte que el proyecto debe enviarse para registrar correctamente clientes; confirmar para este entorno y tratarlo como requisito.
- Sperant evita duplicados por DNI, email o celular: puede actualizar campos permitidos en vez de crear un registro nuevo. La respuesta de éxito no debe interpretarse siempre como “lead nuevo”.
- La documentación señala que un cliente nuevo genera interacción y correos automáticos de bienvenida/asignación. Revisar esto en demo para evitar mensajes o notificaciones duplicadas junto con el correo que hoy envía el sitio.
- El contacto actual por `/api/send-email` solo envía correo. El modal de consulta de unidad simula éxito y no persiste ni envía la consulta. La agenda usa un flujo propio de prospectos/citas y debe decidirse si también se enviará al CRM.
- La API tiene límite documentado de 15 solicitudes por segundo.

## Plan de trabajo

### 1. Cerrar contrato y configuración CRM

- Confirmar con Santa Cruz/Sperant los IDs y valores habilitados para proyecto Livigno 555, canal de entrada, medio de captación y nivel de interés.
- Confirmar documentos admitidos (DNI/RUC/CE), campos opcionales/extra_fields, tratamiento de consentimiento y qué datos actualiza Sperant al encontrar coincidencia.
- Verificar si las citas deben crear lead, interacción o evento en Sperant, y si las consultas de unidad requieren `unit_id` u otro campo extra.
- Confirmar qué endpoint(s) de lectura se necesitan para obtener IDs; evitar valores hardcodeados hasta obtener la configuración de demo.

### 2. Diseñar el mapeo y el manejo de datos

- Mapear formulario: nombres y apellidos, email, celular, tipo/número de documento, proyecto, unidad, mensaje, preferencia/horario y consentimientos.
- No enviar un dato personal a un campo distinto por conveniencia. Confirmar qué campos admite realmente el endpoint; usar `observation` o `extra_fields` solo con nombres acordados con Sperant.
- Definir respuesta al usuario para éxito, error recuperable y error de validación; conservar el envío de correo solo si Santa Cruz lo requiere.
- Definir idempotencia/reintentos y registro técnico sin guardar token ni exponer datos personales innecesarios.

### 3. Implementar el adaptador backend

- Crear un módulo servidor para Sperant y una ruta propia del sitio que valide y normalice el payload.
- Guardar token y base URL en secretos de servidor/Cloudflare, nunca en el cliente ni en variables `NEXT_PUBLIC_*`.
- Enviar HTTPS + JSON con el header `Authorization` requerido por Sperant, según el formato exacto de la documentación/confirmación de soporte.
- Traducir la respuesta y errores de Sperant a respuestas estables del sitio; no devolver token, payload sensible ni errores internos al navegador.
- Integrar los formularios reales acordados, empezando por `/contact` y el modal de solicitud de información de unidad. Incluir el modal de consulta y agenda solo según alcance confirmado.

### 4. Probar en demo y preparar validación

- Probar desde el formulario real desplegado en el entorno de prueba; no usar Postman/Insomnia como evidencia de aceptación, conforme a la instrucción de Sperant.
- Cubrir lead nuevo, coincidencia por email/documento/celular, campos opcionales, DNI/RUC/CE, error de campos/IDs, timeout y reintento.
- Verificar en demo.eterniasoft.com que el lead aparece en el proyecto correcto, con fuente/canal/nivel correctos, datos y consentimiento correctos, y sin duplicados o correos inesperados.
- Registrar evidencia de cada caso y corregir observaciones antes de solicitar la reunión de validación con anticipación.

### 5. Validar y pasar a producción

- Coordinar reunión con Sperant/Santa Cruz y ejecutar pruebas en vivo desde cada formulario/servicio incluido.
- Tras aceptación explícita, recibir credenciales y base URL de producción; cargarlas como secretos separados y repetir un smoke test controlado.
- Revisar monitoreo de errores, alertas, tasa de fallos y procedimiento de desactivación del envío a Sperant.

## Criterios de aceptación

- Todo envío válido desde los formularios acordados se registra o actualiza en el proyecto correcto de Sperant.
- No hay exposición del token en navegador, código público, logs ni respuestas HTTP.
- La interfaz confirma envío únicamente cuando Sperant acepta el registro, y comunica fallos sin perder silenciosamente la consulta.
- El comportamiento ante leads existentes y consentimientos queda verificado en demo.
- Sperant aprueba las pruebas en vivo y proporciona credenciales de producción antes del cambio de entorno.

## Bloqueos / consultas para Sperant

1. IDs exactos de proyecto, canal, medio y nivel de interés para Livigno 555.
2. Formato literal del header `Authorization` y ejemplos de error del entorno asignado.
3. Campos admitidos para unidad de interés, horario/preferencia y texto de consulta.
4. Reglas de deduplicación y lista de campos que se actualizan en una coincidencia.
5. Si la API envía correos automáticos al lead/vendedor y cómo se configuran en demo.
6. Alcance de agenda/citas y la solicitud de información de unidad dentro de la integración.

## Seguridad de credenciales

El mensaje original contiene un token de prueba y credenciales de demo. No copiarlos a este repositorio, tickets o logs. Como ya fueron compartidos en un canal de conversación, solicitar a Sperant la rotación/reemisión del token de prueba y cambiar la contraseña de demo si esa cuenta es compartida o reutilizable. Mantenerlos solo en el gestor de secretos del entorno de prueba.
