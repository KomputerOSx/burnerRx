package main

import (
	"bufio"
	"context"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

const helperPath = "/usr/local/bin/burnerrx-helper"

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

func (a *App) ListUSB() ([]map[string]string, error) {
	entries, err := os.ReadDir("/sys/class/block")
	if err != nil {
		return nil, err
	}

	var devices []map[string]string
	for _, e := range entries {
		syspath := "/sys/class/block/" + e.Name()

		resolved, err := filepath.EvalSymlinks(syspath)
		if err != nil {
			continue
		}

		if !strings.Contains(resolved, "/usb") {
			continue
		}

		if _, err := os.Stat("/sys/class/block/" + e.Name() + "/partition"); err == nil {
			continue
		}

		usbBase := findUSBInfo(resolved)
		devicePath := "/dev/" + e.Name()

		format, err := exec.Command("lsblk", "-f", "-o", "FSTYPE", devicePath, "--noheadings").Output()
		if err != nil {
			fmt.Printf("unable to obtain format of drive: %s", err)
		}

		sectors, _ := strconv.ParseInt(readFile("/sys/class/block/"+e.Name()+"/size"), 10, 64)
		capacityGB := fmt.Sprintf("%.1f GB", float64(sectors)*512/1e9)

		devices = append(devices, map[string]string{
			"blockDevice":  e.Name(),
			"devicePath":   devicePath,
			"manufacturer": readFile(usbBase + "/manufacturer"),
			"product":      readFile(usbBase + "/product"),
			"vendor":       readFile(usbBase + "/idVendor"),
			"capacity":     capacityGB,
			"format":       strings.TrimSpace(string(format)),
		})
	}
	return devices, nil
}

// walks up the sysfs path until it finds a directory with idVendor
func findUSBInfo(resolvedPath string) string {
	dir := resolvedPath
	for dir != "/" {
		if _, err := os.Stat(dir + "/idVendor"); err == nil {
			return dir
		}
		dir = filepath.Dir(dir)
	}
	return ""
}

func readFile(path string) string {
	b, err := os.ReadFile(path)
	if err != nil {
		return ""
	}
	return strings.TrimSpace(string(b))
}

func (a *App) FormatUSB(devicePath string) error {
	out, err := exec.Command("pkexec", helperPath, "format", devicePath).CombinedOutput()
	if err != nil {
		return fmt.Errorf("format failed: %s", strings.TrimSpace(string(out)))
	}
	return nil
}

func (a *App) BurnISO(input string, output string, formatFirst bool) error {
	args := []string{helperPath, "burn", input, output}
	if formatFirst {
		args = append(args, "--format")
	}
	cmd := exec.Command("pkexec", args...)
	stdout, err := cmd.StdoutPipe()
	if err != nil {
		return err
	}
	if err := cmd.Start(); err != nil {
		return fmt.Errorf("failed to start helper: %s", err)
	}

	scanner := bufio.NewScanner(stdout)
	for scanner.Scan() {
		line := scanner.Text()
		if strings.HasPrefix(line, "PROGRESS:") {
			var percent int64
			fmt.Sscanf(line, "PROGRESS:%d", &percent)
			runtime.EventsEmit(a.ctx, "burn:progress", percent)
		}
	}

	return cmd.Wait()
}


func (a *App) OpenFileDialog() (string, error) {
		return runtime.OpenFileDialog(a.ctx, runtime.OpenDialogOptions{
				Filters: []runtime.FileFilter{
						{DisplayName: "ISO Files", Pattern: "*.iso"},
				},
		})
}