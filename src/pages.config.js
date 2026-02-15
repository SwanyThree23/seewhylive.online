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
import Activity from './pages/Activity';
import Analytics from './pages/Analytics';
import Communities from './pages/Communities';
import Community from './pages/Community';
import CommunityAdmin from './pages/CommunityAdmin';
import CommunityGrowth from './pages/CommunityGrowth';
import CommunitySettings from './pages/CommunitySettings';
import CreateCommunity from './pages/CreateCommunity';
import CreateRoom from './pages/CreateRoom';
import Home from './pages/Home';
import HybridStreamRoom from './pages/HybridStreamRoom';
import ModerationDashboard from './pages/ModerationDashboard';
import Monetization from './pages/Monetization';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import Room from './pages/Room';
import Search from './pages/Search';
import Settings from './pages/Settings';
import Newsletter from './pages/Newsletter';
import AIModeration from './pages/AIModeration';
import AdvancedAnalytics from './pages/AdvancedAnalytics';
import Discover from './pages/Discover';
import Welcome from './pages/Welcome';
import PayPerViewEvents from './pages/PayPerViewEvents';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Activity": Activity,
    "Analytics": Analytics,
    "Communities": Communities,
    "Community": Community,
    "CommunityAdmin": CommunityAdmin,
    "CommunityGrowth": CommunityGrowth,
    "CommunitySettings": CommunitySettings,
    "CreateCommunity": CreateCommunity,
    "CreateRoom": CreateRoom,
    "Home": Home,
    "HybridStreamRoom": HybridStreamRoom,
    "ModerationDashboard": ModerationDashboard,
    "Monetization": Monetization,
    "Notifications": Notifications,
    "Profile": Profile,
    "Room": Room,
    "Search": Search,
    "Settings": Settings,
    "Newsletter": Newsletter,
    "AIModeration": AIModeration,
    "AdvancedAnalytics": AdvancedAnalytics,
    "Discover": Discover,
    "Welcome": Welcome,
    "PayPerViewEvents": PayPerViewEvents,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};