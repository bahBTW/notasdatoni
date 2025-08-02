const GENIUS_TOKEN = process.env.GENIUS_TOKEN;
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

async function getSpotifyAccessToken() {
  const creds = Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString("base64");

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${creds}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: "grant_type=client_credentials"
  });

  const data = await response.json();
  return data.access_token;
}

export default async function handler(req, res) {
  const { q } = req.query;

  if (!q) return res.status(400).json({ error: "Missing query parameter 'q'" });

  if (!GENIUS_TOKEN || !SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
    return res.status(500).json({ error: "Missing environment variables" });
  }

  try {
    const geniusRes = await fetch(`https://api.genius.com/search?q=${encodeURIComponent(q)}`, {
      headers: { Authorization: `Bearer ${GENIUS_TOKEN}` }
    });

    if (!geniusRes.ok) {
      const text = await geniusRes.text();
      console.error("Genius API error:", geniusRes.status, text);
      return res.status(geniusRes.status).json({ error: "Failed to fetch from Genius API", detail: text });
    }

    const geniusData = await geniusRes.json();

    const spotifyToken = await getSpotifyAccessToken();
    if (!spotifyToken) {
      return res.status(500).json({ error: "Failed to get Spotify access token" });
    }

    const hits = await Promise.all(
      geniusData.response.hits.map(async (hit) => {
        const song = hit.result;
        const query = `${song.primary_artist.name} ${song.title}`;

        const spotifyRes = await fetch(
          `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=1`,
          {
            headers: { Authorization: `Bearer ${spotifyToken}` }
          }
        );

        if (!spotifyRes.ok) {
          const spotifyText = await spotifyRes.text();
          console.error("Spotify search error:", spotifyRes.status, spotifyText);
          return {
            id: song.id,
            title: song.title,
            artist: song.primary_artist.name,
            url: song.url,
            thumbnail: song.song_art_image_thumbnail_url,
            spotifyTrackId: null
          };
        }

        const spotifyData = await spotifyRes.json();
        const track = spotifyData.tracks.items[0] || null;

        return {
          id: song.id,
          title: song.title,
          artist: song.primary_artist.name,
          url: song.url,
          thumbnail: song.song_art_image_thumbnail_url,
          spotifyTrackId: track ? track.id : null
        };
      })
    );

    res.status(200).json({ hits });
  } catch (error) {
    console.error("Internal error:", error);
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
}
