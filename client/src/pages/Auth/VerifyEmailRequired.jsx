import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { MailCheck } from "lucide-react";

import AuthLayout from "../../components/Auth/AuthLayout";
import AuthCard from "../../components/Auth/AuthCard";
import { useAuth } from "../../context/useAuth";

export default function VerifyEmailRequired() {
  const location = useLocation();
  const { resendVerification } = useAuth();

  const email = location.state?.email || "";

  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleResend = async () => {
    if (!email || sending) return;

    setSending(true);

    try {
      await resendVerification(email);
      setSent(true);
      toast.success("Verification email sent. Check your inbox.");
    } catch {
      toast.error("Couldn't send the email. Try again shortly.");
    } finally {
      setSending(false);
    }
  };

  return (
    <AuthLayout>
      <AuthCard
        title="Verify Your Email"
        subtitle="One more step before you can sign in"
      >
        <div className="auth-status-content">
          <MailCheck size={40} color="var(--color-warning)" />

          <p>
            {email ? (
              <>
                We sent a verification link to <strong>{email}</strong>.
                Click it to activate your account.
              </>
            ) : (
              "Please verify your email address to continue."
            )}
          </p>

          <button
            className="btn btn-primary"
            onClick={handleResend}
            disabled={!email || sending}
          >
            {sending
              ? "Sending..."
              : sent
                ? "Resend Verification Email"
                : "Resend Verification Email"}
          </button>

          <div className="register-link">
            <Link to="/login">Back to Sign In</Link>
          </div>
        </div>
      </AuthCard>
    </AuthLayout>
  );
}