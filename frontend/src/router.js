// src/router.js
import { useEffect, useState } from "react";

export function navigate(to) {
  window.location.hash = to;
}

function parseHash() {
  const raw = window.location.hash.replace(/^#/, "") || "/";
  const qIndex = raw.indexOf("?");
  
  // ตัดเอาเฉพาะ path
  let path = qIndex === -1 ? raw : raw.slice(0, qIndex);
  
  // 👇 บรรทัดนี้สำคัญ: ถ้า path ว่างเปล่า "" ให้เปลี่ยนเป็น "/" ทันที
  if (!path) path = "/";

  const params = new URLSearchParams(qIndex === -1 ? "" : raw.slice(qIndex + 1));
  return { path, params };
}

export function useHashRoute() {
  const [route, setRoute] = useState(parseHash);
  useEffect(() => {
    const onChange = () => setRoute(parseHash());
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return route;
}