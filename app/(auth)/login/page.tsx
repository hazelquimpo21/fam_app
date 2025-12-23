'use client';

/**
 * ============================================================================
 * 🔐 Login Page (Magic Link)
 * ============================================================================
 * 
 * User login using Supabase Magic Link authentication.
 * 
 * Flow:
 * 1. User enters their email
 * 2. Magic link is sent to their email
 * 3. User is redirected to check-email confirmation page
 * 4. Clicking the link in email → /auth/callback → authenticated
 * 
 * Route: /login
 * 
 * ============================================================================
 */

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Home, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/utils/logger';

/**
 * Form validation schema for magic link login
 * Only requires email - no password needed!
 */
const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
});

type LoginFormData = z.infer<typeof loginSchema>;

/**
 * Login Page Component
 * 
 * Uses Supabase magic link for passwordless authentication.
 * User enters their email, receives a magic link,
 * and clicking it completes the login process.
 */
export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize Supabase client for magic link
  const supabase = createClient();

  // Form setup with Zod validation
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  /**
   * Handle form submission - sends magic link email
   * 
   * @param data - Form data containing email
   */
  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);

    logger.info('📧 Sending magic link for login...', { email: data.email });

    try {
      // Send magic link using Supabase OTP (signInWithOtp)
      // Works for existing users - creates session on click
      const { error: magicLinkError } = await supabase.auth.signInWithOtp({
        email: data.email,
        options: {
          // Redirect URL after clicking the magic link
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/`,
        },
      });

      if (magicLinkError) {
        logger.error('❌ Magic link failed', { error: magicLinkError.message });
        setError(magicLinkError.message);
        setIsLoading(false);
        return;
      }

      logger.success('✅ Magic link sent!', { email: data.email });

      // Redirect to check-email page with email param for display
      router.push(`/check-email?email=${encodeURIComponent(data.email)}&type=login`);

    } catch (err) {
      logger.error('❌ Unexpected error', { error: err });
      setError('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-4">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="text-center pb-2">
          {/* Logo with Fam branding */}
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg">
            <Home className="h-7 w-7 text-white" />
          </div>

          <CardTitle className="text-2xl font-bold text-gray-900">
            Welcome back!
          </CardTitle>
          <CardDescription className="text-gray-600">
            Sign in to your Fam account
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-4">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Error message display */}
            {error && (
              <div className="rounded-xl bg-red-50 border border-red-100 p-4 text-sm text-red-600 flex items-center gap-2">
                <span className="text-lg">⚠️</span>
                {error}
              </div>
            )}

            {/* Magic link info banner */}
            <div className="rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 p-4 text-sm text-emerald-700 flex items-start gap-3">
              <Sparkles className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Passwordless sign in</p>
                <p className="text-emerald-600 mt-1">
                  We'll email you a secure link to sign in instantly.
                </p>
              </div>
            </div>

            {/* Email field */}
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="text-sm font-medium text-gray-700"
              >
                Email address
              </label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                leftIcon={<Mail className="h-4 w-4" />}
                error={errors.email?.message}
                {...register('email')}
              />
            </div>

            {/* Submit button */}
            <Button
              type="submit"
              className="w-full h-12 text-base font-medium bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
              loading={isLoading}
            >
              {isLoading ? 'Sending magic link...' : 'Send Magic Link'}
            </Button>

            {/* Sign up link */}
            <p className="text-center text-sm text-gray-600 pt-2">
              Don't have an account?{' '}
              <Link
                href="/signup"
                className="font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
              >
                Sign up
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
