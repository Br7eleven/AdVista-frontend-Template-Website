import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="p-4 bg-white dark:bg-dark-600 rounded-lg shadow-sm border border-gray-100 dark:border-dark-500">
          <h2 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">Something went wrong</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            The component couldn't be displayed. Please try refreshing the page.
          </p>
          <details className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-dark-700 p-2 rounded">
            <summary>Error details</summary>
            <pre className="mt-2 overflow-auto">{this.state.error?.toString()}</pre>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
