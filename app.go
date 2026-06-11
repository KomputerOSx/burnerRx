package main

import (
	"context"
	"fmt"
	"os"

)

// App struct
type App struct {
	ctx context.Context
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

// Greet returns a greeting for the given name
func (a *App) Greet(name string) string {
	return fmt.Sprintf("Hello %s, It's show time!", name)
}

func (a *App) ListDir(path string) ([]string, error) {
      entries, err := os.ReadDir(path)
      if err != nil {
          return nil, err
      }
      names := make([]string, len(entries))
      for i, e := range entries {
          names[i] = e.Name()
      }
			return names, nil
}