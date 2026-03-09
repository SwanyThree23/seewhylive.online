import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Home, Radio, Users, Settings, LogOut, 
  User, Plus, Video, DollarSign, Shield, Bell, Search as SearchIcon, Activity, Mail,
  BarChart2, Globe, Crown
} from 'lucide-react';

export default function Layout({ children, currentPageName }) {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const handleLogout = async () => {
    await base44.auth.logout();
  };

  const navigation = [
    { name: 'Home', icon: Home, href: createPageUrl('Home') },
    { name: 'Discover', icon: SearchIcon, href: createPageUrl('Discover') },
    { name: 'Communities', icon: Users, href: createPageUrl('Communities') },
    { name: 'Schedule', icon: Radio, href: createPageUrl('StreamScheduler') },
    { name: 'Monetization', icon: DollarSign, href: createPageUrl('Monetization') },
  ];

  const isAdmin = user?.role === 'admin';

  return (
    <div className="min-h-screen bg-background">
      <style>{`
        :root {
          --primary: 25 45% 35%;
          --primary-foreground: 40 30% 95%;
          --accent: 35 55% 45%;
          --accent-foreground: 40 30% 95%;
        }
        .bg-gradient-to-br { background-image: linear-gradient(to bottom right, #8B6F47, #A0826D); }
        .bg-gradient-to-r { background-image: linear-gradient(to right, #8B4513, #B8860B); }
        .from-purple-600 { --tw-gradient-from: #8B4513; }
        .to-pink-600 { --tw-gradient-to: #B8860B; }
        .text-purple-600 { color: #8B4513; }
        .text-purple-500 { color: #A0826D; }
        .text-purple-700 { color: #6B3410; }
        .bg-purple-50 { background-color: #F5F0EB; }
        .bg-purple-500 { background-color: #8B4513; }
        .hover\\:bg-purple-600:hover { background-color: #6B3410; }
        .border-purple-300 { border-color: #C4A57B; }
      `}</style>
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-6">
          {/* Logo */}
          <Link to={createPageUrl('Home')} className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center">
              <Video className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-xl bg-gradient-to-r bg-clip-text text-transparent">
              StreamSpace
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = currentPageName === item.name;
              return (
                <Link key={item.name} to={item.href}>
                  <Button 
                    variant={isActive ? "default" : "ghost"}
                    className="gap-2"
                  >
                    <Icon className="w-4 h-4" />
                    {item.name}
                  </Button>
                </Link>
              );
            })}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
          <Link to={createPageUrl('Notifications')}>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
            </Button>
          </Link>
          <Link to={createPageUrl('LiveRoom')}>
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs hidden md:flex text-[#800020] border border-[#800020]/30 hover:bg-[#800020]/10">
              <Radio className="w-3.5 h-3.5" />
              Studio
            </Button>
          </Link>
          <Link to={createPageUrl('CreateRoom')}>
            <Button className="gap-2 bg-gradient-to-r hover:opacity-90">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Create Room</span>
            </Button>
          </Link>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar>
                      <AvatarImage src={user.avatar_url} />
                      <AvatarFallback>
                        {user.full_name?.charAt(0) || user.email?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user.full_name || 'User'}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to={createPageUrl('Profile')}>
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to={createPageUrl('Activity')}>
                      <Activity className="mr-2 h-4 w-4" />
                      <span>Activity</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to={createPageUrl('Analytics')}>
                      <DollarSign className="mr-2 h-4 w-4" />
                      <span>Analytics</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to={createPageUrl('AdvancedAnalytics')}>
                      <DollarSign className="mr-2 h-4 w-4" />
                      <span>Advanced Analytics</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to={createPageUrl('StreamAnalytics')}>
                      <BarChart2 className="mr-2 h-4 w-4" />
                      <span>Stream Analytics</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to={createPageUrl('MultiStreamManager')}>
                      <Radio className="mr-2 h-4 w-4" />
                      <span>Multi-Stream</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to={createPageUrl('OverlayEditor')}>
                      <Globe className="mr-2 h-4 w-4" />
                      <span>Overlays</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to={createPageUrl('LoyaltyProgram')}>
                      <Globe className="mr-2 h-4 w-4" />
                      <span>Loyalty</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to={createPageUrl('ViewerDashboard')}>
                      <Globe className="mr-2 h-4 w-4" />
                      <span>Viewer Feed</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to={createPageUrl('CreatorSubscriptions')}>
                      <Crown className="mr-2 h-4 w-4" />
                      <span>Memberships</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to={createPageUrl('MonetizationWidgets')}>
                      <DollarSign className="mr-2 h-4 w-4" />
                      <span>Widget Suite</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to={createPageUrl('Newsletter')}>
                      <Mail className="mr-2 h-4 w-4" />
                      <span>Newsletter</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to={createPageUrl('AIModeration')}>
                      <Shield className="mr-2 h-4 w-4" />
                      <span>AI Moderation</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to={createPageUrl('CreateCommunity')}>
                      <Users className="mr-2 h-4 w-4" />
                      <span>Create Community</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to={createPageUrl('Settings')}>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link to={createPageUrl('ModerationDashboard')}>
                        <Shield className="mr-2 h-4 w-4" />
                        <span>Moderation</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button onClick={() => base44.auth.redirectToLogin()}>
                Sign In
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-white">
        <nav className="flex items-center justify-around h-16 px-4">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = currentPageName === item.name;
            return (
              <Link 
                key={item.name} 
                to={item.href}
                className={`flex flex-col items-center gap-1 ${
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Main Content */}
      <main className="pb-16 md:pb-0">
        {children}
      </main>
    </div>
  );
}