import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import TextAlign from '@tiptap/extension-text-align'
import { 
  Bold, Italic, Underline as UnderlineIcon, List, ListOrdered, 
  Heading1, Heading2, Undo, Redo, AlignLeft, AlignCenter, 
  AlignRight, Link as LinkIcon
} from 'lucide-react'
import { Button } from './ui/button'

interface TipTapEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

const MenuBar = ({ editor }: any) => {
  if (!editor) return null

  const addLink = () => {
    const url = window.prompt('URL')
    if (url) {
      editor.chain().focus().setLink({ href: url }).run()
    }
  }

  return (
    <div className="flex flex-wrap gap-1 p-2 border border-border rounded-t-lg bg-muted/30">
      <Button
        type="button"
        size="sm"
        variant={editor.isActive('bold') ? 'default' : 'ghost'}
        onClick={() => editor.chain().focus().toggleBold().run()}
        className="h-8 w-8 p-0"
      >
        <Bold className="h-4 w-4" />
      </Button>
      
      <Button
        type="button"
        size="sm"
        variant={editor.isActive('italic') ? 'default' : 'ghost'}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className="h-8 w-8 p-0"
      >
        <Italic className="h-4 w-4" />
      </Button>
      
      <Button
        type="button"
        size="sm"
        variant={editor.isActive('underline') ? 'default' : 'ghost'}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className="h-8 w-8 p-0"
      >
        <UnderlineIcon className="h-4 w-4" />
      </Button>

      <div className="w-px h-8 bg-border mx-1" />

      <Button
        type="button"
        size="sm"
        variant={editor.isActive('heading', { level: 1 }) ? 'default' : 'ghost'}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className="h-8 w-8 p-0"
      >
        <Heading1 className="h-4 w-4" />
      </Button>

      <Button
        type="button"
        size="sm"
        variant={editor.isActive('heading', { level: 2 }) ? 'default' : 'ghost'}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className="h-8 w-8 p-0"
      >
        <Heading2 className="h-4 w-4" />
      </Button>

      <div className="w-px h-8 bg-border mx-1" />

      <Button
        type="button"
        size="sm"
        variant={editor.isActive('bulletList') ? 'default' : 'ghost'}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className="h-8 w-8 p-0"
      >
        <List className="h-4 w-4" />
      </Button>

      <Button
        type="button"
        size="sm"
        variant={editor.isActive('orderedList') ? 'default' : 'ghost'}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className="h-8 w-8 p-0"
      >
        <ListOrdered className="h-4 w-4" />
      </Button>

      <div className="w-px h-8 bg-border mx-1" />

      <Button
        type="button"
        size="sm"
        variant={editor.isActive({ textAlign: 'left' }) ? 'default' : 'ghost'}
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        className="h-8 w-8 p-0"
      >
        <AlignLeft className="h-4 w-4" />
      </Button>

      <Button
        type="button"
        size="sm"
        variant={editor.isActive({ textAlign: 'center' }) ? 'default' : 'ghost'}
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        className="h-8 w-8 p-0"
      >
        <AlignCenter className="h-4 w-4" />
      </Button>

      <Button
        type="button"
        size="sm"
        variant={editor.isActive({ textAlign: 'right' }) ? 'default' : 'ghost'}
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        className="h-8 w-8 p-0"
      >
        <AlignRight className="h-4 w-4" />
      </Button>

      <div className="w-px h-8 bg-border mx-1" />

      <Button
        type="button"
        size="sm"
        variant={editor.isActive('link') ? 'default' : 'ghost'}
        onClick={addLink}
        className="h-8 w-8 p-0"
      >
        <LinkIcon className="h-4 w-4" />
      </Button>

      <div className="w-px h-8 bg-border mx-1" />

      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        className="h-8 w-8 p-0"
      >
        <Undo className="h-4 w-4" />
      </Button>

      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        className="h-8 w-8 p-0"
      >
        <Redo className="h-4 w-4" />
      </Button>
    </div>
  )
}

const TipTapEditor = ({ value, onChange, placeholder }: TipTapEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2],
        },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none focus:outline-none min-h-[400px] p-4',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-background">
      <MenuBar editor={editor} />
      <EditorContent editor={editor} className="prose-editor" />
    </div>
  )
}

export default TipTapEditor
