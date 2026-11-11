package newsService

import (
	"cyrene-launcher/pkg/constant"
	"io"
	"net/http"
	"strings"
	"testing"
)

type testTransport func(*http.Request) (*http.Response, error)

func (f testTransport) RoundTrip(r *http.Request) (*http.Response, error) { return f(r) }

func TestCustomNewsUsesPortalAndOrdersPinnedPosts(t *testing.T) {
	previous := http.DefaultTransport
	t.Cleanup(func() { http.DefaultTransport = previous })
	http.DefaultTransport = testTransport(func(r *http.Request) (*http.Response, error) {
		if r.URL.String() != "https://register.bassaps.com/api/launcher/news" || constant.AnnouncementUrl != r.URL.String() {
			t.Fatalf("unexpected server news source: %s", r.URL)
		}
		return &http.Response{StatusCode: 200, Body: io.NopCloser(strings.NewReader(`[
			{"id":"new","title":"Update","intro":"Read more","timestamp":200,"url":"https://register.bassaps.com/announcements#new"},
			{"id":"pin","title":"Pinned notice","intro":"Server maintenance","timestamp":100,"pinned":true,"url":"https://register.bassaps.com/announcements#pin"}
		]`))}, nil
	})
	ok, items, err := (&NewsService{}).GetCustomNews()
	if !ok || err != "" || len(items) != 2 {
		t.Fatalf("news read failed: %v %v %s", ok, items, err)
	}
	if items[0].ID != "pin" || items[1].ID != "new" || items[0].Intro != "Server maintenance" {
		t.Fatalf("unexpected server news ordering/content: %+v", items)
	}
}

func TestCustomNewsRejectsInvalidResponse(t *testing.T) {
	previous := http.DefaultTransport
	t.Cleanup(func() { http.DefaultTransport = previous })
	for _, body := range []string{`<html>error</html>`, `{"items":[]}`} {
		http.DefaultTransport = testTransport(func(r *http.Request) (*http.Response, error) {
			return &http.Response{StatusCode: 200, Body: io.NopCloser(strings.NewReader(body))}, nil
		})
		if ok, _, _ := (&NewsService{}).GetCustomNews(); ok {
			t.Fatalf("accepted invalid news response: %s", body)
		}
	}
}
