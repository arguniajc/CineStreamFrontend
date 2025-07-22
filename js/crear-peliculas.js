// =======================
// CONSTANTES Y SELECTORES
// =======================
const DOM = {
  // Vista previa de imagen
  imagenPortada: document.getElementById('imagen_portada'),
  contenedorPreview: document.getElementById('imagePreviewContainer'),
  vistaPrevia: document.getElementById('imagePreview'),
  
  // Vista previa de video
  inputTrailer: document.getElementById('trailer_url'),
  contenedorVideo: document.getElementById('videoPreviewContainer'),
  vistaVideo: document.getElementById('videoPreview'),
  
  // Toggle de tema
  btnTema: document.getElementById('themeToggle'),
  htmlRoot: document.documentElement,
  
  // Selectores de formulario
  selectPais: document.getElementById("pais"),
  selectAnio: document.getElementById("ano_estreno"),
  calificacionInput: document.getElementById("calificacion"),
  formPelicula: document.getElementById("formPelicula")
};

// =======================
// VISTA PREVIA DE IMAGEN
// =======================
const setupImagePreview = () => {
  DOM.imagenPortada.addEventListener('input', () => {
    const url = DOM.imagenPortada.value.trim();
    
    if (!url) {
      DOM.contenedorPreview.style.display = 'none';
      return;
    }

    DOM.vistaPrevia.src = url;
    
    DOM.vistaPrevia.onload = () => {
      DOM.contenedorPreview.style.display = 'block';
      DOM.vistaPrevia.style.display = 'block';
    };

    DOM.vistaPrevia.onerror = () => {
      DOM.contenedorPreview.style.display = 'none';
    };
  });
};

// =======================
// VISTA PREVIA DE VIDEO
// =======================
const setupVideoPreview = () => {
  const convertirYouTubeEmbed = (url) => {
    // Soporte para múltiples formatos de URL de YouTube
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/,
      /(?:youtube\.com\/embed\/)([\w-]{11})/,
      /(?:youtube\.com\/v\/)([\w-]{11})/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return `https://www.youtube.com/embed/${match[1]}?rel=0&showinfo=0`;
    }
    return null;
  };

  DOM.inputTrailer.addEventListener('input', debounce(() => {
    const url = DOM.inputTrailer.value.trim();
    const embed = convertirYouTubeEmbed(url);

    if (embed) {
      DOM.vistaVideo.src = embed;
      DOM.contenedorVideo.style.display = 'block';
    } else {
      DOM.vistaVideo.src = '';
      DOM.contenedorVideo.style.display = 'none';
    }
  }, 500));
};

// =======================
// TOGGLE DE TEMA
// =======================
const setupThemeToggle = () => {
  const themeVariables = {
    light: {
      '--text': '#333333',
      '--text-light': '#6b7280',
      '--bg': '#f9fafb',
      '--card-bg': '#ffffff',
      '--border': '#e5e7eb',
      '--preview-bg': '#f3f4f6',
    },
    dark: {
      '--text': '#e5e7eb',
      '--text-light': '#9ca3af',
      '--bg': '#111827',
      '--card-bg': '#1f2937',
      '--border': '#374151',
      '--preview-bg': '#111827',
    }
  };

  DOM.btnTema.addEventListener('click', () => {
    const isDarkMode = DOM.htmlRoot.getAttribute('data-theme') === 'dark';
    const newTheme = isDarkMode ? 'light' : 'dark';
    
    // Actualizar atributo y icono
    DOM.htmlRoot.setAttribute('data-theme', newTheme);
    DOM.btnTema.innerHTML = isDarkMode 
      ? '<i class="fas fa-sun"></i>' 
      : '<i class="fas fa-moon"></i>';
    
    // Aplicar variables CSS
    for (const [variable, value] of Object.entries(themeVariables[newTheme])) {
      DOM.htmlRoot.style.setProperty(variable, value);
    }
    
    // Guardar preferencia en localStorage
    localStorage.setItem('themePreference', newTheme);
  });
  
  // Cargar tema guardado
  const savedTheme = localStorage.getItem('themePreference') || 'dark';
  DOM.htmlRoot.setAttribute('data-theme', savedTheme);
  DOM.btnTema.innerHTML = savedTheme === 'dark' 
    ? '<i class="fas fa-moon"></i>' 
    : '<i class="fas fa-sun"></i>';
};

