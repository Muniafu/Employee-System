import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { CheckCircle2, XCircle } from "lucide-react";

import AuthLayout from "../../components/Auth/AuthLayout";
import AuthCard from "../../components/Auth/AuthCard";
import LoadingOverlay from "../../components/Auth/LoadingOverlay";
import api from "../../services/api";

export default function ConfirmLink() {
    const { token } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [confirmed, setConfirmed] = useState(false);
    const [message, setMessage] = useState("");

    useEffect(() => {
        if (!token) {
            setLoading(false);
            setMessage("Confirmation token is missing.");
            return;
        }

        const confirm = async () => {
            try {
                const { data } = await api.post(`/auth/confirm-link/${token}`);
                setConfirmed(true);
                setMessage(data.message || "Account linked successfully.");
            } catch (err) {
                setMessage(
                    err?.response?.data?.message ||
                    "This confirmation link is invalid or has expired."
                );
            } finally {
                setLoading(false);
            }
        };

        confirm();
    }, [token]);

    return (
        <AuthLayout>
            <LoadingOverlay loading={loading} message="Confirming account link..." />

            <AuthCard
                title="Account Linking"
                subtitle="Confirm your sign-in method"
            >
                {!loading && confirmed && (
                    <div className="auth-status-content">
                        <CheckCircle2 size={72} color="var(--color-success)" />
                        <h3>Account Linked</h3>
                        <p>{message}</p>
                        <button
                            className="btn btn-primary"
                            onClick={() => navigate("/login")}
                        >
                            Continue to Login
                        </button>
                    </div>
                )}

                {!loading && !confirmed && (
                    <div className="auth-status-content">
                        <XCircle size={72} color="var(--color-danger)" />
                        <h3>Confirmation Failed</h3>
                        <p>{message}</p>
                        <Link className="back-login" to="/login">
                            Back to Login
                        </Link>
                    </div>
                )}
            </AuthCard>
        </AuthLayout>
    );
}