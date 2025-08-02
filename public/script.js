async function search() {
  const query = document.getElementById("search").value.trim();
  const resultsDiv = document.getElementById("results");

  if (!query) {
    resultsDiv.innerHTML = '<p style="color:#ffcc00;">Digite algo para buscar!</p>';
    return;
  }

  resultsDiv.innerHTML = "<p>Buscando...</p>";

  try {
    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    const data = await res.json();

    if (data.error) {
      resultsDiv.innerHTML = `<p style="color:#f55;">Erro: ${data.error}</p>`;
      return;
    }

    if (!data.hits.length) {
      resultsDiv.innerHTML = "<p>Nenhum resultado encontrado.</p>";
      return;
    }

    resultsDiv.innerHTML = data.hits
      .map(
        (song) => `
      <div class="song">
        <img src="${song.thumbnail}" alt="Arte da música" />
        <div>
          <a href="${song.url}" target="_blank" rel="noopener noreferrer">${song.title}</a>
          <p>${song.artist}</p>
          ${
            song.spotifyTrackId
              ? `<iframe
                  src="https://open.spotify.com/embed/track/${song.spotifyTrackId}"
                  width="300"
                  height="80"
                  frameborder="0"
                  allowtransparency="true"
                  allow="encrypted-media"
                  style="margin-top:8px; border-radius:8px;">
                </iframe>`
              : ""
          }
        </div>
      </div>
    `
      )
      .join("");
  } catch (e) {
    resultsDiv.innerHTML = `<p style="color:#f55;">Erro ao buscar: ${e.message}</p>`;
  }
}
