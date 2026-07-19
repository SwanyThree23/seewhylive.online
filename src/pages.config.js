/**
 * pages.config.js - Page routing configuration
 *
 * Pages use React.lazy() for code splitting — each page is a separate JS chunk
 * loaded on demand. The Layout is eagerly imported since it renders on every route.
 *
 * THE ONLY EDITABLE VALUE: mainPage (controls the landing page)
 */
import { lazy } from 'react';
import __Layout from './Layout.jsx';

const AIHub               = lazy(() => import('./pages/AIHub'));
const AIModeration        = lazy(() => import('./pages/AIModeration'));
const Activity            = lazy(() => import('./pages/Activity'));
const AdvancedAnalytics   = lazy(() => import('./pages/AdvancedAnalytics'));
const Analytics           = lazy(() => import('./pages/Analytics'));
const Communities         = lazy(() => import('./pages/Communities'));
const Community           = lazy(() => import('./pages/Community'));
const CommunityAdmin      = lazy(() => import('./pages/CommunityAdmin'));
const CommunityGrowth     = lazy(() => import('./pages/CommunityGrowth'));
const CommunitySettings   = lazy(() => import('./pages/CommunitySettings'));
const ContentCalendar     = lazy(() => import('./pages/ContentCalendar'));
const CreateCommunity     = lazy(() => import('./pages/CreateCommunity'));
const CreateRoom          = lazy(() => import('./pages/CreateRoom'));
const CreatorChannel      = lazy(() => import('./pages/CreatorChannel'));
const CreatorDashboard    = lazy(() => import('./pages/CreatorDashboard'));
const CreatorSubscriptions = lazy(() => import('./pages/CreatorSubscriptions'));
const Discover            = lazy(() => import('./pages/Discover'));
const Home                = lazy(() => import('./pages/Home'));
const HybridStreamRoom    = lazy(() => import('./pages/HybridStreamRoom'));
const LiveRoom            = lazy(() => import('./pages/LiveRoom'));
const LoyaltyProgram      = lazy(() => import('./pages/LoyaltyProgram'));
const ModerationDashboard = lazy(() => import('./pages/ModerationDashboard'));
const Monetization        = lazy(() => import('./pages/Monetization'));
const MonetizationWidgets = lazy(() => import('./pages/MonetizationWidgets'));
const MultiStreamManager  = lazy(() => import('./pages/MultiStreamManager'));
const Newsletter          = lazy(() => import('./pages/Newsletter'));
const Notifications       = lazy(() => import('./pages/Notifications'));
const OverlayEditor       = lazy(() => import('./pages/OverlayEditor'));
const PayPerViewEvents    = lazy(() => import('./pages/PayPerViewEvents'));
const Profile             = lazy(() => import('./pages/Profile'));
const Room                = lazy(() => import('./pages/Room'));
const Search              = lazy(() => import('./pages/Search'));
const Settings            = lazy(() => import('./pages/Settings'));
const StreamAnalytics     = lazy(() => import('./pages/StreamAnalytics'));
const StreamScheduler     = lazy(() => import('./pages/StreamScheduler'));
const ViewerDashboard     = lazy(() => import('./pages/ViewerDashboard'));
const Welcome             = lazy(() => import('./pages/Welcome'));
const DataExport          = lazy(() => import('./pages/DataExport'));
const EnhancementSuite    = lazy(() => import('./pages/EnhancementSuite'));
const InviteUsers         = lazy(() => import('./pages/InviteUsers'));
const BetaStatus          = lazy(() => import('./pages/BetaStatus'));
const Payouts             = lazy(() => import('./pages/Payouts'));
const VideoPost           = lazy(() => import('./pages/VideoPost'));
const FeaturedContent     = lazy(() => import('./pages/FeaturedContent'));
const WatchParty          = lazy(() => import('./pages/WatchParty'));
const PublicProfile       = lazy(() => import('./pages/PublicProfile'));
const TermsOfService      = lazy(() => import('./pages/TermsOfService'));
const PrivacyPolicy       = lazy(() => import('./pages/PrivacyPolicy'));
const StageCleanup        = lazy(() => import('./pages/StageCleanup'));
const VODLibrary          = lazy(() => import('./pages/VODLibrary'));
const PKBattlePage        = lazy(() => import('./pages/PKBattlePage'));
const RTMPServer          = lazy(() => import('./pages/RTMPServer'));
const LiveBattles         = lazy(() => import('./pages/LiveBattles'));
const AdminDashboard      = lazy(() => import('./pages/AdminDashboard'));
const Leaderboard         = lazy(() => import('./pages/Leaderboard'));
const GuestJoin           = lazy(() => import('./pages/GuestJoin'));
const StreamInfra         = lazy(() => import('./pages/StreamInfra'));
const PKBattleManager     = lazy(() => import('./pages/PKBattleManager'));
const Greenroom           = lazy(() => import('./pages/Greenroom'));
const ControlRoom         = lazy(() => import('./pages/ControlRoom'));
const Dashboard           = lazy(() => import('./pages/Dashboard'));
const OverlayBuilder      = lazy(() => import('./pages/OverlayBuilder'));
const LoyaltyHub          = lazy(() => import('./pages/LoyaltyHub'));
const ChallengesHub       = lazy(() => import('./pages/ChallengesHub'));
const AIMusic             = lazy(() => import('./pages/AIMusic'));
const BroadcastStudio     = lazy(() => import('./pages/BroadcastStudio'));
const Messages            = lazy(() => import('./pages/Messages'));
const ClipsLibrary        = lazy(() => import('./pages/ClipsLibrary'));
const Onboarding          = lazy(() => import('./pages/Onboarding'));
const PKBattle            = lazy(() => import('./pages/PKBattle'));
const PollManager         = lazy(() => import('./pages/PollManager'));
const PlatformShowcase    = lazy(() => import('./pages/PlatformShowcase'));
const TestMode            = lazy(() => import('./pages/TestMode'));
const GoLive              = lazy(() => import('./pages/GoLive'));
const GreenroomEnhanced   = lazy(() => import('./pages/GreenroomEnhanced'));
const VaultPro            = lazy(() => import('./pages/VaultPro'));
const AudioRoom           = lazy(() => import('./pages/AudioRoom'));
const SceneTemplates      = lazy(() => import('./pages/SceneTemplates'));
const StreamAlerts        = lazy(() => import('./pages/StreamAlerts'));
const PodcastStudio       = lazy(() => import('./pages/PodcastStudio'));
const MultiPlatform       = lazy(() => import('./pages/MultiPlatform'));
const StateVsState        = lazy(() => import('./pages/StateVsState'));
const TributeWall         = lazy(() => import('./pages/TributeWall'));
const INSForge            = lazy(() => import('./pages/INSForge'));
const JoyceAI             = lazy(() => import('./pages/JoyceAI'));
const AuraAI              = lazy(() => import('./pages/AuraAI'));
const SwanyBotPage        = lazy(() => import('./pages/SwanyBotPage'));
const VoiceAISettings     = lazy(() => import('./pages/VoiceAISettings'));
const GuardianAI          = lazy(() => import('./pages/GuardianAI'));
const StreamRefDash            = lazy(() => import('./pages/StreamRefDash'));
const StreamInfraRef           = lazy(() => import('./pages/StreamInfraRef'));
const CreatorPublicProfile     = lazy(() => import('./pages/CreatorPublicProfile'));
const MultiPlatformIntegration = lazy(() => import('./pages/MultiPlatformIntegration'));
const NewsletterHub            = lazy(() => import('./pages/NewsletterHub'));
const SocialExpo               = lazy(() => import('./pages/SocialExpo'));
const SeeWhyLIVEv37            = lazy(() => import('./pages/SeeWhyLIVEv37'));
const SeeWhyLIVEv36            = lazy(() => import('./pages/SeeWhyLIVEv36'));
const SeeWhyLIVEv17            = lazy(() => import('./pages/SeeWhyLIVEv17'));
const BackPage                 = lazy(() => import('./pages/BackPage'));
const CoverPage                = lazy(() => import('./pages/CoverPage'));
const Login                    = lazy(() => import('./pages/Login'));
const TranscriptionStudio      = lazy(() => import('./pages/TranscriptionStudio'));
const RoomsManager             = lazy(() => import('./pages/RoomsManager'));
const PKBattleArena            = lazy(() => import('./pages/PKBattleArena'));
const EmbedPage                = lazy(() => import('./pages/EmbedPage'));
const MerchStore               = lazy(() => import('./pages/MerchStore'));
const StreamShareHub           = lazy(() => import('./pages/StreamShareHub'));
const SeeWhyLIVEv41            = lazy(() => import('./pages/SeeWhyLIVEv41'));
const CreatorAnalytics         = lazy(() => import('./pages/CreatorAnalytics'));
const FallenLegendsPage        = lazy(() => import('./pages/FallenLegendsPage'));
const ForgotPassword           = lazy(() => import('./pages/ForgotPassword'));
const GreenRoomPreFlight       = lazy(() => import('./pages/GreenRoomPreFlight'));
const GoLiveStudio             = lazy(() => import('./pages/GoLiveStudio'));
const INSForgeStudio           = lazy(() => import('./pages/INSForgeStudio'));
const PayoutCenter             = lazy(() => import('./pages/PayoutCenter'));
const Register                 = lazy(() => import('./pages/Register'));
const ResetPassword            = lazy(() => import('./pages/ResetPassword'));
const SVSArena                 = lazy(() => import('./pages/SVSArena'));
const StudioHub                = lazy(() => import('./pages/StudioHub'));
const UnifiedRoom              = lazy(() => import('./pages/UnifiedRoom'));
const WebsiteGenerator         = lazy(() => import('./pages/WebsiteGenerator'));
const VoiceAgentBuilder        = lazy(() => import('./pages/VoiceAgentBuilder'));
const WashingtonClassic        = lazy(() => import('./pages/WashingtonClassic'));
const WisperFlo                = lazy(() => import('./pages/WisperFlo'));
const EmbedPlayer              = lazy(() => import('./pages/EmbedPlayer'));
const OpenRouterHub            = lazy(() => import('./pages/OpenRouterHub'));
const LLMLinguaStudio          = lazy(() => import('./pages/LLMLinguaStudio'));
const VDONinjaManager          = lazy(() => import('./pages/VDONinjaManager'));

