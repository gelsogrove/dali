import { useState } from 'react'
import { Copy, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { REALTOR_PROMPT } from '@/lib/prompts'
import './PromptBox.css'

export default function PromptBox() {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(REALTOR_PROMPT)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <div className="prompt-box">
      <div className="prompt-header">
        <div>
          <h3>OpenAI Realtor Prompt</h3>
          <p>Use this prompt to generate property data from PDFs/links with OpenAI</p>
        </div>
        <Button
          onClick={handleCopy}
          variant={copied ? 'default' : 'outline'}
          size="sm"
          className="gap-2"
        >
          {copied ? (
            <>
              <CheckCircle2 className="h-4 w-4" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              Copy Prompt
            </>
          )}
        </Button>
      </div>

      <div className="prompt-container">
        <pre className="prompt-pre">{REALTOR_PROMPT}</pre>
      </div>

      <div className="prompt-footer">
        <p>
          💡 <strong>How to use:</strong> Copy this prompt to ChatGPT/Claude, paste your property data (PDF/link/text), and 
          it will output perfect JSON for our API. Then paste the JSON in the property form.
        </p>
      </div>
    </div>
  )
}
