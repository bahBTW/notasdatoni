
// /api/search.js
import fetch from "node-fetch";

export default async function handler(req, res) {
  const { q } = req.query;

  if (!q) {
    return res.status(400).json({ error: "Missing query parameter 'q'" });
  }

  const token = process.env.GENIUS_TOKEN;
  if (!token) {
    return res.status(500).json({ error: "Missing Genius API token" });
  }

  try {
    const response = await fetch(`https://api.genius.com/search?q=${encodeURIComponent(q)}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: "Failed to fetch from Genius API" });
    }

    const data = await response.json();

    // Retornamos só o que interessa (título, artista, url da música)
    const hits = data.response.hits.map(hit => ({
      id: hit.result.id,
      title: hit.result.title,
      artist: hit.result.primary_artist.name,
      url: hit.result.url,
      thumbnail: hit.result.song_art_image_thumbnail_url
    }));

    res.status(200).json({ hits });
  } catch (error) {
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
}
