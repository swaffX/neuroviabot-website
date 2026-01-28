'use client'

import { useState, useCallback, FormEvent, ChangeEvent } from 'react'
import {
  validateForm,
  ValidationRules,
  ValidationErrors,
  hasErrors,
} from '@/lib/validation'

export interface UseFormOptions<T> {
  initialValues: T
  validationRules?: ValidationRules<T>
  onSubmit: (values: T) => void | Promise<void>
  validateOnChange?: boolean
  validateOnBlur?: boolean
}

export function useForm<T extends Record<string, any>>({
  initialValues,
  validationRules = {},
  onSubmit,
  validateOnChange = false,
  validateOnBlur = true,
}: UseFormOptions<T>) {
  const [values, setValues] = useState<T>(initialValues)
  const [errors, setErrors] = useState<ValidationErrors<T>>({})
  const [touched, setTouched] = useState<Record<keyof T, boolean>>({} as Record<keyof T, boolean>)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value, type } = e.target
      const fieldName = name as keyof T

      let fieldValue: any = value

      // Handle checkboxes
      if (type === 'checkbox') {
        fieldValue = (e.target as HTMLInputElement).checked
      }

      // Handle numbers
      if (type === 'number') {
        fieldValue = value === '' ? '' : Number(value)
      }

      setValues((prev) => ({
        ...prev,
        [fieldName]: fieldValue,
      }))

      // Validate on change if enabled
      if (validateOnChange && validationRules[fieldName]) {
        const newErrors = validateForm(
          { ...values, [fieldName]: fieldValue },
          validationRules
        )
        setErrors(newErrors)
      }
    },
    [values, validationRules, validateOnChange]
  )

  const handleBlur = useCallback(
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const fieldName = e.target.name as keyof T

      setTouched((prev) => ({
        ...prev,
        [fieldName]: true,
      }))

      // Validate on blur if enabled
      if (validateOnBlur && validationRules[fieldName]) {
        const newErrors = validateForm(values, validationRules)
        setErrors(newErrors)
      }
    },
    [values, validationRules, validateOnBlur]
  )

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault()
      setIsSubmitting(true)

      // Validate all fields
      const validationErrors = validateForm(values, validationRules)
      setErrors(validationErrors)

      // Mark all fields as touched
      const allTouched = Object.keys(values).reduce(
        (acc, key) => ({ ...acc, [key]: true }),
        {} as Record<keyof T, boolean>
      )
      setTouched(allTouched)

      // Only submit if no errors
      if (!hasErrors(validationErrors)) {
        try {
          await onSubmit(values)
        } catch (error) {
          console.error('Form submission error:', error)
        }
      }

      setIsSubmitting(false)
    },
    [values, validationRules, onSubmit]
  )

  const setFieldValue = useCallback((field: keyof T, value: any) => {
    setValues((prev) => ({
      ...prev,
      [field]: value,
    }))
  }, [])

  const setFieldError = useCallback((field: keyof T, error: string) => {
    setErrors((prev) => ({
      ...prev,
      [field]: error,
    }))
  }, [])

  const resetForm = useCallback(() => {
    setValues(initialValues)
    setErrors({})
    setTouched({} as Record<keyof T, boolean>)
    setIsSubmitting(false)
  }, [initialValues])

  const getFieldProps = useCallback(
    (name: keyof T) => ({
      name: String(name),
      value: values[name] ?? '',
      onChange: handleChange,
      onBlur: handleBlur,
      error: touched[name] ? errors[name] : undefined,
    }),
    [values, errors, touched, handleChange, handleBlur]
  )

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldValue,
    setFieldError,
    resetForm,
    getFieldProps,
    isValid: !hasErrors(errors),
  }
}
