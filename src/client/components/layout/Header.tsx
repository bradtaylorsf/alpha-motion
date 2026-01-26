import { Link } from 'react-router-dom';

interface HeaderProps {
  showBackButton?: boolean;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function Header({ showBackButton, title, subtitle, actions }: HeaderProps) {
  return (
    <header className="flex items-center justify-between border-b border-border px-6 py-4">
      <div className="flex items-center gap-3">
        {showBackButton ? (
          <>
            <Link
              to="/"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-sm font-medium">Back to Board</span>
            </Link>
            {title && (
              <div className="flex items-center gap-2 ml-4 pl-4 border-l border-border">
                <h1 className="text-lg font-semibold text-foreground">{title}</h1>
                {subtitle && (
                  <span className="text-sm text-muted-foreground">/ {subtitle}</span>
                )}
              </div>
            )}
          </>
        ) : (
          <Link to="/" className="flex items-center">
            <img src="/logo-dark.png" alt="Answera" className="h-8" />
          </Link>
        )}
      </div>

      <div className="flex items-center gap-4">
        {actions && (
          <div className="flex items-center gap-2">
            {actions}
          </div>
        )}

        {showBackButton ? (
          <a
            href="https://www.remotion.dev/docs/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
            <span className="text-sm font-medium">API Docs</span>
          </a>
        ) : (
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <svg
                className="h-5 w-5 text-primary-foreground"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-base font-bold text-foreground">Remotion Moodboard</h1>
              <p className="text-xs text-muted-foreground">AI-powered animation ideas</p>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
