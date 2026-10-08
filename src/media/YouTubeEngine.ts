import type { Song } from "../model/Song";
import { MediaLink } from "./MediaLink";
import type { PlaybackEngine, PlaybackEvents } from "./PlaybackEngine";

interface YouTubePlayer {
  loadVideoById(id: string): void;
  stopVideo(): void;
}

interface YouTubeApi {
  Player: new (target: HTMLElement, options: unknown) => YouTubePlayer;
}

declare global {
  interface Window {
    YT?: YouTubeApi;
    onYouTubeIframeAPIReady?: () => void;
  }
}

const ENDED = 0;
const PLAYING = 1;
const PAUSED = 2;

/** Plays YouTube videos with YouTube's official embedded player (IFrame API). */
export class YouTubeEngine implements PlaybackEngine {
  private player: YouTubePlayer | null = null;
  private apiLoading: Promise<YouTubeApi> | null = null;
  private currentId: string | null = null;

  constructor(
    private readonly box: HTMLElement,
    private readonly events: PlaybackEvents,
  ) {}

  play(song: Song): void {
    const id = MediaLink.parse(song.source)?.id ?? null;
    if (id === null) {
      this.events.failed("That YouTube link has no video.");
      return;
    }
    this.box.hidden = false;
    this.currentId = id;
    this.loadApi().then(
      (api) => {
        if (this.currentId !== id) return; // another song was chosen while the API loaded
        if (this.player !== null) {
          this.player.loadVideoById(id);
          return;
        }
        const target = document.createElement("div");
        this.box.replaceChildren(target);
        this.player = new api.Player(target, {
          width: "100%",
          height: "220",
          videoId: id,
          playerVars: { autoplay: 1, playsinline: 1 },
          events: {
            onStateChange: (event: { data: number }) => {
              if (event.data === ENDED) this.events.ended();
              else if (event.data === PLAYING) this.events.playingChanged(true);
              else if (event.data === PAUSED) this.events.playingChanged(false);
            },
            onError: () => this.events.failed("This video cannot be played here (the owner may block embedding)."),
          },
        });
      },
      () => this.events.failed("The YouTube player could not be loaded."),
    );
  }

  stop(): void {
    this.currentId = null;
    this.player?.stopVideo();
    this.box.hidden = true;
    this.events.playingChanged(false);
  }

  private loadApi(): Promise<YouTubeApi> {
    if (window.YT?.Player) return Promise.resolve(window.YT);
    if (this.apiLoading === null) {
      this.apiLoading = new Promise((resolve, reject) => {
        window.onYouTubeIframeAPIReady = () => resolve(window.YT as YouTubeApi);
        const script = document.createElement("script");
        script.src = "https://www.youtube.com/iframe_api";
        script.onerror = () => {
          this.apiLoading = null;
          reject(new Error("YouTube API failed"));
        };
        document.head.append(script);
      });
    }
    return this.apiLoading;
  }
}
