
// Vista previa de la imagen
const imagenPortadaInput = document.getElementById('imagen_portada');
const imagePreviewContainer = document.getElementById('imagePreviewContainer');
const imagePreview = document.getElementById('imagePreview');

imagenPortadaInput.addEventListener('input', function() {
  const url = this.value.trim();
  if (url) {
    imagePreview.src = url;
    imagePreviewContainer.style.display = 'block';
    
    // Verificar si la imagen carga correctamente
    imagePreview.onload = function() {
      imagePreviewContainer.style.display = 'block';
    };
    
    imagePreview.onerror = function() {
      imagePreviewContainer.style.display = 'none';
    };
  } else {
    imagePreviewContainer.style.display = 'none';
  }
});

// Toggle de tema (opcional)
const themeToggle = document.getElementById('themeToggle');
const html = document.documentElement;

themeToggle.addEventListener('click', function() {
  const isDark = html.getAttribute('data-theme') === 'dark';
  html.setAttribute('data-theme', isDark ? 'light' : 'dark');
  themeToggle.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
  
  // Cambiar variables CSS según el tema
  if (isDark) {
    // Tema claro
    document.documentElement.style.setProperty('--text', '#333333');
    document.documentElement.style.setProperty('--text-light', '#6b7280');
    document.documentElement.style.setProperty('--bg', '#f9fafb');
    document.documentElement.style.setProperty('--card-bg', '#ffffff');
    document.documentElement.style.setProperty('--border', '#e5e7eb');
    document.documentElement.style.setProperty('--preview-bg', '#f3f4f6');
  } else {
    // Tema oscuro
    document.documentElement.style.setProperty('--text', '#e5e7eb');
    document.documentElement.style.setProperty('--text-light', '#9ca3af');
    document.documentElement.style.setProperty('--bg', '#111827');
    document.documentElement.style.setProperty('--card-bg', '#1f2937');
    document.documentElement.style.setProperty('--border', '#374151');
    document.documentElement.style.setProperty('--preview-bg', '#111827');
  }
});

// Mantener la lógica original del formulario
const form = document.getElementById("formPelicula");

form.addEventListener("submit", async function (e) {
  e.preventDefault();

  const tituloEspanol = document.getElementById("titulo_espanol").value.trim();
  const tituloOriginal = document.getElementById("titulo_original").value.trim();
  const anio = parseInt(document.getElementById("ano_estreno").value);
  const horas = parseInt(document.getElementById("duracion_horas").value);
  const minutos = parseInt(document.getElementById("duracion_minutos").value);
  let calificacion = parseFloat(document.getElementById("calificacion").value);
  const fechaEstreno = document.getElementById("fecha_estreno").value;
  const sinopsis = document.getElementById("sinopsis").value.trim();
  const trailerUrl = document.getElementById("trailer_url").value.trim();
  const pais = document.getElementById("pais").value.trim();
  const imagenPortada = document.getElementById("imagen_portada").value.trim();

  if (!tituloEspanol || !tituloOriginal || !anio || !fechaEstreno || !sinopsis || !trailerUrl || !pais || !imagenPortada) {
    alert("Todos los campos son obligatorios.");
    return;
  }

  if (isNaN(anio) || anio < 1990 || anio > 2050) {
    alert("El año debe estar entre 1990 y 2050.");
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

  if (calificacion > 10) calificacion = 10;
  if (calificacion < 1) calificacion = 1;

  calificacion = parseFloat(calificacion.toFixed(1));

  const data = {
    titulo_espanol: tituloEspanol,
    titulo_original: tituloOriginal,
    ano_estreno: anio,
    duracion: duracion,
    calificacion: calificacion,
    fecha_estreno: fechaEstreno,
    sinopsis: sinopsis,
    pais: pais,
    trailer_url: trailerUrl,
    imagen_portada: imagenPortada
  };

  console.log("📦 Enviando JSON:", JSON.stringify(data, null, 2));

  try {
    const response = await fetch("http://localhost:3000/api/peliculas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (!response.ok) {
      alert("❌ Error: " + result.error);
    } else {
      const idPelicula = result.id || result._id || result.peliculaId;
      window.location.href = `agregar_actores.html?peliculaId=${encodeURIComponent(idPelicula)}`;
    }
  } catch (error) {
    alert("⚠️ Error creando película: " + error.message);
  }
});
