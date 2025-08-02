async function searchMusic(query) {
  const resultsDiv = document.getElementById("results");
  resultsDiv.innerHTML = "<p>Buscando...</p>";

  try {
    const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    if (!response.ok) {
      const error = await response.json();
      resultsDiv.innerHTML = `<p style="color: red;">Erro: ${error.error}</p>`;
      return;
    }
    const data = await response.json();

    if (!data.hits.length) {
      resultsDiv.innerHTML = "<p>Nenhum resultado encontrado.</p>";
      return;
    }

    resultsDiv.innerHTML = "";
    data.hits.forEach(hit => {
      const div = document.createElement("div");
      div.classList.add("song");

      div.innerHTML = `
        <h3>${hit.title} — ${hit.artist}</h3>
        <a href="${hit.url}" target="_blank" rel="noopener noreferrer">Ver letra no Genius</a><br/>
        ${hit.youtubeVideoId ? `
          <iframe
            width="300"
            height="170"
            src="https://www.youtube.com/embed/${hit.youtubeVideoId}"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
          ></iframe>
        ` : `<p>Vídeo no YouTube não encontrado.</p>`}
      `;

      resultsDiv.appendChild(div);
    });
  } catch (err) {
    resultsDiv.innerHTML = `<p style="color: red;">Erro ao buscar: ${err.message}</p>`;
  }
}

document.getElementById("searchBtn").addEventListener("click", () => {
  const query = document.getElementById("searchInput").value.trim();
  if (query) searchMusic(query);
});
