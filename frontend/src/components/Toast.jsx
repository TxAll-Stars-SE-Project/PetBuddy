import { useEffect, useState } from "react";
function Toast() {
  const [item, setItem] = useState(null);
  useEffect(() => {
    let t;
    const onToast = (e) => {
      setItem(e.detail);
      clearTimeout(t);
      t = setTimeout(() => setItem(null), 3000);
    };
    window.addEventListener("pb:toast", onToast);
    return () => { window.removeEventListener("pb:toast", onToast); clearTimeout(t); };
  }, []);
  if (!item) return null;
  return <div className={"toast" + (item.type === "info" ? " toast--info" : "")}>{item.message}</div>;
}
export default Toast;