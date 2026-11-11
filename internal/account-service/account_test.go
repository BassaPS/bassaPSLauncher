package accountService

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestAuthorizeAdminRevalidatesRole(t *testing.T) {
	role := "admin"
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/api/launcher/me" || r.Header.Get("Authorization") != "Bearer test-token" {
			t.Error("invalid verification request")
		}
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"user":{"role":"` + role + `"}}`))
	}))
	defer server.Close()
	service := New(server.URL)
	if service.AuthorizeAdmin() == nil {
		t.Fatal("anonymous access allowed")
	}
	service.token = "test-token"
	if err := service.AuthorizeAdmin(); err != nil {
		t.Fatal(err)
	}
	role = "user"
	service.profile = &Profile{Role: "admin"}
	if service.AuthorizeAdmin() == nil {
		t.Fatal("cached admin role bypassed remote demotion")
	}
	server.Close()
	if service.AuthorizeAdmin() == nil {
		t.Fatal("offline verification must fail closed")
	}
}
