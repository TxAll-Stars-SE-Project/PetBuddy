function TextInput({ label, error, ...rest }) {
  return (
    <div className="field">
      <label>{label}</label>
      <input className={"input" + (error ? " input--error" : "")} {...rest} />
      {error && <div className="field-error">{error}</div>}
    </div>
  );
}
export default TextInput;