import { useEffect, useState } from "react";

import {
    useNavigate,
    useParams,
    useSearchParams,
    Link,
} from "react-router-dom";

import {
    CheckCircle2,
    XCircle,
    Mail,
    RefreshCw,
} from "lucide-react";
import { toast } from "react-toastify";

import AuthLayout from "../../components/Auth/AuthLayout";
import AuthCard from "../../components/Auth/AuthCard";
import LoadingOverlay from "../../components/Auth/LoadingOverlay";

import { useAuth } from "../../context/useAuth";

export default function VerifyEmail() {

    const navigate = useNavigate();
    const { token } = useParams();
    const [searchParams] =
        useSearchParams();
    const {
        verifyEmail,
        resendVerification,
    } = useAuth();

    const email =
        searchParams.get("email");

    const [loading, setLoading] =
        useState(true);

    const [verified, setVerified] =
        useState(false);

    const [error, setError] =
        useState("");

    const [sending, setSending] =
        useState(false);

    useEffect(() => {

        if (!token) {

            setLoading(false);

            setError(
                "Verification token is missing."
            );

            return;

        }

        const verify = async () => {

            try {

                await verifyEmail(token);

                setVerified(true);

            } catch (err) {

                setError(

                    err?.response?.data?.message ||

                    "Verification link is invalid or has expired."

                );

            } finally {

                setLoading(false);

            }

        };

        verify();

    }, [token, verifyEmail]);

    const handleResend = async () => {

        if (!email) return;

        try {

            setSending(true);

            await resendVerification(email);
            toast.success(
                "Verification email sent. Check your inbox."
            );

        } catch (err) {
            toast.error(
                err?.response?.data?.message ||
                "Unable to resend verification email."
            );

        } finally {

            setSending(false);

        }

    };

    return (

        <AuthLayout>

            <LoadingOverlay
                loading={loading}
                message="Verifying your email..."
            />

            <AuthCard
                title="Email Verification"
                subtitle="Secure your account"
            >

                {!loading && verified && (

                    <>

                        <div className="verify-icon success">

                            <CheckCircle2 size={72} />

                        </div>

                        <h3>
                            Email Verified
                        </h3>

                        <p>

                            Your email has been verified successfully.

                        </p>

                        <button
                            className="btn btn-primary"
                            onClick={() =>
                                navigate("/login")
                            }
                        >
                            Continue to Login
                        </button>

                    </>

                )}

                {!loading &&
                    !verified && (

                    <>

                        <div className="verify-icon error">

                            <XCircle size={72} />

                        </div>

                        <h3>

                            Verification Failed

                        </h3>

                        <p>

                            {error}

                        </p>

                        {email && (

                            <button
                                className="btn btn-primary"
                                disabled={sending}
                                onClick={
                                    handleResend
                                }
                            >

                                <RefreshCw
                                    size={18}
                                />

                                {

                                    sending
                                        ? "Sending..."
                                        : "Resend Verification Email"

                                }

                            </button>

                        )}

                        <Link
                            className="back-login"
                            to="/login"
                        >

                            <Mail size={16} />

                            Back to Login

                        </Link>

                    </>

                )}

            </AuthCard>

        </AuthLayout>

    );

}