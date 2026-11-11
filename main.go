package main

import (
	"embed"
	_ "embed"

	accountService "cyrene-launcher/internal/account-service"
	appService "cyrene-launcher/internal/app-service"
	consoleService "cyrene-launcher/internal/console-service"
	diffService "cyrene-launcher/internal/diff-service"
	fsService "cyrene-launcher/internal/fs-service"
	gitService "cyrene-launcher/internal/git-service"
	handbookService "cyrene-launcher/internal/handbook-service"
	languageService "cyrene-launcher/internal/language-service"
	march7thHoneyService "cyrene-launcher/internal/march7thhoney-service"
	newsService "cyrene-launcher/internal/news-service"

	"cyrene-launcher/pkg/constant"
	"cyrene-launcher/pkg/elevation"
	"errors"
	"fmt"
	"log"
	"os"
	"path/filepath"

	"golang.org/x/sys/windows"

	"github.com/wailsapp/wails/v3/pkg/application"
	"github.com/wailsapp/wails/v3/pkg/events"
)

//go:embed all:frontend/dist
var assets embed.FS

//go:embed all:assets
var tools embed.FS

func fileExists(path string) bool {
	info, err := os.Stat(path)
	return err == nil && !info.IsDir()
}

func extractFile(embedPath, outPath string) error {
	data, err := tools.ReadFile(embedPath)
	if err != nil {
		return fmt.Errorf("can't read file embed %s: %w", embedPath, err)
	}

	if err := os.MkdirAll(filepath.Dir(outPath), 0755); err != nil {
		return fmt.Errorf("can't create directory %s: %w", filepath.Dir(outPath), err)
	}

	return os.WriteFile(outPath, data, 0755)
}

func main() {
	// Keep the entire proxy/injection lifecycle in the elevated process.
	// This also covers development builds that have no Windows manifest.
	relaunched, elevationErr := elevation.Ensure()
	if elevationErr != nil {
		if !errors.Is(elevationErr, windows.ERROR_CANCELLED) {
			_, _ = windows.MessageBox(0,
				windows.StringToUTF16Ptr("ゲーム起動には管理者権限が必要です。\nランチャーの起動時に表示されるUACを許可してください。\n\n"+elevationErr.Error()),
				windows.StringToUTF16Ptr("BASSAPS Launcher"), windows.MB_OK|windows.MB_ICONERROR)
		}
		return
	}
	if relaunched {
		return
	}
	// Extract required files
	for outPath, embedPath := range constant.RequiredFiles {
		if !fileExists(outPath.String()) {
			err := extractFile(embedPath, outPath.String())
			if err != nil {
				fmt.Println("can't copy file:", err)
			}
		}
	}

	// Remove old executable
	exePath, err := os.Executable()
	if err == nil {
		dir := filepath.Dir(exePath)
		base := filepath.Base(exePath)
		oldPath := filepath.Join(dir, "."+base+".old")

		fmt.Println("Old executable path:", oldPath)
		os.Remove(oldPath)
	}
	// Load app icon once, reused for the window (taskbar / titlebar / alt-tab)
	// and the system tray.
	iconBytes, _ := tools.ReadFile("assets/appicon.png")

	// CyreneHook.dll: in-process hook DLL injected into the game in
	// March7thHoney mode (built from HSR-Patch). Missing file → empty bytes
	// → service reports a clear error when the user tries to launch.
	dllBytes, _ := tools.ReadFile("assets/CyreneHook.dll")

	// Shared account service: the local-server launch hands its login token to honey.
	acct := accountService.New(constant.WebBaseURL)

	// Create application
	app := application.New(application.Options{
		Name:        "cyrene-launcher",
		Description: "BASSAPS Launcher",
		Icon:        iconBytes,
		Services: []application.Service{
			application.NewService(&fsService.FSService{}),
			application.NewService(&languageService.LanguageService{}),
			application.NewService(&gitService.GitService{}),
			application.NewService(&diffService.DiffService{}),
			application.NewService(&appService.AppService{}),
			application.NewService(&newsService.NewsService{}),
			application.NewService(consoleService.New(acct)),
			application.NewService(&handbookService.HandbookService{}),
			application.NewService(march7thHoneyService.New(dllBytes, acct)),
			application.NewService(acct),
		},
		Assets: application.AssetOptions{
			Handler: application.AssetFileServerFS(assets),
		},
		Mac: application.MacOptions{
			ApplicationShouldTerminateAfterLastWindowClosed: true,
		},
	})

	// Create window
	window := app.Window.NewWithOptions(application.WebviewWindowOptions{
		Title: "BASSAPS Launcher",
		Mac: application.MacWindow{
			InvisibleTitleBarHeight: 50,
			Backdrop:                application.MacBackdropTranslucent,
			TitleBar:                application.MacTitleBarHiddenInset,
		},
		BackgroundColour: application.NewRGB(17, 17, 19),
		Width:            1280,
		Height:           720,
		MinWidth:         320,
		MinHeight:        560,
		URL:              "/",
		DevToolsEnabled:  false,
		Frameless:        true,
		DisableResize:    false,
	})

	systemTray := app.SystemTray.New()
	systemTray.SetIcon(iconBytes)
	systemTray.SetTooltip("BASSAPS Launcher")

	// Attach the window to the system tray
	menu := application.NewMenu()
	menu.Add("Open").OnClick(func(ctx *application.Context) {
		window.Show()
	})
	menu.Add("Quit").OnClick(func(ctx *application.Context) {
		app.Quit()
	})

	systemTray.SetMenu(menu)

	window.RegisterHook(events.Common.WindowClosing, func(e *application.WindowEvent) {
		app.Event.Emit("window:close")
		e.Cancel()
	})

	err = app.Run()
	if err != nil {
		log.Fatal(err)
	}
}
