'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Input } from '@/components/ui/Input'
import { Btn } from '@/components/ui/Btn'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', username: '', displayName: '', password: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()

    if (!data.success) {
      if (data.error?.fields) {
        const errs: Record<string, string> = {}
        for (const [k, msgs] of Object.entries(data.error.fields)) {
          errs[k] = (msgs as string[])[0]
        }
        setErrors(errs)
      } else {
        setErrors({ _: data.error?.message ?? 'Registration failed' })
      }
      setLoading(false)
      return
    }

    // Auto sign-in after registration
    await signIn('credentials', {
      email: form.email,
      password: form.password,
      redirect: false,
    })
    router.push('/discover')
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="font-bebas text-hero text-text">JOIN</h1>
          <p className="mt-1 font-barlow text-body text-muted">Create your SeeWhy LIVE account</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={update('email')}
            error={errors['email']}
            required
          />
          <Input
            label="Username"
            type="text"
            value={form.username}
            onChange={update('username')}
            error={errors['username']}
            hint="Letters, numbers, underscores only"
            required
          />
          <Input
            label="Display Name"
            type="text"
            value={form.displayName}
            onChange={update('displayName')}
            error={errors['displayName']}
          />
          <Input
            label="Password"
            type="password"
            value={form.password}
            onChange={update('password')}
            error={errors['password']}
            hint="8+ chars, uppercase, lowercase, number, special"
            required
          />

          {errors._ && <p className="font-barlow text-label text-red">{errors._}</p>}

          <Btn type="submit" loading={loading} className="w-full mt-2">
            CREATE ACCOUNT
          </Btn>
        </form>

        <p className="mt-6 text-center font-barlow text-body text-muted">
          Already have an account?{' '}
          <a href="/login" className="text-cyan transition-colors hover:text-cyan/80">
            Sign in
          </a>
        </p>
      </div>
    </div>
  )
}
