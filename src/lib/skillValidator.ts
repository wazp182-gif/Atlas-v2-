import { SkillValidationResult } from '../types/webAgent';

const MAX_SKILL_NAME_LENGTH = 64;
const MAX_SKILL_DESC_LENGTH = 1024;

export const ALLOWED_PROPERTIES = new Set([
  'name',
  'description',
  'homepage',
  'license',
  'allowed-tools',
  'user-invocable',
  'disable-model-invocation',
  'command-dispatch',
  'command-tool',
  'command-arg-mode',
  'metadata',
]);

/**
 * Extracts YAML frontmatter enclosed in --- delimiters.
 */
export function extractFrontmatter(content: string): string | null {
  const lines = content.split(/\r?\n/);
  if (lines.length === 0 || lines[0].trim() !== '---') {
    return null;
  }
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '---') {
      return lines.slice(1, i).join('\n');
    }
  }
  return null;
}

/**
 * Robust fallback frontmatter parser for key: value and list structures
 */
export function parseFrontmatter(frontmatterText: string): Record<string, any> | null {
  const parsed: Record<string, any> = {};
  let currentKey: string | null = null;
  const lines = frontmatterText.split(/\r?\n/);

  for (const rawLine of lines) {
    const stripped = rawLine.trim();
    if (!stripped || stripped.startsWith('#')) {
      continue;
    }

    const isIndented = rawLine.startsWith(' ') || rawLine.startsWith('\t');
    if (isIndented) {
      if (!currentKey) return null;
      
      // If it's a list item
      if (stripped.startsWith('- ')) {
        const itemVal = stripped.substring(2).trim().replace(/^['"]|['"]$/g, '');
        if (!Array.isArray(parsed[currentKey])) {
          parsed[currentKey] = [];
        }
        parsed[currentKey].push(itemVal);
      } else {
        const currentVal = parsed[currentKey];
        parsed[currentKey] = currentVal ? `${currentVal}\n${stripped}` : stripped;
      }
      continue;
    }

    if (!stripped.includes(':')) {
      return null;
    }

    const colonIndex = stripped.indexOf(':');
    const key = stripped.substring(0, colonIndex).trim();
    let value: any = stripped.substring(colonIndex + 1).trim();

    if (!key) return null;

    // Remove quotes
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    } else if (value === 'true') {
      value = true;
    } else if (value === 'false') {
      value = false;
    } else if (value === '') {
      value = '';
    }

    parsed[key] = value;
    currentKey = key;
  }

  return parsed;
}

/**
 * Validates a Skill.md content according to Apache 2.0 & AI Studio standards
 */
export function validateSkill(content: string): SkillValidationResult {
  const errors: string[] = [];

  if (!content || !content.trim()) {
    return {
      valid: false,
      message: 'SKILL.md está vacío.',
      errors: ['El contenido de la habilidad no puede estar vacío.'],
    };
  }

  const frontmatterText = extractFrontmatter(content);
  if (frontmatterText === null) {
    return {
      valid: false,
      message: 'Formato de frontmatter inválido: Debe comenzar y cerrar con "---".',
      errors: ['Falta bloque de metadatos YAML delimitado por "---".'],
    };
  }

  const frontmatter = parseFrontmatter(frontmatterText);
  if (!frontmatter || typeof frontmatter !== 'object') {
    return {
      valid: false,
      message: 'Error al parsear el frontmatter YAML.',
      errors: ['Sintaxis YAML inválida en el encabezado.'],
    };
  }

  // Validate allowed properties
  const unexpectedKeys = Object.keys(frontmatter).filter((k) => !ALLOWED_PROPERTIES.has(k));
  if (unexpectedKeys.length > 0) {
    errors.push(
      `Propiedades no permitidas en frontmatter: ${unexpectedKeys.join(', ')}. Permitidas: ${Array.from(ALLOWED_PROPERTIES).join(', ')}`
    );
  }

  // Validate 'name'
  if (!('name' in frontmatter)) {
    errors.push("Falta la propiedad obligatoria 'name' en el frontmatter.");
  } else {
    const name = String(frontmatter.name || '').trim();
    if (!name) {
      errors.push("La propiedad 'name' no puede estar vacía.");
    } else {
      if (!/^[a-z0-9-]+$/.test(name)) {
        errors.push(`El nombre '${name}' debe estar en kebab-case (solo letras minúsculas, dígitos y guiones).`);
      }
      if (name.startsWith('-') || name.endsWith('-') || name.includes('--')) {
        errors.push(`El nombre '${name}' no puede empezar/terminar con guion ni contener guiones consecutivos.`);
      }
      if (name.length > MAX_SKILL_NAME_LENGTH) {
        errors.push(`El nombre es demasiado largo (${name.length} caracteres). Máximo permitido: ${MAX_SKILL_NAME_LENGTH}.`);
      }
    }
  }

  // Validate 'description'
  if (!('description' in frontmatter)) {
    errors.push("Falta la propiedad obligatoria 'description' en el frontmatter.");
  } else {
    const desc = String(frontmatter.description || '').trim();
    if (!desc) {
      errors.push("La propiedad 'description' no puede estar vacía.");
    } else {
      if (desc.includes('<') || desc.includes('>')) {
        errors.push("La descripción no puede contener corchetes angulares ('<' o '>').");
      }
      if (desc.length > MAX_SKILL_DESC_LENGTH) {
        errors.push(`La descripción es demasiado larga (${desc.length} caracteres). Máximo permitido: ${MAX_SKILL_DESC_LENGTH}.`);
      }
    }
  }

  const isValid = errors.length === 0;
  return {
    valid: isValid,
    message: isValid ? '¡La habilidad es 100% válida según la especificación!' : `Se encontraron ${errors.length} error(es) de validación.`,
    parsedFrontmatter: frontmatter,
    errors,
  };
}
