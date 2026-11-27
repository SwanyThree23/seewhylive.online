import React, { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Mail, Lock, Loader2 } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import AuthLayout from "@/components/AuthLayout";
import GoogleIcon from "@/components/GoogleIcon";
import { toast } from "@/components/ui/use-toast";

export default function Register() {
  var [email, setEmail] = useState("");
  var [password, setPassword] = useState("");
  var [confirmPassword, setConfirmPassword] = useState("");
  var [error, setError] = useState("");
  var [loading, setLoading] = useState(false);
  var [showOtp, setShowOtp] = useState(false);
  var [otpCode, setOtpCode] = useState("");
  var [username, setUsername] = useState("");
  var [usernameStatus, setUsernameStatus] = useState(null);
  var debounceRef = useRef(null);

  var handleSubmit = async function(e) {
    e.preventDefault();
    setError("");
    if (!username.trim() || username.trim().length < 3) {
      setError("Username must be at least 3 characters");
      return;
    }
    if (usernameStatus === 'taken') {
      setError("That username is already taken");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await base44.auth.register({ email, password });
      setShowOtp(true);
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  function handleUsernameChange(val) {
    var clean = val.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setUsername(clean);
    setUsernameStatus(clean.length > 2 ? 'checking' : null);
    if (debounceRef.current) { clearTimeout(debounceRef.current); }
    if (clean.length < 3) return;
    debounceRef.current = setTimeout(function() {
      fetch('/api/check-username?username=' + encodeURIComponent(clean))
        .then(function(r) { return r.json(); })
        .then(function(data) { setUsernameStatus(data.available ? 'available' : 'taken'); })
        .catch(function() { setUsernameStatus(null); });
    }, 500);
  }

  var handleVerify = async function() {
    setError("");
    setLoading(true);
    try {
      var result = await base44.auth.verifyOtp({ email, otpCode });
      if ((result && result.access_token)) {
        base44.auth.setToken(result.access_token);
      }
      window.location.href = "/onboarding";
    } catch (err) {
      setError(err.message || "Invalid verification code");
    } finally {
      setLoading(false);
    }
  };

  var handleResend = async function() {
    setError("");
    try {
      await base44.auth.resendOtp(email);
      toast({
        title: "Code sent",
        description: "Check your email for the new code.",
      });
    } catch (err) {
      setError(err.message || "Failed to resend code");
    }
  };

  var handleGoogle = function() {
    base44.auth.loginWithProvider("google", "/");
  };

  var handleMicrosoft = function() {
    base44.auth.loginWithProvider("microsoft", "/");
  };

  var handleFacebook = function() {
    base44.auth.loginWithProvider("facebook", "/");
  };

  var handleApple = function() {
    base44.auth.loginWithProvider("apple", "/");
  };

  if (showOtp) {
    return (
      <AuthLayout
        icon={Mail}
        title="Verify your email"
        subtitle={`We sent a code to ${email}`}
      >
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}
        <div className="flex justify-center mb-6">
          <InputOTP
            maxLength={6}
            value={otpCode}
            onChange={setOtpCode}
            autoFocus
            autoComplete="one-time-code"
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>
        <Button
          className="w-full h-12 font-medium"
          onClick={handleVerify}
          disabled={loading || otpCode.length < 6}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Verifying...
            </>
          ) : (
            "Verify"
          )}
        </Button>
        <p className="text-center text-sm text-muted-foreground mt-4">
          Didn't receive the code?{" "}
          <button onClick={handleResend} className="text-primary font-medium hover:underline">
            Resend
          </button>
        </p>
      </AuthLayout>
    );
  }

  var pwChecks = {
    len: password.length >= 8,
    upper: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
  var pwScore = (pwChecks.len ? 1 : 0) + (pwChecks.upper ? 1 : 0) + (pwChecks.number ? 1 : 0) + (pwChecks.special ? 1 : 0);
  var pwBarColor = pwScore <= 1 ? '#EF4444' : pwScore === 2 ? '#F59E0B' : pwScore === 3 ? '#EAB308' : '#22C55E';
  var pwLabel = pwScore === 0 ? '' : pwScore <= 1 ? 'Weak' : pwScore === 2 ? 'Fair' : pwScore === 3 ? 'Good' : 'Strong';

  return (
    <AuthLayout
      icon={UserPlus}
      title="Create your account"
      subtitle="Sign up to get started"
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="text-primary font-medium hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <div className="space-y-2 mb-6">
        <Button
          variant="outline"
          className="w-full h-12 text-sm font-medium"
          onClick={handleGoogle}
        >
          <GoogleIcon className="w-5 h-5 mr-2" />
          Continue with Google
        </Button>
        <Button
          variant="outline"
          className="w-full h-12 text-sm font-medium"
          onClick={handleMicrosoft}
        >
          <svg className="w-5 h-5 mr-2" viewBox="0 0 23 23" aria-hidden="true"><rect x="1" y="1" width="10" height="10" fill="#F25022" rx="0.5"/><rect x="12" y="1" width="10" height="10" fill="#7FBA00" rx="0.5"/><rect x="1" y="12" width="10" height="10" fill="#00A4EF" rx="0.5"/><rect x="12" y="12" width="10" height="10" fill="#FFB900" rx="0.5"/></svg>
          Continue with Microsoft
        </Button>
        <Button
          variant="outline"
          className="w-full h-12 text-sm font-medium"
          onClick={handleFacebook}
        >
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" aria-hidden="true"><path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
          Continue with Facebook
        </Button>
        <Button
          variant="outline"
          className="w-full h-12 text-sm font-medium"
          onClick={handleApple}
        >
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.05 12.04c-.03-2.6 2.12-3.85 2.22-3.91-1.21-1.77-3.09-2.01-3.76-2.04-1.6-.16-3.12.94-3.93.94-.81 0-2.06-.92-3.39-.89-1.74.03-3.35 1.01-4.25 2.57-1.81 3.14-.46 7.78 1.3 10.32.86 1.25 1.88 2.65 3.22 2.6 1.29-.05 1.78-.83 3.34-.83 1.56 0 2 .83 3.37.81 1.39-.03 2.27-1.27 3.12-2.53.98-1.44 1.39-2.83 1.41-2.9-.03-.01-2.7-1.04-2.73-4.13zM14.63 4.59c.71-.87 1.19-2.06 1.06-3.26-1.02.04-2.26.68-3 1.54-.66.76-1.24 1.98-1.08 3.15 1.14.09 2.31-.58 3.02-1.43z"/></svg>
          Continue with Apple
        </Button>
      </div>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-3 text-muted-foreground">or</span>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              autoFocus
              placeholder="you@example.com"
              value={email}
              onChange={function(e) { setEmail(e.target.value); }}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium select-none" aria-hidden="true">@</span>
            <Input
              id="username"
              type="text"
              autoComplete="username"
              placeholder="yourcreatorname"
              value={username}
              onChange={function(e) { handleUsernameChange(e.target.value); }}
              className="pl-7 h-12 pr-28"
              required
              minLength={3}
              maxLength={30}
            />
            {usernameStatus === 'checking' && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">checking…</span>
            )}
            {usernameStatus === 'available' && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-green-500">✓ Available</span>
            )}
            {usernameStatus === 'taken' && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-destructive">✗ Taken</span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">Lowercase letters, numbers, and underscores only.</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={password}
              onChange={function(e) { setPassword(e.target.value); }}
              className="pl-10 h-12"
              required
            />
          </div>
          {password.length > 0 && (
            <div className="space-y-2 pt-1">
              <div className="flex items-center gap-2">
                <div className="flex gap-1 flex-1">
                  {[1, 2, 3, 4].map(function(n) {
                    return (
                      <div
                        key={n}
                        className="h-1.5 flex-1 rounded-full transition-all duration-300"
                        style={{ background: n <= pwScore ? pwBarColor : 'rgba(0,0,0,0.1)' }}
                      />
                    );
                  })}
                </div>
                {pwLabel && (
                  <span className="text-xs font-semibold" style={{ color: pwBarColor, minWidth: 40 }}>{pwLabel}</span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                {[
                  { key: 'len',     label: '8+ characters' },
                  { key: 'upper',   label: 'Uppercase letter' },
                  { key: 'number',  label: 'Number' },
                  { key: 'special', label: 'Special character' },
                ].map(function(req) {
                  return (
                    <span
                      key={req.key}
                      className="flex items-center gap-1 text-xs transition-colors duration-200"
                      style={{ color: pwChecks[req.key] ? '#22C55E' : undefined }}
                    >
                      <span className="font-bold">{pwChecks[req.key] ? '✓' : '○'}</span>
                      {req.label}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm">Confirm Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="confirm"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={function(e) { setConfirmPassword(e.target.value); }}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating account...
            </>
          ) : (
            "Create account"
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}