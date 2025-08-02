const GENIUS_TOKEN = process.env.GENIUS_TOKEN;
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

export default async function handler(req, res) {
  const { q } = req.query;

  if (!q) return res.status(400).json({ error: "Missing query parameter 'q'" });
  if (!GENIUS_TOKEN || !YOUTUBE_API_KEY) {
    return res.status(500).json({ error: "Missing environment variables" });
  }

  try {
    // Busca Genius
    const geniusRes = await fetch(`https://api.genius.com/search?q=${encodeURIComponent(q)}`, {
      headers: { Authorization: `Bearer ${GENIUS_TOKEN}` }
    });

    if (!geniusRes.ok) {
      const text = await geniusRes.text();
      console.error("Genius API error:", geniusRes.status, text);
      return res.status(geniusRes.status).json({ error: "Failed to fetch from Genius API", detail: text });
    }

    const geniusData = await geniusRes.json();

    // Para cada música do Genius, busca vídeo no YouTube
    const hits = await Promise.all(
      geniusData.response.hits.map(async (hit) => {
        const song = hit.result;
        const query = `${song.primary_artist.name} ${song.title}`;

        const ytRes = await fetch(
          `https://youtube.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&maxResults=1&type=video&key=${YOUTUBE_API_KEY}`
        );

        if (!ytRes.ok) {
          const text = await ytRes.text();
          console.error("YouTube API error:", ytRes.status, text);
          return {
            id: song.id,
            title: song.title,
            artist: song.primary_artist.name,
            url: song.url,
            thumbnail: song.song_art_image_thumbnail_url,
            youtubeVideoId: null
          };
        }

        const ytData = await ytRes.json();

        const videoId = ytData.items && ytData.items.length > 0 ? ytData.items[0].id.videoId : null;

        return {
          id: song.id,
          title: song.title,
          artist: song.primary_artist.name,
          url: song.url,
          thumbnail: song.song_art_image_thumbnail_url,
          youtubeVideoId: videoId
        };
      })
    );

    res.status(200).json({ hits });
  } catch (error) {
    console.error("Internal error:", error);
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
}
