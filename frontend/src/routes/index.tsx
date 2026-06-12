import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { BurnISO, FormatUSB, ListUSB, OpenFileDialog } from '../../wailsjs/go/main/App'
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
  const [progress, setProgress] = useState<number>(0)
  const [burning, setBurning] = useState(false)
  const [formatting, setFormatting] = useState(false)
  const [isoFullPath, setIsoFullPath] = useState<string>('')
  const [formatError, setFormatError] = useState<string>('')
  const [formatted, setFormatted] = useState(false)

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
  const ready = selectedDevice && selectedISO && isValidISO && (isCompatible || formatted)

  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center gap-12 px-8 bg-background">

      <Button
        variant="outline"
        size="sm"
        className="absolute top-6 right-6"
        onClick={() => navigate({ to: '/about' })}
      >
        About
      </Button>

      {/* Header */}
      <div className="text-center flex flex-col gap-2">
        <div className="text-5xl tracking-tight" style={{ fontFamily: 'Mogilte, sans-serif' }}>
          Burner<span className="text-primary">Rx</span>
        </div>
        <p className="text-sm text-muted-foreground">Flash ISO images to USB drives</p>
      </div>

      {/* Main card */}
      <div className="w-4/5 border border-border rounded-xl p-8 flex flex-col gap-8">

        <div className="grid grid-cols-3 gap-6">

          {/* USB Device */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                USB Device
              </label>
              <button onClick={() => void loadDevices()} className="text-xs text-primary underline">
                Refresh
              </button>
            </div>
            <select
              className="border border-border rounded-md px-3 py-2 bg-background text-foreground text-sm h-10"
              value={selectedDevice}
              onChange={(e) => { setSelectedDevice(e.target.value); setFormatted(false); setFormatError('') }}
            >
              <option value="">Choose device...</option>
              {devices.map((d, i) => (
                <option key={i} value={d.devicePath}>
                  {d.product || d.blockDevice} {d.manufacturer ? `(${d.manufacturer})` : ''} — {d.capacity}
                </option>
              ))}
            </select>
          </div>

          {/* ISO File */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              ISO File
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
              {selectedISO || 'Browse...'}
            </button>
            {selectedISO && (
              <p className="text-xs text-muted-foreground truncate">{isoFullPath}</p>
            )}
            {selectedISO && !isValidISO && (
              <p className="text-xs text-destructive">File must be a .iso image</p>
            )}
          </div>

          {/* Flash */}
          <div className="flex flex-col gap-2 justify-end">
            <div className="flex gap-2">
              <Button
                className="flex-1"
                disabled={!ready || burning}
                variant={ready ? 'default' : 'outline'}
                onClick={async () => {
                  setBurning(true)
                  setProgress(0)
                  setFormatError('')
                  try {
                    await BurnISO(isoFullPath, selectedDevice, false)
                  } catch (e) {
                    setFormatError(String(e))
                  } finally {
                    setBurning(false)
                  }
                }}
              >
                {burning ? 'Burning...' : 'Flash'}
              </Button>
              <Button
                variant="destructive"
                onClick={() => { setSelectedDevice(''); setSelectedISO(''); setIsoFullPath(''); setFormatted(false); setProgress(0); setFormatError('') }}
              >
                Clear
              </Button>
            </div>
          </div>

        </div>

        {/* Format warning row */}
        {selectedDevice && !isCompatible && (
          <div className="flex flex-col gap-2 border-t border-border pt-4">
            <div className="flex items-center gap-4">
              <p className="text-xs text-destructive shrink-0">
                Format incompatible ({selectedDeviceInfo?.format || 'unknown'}) — must be FAT32.
              </p>
              {formatted ? (
                <p className="text-xs text-primary shrink-0">✓ Device formatted</p>
              ) : (
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={formatting || burning}
                  onClick={async () => {
                    setFormatting(true)
                    setFormatError('')
                    try {
                      await FormatUSB(selectedDevice)
                      setFormatted(true)
                    } catch (e) {
                      setFormatError(String(e))
                    } finally {
                      setFormatting(false)
                    }
                  }}
                >
                  {formatting ? 'Formatting...' : 'Format Device'}
                </Button>
              )}
            </div>
            {formatError && (
              <p className="text-xs text-destructive">{formatError}</p>
            )}
          </div>
        )}

        {/* Progress */}
        {(burning || progress > 0) && (
          <div className="flex flex-col gap-2">
            <div className="h-1.5 rounded-full bg-border overflow-hidden">
              <div
                className="h-1.5 rounded-full bg-primary transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{burning ? 'Writing...' : 'Complete'}</span>
              <span>{progress}%</span>
            </div>
          </div>
        )}

      </div>

      {!burning && progress === 100 && (
        <p className="text-sm text-primary font-medium tracking-wide">✓ Burn complete</p>
      )}

    </div>
  )
}
