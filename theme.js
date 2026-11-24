(() => {
  let saved;
  try {
    saved = localStorage.getItem("portfolio-theme");
  } catch {}
  const darkPreference = window.matchMedia("(prefers-color-scheme: dark)").matches;
  document.documentElement.dataset.theme = saved === "light" || saved === "dark"
    ? saved
    : darkPreference ? "dark" : "light";
})();
