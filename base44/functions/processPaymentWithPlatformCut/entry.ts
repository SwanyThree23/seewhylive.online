import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { recipient_id, amount, payment_method, room_id, transaction_type } = await req.json();

    // Calculate platform cut (10%)
    const platformCut = amount * 0.1;
    const creatorPayout = amount * 0.9;

    // Create transaction record
    const transaction = await base44.asServiceRole.entities.Transaction.create({
      sender_id: user.id,
      recipient_id,
      room_id,
      amount,
      platform_cut: platformCut,
      creator_payout: creatorPayout,
      payment_method,
      transaction_type,
      status: 'completed',
      processed_at: new Date().toISOString(),
    });

    // Update creator payout record
    const payout = await base44.asServiceRole.entities.CreatorPayout.filter(
      { creator_id: recipient_id },
      '-created_date',
      1
    );

    if (payout?.length > 0) {
      await base44.asServiceRole.entities.CreatorPayout.update(payout[0].id, {
        pending_balance: (payout[0].pending_balance || 0) + creatorPayout,
        total_earned: (payout[0].total_earned || 0) + amount,
      });
    } else {
      await base44.asServiceRole.entities.CreatorPayout.create({
        creator_id: recipient_id,
        pending_balance: creatorPayout,
        total_earned: amount,
        total_platform_cut: platformCut,
      });
    }

    // Log analytics
    await base44.integrations.Core.InvokeLLM({
      prompt: `Log payment event: ${amount} from ${user.id} to ${recipient_id}, 10% cut (${platformCut}) to platform`,
    });

    return Response.json({
      transaction_id: transaction.id,
      amount,
      platform_cut: platformCut,
      creator_payout: creatorPayout,
      status: 'success',
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});