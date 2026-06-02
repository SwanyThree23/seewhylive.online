import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:200, padding:32, textAlign:'center' }}>
          <AlertTriangle style={{ width:40, height:40, color:'#f59e0b', marginBottom:12 }} />
          <p style={{ fontWeight:600, fontSize:14, marginBottom:4 }}>Something went wrong</p>
          <p style={{ fontSize:12, color:'rgba(255,255,255,0.5)', marginBottom:16, maxWidth:280 }}>
            An unexpected error occurred in this section. Please try again.
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 14px', background:'transparent', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, color:'#fff', fontSize:12, cursor:'pointer' }}
          >
            <RefreshCw style={{ width:14, height:14 }} /> Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
