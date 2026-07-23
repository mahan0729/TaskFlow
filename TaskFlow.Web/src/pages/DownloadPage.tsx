/**
 * DownloadPage — lets any authenticated user download the TaskFlow desktop app.
 */

const WINDOWS_URL = 'https://taskflowstorage.blob.core.windows.net/downloads/TaskFlow-Setup.exe';

export default function DownloadPage() {
  return (
    <div className="max-w-2xl space-y-6">

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Desktop App</h1>
        <p className="text-sm text-gray-500 mt-1">
          Download TaskFlow for your desktop and work seamlessly without a browser.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">

        {/* Windows */}
        <div className="card flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.549H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-gray-900">Windows</p>
              <p className="text-xs text-gray-400">Windows 10 / 11 (64-bit)</p>
            </div>
          </div>

          <a
            href={WINDOWS_URL}
            className="btn-primary text-center text-sm"
            download
          >
            Download for Windows
          </a>

          <div>
            <p className="text-xs font-semibold text-gray-700 mb-2">Installation</p>
            <ol className="space-y-1 text-xs text-gray-500 list-decimal list-inside leading-relaxed">
              <li>Download the installer (.exe) above.</li>
              <li>If Windows SmartScreen appears, click <strong>More info</strong> → <strong>Run anyway</strong>.</li>
              <li>Follow the setup wizard — TaskFlow launches automatically.</li>
              <li>Sign in with your existing TaskFlow credentials.</li>
            </ol>
          </div>
        </div>

        {/* Mac — coming soon */}
        <div className="card flex flex-col gap-4 opacity-60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-gray-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-gray-900">macOS</p>
              <p className="text-xs text-gray-400">macOS 12+</p>
            </div>
          </div>

          <button disabled className="btn-secondary text-center text-sm cursor-not-allowed">
            Coming Soon
          </button>

          <p className="text-xs text-gray-400">
            The macOS desktop app is currently in development and will be available in a future release.
          </p>
        </div>

      </div>

      <div className="card bg-blue-50 border-blue-100">
        <p className="text-sm font-semibold text-blue-900 mb-1">Already using the desktop app?</p>
        <p className="text-xs text-blue-700">
          TaskFlow automatically checks for updates when you launch the app. If a new version is available,
          it will download and restart with the latest features.
        </p>
      </div>

    </div>
  );
}