export const PAGES = {
    "AIHub": AIHub,
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
    "BroadcastStudio": BroadcastStudio,
    "Messages": Messages,
    "ClipsLibrary": ClipsLibrary,
    "Onboarding": Onboarding,
    "PKBattle": PKBattle,
    "PollManager": PollManager,
    "PlatformShowcase": PlatformShowcase,
    "TestMode": TestMode,
    "GoLive": GoLive,
    "GreenroomEnhanced": GreenroomEnhanced,
    "VaultPro": VaultPro,
    "AudioRoom": AudioRoom,
    "SceneTemplates": SceneTemplates,
    "StreamAlerts": StreamAlerts,
    "PodcastStudio": PodcastStudio,
    "MultiPlatform": MultiPlatform,
    "StateVsState": StateVsState,
    "TributeWall": TributeWall,
    "INSForge": INSForge,
    "JoyceAI": JoyceAI,
    "AuraAI": AuraAI,
    "SwanyBotPage": SwanyBotPage,
    "VoiceAISettings": VoiceAISettings,
    "GuardianAI": GuardianAI,
    "StreamRefDash": StreamRefDash,
    "StreamInfraRef": StreamInfraRef,
    "CreatorPublicProfile": CreatorPublicProfile,
    "MultiPlatformIntegration": MultiPlatformIntegration,
    "NewsletterHub": NewsletterHub,
    "SocialExpo": SocialExpo,
    "SeeWhyLIVEv37": SeeWhyLIVEv37,
    "SeeWhyLIVEv36": SeeWhyLIVEv36,
    "SeeWhyLIVEv17": SeeWhyLIVEv17,
    "BackPage": BackPage,
    "CoverPage": CoverPage,
    "Login": Login,
    "TranscriptionStudio": TranscriptionStudio,
    "RoomsManager": RoomsManager,
    "PKBattleArena": PKBattleArena,
    "EmbedPage": EmbedPage,
    "MerchStore": MerchStore,
    "StreamShareHub": StreamShareHub,
    "SeeWhyLIVEv41": SeeWhyLIVEv41,
    "CreatorAnalytics": CreatorAnalytics,
    "FallenLegendsPage": FallenLegendsPage,
    "ForgotPassword": ForgotPassword,
    "GreenRoomPreFlight": GreenRoomPreFlight,
    "GoLiveStudio": GoLiveStudio,
    "INSForgeStudio": INSForgeStudio,
    "PayoutCenter": PayoutCenter,
    "Register": Register,
    "ResetPassword": ResetPassword,
    "SVSArena": SVSArena,
    "StudioHub": StudioHub,
    "UnifiedRoom": UnifiedRoom,
    "WebsiteGenerator": WebsiteGenerator,
    "VoiceAgentBuilder": VoiceAgentBuilder,
    "VoiceAISettings": VoiceAISettings,
    "WashingtonClassic": WashingtonClassic,
    "WisperFlo": WisperFlo,
    "EmbedPlayer": EmbedPlayer,
    "OpenRouterHub": OpenRouterHub,
    "LLMLinguaStudio": LLMLinguaStudio,
    "VDONinjaManager": VDONinjaManager,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};
