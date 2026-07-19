import { AuthLayout } from '@/components/auth/AuthLayout'
import LoginForm from '@/components/auth/LoginForm'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/(account)/login/')({
    component: LoginPage,
})

function LoginPage() {
    return (
        <AuthLayout>
            <LoginForm />
        </AuthLayout>
    )
}
