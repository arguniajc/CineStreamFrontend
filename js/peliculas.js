const apiUrl = "http://localhost:3000/api/peliculas";
const contenedor = document.getElementById("contenedor");
const modal = document.getElementById("modal");
const modalTitulo = document.getElementById("modal-titulo");
const videoTrailer = document.getElementById("video-trailer");
const detalleOriginal = document.getElementById("detalle-original");
const detalleAno = document.getElementById("detalle-ano");
const detalleDuracion = document.getElementById("detalle-duracion");
const detallePais = document.getElementById("detalle-pais");
const detalleCalificacion = document.getElementById("detalle-calificacion");
const detalleEstreno = document.getElementById("detalle-estreno");
const detalleSinopsis = document.getElementById("detalle-sinopsis");
const relaciones = document.getElementById("relaciones");

const cargarItems = async () => {
  try {
    const res = await fetch(apiUrl);
    const items = await res.json();
    contenedor.innerHTML = "";

    items.forEach(item => {
      const card = document.createElement("div");
      card.className = "card";
      card.onclick = () => mostrarDetalles(item);

      const img = document.createElement("img");
      img.src = item.imagen_portada || "https://via.placeholder.com/220x280?text=Sin+Poster";
      img.alt = item.titulo_espanol;

      const content = document.createElement("div");
      content.className = "card-content";

      const titulo = document.createElement("h3");
      titulo.textContent = item.titulo_espanol;

      content.appendChild(titulo);
      card.appendChild(img);
      card.appendChild(content);
      contenedor.appendChild(card);
    });
  } catch (error) {
    console.error("Error al cargar películas:", error);
    contenedor.innerHTML = "<p>Error al cargar películas</p>";
  }
};

const mostrarDetalles = (item) => {
  modalTitulo.textContent = item.titulo_espanol;

  if (item.trailer_url?.includes("watch?v=")) {
    const videoId = item.trailer_url.split("watch?v=")[1].split("&")[0];
    videoTrailer.src = `https://www.youtube.com/embed/${videoId}`;
  } else {
    videoTrailer.src = "";
  }

  detalleOriginal.textContent = item.titulo_original || "";
  detalleAno.textContent = item.ano_estreno || "";
  detalleDuracion.textContent = item.duracion + " min" || "";
  detallePais.textContent = item.pais || "";
  detalleCalificacion.textContent = item.calificacion || "";
  detalleEstreno.textContent = item.fecha_estreno || "";
  detalleSinopsis.textContent = item.sinopsis || "";
  relaciones.innerHTML = "";

  const mostrarRelacion = (titulo, lista, campoImagen = "imagen_url", campoTexto = "nombre") => {
    if (lista && lista.length > 0) {
      const section = document.createElement("div");
      section.innerHTML = `<div class='section-title'>${titulo}</div>`;

      const grid = document.createElement("div");
      grid.className = "relations";

      lista.forEach(el => {
        const card = document.createElement("div");
        card.className = "relation-card";

        if (titulo === "Géneros" || titulo === "Idiomas") {
          const label = document.createElement("span");
          const icon = titulo === "Géneros" ? "🎞️" : "🌐";
          label.textContent = `${icon} ${el[campoTexto]}`;
          card.appendChild(label);
        } else {
          const img = document.createElement("img");
          img.src = el[campoImagen] || "https://via.placeholder.com/120x100?text=Sin+Imagen";
          const label = document.createElement("span");
          label.textContent = el.pelicula_actor?.personaje
            ? `${el[campoTexto]} (${el.pelicula_actor.personaje})`
            : el[campoTexto];
          card.appendChild(img);
          card.appendChild(label);
        }

        grid.appendChild(card);
      });

      section.appendChild(grid);
      relaciones.appendChild(section);
    }
  };

  mostrarRelacion("Actores", item.Actors || []);
  mostrarRelacion("Directores", item.directors || []);
  mostrarRelacion("Compañías", item.compania || [], "logo_url");
  mostrarRelacion("Géneros", item.generos || [], null, "nombre");
  mostrarRelacion("Idiomas", item.idiomas || [], null, "nombre");

  modal.style.display = "block";
};

const cerrarModal = () => {
  videoTrailer.src = "";
  modal.style.display = "none";
};

window.onclick = (e) => {
  if (e.target === modal) cerrarModal();
};

cargarItems();
