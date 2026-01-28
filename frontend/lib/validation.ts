export type ValidationRule<T = any> = {
  validate: (value: T, formData?: any) => boolean
  message: string
}

export type ValidationRules<T = any> = {
  [K in keyof T]?: ValidationRule<T[K]>[]
}

export type ValidationErrors<T = any> = {
  [K in keyof T]?: string
}

// Common validation rules
export const validators = {
  required: (message = 'Bu alan zorunludur'): ValidationRule => ({
    validate: (value: any) => {
      if (typeof value === 'string') return value.trim().length > 0
      if (Array.isArray(value)) return value.length > 0
      return value !== null && value !== undefined
    },
    message,
  }),

  email: (message = 'Geçerli bir e-posta adresi giriniz'): ValidationRule => ({
    validate: (value: string) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return emailRegex.test(value)
    },
    message,
  }),

  minLength: (
    min: number,
    message = `En az ${min} karakter olmalıdır`
  ): ValidationRule<string> => ({
    validate: (value: string) => value.length >= min,
    message,
  }),

  maxLength: (
    max: number,
    message = `En fazla ${max} karakter olmalıdır`
  ): ValidationRule<string> => ({
    validate: (value: string) => value.length <= max,
    message,
  }),

  pattern: (
    regex: RegExp,
    message = 'Geçersiz format'
  ): ValidationRule<string> => ({
    validate: (value: string) => regex.test(value),
    message,
  }),

  min: (
    min: number,
    message = `En az ${min} olmalıdır`
  ): ValidationRule<number> => ({
    validate: (value: number) => value >= min,
    message,
  }),

  max: (
    max: number,
    message = `En fazla ${max} olmalıdır`
  ): ValidationRule<number> => ({
    validate: (value: number) => value <= max,
    message,
  }),

  url: (message = 'Geçerli bir URL giriniz'): ValidationRule<string> => ({
    validate: (value: string) => {
      try {
        new URL(value)
        return true
      } catch {
        return false
      }
    },
    message,
  }),

  phone: (
    message = 'Geçerli bir telefon numarası giriniz'
  ): ValidationRule<string> => ({
    validate: (value: string) => {
      const phoneRegex = /^[\d\s\-\+\(\)]+$/
      return phoneRegex.test(value) && value.replace(/\D/g, '').length >= 10
    },
    message,
  }),

  match: (
    fieldName: string,
    message = `${fieldName} ile eşleşmiyor`
  ): ValidationRule => ({
    validate: (value: any, formData?: any) => {
      return formData && value === formData[fieldName]
    },
    message,
  }),
}

// Validation function
export function validateField<T = any>(
  value: T,
  rules: ValidationRule<T>[],
  formData?: any
): string | null {
  for (const rule of rules) {
    if (!rule.validate(value, formData)) {
      return rule.message
    }
  }
  return null
}

// Validate entire form
export function validateForm<T extends Record<string, any>>(
  values: T,
  rules: ValidationRules<T>
): ValidationErrors<T> {
  const errors: ValidationErrors<T> = {}

  for (const key in rules) {
    const fieldRules = rules[key]
    if (fieldRules) {
      const error = validateField(values[key], fieldRules, values)
      if (error) {
        errors[key] = error
      }
    }
  }

  return errors
}

// Check if form has errors
export function hasErrors<T = any>(errors: ValidationErrors<T>): boolean {
  return Object.keys(errors).length > 0
}

// Sanitize string input
export function sanitizeString(str: string): string {
  return str
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/\s+/g, ' ') // Normalize whitespace
}

// Sanitize number input
export function sanitizeNumber(value: string | number): number | null {
  const num = typeof value === 'string' ? parseFloat(value) : value
  return isNaN(num) ? null : num
}
