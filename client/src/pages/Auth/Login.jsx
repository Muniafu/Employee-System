import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";

import { Mail } from "lucide-react";

import { useAuth } from "../../context/useAuth";

import SocialLogin from "../../components/Auth/SocialLogin";

import AuthLayout from "../../components/Auth/AuthLayout";
import AuthCard from "../../components/Auth/AuthCard";
import PasswordInput from "../../components/Auth/PasswordInput";
import RememberMe from "../../components/Auth/RememberMe";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const { login } = useAuth();

  const from =
      location.state?.from?.pathname ||
      "/dashboard";

  const [email, setEmail] =
      useState("");

  const [password, setPassword] =
      useState("");

  const [rememberMe, setRememberMe] =
      useState(false);

  const [loading, setLoading] =
      useState(false);

  const [errors, setErrors] =
      useState({});

  const validate = () => {

    const newErrors = {};
    
    if (!email.trim()) {
      newErrors.email = "Email is required.";
    }

    if (!password) {
        newErrors.password =
            "Password is required.";
    }

    setErrors(newErrors);

    return (
        Object.keys(newErrors)
            .length === 0
    );
  };

  const handleSubmit =
    async (e) => {

    e.preventDefault();

    if (!validate()) return;

    try {

        setLoading(true);

        await login(
            email,
            password
        );

        if (rememberMe) {
            localStorage.setItem(
                "remember_email",
                email
            );
        } else {
            localStorage.removeItem(
                "remember_email"
            );
        }

        navigate(
            from,
            {
                replace: true
            }
        );

    } catch (err) {
      
      const message = err?.response?.data?.message || "";

      const lowerMessage = message.toLowerCase();

      if (lowerMessage.includes("verify")) {
        navigate("/verify-email-required", {
          replace: true,
          state: { email },
        });
        return;
      }

      if (lowerMessage.includes("pending")) {
        navigate("/pending-approval", {
          replace: true,
        });
        return;
      }

      if (lowerMessage.includes("rejected")) {
        navigate("/account-rejected", {
          replace: true,
        });
        return;
      }

      if (lowerMessage.includes("suspended")) {
        navigate("/account-suspended", {
          replace: true,
        });
        return;
      }

      if (lowerMessage.includes("terminated")) {
        navigate("/account-terminated", {
          replace: true,
        });
        return;
      }

      setErrors({
        general: message || "Login failed.",
      });

    } finally {

        setLoading(false);

    }

  };

  useEffect(() => {

    const remembered =
        localStorage.getItem(
            "remember_email"
        );

    if (remembered) {

        setEmail(remembered);

        setRememberMe(true);

    }

  }, []);

  return (
  
  <AuthLayout>
    <AuthCard
    title="Welcome Back"
    subtitle="Sign in to continue">

      <form
      onSubmit={handleSubmit}
      className="auth-form">
        
        <div className="form-group">
          
          <label className="form-label">Email</label>
          
          <div className="input-icon">
            
            <Mail size={18}/>
            
            <input
            type="email"
            value={email}
            onChange={(e)=>
            setEmail(
              e.target.value
            )}
            
            placeholder="john@example.com"
            />
            
          </div>
          
          {
          errors.email &&
          <p className="error-text">
            
            {errors.email}
          </p>
          }
          
          </div>
          
          <PasswordInput
          className="form-control"
          label="Password"
          value={password}
          placeholder="Enter password"
          onChange={(e)=>
            setPassword(
              e.target.value
            )}
          
          error={errors.password}
          
          />
          
          {
          
          errors.general &&
          
          <div className="auth-error">
            
            {errors.general}
            
          </div>
          
          }
          
          <div className="remember-row">
            <RememberMe checked={rememberMe} onChange={setRememberMe} />
            
            <Link
            to="/forgot-password">
              Forgot Password?
            </Link>
            
            </div>
            
            <button
            className="btn btn-primary"
            disabled={loading}
            >
              
              {
              loading
              ?
              "Signing In..."
              :
              "Sign In"
              }
              
            </button>

            <SocialLogin />
            
            <div className="register-link">
              
              Don`t have an account?
              
              <Link
              to="/register">
                Create one
              </Link>
              
            </div>
            
      </form>
      
    </AuthCard>
    
  </AuthLayout>

  );
}