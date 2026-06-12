package main

import (
	"context"
	"fmt"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// App struct
type App struct {
	ctx context.Context
}
type ProgressReader struct {
	io.Reader
	TotalRead  int64
	OnProgress func(bytesRead int64)
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

func (a *App) FormatUSB(devicePath string, password string) error {
	if !strings.HasPrefix(devicePath, "/dev/") {
		return fmt.Errorf("invalid device path")
	}

	cmd1 := exec.Command("sudo", "-S", "umount", devicePath)
	cmd1.Stdin = strings.NewReader(password + "\n")
	cmd1.CombinedOutput()

	cmd2 := exec.Command("sudo", "-S", "mkfs.vfat", "-F", "32", devicePath)
	cmd2.Stdin = strings.NewReader(password + "\n")
	output2, err := cmd2.CombinedOutput()
	if err != nil {
		return fmt.Errorf("format failed: %s", string(output2))
	}
	return nil
}

func (pr *ProgressReader) Read(p []byte) (int, error) {
	n, err := pr.Reader.Read(p)

	if n > 0 {
		pr.TotalRead += int64(n)
		pr.OnProgress(pr.TotalRead)
	}
	return n, err
}

func (a *App) BurnISO(input string, output string) error {

	isoFile, err := os.Open(input)

	if err != nil {
		return fmt.Errorf("iso file failed to open: %s", err)
	}
	defer isoFile.Close()

	info, _ := isoFile.Stat()
	totalSize := info.Size()

	device, err := os.OpenFile(output, os.O_WRONLY, 0)
	if err != nil {
		return fmt.Errorf("device failed to open: %s", err)
	}
	defer device.Close()

	_, err = io.Copy(device, &ProgressReader{
		Reader: isoFile,
		OnProgress: func(bytesRead int64) {
			percent := bytesRead * 100 / totalSize
			runtime.EventsEmit(a.ctx, "burn:progress", percent)
		},
	})

	if err != nil {
		return fmt.Errorf("burn failed: %s", err)
	}

	return nil
}


func (a *App) OpenFileDialog() (string, error) {
		return runtime.OpenFileDialog(a.ctx, runtime.OpenDialogOptions{
				Filters: []runtime.FileFilter{
						{DisplayName: "ISO Files", Pattern: "*.iso"},
				},
		})
}