// =======================
// CARGAR PAÍSES DESDE API
// =======================
const cargarPaises = async () => {
  try {
    const response = await fetch("https://restcountries.com/v3.1/all?fields=translations,cca2,name,flags");
    const data = await response.json();

    const paisesOrdenados = data
      .map(p => ({
        nombre: p.translations?.spa?.common || p.name.common,
        codigo: p.cca2,
        bandera: p.flags?.png
      }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre));

    // Limpiar select primero
    DOM.selectPais.innerHTML = '<option value="">Seleccione un país</option>';
    
    paisesOrdenados.forEach(pais => {
      const option = document.createElement("option");
      option.value = pais.nombre;
      option.textContent = pais.nombre;
      option.dataset.bandera = pais.bandera;
      DOM.selectPais.appendChild(option);
    });

  } catch (error) {
    console.error("Error cargando países:", error);
    mostrarNotificacion("No se pudieron cargar los países. Intente recargar la página.", "error");
  }
};

// =======================
// FORMULARIO - AÑOS DE ESTRENO
// =======================
const setupAniosEstreno = () => {
  const currentYear = new Date().getFullYear();
  for (let anio = currentYear + 5; anio >= 1900; anio--) {
    const option = document.createElement("option");
    option.value = anio;
    option.textContent = anio;
    DOM.selectAnio.appendChild(option);
  }
};

// =======================
// VALIDACIÓN DE CALIFICACIÓN
// =======================
const setupCalificacionValidation = () => {
  DOM.calificacionInput.addEventListener("input", () => {
    let valor = parseFloat(DOM.calificacionInput.value);
    
    if (isNaN(valor)) {
      DOM.calificacionInput.value = '';
      return;
    }
    
    // Asegurar que esté entre 1 y 10
    valor = Math.min(Math.max(valor, 1), 10);
    DOM.calificacionInput.value = valor.toFixed(1);
  });
};

// =======================
// MANEJO DEL FORMULARIO
// =======================
const setupFormulario = () => {
  DOM.formPelicula.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    // Mostrar loader
    const submitBtn = DOM.formPelicula.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
    submitBtn.disabled = true;
    
    try {
      const formData = obtenerDatosFormulario();
      validarDatosFormulario(formData);
      
      const pelicula = {
        titulo_espanol: formData.tituloEspanol,
        titulo_original: formData.tituloOriginal,
        ano_estreno: formData.anio,
        duracion: formData.duracion,
        calificacion: formData.calificacion,
        fecha_estreno: formData.fechaEstreno,
        sinopsis: formData.sinopsis,
        pais: formData.pais,
        trailer_url: formData.trailerUrl,
        imagen_portada: formData.imagenPortada
      };

      console.log("📦 Datos de la película:", pelicula);
      
      const respuesta = await enviarDatosPelicula(pelicula);
      manejarRespuesta(respuesta);
      
    } catch (error) {
      console.error("Error al enviar el formulario:", error);
      mostrarNotificacion(error.message, "error");
    } finally {
      submitBtn.innerHTML = originalBtnText;
      submitBtn.disabled = false;
    }
  });
};

// Helper: Obtener datos del formulario
const obtenerDatosFormulario = () => {
  const getValue = (id) => document.getElementById(id).value.trim();
  
  return {
    tituloEspanol: getValue("titulo_espanol"),
    tituloOriginal: getValue("titulo_original"),
    anio: parseInt(getValue("ano_estreno")),
    duracion: parseInt(getValue("duracion_minutos")),
    calificacion: parseFloat(getValue("calificacion")),
    fechaEstreno: getValue("fecha_estreno"),
    sinopsis: getValue("sinopsis"),
    trailerUrl: getValue("trailer_url"),
    pais: getValue("pais"),
    imagenPortada: getValue("imagen_portada")
  };
};

