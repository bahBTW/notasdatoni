async function searchLyrics() {
  const input = document.getElementById('search').value.trim();
  const resultDiv = document.getElementById('result');
  resultDiv.innerHTML = "";

  if (!input.includes(" - ")) {
    resultDiv.innerHTML = "<p style='color: #ff9;'>Use o formato: <strong>Artista - Música</strong></p>";
    return;
  }

  const [artist, title] = input.split(" - ").map(s => s.trim());

  resultDiv.innerHTML = "<p>🔎 Buscando letra...</p>";

  try {
    const res = await fetch(`https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`);

    if (!res.ok) {
      throw new Error("Letra não encontrada");
    }

    const data = await res.json();

    resultDiv.innerHTML = `
      <h2>${title} - ${artist}</h2>
      <pre style="white-space: pre-wrap; background: #2c2c3c; padding: 1em; border-radius: 8px;">${data.lyrics}</pre>
      <iframe style="margin-top:20px; border-radius:8px;" 
        src="https://open.spotify.com/embed/search/${encodeURIComponent(artist + ' ' + title)}" 
        width="100%" height="80" frameborder="0" allowtransparency="true" allow="encrypted-media">
      </iframe>
    `;
  } catch (err) {
    resultDiv.innerHTML = "<p style='color: #f99;'>❌ Letra não encontrada ou erro ao buscar.</p>";
  }
}
