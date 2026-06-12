import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { ListUSB } from '../../wailsjs/go/main/App'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/')({
  component: RouteComponent,
})

function RouteComponent() {
  const [devices, setDevices] = useState<Record<string, string>[]>([])
  const [selectedDevice, setSelectedDevice] = useState<string>('')
  const [selectedISO, setSelectedISO] = useState<string>('')

  useEffect(() => {
    async function load() {
      try {
        const result = await ListUSB()
        setDevices(result ?? [])
      } catch (e) {
        console.error('ListUSB error:', e)
      }
    }
    load()
  }, [])

  return (
    <div className="flex min-h-svh items-center justify-center">
      <div className="grid grid-cols-3 gap-4 w-1/2">

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">USB Device</label>
          <select
            className="border border-border rounded-md px-3 py-2 bg-background text-foreground text-sm"
            value={selectedDevice}
            onChange={(e) => setSelectedDevice(e.target.value)}
          >
            <option value="">Select device...</option>
            {devices.map((d, i) => (
              <option key={i} value={d.vendor + ':' + d.product}>
                {d.name || `${d.vendor}:${d.product}`}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">ISO File</label>
          <input
            type="file"
            accept=".iso"
            className="border border-border rounded-md px-3 py-2 bg-background text-foreground text-sm"
            onChange={(e) => setSelectedISO(e.target.files?.[0]?.name ?? '')}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium invisible">Action</label>
          <Button
            disabled={!selectedDevice || !selectedISO}
            onClick={() => console.log('start', selectedDevice, selectedISO)}
          >
            Start
          </Button>
        </div>

      </div>
    </div>
  )
}
