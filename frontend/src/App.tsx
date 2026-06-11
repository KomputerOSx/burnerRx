import { Button } from "@/components/ui/button"
import { ListDir } from "../wailsjs/go/main/App"
import { useEffect, useState } from "react"
function App() {

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
    <div className="flex min-h-svh flex-col items-center justify-center">
      <h1>{currentDir}</h1>
      <Button variant={"destructive"} onClick={() => setCurrentDir('/home/')}>Reset</Button>
      <Button onClick={() => setCurrentDir(() => (currentDir.replace(/ramyar\/$/, '')))}>Go Back</Button>

      {items.sort().map((item)=> (
        <Button variant={"outline"} key={item} onClick={() => setCurrentDir(currentDir + item + '/')}>{item}</Button>
      ))}

    </div>
  )
}

export default App
