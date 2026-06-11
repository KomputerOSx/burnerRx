import { Button } from "@/components/ui/button"
import { ListDir } from "../wailsjs/go/main/App"
import { useEffect, useState } from "react"
import { useNavigate } from "@tanstack/react-router"
function App() {

  const navigate = useNavigate()
  const [items, setItems] = useState<string[]>([])
  const [currentDir, setCurrentDir] = useState<string>('/home/')

  useEffect(() => {
    async function load() {
      const result = await ListDir(currentDir)
      setItems(result)
    }
    load()
  }, [currentDir])

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-2">
      <h1>{currentDir}</h1>
      <Button onClick={() => navigate({ to: "/about" })}>About Page</Button>
      <Button onClick={() => navigate({ to: "/usbDevices" })}>USB Devices</Button>
      <Button variant={"destructive"} onClick={() => setCurrentDir('/home/')}>Reset</Button>
      <Button onClick={() => setCurrentDir(() => (currentDir.replace(/ramyar\/$/, '')))}>Go Back</Button>

      {items.sort().map((item)=> (
        <Button variant={"outline"} key={item} className={"shadow"}onClick={() => setCurrentDir(currentDir + item + '/')}>{item}</Button>
      ))}

    </div>
  )
}

export default App
