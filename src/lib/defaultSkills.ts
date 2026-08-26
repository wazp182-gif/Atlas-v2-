import { AgentSkill } from '../types/webAgent';

export const DEFAULT_AGENT_SKILLS: AgentSkill[] = [
  {
    id: 'skill-web-market-researcher',
    name: 'web-market-researcher',
    description: 'Investiga tendencias del mercado gastronómico, precios de competidores, novedades de la industria y opiniones de comensales en la web mediante Google Search.',
    category: 'web_research',
    allowedTools: ['googleSearch', 'urlContext'],
    userInvocable: true,
    license: 'Apache-2.0',
    valid: true,
    createdAt: new Date().toISOString(),
    content: `---
name: web-market-researcher
description: Investiga tendencias del mercado gastronómico, precios de competidores, novedades de la industria y opiniones de comensales en la web mediante Google Search.
allowed-tools:
  - googleSearch
  - urlContext
license: Apache-2.0
user-invocable: true
---

# Web Market Researcher Skill

## Objetivo
Ejecutar investigaciones estructuradas del mercado restaurantero, precios de la competencia y comportamiento de consumidores en línea.

## Flujo de Trabajo
1. Identificar la categoría gastronómica y la región geográfica indicada por el usuario.
2. Usar Google Search para buscar menús, precios promedio por ticket y promociones activas.
3. Extraer fuentes confiables con enlaces directos verificables.
4. Sintetizar los hallazgos en una comparativa de precios y oportunidades de diferenciación.

## Criterios de Calidad
- Siempre incluir URLs reales en las citas.
- Calcular variaciones porcentuales de precios cuando aplique.
- Entregar un plan de acción de 3 pasos para el restaurante.
`
  },
  {
    id: 'skill-food-safety-compliance',
    name: 'food-safety-compliance-check',
    description: 'Audita y consulta en tiempo real normativas sanitarias oficiales (NOM-251, HACCP, FDA, inocuidad alimentaria y manejo higiénico de alimentos).',
    category: 'compliance',
    allowedTools: ['googleSearch'],
    userInvocable: true,
    license: 'Apache-2.0',
    valid: true,
    createdAt: new Date().toISOString(),
    content: `---
name: food-safety-compliance-check
description: Audita y consulta en tiempo real normativas sanitarias oficiales (NOM-251, HACCP, FDA, inocuidad alimentaria y manejo higiénico de alimentos).
allowed-tools:
  - googleSearch
license: Apache-2.0
user-invocable: true
---

# Food Safety Compliance Check Skill

## Alcance
Consulta y validación de estándares de inocuidad alimentaria, temperaturas seguras de almacenamiento, vida útil de ingredientes, y rotulación PEPS (Primeras Entradas, Primeras Salidas).

## Procedimiento
1. Determinar el ingrediente, proceso o equipo objeto de la auditoría.
2. Verificar rangos de temperatura permitidos (Refrigeración <= 4°C, Congelación <= -18°C, Cocción >= 68°C-74°C).
3. Buscar actualizaciones normativas sanitarias vigentes.
4. Generar una lista de verificación preventiva para el personal de cocina.
`
  },
  {
    id: 'skill-supplier-price-comparison',
    name: 'supplier-price-comparison',
    description: 'Rastrea y compara precios mayoristas de insumos alimenticios básicos (aceites, harinas, carnes, lácteos y empaques) para optimizar costos de compras.',
    category: 'finance',
    allowedTools: ['googleSearch', 'urlContext'],
    userInvocable: true,
    license: 'Apache-2.0',
    valid: true,
    createdAt: new Date().toISOString(),
    content: `---
name: supplier-price-comparison
description: Rastrea y compara precios mayoristas de insumos alimenticios básicos (aceites, harinas, carnes, lácteos y empaques) para optimizar costos de compras.
allowed-tools:
  - googleSearch
  - urlContext
license: Apache-2.0
user-invocable: true
---

# Supplier Price Comparison Skill

## Misión
Optimizar los costos operativos de compra de materias primas mediante búsqueda de referencias de mercado en tiempo real.

## Pasos de Ejecución
1. Recibir la lista de insumos críticos con su unidad de medida (kg, litros, caja).
2. Consultar distribuidores mayoristas de alimentos y centrales de abastos.
3. Construir una tabla comparativa de costo por unidad.
4. Calcular el margen potencial de ahorro y advertir sobre fluctuaciones estacionales.
`
  },
  {
    id: 'skill-atlas-jarvis-executive-voice',
    name: 'atlas-jarvis-executive-voice',
    description: 'Transforma a Atlas en un asistente ejecutivo digital con personalidad J.A.R.V.I.S., respondiendo con precisión temporal, cero palabrería y síntesis vocal refinada.',
    category: 'operations',
    allowedTools: ['speechSynthesizer', 'geminiExecutiveChat'],
    userInvocable: true,
    license: 'Apache-2.0',
    valid: true,
    createdAt: new Date().toISOString(),
    content: `---
name: atlas-jarvis-executive-voice
description: Transforma a Atlas en un asistente ejecutivo digital con personalidad J.A.R.V.I.S., respondiendo con precisión temporal, cero palabrería y síntesis vocal refinada.
allowed-tools:
  - speechSynthesizer
  - geminiExecutiveChat
license: Apache-2.0
user-invocable: true
---

# Atlas J.A.R.V.I.S. Executive Voice Skill

## Propósito
Dotar a Atlas de una interfaz conversacional y vocal inspirada en J.A.R.V.I.S.: refinada, ejecutiva, consciente del tiempo y concisa.

## Reglas Estrictas de Comportamiento
1. Responde ÚNICAMENTE a lo que el Director te pregunta o solicita.
2. NO menciones ventas, arqueos, cajas, inventarios ni estatus de sistemas a menos que te lo pregunten explícitamente.
3. Cero frases robóticas ("He procesado tu instrucción...", "Entendido, Director. He recibido..."). Ve directo al grano.
4. Tono: Ejecutivo, refinado, conciso, inteligente y respetuoso (trátalo de "Director" o "Señor").
5. Si te pregunta la hora, responde únicamente la hora de forma natural y elegante.
`
  },
  {
    id: 'skill-docfx-diataxis-audit',
    name: 'docfx-diataxis-audit',
    description: 'Valida y reestructura manuales de procedimientos operativos según la metodología Diátaxis (Tutoriales, Guías Prácticas, Referencia y Explicación).',
    category: 'operations',
    allowedTools: ['googleSearch'],
    userInvocable: true,
    license: 'Apache-2.0',
    valid: true,
    createdAt: new Date().toISOString(),
    content: `---
name: docfx-diataxis-audit
description: Valida y reestructura manuales de procedimientos operativos según la metodología Diátaxis (Tutoriales, Guías Prácticas, Referencia y Explicación).
allowed-tools:
  - googleSearch
license: Apache-2.0
user-invocable: true
---

# DocFX & Diátaxis Audit Skill

## Cuadrantes Diátaxis
1. **Tutoriales**: Orientados al aprendizaje práctico del nuevo personal.
2. **Guías Prácticas (How-To)**: Pasos concretos para resolver una tarea operativa específica (ej: corte de caja, cambio de aceite).
3. **Referencia**: Tablas de temperaturas, fórmulas de arqueo, códigos de error.
4. **Explicación**: El por qué de los procedimientos y fundamentos de calidad.
`
  }
];
