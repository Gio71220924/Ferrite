import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SpotifyPlayer } from './SpotifyPlayer';

class FakePlayer {
  listeners: Record<string, (arg: unknown) => void> = {};
  connect = vi.fn().mockResolvedValue(true);
  pause = vi.fn().mockResolvedValue(undefined);
  resume = vi.fn().mockResolvedValue(undefined);
  seek = vi.fn().mockResolvedValue(undefined);
  setVolume = vi.fn().mockResolvedValue(undefined);
  addListener(event: string, cb: (arg: unknown) => void) {
    this.listeners[event] = cb;
  }
  emit(event: string, arg: unknown) {
    this.listeners[event]?.(arg);
  }
}

describe('SpotifyPlayer', () => {
  let fakePlayer: FakePlayer;

  beforeEach(() => {
    fakePlayer = new FakePlayer();
    window.Spotify = {
      Player: vi.fn().mockImplementation(() => fakePlayer) as unknown as Window['Spotify'] extends { Player: infer P } ? P : never,
    };
    window.onSpotifyWebPlaybackSDKReady = undefined;
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));
  });

  afterEach(() => {
    delete window.Spotify;
    vi.unstubAllGlobals();
  });

  it('connect() creates the SDK player and fires onReady when the device becomes ready', async () => {
    const player = new SpotifyPlayer();
    const onReady = vi.fn();
    player.onReady = onReady;

    await player.connect(async () => 'token-abc');
    fakePlayer.emit('ready', { device_id: 'device-1' });

    expect(onReady).toHaveBeenCalled();
    expect(player.getDeviceId()).toBe('device-1');
    expect(fakePlayer.connect).toHaveBeenCalled();
  });

  it('onNotReady fires and clears the device id', async () => {
    const player = new SpotifyPlayer();
    const onNotReady = vi.fn();
    player.onNotReady = onNotReady;
    await player.connect(async () => 'token-abc');

    fakePlayer.emit('ready', { device_id: 'device-1' });
    fakePlayer.emit('not_ready', {});

    expect(onNotReady).toHaveBeenCalled();
    expect(player.getDeviceId()).toBeNull();
  });

  it('onStateChange fires with position/duration/paused on player_state_changed', async () => {
    const player = new SpotifyPlayer();
    const onStateChange = vi.fn();
    player.onStateChange = onStateChange;
    await player.connect(async () => 'token-abc');

    fakePlayer.emit('player_state_changed', { position: 5000, duration: 200_000, paused: false });

    expect(onStateChange).toHaveBeenCalledWith({ position: 5000, duration: 200_000, paused: false });
  });

  it('playUri PUTs to the Connect API with the device id and spotify: URI', async () => {
    const player = new SpotifyPlayer();
    await player.connect(async () => 'token-abc');
    fakePlayer.emit('ready', { device_id: 'device-1' });

    await player.playUri('track123', 'token-abc');

    expect(fetch).toHaveBeenCalledWith(
      'https://api.spotify.com/v1/me/player/play?device_id=device-1',
      expect.objectContaining({
        method: 'PUT',
        headers: expect.objectContaining({ Authorization: 'Bearer token-abc' }),
        body: JSON.stringify({ uris: ['spotify:track:track123'] }),
      }),
    );
  });

  it('playUri throws if the device is not ready yet', async () => {
    const player = new SpotifyPlayer();
    await player.connect(async () => 'token-abc');
    await expect(player.playUri('track123', 'token-abc')).rejects.toThrow(/not ready/i);
  });

  it('playUri throws a premium-required error on a 403 response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 403 }));
    const player = new SpotifyPlayer();
    await player.connect(async () => 'token-abc');
    fakePlayer.emit('ready', { device_id: 'device-1' });

    await expect(player.playUri('track123', 'token-abc')).rejects.toThrow(/premium/i);
  });

  it('pause/resume/seek/setVolume delegate to the underlying player', async () => {
    const player = new SpotifyPlayer();
    await player.connect(async () => 'token-abc');

    player.pause();
    player.resume();
    player.seek(1000);
    player.setVolume(0.5);

    expect(fakePlayer.pause).toHaveBeenCalled();
    expect(fakePlayer.resume).toHaveBeenCalled();
    expect(fakePlayer.seek).toHaveBeenCalledWith(1000);
    expect(fakePlayer.setVolume).toHaveBeenCalledWith(0.5);
  });
});
