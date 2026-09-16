import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import AuthLayout from "../../components/Auth/AuthLayout";
import AuthCard from "../../components/Auth/AuthCard";
import PasswordInput from "../../components/Auth/PasswordInput";
import PasswordStrength from "../../components/Auth/PasswordStrength";
import FormInput from "../../components/FormInput";

import { useAuth } from "../../context/useAuth";

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const validate = () => {
    const e = {};

    if (!form.firstName.trim()) e.firstName = "First name is required";
    if (!form.lastName.trim()) e.lastName = "Last name is required";
    if (!form.email.trim()) e.email = "Email is required";

    if (form.password.length < 6)
      e.password = "Password must contain at least 6 characters";

    if (form.password !== form.confirmPassword)
      e.confirmPassword = "Passwords do not match";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setLoading(true);

      const response = await register({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        password: form.password,
      });

      if (response.data.data.approved) {
        navigate("/dashboard");
      } else {
        navigate("/pending-approval");
      }
    } catch (err) {
      setErrors({
        general: err.response?.data?.message || "Registration failed.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <AuthCard
        title="Create Account"
        subtitle="Your department, role, and details will be set by HR during onboarding"
      >
        <form className="auth-form" onSubmit={submit}>
          {errors.general && (
            <div className="auth-error">{errors.general}</div>
          )}

          <FormInput
            label="First Name"
            name="firstName"
            value={form.firstName}
            onChange={handleChange}
            error={errors.firstName}
          />

          <FormInput
            label="Last Name"
            name="lastName"
            value={form.lastName}
            onChange={handleChange}
            error={errors.lastName}
          />

          <FormInput
            label="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            error={errors.email}
          />

          <FormInput
            label="Phone"
            name="phone"
            value={form.phone}
            onChange={handleChange}
          />

          <PasswordInput
            label="Password"
            value={form.password}
            onChange={(e) =>
              setForm({ ...form, password: e.target.value })
            }
            error={errors.password}
          />
          <PasswordStrength password={form.password} />

          <PasswordInput
            label="Confirm Password"
            value={form.confirmPassword}
            onChange={(e) =>
              setForm({ ...form, confirmPassword: e.target.value })
            }
            error={errors.confirmPassword}
          />

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>

          <div className="register-link">
            Already have an account?
            <Link to="/login">Sign In</Link>
          </div>
        </form>
      </AuthCard>
    </AuthLayout>
  );
}