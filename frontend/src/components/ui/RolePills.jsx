function RolePills({ value, onChange }) {
  return (
    <div className="pills" role="radiogroup" aria-label="เลือกบทบาท">
      <button type="button" className={"pill" + (value === "owner" ? " pill--active" : "")} onClick={() => onChange("owner")}>
        เจ้าของสัตว์เลี้ยง
      </button>
      <button type="button" className={"pill" + (value === "sitter" ? " pill--active" : "")} onClick={() => onChange("sitter")}>
        พี่เลี้ยงสัตว์
      </button>
    </div>
  );
}

export default RolePills;