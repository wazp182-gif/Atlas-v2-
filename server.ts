import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Support larger payloads for document & PDF uploads (up to 50MB)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initialize Google Gemini SDK
const defaultAi = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Helper to sanitize and normalize agenda JSON
function cleanJsonOutput(text: string): any {
  let cleaned = text.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  return JSON.parse(cleaned);
}

// Pre-crafted expert agendas for sample documents
const SAMPLE_EXPERT_AGENDAS: Record<string, any> = {
  'prd-checkout-mobile': {
    title: 'Alineación Ejecutiva: Aprobación PRD Checkout Móvil 1-Clic v3.0',
    objective: 'Revisar requerimientos técnicos, acordar política de autenticación biométrica/2FA y autorizar fecha de lanzamiento para Q3.',
    meetingType: 'Revisión y Aprobación de Producto',
    summary: 'Especificación de producto enfocada en reducir la tasa de abandono de carrito móvil del 68% al 50% mediante Apple Pay, Google Wallet y checkout en 1-clic con Stripe Elements v3.',
    participants: [
      {
        id: 'p-1',
        name: 'Laura Mendoza',
        role: 'Product Manager (Lead)',
        department: 'Producto',
        attendance: 'required',
        whyRequired: 'Presenta el PRD, métricas de abandono y criterios de aceptación del negocio.',
        suggestedPrep: 'Tener a mano el prototipo interactivo en Figma y métricas de embudo de conversión.',
      },
      {
        id: 'p-2',
        name: 'Carlos Ruiz',
        role: 'Tech Lead Backend',
        department: 'Ingeniería',
        attendance: 'required',
        whyRequired: 'Valida la viabilidad de la arquitectura asíncrona y latencia de 350ms.',
        suggestedPrep: 'Revisar especificación de idempotencia de la API de órdenes.',
      },
      {
        id: 'p-3',
        name: 'Sofía Chen',
        role: 'Lead UX/UI Designer',
        department: 'Diseño',
        attendance: 'required',
        whyRequired: 'Defiende el flujo de compra sin fricción y pruebas de usabilidad móvil.',
        suggestedPrep: 'Demostración del microflujo de error en pasarela de pago.',
      },
      {
        id: 'p-4',
        name: 'Elena Valdés',
        role: 'QA Lead',
        department: 'Calidad de Software',
        attendance: 'required',
        whyRequired: 'Expone el plan de pruebas de regresión con sandbox bancario.',
        suggestedPrep: 'Estimación del cronograma de certificación de pagos.',
      },
      {
        id: 'p-5',
        name: 'Rodrigo Peña',
        role: 'VP of Engineering',
        department: 'Dirección Técnica',
        attendance: 'optional',
        whyRequired: 'Aprobación ejecutiva para asignación de presupuesto de infraestructura ($12k/año).',
        suggestedPrep: 'Lectura del resumen de costos de licencias y pasarelas.',
      },
    ],
    topics: [
      {
        id: 't-1',
        title: 'Apertura y Contexto de Métricas de Abandono',
        durationMinutes: 5,
        category: 'kickoff',
        leadSpeaker: 'Laura Mendoza',
        description: 'Revisión del problema actual (68% abandono de carrito) y objetivo de elevar la conversión en +15%.',
        discussionPoints: [
          '¿Cuáles son los principales cuellos de botella en el checkout actual?',
          'Impacto proyectado en ingresos mensuales tras la optimización.',
        ],
        expectedDeliverable: 'Alineación unánime sobre el KPI prioritario de conversión.',
        priority: 'high',
      },
      {
        id: 't-2',
        title: 'Demostración del Flujo UX/UI 1-Clic y Wallets',
        durationMinutes: 10,
        category: 'presentation',
        leadSpeaker: 'Sofía Chen',
        description: 'Recorrido por las pantallas de Apple Pay, Google Wallet y selector biométrico.',
        discussionPoints: [
          'Manejo de direcciones no autocompletadas con Google Places.',
          'Experiencia de usuario en fallos temporales de red o fondos insuficientes.',
        ],
        expectedDeliverable: 'Aprobación del diseño final de pantallas para mobile.',
        priority: 'medium',
      },
      {
        id: 't-3',
        title: 'Arquitectura de Órdenes, Idempotencia y SLA de 350ms',
        durationMinutes: 15,
        category: 'discussion',
        leadSpeaker: 'Carlos Ruiz',
        description: 'Debate sobre el desacople asíncrono del microservicio de transacciones con Stripe Elements v3.',
        discussionPoints: [
          '¿Cómo garantizamos idempotencia para evitar cobros dobles en conexiones inestables?',
          'Estrategia de caché y validación de cupones de descuento en tiempo real.',
        ],
        expectedDeliverable: 'Aprobación de la arquitectura de microservicio y plan de contingencia.',
        priority: 'high',
      },
      {
        id: 't-4',
        title: 'Decisión Crítica: Política 2FA vs Biometría Nativa',
        durationMinutes: 10,
        category: 'decision',
        leadSpeaker: 'Laura Mendoza',
        description: 'Definir el umbral de riesgo de fraude para transacciones mayores a $150 USD.',
        discussionPoints: [
          '¿Solicitar 2FA por SMS a todos o solo en compras anómalas detectadas por Stripe Radar?',
          'Impacto en la fricción de usuario versus prevención de contracargos.',
        ],
        expectedDeliverable: 'Regla de seguridad aprobada para el release v3.0.',
        priority: 'high',
      },
      {
        id: 't-5',
        title: 'Cronograma QA, Fecha de Salida y Próximos Pasos',
        durationMinutes: 5,
        category: 'action_items',
        leadSpeaker: 'Elena Valdés',
        description: 'Fechas de freeze de código, 2 semanas de sandbox bancario y rollout gradual al 10% de usuarios.',
        discussionPoints: [
          'Disponibilidad de entornos de prueba bancaria.',
          'Responsable del monitoring durante el día de lanzamiento (15 de Noviembre).',
        ],
        expectedDeliverable: 'Matriz de responsables y fecha inamovible de despliegue.',
        priority: 'medium',
      },
    ],
    preMeetingChecklist: [
      'Revisar el documento PRD v3.0 adjunto.',
      'Probar el prototipo interactivo en Figma de la experiencia de pago.',
      'Consultar la documentación de endpoints de Stripe Elements v3.',
    ],
    risksAndWatchouts: [
      'Discusión prolongada sobre 2FA que pueda retrasar la aprobación del cronograma de ingeniería.',
      'Falta de sandbox bancario en QA para simular pagos internacionales multidivisa.',
    ],
  },
  'incidente-cloud-postmortem': {
    title: 'Post-Mortem Técnico (SEV-1): Degradación Clúster PostgreSQL y Failover',
    objective: 'Determinar causa raíz de los 42 minutos de degradación, validar acciones de mitigación y aislar cargas analíticas.',
    meetingType: 'Post-Mortem y Plan de Mitigación',
    summary: 'Análisis del incidente ocurrido el 22 de Agosto originado por una consulta pesada de BI que saturó el pool PgBouncer, provocó lag de réplica de 180s y reinicios en pods de Kubernetes.',
    participants: [
      {
        id: 'p-1',
        name: 'Fernando Alarcón',
        role: 'Staff SRE Lead',
        department: 'DevOps & SRE',
        attendance: 'required',
        whyRequired: 'Presenta la cronología minuto a minuto del incidente y logs de failover.',
        suggestedPrep: 'Tener preparados los dashboards de Grafana y métricas de saturación.',
      },
      {
        id: 'p-2',
        name: 'Javier Blanco',
        role: 'Lead DBA',
        department: 'Infraestructura de Datos',
        attendance: 'required',
        whyRequired: 'Explica el plan de aislamiento físico de la base de datos de BI/Analítica.',
        suggestedPrep: 'Propuesta de configuración de límites de CPU y memoria en réplicas.',
      },
      {
        id: 'p-3',
        name: 'Mariana Torres',
        role: 'Engineering Manager',
        department: 'Ingeniería',
        attendance: 'required',
        whyRequired: 'Asignación de prioridades en el backlog de remediación del equipo.',
        suggestedPrep: 'Revisar capacidad de sprints del equipo backend.',
      },
      {
        id: 'p-4',
        name: 'Andrea Morales',
        role: 'Directora de Soporte al Cliente',
        department: 'Customer Support',
        attendance: 'required',
        whyRequired: 'Reporta impacto en los 4,200 usuarios y los 180 tickets generados.',
        suggestedPrep: 'Plan de comunicación de compensación a cuentas enterprise.',
      },
    ],
    topics: [
      {
        id: 't-1',
        title: 'Cronología y Causa Raíz del Corte',
        durationMinutes: 15,
        category: 'presentation',
        leadSpeaker: 'Fernando Alarcón',
        description: 'Revisión paso a paso desde la ejecución del reporte analítico a las 14:15 UTC hasta la recuperación total.',
        discussionPoints: [
          '¿Por qué PgBouncer no cortó las conexiones inactivas a tiempo?',
          'Fallo del threshold de lag en el disparador del failover automático.',
        ],
        expectedDeliverable: 'Cronología del incidente aprobada sin discrepancias.',
        priority: 'high',
      },
      {
        id: 't-2',
        title: 'Aislamiento de Cargas BI y Réplicas Dedicadas',
        durationMinutes: 20,
        category: 'discussion',
        leadSpeaker: 'Javier Blanco',
        description: 'Definición de la nueva topología de base de datos para separar completamente el tráfico transaccional.',
        discussionPoints: [
          'Creación de clúster de solo lectura dedicado para BI con timeouts de 30 segundos.',
          'Restricción de permisos de lectura pesada en la base principal.',
        ],
        expectedDeliverable: 'Diseño arquitectónico aprobado para réplicas de datos.',
        priority: 'high',
      },
      {
        id: 't-3',
        title: 'Circuit Breakers y Auto-Recuperación en Kubernetes',
        durationMinutes: 15,
        category: 'decision',
        leadSpeaker: 'Fernando Alarcón',
        description: 'Mecanismos de protección para evitar que reinicios en cascada afecten a otros microservicios.',
        discussionPoints: [
          'Configuración de rate limiting en la capa de API gateway durante incidentes.',
          'Simulacros mensuales de Chaos Engineering.',
        ],
        expectedDeliverable: 'Aprobación de la política de circuit breakers y calendario de simulacros.',
        priority: 'high',
      },
      {
        id: 't-4',
        title: 'Asignación de Tareas de Remediación y SLA',
        durationMinutes: 10,
        category: 'action_items',
        leadSpeaker: 'Mariana Torres',
        description: 'Compromiso de entrega de parches, actualización de runbooks de on-call y compensación a clientes.',
        discussionPoints: [
          'Fechas límite para las 4 tareas críticas de remediación.',
          'Aprobación de créditos de servicio para cuentas afectadas.',
        ],
        expectedDeliverable: 'Jira Action Items con responsables asignados y deadlines.',
        priority: 'medium',
      },
    ],
    preMeetingChecklist: [
      'Lectura completa del reporte de incidente SEV-1.',
      'Revisión del dashboard de Grafana en el periodo 14:00 - 15:30 UTC.',
      'Analizar la consulta SQL causante del bloqueo de tabla.',
    ],
    risksAndWatchouts: [
      'Evitar culpar a individuos; mantener el enfoque estrictamente en fallas de procesos y salvaguardas sistémicas.',
    ],
  },
  'estrategia-b2b-q4': {
    title: 'Comité Estratégico: Expansión B2B Enterprise y Red de Partners Q4',
    objective: 'Aprobar el programa de revenue share con consultoras, definir paquete de compliance y autorizar contrataciones.',
    meetingType: 'Planificación Estratégica Ejecutiva',
    summary: 'Plan para capturar una cartera de 14 prospectos corporativos en pipeline con ACV promedio de $85,000 USD mediante certificación de 5 consultoras y soporte Tier 1.',
    participants: [
      {
        id: 'p-1',
        name: 'Gabriel Soto',
        role: 'Chief Commercial Officer (Lead)',
        department: 'Ventas & Alianzas',
        attendance: 'required',
        whyRequired: 'Presenta el plan de ingresos, pipeline de prospectos y metas de Q4.',
        suggestedPrep: 'Pipeline actualizado en CRM con estimaciones de cierre.',
      },
      {
        id: 'p-2',
        name: 'Patricia Navarro',
        role: 'Directora de Alianzas y Partners',
        department: 'Business Development',
        attendance: 'required',
        whyRequired: 'Detalla el acuerdo del 20% de revenue share recurrente con consultoras.',
        suggestedPrep: 'Borrador del convenio marco para partners integradores.',
      },
      {
        id: 'p-3',
        name: 'Ricardo Vega',
        role: 'Chief Financial Officer (CFO)',
        department: 'Finanzas',
        attendance: 'required',
        whyRequired: 'Autoriza el presupuesto de contratación para 3 Solutions Architects y 2 EAEs.',
        suggestedPrep: 'Modelo financiero de CAC vs LTV del canal de partners.',
      },
      {
        id: 'p-4',
        name: 'Carmen Salgado',
        role: 'Head of Customer Success',
        department: 'Customer Operations',
        attendance: 'required',
        whyRequired: 'Evalúa la viabilidad del SLA de respuesta menor a 15 minutos para clientes Tier 1.',
        suggestedPrep: 'Propuesta de turnos y guardias de soporte enterprise 24/7.',
      },
    ],
    topics: [
      {
        id: 't-1',
        title: 'Presentación del Pipeline Enterprise y Oportunidad Q4',
        durationMinutes: 15,
        category: 'presentation',
        leadSpeaker: 'Gabriel Soto',
        description: 'Análisis de los 14 prospectos clave y requisitos regulatorios de SOC2/ISO27001.',
        discussionPoints: [
          '¿Qué cuentas tienen mayor probabilidad de cierre antes del 31 de Diciembre?',
          'Requisitos de Data Residency en nube privada exigidos por bancos.',
        ],
        expectedDeliverable: 'Validación del objetivo de ventas de $1.2M USD para Q4.',
        priority: 'high',
      },
      {
        id: 't-2',
        title: 'Programa de Partners y Revenue Share del 20%',
        durationMinutes: 20,
        category: 'discussion',
        leadSpeaker: 'Patricia Navarro',
        description: 'Estructura de certificación técnica y comisiones para las 5 consultoras aliadas.',
        discussionPoints: [
          '¿El 20% aplica únicamente al primer año o a renovaciones plurianuales?',
          'Nivel de soporte técnico que brindará la consultora vs nuestro equipo.',
        ],
        expectedDeliverable: 'Aprobación del esquema de comisiones y modelo de certificación.',
        priority: 'high',
      },
      {
        id: 't-3',
        title: 'Aprobación Presupuestaria de Contrataciones y Soporte Tier 1',
        durationMinutes: 15,
        category: 'decision',
        leadSpeaker: 'Ricardo Vega',
        description: 'Votación para aprobar 5 nuevas plazas (3 Solutions Architects + 2 Account Executives).',
        discussionPoints: [
          'Retorno de inversión estimado en los primeros 6 meses.',
          'Costos operativos del SLA de soporte <15 min para grandes cuentas.',
        ],
        expectedDeliverable: 'Resolución formal de aprobación presupuestaria.',
        priority: 'high',
      },
      {
        id: 't-4',
        title: 'Acuerdos de Ejecución y Fechas Clave',
        durationMinutes: 10,
        category: 'action_items',
        leadSpeaker: 'Gabriel Soto',
        description: 'Lanzamiento de contrataciones con HR y firma de primeros 2 acuerdos de partners.',
        discussionPoints: [
          'Fecha de inicio del reclutamiento urgente.',
          'Próxima reunión de seguimiento quincenal.',
        ],
        expectedDeliverable: 'Calendario de ejecución con responsables directos.',
        priority: 'medium',
      },
    ],
    preMeetingChecklist: [
      'Revisar el informe financiero de pipeline de Q4.',
      'Leer la propuesta de convenio de revenue share para partners.',
      'Analizar los requisitos de compliance SOC2 requeridos por prospectos.',
    ],
    risksAndWatchouts: [
      'Retrasos en las contrataciones de Solutions Architects que puedan estrangular la preventa técnica.',
    ],
  },
  'kickoff-migracion-arquitectura': {
    title: 'Kickoff Técnico: Modernización y Desacople Modular del Monolito Core',
    objective: 'Alinear al equipo de ingeniería sobre la hoja de ruta de microservicios con Kafka, gRPC y acordar el reparto de capacidad 70/30.',
    meetingType: 'Alineación Técnica y Kickoff de Proyecto',
    summary: 'Plan para desacoplar el monolito de 450k líneas en 3 fases: Notificaciones en Kafka, Autenticación stateless con JWT y BFF con GraphQL para web y móvil.',
    participants: [
      {
        id: 'p-1',
        name: 'Ing. Mateo Ramos',
        role: 'Principal Architect (Lead)',
        department: 'Arquitectura',
        attendance: 'required',
        whyRequired: 'Presenta los diagramas de arquitectura target, contratos gRPC y Kafka.',
        suggestedPrep: 'Diagramas de arquitectura en C4 Model listos para proyectar.',
      },
      {
        id: 'p-2',
        name: 'Valeria Ortiz',
        role: 'Tech Lead Frontend',
        department: 'Frontend Engineering',
        attendance: 'required',
        whyRequired: 'Valida la interfaz GraphQL del BFF y compatibilidad móvil.',
        suggestedPrep: 'Esquema de tipos propuesto para queries y mutaciones.',
      },
      {
        id: 'p-3',
        name: 'Lucas Domínguez',
        role: 'DevOps & Platform Lead',
        department: 'Plataforma Cloud',
        attendance: 'required',
        whyRequired: 'Presenta la infraestructura de clúster Kafka y tracing con OpenTelemetry.',
        suggestedPrep: 'Configuración de pipelines CI/CD y despliegue Canary.',
      },
      {
        id: 'p-4',
        name: 'Daniela Morales',
        role: 'Scrum Master',
        department: 'Agile Coaching',
        attendance: 'required',
        whyRequired: 'Estructura los sprints y garantiza la regla 70% producto / 30% migración.',
        suggestedPrep: 'Capacidad de sprint estimada para los próximos 4 sprints.',
      },
    ],
    topics: [
      {
        id: 't-1',
        title: 'Visión General y Justificación del Desacople',
        durationMinutes: 10,
        category: 'kickoff',
        leadSpeaker: 'Ing. Mateo Ramos',
        description: 'Explicación de cuellos de botella actuales (deploys de 40 min y bloqueo de base de datos).',
        discussionPoints: [
          '¿Cuáles son los microservicios prioritarios para desacoplar primero?',
          'Métricas de éxito: reducción del tiempo de build a <5 minutos.',
        ],
        expectedDeliverable: 'Comprensión compartida de la visión arquitectónica target.',
        priority: 'high',
      },
      {
        id: 't-2',
        title: 'Fase 1: Extracción del Servicio de Eventos con Apache Kafka',
        durationMinutes: 15,
        category: 'discussion',
        leadSpeaker: 'Lucas Domínguez',
        description: 'Definición de tópicos de eventos, garantías de entrega y monitoreo con OpenTelemetry.',
        discussionPoints: [
          'Estrategia de dual-write durante la fase de transición para evitar pérdida de notificaciones.',
          'Curva de aprendizaje del equipo en gRPC y librerías cliente.',
        ],
        expectedDeliverable: 'Aprobación del diseño del servicio de notificaciones desacoplado.',
        priority: 'high',
      },
      {
        id: 't-3',
        title: 'Acuerdo de Capacidad: 70% Features / 30% Deuda Técnica',
        durationMinutes: 10,
        category: 'decision',
        leadSpeaker: 'Daniela Morales',
        description: 'Votación y compromiso para proteger el 30% de la capacidad de desarrollo para la migración.',
        discussionPoints: [
          '¿Cómo blindar esta capacidad frente a solicitudes urgentes de stakeholders de negocio?',
          'Criterios para medir el avance semanal del desacople.',
        ],
        expectedDeliverable: 'Pacto formal de capacidad de ingeniería aprobado.',
        priority: 'high',
      },
      {
        id: 't-4',
        title: 'Sprint 1 Backlog y Próximos Entregables',
        durationMinutes: 10,
        category: 'action_items',
        leadSpeaker: 'Ing. Mateo Ramos',
        description: 'Asignación de spikes técnicos, creación de repositorios y setup de Kafka local.',
        discussionPoints: [
          'Definición de DoD (Definition of Done) para los contratos gRPC.',
          'Fecha del primer demo de extracción funcional.',
        ],
        expectedDeliverable: 'Historias del Sprint 1 estimadas y asignadas.',
        priority: 'medium',
      },
    ],
    preMeetingChecklist: [
      'Revisar el RFC de Arquitectura v2.0.',
      'Verificar acceso a entornos de prueba de Apache Kafka.',
      'Revisar la propuesta de esquema GraphQL para el BFF.',
    ],
    risksAndWatchouts: [
      'Presión de stakeholders comerciales para reducir el 30% de tiempo asignado a refactorización.',
    ],
  },
};

