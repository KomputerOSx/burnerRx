import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { BurnISO, ListUSB, OpenFileDialog } from '../../wailsjs/go/main/App'
import { Button } from '@/components/ui/button'
import { EventsOn } from '../../wailsjs/runtime/runtime'

export const Route = createFileRoute('/')({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = useNavigate()
  const [devices, setDevices] = useState<Record<string, string>[]>([])
  const [selectedDevice, setSelectedDevice] = useState<string>('')
  const [selectedISO, setSelectedISO] = useState<string>('')
  const [confirmFormat, setConfirmFormat] = useState(false)
  const [progress, setProgress] = useState<number>(0)
  const [burning, setBurning] = useState(false)
  const [isoFullPath, setIsoFullPath] = useState<string>('')

  async function loadDevices() {
    try {
      const result = await ListUSB()
      setDevices(result ?? [])
    } catch (e) {
      console.error('ListUSB error:', e)
    }
  }

  useEffect(() => { void loadDevices() }, [])

  useEffect(() => {
    const unlisten = EventsOn('burn:progress', (percent: number) => {
      setProgress(percent)
    })
    return () => unlisten()
  }, [])

  const selectedDeviceInfo = devices.find(d => d.devicePath === selectedDevice)
  const isCompatible = selectedDeviceInfo?.format === 'vfat'
  const isValidISO = selectedISO.endsWith('.iso')
  const ready = selectedDevice && selectedISO && isValidISO && (isCompatible || confirmFormat)

  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center gap-10 px-8">
      <Button
        variant="outline"
        size="sm"
        className="absolute top-6 right-6"
        onClick={() => navigate({ to: '/about' })}
      >
        About
      </Button>

      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">BurnerRx</h1>
        <p className="text-sm text-muted-foreground mt-1">Flash ISO images to USB drives</p>
      </div>

      <div className="grid grid-cols-3 gap-6 w-4/5">

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              1. Select USB Device
            </label>
            <button onClick={() => void loadDevices()} className="text-xs text-muted-foreground underline">
              Refresh
            </button>
          </div>
          <select
            className="border border-border rounded-md px-3 py-2 bg-background text-foreground text-sm h-10"
            value={selectedDevice}
            onChange={(e) => { setSelectedDevice(e.target.value); setConfirmFormat(false) }}
          >
            <option value="">Choose device...</option>
            {devices.map((d, i) => (
              <option key={i} value={d.devicePath}>
                {d.product || d.blockDevice} {d.manufacturer ? `(${d.manufacturer})` : ''} — {d.capacity} — {d.devicePath}
              </option>
            ))}
          </select>

          {selectedDevice && !isCompatible && (
            <div className="flex flex-col gap-2 mt-1">
              <p className="text-xs text-destructive">
                Format incompatible ({selectedDeviceInfo?.format || 'unknown'}). Must be FAT32 to flash.
              </p>
              <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmFormat}
                  onChange={(e) => setConfirmFormat(e.target.checked)}
                />
                I confirm — reformat to FAT32 before flashing
              </label>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            2. Select ISO File
          </label>
          <button
            className="border border-border rounded-md px-3 py-2 text-sm h-10 flex items-center cursor-pointer text-muted-foreground w-full"
            onClick={async () => {
              const path = await OpenFileDialog()
              if (path) {
                setSelectedISO(path.split('/').pop() ?? path)
                setIsoFullPath(path)
              }
            }}
          >
            {selectedISO || 'Choose ISO file...'}
          </button>
          {selectedISO && !isValidISO && (
            <p className="text-xs text-destructive">File must be a .iso image</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground invisible">
            3. Flash
          </label>
          <div className="flex gap-2">
            <Button
              className="flex-1"
              disabled={!ready || burning}
              variant={ready ? 'default' : 'outline'}
              onClick={() => {
                setBurning(true)
                setProgress(0)
                void BurnISO(isoFullPath, selectedDevice).finally(() => setBurning(false))
              }}
            >
              {burning ? 'Burning...' : 'Start'}
            </Button>
            <Button
              variant="destructive"
              onClick={() => { setSelectedDevice(''); setSelectedISO(''); setConfirmFormat(false) }}
            >
              Clear
            </Button>
          </div>
        </div>

      </div>

      {ready && (
        <div className="text-xs text-muted-foreground text-center">
          Flashing <span className="text-foreground font-medium">{selectedISO}</span> to <span className="text-foreground font-medium">{selectedDevice}</span>
          {confirmFormat && <span className="text-destructive"> — will reformat to FAT32</span>}
        </div>
      )}

      {burning && (
        <div className="w-4/5 flex flex-col gap-2">
          <div className="h-2 rounded-full bg-border overflow-hidden">
            <div
              className="h-2 rounded-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground text-center">{progress}% complete</p>
        </div>
      )}

      {!burning && progress === 100 && (
        <p className="text-sm text-primary font-medium">Burn complete!</p>
      )}

    </div>
  )
}
