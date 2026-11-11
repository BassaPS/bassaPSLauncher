package consoleService

import (
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
)

type testAuthorizer struct{ err error }

func (a testAuthorizer) AuthorizeAdmin() error { return a.err }

func TestConsoleAuthorization(t *testing.T) {
	for _, tc := range []struct {
		name    string
		auth    AdminAuthorizer
		allowed bool
	}{
		{"uninitialized", nil, false},
		{"regular user", testAuthorizer{errors.New("access denied")}, false},
		{"administrator", testAuthorizer{}, true},
	} {
		t.Run(tc.name, func(t *testing.T) {
			calls := 0
			server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				calls++
				w.Header().Set("Content-Type", "application/json")
				w.Write([]byte(`{"retcode":0,"output":"ok"}`))
			}))
			defer server.Close()
			service := New(tc.auth)
			ok, _, _ := service.Execute(server.URL, 1, "secret", "status")
			if ok != tc.allowed {
				t.Fatalf("Execute allowed = %v", ok)
			}
			ok, _, _ = service.SelfReset(server.URL, 1, "secret")
			if ok != tc.allowed {
				t.Fatalf("SelfReset allowed = %v", ok)
			}
			expected := 0
			if tc.allowed {
				expected = 2
			}
			if calls != expected {
				t.Fatalf("upstream calls = %d, want %d", calls, expected)
			}
		})
	}
}

func TestConsoleRejectsHTTPError(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusForbidden)
		w.Write([]byte(`{"retcode":0}`))
	}))
	defer server.Close()
	ok, _, _ := New(testAuthorizer{}).Execute(server.URL, 1, "secret", "status")
	if ok {
		t.Fatal("HTTP 403 must not be accepted")
	}
}
