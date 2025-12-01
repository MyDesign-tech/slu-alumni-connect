"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { GraduationCap, ArrowRight, Loader2, Eye, EyeOff } from "lucide-react";
import { addSignupNotification } from "@/lib/admin-data-store";

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    graduationYear: "",
    program: "",
    password: "",
    confirmPassword: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(""); // Clear error on input change
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    // Validate password length
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setIsLoading(false);
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      setIsLoading(false);
      return;
    }

    // Validate required fields
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setError('First name and last name are required');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email.trim(),
          password: formData.password,
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          graduationYear: formData.graduationYear || new Date().getFullYear().toString(),
          program: formData.program || 'Computer Science',
          department: formData.program.includes('Computer Science') || formData.program.includes('Engineering') ? 'STEM' :
            formData.program.includes('Business') ? 'BUSINESS' :
              formData.program.includes('Medicine') || formData.program.includes('Nursing') ? 'HEALTHCARE' :
                formData.program.includes('Social Work') || formData.program.includes('Education') ? 'SOCIAL_SCIENCES' : 'HUMANITIES'
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Add notification for admin to verify this new user
        if (data.notificationData) {
          addSignupNotification(data.notificationData);
        }
        alert('Registration successful! Redirecting to login page...');
        router.push('/login');
      } else {
        setError(data.error || 'Registration failed. Please try again.');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError('An error occurred during registration. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center p-4">
      {/* Full Background Image */}
      <div className="absolute inset-0 bg-[url('/login-bg.png')] bg-cover bg-center"></div>

      {/* Overlay for better text readability */}
      <div className="absolute inset-0 bg-black/40"></div>

      {/* Top Left Branding */}
      <div className="absolute top-8 left-8 z-10 text-white">
        <div className="flex items-center gap-2 text-2xl font-bold mb-2">
          <GraduationCap className="h-8 w-8" />
          <span>SLU Alumni Connect</span>
        </div>
        <p className="text-blue-100 max-w-md text-sm">
          Saint Louis University&apos;s official platform for alumni engagement, mentorship, and lifelong connection.
        </p>
      </div>

      {/* Floating Signup Card */}
      <Card className="relative z-10 w-full max-w-lg shadow-2xl bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-2xl border border-white/20 rounded-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none"></div>

        <CardHeader className="space-y-1 text-center pb-4 pt-5 relative z-10">
          <div className="mb-2 inline-flex mx-auto p-1.5 rounded-full bg-white/10 backdrop-blur-sm">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white drop-shadow-lg">Join the Network</h1>
          <p className="text-white/70 text-xs">
            Create your account to connect with fellow SLU alumni
          </p>
        </CardHeader>

        <CardContent className="space-y-3.5 px-5 pb-5 relative z-10">
          {error && (
            <div className="bg-red-500/20 backdrop-blur-sm text-white text-xs p-2.5 rounded-lg border border-red-500/30 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-red-400"></div>
                {error}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-white/90" htmlFor="firstName">
                  First Name
                </label>
                <Input
                  id="firstName"
                  name="firstName"
                  placeholder="John"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50 backdrop-blur-sm focus:bg-white/15 focus:border-white/30"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-white/90" htmlFor="lastName">
                  Last Name
                </label>
                <Input
                  id="lastName"
                  name="lastName"
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50 backdrop-blur-sm focus:bg-white/15 focus:border-white/30"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/90" htmlFor="email">
                Email Address
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="billiken@slu.edu"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50 backdrop-blur-sm focus:bg-white/15 focus:border-white/30"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-white/90" htmlFor="graduationYear">
                  Graduation Year
                </label>
                <Input
                  id="graduationYear"
                  name="graduationYear"
                  type="number"
                  placeholder="2020"
                  min="1950"
                  max="2030"
                  value={formData.graduationYear}
                  onChange={handleInputChange}
                  required
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50 backdrop-blur-sm focus:bg-white/15 focus:border-white/30"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-white/90" htmlFor="program">
                  Program
                </label>
                <select
                  id="program"
                  name="program"
                  value={formData.program}
                  onChange={handleInputChange}
                  required
                  className="flex h-9 w-full rounded-md border bg-white/10 border-white/20 text-white placeholder:text-white/50 backdrop-blur-sm focus:bg-white/15 focus:border-white/30 px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/30 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="" className="text-gray-900">Select Program</option>
                  <option value="Computer Science" className="text-gray-900">Computer Science</option>
                  <option value="Business Administration" className="text-gray-900">Business Administration</option>
                  <option value="Engineering" className="text-gray-900">Engineering</option>
                  <option value="Liberal Arts" className="text-gray-900">Liberal Arts</option>
                  <option value="Medicine" className="text-gray-900">Medicine</option>
                  <option value="Nursing" className="text-gray-900">Nursing</option>
                  <option value="Law" className="text-gray-900">Law</option>
                  <option value="Education" className="text-gray-900">Education</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/90" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50 backdrop-blur-sm focus:bg-white/15 focus:border-white/30 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/90" htmlFor="confirmPassword">
                Confirm Password
              </label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50 backdrop-blur-sm focus:bg-white/15 focus:border-white/30 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-sm transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl mt-4"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  Create account
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>

            <div className="text-center text-xs text-white/70 mt-3">
              Already have an account?{" "}
              <Link href="/login" className="text-white font-medium hover:underline">
                Sign in
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
