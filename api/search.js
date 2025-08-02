export default async function handler(req, res) {
  const { q } = req.query;

  if (!q) return res.status(400).json({ error: "Missing query param" });

  try {
    // Genius
    const geniusRes = await fetch(`https://api.genius.com/search?q=${encodeURIComponent(q)}`, {
      headers: { Authorization: `Bearer ${GENIUS_TOKEN}` }
    });

    const geniusText = await geniusRes.text();

    try {
      var geniusData = JSON.parse(geniusText);
    } catch (e) {
      console.error("Erro ao parsear Genius JSON:", geniusText);
      return res.status(500).json({ error: "Erro no Genius API", detail: geniusText });
    }

    // Spotify token
    const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: "grant_type=client_credentials"
    });

    const tokenText = await tokenRes.text();

    let spotifyTokenData;
    try {
      spotifyTokenData = JSON.parse(tokenText);
    } catch (e) {
      console.error("Erro ao parsear token Spotify:", tokenText);
      return res.status(500).json({ error: "Erro no token Spotify", detail: tokenText });
    }

    const spotifyToken = spotifyTokenData.access_token;

    if (!spotifyToken) {
      return res.status(500).json({ error: "Token Spotify não recebido" });
    }

    // Buscar músicas Spotify para cada Genius hit
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

        const spotifyText = await spotifyRes.text();
        let spotifyData;
        try {
          spotifyData = JSON.parse(spotifyText);
        } catch (e) {
          console.error("Erro ao parsear Spotify search:", spotifyText);
          return {
            id: song.id,
            title: song.title,
            artist: song.primary_artist.name,
            url: song.url,
            thumbnail: song.song_art_image_thumbnail_url,
            spotifyTrackId: null,
            spotifyError: spotifyText
          };
        }

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
  } catch (err) {
    console.error("Erro interno API:", err);
    res.status(500).json({ error: err.message || "Internal Server Error" });
  }
}
