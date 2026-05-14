import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data } = await req.json();

    if (event.type === 'create') {
      // New raid — notify target creator
      const raid = data;
      if (!raid || !raid.to_creator_id) {
        return Response.json({ success: true });
      }

      const fromCreator = await base44.asServiceRole.entities.CreatorProfile.filter(
        { user_id: raid.from_creator_id },
        null,
        1
      );

      await base44.asServiceRole.entities.Notification.create({
        user_id: raid.to_creator_id,
        type: 'raid_incoming',
        title: `🎙️ Incoming Raid!`,
        message: `${raid.from_creator_username} is raiding with ${raid.viewer_count_sent} viewers! ${raid.message || ''}`,
        sender_id: raid.from_creator_id,
        sender_name: raid.from_creator_username,
        icon: '⚔️',
        priority: 'high',
        room_id: raid.to_room_id,
        event_id: raid.id,
        link: `/Room?id=${raid.to_room_id}`,
        metadata: {
          raid_id: raid.id,
          viewer_count: raid.viewer_count_sent,
          from_creator: raid.from_creator_username,
          from_room: raid.from_room_id,
        },
      });

      // Also notify followers of target that a raid is happening
      const followers = await base44.asServiceRole.entities.Follow.filter(
        { following_id: raid.to_creator_id },
        '-created_date',
        100
      );

      for (const follow of followers) {
        await base44.asServiceRole.entities.Notification.create({
          user_id: follow.follower_id,
          type: 'raid_incoming',
          title: `⚔️ Raid Alert`,
          message: `${raid.from_creator_username} is raiding ${raid.to_creator_username}!`,
          priority: 'normal',
          room_id: raid.to_room_id,
          event_id: raid.id,
          link: `/Room?id=${raid.to_room_id}`,
        });
      }

      return Response.json({ success: true, notified: followers.length + 1 });
    }

    if (event.type === 'update') {
      // Raid completed
      const raid = data;
      if (raid.status !== 'completed') {
        return Response.json({ success: true });
      }

      // Notify raid originator with results
      await base44.asServiceRole.entities.Notification.create({
        user_id: raid.from_creator_id,
        type: 'raid_outgoing',
        title: '✅ Raid Complete',
        message: `Your raid on ${raid.to_creator_username} sent ${raid.viewer_count_sent} viewers!`,
        priority: 'normal',
        event_id: raid.id,
        metadata: {
          raid_id: raid.id,
          target_creator: raid.to_creator_username,
          viewers_sent: raid.viewer_count_sent,
        },
      });

      return Response.json({ success: true });
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});