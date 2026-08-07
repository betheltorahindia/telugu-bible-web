/**
 * Central place for every external link used by the Social page.
 *
 * ADD NEW LINKS HERE — nothing else needs to change:
 *  - New Spotify show?  push the show id into SPOTIFY_SHOW_IDS
 *    (the id is the part after /show/ and before the "?" in the share link).
 *  - New YouTube channel? change YOUTUBE.handle / channelId.
 *  - New social profile? edit SOCIAL_LINKS.
 */

export const YOUTUBE = {
  handle: "betheltorahindia",
  channelId: "UCg72yhU9Dg9tR3KUukO3nWw",
  channelUrl: "https://youtube.com/@betheltorahindia",
  videosUrl: "https://www.youtube.com/@betheltorahindia/videos",
  playlistsUrl: "https://www.youtube.com/@betheltorahindia/playlists",
} as const;

/** Spotify show ids — paste only the id from open.spotify.com/show/<id>?si=... */
export const SPOTIFY_SHOW_IDS: string[] = [
  "63mln3tSO1GX5JN0MFDVsi",
  "2j4YIzuwpwNHd31fyk4utD",
  "63fgmwfIMFdzCd0fj54Pbo",
  "2W6koJ38LEzmCpux0g8XEm",
  "4rNmJZvlIjY1bwQ1yHAPfF",
  "1oRv7oQzRlWYiFqWW8oS5H",
  "3eG9t4S6xnuckKM0vl9uqw",
  "4UrjE05np3hvBq2vTUgoFA",
  "0yIW6WcX5Nt62CEaBx8Uy7",
  "1USld4F6ktk46RwQRxK25j",
  "78kTv4bAvW0EmLUZynJ3el",
  "5m9ClL7l7HfvUN0IM0HPMA",
  "0D7rs5MxsVNeEWNqSheXed",
  "2qyHCoBzZZLlhRcam6Weqz",
  "5Ja5ECVqlLLHjZHCz2pfZ5",
  "4svlsF9EflH0AC3uoZBeB4",
  "0irgqP8czkv5gfl4zQ9gtG",
  "0CHik2vHg2mtXzJYv623R1",
  "2RGF8iCN6ajYGP0BhPh8rS",
  "20qVhNhbMZoLHjzfjr2Qo0",
  "5RUGGET13ngbY1AcZGVQE3",
  "033CyiYcj2Q6avPJYt1Lo7",
  "033TitSnYnItGuIWC6GDwq",
];

export const SOCIAL_LINKS = {
  instagram: "https://www.instagram.com/betheltorahindia/",
  facebook: "https://www.facebook.com/betheltorahindia",
  whatsapp: "https://whatsapp.com/channel/betheltorahindia",
} as const;

export type YouTubeVideo = {
  id: string;
  title: string;
  thumbnail: string;
  duration: string | null;
  published: string | null;
  url: string;
};

export type SpotifyShow = {
  id: string;
  title: string;
  thumbnail: string | null;
  url: string;
  embedUrl: string;
};