import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  User, Activity, DollarSign, BarChart2, Radio, Globe,
  Mail, Shield, Users, Settings, LogOut, Crown
} from 'lucide-react';

export default function UserMenu({ user, isAdmin }) {
  const handleLogout = () => base44.auth.logout();

  if (!user) {
    return (
      <Button onClick={() => base44.auth.redirectToLogin()}>Sign In</Button>
    );
  }

  const sections = [
    {
      label: 'My Account',
      items: [
        { label: 'Profile', icon: User, href: 'Profile' },
        { label: 'Activity', icon: Activity, href: 'Activity' },
        { label: 'Settings', icon: Settings, href: 'Settings' },
      ],
    },
    {
      label: 'Creator',
      items: [
        { label: 'Creator Dashboard', icon: BarChart2, href: 'CreatorDashboard' },
        { label: 'Memberships', icon: Crown, href: 'CreatorSubscriptions' },
        { label: 'Multi-Stream', icon: Radio, href: 'MultiStreamManager' },
        { label: 'Overlay Editor', icon: Globe, href: 'OverlayEditor' },
        { label: 'Loyalty Program', icon: Globe, href: 'LoyaltyProgram' },
        { label: 'Newsletter', icon: Mail, href: 'Newsletter' },
        { label: 'Widget Suite', icon: DollarSign, href: 'MonetizationWidgets' },
      ],
    },
    {
      label: 'Viewer',
      items: [
        { label: 'My Feed', icon: Globe, href: 'ViewerDashboard' },
        { label: 'Analytics', icon: DollarSign, href: 'Analytics' },
        { label: 'Stream Analytics', icon: BarChart2, href: 'StreamAnalytics' },
      ],
    },
    {
      label: 'Community',
      items: [
        { label: 'Create Community', icon: Users, href: 'CreateCommunity' },
        { label: 'AI Moderation', icon: Shield, href: 'AIModeration' },
      ],
    },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
          <Avatar>
            <AvatarImage src={user.avatar_url} />
            <AvatarFallback className="bg-gradient-to-br from-amber-700 to-amber-500 text-white font-bold">
              {user.full_name?.charAt(0) || user.email?.charAt(0)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 max-h-[85vh] overflow-y-auto" align="end">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.full_name || 'User'}</p>
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        {sections.map(({ label, items }) => (
          <React.Fragment key={label}>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-[10px] text-muted-foreground uppercase tracking-wider px-2 py-1">{label}</DropdownMenuLabel>
            {items.map(({ label: itemLabel, icon: Icon, href }) => (
              <DropdownMenuItem key={href} asChild>
                <Link to={createPageUrl(href)}>
                  <Icon className="mr-2 h-4 w-4" />
                  <span>{itemLabel}</span>
                </Link>
              </DropdownMenuItem>
            ))}
          </React.Fragment>
        ))}
        {isAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-[10px] text-muted-foreground uppercase tracking-wider px-2 py-1">Admin</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link to={createPageUrl('ModerationDashboard')}>
                <Shield className="mr-2 h-4 w-4" />
                <span>Moderation</span>
              </Link>
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="text-red-600">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}