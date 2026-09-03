import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div 
          className="min-h-[200px] flex flex-col items-center justify-center p-6 bg-rose-50/70 border border-rose-200 rounded-3xl text-center m-4"
          dir="rtl"
        >
          <div className="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-600 mb-3 shadow-xs">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">
            {this.props.fallbackTitle || 'حدث خطأ غير متوقع أثناء العرض'}
          </h3>
          <p className="text-xs text-slate-600 max-w-md mb-4">
            {this.props.fallbackMessage || 'تم حماية التطبيق من الشاشة البيضاء. يمكنك إعادة المحاولة بالضغط على الزر أدناه.'}
          </p>
          {this.state.error?.message && (
            <p className="text-[11px] font-mono text-rose-700 bg-rose-100/60 px-3 py-1.5 rounded-lg mb-4 max-w-lg truncate">
              {this.state.error.message}
            </p>
          )}
          <button
            onClick={this.handleReset}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>إعادة تحميل التطبيق</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
