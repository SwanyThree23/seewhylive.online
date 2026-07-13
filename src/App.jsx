import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Suspense } from 'react';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { BackgroundProvider } from '@/lib/BackgroundManager';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

// Pages that render full-screen without nav/sidebar chrome
const NO_LAYOUT_PAGES = new Set([
  'BroadcastStudio', 'LiveRoom', 'WatchParty', 'HybridStreamRoom',
  'AudioRoom', 'ControlRoom', 'Greenroom', 'GreenroomEnhanced',
  'GoLive', 'Room', 'Welcome', 'CoverPage', 'BackPage',
  'SeeWhyLIVEv17', 'SeeWhyLIVEv36', 'SeeWhyLIVEv37',
  'Onboarding', 'GuestJoin', 'PKBattlePage', 'Login',
]);

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0E0C09' }}>
        <div style={{ width: 32, height: 32, border: '3px solid rgba(201,168,76,.2)', borderTopColor: '#C9A84C', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#080B18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 32, height: 32, border: '3px solid rgba(212,175,55,0.2)', borderTopColor: '#D4AF37', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    }>
    <Routes>
      <Route path="/" element={
        <LayoutWrapper currentPageName={mainPageKey}>
          <MainPage />
        </LayoutWrapper>
      } />
      {Object.entries(Pages).map(([path, Page]) => (
        <Route
          key={path}
          path={`/${path}`}
          element={
            NO_LAYOUT_PAGES.has(path) ? <Page /> : (
              <LayoutWrapper currentPageName={path}>
                <Page />
              </LayoutWrapper>
            )
          }
        />
      ))}
      {/* Lowercase / short-path aliases */}
      <Route path="/messages"    element={<LayoutWrapper currentPageName="Messages"><Pages.Messages /></LayoutWrapper>} />
      <Route path="/onboarding"  element={<Pages.Onboarding />} />
      <Route path="/clips"       element={<LayoutWrapper currentPageName="ClipsLibrary"><Pages.ClipsLibrary /></LayoutWrapper>} />
      <Route path="/newsletter"  element={<LayoutWrapper currentPageName="NewsletterHub"><Pages.NewsletterHub /></LayoutWrapper>} />
      <Route path="/login"       element={<Pages.Login />} />
      <Route path="*"            element={<PageNotFound />} />
    </Routes>
    </Suspense>
  );
};


function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <BackgroundProvider>
        <Router>
          <NavigationTracker />
          <Routes>
            <Route path="/login" element={<Pages.Login />} />
            <Route path="/*" element={<AuthenticatedApp />} />
          </Routes>
        </Router>
        <Toaster />
        </BackgroundProvider>
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
