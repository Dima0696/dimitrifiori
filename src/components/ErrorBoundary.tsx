import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: any;
  errorInfo?: any;
}

export class ErrorBoundary extends React.Component<{children: React.ReactNode}, ErrorBoundaryState> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    // Log error (puoi inviare a un servizio esterno)
    console.error('ErrorBoundary caught:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 32, color: 'red', background: '#fff3f3', borderRadius: 12, margin: 32 }}>
          <h2>Si è verificato un errore imprevisto.</h2>
          <p>Ricarica la pagina o contatta l’assistenza tecnica.</p>
          {this.state.error && <pre style={{ color: '#b00', fontSize: 13 }}>{this.state.error.toString()}</pre>}
        </div>
      );
    }
    return this.props.children;
  }
} 