import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RotateCcw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error inside React Tree:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetStorage = () => {
    try {
      localStorage.clear();
    } catch {}
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-screen bg-[#05080f] text-gray-200 flex flex-col items-center justify-center p-6 font-mono select-none">
          <div className="max-w-xl w-full bg-[#0b121e] border-2 border-red-500/80 rounded-xl shadow-2xl p-6 space-y-5">
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-[#1e2d40] pb-3">
              <div className="p-2 bg-red-500/20 text-red-400 rounded-lg">
                <AlertOctagon className="w-8 h-8 animate-pulse" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white tracking-wider">OTS GRAPHICS EXCEPTION DETECTED</h1>
                <p className="text-xs text-red-400">System caught an unexpected UI runtime error</p>
              </div>
            </div>

            {/* Error Message Box */}
            <div className="bg-[#05090f] p-3 rounded border border-[#1a2636] space-y-1">
              <span className="text-[10px] text-gray-500 font-bold block">ERROR DETAILS:</span>
              <pre className="text-xs text-amber-300 font-mono overflow-x-auto whitespace-pre-wrap">
                {this.state.error?.toString() || 'Unknown Error'}
              </pre>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={this.handleReload}
                className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg text-xs transition-colors shadow"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reload Simulator</span>
              </button>

              <button
                onClick={this.handleResetStorage}
                className="flex items-center justify-center gap-2 py-2 px-4 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 font-bold rounded-lg text-xs transition-colors"
                title="Reset layout cache and restart"
              >
                <Home className="w-4 h-4" />
                <span>Reset Cache & Restart</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
