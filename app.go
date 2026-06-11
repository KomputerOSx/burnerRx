package main

import (
	"context"
	"fmt"
	"os"
	"strings"
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

// func (a *App) ListUSB() ([]*gousb.Device, error) {
// 	ctx := gousb.NewContext()
// 	defer ctx.Close()


// 	devs, err := ctx.OpenDevices(func(desc *gousb.DeviceDesc) bool {
// 		return true
// 	})

// 	for _, d := range devs {
// 		defer d.Close()
// 	}

// 	if err != nil {
// 		fmt.Println(err)
// 	}

// 	return devs, nil
// }

func (a *App) ListUSB() ([]map[string]string, error) {
	entries, err := os.ReadDir("/sys/bus/usb/devices")
	if err != nil {
			return nil, err
	}

	var devices []map[string]string
	for _, e := range entries {
			base := "/sys/bus/usb/devices/" + e.Name()

			vendor := readFile(base + "/idVendor")
			product := readFile(base + "/idProduct")
			name := readFile(base + "/product")

			if vendor == "" {
					continue
			}

			devices = append(devices, map[string]string{
					"vendor":  vendor,
					"product": product,
					"name":    name,
			})
	}
	return devices, nil
}

func readFile(path string) string {
	b, err := os.ReadFile(path)
	if err != nil {
			return ""
	}
	return strings.TrimSpace(string(b))
}

