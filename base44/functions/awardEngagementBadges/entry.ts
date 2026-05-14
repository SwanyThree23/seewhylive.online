import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    const { user_id, room_id, event_type, value } = payload;

    if (!user_id || !room_id) {
      return Response.json({ error: 'Missing user_id or room_id' }, { status: 400 });
    }

    const badges = [];

    // Check for milestone badges
    if (event_type === 'tips') {
      // Super fan badge at 500 tips
      if (value >= 500) {
        const existing = await base44.asServiceRole.entities.EngagementBadge.filter(
          { user_id, badge_type: 'super_fan', creator_id: room_id },
          null,
          1
        );
        if (existing.length === 0) {
          const badge = await base44.asServiceRole.entities.EngagementBadge.create({
            user_id,
            creator_id: room_id,
            badge_type: 'super_fan',
            title: '⭐ Super Fan',
            description: 'Tipped $500+',
            rarity: 'epic',
            points_value: 100,
            awarded_at: new Date().toISOString(),
            achievement_metric: { type: 'tips', value: 500 },
          });
          badges.push(badge);
        }
      }

      // Top supporter badge at 1000 tips
      if (value >= 1000) {
        const existing = await base44.asServiceRole.entities.EngagementBadge.filter(
          { user_id, badge_type: 'top_supporter', creator_id: room_id },
          null,
          1
        );
        if (existing.length === 0) {
          const badge = await base44.asServiceRole.entities.EngagementBadge.create({
            user_id,
            creator_id: room_id,
            badge_type: 'top_supporter',
            title: '💎 Top Supporter',
            description: 'Tipped $1000+',
            rarity: 'legendary',
            points_value: 250,
            awarded_at: new Date().toISOString(),
            achievement_metric: { type: 'tips', value: 1000 },
          });
          badges.push(badge);
        }
      }
    }

    if (event_type === 'raids') {
      // Raid master badge at 5 raids
      if (value >= 5) {
        const existing = await base44.asServiceRole.entities.EngagementBadge.filter(
          { user_id, badge_type: 'raid_master', creator_id: room_id },
          null,
          1
        );
        if (existing.length === 0) {
          const badge = await base44.asServiceRole.entities.EngagementBadge.create({
            user_id,
            creator_id: room_id,
            badge_type: 'raid_master',
            title: '⚔️ Raid Master',
            description: 'Sent 5+ raids',
            rarity: 'rare',
            points_value: 75,
            awarded_at: new Date().toISOString(),
            achievement_metric: { type: 'raids', value: 5 },
          });
          badges.push(badge);
        }
      }
    }

    if (event_type === 'watch_streak') {
      // Watch streak badge at 100 minutes
      if (value >= 100) {
        const existing = await base44.asServiceRole.entities.EngagementBadge.filter(
          { user_id, badge_type: 'watch_streak', creator_id: room_id },
          null,
          1
        );
        if (existing.length === 0) {
          const badge = await base44.asServiceRole.entities.EngagementBadge.create({
            user_id,
            creator_id: room_id,
            badge_type: 'watch_streak',
            title: '🔥 Watch Streak',
            description: '100+ minutes watched',
            rarity: 'common',
            points_value: 50,
            awarded_at: new Date().toISOString(),
            achievement_metric: { type: 'watch_minutes', value: 100 },
          });
          badges.push(badge);
        }
      }
    }

    // Award a notification for new badges
    if (badges.length > 0) {
      for (const badge of badges) {
        await base44.asServiceRole.entities.Notification.create({
          user_id,
          type: 'engagement_milestone',
          title: `🏅 New Badge Earned!`,
          message: `You earned: ${badge.title} — ${badge.description}`,
          icon: '🏅',
          priority: 'high',
          event_id: badge.id,
          metadata: { badge_id: badge.id, points: badge.points_value },
        });
      }
    }

    return Response.json({ success: true, badges_awarded: badges.length, badges });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});