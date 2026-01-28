'use client'

import { ReactNode } from 'react'
import Modal from './Modal'
import Button from './Button'

export interface DialogProps {
  open: boolean
  onClose: () => void
  onConfirm?: () => void
  title: string
  description?: string
  children?: ReactNode
  confirmText?: string
  cancelText?: string
  variant?: 'info' | 'warning' | 'danger' | 'success'
  loading?: boolean
}

export function Dialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  children,
  confirmText = 'Onayla',
  cancelText = 'İptal',
  variant = 'info',
  loading = false,
}: DialogProps) {
  const variantStyles = {
    info: { color: 'primary' as const, icon: '💬' },
    warning: { color: 'secondary' as const, icon: '⚠️' },
    danger: { color: 'danger' as const, icon: '❌' },
    success: { color: 'success' as const, icon: '✅' },
  }

  const { color, icon } = variantStyles[variant]

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={title}
      description={description}
      size="sm"
      showCloseButton={!loading}
    >
      <div className="text-center">
        <div className="mx-auto flex items-center justify-center w-12 h-12 mb-4 text-2xl">
          {icon}
        </div>

        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>

        {description && (
          <p className="text-sm text-slate-400 mb-4">{description}</p>
        )}

        {children && <div className="mb-6">{children}</div>}

        <div className="flex gap-3 justify-center">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={loading}
          >
            {cancelText}
          </Button>

          {onConfirm && (
            <Button
              variant={color}
              onClick={onConfirm}
              loading={loading}
            >
              {confirmText}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  )
}

export default Dialog
