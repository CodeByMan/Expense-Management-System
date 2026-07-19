import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { MailCheck } from "lucide-react";
import { useAuthActions } from "@/hooks/useAuthActions";

export const Route = createFileRoute("/(account)/verify-email")({
  validateSearch: (search: Record<string, unknown>) => ({
    email: typeof search.email === "string" ? search.email : "",
  }),
  component: VerifyEmailPage,
});

function VerifyEmailPage() {
  const { email } = Route.useSearch();
  const { sendConfirmationEmail, isSendingEmail } = useAuthActions();

  useEffect(() => {
    if (email) {
      sendConfirmationEmail(email);
    }
  }, [email]);

  return (
    <div className="min-h-screen bg-muted px-4 py-8 sm:px-6">
      <div className="mx-auto grid min-h-[92vh] max-w-6xl overflow-hidden rounded-[32px] bg-white shadow-sm md:grid-cols-2">
        <div className="flex flex-col justify-center px-10 py-14 md:px-16">
          <span className="mb-10 inline-flex w-fit rounded-full border border-gray-200 px-5 py-2 text-sm">
            ExpenseManagement
          </span>

          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-lime-100">
            <MailCheck className="h-7 w-7 text-lime-600" />
          </div>

          <h1 className="text-4xl font-semibold tracking-tight">
            Check your email
          </h1>

          <p className="mt-3 max-w-md text-lg text-muted-foreground">
            We sent a confirmation link to{" "}
            <span className="font-medium text-lime-700">
              {email || "your email"}
            </span>
            . Please open your inbox and click the link to activate your
            account.
          </p>

          <div className="mt-8 space-y-4">
            <Button
              type="button"
              onClick={() => email && sendConfirmationEmail(email)}
              disabled={isSendingEmail || !email}
              className="h-11 bg-lime-600 px-6 text-base hover:bg-lime-700"
            >
              {isSendingEmail ? "Sending..." : "Resend Email"}
            </Button>

            <p className="text-sm text-muted-foreground">
              Did not receive the email? Check your spam folder or resend it.
            </p>

            <p className="text-sm text-muted-foreground">
              Back to{" "}
              <Link
                to="/login"
                className="text-lime-600 underline underline-offset-4 hover:text-lime-700"
              >
                Login
              </Link>
            </p>
          </div>
        </div>

        <div className="relative hidden bg-[#d9d9d9] md:block">
          <div className="flex h-full flex-col items-center justify-center p-10">
            <div className="w-full max-w-xl rounded-[24px] bg-white/70 p-8 shadow-sm backdrop-blur-sm">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-lime-100">
                  <MailCheck className="h-6 w-6 text-lime-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold">Email Verification</h2>
                  <p className="text-sm text-muted-foreground">
                    Secure your account in one step
                  </p>
                </div>
              </div>

              <div className="space-y-4 rounded-2xl bg-white p-6 shadow-sm">
                <div className="h-3 w-3/4 rounded-full bg-gray-200" />
                <div className="h-3 w-2/3 rounded-full bg-gray-200" />
                <div className="h-3 w-4/5 rounded-full bg-gray-200" />

                <div className="mt-6 rounded-2xl border border-dashed border-lime-300 bg-lime-50 p-5">
                  <p className="text-sm font-medium text-lime-700">
                    Confirmation email has been prepared
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Open your inbox and click the verification link.
                  </p>
                </div>
              </div>
            </div>

            <div className="absolute bottom-10 left-10 rounded-3xl bg-white px-6 py-5 shadow-sm">
              <p className="text-2xl font-semibold">Manage Your Expense</p>
              <p className="text-muted-foreground">In One Place</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
