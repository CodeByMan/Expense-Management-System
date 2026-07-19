import { AuthLayout } from '@/components/auth/AuthLayout'
import RegisterForm from '@/components/auth/RegisterForm'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/(account)/register/')({
  component: RegisterPage,
})

function RegisterPage() {
  return (
    <AuthLayout>
      <RegisterForm />
    </AuthLayout>
  )
}
