export const cleanPath = (url: string) => {
  return url.replace(/\/+$/, '') || '/';
};
