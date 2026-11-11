package gitService

import (
	"cyrene-launcher/pkg/constant"
	"net/http"
	"testing"
)

type rejectLauncherNetwork struct{ t *testing.T }

func (r rejectLauncherNetwork) RoundTrip(*http.Request) (*http.Response, error) {
	r.t.Fatal("disabled launcher updater must not make network requests")
	return nil, nil
}

func TestUnconfiguredLauncherUpdaterCannotReplaceFork(t *testing.T) {
	if constant.LauncherGitUrl != "" {
		t.Skip("BASSAPS release source configured")
	}
	previous := http.DefaultTransport
	http.DefaultTransport = rejectLauncherNetwork{t}
	t.Cleanup(func() { http.DefaultTransport = previous })
	service := &GitService{}
	ok, version, message := service.GetLatestLauncherVersion()
	if !ok || version != constant.CurrentLauncherVersion || message != "" {
		t.Fatalf("unexpected disabled update check: %v %q %q", ok, version, message)
	}
	for _, tag := range []string{"", "latest", "v99.0.0"} {
		if ok, message := service.UpdateLauncherProgress(tag); ok || message == "" {
			t.Fatalf("disabled update accepted tag %q", tag)
		}
	}
}
