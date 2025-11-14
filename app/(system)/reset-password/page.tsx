"use client";

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { useResetPasswordMutation } from '@/lib/redux/authSlice';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Logo } from '@/components/logo';

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' }
  }
};

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [resetPassword] = useResetPasswordMutation();
  const { toast } = useToast();

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (!tokenParam) {
      toast({
        title: 'Error',
        description: 'Invalid or missing reset token',
        variant: 'destructive',
      });
      router.push('/forgot-password');
      return;
    }
    setToken(tokenParam);
  }, [searchParams, router, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'Passwords do not match',
        variant: 'destructive',
      });
      return;
    }

    if (password.length < 8) {
      toast({
        title: 'Error',
        description: 'Password must be at least 8 characters long',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await resetPassword({ token, newPassword: password , confirmPassword }).unwrap();
      setIsSuccess(true);
      toast({
        title: 'Success',
        description: 'Your password has been reset successfully.',
      });
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/sign-in');
      }, 3000);
    } catch (error) {
      console.error('Error resetting password:', error);
      toast({
        title: 'Error',
        description: 'Failed to reset password. The link may have expired or is invalid.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center">
            <Logo className="h-12 w-auto" />
          </div>
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            className="mt-8 bg-white py-8 px-4 shadow-xl rounded-lg sm:px-10 border border-gray-100 text-center"
          >
            <div className="text-green-500 mb-4">
              <svg
                className="h-12 w-12 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Password Reset Successful!</h2>
            <p className="text-gray-600 mb-6">
              Your password has been updated successfully. You will be redirected to the login page shortly.
            </p>
            <Button asChild>
              <Link href="/sign-in">Go to Login</Link>
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-700">Verifying your reset link...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Logo className="h-12 w-auto" />
        </div>
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="mt-8 bg-white py-8 px-4 shadow-xl rounded-lg sm:px-10 border border-gray-100"
        >
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Reset Your Password</h2>
            <p className="mt-2 text-sm text-gray-600">
              Please enter your new password below.
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                New Password
              </label>
              <div className="mt-1">
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Enter new password"
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm New Password
              </label>
              <div className="mt-1">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Confirm new password"
                />
              </div>
            </div>

            <div>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Resetting Password...' : 'Reset Password'}
              </Button>
            </div>
          </form>

          <div className="mt-4 text-center text-sm">
            <Link 
              href="/sign-in" 
              className="font-medium text-orange-600 hover:text-orange-500"
            >
              Back to Sign In
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
