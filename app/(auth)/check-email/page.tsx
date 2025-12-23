'use client';

/**
 * ============================================================================
 * 📧 Check Email Confirmation Page
 * ============================================================================
 * 
 * Shown after sending a magic link to confirm the user should check their email.
 * Provides a friendly UI while they wait to click the link.
 * 
 * Query params:
 * - email: The email address the link was sent to (for display)
 * - type: 'signup' or 'login' (for messaging)
 * 
 * Route: /check-email
 * 
 * ============================================================================
 */

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Mail, ArrowLeft, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

/**
 * Inner component that uses useSearchParams
 * Wrapped in Suspense for Next.js 14 compatibility
 */
function CheckEmailContent() {
  const searchParams = useSearchParams();
  
  // Get email and type from query params
  const email = searchParams.get('email') || 'your email';
  const type = searchParams.get('type') || 'login';
  
  // Different messaging based on signup vs login
  const isSignup = type === 'signup';
  const title = isSignup ? 'Check your email!' : 'Check your email!';
  const subtitle = isSignup 
    ? 'We sent you a magic link to complete your signup'
    : 'We sent you a magic link to sign in';

  /**
   * Handle resend button click
   * Opens the appropriate auth page to resend
   */
  const handleResend = () => {
    // Navigate back to signup/login to resend
    window.location.href = isSignup ? '/signup' : '/login';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-4">
      <Card className="w-full max-w-md shadow-xl border-0 text-center">
        <CardHeader className="pb-2">
          {/* Animated email icon */}
          <div className="mx-auto mb-4 relative">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-100 to-teal-100">
              <Mail className="h-10 w-10 text-emerald-600 animate-pulse" />
            </div>
            {/* Decorative sparkles */}
            <span className="absolute -top-1 -right-1 text-2xl animate-bounce">✨</span>
            <span className="absolute -bottom-1 -left-1 text-xl animate-bounce delay-100">✨</span>
          </div>

          <CardTitle className="text-2xl font-bold text-gray-900">
            {title}
          </CardTitle>
          <CardDescription className="text-gray-600 text-base">
            {subtitle}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 pt-4">
          {/* Email display */}
          <div className="rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 p-4">
            <p className="text-sm text-gray-600 mb-1">We sent a link to:</p>
            <p className="font-medium text-emerald-700 text-lg break-all">
              {email}
            </p>
          </div>

          {/* Instructions */}
          <div className="space-y-3 text-sm text-gray-600">
            <p>
              📬 Click the link in the email to {isSignup ? 'complete your signup' : 'sign in'}.
            </p>
            <p>
              ⏰ The link expires in 1 hour.
            </p>
            <p>
              📁 Can't find it? Check your spam folder.
            </p>
          </div>

          {/* Action buttons */}
          <div className="space-y-3 pt-2">
            {/* Resend button */}
            <Button
              variant="secondary"
              className="w-full"
              onClick={handleResend}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Resend magic link
            </Button>

            {/* Back to login/signup */}
            <Link href={isSignup ? '/signup' : '/login'} className="block">
              <Button variant="ghost" className="w-full text-gray-600">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to {isSignup ? 'signup' : 'login'}
              </Button>
            </Link>
          </div>

          {/* Footer with logo */}
          <div className="pt-4 border-t border-gray-100 flex items-center justify-center gap-2 text-gray-400 text-sm">
            <Home className="h-4 w-4" />
            <span>Fam</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Check Email Page Component
 * 
 * Wraps the content in Suspense for Next.js 14 compatibility
 * with useSearchParams.
 */
export default function CheckEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50">
        <div className="animate-pulse text-emerald-600">Loading...</div>
      </div>
    }>
      <CheckEmailContent />
    </Suspense>
  );
}

