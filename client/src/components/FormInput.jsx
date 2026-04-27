const FormInput = ({
  label,
  type = 'text',
  value,
  onChange,
  error,
  ...rest
}) => {
  return (
    <div className="form-group">
      {label && <label>{label}</label>}

      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        {...rest}
      />

      {error && <small className="error">{error}</small>}
    </div>
  );
};

export default FormInput;