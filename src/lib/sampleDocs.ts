export interface SampleDoc {
  id: string;
  title: string;
  category: string;
  description: string;
  content: string;
  defaultDuration: number;
  meetingType: string;
}

export const SAMPLE_DOCUMENTS: SampleDoc[] = [
  {
    id: 'prd-checkout-mobile',
    title: 'PRD: Rediseño del Flujo de Checkout Móvil v3.0',
    category: 'Producto & UX',
    description: 'Especificación de producto para reducir la tasa de abandono de carrito en un 18%.',
    defaultDuration: 45,
    meetingType: 'Revisión y Aprobación de Producto',
    content: `DOCUMENTO DE REQUERIMIENTOS DE PRODUCTO (PRD)
Proyecto: Checkout Rápido en 1-Clic (Mobile App v3.0)
Fecha: Q3 2026
Autor: Laura Mendoza (Product Manager)
Stakeholders Clave: Carlos Ruiz (Tech Lead Backend), Sofía Chen (Lead UX/UI Designer), Martín Gómez (Head of Growth & Marketing), Elena Valdés (QA Lead), Rodrigo Peña (VP of Engineering).

1. OBJETIVO DEL NEGOCIO
El objetivo principal es reducir la tasa de abandono del carrito del 68% actual al 50% en plataformas móviles iOS y Android. Introduciremos compra en 1-clic con Apple Pay, Google Pay y pasarela de pago biométrica, además de autocompletado de dirección con Google Places.

2. ALCANCE TÉCNICO Y DEPENDENCIAS
- Integración con Stripe Elements v3 y SDKs nativos de Apple Pay y Google Wallet.
- Rediseño completo de la arquitectura del microservicio de órdenes para manejar transacciones asíncronas con idempotencia.
- Tiempo de respuesta del endpoint de checkout menor a 350ms (percentil 95).
- Soporte para split payments y cupones de descuento automáticos aplicados por el equipo de Growth.

3. PUNTOS CRÍTICOS Y DECISIONES PENDIENTES
- Decisión de seguridad: ¿Exigir 2FA (SMS o Authenticator) para compras superiores a $150 USD o confiar en la biometría nativa del dispositivo?
- Estimación del esfuerzo de QA: Se necesitan 2 semanas de pruebas de regresión con sandbox bancario.
- Fecha tentativa de despliegue a producción (Release Date): 15 de Noviembre.
- Presupuesto requerido para licencias de pasarela e infraestructura adicional: $12,000 USD anuales.

4. CRITERIOS DE ÉXITO
- Tasa de conversión móvil +15% en los primeros 30 días.
- Cero incidentes críticos de fraude o cobros duplicados en la fase de beta cerrado.`
  },
  {
    id: 'incidente-cloud-postmortem',
    title: 'Post-Mortem: Falla Crítica en Base de Datos y Failover Cloud',
    category: 'Ingeniería & DevOps',
    description: 'Análisis de causa raíz de la degradación de 42 minutos en el clúster transaccional.',
    defaultDuration: 60,
    meetingType: 'Post-Mortem y Plan de Mitigación',
    content: `REPORTE DE INCIDENTE Y POST-MORTEM (SEV-1)
Incidente: Degradación de latencia y fallo en réplica de lectura en clúster PostgreSQL
Fecha del Incidente: 22 de Agosto de 2026
Duración del corte: 42 minutos de degradación, 8 minutos de indisponibilidad total.
Participantes Clave: Fernando Alarcón (Staff Site Reliability Engineer), Mariana Torres (Engineering Manager), Javier Blanco (Lead DBA), Andrea Morales (Directora de Soporte al Cliente), Tomás Herrera (Security & Compliance Officer).

1. RESUMEN EJECUTIVO
A las 14:15 UTC, una consulta no optimizada ejecutada por un reporte analítico masivo bloqueó la tabla de transacciones activas, saturando el pool de conexiones de PgBouncer. La réplica de solo lectura sufrió un lag de replicación de más de 180 segundos, activando un failover automático no coordinado que causó reinicios en cascada de los pods de Kubernetes.

2. IMPACTO AL NEGOCIO
- Afectación estimada a 4,200 usuarios que intentaron procesar pagos.
- 180 tickets de soporte generados en Zendesk.
- Ninguna pérdida de datos transaccionales, pero se degradó el SLA mensual de 99.99% a 99.85%.

3. ACCIONES DE REMEDIACIÓN PROPUESTAS
- Aislar permanentemente las consultas de BI/Analítica a una réplica física dedicada con límites estrictos de CPU y memoria.
- Implementar circuit breakers automáticos en la capa de API para frenar spikes de tráfico durante eventos de failover.
- Actualizar los runbooks de guardia (on-call) y realizar simulacros de caos (Chaos Engineering) mensuales.
- Definir compensación a clientes enterprise afectados mediante créditos de servicio.`
  },
  {
    id: 'estrategia-b2b-q4',
    title: 'Plan Estratégico: Alianzas y Expansión B2B Enterprise Q4',
    category: 'Estrategia & Negocios',
    description: 'Estrategia de penetración en cuentas corporativas y red de partners integradores.',
    defaultDuration: 60,
    meetingType: 'Planificación Estratégica Ejecutiva',
    content: `PROPUESTA ESTRATÉGICA DE EXPANSIÓN B2B ENTERPRISE
Periodo: Cuarto Trimestre (Q4 2026)
Líder de Iniciativa: Gabriel Soto (Chief Commercial Officer)
Equipo Clave: Patricia Navarro (Directora de Alianzas y Partners), Ricardo Vega (CFO), Carmen Salgado (Head of Customer Success), Diego Lira (Product Marketing Manager).

1. CONTEXTO Y OPORTUNIDAD
El mercado enterprise en la región muestra una demanda creciente de soluciones de automatización con cumplimiento estricto de SOC2 e ISO27001. Contamos con una cartera de 14 prospectos corporativos en pipeline con un ACV (Annual Contract Value) promedio de $85,000 USD.

2. PILARES DE LA ESTRATEGIA
a) Programa de Partners Integradores: Certificar a las 5 principales consultoras tecnológicas para que implementen nuestra solución en sus clientes corporativos, ofreciendo un 20% de revenue share recurrente.
b) Paquete Enterprise Compliance: Habilitar SSO (SAML/Okta), Data Residency en nube privada y registro de auditoría inmutable.
c) Escalamiento del equipo de soporte dedicado (SLA de respuesta <15 min para cuentas Tier 1).

3. DECISIONES FINANCIERAS Y OPERATIVAS
- Aprobación de presupuesto para contratar 3 Solutions Architects y 2 Enterprise Account Executives.
- Definición de los esquemas de comisiones y descuentos máximos autorizados por el equipo de ventas.
- Compromiso de entrega de las certificaciones de seguridad por parte del equipo de infraestructura antes del 30 de Octubre.`
  },
  {
    id: 'kickoff-migracion-arquitectura',
    title: 'Kickoff: Modernización y Desacople de Arquitectura Monolítica',
    category: 'Arquitectura de Software',
    description: 'Hoja de ruta para migrar servicios críticos hacia microservicios con Kafka y gRPC.',
    defaultDuration: 45,
    meetingType: 'Alineación Técnica y Kickoff de Proyecto',
    content: `DOCUMENTO DE ARQUITECTURA Y HOJA DE RUTA
Iniciativa: Desacople Modular del Monolito Central 'Core-API'
Fecha: Agosto 2026
Líderes de la Iniciativa: Ing. Mateo Ramos (Principal Architect), Valeria Ortiz (Tech Lead Frontend), Lucas Domínguez (DevOps Lead), Daniela Morales (Scrum Master).

1. JUSTIFICACIÓN TÉCNICA
El monolito actual contiene más de 450,000 líneas de código y despliegues que tardan más de 40 minutos en el pipeline de CI/CD. La base de datos compartida genera cuellos de botella severos en horarios pico.

2. FASES DE MIGRACIÓN PLANIFICADAS
- Fase 1 (Semanas 1 a 4): Extracción del servicio de Notificaciones y Eventos hacia Apache Kafka.
- Fase 2 (Semanas 5 a 10): Separación del módulo de Autenticación y Perfiles de Usuario con JWT stateless.
- Fase 3 (Semanas 11 a 16): Creación de BFF (Backend for Frontend) con GraphQL para aplicaciones web y móviles.

3. RIESGOS IDENTIFICADOS Y PUNTOS DE ACUERDO
- Curva de aprendizaje del equipo en gRPC y monitoreo distribuido con OpenTelemetry.
- Necesidad de mantener compatibilidad con clientes legados durante al menos 6 meses.
- Acordar la distribución de tiempo del equipo de desarrollo: 70% features de producto / 30% deuda técnica y migración.`
  }
];
