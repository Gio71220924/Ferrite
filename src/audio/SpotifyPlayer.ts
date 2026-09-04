interface SpotifyPlaybackState {
  position: number;
  duration: number;
  paused: boolean;
}

interface SpotifyWebPlayer {
  addListener(event: string, cb: (arg: unknown) => void): void;
  connect(): Promise<boolean>;
  disconnect(): void;
  pause(): Promise<void>;
  resume(): Promise<void>;
  seek(ms: number): Promise<void>;
  setVolume(v: number): Promise<void>;
}

declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady?: () => void;
    Spotify?: {
      Player: new (options: {
        name: string;
        getOAuthToken: (cb: (token: string) => void) => void;
        volume?: number;
      }) => SpotifyWebPlayer;
    };
  }
}

let sdkLoadPromise: Promise<void> | null = null;

function loadSdk(): Promise<void> {
  if (sdkLoadPromise) return sdkLoadPromise;
  sdkLoadPromise = new Promise(resolve => {
    if (window.Spotify) {
      resolve();
      return;
    }
    window.onSpotifyWebPlaybackSDKReady = () => resolve();
    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    document.head.appendChild(script);
  });
  return sdkLoadPromise;
}

const PLAYER_API = 'https://api.spotify.com/v1/me/player';

export class SpotifyPlayer {
  private player: SpotifyWebPlayer | null = null;
  private deviceId: string | null = null;
  onReady?: () => void;
  onNotReady?: () => void;
  onStateChange?: (state: SpotifyPlaybackState) => void;

  async connect(getToken: () => Promise<string | null>): Promise<void> {
    await loadSdk();
    if (!window.Spotify) throw new Error('Spotify Web Playback SDK failed to load');

    this.player = new window.Spotify.Player({
      name: 'Ferrite Web Player',
      getOAuthToken: cb => {
        getToken().then(token => token && cb(token));
      },
      volume: 0.7,
    });

    this.player.addListener('ready', arg => {
      this.deviceId = (arg as { device_id: string }).device_id;
      this.onReady?.();
    });
    this.player.addListener('not_ready', () => {
      this.deviceId = null;
      this.onNotReady?.();
    });
    this.player.addListener('player_state_changed', arg => {
      if (!arg) return;
      const state = arg as SpotifyPlaybackState;
      this.onStateChange?.(state);
    });

    await this.player.connect();
  }

  getDeviceId(): string | null {
    return this.deviceId;
  }

  async playUri(trackId: string, token: string): Promise<void> {
    if (!this.deviceId) throw new Error('Spotify player not ready');
    await fetch(`${PLAYER_API}/play?device_id=${this.deviceId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ uris: [`spotify:track:${trackId}`] }),
    });
  }

  pause(): void {
    void this.player?.pause();
  }

  resume(): void {
    void this.player?.resume();
  }

  seek(ms: number): void {
    void this.player?.seek(ms);
  }

  setVolume(v: number): void {
    void this.player?.setVolume(v);
  }
}
