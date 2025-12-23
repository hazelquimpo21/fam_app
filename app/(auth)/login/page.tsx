'use client';

/**
 * ============================================================================
 * Login Page
 * ============================================================================
 *
 * User login with magic link (passwordless).
 *
 * Route: /login
 *
 * ============================================================================
 */

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Home, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useAuth } from '@/lib/hooks/use-auth';
import { logger } from '@/lib/utils/logger';

/**
 * Form validation schema
 */
const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
});

type LoginFormData = z.infer<typeof loginSchema>;

/**
 * Login Page Component
 */
export default function LoginPage() {
  const { sendMagicLink } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);

    logger.info('Sending magic link...', { email: data.email });

    const result = await sendMagicLink(data.email);

    setIsLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setSubmittedEmail(data.email);
    setEmailSent(true);
  };

  // Success state - magic link sent
  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-white p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>

            <h2 className="text-xl font-semibold text-neutral-900 mb-2">
              Check your email!
            </h2>

            <p className="text-neutral-600 mb-2">
              We sent a magic link to:
            </p>
            <p className="font-medium text-neutral-900 mb-6">
              {submittedEmail}
            </p>
            <p className="text-sm text-neutral-500 mb-6">
              Click the link in your email to sign in. No password needed!
            </p>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => setEmailSent(false)}
            >
              Use a different email
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-white p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600">
            <Home className="h-6 w-6 text-white" />
          </div>

          <CardTitle className="text-2xl">Welcome back!</CardTitle>
          <CardDescription>
            Enter your email to receive a magic link
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label
                htmlFor="email"
                className="text-sm font-medium text-neutral-700"
              >
                Email
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

            <Button
              type="submit"
              className="w-full"
              loading={isLoading}
            >
              Send Magic Link
            </Button>

            <p className="text-center text-sm text-neutral-600">
              Don't have an account?{' '}
              <Link
                href="/signup"
                className="font-medium text-indigo-600 hover:text-indigo-700"
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
