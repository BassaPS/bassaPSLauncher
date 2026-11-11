//go:build windows

package elevation

import (
	"errors"
	"golang.org/x/sys/windows"
	"reflect"
	"testing"
)

func TestEnsureRequestsElevationOnlyWhenNeeded(t *testing.T) {
	calls := 0
	launch := func(args []string) error { calls++; return nil }
	if restarted, err := ensure(true, nil, launch); restarted || err != nil || calls != 0 {
		t.Fatalf("already elevated: %v %v calls=%d", restarted, err, calls)
	}
	if restarted, err := ensure(false, nil, launch); !restarted || err != nil || calls != 1 {
		t.Fatalf("request elevation: %v %v calls=%d", restarted, err, calls)
	}
	if restarted, err := ensure(false, []string{relaunchFlag}, launch); restarted || err == nil || calls != 1 {
		t.Fatalf("relaunch loop: %v %v calls=%d", restarted, err, calls)
	}
}

func TestEnsurePreservesArgumentsWithoutMutatingCaller(t *testing.T) {
	args := make([]string, 2, 4)
	args[0] = "--name"
	args[1] = "a path with spaces"
	var received []string
	restarted, err := ensure(false, args, func(next []string) error { received = next; return nil })
	if !restarted || err != nil || !reflect.DeepEqual(received, []string{"--name", "a path with spaces", relaunchFlag}) {
		t.Fatalf("args: %#v %v", received, err)
	}
	if args[:cap(args)][2] != "" {
		t.Fatal("caller backing array mutated")
	}
}

func TestCancelledUACIsNotReportedAsSuccessfulRelaunch(t *testing.T) {
	restarted, err := ensure(false, nil, func([]string) error { return windows.ERROR_CANCELLED })
	if restarted || !errors.Is(err, windows.ERROR_CANCELLED) {
		t.Fatalf("cancel: %v %v", restarted, err)
	}
}

func TestRelaunchArgumentsRoundTrip(t *testing.T) {
	args := []string{"", "space path", `quoted"value`, `C:\path with spaces\`, `literal&not|a>shell`}
	actual, err := windows.DecomposeCommandLine(`launcher.exe ` + quoteArgs(args))
	if err != nil || !reflect.DeepEqual(actual[1:], args) {
		t.Fatalf("quoted arguments: %#v %v", actual, err)
	}
}
