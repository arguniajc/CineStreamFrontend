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
  
  // Selectores de formulario
  selectPais: document.getElementById("pais"),
  selectAnio: document.getElementById("ano_estreno"),
  calificacionInput: document.getElementById("calificacion"),
  formPelicula: document.getElementById("formPelicula"),
  
  // Elementos de UI
  btnSubmit: document.querySelector('#formPelicula button[type="submit"]')
};

// =======================
// UTILIDADES
// =======================
const Utils = {
  // Debounce para eventos de input
  debounce: (func, wait) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  },

  // Formatear fecha a YYYY-MM-DD
  formatDate: (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  // Extraer ID de YouTube
  extractYouTubeId: (url) => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/,
      /(?:youtube\.com\/embed\/)([\w-]{11})/,
      /(?:youtube\.com\/v\/)([\w-]{11})/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  }
};

// =======================
// MANEJO DE NOTIFICACIONES
// =======================
const Notificaciones = {
  mostrar: (mensaje, tipo = 'info') => {
    const colors = {
      success: '#10b981',
      error: '#e53935',
      info: '#3b82f6',
      warning: '#f59e0b'
    };
    
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.style.backgroundColor = colors[tipo] || colors.info;
    notification.innerHTML = `
      <i class="fas ${tipo === 'success' ? 'fa-check-circle' : tipo === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
      <span>${mensaje}</span>
    `;
    
    document.body.appendChild(notification);
    
    // Mostrar notificación
    setTimeout(() => {
      notification.classList.add('show');
    }, 10);
    
    // Ocultar después de 3 segundos
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  },

  init: () => {
    const style = document.createElement('style');
    style.textContent = `
      .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 24px;
        color: white;
        border-radius: 4px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        z-index: 1000;
        display: flex;
        align-items: center;
        gap: 12px;
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s ease;
      }
      
      .notification.show {
        opacity: 1;
        transform: translateX(0);
      }
      
      .notification i {
        font-size: 1.2em;
      }
    `;
    document.head.appendChild(style);
  }
};

// =======================
// VISTA PREVIA DE IMAGEN
// =======================
const ImagePreview = {
  init: () => {
    DOM.imagenPortada.addEventListener('input', Utils.debounce(() => {
      const url = DOM.imagenPortada.value.trim();
      
      if (!url) {
        DOM.contenedorPreview.style.display = 'none';
        return;
      }

      // Crear imagen temporal para verificar si es válida
      const tempImg = new Image();
      tempImg.src = url;
      
      tempImg.onload = () => {
        DOM.vistaPrevia.src = url;
        DOM.contenedorPreview.style.display = 'block';
        DOM.vistaPrevia.style.display = 'block';
      };

      tempImg.onerror = () => {
        DOM.contenedorPreview.style.display = 'none';
        Notificaciones.mostrar('La URL de la imagen no es válida', 'warning');
      };
    }, 500));
  }
};

// =======================
// VISTA PREVIA DE VIDEO
// =======================
const VideoPreview = {
  init: () => {
    DOM.inputTrailer.addEventListener('input', Utils.debounce(() => {
      const url = DOM.inputTrailer.value.trim();
      const videoId = Utils.extractYouTubeId(url);
      
      if (videoId) {
        DOM.vistaVideo.src = `https://www.youtube.com/embed/${videoId}?rel=0&showinfo=0`;
        DOM.contenedorVideo.style.display = 'block';
      } else {
        DOM.vistaVideo.src = '';
        DOM.contenedorVideo.style.display = 'none';
        if (url) {
          Notificaciones.mostrar('URL de YouTube no válida', 'warning');
        }
      }
    }, 500));
  }
};

