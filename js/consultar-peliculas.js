const listaPeliculasDiv = document.getElementById("listaPeliculas");
const modalPelicula = new bootstrap.Modal(document.getElementById('modalPelicula'));

async function cargarPeliculas() {
  try {
    const res = await fetch("http://localhost:3000/api/peliculas");
    const peliculas = await res.json();

    peliculas.forEach(pelicula => {
      const movieCard = document.createElement("div");
      movieCard.className = "movie-card";
      movieCard.dataset.id = pelicula.id;

      movieCard.innerHTML = `
        <img src="${pelicula.imagen_portada}" alt="${pelicula.titulo_espanol}" class="movie-poster">
        <div class="movie-info">
          <h4 class="movie-title">${pelicula.titulo_espanol}</h4>
          <p class="movie-year">${pelicula.ano_estreno}</p>
        </div>
        ${pelicula.calificacion ? `
          <div class="movie-rating">
            <i class="mdi mdi-star"></i>
            <span>${parseFloat(pelicula.calificacion).toFixed(1)}</span>
          </div>
        ` : ''}
      `;

      movieCard.addEventListener("click", () => abrirModalPelicula(pelicula.id));
      listaPeliculasDiv.appendChild(movieCard);
    });
  } catch (error) {
    console.error("Error cargando películas:", error);
  }
}

async function abrirModalPelicula(idPelicula) {
  // Reset campos del modal
  const camposTexto = [
    "tituloPelicula", "tituloOriginal", "anioPelicula", "duracionPelicula",
    "calificacionPelicula", "fechaEstrenoPelicula", "paisPelicula", "sinopsisPelicula"
  ];
  camposTexto.forEach(id => document.getElementById(id).textContent = "");
  document.getElementById("trailerPelicula").src = "";
  ["listaActores", "listaDirectores", "listaCompanias", "listaIdiomas", "listaGeneros"].forEach(id => {
    document.getElementById(id).innerHTML = "";
  });

  try {
    const res = await fetch("http://localhost:3000/api/peliculas");
    const peliculas = await res.json();
    const pelicula = peliculas.find(p => p.id === idPelicula);
    if (!pelicula) return alert("Película no encontrada");

    // Asignar valores al modal
    document.getElementById("tituloPelicula").textContent = pelicula.titulo_espanol;
    document.getElementById("tituloOriginal").textContent = pelicula.titulo_original || "No disponible";
    document.getElementById("anioPelicula").textContent = pelicula.ano_estreno || "No disponible";
    document.getElementById("duracionPelicula").textContent = pelicula.duracion || "No disponible";
    document.getElementById("calificacionPelicula").textContent = pelicula.calificacion || "No disponible";
    document.getElementById("fechaEstrenoPelicula").textContent = pelicula.fecha_estreno || "No disponible";
    document.getElementById("paisPelicula").textContent = pelicula.pais || "No disponible";
    document.getElementById("sinopsisPelicula").textContent = pelicula.sinopsis || "Sin sinopsis disponible";

    // Estrellas de calificación
    if (pelicula.calificacion) {
      const rating = parseFloat(pelicula.calificacion) / 2;
      const starsContainer = document.querySelector('.rating-stars');
      starsContainer.innerHTML = '';
      for (let i = 0; i < 5; i++) {
        const star = document.createElement('i');
        star.className = i < Math.floor(rating)
          ? 'mdi mdi-star'
          : (i < Math.ceil(rating) ? 'mdi mdi-star-half-full' : 'mdi mdi-star-outline');
        starsContainer.appendChild(star);
      }
    }

    // Trailer
    let trailerUrl = pelicula.trailer_url || "";
    if (trailerUrl.includes("watch?v=")) {
      trailerUrl = trailerUrl.replace("watch?v=", "embed/");
    }
    document.getElementById("trailerPelicula").src = trailerUrl;

    // Cargar relaciones
    await Promise.all([
      cargarActores(idPelicula),
      cargarConImagen("http://localhost:3000/api/pelicula_director/", "listaDirectores", "nombre_director", "imagen_director", idPelicula),
      cargarConImagen("http://localhost:3000/api/pelicula-compania", "listaCompanias", "nombre_compania", "logo_compania", idPelicula),
      cargarSinImagen("http://localhost:3000/api/pelicula-idioma", "listaIdiomas", "nombre_idioma", idPelicula),
      cargarSinImagen("http://localhost:3000/api/pelicula-genero", "listaGeneros", "nombre_genero", idPelicula)
    ]);

    modalPelicula.show();
  } catch (error) {
    console.error("Error cargando detalles:", error);
    alert("Error al cargar detalles de la película.");
  }
}

async function cargarActores(idPelicula) {
  const res = await fetch("http://localhost:3000/api/pelicula-actor/");
  const data = await res.json();
  const filtrados = data.filter(item => item.id_pelicula === idPelicula);
  const ul = document.getElementById("listaActores");

  if (filtrados.length === 0) {
    ul.innerHTML = '<li class="list-group-item">No disponible</li>';
  } else {
    filtrados.forEach(item => {
      const nombre = item.actor?.nombre || "Sin nombre";
      const imagen = item.actor?.imagen_url || "";
      const personaje = item.personaje || "";

      const li = document.createElement("li");
      li.className = "list-group-item media-list-item";
      li.innerHTML = `
        ${imagen ? `<img src="${imagen}" alt="${nombre}" />` : ""}
        <span>
          <span class="actor-nombre">${nombre}</span>
          <span class="actor-personaje">${personaje}</span>
        </span>
      `;
      ul.appendChild(li);
    });
  }
}

async function cargarConImagen(url, ulId, nombreCampo, imgCampo, idPelicula) {
  const res = await fetch(url);
  const data = await res.json();
  const filtrados = data.filter(item => item.id_pelicula === idPelicula);
  const ul = document.getElementById(ulId);

  if (filtrados.length === 0) {
    ul.innerHTML = '<li class="list-group-item">No disponible</li>';
  } else {
    filtrados.forEach(item => {
      const nombre = item[nombreCampo] || "Sin nombre";
      const imagen = item[imgCampo] || "";

      const li = document.createElement("li");
      li.className = "list-group-item media-list-item";
      li.innerHTML = `
        ${imagen ? `<img src="${imagen}" alt="${nombre}" />` : ""}
        <span>${nombre}</span>
      `;
      ul.appendChild(li);
    });
  }
}

async function cargarSinImagen(url, ulId, nombreCampo, idPelicula) {
  const res = await fetch(url);
  const data = await res.json();
  const filtrados = data.filter(item => item.id_pelicula === idPelicula);
  const ul = document.getElementById(ulId);

  if (filtrados.length === 0) {
    ul.innerHTML = '<li class="list-group-item">No disponible</li>';
  } else {
    filtrados.forEach(item => {
      const li = document.createElement("li");
      li.className = "list-group-item";
      li.textContent = item[nombreCampo] || "Sin dato";
      ul.appendChild(li);
    });
  }
}

cargarPeliculas();
