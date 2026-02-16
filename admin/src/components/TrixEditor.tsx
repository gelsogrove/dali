import { useEffect, useRef } from 'react'
import 'trix'
import 'trix/dist/trix.css'
import './TrixEditor.css'

// Definizione TypeScript per trix-editor
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'trix-editor': any;
    }
  }
}

interface TrixEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

const TrixEditor = ({ value, onChange, placeholder }: TrixEditorProps) => {
  const editorRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const editor = editorRef.current?.querySelector('trix-editor') as any

    if (!editor) return

    const handleChange = (e: any) => {
      onChange(e.target.value)
    }

    const uploadFileAttachment = async (attachment: any) => {
      const file = attachment.file
      const form = new FormData()
      form.append('image', file)

      try {
        const apiUrl = import.meta.env.VITE_API_URL || '/api'
        const response = await fetch(`${apiUrl}/upload/editor-image`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: form
        })

        if (!response.ok) {
          throw new Error(`Upload failed with status: ${response.status}`)
        }

        const data = await response.json()

        if (data.success && data.data.url) {
          attachment.setAttributes({
            url: data.data.url,
            href: data.data.url
          })

          onChange(editor.value)

          // @ts-ignore
          if (window.sonner) {
            // @ts-ignore
            window.sonner.success('Immagine caricata con successo')
          }
        } else {
          throw new Error(data.error || 'Upload failed')
        }
      } catch (error) {
        console.error('Attachment upload failed:', error)
        attachment.remove()
        // @ts-ignore
        if (window.sonner) {
          // @ts-ignore
          window.sonner.error('Caricamento immagine fallito: ' + (error instanceof Error ? error.message : 'Errore sconosciuto'))
        }
      }
    }

    const handleAttachmentAdd = (event: any) => {
      const attachment = event.attachment
      if (attachment.file) {
        uploadFileAttachment(attachment)
      }
    }

    const handleAttachmentRemove = async (event: any) => {
      const attachment = event.attachment
      const url = attachment.getAttribute('url')
      if (url) {
        try {
          const apiUrl = import.meta.env.VITE_API_URL || '/api'
          await fetch(`${apiUrl}/upload/file?url=${encodeURIComponent(url)}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          })
          // @ts-ignore
          if (window.sonner) {
            // @ts-ignore
            window.sonner.success('File rimosso dal server')
          }
        } catch (error) {
          console.error('Failed to delete attachment from server:', error)
        }
      }
    }

    editor.addEventListener('trix-change', handleChange)
    editor.addEventListener('trix-attachment-add', handleAttachmentAdd)
    editor.addEventListener('trix-attachment-remove', handleAttachmentRemove)

    if (value !== editor.value) {
      editor.loadHTML(value || '')
    }

    return () => {
      editor.removeEventListener('trix-change', handleChange)
      editor.removeEventListener('trix-attachment-add', handleAttachmentAdd)
      editor.removeEventListener('trix-attachment-remove', handleAttachmentRemove)
    }
  }, [onChange, value])

  return (
    <div ref={editorRef} className="trix-editor-container">
      <input
        ref={inputRef}
        id="trix-editor-input"
        type="hidden"
        value={value}
      />
      <trix-editor
        input="trix-editor-input"
        placeholder={placeholder || 'Start writing...'}
      />
    </div>
  )
}

export default TrixEditor