// =======================
// MANEJO DE PAÍSES
// =======================
const Paises = {
  cargar: async () => {
    try {
      // Mostrar estado de carga
      DOM.selectPais.innerHTML = '<option value="">Cargando países...</option>';
      DOM.selectPais.disabled = true;
      
      // Intentar cargar desde la API
      const response = await fetch("https://restcountries.com/v3.1/all?fields=translations,cca2,name,flags");
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      
      const data = await response.json();

      if (!data || !Array.isArray(data)) {
        throw new Error("Datos de países no recibidos correctamente");
      }

      const paisesOrdenados = data
        .map(p => ({
          nombre: p.translations?.spa?.common || p.name.common,
          codigo: p.cca2,
          bandera: p.flags?.png
        }))
        .filter(p => p.nombre && p.codigo)
        .sort((a, b) => a.nombre.localeCompare(b.nombre));

      // Limpiar select
      DOM.selectPais.innerHTML = '<option value="">Seleccione un país</option>';
      
      // Agregar opciones
      paisesOrdenados.forEach(pais => {
        const option = document.createElement("option");
        option.value = pais.codigo;
        option.textContent = pais.nombre;
        option.dataset.bandera = pais.bandera;
        DOM.selectPais.appendChild(option);
      });
      
      DOM.selectPais.disabled = false;
      
    } catch (error) {
      console.error("Error cargando países:", error);
      Notificaciones.mostrar("No se pudieron cargar los países. Usando lista local.", "error");
      Paises.cargarRespaldo();
    }
  },
  
  cargarRespaldo: () => {
    const paisesRespaldo = [
      {codigo: "US", nombre: "Estados Unidos"},
      {codigo: "MX", nombre: "México"},
      {codigo: "ES", nombre: "España"},
      {codigo: "AR", nombre: "Argentina"},
      {codigo: "CO", nombre: "Colombia"},
      {codigo: "FR", nombre: "Francia"},
      {codigo: "IT", nombre: "Italia"},
      {codigo: "JP", nombre: "Japón"},
      {codigo: "GB", nombre: "Reino Unido"},
      {codigo: "DE", nombre: "Alemania"}
    ];
    
    DOM.selectPais.innerHTML = '<option value="">Seleccione un país</option>';
    paisesRespaldo.forEach(pais => {
      const option = document.createElement("option");
      option.value = pais.codigo;
      option.textContent = pais.nombre;
      DOM.selectPais.appendChild(option);
    });
    DOM.selectPais.disabled = false;
  }
};

// =======================
// MANEJO DE AÑOS
// =======================
const AniosEstreno = {
  init: () => {
    const currentYear = new Date().getFullYear();
    const startYear = 1900;
    
    // Limpiar select
    DOM.selectAnio.innerHTML = '<option value="">Seleccione un año</option>';
    
    // Agregar opciones
    for (let anio = currentYear + 5; anio >= startYear; anio--) {
      const option = document.createElement("option");
      option.value = anio;
      option.textContent = anio;
      DOM.selectAnio.appendChild(option);
    }
    
    // Establecer año actual como predeterminado
    DOM.selectAnio.value = currentYear;
  }
};

// =======================
// VALIDACIÓN DE FORMULARIO
// =======================
const Validacion = {
  // Validar campo individual
  validarCampo: (campo) => {
    const valor = campo.value.trim();
    const grupo = campo.closest('.form-group');
    const mensajeError = grupo?.querySelector('.error-message');
    
    if (!grupo || !mensajeError) return true;
    
    // Limpiar estado anterior
    grupo.classList.remove('valido', 'invalido');
    mensajeError.style.display = 'none';
    
    // Validar según el tipo de campo
    let valido = true;
    let mensaje = '';
    
    if (campo.required && !valor) {
      valido = false;
      mensaje = 'Este campo es obligatorio';
    } else if (campo.type === 'number') {
      const min = parseFloat(campo.min);
      const max = parseFloat(campo.max);
      const numValor = parseFloat(valor);
      
      if (isNaN(numValor)) {
        valido = false;
        mensaje = 'Debe ser un número válido';
      } else if (!isNaN(min) && numValor < min) {
        valido = false;
        mensaje = `El valor mínimo es ${min}`;
      } else if (!isNaN(max) && numValor > max) {
        valido = false;
        mensaje = `El valor máximo es ${max}`;
      }
    } else if (campo.type === 'url' && valor) {
      try {
        new URL(valor);
      } catch {
        valido = false;
        mensaje = 'URL no válida';
      }
    } else if (campo.id === 'fecha_estreno' && valor) {
      const fecha = new Date(valor);
      const hoy = new Date();
      
      if (fecha > hoy) {
        valido = false;
        mensaje = 'La fecha no puede ser futura';
      }
    }
    
    // Aplicar estilos y mensajes
    if (!valido) {
      grupo.classList.add('invalido');
      mensajeError.textContent = mensaje;
      mensajeError.style.display = 'block';
    } else {
      grupo.classList.add('valido');
    }
    
    return valido;
  },
  
  // Validar todo el formulario
  validarFormulario: () => {
    let valido = true;
    const campos = DOM.formPelicula.querySelectorAll('input, select, textarea[required]');
    
    campos.forEach(campo => {
      if (!Validacion.validarCampo(campo)) {
        valido = false;
      }
    });
    
    return valido;
  },
  
  // Inicializar validaciones
  init: () => {
    // Validar al cambiar campos
    DOM.formPelicula.querySelectorAll('input, select, textarea').forEach(campo => {
      campo.addEventListener('blur', () => Validacion.validarCampo(campo));
    });
    
    // Validación especial para calificación
    DOM.calificacionInput.addEventListener('input', () => {
      let valor = parseFloat(DOM.calificacionInput.value);
      
      if (isNaN(valor)) {
        DOM.calificacionInput.value = '';
        return;
      }
      
      // Asegurar que esté entre 1 y 10 con un decimal
      valor = Math.min(Math.max(valor, 1), 10);
      DOM.calificacionInput.value = valor.toFixed(1);
    });
  }
};

