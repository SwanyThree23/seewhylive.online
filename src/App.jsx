import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
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
import CreatorPublicProfile from './pages/CreatorPublicProfile';
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
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
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
      <Route path="/CreatorPublicProfile" element={<LayoutWrapper currentPageName="CreatorPublicProfile"><CreatorPublicProfile /></LayoutWrapper>} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <BackgroundProvider>
        <Router>
          <NavigationTracker />
          <AuthenticatedApp />
        </Router>
        <Toaster />
        </BackgroundProvider>
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App