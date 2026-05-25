import React from 'react';
import { Button } from '@/components/ui/button';
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
        <div className="flex flex-col items-center justify-center min-h-[200px] p-8 text-center">
          <AlertTriangle className="w-10 h-10 text-amber-500 mb-3" />
          <p className="font-semibold text-sm mb-1">Something went wrong</p>
          <p className="text-xs text-muted-foreground mb-4 max-w-xs">
            An unexpected error occurred in this section. Please try again.
          </p>
          <Button size="sm" variant="outline" onClick={() => this.setState({ hasError: false, error: null })}>
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Try Again
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}