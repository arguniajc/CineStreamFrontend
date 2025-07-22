// =======================
// Vista previa de imagen
// =======================

const inputImagenPortada = document.getElementById('imagen_portada');
const contenedorPreview = document.getElementById('imagePreviewContainer');
const vistaPrevia = document.getElementById('imagePreview');

inputImagenPortada.addEventListener('input', () => {
  const url = inputImagenPortada.value.trim();

  if (!url) {
    contenedorPreview.style.display = 'none';
    return;
  }

  vistaPrevia.src = url;

  vistaPrevia.onload = () => {
    contenedorPreview.style.display = 'block';
  };

  vistaPrevia.onerror = () => {
    contenedorPreview.style.display = 'none';
  };
});

// =======================
// Vista previa de video (tráiler)
// =======================

const inputTrailer = document.getElementById('trailer_url');
const contenedorVideo = document.getElementById('videoPreviewContainer');
const vistaVideo = document.getElementById('videoPreview');

inputTrailer.addEventListener('input', () => {
  const url = inputTrailer.value.trim();
  const embed = convertirYouTubeEmbed(url);

  if (embed) {
    vistaVideo.src = embed;
    contenedorVideo.style.display = 'block';
  } else {
    vistaVideo.src = '';
    contenedorVideo.style.display = 'none';
  }
});

function convertirYouTubeEmbed(url) {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
}

// =======================
// Toggle de tema
// =======================

const btnTema = document.getElementById('themeToggle');
const htmlRoot = document.documentElement;

btnTema.addEventListener('click', () => {
  const modoOscuro = htmlRoot.getAttribute('data-theme') === 'dark';
  const nuevoTema = modoOscuro ? 'light' : 'dark';

  htmlRoot.setAttribute('data-theme', nuevoTema);
  btnTema.innerHTML = modoOscuro ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';

  const variablesTema = modoOscuro
    ? {
        '--text': '#333333',
        '--text-light': '#6b7280',
        '--bg': '#f9fafb',
        '--card-bg': '#ffffff',
        '--border': '#e5e7eb',
        '--preview-bg': '#f3f4f6',
      }
    : {
        '--text': '#e5e7eb',
        '--text-light': '#9ca3af',
        '--bg': '#111827',
        '--card-bg': '#1f2937',
        '--border': '#374151',
        '--preview-bg': '#111827',
      };

  for (const [variable, valor] of Object.entries(variablesTema)) {
    htmlRoot.style.setProperty(variable, valor);
  }
});

// =======================
// Cargar países desde API
// =======================

const selectPais = document.getElementById("pais");

async function cargarPaises() {
  try {
    const response = await fetch("https://restcountries.com/v3.1/all?fields=translations,cca2,name");
    const data = await response.json();

    const paisesOrdenados = data
      .map(p => ({
        nombre: p.translations?.spa?.common || p.name.common,
        codigo: p.cca2
      }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre));

    paisesOrdenados.forEach(pais => {
      const option = document.createElement("option");
      option.value = pais.nombre;
      option.textContent = pais.nombre;
      selectPais.appendChild(option);
    });

  } catch (error) {
    console.error("Error cargando países:", error);
    alert("No se pudieron cargar los países.");
  }
}

cargarPaises();

// =======================
// Lógica del formulario
// =======================

document.addEventListener("DOMContentLoaded", () => {
  const select = document.getElementById("ano_estreno");
  for (let anio = 1900; anio <= 2050; anio++) {
    const option = document.createElement("option");
    option.value = anio;
    option.textContent = anio;
    select.appendChild(option);
  }

  // Validación dinámica del input de calificación
  const calificacionInput = document.getElementById("calificacion");
  calificacionInput.addEventListener("input", () => {
    let valor = parseFloat(calificacionInput.value);

    if (isNaN(valor)) return;

    if (valor > 10) {
      calificacionInput.value = 10;
    } else if (valor < 1) {
      calificacionInput.value = 1;
    }
  });
});



const formPelicula = document.getElementById("formPelicula");

formPelicula.addEventListener("submit", async (e) => {
  e.preventDefault();

  const getValue = (id) => document.getElementById(id).value.trim();

  const tituloEspanol = getValue("titulo_espanol");
  const tituloOriginal = getValue("titulo_original");
  const anio = parseInt(getValue("ano_estreno"));
  const horas = parseInt(getValue("duracion_horas"));
  const minutos = parseInt(getValue("duracion_minutos"));
  let calificacion = parseFloat(getValue("calificacion"));
  const fechaEstreno = getValue("fecha_estreno");
  const sinopsis = getValue("sinopsis");
  const trailerUrl = getValue("trailer_url");
  const pais = getValue("pais");
  const imagenPortada = getValue("imagen_portada");

  if (
    !tituloEspanol || !tituloOriginal || !anio || !fechaEstreno ||
    !sinopsis || !trailerUrl || !pais || !imagenPortada
  ) {
    alert("Todos los campos son obligatorios.");
    return;
  }

  if (isNaN(anio) || anio < 1900 || anio > 2050) {
    alert("El año debe estar entre 1900 y 2050.");
    return;
  }

  if (isNaN(horas) || isNaN(minutos) || horas < 0 || minutos < 0 || minutos > 59) {
    alert("Duración inválida.");
    return;
  }

  const duracion = horas * 60 + minutos;
  if (duracion <= 0 || duracion > 1000) {
    alert("La duración debe estar entre 1 y 1000 minutos.");
    return;
  }

  if (isNaN(calificacion)) {
    alert("Calificación inválida.");
    return;
  }

  calificacion = Math.min(Math.max(calificacion, 1), 10);
  calificacion = parseFloat(calificacion.toFixed(1));

  const pelicula = {
    titulo_espanol: tituloEspanol,
    titulo_original: tituloOriginal,
    ano_estreno: anio,
    duracion,
    calificacion,
    fecha_estreno: fechaEstreno,
    sinopsis,
    pais,
    trailer_url: trailerUrl,
    imagen_portada: imagenPortada
  };

  console.log("📦 Enviando JSON:", JSON.stringify(pelicula, null, 2));

  try {
    const respuesta = await fetch("http://localhost:3000/api/peliculas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pelicula)
    });

    const resultado = await respuesta.json();

    if (!respuesta.ok) {
      alert("❌ Error: " + resultado.error);
      return;
    }

    const idPelicula = resultado.id || resultado._id || resultado.peliculaId;
    window.location.href = `agregar_actores.html?peliculaId=${encodeURIComponent(idPelicula)}`;

  } catch (error) {
    alert("⚠️ Error creando película: " + error.message);
  }
});
