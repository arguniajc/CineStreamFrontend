
    const urlParams = new URLSearchParams(window.location.search);
    const idPelicula = parseInt(urlParams.get("peliculaId"));

    const selectCompania = document.getElementById("selectCompania");
    const listaCompanias = document.getElementById("listaCompanias");
    const mensaje = document.getElementById("mensaje");
    const companiasCargadas = {};

    async function cargarCompanias() {
      try {
        const res = await fetch("https://reelstormbackend.onrender.com/api/compania");
        const data = await res.json();

        data.forEach(compania => {
          companiasCargadas[compania.id] = compania;
          const option = document.createElement("option");
          option.value = compania.id;
          option.textContent = compania.nombre;
          selectCompania.appendChild(option);
        });
      } catch (error) {
        mostrarError(`⚠️ Error cargando compañías: ${error.message}`);
      }
    }

    async function mostrarCompaniasAsignadas() {
      try {
        const res = await fetch("https://reelstormbackend.onrender.com/api/pelicula-compania");
        const data = await res.json();
        
        listaCompanias.innerHTML = "";

        const asignadas = data.filter(item => item.id_pelicula === idPelicula);

        if (asignadas.length === 0) {
          listaCompanias.innerHTML = '<p class="empty-message">No hay compañías asociadas a esta película.</p>';
          return;
        }

        asignadas.forEach(item => {
          const card = document.createElement("div");
          card.className = "compania-card";

          const companiaInfo = companiasCargadas[item.id_compania] || {};
          const logo = companiaInfo.logo_url || "https://via.placeholder.com/300x120/1f2937/9ca3af?text=Sin+Logo";

          card.innerHTML = `
            <img src="${logo}" alt="${companiaInfo.nombre || 'Compañía'}">
            <div class="compania-card-content">
              <h4>${companiaInfo.nombre || 'Nombre desconocido'}</h4>
              <p>${item.titulo_pelicula || ''}</p>
            </div>
          `;

          listaCompanias.appendChild(card);
        });
      } catch (error) {
        mostrarError(`⚠️ Error al mostrar compañías: ${error.message}`);
      }
    }

    function mostrarError(texto) {
      mensaje.innerHTML = `<div class="error">${texto}</div>`;
    }

    function mostrarExito(texto) {
      mensaje.innerHTML = `<div class="success">${texto}</div>`;
    }

    document.getElementById("btnAgregarCompania").addEventListener("click", async () => {
      const companiaId = parseInt(selectCompania.value);

      if (!idPelicula || !companiaId) {
        mostrarError("⚠️ Selecciona una compañía válida.");
        return;
      }

      // Verificar si ya está asignada
      const cards = document.querySelectorAll(".compania-card h4");
      const companiaNombre = companiasCargadas[companiaId]?.nombre;
      const yaExiste = Array.from(cards).some(el => el.textContent === companiaNombre);
      
      if (yaExiste) {
        mostrarError("⚠️ Esta compañía ya está asociada a la película.");
        return;
      }

      const payload = {
        id_pelicula: idPelicula,
        id_compania: companiaId
      };

      try {
        const res = await fetch("https://reelstormbackend.onrender.com/api/pelicula-compania", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        const responseBody = await res.json();

        if (!res.ok) {
          mostrarError(`❌ Error: ${responseBody.error || 'Error inesperado.'}`);
          return;
        }

        mostrarExito("✅ Compañía agregada correctamente.");
        await mostrarCompaniasAsignadas();
        selectCompania.value = "";
      } catch (error) {
        mostrarError(`⚠️ Error al guardar la compañía: ${error.message}`);
      }
    });

    document.getElementById("btnSiguiente").addEventListener("click", () => {
      if (idPelicula) {
        window.location.href = `agregar-generos.html?peliculaId=${idPelicula}`;
      } else {
        mostrarError("⚠️ No se encontró el ID de la película.");
      }
    });

    if (idPelicula) {
      cargarCompanias().then(() => mostrarCompaniasAsignadas());
    } else {
      mostrarError("❌ No se proporcionó el ID de la película en la URL.");
    }
 