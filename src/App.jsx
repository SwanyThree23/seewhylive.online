import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import PageNotFound from './lib/PageNotFound';
import Greenroom from './pages/Greenroom';
import ControlRoom from './pages/ControlRoom';
import ModerationDashboard from './pages/ModerationDashboard';
import Dashboard from './pages/Dashboard';
import OverlayBuilder from './pages/OverlayBuilder';
import LoyaltyHub from './pages/LoyaltyHub';
import ChallengesHub from './pages/ChallengesHub';
import PollManager from './pages/PollManager';
import PlatformShowcase from './pages/PlatformShowcase';
import Monetization from './pages/Monetization';
import Community from './pages/Community';
import OverlayEditor from './pages/OverlayEditor';
import CreatorDashboard from './pages/CreatorDashboard';
import Welcome from './pages/Welcome';
import PKBattle from './pages/PKBattle';
import CoverPage from './pages/CoverPage';
import BackPage from './pages/BackPage';
import SeeWhyLIVEv17 from './pages/SeeWhyLIVEv17';
import Messages from './pages/Messages';
import OnboardingPage from './pages/Onboarding';
import ClipsLibraryPage from './pages/ClipsLibrary';
import NewsletterHubPage from './pages/NewsletterHub';
import CreatorPublicProfile from './pages/CreatorPublicProfile';
import BroadcastStudio from './pages/BroadcastStudio';
import LiveRoom from './pages/LiveRoom';
import Login from './pages/Login';
import SocialExpo from './pages/SocialExpo';
import PodcastStudio from './pages/PodcastStudio';
import MultiPlatform from './pages/MultiPlatform';
import AIMusic from './pages/AIMusic';
import SeeWhyLIVEv36 from './pages/SeeWhyLIVEv36';
import StateVsState from './pages/StateVsState';
import TributeWall from './pages/TributeWall';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { BackgroundProvider } from '@/lib/BackgroundManager';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0E0C09' }}>
        <div style={{ width: 32, height: 32, border: '3px solid rgba(201,168,76,.2)', borderTopColor: '#C9A84C', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
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
            <LayoutWrapper currentPageName={path}>
              <Page />
            </LayoutWrapper>
          }
        />
      ))}
      <Route path="/Greenroom" element={<LayoutWrapper currentPageName="Greenroom"><Greenroom /></LayoutWrapper>} />
      <Route path="/ControlRoom" element={<LayoutWrapper currentPageName="ControlRoom"><ControlRoom /></LayoutWrapper>} />
      <Route path="/ModerationDashboard" element={<LayoutWrapper currentPageName="ModerationDashboard"><ModerationDashboard /></LayoutWrapper>} />
      <Route path="/Dashboard" element={<LayoutWrapper currentPageName="Dashboard"><Dashboard /></LayoutWrapper>} />
      <Route path="/OverlayBuilder" element={<LayoutWrapper currentPageName="OverlayBuilder"><OverlayBuilder /></LayoutWrapper>} />
      <Route path="/LoyaltyHub" element={<LayoutWrapper currentPageName="LoyaltyHub"><LoyaltyHub /></LayoutWrapper>} />
      <Route path="/ChallengesHub" element={<LayoutWrapper currentPageName="ChallengesHub"><ChallengesHub /></LayoutWrapper>} />
      <Route path="/PollManager" element={<LayoutWrapper currentPageName="PollManager"><PollManager /></LayoutWrapper>} />
      <Route path="/PlatformShowcase" element={<LayoutWrapper currentPageName="PlatformShowcase"><PlatformShowcase /></LayoutWrapper>} />
      <Route path="/Monetization" element={<LayoutWrapper currentPageName="Monetization"><Monetization /></LayoutWrapper>} />
      <Route path="/Community" element={<LayoutWrapper currentPageName="Community"><Community /></LayoutWrapper>} />
      <Route path="/OverlayEditor" element={<LayoutWrapper currentPageName="OverlayEditor"><OverlayEditor /></LayoutWrapper>} />
      <Route path="/CreatorDashboard" element={<LayoutWrapper currentPageName="CreatorDashboard"><CreatorDashboard /></LayoutWrapper>} />
      <Route path="/Welcome" element={<Welcome />} />
      <Route path="/PKBattle" element={<LayoutWrapper currentPageName="PKBattle"><PKBattle /></LayoutWrapper>} />
      <Route path="/CoverPage" element={<CoverPage />} />
      <Route path="/BackPage" element={<BackPage />} />
      <Route path="/SeeWhyLIVEv17" element={<SeeWhyLIVEv17 />} />
      <Route path="/messages" element={<LayoutWrapper currentPageName="Messages"><Messages /></LayoutWrapper>} />
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route path="/clips" element={<LayoutWrapper currentPageName="ClipsLibrary"><ClipsLibraryPage /></LayoutWrapper>} />
      <Route path="/newsletter" element={<LayoutWrapper currentPageName="NewsletterHub"><NewsletterHubPage /></LayoutWrapper>} />
      <Route path="/CreatorPublicProfile" element={<LayoutWrapper currentPageName="CreatorPublicProfile"><CreatorPublicProfile /></LayoutWrapper>} />
      <Route path="/BroadcastStudio" element={<BroadcastStudio />} />
      <Route path="/LiveRoom" element={<LiveRoom />} />
      <Route path="/SocialExpo" element={<LayoutWrapper currentPageName="SocialExpo"><SocialExpo /></LayoutWrapper>} />
      <Route path="/PodcastStudio" element={<LayoutWrapper currentPageName="PodcastStudio"><PodcastStudio /></LayoutWrapper>} />
      <Route path="/MultiPlatform" element={<LayoutWrapper currentPageName="MultiPlatform"><MultiPlatform /></LayoutWrapper>} />
      <Route path="/AIMusic" element={<LayoutWrapper currentPageName="AIMusic"><AIMusic /></LayoutWrapper>} />
      <Route path="/StateVsState" element={<LayoutWrapper currentPageName="StateVsState"><StateVsState /></LayoutWrapper>} />
      <Route path="/TributeWall" element={<LayoutWrapper currentPageName="TributeWall"><TributeWall /></LayoutWrapper>} />
      <Route path="/SeeWhyLIVEv36" element={<SeeWhyLIVEv36 />} />
      <Route path="/login" element={<Login />} />
      <Route path="*" element={<PageNotFound />} />
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
            <Route path="/login" element={<Login />} />
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