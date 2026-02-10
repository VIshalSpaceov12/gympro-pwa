'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, type RegisterInput } from '@gympro/shared';
import { useAuthStore } from '@/stores/auth.store';
import { cn } from '@/lib/utils';
import { Loader2, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';

function getPasswordStrength(password: string): { label: string; color: string; width: string } {
  if (!password) return { label: '', color: '', width: '0%' };

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  if (score <= 2) return { label: 'Weak', color: 'bg-red-500', width: '33%' };
  if (score <= 3) return { label: 'Medium', color: 'bg-yellow-500', width: '66%' };
  return { label: 'Strong', color: 'bg-green-500', width: '100%' };
}

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser, isLoading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      firstName: '',
      lastName: '',
    },
  });

  const passwordValue = watch('password');
  const passwordStrength = useMemo(() => getPasswordStrength(passwordValue || ''), [passwordValue]);

  const onSubmit = async (data: RegisterInput) => {
    setServerError(null);
    try {
      await registerUser(data.email, data.password, data.firstName, data.lastName);
      router.push('/dashboard');
    } catch (error) {
      setServerError(error instanceof Error ? error.message : 'Registration failed. Please try again.');
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Create an account</h2>
      <p className="text-sm text-muted mb-6">Start your fitness journey today</p>

      {serverError && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800 p-3 text-sm text-red-600 dark:text-red-400">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Name fields */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              First name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                id="firstName"
                type="text"
                autoComplete="given-name"
                placeholder="John"
                className={cn(
                  'w-full rounded-lg border bg-white dark:bg-gray-800 dark:text-white py-2.5 pl-10 pr-4 text-sm outline-none transition-colors',
                  'focus:border-primary focus:ring-2 focus:ring-primary/20',
                  errors.firstName ? 'border-red-500' : 'border-border'
                )}
                {...register('firstName')}
              />
            </div>
            {errors.firstName && (
              <p className="mt-1 text-xs text-red-500">{errors.firstName.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Last name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                id="lastName"
                type="text"
                autoComplete="family-name"
                placeholder="Doe"
                className={cn(
                  'w-full rounded-lg border bg-white dark:bg-gray-800 dark:text-white py-2.5 pl-10 pr-4 text-sm outline-none transition-colors',
                  'focus:border-primary focus:ring-2 focus:ring-primary/20',
                  errors.lastName ? 'border-red-500' : 'border-border'
                )}
                {...register('lastName')}
              />
            </div>
            {errors.lastName && (
              <p className="mt-1 text-xs text-red-500">{errors.lastName.message}</p>
            )}
          </div>
        </div>

        {/* Email field */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              className={cn(
                'w-full rounded-lg border bg-white dark:bg-gray-800 dark:text-white py-2.5 pl-10 pr-4 text-sm outline-none transition-colors',
                'focus:border-primary focus:ring-2 focus:ring-primary/20',
                errors.email ? 'border-red-500' : 'border-border'
              )}
              {...register('email')}
            />
          </div>
          {errors.email && (
            <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
          )}
        </div>

        {/* Password field */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Create a password"
              className={cn(
                'w-full rounded-lg border bg-white dark:bg-gray-800 dark:text-white py-2.5 pl-10 pr-10 text-sm outline-none transition-colors',
                'focus:border-primary focus:ring-2 focus:ring-primary/20',
                errors.password ? 'border-red-500' : 'border-border'
              )}
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              tabIndex={-1}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
          )}

          {/* Password strength indicator */}
          {passwordValue && (
            <div className="mt-2">
              <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all duration-300', passwordStrength.color)}
                  style={{ width: passwordStrength.width }}
                />
              </div>
              <p className={cn(
                'text-xs mt-1',
                passwordStrength.label === 'Weak' && 'text-red-500',
                passwordStrength.label === 'Medium' && 'text-yellow-600',
                passwordStrength.label === 'Strong' && 'text-green-600',
              )}>
                Password strength: {passwordStrength.label}
              </p>
            </div>
          )}
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={isLoading}
          className={cn(
            'w-full flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors',
            'hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2',
            'min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating account...
            </>
          ) : (
            'Create account'
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Already have an account?{' '}
        <Link href="/login" className="text-primary hover:text-primary-dark font-semibold">
          Sign in
        </Link>
      </p>
    </div>
  );
}
