import { Card, CardContent } from '@/components/ui/card'
import { Wrench } from 'lucide-react'

export default function PropertiesPage() {
  return (
    <div className="space-y-6">
      <Card className="p-10 text-center border-dashed">
        <CardContent className="space-y-3">
          <div className="flex justify-center">
            <Wrench className="h-10 w-10 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-semibold">Properties — work in progress</h2>
          <p className="text-muted-foreground">
            This section is under construction. Use the Blogs section for now.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
