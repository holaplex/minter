export class Debounce {
  typingTimeout: null | ReturnType<typeof setTimeout> = null;

  debounceFcn = (callback: () => void, timeoutDuration = 900) => {
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }
    this.typingTimeout = setTimeout(callback, timeoutDuration);
  };
}
