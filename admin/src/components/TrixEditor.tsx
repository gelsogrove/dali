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
  const isInitialMount = useRef(true)

  useEffect(() => {
    const editor = editorRef.current?.querySelector('trix-editor') as any
    
    if (!editor) return

    const handleChange = (e: any) => {
      onChange(e.target.value)
    }

    editor.addEventListener('trix-change', handleChange)

    // Set initial value
    if (isInitialMount.current && value) {
      editor.value = value
      isInitialMount.current = false
    }

    return () => {
      editor.removeEventListener('trix-change', handleChange)
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
