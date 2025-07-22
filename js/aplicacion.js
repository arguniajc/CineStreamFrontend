class CatalogoPeliculas {
  constructor() {
    // Configuración de APIs
    this.API_BASE_URL = "https://reelstormbackend.onrender.com/api";
    this.APIS = {
      peliculas: `${this.API_BASE_URL}/peliculas`,
      generos: `${this.API_BASE_URL}/genero`,
      peliculaGenero: `${this.API_BASE_URL}/pelicula-genero`,
      peliculaActor: `${this.API_BASE_URL}/pelicula-actor`,
      peliculaDirector: `${this.API_BASE_URL}/pelicula_director`,
      peliculaCompania: `${this.API_BASE_URL}/pelicula-compania`,
      peliculaIdioma: `${this.API_BASE_URL}/pelicula-idioma`
    };

    // Mapeo de elementos del DOM
    this.domElements = this.mapearElementosDOM();
    
    // Estado de la aplicación
    this.state = {
      peliculas: [],
      generos: [],
      relaciones: {
        generos: [],
        actores: [],
        directores: [],
        companias: [],
        idiomas: []
      },
      filtros: {
        genero: '',
        anio: '',
        calificacion: '',
        busqueda: '',
        orden: 'recientes',
        proximas: window.location.pathname.includes('proximos.html')
      },
      paginaActual: 1,
      peliculasPorPagina: 12,
      totalPaginas: 1,
      favoritos: JSON.parse(localStorage.getItem('favoritos')) || []
    };
    
    // Inicialización
    this.init();
  }

  // Mapear todos los elementos del DOM
  mapearElementosDOM() {
    return {
      listaPeliculas: document.getElementById("listaPeliculas"),
      searchInput: document.getElementById("searchInput"),
      searchBtn: document.getElementById("searchBtn"),
      genreFilter: document.getElementById("genreFilter"),
      yearFilter: document.getElementById("yearFilter"),
      ratingFilter: document.getElementById("ratingFilter"),
      sortBy: document.getElementById("sortBy"),
      resetFilters: document.getElementById("resetFilters"),
      resetFiltersEmpty: document.getElementById("resetFiltersEmpty"),
      loadingIndicator: document.getElementById("loadingIndicator"),
      noResults: document.getElementById("noResults"),
      pagination: document.getElementById("pagination"),
      modal: new bootstrap.Modal(document.getElementById('modalPelicula')),
      modalTitle: document.getElementById("modalTitle"),
      posterModal: document.getElementById("posterModal"),
      tituloOriginal: document.getElementById("tituloOriginal"),
      calificacionPelicula: document.getElementById("calificacionPelicula"),
      duracionPelicula: document.getElementById("duracionPelicula"),
      fechaEstrenoPelicula: document.getElementById("fechaEstrenoPelicula"),
      paisPelicula: document.getElementById("paisPelicula"),
      sinopsisPelicula: document.getElementById("sinopsisPelicula"),
      directorPelicula: document.getElementById("directorPelicula"),
      trailerPelicula: document.getElementById("trailerPelicula"),
      listaActores: document.getElementById("listaActores"),
      listaGeneros: document.getElementById("listaGeneros"),
      listaIdiomas: document.getElementById("listaIdiomas"),
      listaCompanias: document.getElementById("listaCompanias"),
      addToFavorites: document.getElementById("addToFavorites"),
      ratingStars: document.querySelector(".rating-stars")
    };
  }

  // Método de inicialización
  async init() {
    try {
      this.mostrarLoading(true);
      
      // Cargar datos en paralelo para mejor performance
      await Promise.all([
        this.cargarGeneros(),
        this.cargarPeliculas(),
        this.cargarRelaciones()
      ]);
      
      this.inicializarFiltros();
      this.configurarEventos();
      this.mostrarPeliculas();
      this.actualizarPaginacion();
    } catch (error) {
      console.error("Error inicializando catálogo:", error);
      this.mostrarError("Error al cargar el catálogo. Intenta recargar la página.");
    } finally {
      this.mostrarLoading(false);
    }
  }

  // Cargar todos los géneros disponibles
  async cargarGeneros() {
    const response = await fetch(this.APIS.generos);
    if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
    this.state.generos = await response.json();
  }

  // Cargar películas desde la API
  async cargarPeliculas() {
    const response = await fetch(this.APIS.peliculas);
    if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
    
    let peliculas = await response.json();
    
    // Filtrar películas próximas si es necesario
    if (this.state.filtros.proximas) {
      peliculas = peliculas.filter(p => this.esPeliculaProxima(p.fecha_estreno));
    }
    
    this.state.peliculas = this.ordenarPeliculas(peliculas, this.state.filtros.orden);
  }

  // Cargar todas las relaciones necesarias
  async cargarRelaciones() {
    const [generos, actores, directores, companias, idiomas] = await Promise.all([
      this.fetchRelacion(this.APIS.peliculaGenero),
      this.fetchRelacion(this.APIS.peliculaActor),
      this.fetchRelacion(this.APIS.peliculaDirector),
      this.fetchRelacion(this.APIS.peliculaCompania),
      this.fetchRelacion(this.APIS.peliculaIdioma)
    ]);
    
    this.state.relaciones = { generos, actores, directores, companias, idiomas };
  }

  // Función auxiliar para cargar relaciones
  async fetchRelacion(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Error HTTP: ${response.status} para ${url}`);
    return await response.json();
  }

  // Verificar si una película es próxima (fecha de estreno futura)
  esPeliculaProxima(fechaEstreno) {
    if (!fechaEstreno) return false;
    const hoy = new Date();
    const fechaEstrenoDate = new Date(fechaEstreno);
    return fechaEstrenoDate > hoy;
  }

  // Ordenar películas según criterio
  ordenarPeliculas(peliculas, criterio) {
    const peliculasOrdenadas = [...peliculas];
    
    switch(criterio) {
      case 'antiguos':
        return peliculasOrdenadas.sort((a, b) => a.ano_estreno - b.ano_estreno);
      case 'mejor':
        return peliculasOrdenadas.sort((a, b) => (b.calificacion || 0) - (a.calificacion || 0));
      case 'peor':
        return peliculasOrdenadas.sort((a, b) => (a.calificacion || 10) - (b.calificacion || 10));
      case 'recientes':
      default:
        return peliculasOrdenadas.sort((a, b) => b.ano_estreno - a.ano_estreno);
    }
  }

  // Mostrar películas en el grid
  mostrarPeliculas() {
    this.domElements.listaPeliculas.innerHTML = '';
    
    const peliculasFiltradas = this.filtrarPeliculas();
    this.state.totalPaginas = Math.ceil(peliculasFiltradas.length / this.state.peliculasPorPagina);
    
    if (peliculasFiltradas.length === 0) {
      this.domElements.noResults.classList.remove('d-none');
      this.domElements.pagination.classList.add('d-none');
      return;
    }
    
    this.domElements.noResults.classList.add('d-none');
    this.domElements.pagination.classList.remove('d-none');

    const peliculasPagina = this.paginarPeliculas(peliculasFiltradas);

    peliculasPagina.forEach((pelicula, index) => {
      const movieCard = this.crearTarjetaPelicula(pelicula, index);
      this.domElements.listaPeliculas.appendChild(movieCard);
    });
  }

  // Crear tarjeta de película individual
  crearTarjetaPelicula(pelicula, index) {
    const movieCard = document.createElement("div");
    movieCard.className = "col";
    movieCard.innerHTML = `
      <div class="movie-card h-100" data-id="${pelicula.id}" style="animation-delay: ${index * 0.1}s">
        <img src="${pelicula.imagen_portada || '../img/poster-placeholder.jpg'}" 
             alt="${pelicula.titulo_espanol}" 
             class="movie-poster img-fluid rounded-top">
        <div class="movie-info p-3">
          <h4 class="movie-title h5 mb-2">${pelicula.titulo_espanol}</h4>
          <p class="movie-year text-muted small mb-0">${pelicula.ano_estreno}</p>
          ${this.state.filtros.proximas && pelicula.fecha_estreno ? 
            `<p class="text-warning small mt-1"><i class="fas fa-calendar-alt me-1"></i>Estreno: ${new Date(pelicula.fecha_estreno).toLocaleDateString()}</p>` : ''}
        </div>
        ${pelicula.calificacion ? `
          <div class="movie-rating">
            <i class="fas fa-star"></i>
            <span>${parseFloat(pelicula.calificacion).toFixed(1)}</span>
          </div>
        ` : ''}
      </div>
    `;

    movieCard.querySelector('.movie-card').addEventListener("click", () => this.abrirModalPelicula(pelicula.id));
    return movieCard;
  }

  // Filtrar películas según criterios
  filtrarPeliculas() {
    const { genero, anio, calificacion, busqueda } = this.state.filtros;
    
    return this.state.peliculas.filter(pelicula => {
      // Filtro por búsqueda
      if (busqueda && 
          !pelicula.titulo_espanol.toLowerCase().includes(busqueda) && 
          !pelicula.titulo_original?.toLowerCase().includes(busqueda)) {
        return false;
      }
      
      // Filtro por género
      if (genero) {
        const tieneGenero = this.state.relaciones.generos.some(
          rel => rel.id_pelicula == pelicula.id && rel.id_genero.toString() === genero
        );
        if (!tieneGenero) return false;
      }
      
      // Filtro por año
      if (anio && pelicula.ano_estreno !== parseInt(anio)) {
        return false;
      }
      
      // Filtro por calificación
      if (calificacion && (!pelicula.calificacion || parseFloat(pelicula.calificacion) < parseFloat(calificacion))) {
        return false;
      }
      
      return true;
    });
  }

  // Paginar resultados
  paginarPeliculas(peliculas) {
    const inicio = (this.state.paginaActual - 1) * this.state.peliculasPorPagina;
    const fin = inicio + this.state.peliculasPorPagina;
    return peliculas.slice(inicio, fin);
  }

  // Inicializar controles de filtro
  inicializarFiltros() {
    // Llenar filtro de géneros
    this.domElements.genreFilter.innerHTML = '<option value="">Todos los géneros</option>';
    this.state.generos.forEach(genero => {
      const option = document.createElement('option');
      option.value = genero.id;
      option.textContent = genero.nombre;
      this.domElements.genreFilter.appendChild(option);
    });
    
    // Extraer años únicos de las películas
    const años = [...new Set(this.state.peliculas.map(p => p.ano_estreno))].sort((a, b) => b - a);
    this.domElements.yearFilter.innerHTML = '<option value="">Todos los años</option>';
    años.forEach(anio => {
      const option = document.createElement('option');
      option.value = anio;
      option.textContent = anio;
      this.domElements.yearFilter.appendChild(option);
    });
  }

  // Configurar eventos
  configurarEventos() {
    // Buscador
    this.domElements.searchBtn.addEventListener('click', () => this.aplicarFiltros());
    this.domElements.searchInput.addEventListener('keyup', (e) => {
      if (e.key === 'Enter') this.aplicarFiltros();
    });
    
    // Filtros
    this.domElements.genreFilter.addEventListener('change', (e) => {
      this.state.filtros.genero = e.target.value;
      this.aplicarFiltros();
    });
    
    this.domElements.yearFilter.addEventListener('change', (e) => {
      this.state.filtros.anio = e.target.value;
      this.aplicarFiltros();
    });
    
    this.domElements.ratingFilter.addEventListener('change', (e) => {
      this.state.filtros.calificacion = e.target.value;
      this.aplicarFiltros();
    });
    
    this.domElements.sortBy.addEventListener('change', (e) => {
      this.state.filtros.orden = e.target.value;
      this.state.peliculas = this.ordenarPeliculas(this.state.peliculas, e.target.value);
      this.aplicarFiltros();
    });
    
    // Reset
    this.domElements.resetFilters.addEventListener('click', () => this.reiniciarFiltros());
    this.domElements.resetFiltersEmpty.addEventListener('click', () => this.reiniciarFiltros());
    
    // Favoritos
    this.domElements.addToFavorites.addEventListener('click', () => this.toggleFavorito());
  }

  // Aplicar filtros
  aplicarFiltros() {
    this.state.filtros.busqueda = this.domElements.searchInput.value.trim().toLowerCase();
    this.state.paginaActual = 1;
    this.mostrarPeliculas();
    this.actualizarPaginacion();
  }

  // Reiniciar filtros
  reiniciarFiltros() {
    this.domElements.searchInput.value = '';
    this.domElements.genreFilter.value = '';
    this.domElements.yearFilter.value = '';
    this.domElements.ratingFilter.value = '';
    this.domElements.sortBy.value = 'recientes';
    
    this.state.filtros = {
      ...this.state.filtros,
      genero: '',
      anio: '',
      calificacion: '',
      busqueda: '',
      orden: 'recientes'
    };
    
    this.state.peliculas = this.ordenarPeliculas(this.state.peliculas, 'recientes');
    this.aplicarFiltros();
  }

  // Actualizar controles de paginación
  actualizarPaginacion() {
    this.domElements.pagination.innerHTML = '';
    
    if (this.state.totalPaginas <= 1) {
      this.domElements.pagination.classList.add('d-none');
      return;
    }
    
    this.domElements.pagination.classList.remove('d-none');
    const ul = document.createElement('ul');
    ul.className = 'pagination';
    
    // Botón Anterior
    const liPrev = document.createElement('li');
    liPrev.className = `page-item ${this.state.paginaActual === 1 ? 'disabled' : ''}`;
    liPrev.innerHTML = `<a class="page-link" href="#" aria-label="Anterior">&laquo;</a>`;
    liPrev.addEventListener('click', (e) => {
      e.preventDefault();
      if (this.state.paginaActual > 1) {
        this.state.paginaActual--;
        this.mostrarPeliculas();
        this.actualizarPaginacion();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
    ul.appendChild(liPrev);
    
    // Números de página
    const paginasMostradas = 5;
    let inicio = Math.max(1, this.state.paginaActual - Math.floor(paginasMostradas / 2));
    let fin = Math.min(this.state.totalPaginas, inicio + paginasMostradas - 1);
    
    if (fin - inicio + 1 < paginasMostradas) {
      inicio = Math.max(1, fin - paginasMostradas + 1);
    }
    
    for (let i = inicio; i <= fin; i++) {
      const li = document.createElement('li');
      li.className = `page-item ${i === this.state.paginaActual ? 'active' : ''}`;
      li.innerHTML = `<a class="page-link" href="#">${i}</a>`;
      li.addEventListener('click', (e) => {
        e.preventDefault();
        this.state.paginaActual = i;
        this.mostrarPeliculas();
        this.actualizarPaginacion();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
      ul.appendChild(li);
    }
    
    // Botón Siguiente
    const liNext = document.createElement('li');
    liNext.className = `page-item ${this.state.paginaActual === this.state.totalPaginas ? 'disabled' : ''}`;
    liNext.innerHTML = `<a class="page-link" href="#" aria-label="Siguiente">&raquo;</a>`;
    liNext.addEventListener('click', (e) => {
      e.preventDefault();
      if (this.state.paginaActual < this.state.totalPaginas) {
        this.state.paginaActual++;
        this.mostrarPeliculas();
        this.actualizarPaginacion();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
    ul.appendChild(liNext);
    
    this.domElements.pagination.appendChild(ul);
  }

  // Mostrar/ocultar loading
  mostrarLoading(mostrar) {
    if (mostrar) {
      this.domElements.loadingIndicator.classList.remove('d-none');
      this.domElements.listaPeliculas.classList.add('d-none');
    } else {
      this.domElements.loadingIndicator.classList.add('d-none');
      this.domElements.listaPeliculas.classList.remove('d-none');
    }
  }

  // Mostrar error
  mostrarError(mensaje) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'alert alert-danger text-center';
    errorDiv.innerHTML = `
      <i class="fas fa-exclamation-triangle me-2"></i>
      ${mensaje}
    `;
    this.domElements.listaPeliculas.innerHTML = '';
    this.domElements.listaPeliculas.appendChild(errorDiv);
  }

  // Abrir modal con detalles de película
  async abrirModalPelicula(idPelicula) {
    try {
      this.resetModal();
      
      const pelicula = this.state.peliculas.find(p => p.id == idPelicula);
      if (!pelicula) throw new Error("Película no encontrada");

      // Llenar datos básicos
      this.domElements.modalTitle.textContent = pelicula.titulo_espanol;
      this.domElements.tituloOriginal.textContent = pelicula.titulo_original || "No disponible";
      this.domElements.calificacionPelicula.textContent = pelicula.calificacion || "No disponible";
      this.domElements.duracionPelicula.textContent = pelicula.duracion ? `${pelicula.duracion} min` : "No disponible";
      this.domElements.fechaEstrenoPelicula.textContent = pelicula.fecha_estreno || "No disponible";
      this.domElements.paisPelicula.textContent = pelicula.pais || "No disponible";
      this.domElements.sinopsisPelicula.textContent = pelicula.sinopsis || "Sin sinopsis disponible";
      this.domElements.posterModal.src = pelicula.imagen_portada || '../img/poster-placeholder.jpg';
      this.domElements.posterModal.alt = pelicula.titulo_espanol;

      // Director (usando relaciones)
      const directoresPelicula = this.state.relaciones.directores
        .filter(rel => rel.id_pelicula == idPelicula);
      
      if (directoresPelicula.length > 0) {
        const director = directoresPelicula[0];
        this.domElements.directorPelicula.innerHTML = `
          <div class="d-flex align-items-center">
            ${director.imagen_director ? 
              `<img src="${director.imagen_director}" alt="${director.nombre_director}" 
                    class="rounded-circle me-2" width="40" height="40">` : 
              '<i class="fas fa-user-circle me-2" style="font-size: 40px;"></i>'}
            <span>${director.nombre_director}</span>
          </div>
        `;
      } else {
        this.domElements.directorPelicula.textContent = "No disponible";
      }

      // Calificación con estrellas
      if (pelicula.calificacion) {
        const rating = parseFloat(pelicula.calificacion) / 2;
        this.domElements.ratingStars.innerHTML = '';
        
        for (let i = 0; i < 5; i++) {
          const star = document.createElement('i');
          star.className = i < Math.floor(rating)
            ? 'fas fa-star'
            : (i < Math.ceil(rating) ? 'fas fa-star-half-alt' : 'far fa-star');
          this.domElements.ratingStars.appendChild(star);
        }
      }

      // Trailer
      if (pelicula.trailer_url) {
        let trailerUrl = pelicula.trailer_url;
        if (trailerUrl.includes("watch?v=")) {
          trailerUrl = trailerUrl.replace("watch?v=", "embed/");
        }
        this.domElements.trailerPelicula.src = trailerUrl;
      }

      // Géneros (usando relaciones)
      const generosPelicula = this.state.relaciones.generos
        .filter(rel => rel.id_pelicula == idPelicula)
        .map(rel => rel.nombre_genero)
        .filter(Boolean);

      if (generosPelicula.length > 0) {
        this.domElements.listaGeneros.innerHTML = '';
        generosPelicula.forEach(nombreGenero => {
          const badge = document.createElement('span');
          badge.className = 'badge bg-primary me-1 mb-1';
          badge.textContent = nombreGenero;
          this.domElements.listaGeneros.appendChild(badge);
        });
      }

      // Idiomas (usando relaciones)
      const idiomasPelicula = this.state.relaciones.idiomas
        .filter(rel => rel.id_pelicula == idPelicula)
        .map(rel => rel.nombre_idioma)
        .filter(Boolean);

      if (idiomasPelicula.length > 0) {
        this.domElements.listaIdiomas.innerHTML = '';
        idiomasPelicula.forEach(nombreIdioma => {
          const badge = document.createElement('span');
          badge.className = 'badge bg-secondary me-1 mb-1';
          badge.textContent = nombreIdioma;
          this.domElements.listaIdiomas.appendChild(badge);
        });
      }

      // Compañías (usando relaciones)
      const companiasPelicula = this.state.relaciones.companias
        .filter(rel => rel.id_pelicula == idPelicula)
        .map(rel => ({
          nombre: rel.nombre_compania,
          logo: rel.logo_compania
        }))
        .filter(rel => rel.nombre);

      if (companiasPelicula.length > 0) {
        this.domElements.listaCompanias.innerHTML = '';
        companiasPelicula.forEach(compania => {
          const item = document.createElement('div');
          item.className = 'd-flex align-items-center mb-2';
          item.innerHTML = `
            ${compania.logo ? 
              `<img src="${compania.logo}" alt="${compania.nombre}" class="me-2" width="30" height="30">` : 
              '<i class="fas fa-building me-2"></i>'}
            <span>${compania.nombre}</span>
          `;
          this.domElements.listaCompanias.appendChild(item);
        });
      }

    // Actores (usando relaciones)
    const actoresPelicula = this.state.relaciones.actores
    .filter(rel => rel.id_pelicula == idPelicula)
    .map(rel => ({
        nombre: rel.actor?.nombre || 'Nombre no disponible',
        personaje: rel.personaje || 'Personaje no disponible',
        imagen: rel.actor?.imagen_url || null
    }));

    if (actoresPelicula.length > 0) {
    this.domElements.listaActores.innerHTML = '';
    actoresPelicula.forEach(actor => {
        const item = document.createElement('div');
        item.className = 'list-group-item bg-transparent text-white border-secondary';
        item.innerHTML = `
        <div class="d-flex align-items-center">
            ${actor.imagen ? 
            `<img src="${actor.imagen}" alt="${actor.nombre}" 
                    class="rounded-circle me-3" width="40" height="40">` : 
            '<i class="fas fa-user-circle me-3" style="font-size: 40px;"></i>'}
            <div>
            <strong>${actor.nombre}</strong>
            ${actor.personaje ? `<small class="d-block text-muted">${actor.personaje}</small>` : ''}
            </div>
        </div>
        `;
        this.domElements.listaActores.appendChild(item);
    });
    } else {
    this.domElements.listaActores.innerHTML = `
        <div class="list-group-item bg-transparent text-white border-secondary">
        No hay información de reparto disponible
        </div>
    `;
    }

      // Actualizar botón de favoritos
      this.actualizarBotonFavorito(pelicula.id);

      // Mostrar modal
      this.domElements.modal.show();

    } catch (error) {
      console.error("Error al abrir modal:", error);
      this.mostrarError("Error al cargar detalles de la película");
    }
  }

  // Resetear contenido del modal
  resetModal() {
    this.domElements.modalTitle.textContent = '';
    this.domElements.tituloOriginal.textContent = '';
    this.domElements.calificacionPelicula.textContent = '';
    this.domElements.duracionPelicula.textContent = '';
    this.domElements.fechaEstrenoPelicula.textContent = '';
    this.domElements.paisPelicula.textContent = '';
    this.domElements.sinopsisPelicula.textContent = '';
    this.domElements.directorPelicula.innerHTML = '';
    this.domElements.posterModal.src = '';
    this.domElements.posterModal.alt = '';
    this.domElements.trailerPelicula.src = '';
    this.domElements.ratingStars.innerHTML = '';
    this.domElements.listaActores.innerHTML = '';
    this.domElements.listaGeneros.innerHTML = '';
    this.domElements.listaIdiomas.innerHTML = '';
    this.domElements.listaCompanias.innerHTML = '';
  }

  // Actualizar estado del botón de favoritos
  actualizarBotonFavorito(idPelicula) {
    const esFavorito = this.state.favoritos.includes(idPelicula);
    this.domElements.addToFavorites.innerHTML = `
      <i class="fas ${esFavorito ? 'fa-heart-broken' : 'fa-heart'} me-1"></i> 
      ${esFavorito ? 'Quitar de' : 'Agregar a'} Favoritos
    `;
    this.domElements.addToFavorites.className = esFavorito 
      ? 'btn btn-outline-danger' 
      : 'btn btn-primary';
  }

  // Toggle favorito
  toggleFavorito() {
    const idPelicula = this.state.peliculas.find(p => 
      p.titulo_espanol === this.domElements.modalTitle.textContent
    )?.id;
    
    if (!idPelicula) return;

    const index = this.state.favoritos.indexOf(idPelicula);
    if (index === -1) {
      this.state.favoritos.push(idPelicula);
    } else {
      this.state.favoritos.splice(index, 1);
    }

    localStorage.setItem('favoritos', JSON.stringify(this.state.favoritos));
    this.actualizarBotonFavorito(idPelicula);
  }
}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  new CatalogoPeliculas();
});