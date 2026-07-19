import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthActions } from '@/hooks/useAuthActions'
import type { LoginFormInputs } from '@/Types'
import { Link, useNavigate } from '@tanstack/react-router'
import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

export default function LoginForm() {
  const navigate = useNavigate();
  const { login, isLoggingIn } = useAuthActions(); 
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormInputs>()

  const onSubmit = (data: LoginFormInputs) => {
    login(data, {
      onSuccess: (res) => {
        if (!res.success) return;
        navigate({ to: "/dashboard" });
      },
    });
  };

  return (
    <div className="flex flex-col justify-center rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-8">
      <h1 className="text-2xl font-bold tracking-tight text-on-surface mb-2">
        Welcome Back
      </h1>
      <p className="mb-8 text-muted-foreground">
        Please enter your credentials to access your ledger
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-2">
          <Label>Email</Label>
          <Input
            placeholder="you@example.com"
            {...register("email", {
              required: "Email is required",
              pattern: {
                value: /^\S+@\S+$/i,
                message: "Invalid email",
              },
            })}
          />
          {errors.email && (
            <p className="text-sm text-red-500">{errors.email.message}</p>
          )}
        </div>

<div className="space-y-2">
  <Label>Password</Label>

  <div className="relative">
    <Input
      type={showPassword ? "text" : "password"}
      {...register("password", {
        required: "Password is required",
      })}
    />

    <button
      type="button"
      onClick={() => setShowPassword((prev) => !prev)}
      className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground"
    >
         {showPassword ? (
        <EyeOff size={18} className='text-[#006B4D]' />
      ) : (
        <Eye size={18} className='text-[#006B4D]' />
      )}
    </button>
  </div>

  {errors.password && (
    <p className="text-sm text-red-500">{errors.password.message}</p>
  )}
</div>

        <Button disabled={isLoggingIn} type="submit" className="mt-4 w-full text-base">
          {isLoggingIn ? "Logging in..." : "Login"}
        </Button>
      </form>

      <p className="mt-8 text-sm text-muted-foreground">
        Don't have an account?{" "}
        <Link
          to="/register"
          className="text-primary underline underline-offset-4 hover:text-primary/80"
        >
          Sign up
        </Link>
      </p>
    </div>
  )
}