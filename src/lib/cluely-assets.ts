/** Local paths for downloaded cluely.com assets */
export const cluelyAsset = (path: string) =>
  `/images/cluely${path.startsWith("/") ? path : `/${path}`}`;

export const ASSETS = {
  wordmark: cluelyAsset("/wordmark-light.svg"),
  wallpaper: cluelyAsset("/_next/static/media/wallpaper@2x.b7df867c.png"),
  mobileNotes: cluelyAsset("/_next/static/media/mobile-notes.5dc13f8d.png"),
  tabletNotes: cluelyAsset("/_next/static/media/tablet-notes.5560bad7.png"),
  desktopNotes: cluelyAsset("/_next/static/media/desktop-notes-2.8614c68b.png"),
  transcript: cluelyAsset("/_next/static/media/transcript-tab.1c48d5b2.png"),
  apple: cluelyAsset("/_next/static/media/apple.9854bb2c.svg"),
  windows: cluelyAsset("/_next/static/media/windows.47b8106d.svg"),
  shimmer: cluelyAsset("/_next/static/media/shimmer.aeaeb2f7.png"),
  commandBtn: cluelyAsset("/_next/static/media/command-btn.05a11379.png"),
  commandActive: cluelyAsset("/_next/static/media/command-active.83241958.png"),
  returnBtn: cluelyAsset("/_next/static/media/return-btn.f7f71a9d.png"),
  returnActive: cluelyAsset("/_next/static/media/return-active.30ff0cd8.png"),
  dock: {
    launchpad: cluelyAsset("/images/pages/home/launchpad-icon.png"),
    safari: cluelyAsset("/images/pages/home/safari-icon.png"),
    settings: cluelyAsset("/images/pages/home/settings-icon.png"),
    zoom: cluelyAsset("/images/pages/home/zoom-icon.png"),
    cluely: cluelyAsset("/images/pages/home/cluely-icon.png"),
    trash: cluelyAsset("/images/pages/home/trash-icon.png"),
  },
  participants: {
    gina: cluelyAsset("/_next/static/media/gina-huels.b14409cf.png"),
    todd: cluelyAsset("/_next/static/media/todd-cremin.9cbbdf9c.png"),
    holly: cluelyAsset("/_next/static/media/holly-gleason.528905fb.png"),
    tomas: cluelyAsset("/_next/static/media/tomas-hansen.5f58da3e.png"),
  },
  invisibleTool: cluelyAsset("/_next/static/media/invisible-tool.452f4abe.png"),
  cluelyLogo: cluelyAsset("/_next/static/media/cluely.7e226633.svg"),
  eye: cluelyAsset("/_next/static/media/eye.79b67e64.svg"),
  platforms: {
    zoom: cluelyAsset("/_next/static/media/zoom.398e9568.png"),
    slack: cluelyAsset("/_next/static/media/slack.0e754017.png"),
    webex: cluelyAsset("/_next/static/media/webex.6e65e4a4.png"),
    teams: cluelyAsset("/_next/static/media/teams.845b90a5.png"),
    meet: cluelyAsset("/_next/static/media/meet.7640c976.png"),
  },
  bgBlue: cluelyAsset("/_next/static/media/bg-blue.825b2efd.jpg"),
  bgPink: cluelyAsset("/_next/static/media/bg-pink.1696fade.jpg"),
  bgPurple: cluelyAsset("/_next/static/media/bg-purple.449cf71b.jpg"),
  bgPurpleDark: cluelyAsset("/_next/static/media/bg-purple-dark.58e0b5e1.jpg"),
  fileBrowser: cluelyAsset("/_next/static/media/file-browser-card.8990f1d2.png"),
  messaging: cluelyAsset("/_next/static/media/messaging-card.f1bfaf57.png"),
  videoConference: cluelyAsset("/_next/static/media/video-conference-card.26ec85da.png"),
  videoPlayer: cluelyAsset("/_next/static/media/video-player-card.9b7a7f86.png"),
} as const;

export const HERO_VIDEO =
  "https://cluely.com/videos/home/hero-v2/pro-res-hevc-safari.mp4";
