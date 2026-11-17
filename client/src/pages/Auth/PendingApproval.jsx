import { Clock3 } from "lucide-react";
import { Link } from "react-router-dom";

import AuthLayout from "../../components/Auth/AuthLayout";
import AuthCard from "../../components/Auth/AuthCard";

export default function PendingApproval() {
    return (
        <AuthLayout>
            <AuthCard
                title="Registration Submitted"
                subtitle="Your account is awaiting administrator approval."
            >
                <div className="status-page">

                    <Clock3
                        size={70}
                        className="status-icon pending"
                    />

                    <p>
                        Thank you for registering with the
                        Enterprise Management System.
                    </p>

                    <p>
                        Your request has been sent to the HR
                        Administrator for approval.
                    </p>

                    <p>
                        You&apos;ll be able to sign in once your
                        account has been approved.
                    </p>

                    <Link
                        to="/login"
                        className="btn btn-primary"
                    >
                        Back to Login
                    </Link>

                </div>
            </AuthCard>
        </AuthLayout>
    );
}