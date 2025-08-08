import type { NavigateFunction } from 'react-router-dom';

export function safeBack(navigate: NavigateFunction, fallback: string = '/dashboard') {
  try {
    const idx = (window.history.state && (window.history.state as any).idx) || 0;
    if (idx > 0) navigate(-1);
    else navigate(fallback, { replace: true });
  } catch {
    navigate(fallback, { replace: true });
  }
}


