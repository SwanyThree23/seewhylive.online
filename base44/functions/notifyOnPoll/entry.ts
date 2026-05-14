import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data } = await req.json();

    if (event.type === 'create') {
      // New poll created — notify host's followers
      const poll = data;
      if (!poll || !poll.host_id) {
        return Response.json({ success: true });
      }

      // Find followers of the host
      const followers = await base44.asServiceRole.entities.Follow.filter(
        { following_id: poll.host_id },
        '-created_date',
        50
      );

      // Create notifications for each follower
      for (const follow of followers) {
        await base44.asServiceRole.entities.Notification.create({
          user_id: follow.follower_id,
          type: 'poll_created',
          title: `New poll from ${poll.host_id}`,
          message: poll.question,
          icon: '📊',
          priority: 'normal',
          room_id: poll.room_id,
          event_id: poll.id,
          link: `/Room?id=${poll.room_id}`,
          metadata: {
            poll_id: poll.id,
            options_count: poll.options?.length || 0,
            timeout: poll.timeout_seconds,
          },
        });
      }

      return Response.json({ success: true, notified: followers.length });
    }

    if (event.type === 'update') {
      // Poll closed — notify participants
      const poll = data;
      if (poll.status !== 'closed') {
        return Response.json({ success: true });
      }

      // Get all votes to identify participants
      const votes = await base44.asServiceRole.entities.PollVote.filter(
        { poll_id: poll.id },
        '-created_date',
        200
      );

      const uniqueVoters = [...new Set(votes.map(v => v.user_id))];

      // Create poll results summary
      const results = {};
      poll.options?.forEach((opt, idx) => {
        results[opt] = votes.filter(v => v.option_index === idx).length;
      });

      const topOption = Object.entries(results).sort(([, a], [, b]) => b - a)[0];

      // Notify voters
      for (const voterId of uniqueVoters) {
        await base44.asServiceRole.entities.Notification.create({
          user_id: voterId,
          type: 'poll_closed',
          title: '📊 Poll Results',
          message: `${poll.question} — winner: "${topOption[0]}" (${topOption[1]} votes)`,
          priority: 'normal',
          room_id: poll.room_id,
          event_id: poll.id,
          link: `/Room?id=${poll.room_id}`,
          metadata: {
            poll_id: poll.id,
            results,
            top_option: topOption[0],
            top_votes: topOption[1],
            total_votes: votes.length,
          },
        });
      }

      return Response.json({ success: true, notified: uniqueVoters.length });
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});