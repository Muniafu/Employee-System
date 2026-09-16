import { Link } from "react-router-dom";
import { UserX } from "lucide-react";

import AuthLayout from "../../components/Auth/AuthLayout";
import AuthCard from "../../components/Auth/AuthCard";

export default function AccountTerminated() {
  return (
    <AuthLayout>
      <AuthCard
        title="Account Terminated"
        subtitle="This account no longer has access"
      >
        <div className="auth-status-content">
          <UserX size={40} color="var(--color-danger)" />

          <p>
            Your account has been terminated and no longer has access to
            this system.
          </p>

          <p>
            If you believe this is a mistake, please contact your HR
            department for assistance.
          </p>

          <Link to="/login" className="btn btn-secondary">
            Back to Sign In
          </Link>
        </div>
      </AuthCard>
    </AuthLayout>
  );
}