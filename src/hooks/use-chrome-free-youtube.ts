import { useEffect, type RefObject } from "react";

declare global {
  interface Window {
    YT?: {
      Player: new (
        element: HTMLElement,
        options: {
          videoId?: string;
          width?: string;
          height?: string;
          playerVars?: Record<string, string | number>;
          events?: {
            onReady?: (event: {
              target: {
                playVideo: () => void;
                unloadModule?: (moduleName: string) => void;
              };
            }) => void;
          };
        },
      ) => { destroy: () => void };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

// The IFrame API script is injected once; every hook call registers a callback
// so multiple players (showreel + all cards) initialize when the API arrives.
let iframeApiScriptInjected = false;
const readyCallbacks: Array<() => void> = [];

if (typeof window !== "undefined") {
  window.onYouTubeIframeAPIReady = () => {
    const callbacks = readyCallbacks.splice(0);
    callbacks.forEach((callback) => callback());
  };
}

/**
 * Builds a YouTube player with every piece of chrome removed:
 *  - the captions module is unloaded, so subtitles can NEVER appear (even if
 *    the viewer's YouTube account has captions enabled globally),
 *  - controls, branding, annotations, related videos and keyboard input are
 *    all disabled,
 *  - the player autoplays muted and loops.
 *
 * The player is destroyed when `enabled` flips to false or on unmount, which
 * also stops playback when a card scrolls out of view.
 */
export function useChromeFreeYouTubePlayer(
  hostRef: RefObject<HTMLDivElement | null>,
  videoId: string,
  enabled: boolean,
) {
  useEffect(() => {
    if (!enabled || !videoId) return;
    let player: { destroy: () => void } | null = null;
    let cancelled = false;

    const createPlayer = () => {
      if (cancelled || !window.YT || !hostRef.current) return;
      player = new window.YT.Player(hostRef.current, {
        videoId,
        width: "100%",
        height: "100%",
        playerVars: {
          autoplay: 1,
          mute: 1,
          controls: 0,
          modestbranding: 1,
          rel: 0,
          iv_load_policy: 3,
          showinfo: 0,
          disablekb: 1,
          cc_load_policy: 0,
          hl: "en",
          loop: 1,
          playlist: videoId,
          playsinline: 1,
        },
        events: {
          onReady: (event) => {
            // Physically remove the captions module so no subtitles can load.
            event.target.unloadModule?.("captions");
            event.target.playVideo();
          },
        },
      });
    };

    if (window.YT) {
      createPlayer();
    } else {
      readyCallbacks.push(createPlayer);
      if (!iframeApiScriptInjected) {
        iframeApiScriptInjected = true;
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(tag);
      }
    }

    return () => {
      cancelled = true;
      player?.destroy();
    };
  }, [enabled, videoId, hostRef]);
}
