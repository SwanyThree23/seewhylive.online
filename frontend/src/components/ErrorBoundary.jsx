'use strict';
import React from 'react';

var GOLD = '#C9A84C';
var BURG = '#800020';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
    this.handleReset = this.handleReset.bind(this);
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error: error };
  }

  componentDidCatch(error, info) {
    if (typeof console !== 'undefined') {
      console.error('[ErrorBoundary]', error, info);
    }
  }

  handleReset() {
    this.setState({ hasError: false, error: null });
  }

  render() {
    if (this.state.hasError) {
      return React.createElement(
        'div',
        {
          style: {
            display:        'flex',
            flexDirection:  'column',
            alignItems:     'center',
            justifyContent: 'center',
            padding:        '32px 20px',
            textAlign:      'center',
            gap:            16,
            minHeight:      200,
          }
        },
        React.createElement('div', { style: { fontSize: 36 } }, '⚠️'),
        React.createElement('div', {
          style: {
            fontFamily:    "'Bebas Neue',sans-serif",
            fontSize:      18,
            color:         GOLD,
            letterSpacing: 2,
          }
        }, 'TAB LOAD ERROR'),
        React.createElement('div', {
          style: {
            fontFamily: "'DM Mono',monospace",
            fontSize:   10,
            color:      '#7A6F90',
            maxWidth:   280,
            lineHeight: 1.6,
          }
        }, this.state.error ? String(this.state.error.message || this.state.error) : 'Something went wrong loading this tab.'),
        React.createElement(
          'button',
          {
            onClick: this.handleReset,
            style: {
              background:    'linear-gradient(135deg,' + BURG + ',#C01838)',
              border:        'none',
              borderRadius:  8,
              padding:       '9px 22px',
              color:         GOLD,
              fontFamily:    "'Barlow Condensed',sans-serif",
              fontWeight:    700,
              fontSize:      13,
              cursor:        'pointer',
              letterSpacing: 1,
            }
          },
          'RETRY'
        )
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
