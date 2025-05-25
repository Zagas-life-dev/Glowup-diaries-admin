"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";

const LoginPage = () => {
  const searchParams = useSearchParams();
  const errorType = searchParams.get("error");
  const supabase = createClientComponentClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Handle error parameters from middleware
    if (errorType === "rate_limit") {
      setIsRateLimited(true);
      setError("Request rate limit reached. Please wait a few minutes before trying again.");
      toast.error("Rate limit reached", {
        description: "Please wait a few minutes before trying again.",
      });
    } else if (errorType === "too_many_auth_attempts") {
      setError("Too many authentication attempts detected. This could be due to a network issue or browser configuration.");
      toast.error("Authentication issue detected", {
        description: "Please try clearing your cookies or using a different browser.",
      });
    }

    const checkRateLimits = async () => {
      try {
        const { error } = await supabase.auth.getSession();
        if (error && error.status === 429) {
          console.log("Rate limit detected on initial load:", error);
          setIsRateLimited(true);
          setError("Request rate limit reached. Please wait a few minutes before trying again.");
          toast.error("Rate limit reached", {
            description: "Please wait a few minutes before trying again.",
          });
        }
      } catch (err) {
        console.error("Error checking session:", err);
      }
    };

    // Only check for rate limits if we haven't already detected one from URL params
    if (!errorType) {
      checkRateLimits();
    }
  }, [errorType, supabase.auth]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Don't attempt login if we're rate limited
      if (isRateLimited) {
        setError("Please wait a few minutes before trying again due to rate limiting.");
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Login error:", error);

        if (error.status === 429) {
          setIsRateLimited(true);
          setError("Request rate limit reached. Please wait a few minutes before trying again.");
          toast.error("Rate limit reached", {
            description: "Please wait a few minutes before trying again.",
          });
        } else {
          setError(error.message);
        }
      } else {
        toast.success("Login successful", {
          description: "Redirecting to dashboard...",
        });
        window.location.href = "/admin/dashboard";
      }
    } catch (err: any) {
      console.error("Unexpected error during login:", err);
      setError(err.message || "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded shadow-md">
        <h2 className="text-2xl font-bold text-center">Welcome to Admin Portal</h2>
        <p className="text-center text-gray-600">Please log in to continue</p>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
            {isRateLimited && (
              <p className="mt-2 text-sm">
                Rate limits are temporary and usually resolve within a few minutes.
                Please wait before trying again.
              </p>
            )}
          </Alert>
        )}

        <form className="space-y-4" onSubmit={handleLogin}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              id="email"
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:ring-blue-300"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isRateLimited || isLoading}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              id="password"
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:ring-blue-300"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isRateLimited || isLoading}
            />
          </div>

          <button
            type="submit"
            className="w-full px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 focus:outline-none focus:ring focus:ring-blue-300 disabled:bg-blue-300 disabled:cursor-not-allowed"
            disabled={isRateLimited || isLoading}
          >
            {isLoading ? "Logging in..." : "Log In"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
