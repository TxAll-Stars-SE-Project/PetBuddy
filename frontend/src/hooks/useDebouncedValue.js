import { useEffect, useState } from "react";

// คืนค่า value หลังจากที่ไม่เปลี่ยนแปลงเป็นเวลา delay ms (ใช้กับช่องกรอกราคา กันยิง API ทุกตัวอักษร)
export function useDebouncedValue(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}
