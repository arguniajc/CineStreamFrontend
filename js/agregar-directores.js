    const urlParams = new URLSearchParams(window.location.search);
    const peliculaId = urlParams.get("peliculaId");
    if (!peliculaId) {
    alert("❌ No se proporcionó el ID de la película en la URL. Redirigiendo...");
    window.location.href = "crud_peliculas.html"; // o a donde quieras volver
    }

    const directorSelect = document.getElementById("directorSelect");
    const listaDirectores = document.getElementById("listaDirectores");
    const mensaje = document.getElementById("mensaje");
    const directoresCargados = {};

    async function cargarDirectores() {
      try {
        const response = await fetch("https://reelstormbackend.onrender.com/api/directores");
        const directores = await response.json();

        directores.forEach(director => {
          directoresCargados[director.id] = director;
          const option = document.createElement("option");
          option.value = director.id;
          option.textContent = director.nombre;
          directorSelect.appendChild(option);
        });
      } catch (err) {
        mostrarError(`⚠️ Error cargando directores: ${err.message}`);
      }
    }

    async function cargarDirectoresDePelicula() {
      try {
        const response = await fetch("https://reelstormbackend.onrender.com/api/pelicula_director");
        const datos = await response.json();

        const relacionados = datos.filter(item => item.id_pelicula == peliculaId);
        
        listaDirectores.innerHTML = "";

        if (relacionados.length === 0) {
          listaDirectores.innerHTML = '<p class="empty-message">No hay directores asociados a esta película.</p>';
          return;
        }

        relacionados.forEach(item => {
          const card = document.createElement("div");
          card.className = "director-card";

          const directorInfo = directoresCargados[item.id_director] || {};
          const imagen = directorInfo.imagen_url || "https://via.placeholder.com/300x250/1f2937/9ca3af?text=Sin+Imagen";

          card.innerHTML = `
            <img src="${imagen}" alt="${directorInfo.nombre || 'Director'}">
            <div class="director-card-content">
              <h4>${directorInfo.nombre || 'Nombre desconocido'}</h4>
            </div>
          `;

          listaDirectores.appendChild(card);
        });

      } catch (err) {
        mostrarError(`⚠️ Error al cargar directores de la película: ${err.message}`);
      }
    }

    function mostrarError(texto) {
      mensaje.innerHTML = `<div class="error">${texto}</div>`;
    }

    function mostrarExito(texto) {
      mensaje.innerHTML = `<div class="success">${texto}</div>`;
    }

    document.getElementById("btnAgregarDirector").addEventListener("click", async () => {
      const directorId = directorSelect.value;

      if (!peliculaId || !directorId) {
        mostrarError("❌ Debes seleccionar un director válido.");
        return;
      }

      const yaExiste = [...document.querySelectorAll(".director-card h4")].some(
        el => el.textContent === directoresCargados[directorId].nombre
      );
      
      if (yaExiste) {
        mostrarError("⚠️ Este director ya está asociado a la película.");
        return;
      }

      const payload = {
        id_pelicula: parseInt(peliculaId),
        id_director: parseInt(directorId)
      };

      try {
        const response = await fetch("https://reelstormbackend.onrender.com/api/pelicula_director/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (!response.ok) {
          mostrarError(`❌ Error: ${result.error || 'Error inesperado.'}`);
          return;
        }

        mostrarExito("✅ Director agregado correctamente.");
        await cargarDirectoresDePelicula();
        directorSelect.value = "";
      } catch (err) {
        mostrarError(`⚠️ Error al agregar director: ${err.message}`);
      }
    });

    document.getElementById("btnSiguiente").addEventListener("click", () => {
      if (peliculaId) {
        window.location.href = `agregar-companias.html?peliculaId=${peliculaId}`;
      } else {
        mostrarError("⚠️ No se encontró el ID de la película para continuar.");
      }
    });

    if (peliculaId) {
      cargarDirectores().then(() => cargarDirectoresDePelicula());
    } else {
      mostrarError("❌ No se proporcionó el ID de la película en la URL.");
    }
