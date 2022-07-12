export class Debounce {
  typingTimeout: null | ReturnType<typeof setTimeout> = null;

  debounceFcn = (callback: ()=>void, timeoutDuration = 900) => {
    if (!callback) {
      throw new Error('missing argument callback');
    }
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }
    this.typingTimeout = setTimeout(callback, timeoutDuration)
  }
}
  // source: https://github.com/solana-labs/governance-ui/blob/060b2c311f8c35e3e3f87feed00cfc6d4f22a924/utils/debounce.tsx