import { useState } from 'react'
import { Info, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface PageIntroductionProps {
  title: string
  description: string
  features?: string[]
}

export function PageIntroduction({ title, description, features = [] }: PageIntroductionProps) {
  const [showInfo, setShowInfo] = useState(false)

  return (
    <>
      <div className="mb-4 pb-2 border-b border-border/40">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="font-medium">{title}</span>
          <span className="text-muted-foreground/60">•</span>
          <span className="italic flex-1">{description}</span>
          {features.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-muted"
              onClick={() => setShowInfo(true)}
              aria-label="More information"
            >
              <Info className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <Dialog open={showInfo} onOpenChange={setShowInfo}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">{title}</DialogTitle>
            <DialogDescription className="mt-2 text-base">
              {description}
            </DialogDescription>
          </DialogHeader>
          
          {features.length > 0 && (
            <div className="mt-4 space-y-3">
              <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
                Key Features & Capabilities
              </h3>
              <ul className="space-y-2">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span className="text-sm leading-relaxed">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            className="absolute top-4 right-4"
            onClick={() => setShowInfo(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogContent>
      </Dialog>
    </>
  )
}