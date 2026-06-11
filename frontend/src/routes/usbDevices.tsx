import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { ListUSB } from "../../wailsjs/go/main/App"

export const Route = createFileRoute('/usbDevices')({
  component: RouteComponent,
})

function RouteComponent() {

  const [devices, setDevices] = useState<Record<string, string>[]>([])

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
    <div>
      {devices.map((item, index) => (
        <div key={index}>
          {item.name || `${item.vendor}:${item.product}`}
        </div>
      ))}
    </div>
  )
}
