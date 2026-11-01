import { Resend } from 'resend'

let _resend: Resend | null = null
function getResend() {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY!)
  return _resend
}
const FROM = 'SeeWhy LIVE <noreply@seewhylive.online>'

function dollarFormat(cents: number) {
  return (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

export async function sendWelcomeEmail(to: string, username: string) {
  try {
    await getResend().emails.send({
      from: FROM,
      to,
      subject: 'Welcome to SeeWhy LIVE 📡',
      html: `
        <div style="background:#03030A;color:#F0E8D4;font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px 24px">
          <h1 style="font-size:36px;letter-spacing:0.1em;margin:0 0 8px">WELCOME TO SEEWHY LIVE</h1>
          <p style="color:#9CA3AF;margin:0 0 24px">Your broadcast starts here.</p>
          <p>Hey <strong>@${username}</strong>,</p>
          <p>You're in. Set up your stream in Studio and go live whenever you're ready.</p>
          <p style="color:#9CA3AF;font-size:13px">
            You keep 90% of every tip, paywall, and subscription — always.
          </p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/studio"
             style="display:inline-block;margin-top:24px;background:#FF1564;color:#fff;padding:12px 28px;border-radius:4px;text-decoration:none;font-weight:bold;letter-spacing:0.1em">
            GO LIVE →
          </a>
        </div>
      `,
    })
  } catch (e) {
    console.error('[email] sendWelcomeEmail failed:', e)
  }
}

export async function sendTipReceivedEmail(
  to: string,
  creatorUsername: string,
  senderUsername: string,
  amountCents: number,
  note?: string | null,
) {
  const creatorShare = Math.floor(amountCents * 0.90)
  try {
    await getResend().emails.send({
      from: FROM,
      to,
      subject: `You received a tip — ${dollarFormat(creatorShare)} from @${senderUsername}`,
      html: `
        <div style="background:#03030A;color:#F0E8D4;font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px 24px">
          <h1 style="font-size:28px;letter-spacing:0.1em;margin:0 0 24px">TIP RECEIVED 💰</h1>
          <p>Hey <strong>@${creatorUsername}</strong>,</p>
          <p><strong>@${senderUsername}</strong> sent you a tip!</p>
          <div style="background:#0E0C09;border:1px solid #1F1F2E;border-radius:8px;padding:20px;margin:20px 0">
            <p style="font-size:36px;color:#FFB800;font-weight:bold;margin:0">${dollarFormat(creatorShare)}</p>
            <p style="color:#9CA3AF;margin:4px 0 0">your 90% share · total tip ${dollarFormat(amountCents)}</p>
            ${note ? `<p style="margin-top:12px;color:#F0E8D4;font-style:italic">"${note}"</p>` : ''}
          </div>
          <p style="color:#9CA3AF;font-size:13px">Balance available in your wallet. Withdraw anytime.</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/analytics"
             style="display:inline-block;margin-top:16px;background:#1F1F2E;color:#F0E8D4;padding:10px 24px;border-radius:4px;text-decoration:none;letter-spacing:0.1em">
            VIEW ANALYTICS →
          </a>
        </div>
      `,
    })
  } catch (e) {
    console.error('[email] sendTipReceivedEmail failed:', e)
  }
}

export async function sendNewFollowerEmail(
  to: string,
  creatorUsername: string,
  followerUsername: string,
  followerCount: number,
) {
  try {
    await getResend().emails.send({
      from: FROM,
      to,
      subject: `@${followerUsername} followed you on SeeWhy LIVE`,
      html: `
        <div style="background:#03030A;color:#F0E8D4;font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px 24px">
          <h1 style="font-size:28px;letter-spacing:0.1em;margin:0 0 24px">NEW FOLLOWER 👤</h1>
          <p>Hey <strong>@${creatorUsername}</strong>,</p>
          <p><strong>@${followerUsername}</strong> is now following you.</p>
          <p style="color:#9CA3AF">You now have <strong style="color:#00F5FF">${followerCount.toLocaleString()}</strong> followers.</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/${creatorUsername}"
             style="display:inline-block;margin-top:24px;background:#1F1F2E;color:#F0E8D4;padding:10px 24px;border-radius:4px;text-decoration:none;letter-spacing:0.1em">
            VIEW PROFILE →
          </a>
        </div>
      `,
    })
  } catch (e) {
    console.error('[email] sendNewFollowerEmail failed:', e)
  }
}

export async function sendSubscriptionEmail(
  to: string,
  creatorUsername: string,
  subscriberUsername: string,
  tierName: string,
  creatorShareCents: number,
) {
  try {
    await getResend().emails.send({
      from: FROM,
      to,
      subject: `@${subscriberUsername} subscribed — ${dollarFormat(creatorShareCents)}/mo`,
      html: `
        <div style="background:#03030A;color:#F0E8D4;font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px 24px">
          <h1 style="font-size:28px;letter-spacing:0.1em;margin:0 0 24px">NEW SUBSCRIBER ⭐</h1>
          <p>Hey <strong>@${creatorUsername}</strong>,</p>
          <p><strong>@${subscriberUsername}</strong> subscribed at the <strong>${tierName}</strong> tier!</p>
          <div style="background:#0E0C09;border:1px solid #1F1F2E;border-radius:8px;padding:20px;margin:20px 0">
            <p style="font-size:32px;color:#4ADE80;font-weight:bold;margin:0">${dollarFormat(creatorShareCents)}/mo</p>
            <p style="color:#9CA3AF;margin:4px 0 0">your 90% monthly share</p>
          </div>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/analytics"
             style="display:inline-block;margin-top:16px;background:#1F1F2E;color:#F0E8D4;padding:10px 24px;border-radius:4px;text-decoration:none;letter-spacing:0.1em">
            VIEW ANALYTICS →
          </a>
        </div>
      `,
    })
  } catch (e) {
    console.error('[email] sendSubscriptionEmail failed:', e)
  }
}

export async function sendPasswordResetEmail(to: string, resetToken: string) {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`
  try {
    await getResend().emails.send({
      from: FROM,
      to,
      subject: 'Reset your SeeWhy LIVE password',
      html: `
        <div style="background:#03030A;color:#F0E8D4;font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px 24px">
          <h1 style="font-size:28px;letter-spacing:0.1em;margin:0 0 24px">PASSWORD RESET</h1>
          <p>We received a request to reset your password. Click the link below — it expires in 1 hour.</p>
          <a href="${resetUrl}"
             style="display:inline-block;margin-top:16px;background:#FF1564;color:#fff;padding:12px 28px;border-radius:4px;text-decoration:none;font-weight:bold;letter-spacing:0.1em">
            RESET PASSWORD →
          </a>
          <p style="margin-top:24px;color:#9CA3AF;font-size:13px">If you didn't request this, ignore this email — your password is unchanged.</p>
        </div>
      `,
    })
  } catch (e) {
    console.error('[email] sendPasswordResetEmail failed:', e)
  }
}
