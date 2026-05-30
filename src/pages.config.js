/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AIModeration from './pages/AIModeration';
import Activity from './pages/Activity';
import AdvancedAnalytics from './pages/AdvancedAnalytics';
import Analytics from './pages/Analytics';
import Communities from './pages/Communities';
import Community from './pages/Community';
import CommunityAdmin from './pages/CommunityAdmin';
import CommunityGrowth from './pages/CommunityGrowth';
import CommunitySettings from './pages/CommunitySettings';
import ContentCalendar from './pages/ContentCalendar';
import CreateCommunity from './pages/CreateCommunity';
import CreateRoom from './pages/CreateRoom';
import CreatorChannel from './pages/CreatorChannel';
import CreatorDashboard from './pages/CreatorDashboard';
import CreatorSubscriptions from './pages/CreatorSubscriptions';
import Discover from './pages/Discover';
import Home from './pages/Home';
import HybridStreamRoom from './pages/HybridStreamRoom';
import LiveRoom from './pages/LiveRoom';
import LoyaltyProgram from './pages/LoyaltyProgram';
import ModerationDashboard from './pages/ModerationDashboard';
import Monetization from './pages/Monetization';
import MonetizationWidgets from './pages/MonetizationWidgets';
import MultiStreamManager from './pages/MultiStreamManager';
import Newsletter from './pages/Newsletter';
import Notifications from './pages/Notifications';
import OverlayEditor from './pages/OverlayEditor';
import PayPerViewEvents from './pages/PayPerViewEvents';
import Profile from './pages/Profile';
import Room from './pages/Room';
import Search from './pages/Search';
import Settings from './pages/Settings';
import StreamAnalytics from './pages/StreamAnalytics';
import StreamScheduler from './pages/StreamScheduler';
import ViewerDashboard from './pages/ViewerDashboard';
import Welcome from './pages/Welcome';
import DataExport from './pages/DataExport';
import EnhancementSuite from './pages/EnhancementSuite';
import InviteUsers from './pages/InviteUsers';
import BetaStatus from './pages/BetaStatus';
import Payouts from './pages/Payouts';
import VideoPost from './pages/VideoPost';
import FeaturedContent from './pages/FeaturedContent';
import WatchParty from './pages/WatchParty';
import PublicProfile from './pages/PublicProfile';
import TermsOfService from './pages/TermsOfService';
import PrivacyPolicy from './pages/PrivacyPolicy';
import StageCleanup from './pages/StageCleanup';
import VODLibrary from './pages/VODLibrary';
import PKBattlePage from './pages/PKBattlePage';
import RTMPServer from './pages/RTMPServer';
import LiveBattles from './pages/LiveBattles';
import AdminDashboard from './pages/AdminDashboard';
import Leaderboard from './pages/Leaderboard';
import GuestJoin from './pages/GuestJoin';
import StreamInfra from './pages/StreamInfra';
import PKBattleManager from './pages/PKBattleManager';
import Greenroom from './pages/Greenroom';
import ControlRoom from './pages/ControlRoom';
import Dashboard from './pages/Dashboard';
import OverlayBuilder from './pages/OverlayBuilder';
import LoyaltyHub from './pages/LoyaltyHub';
import ChallengesHub from './pages/ChallengesHub';
import AIMusic from './pages/AIMusic';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AIModeration": AIModeration,
    "Activity": Activity,
    "AdvancedAnalytics": AdvancedAnalytics,
    "Analytics": Analytics,
    "Communities": Communities,
    "Community": Community,
    "CommunityAdmin": CommunityAdmin,
    "CommunityGrowth": CommunityGrowth,
    "CommunitySettings": CommunitySettings,
    "ContentCalendar": ContentCalendar,
    "CreateCommunity": CreateCommunity,
    "CreateRoom": CreateRoom,
    "CreatorChannel": CreatorChannel,
    "CreatorDashboard": CreatorDashboard,
    "CreatorSubscriptions": CreatorSubscriptions,
    "Discover": Discover,
    "Home": Home,
    "HybridStreamRoom": HybridStreamRoom,
    "LiveRoom": LiveRoom,
    "LoyaltyProgram": LoyaltyProgram,
    "ModerationDashboard": ModerationDashboard,
    "Monetization": Monetization,
    "MonetizationWidgets": MonetizationWidgets,
    "MultiStreamManager": MultiStreamManager,
    "Newsletter": Newsletter,
    "Notifications": Notifications,
    "OverlayEditor": OverlayEditor,
    "PayPerViewEvents": PayPerViewEvents,
    "Profile": Profile,
    "Room": Room,
    "Search": Search,
    "Settings": Settings,
    "StreamAnalytics": StreamAnalytics,
    "StreamScheduler": StreamScheduler,
    "ViewerDashboard": ViewerDashboard,
    "Welcome": Welcome,
    "DataExport": DataExport,
    "EnhancementSuite": EnhancementSuite,
    "InviteUsers": InviteUsers,
    "BetaStatus": BetaStatus,
    "Payouts": Payouts,
    "VideoPost": VideoPost,
    "FeaturedContent": FeaturedContent,
    "WatchParty": WatchParty,
    "PublicProfile": PublicProfile,
    "TermsOfService": TermsOfService,
    "PrivacyPolicy": PrivacyPolicy,
    "StageCleanup": StageCleanup,
    "VODLibrary": VODLibrary,
    "PKBattlePage": PKBattlePage,
    "RTMPServer": RTMPServer,
    "LiveBattles": LiveBattles,
    "AdminDashboard": AdminDashboard,
    "Leaderboard": Leaderboard,
    "GuestJoin": GuestJoin,
    "StreamInfra": StreamInfra,
    "PKBattleManager": PKBattleManager,
    "Greenroom": Greenroom,
    "ControlRoom": ControlRoom,
    "Dashboard": Dashboard,
    "OverlayBuilder": OverlayBuilder,
    "LoyaltyHub": LoyaltyHub,
    "ChallengesHub": ChallengesHub,
    "AIMusic": AIMusic,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};