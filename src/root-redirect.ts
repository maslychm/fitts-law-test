interface BrowserLocation {
  pathname: string;
  search: string;
  hash: string;
  replace(url: string): void;
}

export function redirectToRoot(location: BrowserLocation = window.location): boolean {
  if (location.pathname === '/' && !location.search && !location.hash) {
    return false;
  }

  location.replace('/');
  return true;
}
