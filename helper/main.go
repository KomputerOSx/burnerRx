package main

import (
	"fmt"
	"io"
	"os"
	"os/exec"
	"strings"
)

func main() {
	if len(os.Args) < 2 {
		fatalf("usage: burnerrx-helper <burn|format> [args...]")
	}
	switch os.Args[1] {
	case "burn":
		// burn <iso> <device> [--format]
		if len(os.Args) < 4 {
			fatalf("usage: burnerrx-helper burn <iso> <device> [--format]")
		}
		doFormat := len(os.Args) >= 5 && os.Args[4] == "--format"
		if doFormat {
			if err := format(os.Args[3]); err != nil {
				fatalf("%s", err)
			}
		}
		if err := burn(os.Args[2], os.Args[3]); err != nil {
			fatalf("%s", err)
		}
	case "format":
		if len(os.Args) < 3 {
			fatalf("usage: burnerrx-helper format <device>")
		}
		if err := format(os.Args[2]); err != nil {
			fatalf("%s", err)
		}
	default:
		fatalf("unknown command: %s", os.Args[1])
	}
}

func fatalf(msg string, args ...any) {
	fmt.Fprintf(os.Stderr, msg+"\n", args...)
	os.Exit(1)
}

func burn(isoPath, devicePath string) error {
	isoFile, err := os.Open(isoPath)
	if err != nil {
		return fmt.Errorf("failed to open iso: %s", err)
	}
	defer isoFile.Close()

	info, err := isoFile.Stat()
	if err != nil {
		return err
	}
	totalSize := info.Size()

	device, err := os.OpenFile(devicePath, os.O_WRONLY, 0)
	if err != nil {
		return fmt.Errorf("failed to open device: %s", err)
	}
	defer device.Close()

	buf := make([]byte, 1024*1024)
	var written int64
	for {
		n, readErr := isoFile.Read(buf)
		if n > 0 {
			if _, werr := device.Write(buf[:n]); werr != nil {
				return fmt.Errorf("write failed: %s", werr)
			}
			written += int64(n)
			percent := written * 100 / totalSize
			fmt.Printf("PROGRESS:%d\n", percent)
		}
		if readErr == io.EOF {
			break
		}
		if readErr != nil {
			return fmt.Errorf("read failed: %s", readErr)
		}
	}
	return nil
}

func format(devicePath string) error {
	if !strings.HasPrefix(devicePath, "/dev/") {
		return fmt.Errorf("invalid device path: %s", devicePath)
	}

	blockName := strings.TrimPrefix(devicePath, "/dev/")
	entries, _ := os.ReadDir("/sys/class/block")
	for _, e := range entries {
		if strings.HasPrefix(e.Name(), blockName) && e.Name() != blockName {
			exec.Command("umount", "/dev/"+e.Name()).CombinedOutput()
		}
	}
	exec.Command("umount", devicePath).CombinedOutput()

	out, err := exec.Command("mkfs.vfat", "-I", "-F", "32", devicePath).CombinedOutput()
	if err != nil {
		return fmt.Errorf("mkfs.vfat failed: %s", string(out))
	}
	return nil
}
