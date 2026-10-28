const pad = (n) => (n < 10 ? '0' + n : '' + n);

export function formatCommentTime(date) {
  const day = date.toDateString().slice(0, 10);
  return `${day} · ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