// =======================
// MANEJO DEL FORMULARIO
// =======================
const Formulario = {
  // Obtener datos del formulario
  obtenerDatos: () => {
  const getValue = (id) => {
    const element = document.getElementById(id);
    return element ? element.value.trim() : '';
  };

  return {
    titulo_espanol: getValue("titulo_espanol"),
    titulo_original: getValue("titulo_original"),
    ano_estreno: parseInt(getValue("ano_estreno")),
    duracion_minutos: parseInt(getValue("duracion_minutos")),
    calificacion: parseFloat(getValue("calificacion")),
    fecha_estreno: getValue("fecha_estreno"),
    sinopsis: getValue("sinopsis"),
    trailer_url: getValue("trailer_url"),
    pais_id: getValue("pais"), // Asegúrate que el backend espera un string tipo "US" o convierte al ID correspondiente
    imagen_portada: getValue("imagen_portada")
  };
},

  
  // Enviar datos al servidor
  enviarDatos: async (datos) => {
    const response = await fetch("https://reelstormbackend.onrender.com/api/peliculas", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(datos)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Error al guardar la película");
    }
    
    return await response.json();
  },
  
  // Manejar envío del formulario
  manejarSubmit: async (e) => {
    e.preventDefault();
    
    if (!Validacion.validarFormulario()) {
      Notificaciones.mostrar("Por favor, complete todos los campos correctamente", "error");
      return;
    }
    
    // Mostrar loader
    const originalBtnText = DOM.btnSubmit.innerHTML;
    DOM.btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
    DOM.btnSubmit.disabled = true;
    
    try {
      const formData = Formulario.obtenerDatos();
      const respuesta = await Formulario.enviarDatos(formData);
      
      Notificaciones.mostrar("Película creada exitosamente!", "success");
      
      // Redirigir después de 1.5 segundos
      setTimeout(() => {
        const idPelicula = respuesta.id || respuesta._id || respuesta.peliculaId;
        if (idPelicula) {
         window.location.href = `/html/agregar_actores.html?peliculaId=${encodeURIComponent(idPelicula)}`;
        } else {
          Notificaciones.mostrar("No se recibió ID de película", "error");
        }
      }, 1500);
      
    } catch (error) {
      console.error("Error al enviar el formulario:", error);
      Notificaciones.mostrar(error.message || "Error al guardar la película", "error");
    } finally {
      DOM.btnSubmit.innerHTML = originalBtnText;
      DOM.btnSubmit.disabled = false;
    }
  },
  
  // Inicializar formulario
  init: () => {
    DOM.formPelicula.addEventListener("submit", Formulario.manejarSubmit);
  }
};

// =======================
// INICIALIZACIÓN
// =======================
document.addEventListener("DOMContentLoaded", async () => {
  // Inicializar notificaciones
  Notificaciones.init();
  
  // Inicializar componentes
  ImagePreview.init();
  VideoPreview.init();
  Validacion.init();
  Formulario.init();
  AniosEstreno.init();
  
  // Cargar países (puede ser asíncrono)
  await Paises.cargar();
  
  // Establecer fecha actual como predeterminada
  const fechaInput = document.getElementById('fecha_estreno');
  if (fechaInput) {
    fechaInput.value = Utils.formatDate(new Date());
  }
});