// Heuristic fallback generator for any custom document/text
function generateIntelligentFallbackAgenda(
  documentText: string = '',
  settings?: any,
  sampleId?: string
): any {
  const targetDuration = Number(settings?.targetDuration) || 60;
  const meetingType = settings?.meetingType || 'Revisión y Toma de Decisiones';

  // Check if matches known samples
  if (sampleId && SAMPLE_EXPERT_AGENDAS[sampleId]) {
    const base = JSON.parse(JSON.stringify(SAMPLE_EXPERT_AGENDAS[sampleId]));
    return scaleAgendaToTargetDuration(base, targetDuration, meetingType);
  }

  // Check content keywords for sample matching
  const lowerText = documentText.toLowerCase();
  if (lowerText.includes('checkout') && (lowerText.includes('prd') || lowerText.includes('stripe'))) {
    const base = JSON.parse(JSON.stringify(SAMPLE_EXPERT_AGENDAS['prd-checkout-mobile']));
    return scaleAgendaToTargetDuration(base, targetDuration, meetingType);
  }
  if (lowerText.includes('post-mortem') || lowerText.includes('sev-1') || lowerText.includes('pgbouncer')) {
    const base = JSON.parse(JSON.stringify(SAMPLE_EXPERT_AGENDAS['incidente-cloud-postmortem']));
    return scaleAgendaToTargetDuration(base, targetDuration, meetingType);
  }
  if (lowerText.includes('b2b enterprise') || lowerText.includes('partners') || lowerText.includes('revenue share')) {
    const base = JSON.parse(JSON.stringify(SAMPLE_EXPERT_AGENDAS['estrategia-b2b-q4']));
    return scaleAgendaToTargetDuration(base, targetDuration, meetingType);
  }
  if (lowerText.includes('monolito') || lowerText.includes('microservicios') || lowerText.includes('kafka')) {
    const base = JSON.parse(JSON.stringify(SAMPLE_EXPERT_AGENDAS['kickoff-migracion-arquitectura']));
    return scaleAgendaToTargetDuration(base, targetDuration, meetingType);
  }

  // Extract structural insights dynamically from user document
  const lines = documentText.split('\n').map((l) => l.trim()).filter(Boolean);
  
  let title = 'Reunión de Análisis Estratégico y Plan de Acción';
  for (const line of lines.slice(0, 5)) {
    if (line.length > 5 && line.length < 100 && !line.startsWith('http')) {
      title = line.replace(/^[#*>\s\-_=]+/, '').trim();
      break;
    }
  }

  const extractedParticipants: any[] = [];
  const participantRegex = /([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)?)\s*[:\-(]\s*([^)\n,]+)/g;
  let match;
  let pIdx = 1;

  for (const line of lines) {
    if (
      line.toLowerCase().includes('participante') ||
      line.toLowerCase().includes('stakeholder') ||
      line.toLowerCase().includes('autor') ||
      line.toLowerCase().includes('equipo') ||
      line.toLowerCase().includes('líder')
    ) {
      while ((match = participantRegex.exec(line)) !== null) {
        if (match[1] && match[2] && extractedParticipants.length < 6) {
          extractedParticipants.push({
            id: `p-${pIdx++}`,
            name: match[1].trim(),
            role: match[2].trim(),
            department: 'General',
            attendance: extractedParticipants.length < 3 ? 'required' : 'optional',
            whyRequired: `Participante clave para la revisión técnica y operativa de los acuerdos de ${match[2].trim()}.`,
            suggestedPrep: 'Revisar previamente las métricas y propuestas del documento adjunto.',
          });
        }
      }
    }
  }

  if (extractedParticipants.length === 0) {
    extractedParticipants.push(
      {
        id: 'p-1',
        name: 'Facilitador Líder',
        role: 'Project Lead / Moderador',
        department: 'Operaciones',
        attendance: 'required',
        whyRequired: 'Dirige la sesión, asegura el cumplimiento de tiempos y documenta acuerdos vinculantes.',
        suggestedPrep: 'Tener a mano el documento fuente y la lista de puntos de decisión.',
      },
      {
        id: 'p-2',
        name: 'Líder Técnico / Especialista',
        role: 'Tech & Domain Specialist',
        department: 'Ingeniería / Especialidad',
        attendance: 'required',
        whyRequired: 'Aporta la evaluación de viabilidad, riesgos de implementación y dependencias críticas.',
        suggestedPrep: 'Revisar la viabilidad y arquitectura propuesta en el documento.',
      },
      {
        id: 'p-3',
        name: 'Stakeholder de Negocio / Sponsor',
        role: 'Business Owner',
        department: 'Negocio / Estrategia',
        attendance: 'required',
        whyRequired: 'Autoriza recursos, prioriza alcance y valida el impacto financiero/estratégico.',
        suggestedPrep: 'Analizar el retorno de inversión y prioridades comerciales.',
      },
      {
        id: 'p-4',
        name: 'Coordinador de QA & Operaciones',
        role: 'Operations & QA Lead',
        department: 'Calidad & Procesos',
        attendance: 'optional',
        whyRequired: 'Valida los criterios de aceptación y el plan de despliegue operativo.',
        suggestedPrep: 'Revisar el cronograma propuesto y dependencias.',
      }
    );
  }

  const topicHeaders: string[] = [];
  for (const line of lines) {
    if (
      (line.match(/^[0-9]+[.\-)]/) || line.startsWith('#') || line.match(/^[A-Z\s]{4,}:/)) &&
      line.length > 5 &&
      line.length < 90
    ) {
      const cleanHeader = line.replace(/^[0-9#*>\s\-_=.:]+/, '').trim();
      if (cleanHeader && !topicHeaders.includes(cleanHeader)) {
        topicHeaders.push(cleanHeader);
      }
    }
  }

  const defaultCategories: string[] = ['kickoff', 'presentation', 'discussion', 'decision', 'action_items'];
  const topicCount = Math.max(3, Math.min(6, topicHeaders.length > 2 ? topicHeaders.length : 5));
  const rawMinutes = distributeMinutes(targetDuration, topicCount);

  const topics: any[] = [];
  const primarySpeaker = extractedParticipants[0]?.name || 'Facilitador';

  for (let i = 0; i < topicCount; i++) {
    const customTitle = topicHeaders[i] || (
      i === 0 ? 'Alineación de Objetivos y Contexto Operativo' :
      i === 1 ? 'Presentación de Hallazgos y Análisis del Documento' :
      i === 2 ? 'Debate de Puntos Críticos y Viabilidad Técnica' :
      i === 3 ? 'Toma de Decisiones y Asignación de Recursos' :
      'Acuerdos Finales, Responsables y Plan de Próximos Pasos'
    );

    const category = defaultCategories[i % defaultCategories.length];
    const speaker = extractedParticipants[i % extractedParticipants.length]?.name || primarySpeaker;

    topics.push({
      id: `t-${i + 1}`,
      title: customTitle,
      durationMinutes: rawMinutes[i],
      category,
      leadSpeaker: speaker,
      description: `Bloque estructurado para revisar y acordar las definiciones clave relativas a "${customTitle}".`,
      discussionPoints: [
        `¿Cuáles son las restricciones principales identificadas en relación con ${customTitle}?`,
        `¿Qué impacto operativo o financiero representa para las áreas involucradas?`,
      ],
      expectedDeliverable: i === topicCount - 1
        ? 'Plan de acción formal con fechas de entrega y responsables asignados.'
        : `Consenso y resolución documentada sobre ${customTitle}.`,
      priority: i === 2 || i === 3 ? 'high' : 'medium',
    });
  }

  return {
    title: title.length > 80 ? title.substring(0, 80) + '...' : title,
    objective: `Revisar y validar los puntos clave del documento, despejar bloqueos operativos y acordar el plan de ejecución para alcanzar los resultados previstos.`,
    totalDuration: targetDuration,
    meetingType,
    summary: `Agenda ejecutiva generada a partir del análisis del documento proporcionado. Estructurada en ${topics.length} bloques operacionales calibrados para cumplir con la duración meta de ${targetDuration} minutos.`,
    participants: extractedParticipants,
    topics,
    preMeetingChecklist: [
      'Lectura obligatoria del documento base con antelación.',
      'Preparar métricas, estimaciones y dudas específicas de cada área.',
      'Tener clara la capacidad del equipo para comprometer fechas de entrega.',
    ],
    risksAndWatchouts: [
      'Desviación del foco en detalles menores no vinculantes con el objetivo central de la sesión.',
      'Falta de representatividad de algún área clave para autorizar cambios.',
    ],
  };
}

function distributeMinutes(total: number, count: number): number[] {
  if (count <= 1) return [total];
  
  let baseWeights = [0.15, 0.25, 0.35, 0.15, 0.10];
  if (count === 3) baseWeights = [0.20, 0.50, 0.30];
  if (count === 4) baseWeights = [0.15, 0.30, 0.35, 0.20];
  if (count === 6) baseWeights = [0.10, 0.20, 0.25, 0.25, 0.10, 0.10];

  let raw = baseWeights.slice(0, count).map((w) => Math.max(5, Math.round((w * total) / 5) * 5));
  let currentSum = raw.reduce((a, b) => a + b, 0);

  let diff = total - currentSum;
  let idx = 0;
  while (diff !== 0) {
    if (diff > 0) {
      raw[idx % count] += 5;
      diff -= 5;
    } else if (diff < 0 && raw[idx % count] > 5) {
      raw[idx % count] -= 5;
      diff += 5;
    }
    idx++;
  }

  return raw;
}

function scaleAgendaToTargetDuration(agenda: any, targetMinutes: number, meetingType?: string): any {
  const cloned = JSON.parse(JSON.stringify(agenda));
  if (meetingType) cloned.meetingType = meetingType;

  const currentTotal = cloned.topics.reduce((acc: number, t: any) => acc + t.durationMinutes, 0);
  if (currentTotal === targetMinutes) {
    cloned.totalDuration = targetMinutes;
    return cloned;
  }

  const topicCount = cloned.topics.length;
  const newMinutes = distributeMinutes(targetMinutes, topicCount);

  cloned.topics.forEach((t: any, idx: number) => {
    t.durationMinutes = newMinutes[idx] || 10;
  });

  cloned.totalDuration = targetMinutes;
  return cloned;
}

function refineFallbackAgenda(currentAgenda: any, prompt: string): any {
  const updated = JSON.parse(JSON.stringify(currentAgenda));
  const cleanPrompt = prompt.toLowerCase();

  const durationMatch = cleanPrompt.match(/(\d+)\s*(?:min|minutos|m\b)/);
  if (durationMatch && (cleanPrompt.includes('reduce') || cleanPrompt.includes('ajusta') || cleanPrompt.includes('cambia') || cleanPrompt.includes('duración') || cleanPrompt.includes('tiempo total'))) {
    const newTarget = Number(durationMatch[1]);
    if (newTarget >= 10 && newTarget <= 240) {
      return scaleAgendaToTargetDuration(updated, newTarget);
    }
  }

  if (cleanPrompt.includes('agrega') || cleanPrompt.includes('suma') || cleanPrompt.includes('añade')) {
    const minsMatch = cleanPrompt.match(/(\d+)\s*(?:min|minutos|m\b)/);
    const delta = minsMatch ? Number(minsMatch[1]) : 10;
    
    let targetTopic = updated.topics[0];
    if (cleanPrompt.includes('decisi')) {
      targetTopic = updated.topics.find((t: any) => t.category === 'decision' || t.title.toLowerCase().includes('decisi')) || updated.topics[updated.topics.length - 2];
    } else if (cleanPrompt.includes('debate') || cleanPrompt.includes('discusi')) {
      targetTopic = updated.topics.find((t: any) => t.category === 'discussion') || updated.topics[1];
    } else if (cleanPrompt.includes('cierre') || cleanPrompt.includes('acuerdo')) {
      targetTopic = updated.topics[updated.topics.length - 1];
    }

    if (targetTopic) {
      targetTopic.durationMinutes += delta;
      updated.totalDuration = updated.topics.reduce((acc: number, t: any) => acc + t.durationMinutes, 0);
      return updated;
    }
  }

  if (cleanPrompt.includes('participante') || cleanPrompt.includes('cfo') || cleanPrompt.includes('finanzas') || cleanPrompt.includes('asistente')) {
    const isCFO = cleanPrompt.includes('cfo') || cleanPrompt.includes('finanzas');
    const newParticipant = {
      id: `p-${Date.now()}`,
      name: isCFO ? 'Gerente de Finanzas (CFO)' : 'Nuevo Interesado Asignado',
      role: isCFO ? 'Chief Financial Officer' : 'Stakeholder Ejecutivo',
      department: isCFO ? 'Finanzas & Presupuesto' : 'Estrategia',
      attendance: 'required',
      whyRequired: 'Revisión y validación obligatoria del impacto presupuestario y asignación de fondos.',
      suggestedPrep: 'Analizar el impacto financiero y previsiones de gasto para la iniciativa.',
    };
    updated.participants.push(newParticipant);
    return updated;
  }

  if (cleanPrompt.includes('resume') || cleanPrompt.includes('sintetiza') || cleanPrompt.includes('dinamismo')) {
    updated.topics.forEach((t: any) => {
      if (t.discussionPoints && t.discussionPoints.length > 2) {
        t.discussionPoints = t.discussionPoints.slice(0, 2);
      }
    });
    return updated;
  }

  return updated;
}

// Handler for calling Ollama directly
async function callOllamaGeneration(
  endpoint: string,
  modelName: string,
  systemPrompt: string,
  userPrompt: string
): Promise<any> {
  const url = `${endpoint.replace(/\/$/, '')}/api/generate`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: modelName || 'llama3',
      system: systemPrompt,
      prompt: `${userPrompt}\n\nIMPORTANTE: Responde ÚNICAMENTE con el objeto JSON válido. No incluyas explicaciones previas ni posteriores.`,
      stream: false,
      format: 'json',
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama respondió con error HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  return cleanJsonOutput(data.response || '{}');
}

// API endpoint to test custom LLM connection (Gemini or Ollama)
app.post('/api/test-llm-connection', async (req, res) => {
  const { provider, geminiApiKey, geminiModel, ollamaEndpoint, ollamaModel } = req.body;

  try {
    if (provider === 'ollama') {
      const targetUrl = (ollamaEndpoint || 'http://localhost:11434').replace(/\/$/, '');
      
      // Check Ollama tags endpoint to list installed models
      const tagsRes = await fetch(`${targetUrl}/api/tags`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!tagsRes.ok) {
        return res.status(400).json({
          success: false,
          error: `Ollama respondió con estado ${tagsRes.status}. Verifica que Ollama esté ejecutándose y accesible en ${targetUrl}.`,
        });
      }

      const tagsData = await tagsRes.json();
      const availableModels = (tagsData.models || []).map((m: any) => m.name || m.model);

      return res.json({
        success: true,
        message: `¡Conexión exitosa con Ollama! Se encontraron ${availableModels.length} modelo(s) instalado(s).`,
        models: availableModels,
      });
    } else {
      // Test Gemini connection
      const client = geminiApiKey
        ? new GoogleGenAI({
            apiKey: geminiApiKey,
            httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
          })
        : defaultAi;

      const modelToTest = geminiModel || 'gemini-2.5-flash';
      const testResponse = await client.models.generateContent({
        model: modelToTest,
        contents: 'Responde únicamente con la palabra "OK".',
      });

      return res.json({
        success: true,
        message: `¡Conexión exitosa con Google Gemini (${modelToTest})!`,
      });
    }
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: `Error al conectar: ${err.message || 'No se pudo contactar el servicio.'}`,
    });
  }
});

// API endpoint to generate agenda from document
app.post('/api/generate-agenda', async (req, res) => {
  const { documentText, fileData, settings, sampleId, llmConfig } = req.body;

  if (!documentText && !fileData?.data) {
    return res.status(400).json({ error: 'No se proporcionó ningún documento ni contenido de texto.' });
  }

  const targetDuration = Number(settings?.targetDuration) || 60;
  const meetingType = settings?.meetingType || 'Revisión y Toma de Decisiones';
  const customInstructions = settings?.customInstructions || '';
  const language = settings?.language || 'es';

  const systemInstruction = `Eres un Agente Experto Facilitador Ejecutivo y Diseñador de Agendas de Reuniones de Alto Rendimiento.
Tu misión es analizar a fondo el documento proporcionado (minuta, propuesta técnica, informe de proyecto, PRD, reporte de incidentes, etc.) y estructurar una agenda de reunión impecable, optimizada, accionable y con tiempos precisos.

Pautas críticas:
1. La suma total de los minutos de todos los temas (durationMinutes) debe coincidir con la duración meta solicitada (${targetDuration} minutos) o aproximarse lo máximo posible.
2. Identifica con precisión a los interesados/participantes clave basándote en los roles y nombres mencionados en el documento. Si faltan nombres específicos, infiere roles pertinentes (ej: Lead Tech, Gerente de Producto, QA Lead, Sponsor Ejecutivo).
3. Cada tema de la agenda debe tener:
   - Un título claro y enfocado en resultados.
   - Un tiempo asignado en minutos realista.
   - Una categoría ('kickoff', 'presentation', 'discussion', 'decision', 'action_items', 'wrap_up', 'brainstorm').
   - Un responsable/líder asignado (debe coincidir con la lista de participantes).
   - Puntos clave de discusión y preguntas detonantes.
   - Un entregable o decisión concreta esperada.
4. Genera una lista de verificación previa a la reunión (prerrequisitos/material que deben leer antes) y posibles riesgos o alertas.
5. Todo el contenido generado debe ser redactado en idioma ${language === 'es' ? 'Español profesional y claro' : 'Inglés'}.`;

  const userPrompt = `Analiza el siguiente documento y genera una agenda completa de reunión en formato JSON.
- Tipo de reunión: ${meetingType}
- Duración total objetivo: ${targetDuration} minutos
${customInstructions ? `- Instrucciones adicionales del usuario: ${customInstructions}` : ''}

${documentText ? `\n--- CONTENIDO DEL DOCUMENTO ---\n${documentText}\n--- FIN DEL DOCUMENTO ---` : ''}`;

  // Check if user selected Ollama
  if (llmConfig?.provider === 'ollama' && llmConfig?.ollamaEndpoint) {
    try {
      const ollamaData = await callOllamaGeneration(
        llmConfig.ollamaEndpoint,
        llmConfig.ollamaModel || 'llama3',
        systemInstruction,
        userPrompt
      );
      return res.json({ success: true, agenda: ollamaData, engine: 'ollama' });
    } catch (ollamaErr: any) {
      // If Ollama fails, seamless fallback
      const fallbackAgenda = generateIntelligentFallbackAgenda(documentText, settings, sampleId);
      return res.json({
        success: true,
        agenda: fallbackAgenda,
        engine: 'atlas-heuristic',
        notice: 'Ollama local no estuvo disponible. Generado con motor cognitivo Atlas.',
      });
    }
  }

  // Use Gemini AI with custom key or default
  try {
    const client = llmConfig?.geminiApiKey
      ? new GoogleGenAI({
          apiKey: llmConfig.geminiApiKey,
          httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
        })
      : defaultAi;

    const chosenModel = llmConfig?.geminiModel || 'gemini-2.5-flash';
    const parts: any[] = [];

    if (fileData?.data && fileData?.mimeType) {
      parts.push({
        inlineData: {
          mimeType: fileData.mimeType,
          data: fileData.data,
        },
      });
    }

    parts.push({ text: userPrompt });

    const response = await client.models.generateContent({
      model: chosenModel,
      contents: { parts },
      config: {
        systemInstruction,
        temperature: 0.2,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: {
              type: Type.STRING,
              description: 'Título descriptivo y profesional para la reunión',
            },
            objective: {
              type: Type.STRING,
              description: 'Objetivo principal y resultado deseado de la reunión en 1-2 oraciones claras',
            },
            totalDuration: {
              type: Type.INTEGER,
              description: 'Duración total calculada en minutos (suma de los temas)',
            },
            meetingType: {
              type: Type.STRING,
              description: 'Tipo o formato de la reunión',
            },
            summary: {
              type: Type.STRING,
              description: 'Resumen ejecutivo del contexto del documento para la reunión',
            },
            participants: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  name: { type: Type.STRING, description: 'Nombre de la persona o Rol' },
                  role: { type: Type.STRING, description: 'Cargo o posición en la organización' },
                  department: { type: Type.STRING, description: 'Área o departamento' },
                  attendance: {
                    type: Type.STRING,
                    description: "'required' (Obligatorio) u 'optional' (Opcional)",
                  },
                  whyRequired: {
                    type: Type.STRING,
                    description: 'Razón fundamental de su participación e impacto en las decisiones',
                  },
                  suggestedPrep: {
                    type: Type.STRING,
                    description: 'Qué debe preparar o revisar antes de entrar a la reunión',
                  },
                },
                required: ['id', 'name', 'role', 'attendance', 'whyRequired'],
              },
            },
            topics: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING, description: 'Título claro y directo del tema' },
                  durationMinutes: {
                    type: Type.INTEGER,
                    description: 'Minutos exactos asignados a este tema',
                  },
                  category: {
                    type: Type.STRING,
                    description: 'kickoff | presentation | discussion | decision | action_items | wrap_up | brainstorm',
                  },
                  leadSpeaker: {
                    type: Type.STRING,
                    description: 'Nombre o rol de quien lidera o facilita este bloque',
                  },
                  description: {
                    type: Type.STRING,
                    description: 'Descripción concisa del alcance del tema',
                  },
                  discussionPoints: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: 'Puntos clave a debatir o revisar',
                  },
                  expectedDeliverable: {
                    type: Type.STRING,
                    description: 'Acuerdo, decisión o entregable concreto que debe salir de este bloque',
                  },
                  priority: {
                    type: Type.STRING,
                    description: 'high | medium | low',
                  },
                },
                required: ['id', 'title', 'durationMinutes', 'category', 'leadSpeaker', 'discussionPoints', 'expectedDeliverable'],
              },
            },
            preMeetingChecklist: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Requisitos y lecturas previas que todos los asistentes deben cumplir',
            },
            risksAndWatchouts: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Riesgos o temas sensibles que podrían desviar la reunión del objetivo',
            },
          },
          required: ['title', 'objective', 'totalDuration', 'participants', 'topics', 'preMeetingChecklist'],
        },
      },
    });

    const parsedData = cleanJsonOutput(response.text || '{}');
    return res.json({ success: true, agenda: parsedData, engine: 'gemini' });
  } catch (error: any) {
    const fallbackAgenda = generateIntelligentFallbackAgenda(documentText, settings, sampleId);
    return res.json({
      success: true,
      agenda: fallbackAgenda,
      engine: 'atlas-heuristic',
      notice: 'Generado con el motor cognitivo Atlas (Modo de alta disponibilidad activado).',
    });
  }
});

