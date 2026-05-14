import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { room_id, time_range = '24h' } = await req.json();

    // Fetch transactions for this creator
    const transactions = await base44.asServiceRole.entities.Transaction.filter(
      { recipient_id: user.id },
      '-processed_at',
      100
    );

    // Fetch paywall accesses
    const paywallAccess = await base44.asServiceRole.entities.PayPerViewAccess.filter(
      { creator_id: user.id },
      '-created_date',
      100
    );

    // Calculate metrics
    const totalRevenue = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
    const platformCutTotal = transactions.reduce((sum, t) => sum + (t.platform_cut || 0), 0);
    const creatorEarnings = transactions.reduce((sum, t) => sum + (t.creator_payout || 0), 0);
    const paywallRevenue = paywallAccess.reduce((sum, p) => sum + (p.amount || 0), 0);

    // Group by transaction type
    const byType = {};
    transactions.forEach(t => {
      byType[t.transaction_type] = (byType[t.transaction_type] || 0) + t.amount;
    });

    return Response.json({
      total_revenue: totalRevenue,
      platform_cut: platformCutTotal,
      creator_earnings: creatorEarnings,
      paywall_revenue: paywallRevenue,
      transaction_breakdown: byType,
      total_transactions: transactions.length,
      total_paywall_conversions: paywallAccess.length,
      net_creator_payout: creatorEarnings + paywallRevenue,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});