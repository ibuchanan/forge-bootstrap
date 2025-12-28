export function truncateEvents(obj: any): any {
  if (typeof obj !== "object" || obj === null) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(truncateEvents);
  }
  const newObj: any = {};
  for (const key in obj) {
    if (key === "contextToken") {
      const token: string = obj[key];
      newObj[key] = `${token.slice(0, 3)}...${token.slice(-3)}`;
    } else if (key === "headers") {
      newObj[key] = { "...": "..." };
    } else {
      newObj[key] = truncateEvents(obj[key]);
    }
  }
  return newObj;
}
