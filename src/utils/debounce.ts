class Debounce {
    typingTimeout: null | ReturnType<typeof setTimeout>
    debounce: Debounce
    constructor() {
      this.typingTimeout = null
      return this.debounce
    }
    debounceFcn = (callback: ()=>void, timeoutDuration = 900) => {
      if (!callback) {
        console.log('missing argument callback')
      }
      if (this.typingTimeout) {
        clearTimeout(this.typingTimeout)
      }
      this.typingTimeout = setTimeout(() => {
        callback()
      }, timeoutDuration)
    }
  }
  export const debounce = new Debounce();