export function timeStringShort (ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const years = Math.floor(days / 365);
  
  if (years > 0) {
    return `${years} years`;
  }
  if (days > 0) {
    return `${days} days`;
  }
  if (hours > 0) {
    return `${hours} hours`;
  }
  if (minutes > 0) {
    return `${minutes} minutes`;
  }
  return `${seconds} seconds`;
}

export function timeStringFull (ms: number): string {
  let seconds = Math.floor(ms / 1000);
  let minutes = Math.floor(seconds / 60);
  let hours = Math.floor(minutes / 60);
  let days = Math.floor(hours / 24);
  let years = Math.floor(days / 365);

  seconds = seconds % 60;
  minutes = minutes % 60;
  hours = hours % 24;
  days = days % 365;
  
  const result: string[] = [];
  
  if (years > 0) {
    result.push(`${years} years`);
  }
  if (days > 0) {
    result.push(`${days} days`);
  }
  if (hours > 0) {
    result.push(`${hours} hours`);
  }
  if (minutes > 0) {
    result.push(`${minutes} minutes`);
  }
  if (seconds > 0) {
    result.push(`${seconds} seconds`);
  }
  return result.join(' ');
}
