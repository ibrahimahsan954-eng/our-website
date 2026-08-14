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
 *
 * IMPORTANT — why we never pass `hostRef.current` to `YT.Player`:
 * the IFrame API *replaces* the element it is given with its own <iframe>,
 * which desyncs React's virtual DOM from the real DOM. When React later tries
 * to unmount that node it throws
 *   NotFoundError: Failed to execute 'removeChild' on 'Node'.
 * Instead we create a fresh, JS-owned child <div> inside the host and build
 * the player on that. React only ever manages the host div, so reconciliation
 * (mount/unmount, state flips) stays clean. On cleanup we destroy the player
 * and empty the host so nothing is left behind.
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
      const playerHost = document.createElement("div");
      playerHost.style.width = "100%";
      playerHost.style.height = "100%";
      hostRef.current.appendChild(playerHost);
      player = new window.YT.Player(playerHost, {
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
      try {
        player?.destroy();
      } catch {
        // The API may have already torn the player down — nothing to do.
      }
      // Remove the JS-owned child (if any) so the host returns to a clean,
      // React-only subtree before React unmounts it.
      if (hostRef.current) {
        hostRef.current.replaceChildren();
      }
    };
  }, [enabled, videoId, hostRef]);
}
