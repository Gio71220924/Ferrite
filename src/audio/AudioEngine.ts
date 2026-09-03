export class AudioEngine {
  private audio = new Audio();
  onTick?: (sec: number) => void;
  onEnded?: () => void;

  constructor() {
    this.audio.addEventListener('timeupdate', () => this.onTick?.(this.audio.currentTime));
    this.audio.addEventListener('ended', () => this.onEnded?.());
  }

  load(url: string) {
    this.audio.src = url;
  }

  play() {
    void this.audio.play();
  }

  pause() {
    this.audio.pause();
  }

  seek(sec: number) {
    this.audio.currentTime = sec;
  }

  setVolume(v: number) {
    this.audio.volume = v;
  }

  getSrc() {
    return this.audio.src;
  }

  /** Test-only escape hatch to dispatch native events at the element. */
  getElementForTest() {
    return this.audio;
  }
}
