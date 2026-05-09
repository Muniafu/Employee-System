export default function FormInput({ label, error, hint, className = '', ...props }) {
  return (
    <div className={`form-group ${className}`}>
      {label && <label className="form-label">{label}</label>}
      {props.as === 'select' ? (
        <select className={`form-control form-select${error ? ' error' : ''}`} {...props}>
          {props.children}
        </select>
      ) : props.as === 'textarea' ? (
        <textarea className={`form-control${error ? ' error' : ''}`} {...props} />
      ) : (
        <input className={`form-control${error ? ' error' : ''}`} {...props} />
      )}
      {hint && <p className="form-hint">{hint}</p>}
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}