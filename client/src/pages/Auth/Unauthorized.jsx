import { ShieldAlert } from "lucide-react";
import { Link } from "react-router-dom";

import AuthLayout from "../../components/Auth/AuthLayout";
import AuthCard from "../../components/Auth/AuthCard";

export default function Unauthorized() {

    return (

        <AuthLayout>

            <AuthCard
                title="Access Denied"
                subtitle="You don't have permission to access this page."
            >

                <div className="status-page">

                    <ShieldAlert
                        size={70}
                        className="status-icon warning"
                    />

                    <p>

                        Your account doesn&apos;t have the
                        required permissions.

                    </p>

                    <Link
                        to="/dashboard"
                        className="btn btn-primary"
                    >

                        Return to Dashboard

                    </Link>

                </div>

            </AuthCard>

        </AuthLayout>

    );

}