import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import PanelStandalonePage from './pages/PanelStandalonePage.jsx'
import PanelEgressView from './pages/PanelEgressView.jsx'

var path = window.location.pathname;
var panelEgressMatch = path.match(/^\/panel\/([^/]+)\/egress-view\/?$/);
var panelSlugMatch = !panelEgressMatch && path.match(/^\/panel\/([^/]+)\/?$/);

var rootEl;
if (panelEgressMatch) {
  rootEl = React.createElement(PanelEgressView, { slug: panelEgressMatch[1] });
} else if (panelSlugMatch) {
  rootEl = React.createElement(PanelStandalonePage, { slug: panelSlugMatch[1] });
} else {
  rootEl = React.createElement(App);
}

ReactDOM.createRoot(document.getElementById('root')).render(
  React.createElement(React.StrictMode, null, rootEl)
)
