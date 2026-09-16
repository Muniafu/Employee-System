import { Link, useSearchParams } from "react-router-dom";
import { MailCheck } from "lucide-react";

import AuthLayout from "../../components/Auth/AuthLayout";
import AuthCard from "../../components/Auth/AuthCard";

export default function SocialPending() {
    const [searchParams] = useSearchParams();

    const message =
        searchParams.get("message") ||
        "Check your email to confirm linking your account.";

    return (
        <AuthLayout>
            <AuthCard
                title="Confirm Your Account"
                subtitle="One more step to link your sign-in"
            >
                <div className="auth-status-content">
                    <MailCheck size={72} color="var(--color-warning)" />
                    <p>{message}</p>
                    <Link className="btn btn-secondary" to="/login">
                        Back to Login
                    </Link>
                </div>
            </AuthCard>
        </AuthLayout>
    );
}