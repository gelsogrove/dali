import { useMemo } from 'react'
// @ts-ignore
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

const RichTextEditor = ({ value, onChange, placeholder }: RichTextEditorProps) => {
  const modules = useMemo(() => ({
    toolbar: [
      ['bold', 'italic'],
      ['clean']
    ]
  }), [])

  return (
    <div style={{ minHeight: '400px' }}>
      <ReactQuill
        theme="snow"
        value={value || ''}
        onChange={onChange}
        modules={modules}
        placeholder={placeholder}
        style={{ height: '350px', marginBottom: '50px' }}
      />
    </div>
  )
}

export default RichTextEditor
