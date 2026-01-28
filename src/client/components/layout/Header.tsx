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
            <img src="/logo-dark.png" alt="AnswerAI" className="h-8" />
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
          <>
            <Link
              to="/settings"
              className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              title="Settings"
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
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </Link>
            <div className="flex items-center gap-2">
              <img src="/answer-motion-logo.png" alt="Answer Motion" className="h-8 w-8" />
              <span className="text-lg font-bold text-foreground">Motion</span>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
