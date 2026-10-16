const pad = (n) => (n < 10 ? '0' + n : '' + n);

// "Mon Oct 13 · 09:05" (the old code printed "9:5" for 09:05)
export function formatCommentTime(date) {
  const day = date.toDateString().slice(0, 10);
  return `${day} · ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
