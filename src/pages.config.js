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
import Home from './pages/Home';
import Room from './pages/Room';
import CreateRoom from './pages/CreateRoom';
import Communities from './pages/Communities';
import ModerationDashboard from './pages/ModerationDashboard';
import Monetization from './pages/Monetization';
import HybridStreamRoom from './pages/HybridStreamRoom';
import CommunityGrowth from './pages/CommunityGrowth';
import Community from './pages/Community';
import CreateCommunity from './pages/CreateCommunity';
import CommunityAdmin from './pages/CommunityAdmin';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';
import Settings from './pages/Settings';
import Search from './pages/Search';
import Activity from './pages/Activity';
import Analytics from './pages/Analytics';
import CommunitySettings from './pages/CommunitySettings';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "Room": Room,
    "CreateRoom": CreateRoom,
    "Communities": Communities,
    "ModerationDashboard": ModerationDashboard,
    "Monetization": Monetization,
    "HybridStreamRoom": HybridStreamRoom,
    "CommunityGrowth": CommunityGrowth,
    "Community": Community,
    "CreateCommunity": CreateCommunity,
    "CommunityAdmin": CommunityAdmin,
    "Profile": Profile,
    "Notifications": Notifications,
    "Settings": Settings,
    "Search": Search,
    "Activity": Activity,
    "Analytics": Analytics,
    "CommunitySettings": CommunitySettings,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};