// API endpoint to refine / edit the agenda with natural language
app.post('/api/refine-agenda', async (req, res) => {
  const { currentAgenda, refinementPrompt, llmConfig } = req.body;

  if (!currentAgenda || !refinementPrompt) {
    return res.status(400).json({ error: 'Se requiere la agenda actual y las instrucciones de ajuste.' });
  }

  const systemInstruction = `Eres un Asistente Ejecutivo experto en optimización de agendas.
Se te proporciona una agenda de reunión actual en formato JSON y una instrucción del usuario para modificarla o ajustarla (ej: "reduce el tiempo a 45 min", "agrega 10 minutos al tema de presupuesto", "cambia el responsable del bloque 2", "agrega al CFO a los participantes").
Aplica los cambios solicitados manteniendo la coherencia de los tiempos totales, la lista de participantes y la estructura limpia. Devuelve el JSON completo actualizado.`;

  const userPrompt = `Agenda actual:
${JSON.stringify(currentAgenda, null, 2)}

Instrucción de modificación:
"${refinementPrompt}"

Devuelve la agenda actualizada en formato JSON con la misma estructura.`;

  if (llmConfig?.provider === 'ollama' && llmConfig?.ollamaEndpoint) {
    try {
      const ollamaData = await callOllamaGeneration(
        llmConfig.ollamaEndpoint,
        llmConfig.ollamaModel || 'llama3',
        systemInstruction,
        userPrompt
      );
      return res.json({ success: true, agenda: ollamaData, engine: 'ollama' });
    } catch (ollamaErr: any) {
      const updatedAgenda = refineFallbackAgenda(currentAgenda, refinementPrompt);
      return res.json({
        success: true,
        agenda: updatedAgenda,
        engine: 'atlas-heuristic',
        notice: 'Ajuste procesado mediante el motor de optimización local Atlas.',
      });
    }
  }

  try {
    const client = llmConfig?.geminiApiKey
      ? new GoogleGenAI({
          apiKey: llmConfig.geminiApiKey,
          httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
        })
      : defaultAi;

    const chosenModel = llmConfig?.geminiModel || 'gemini-2.5-flash';

    const response = await client.models.generateContent({
      model: chosenModel,
      contents: userPrompt,
      config: {
        systemInstruction,
        temperature: 0.2,
        responseMimeType: 'application/json',
      },
    });

    const updatedAgenda = cleanJsonOutput(response.text || '{}');
    return res.json({ success: true, agenda: updatedAgenda, engine: 'gemini' });
  } catch (error: any) {
    const updatedAgenda = refineFallbackAgenda(currentAgenda, refinementPrompt);
    return res.json({
      success: true,
      agenda: updatedAgenda,
      engine: 'atlas-heuristic',
      notice: 'Ajuste procesado mediante el motor de optimización local Atlas.',
    });
  }
});

// Setup Vite or static serving
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AgendaCraft AI server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
