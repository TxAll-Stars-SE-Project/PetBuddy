import { useEffect, useState } from "react";
function navigate(to) { window.location.hash = to; }
function parseHash() {
  const raw = window.location.hash.replace(/^#/, "") || "/";
  const qIndex = raw.indexOf("?");
  const path = qIndex === -1 ? raw : raw.slice(0, qIndex);
  const params = new URLSearchParams(qIndex === -1 ? "" : raw.slice(qIndex + 1));
  return { path: path || "/", params };
}
function useHashRoute() {
  const [route, setRoute] = useState(parseHash);
  useEffect(() => {
    const onChange = () => setRoute(parseHash());
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return route;
}
export { navigate, useHashRoute };