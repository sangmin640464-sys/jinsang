import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleReset = () => {
    try {
      localStorage.removeItem('jj_logged_in_user_v1');
    } catch (e) {}
    window.location.reload();
  };

  private handleFullReset = () => {
    try {
      localStorage.clear();
    } catch (e) {}
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#f7f6f2] flex items-center justify-center p-4 text-slate-800">
          <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200 text-center space-y-4">
            <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto text-2xl font-bold">
              ⚠️
            </div>
            <h2 className="text-lg font-black text-slate-900">시스템 일시 오류 안내</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              화면을 렌더링하는 중 예기치 않은 오류가 발생했습니다.<br />
              아래 버튼을 눌러 세션을 재설정하시면 정상 복구됩니다.
            </p>
            {this.state.error && (
              <div className="p-3 bg-slate-50 rounded-xl text-left border border-slate-100 max-h-28 overflow-y-auto">
                <p className="text-[11px] font-mono text-rose-600 break-all">
                  {this.state.error.message || String(this.state.error)}
                </p>
              </div>
            )}
            <div className="space-y-2 pt-2">
              <button
                onClick={this.handleReset}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all"
              >
                로그인 세션 재설정 및 복구
              </button>
              <button
                onClick={this.handleFullReset}
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs transition-all"
              >
                전체 캐시 초기화 후 다시 시도
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
