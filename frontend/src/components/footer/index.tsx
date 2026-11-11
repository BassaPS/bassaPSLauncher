import magicLicense from "../../../public/licenses/MagicUI.txt?raw";
import obsidianLicense from "../../../public/licenses/ObsidianUI.txt?raw";
import { useRef, useId } from "react";
import { X, ExternalLink } from "lucide-react";
import licenseText from "../../../../LICENSE?raw";
import { AppService } from "@bindings/cyrene-launcher/internal/app-service";
import { toast } from "react-toastify";

export default function Credits() {
  const titleId = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const openSource = async () => {
    try {
      await AppService.OpenURL("https://github.com/Mar7thDev/CyreneLauncher");
    } catch {
      toast.error("リポジトリを開けませんでした。");
    }
  };
  return (
    <>
      <button
        className="bassaps-credits"
        onClick={() => dialog.current?.showModal()}
      >
        Based on Cyrene Launcher <span>· MIT License</span>
      </button>
      <dialog
        ref={dialog}
        className="bassaps-license-dialog"
        aria-labelledby={titleId}
      >
        <header>
          <h2 id={titleId}>クレジット・ライセンス</h2>
          <form method="dialog">
            <button aria-label="閉じる" autoFocus>
              <X size={18} />
            </button>
          </form>
        </header>
        <div className="bassaps-license-dialog-body">
          <p>
            BASSAPS Launcherは、Mar7thDev / Cyrene
            Launcherをベースにしています。
          </p>
          <button className="bassaps-source-link" onClick={openSource}>
            <ExternalLink size={14} />
            github.com/Mar7thDev/CyreneLauncher
          </button>
          <pre className="bassaps-license" tabIndex={0}>
            {licenseText}
          </pre>
          <details>
            <summary>Magic UI (MIT)</summary>
            <pre className="bassaps-license">{magicLicense}</pre>
          </details>
          <details>
            <summary>ObsidianUI (MIT)</summary>
            <pre className="bassaps-license">{obsidianLicense}</pre>
          </details>
        </div>
      </dialog>
    </>
  );
}
