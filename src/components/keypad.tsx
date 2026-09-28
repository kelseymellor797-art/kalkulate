const keys = [
  ["AC", "clear", "Clear calculator", "utility"],
  ["±", "sign", "Toggle positive or negative", "utility"],
  ["%", "%", "Percentage", "utility"],
  ["÷", "/", "Divide", "operator"],
  ["7", "7"],
  ["8", "8"],
  ["9", "9"],
  ["×", "*", "Multiply", "operator"],
  ["4", "4"],
  ["5", "5"],
  ["6", "6"],
  ["−", "-", "Subtract", "operator"],
  ["1", "1"],
  ["2", "2"],
  ["3", "3"],
  ["+", "+", "Add", "operator"],
  ["⌫", "backspace", "Backspace", "utility"],
  ["0", "0"],
  [".", ".", "Decimal point"],
  ["=", "=", "Equals", "equals"],
];
export function Keypad({
  onAction,
  activeOperator,
}: {
  onAction: (action: string) => void;
  activeOperator: string | null;
}) {
  return (
    <div className="keypad" aria-label="Calculator keypad">
      {keys.map(([label, action, aria, kind]) => (
        <button
          key={action}
          type="button"
          className={`key ${kind || ""} ${action === activeOperator ? "selected" : ""}`}
          aria-label={aria || label}
          onClick={() => onAction(action)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
