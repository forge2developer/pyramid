import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

interface FullScreenLoaderProps {
  text?: string
  className?: string
}

export function FullScreenLoader({ text = "Loading...", className }: FullScreenLoaderProps) {
  return (
    <div className={cn(
      "fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm",
      className
    )}>
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      {text && <p className="mt-4 text-lg font-medium text-muted-foreground">{text}</p>}
    </div>
  )
}