// Helper: Validar datos del formulario
const validarDatosFormulario = (data) => {
  const errors = [];
  
  if (!data.tituloEspanol) errors.push("El título en español es obligatorio");
  if (!data.tituloOriginal) errors.push("El título original es obligatorio");
  if (!data.anio || data.anio < 1900 || data.anio > new Date().getFullYear() + 5) {
    errors.push(`El año debe estar entre 1900 y ${new Date().getFullYear() + 5}`);
  }
  if (!data.duracion || data.duracion <= 0 || data.duracion > 1000) {
    errors.push("La duración debe estar entre 1 y 1000 minutos");
  }
  if (!data.calificacion || data.calificacion < 1 || data.calificacion > 10) {
    errors.push("La calificación debe estar entre 1.0 y 10.0");
  }
  if (!data.fechaEstreno) errors.push("La fecha de estreno es obligatoria");
  if (!data.sinopsis || data.sinopsis.length < 20) {
    errors.push("La sinopsis debe tener al menos 20 caracteres");
  }
  if (!data.trailerUrl) errors.push("El trailer es obligatorio");
  if (!data.pais) errors.push("El país es obligatorio");
  if (!data.imagenPortada) errors.push("La imagen de portada es obligatoria");
  
  if (errors.length > 0) {
    throw new Error(errors.join("\n"));
  }
};

// Helper: Enviar datos al servidor
const enviarDatosPelicula = async (pelicula) => {
  const response = await fetch("https://reelstormbackend.onrender.com/api/peliculas", {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Accept": "application/json"
    },
    body: JSON.stringify(pelicula)
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Error al guardar la película");
  }
  
  return await response.json();
};

// Helper: Manejar respuesta del servidor
const manejarRespuesta = (respuesta) => {
  const idPelicula = respuesta.id || respuesta._id || respuesta.peliculaId;
  if (!idPelicula) throw new Error("No se recibió un ID válido para la película");
  
  mostrarNotificacion("Película creada exitosamente!", "success");
  
  // Redirigir después de 1.5 segundos
  setTimeout(() => {
    window.location.href = `agregar_actores.html?peliculaId=${encodeURIComponent(idPelicula)}`;
  }, 1500);
};

// =======================
// UTILIDADES
// =======================
// Debounce para eventos de input
const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
};

// Mostrar notificaciones al usuario
const mostrarNotificacion = (mensaje, tipo = 'info') => {
  const colors = {
    success: '#10b981',
    error: '#e53935',
    info: '#3b82f6'
  };
  
  const notification = document.createElement('div');
  notification.style.position = 'fixed';
  notification.style.top = '20px';
  notification.style.right = '20px';
  notification.style.padding = '12px 24px';
  notification.style.background = colors[tipo] || colors.info;
  notification.style.color = 'white';
  notification.style.borderRadius = '4px';
  notification.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
  notification.style.zIndex = '1000';
  notification.style.animation = 'fadeIn 0.3s ease-out';
  notification.textContent = mensaje;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'fadeOut 0.3s ease-out';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
};

// =======================
// INICIALIZACIÓN
// =======================
document.addEventListener("DOMContentLoaded", () => {
  setupImagePreview();
  setupVideoPreview();
  setupThemeToggle();
  setupAniosEstreno();
  setupCalificacionValidation();
  setupFormulario();
  cargarPaises();
  
  // Agregar estilos para animaciones de notificación
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes fadeOut {
      from { opacity: 1; transform: translateY(0); }
      to { opacity: 0; transform: translateY(-20px); }
    }
  `;
  document.head.appendChild(style);
});