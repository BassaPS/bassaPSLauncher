//go:build windows

// Package elevation ensures the launcher and its suspended game process share
// an elevated token. Shell-launching only the game would lose injection support.
package elevation

import (
	"errors"
	"fmt"
	"os"
	"strings"
	"unsafe"

	"golang.org/x/sys/windows"
)

const relaunchFlag = "--bassaps-uac-relaunch"

// Ensure runs before any proxy, account or UI services are created. A true
// result means a replacement process was started and this process must exit.
func Ensure() (bool, error) {
	return ensure(windows.GetCurrentProcessToken().IsElevated(), os.Args[1:], relaunch)
}

func ensure(elevated bool, args []string, launch func([]string) error) (bool, error) {
	if elevated {
		return false, nil
	}
	for _, arg := range args {
		if arg == relaunchFlag {
			return false, errors.New("Windows did not grant administrator rights; remove any RunAsInvoker compatibility override and restart the launcher")
		}
	}
	next := append(append([]string(nil), args...), relaunchFlag)
	if err := launch(next); err != nil {
		return false, fmt.Errorf("request administrator rights: %w", err)
	}
	return true, nil
}

// quoteArgs passes arguments directly to ShellExecuteEx, without cmd/PowerShell.
func quoteArgs(args []string) string {
	escaped := make([]string, len(args))
	for i, arg := range args {
		escaped[i] = windows.EscapeArg(arg)
	}
	return strings.Join(escaped, " ")
}

type shellExecuteInfo struct {
	size       uint32
	mask       uint32
	window     windows.Handle
	verb       *uint16
	file       *uint16
	parameters *uint16
	directory  *uint16
	show       int32
	instance   windows.Handle
	idList     uintptr
	class      *uint16
	classKey   windows.Handle
	hotKey     uint32
	icon       windows.Handle
	process    windows.Handle
}

func relaunch(args []string) error {
	exe, err := os.Executable()
	if err != nil {
		return err
	}
	cwd, err := os.Getwd()
	if err != nil {
		return err
	}
	file, err := windows.UTF16PtrFromString(exe)
	if err != nil {
		return err
	}
	parameters, err := windows.UTF16PtrFromString(quoteArgs(args))
	if err != nil {
		return err
	}
	directory, err := windows.UTF16PtrFromString(cwd)
	if err != nil {
		return err
	}
	info := shellExecuteInfo{
		mask: 0x40 | 0x100, // SEE_MASK_NOCLOSEPROCESS | SEE_MASK_NOASYNC
		verb: windows.StringToUTF16Ptr("runas"), file: file,
		parameters: parameters, directory: directory, show: 1,
	}
	info.size = uint32(unsafe.Sizeof(info))
	result, _, callErr := windows.NewLazySystemDLL("shell32.dll").NewProc("ShellExecuteExW").Call(uintptr(unsafe.Pointer(&info)))
	if result == 0 {
		if callErr == windows.ERROR_SUCCESS {
			return errors.New("ShellExecuteExW did not start the elevated launcher")
		}
		return callErr
	}
	if info.process != 0 {
		_ = windows.CloseHandle(info.process)
	}
	return nil
}
