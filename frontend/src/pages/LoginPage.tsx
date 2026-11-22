import { useState, type FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { Navigate, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Activity } from "lucide-react";

import { loginUser } from "../api/auth.api";
import { useAuth } from "../context/AuthContext";

function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const loginMutation = useMutation({
    mutationFn: loginUser,
    onSuccess: (data) => {
      login(data);
      navigate("/", { replace: true });
    },
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    loginMutation.mutate({
      email: email.trim(),
      password,
    });
  };

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const inputClass =
    "h-12 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20";

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-8">
      {/* Background decorations */}
      <div className="pointer-events-none absolute -left-[120px] -top-[150px] h-[400px] w-[400px] rounded-full bg-[#635BFF]/10 blur-[100px]" />

      <div className="pointer-events-none absolute -bottom-[120px] -right-[100px] h-[350px] w-[350px] rounded-full bg-[#14B8A6]/10 blur-[100px]" />

      {/* Login card */}
      <div className="relative z-10 w-full max-w-[430px] rounded-2xl border border-border bg-card shadow-[0_24px_70px_rgba(15,23,42,0.10)] dark:shadow-[0_24px_70px_rgba(0,0,0,0.40)]">
        <div className="p-6 sm:p-9">
          {/* Logo and heading */}
          <div className="mb-8 text-center">
            <div className="mb-4 inline-flex h-[58px] w-[58px] items-center justify-center rounded-xl bg-gradient-to-br from-[#635BFF] to-[#14B8A6] text-white shadow-[0_8px_22px_rgba(99,91,255,0.28)]">
              <Activity size={32} />
            </div>

            <h1 className="bg-gradient-to-r from-[#635BFF] to-[#14B8A6] bg-clip-text text-4xl font-extrabold text-transparent">
              Pulse
            </h1>

            <p className="mt-2 text-sm text-muted-foreground">
              Error Monitoring Application
            </p>
          </div>

          {/* Welcome message */}
          <h2 className="mb-1 text-xl font-bold text-foreground">
            Welcome back
          </h2>

          <p className="mb-6 text-sm text-muted-foreground">
            Sign in to continue to your monitoring workspace.
          </p>

          {/* Login error */}
          {loginMutation.isError && (
            <div
              role="alert"
              className="mb-4 rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger"
            >
              Invalid email or password. Please try again.
            </div>
          )}

          {/* Login form */}
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm font-medium text-foreground"
              >
                Email address
              </label>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                autoComplete="email"
                autoFocus
                className={inputClass}
              />
            </div>

            <div className="mb-4">
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-medium text-foreground"
              >
                Password
              </label>

              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  autoComplete="current-password"
                  className={`${inputClass} pr-12`}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label="Toggle password visibility"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                >
                  {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="mt-5 w-full rounded-lg bg-primary py-3 text-[0.95rem] font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loginMutation.isPending ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
