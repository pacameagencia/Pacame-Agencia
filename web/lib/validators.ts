/**
 * Validadores reutilizables para inputs del usuario.
 * Mensajes en español, listos para mostrar inline.
 */

const NIF_LETTERS = "TRWAGMYFPDXBNJZSQVHLCKE";
const NIE_PREFIX_MAP: Record<string, string> = { X: "0", Y: "1", Z: "2" };
const CIF_LETTERS = "ABCDEFGHJNPQRSUVW";
const CIF_CONTROL_LETTERS = "JABCDEFGHI";

export function isValidEmail(value: string): boolean {
  const v = (value ?? "").trim();
  if (!v || v.length > 254) return false;
  // RFC 5322 simplificado, suficiente para inputs reales
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(v);
}

export function isValidPhoneES(value: string): boolean {
  const digits = (value ?? "").replace(/[\s\-().]/g, "");
  // Acepta +34XXXXXXXXX, 0034XXXXXXXXX o XXXXXXXXX (9 dígitos empezando por 6/7/8/9)
  if (/^(\+34|0034)?[6789]\d{8}$/.test(digits)) return true;
  return false;
}

/**
 * Valida NIF (DNI), NIE o CIF español.
 * Tolerante a mayúsculas y guiones.
 */
export function isValidNIF(value: string): boolean {
  const raw = (value ?? "").trim().toUpperCase().replace(/[\s-]/g, "");
  if (raw.length !== 9) return false;

  // DNI: 8 dígitos + letra
  if (/^\d{8}[A-Z]$/.test(raw)) {
    const num = parseInt(raw.slice(0, 8), 10);
    return raw[8] === NIF_LETTERS[num % 23];
  }

  // NIE: X|Y|Z + 7 dígitos + letra
  if (/^[XYZ]\d{7}[A-Z]$/.test(raw)) {
    const replaced = NIE_PREFIX_MAP[raw[0]] + raw.slice(1, 8);
    const num = parseInt(replaced, 10);
    return raw[8] === NIF_LETTERS[num % 23];
  }

  // CIF: letra + 7 dígitos + dígito o letra control
  if (new RegExp(`^[${CIF_LETTERS}]\\d{7}[\\dA-Z]$`).test(raw)) {
    const digits = raw.slice(1, 8);
    let evenSum = 0;
    let oddSum = 0;
    for (let i = 0; i < 7; i++) {
      const d = parseInt(digits[i], 10);
      if (i % 2 === 0) {
        const doubled = d * 2;
        oddSum += Math.floor(doubled / 10) + (doubled % 10);
      } else {
        evenSum += d;
      }
    }
    const total = evenSum + oddSum;
    const controlDigit = (10 - (total % 10)) % 10;
    const controlChar = raw[8];
    // Algunas letras CIF deben llevar letra de control, otras dígito; admitimos ambas
    if (/\d/.test(controlChar)) {
      return parseInt(controlChar, 10) === controlDigit;
    }
    return controlChar === CIF_CONTROL_LETTERS[controlDigit];
  }

  return false;
}

export function normalizeNIF(value: string): string {
  return (value ?? "").trim().toUpperCase().replace(/[\s-]/g, "");
}

export interface FieldError {
  field: string;
  message: string;
}

export function validateRegistration(input: {
  email?: string;
  password?: string;
  full_name?: string;
  phone?: string;
}): FieldError[] {
  const errors: FieldError[] = [];
  if (!isValidEmail(input.email ?? "")) {
    errors.push({ field: "email", message: "Introduce un email válido." });
  }
  if (!input.password || input.password.length < 8) {
    errors.push({ field: "password", message: "La contraseña debe tener al menos 8 caracteres." });
  }
  if (!input.full_name || input.full_name.trim().length < 2) {
    errors.push({ field: "full_name", message: "Indica tu nombre completo." });
  }
  if (input.phone && !isValidPhoneES(input.phone)) {
    errors.push({ field: "phone", message: "El teléfono no parece español (9 dígitos)." });
  }
  return errors;
}

export function validateClientCreate(input: {
  fiscal_name?: string;
  nif?: string;
  email?: string;
  phone?: string;
}): FieldError[] {
  const errors: FieldError[] = [];
  if (!input.fiscal_name || input.fiscal_name.trim().length < 2) {
    errors.push({ field: "fiscal_name", message: "El nombre fiscal es obligatorio." });
  }
  if (!isValidNIF(input.nif ?? "")) {
    errors.push({ field: "nif", message: "NIF/NIE/CIF inválido. Revisa la letra de control." });
  }
  if (input.email && !isValidEmail(input.email)) {
    errors.push({ field: "email", message: "Email del cliente inválido." });
  }
  if (input.phone && !isValidPhoneES(input.phone)) {
    errors.push({ field: "phone", message: "Teléfono inválido (formato español)." });
  }
  return errors;
}
