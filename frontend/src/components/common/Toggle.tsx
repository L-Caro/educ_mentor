interface ToggleProps {
  checked: boolean;
  onChange: () => void;
}

export default function Toggle({ checked, onChange }: ToggleProps) {
  return (
    <label className={`Toggle${checked ? ' Toggle--on' : ''}`}>
      <input
        type="checkbox"
        className="Toggle__input"
        checked={checked}
        onChange={onChange}
      />
      <span className="Toggle__track">
        <span className="Toggle__thumb" />
      </span>
    </label>
  );
}
