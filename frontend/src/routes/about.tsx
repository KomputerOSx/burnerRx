import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/about')({
  component: AboutComponent,
})

function AboutComponent() {
  const navigate = useNavigate()

  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center gap-8 p-8">

      <Button
        variant="outline"
        size="sm"
        className="absolute top-6 right-6"
        onClick={() => navigate({ to: '/' })}
      >
        ← Back
      </Button>

      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">BurnerRx</h1>
        <p className="text-sm text-muted-foreground mt-2">USB ISO Flasher for Linux</p>
      </div>

      <p className="text-muted-foreground text-center max-w-sm text-sm leading-relaxed">
        A lightweight native desktop app for flashing ISO images to USB drives.
        Built for Linux with speed and simplicity in mind.
      </p>

      <div className="flex flex-col gap-1 text-sm text-muted-foreground text-center">
        <span>Go + Wails v2</span>
        <span>React 19 + TanStack Router</span>
        <span>shadcn/ui + Tailwind CSS v4</span>
      </div>

    </div>
  )
}
