import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/about')({
  component: AboutComponent,
})

function AboutComponent() {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-3xl font-bold">BurnerRx</h1>
      <p className="text-muted-foreground text-center max-w-md">
        A lightweight file browser built with Wails, React, and TanStack Router.
        Browse your filesystem directly from a native desktop app.
      </p>

      <div className="flex flex-col gap-2 text-sm text-muted-foreground">
        <span>Built with Go + Wails v2</span>
        <span>React 19 + TanStack Router</span>
        <span>shadcn/ui + Tailwind CSS v4</span>
      </div>

      <Button onClick={() => navigate({ to: '/' })}>Back to Files</Button>
    </div>
  )
}
