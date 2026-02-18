import { useEffect, useRef, useMemo } from 'react'
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

let trixIdCounter = 0

const TrixEditor = ({ value, onChange, placeholder }: TrixEditorProps) => {
  const editorRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const trixRef = useRef<any>(null)
  const isInternalChange = useRef(false)
  const onChangeRef = useRef(onChange)
  const inputId = useMemo(() => `trix-input-${++trixIdCounter}`, [])

  // Keep onChange ref up to date without triggering effects
  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  // Setup event listeners ONCE on mount
  useEffect(() => {
    const container = editorRef.current
    if (!container) return

    const editor = container.querySelector('trix-editor') as any
    if (!editor) return
    trixRef.current = editor

    const handleChange = () => {
      isInternalChange.current = true
      onChangeRef.current(editor.value)
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

          onChangeRef.current(editor.value)

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

    return () => {
      editor.removeEventListener('trix-change', handleChange)
      editor.removeEventListener('trix-attachment-add', handleAttachmentAdd)
      editor.removeEventListener('trix-attachment-remove', handleAttachmentRemove)
    }
  }, []) // Mount only

  // Sync external value changes into the Trix editor
  useEffect(() => {
    const editor = trixRef.current

    // If the change came from the user typing inside the editor, skip the sync
    if (isInternalChange.current) {
      isInternalChange.current = false
      return
    }

    if (!editor) return

    // If the editor's internal API isn't ready yet, wait for trix-initialize
    if (!editor.editor) {
      const handleInitialize = () => {
        if (value) {
          editor.editor.loadHTML(value)
        }
        editor.removeEventListener('trix-initialize', handleInitialize)
      }
      editor.addEventListener('trix-initialize', handleInitialize)
      return () => {
        editor.removeEventListener('trix-initialize', handleInitialize)
      }
    }

    // Editor is ready – compare the actual document text (not the hidden input value)
    const currentDocText = editor.editor.getDocument().toString().trim()
    const incomingText = (value || '').trim()

    // Strip HTML tags for a plain-text comparison to detect real content differences
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = incomingText
    const incomingPlain = tempDiv.textContent?.trim() || ''

    // Only update if there's a real difference
    if (incomingPlain && currentDocText !== incomingPlain) {
      editor.editor.loadHTML(value)
    } else if (!incomingPlain && currentDocText) {
      editor.editor.loadHTML('')
    }
  }, [value])

  return (
    <div ref={editorRef} className="trix-editor-container">
      <input
        ref={inputRef}
        id={inputId}
        type="hidden"
        defaultValue={value}
      />
      <trix-editor
        input={inputId}
        placeholder={placeholder || 'Start writing...'}
      />
    </div>
  )
}

export default TrixEditor
