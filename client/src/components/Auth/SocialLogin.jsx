import {
  Chrome,
  Github,
  Building2,
  Facebook,
  Linkedin,
} from "lucide-react";

const API_URL =
  import.meta.env.VITE_API_URL;

const providers = [
  {
    name: "Google",
    provider: "google",
    icon: Chrome,
  },
  {
    name: "Microsoft",
    provider: "microsoft",
    icon: Building2,
  },
  {
    name: "Facebook",
    provider: "facebook",
    icon: Facebook,
  },
  {
    name: "LinkedIn",
    provider: "linkedin",
    icon: Linkedin,
  },
  {
    name: "GitHub",
    provider: "github",
    icon: Github,
  },
];

export default function SocialLogin() {
  const handleClick = (provider) => {
    // Full page redirect — this leaves the SPA on purpose.
    // The provider needs to redirect back to our own domain
    // (/api/auth/:provider/callback), which a fetch/XHR can't do.
    window.location.href = `${API_URL}/auth/${provider}`;
  };

  return (
    <div className="social-login">

      <div className="social-divider">
        <span>or continue with</span>
      </div>

      <div className="social-buttons">

        {providers.map(({ name, provider, icon: Icon }) => (
          <button
            key={provider}
            type="button"
            onClick={() => handleClick(provider)}
            className="social-btn"
            aria-label={`Continue with ${name}`}
          >
            <Icon size={18} />
            <span>{name}</span>
          </button>
        ))}

      </div>

    </div>
  );
}