   const urlParams = new URLSearchParams(window.location.search);
    const idPelicula = parseInt(urlParams.get("peliculaId"));
    document.getElementById("peliculaIdInfo").textContent = "Película ID: " + idPelicula;

    const selectIdioma = document.getElementById("selectIdioma");
    const listaIdiomas = document.getElementById("listaIdiomas");
    const mensaje = document.getElementById("mensaje");
    const idiomasCargados = {};

    async function cargarIdiomas() {
      try {
        const res = await fetch("http://localhost:3000/api/idioma");
        const data = await res.json();

        data.forEach(idioma => {
          idiomasCargados[idioma.id] = idioma;
          const option = document.createElement("option");
          option.value = idioma.id;
          option.textContent = idioma.nombre;
          selectIdioma.appendChild(option);
        });
      } catch (error) {
        mostrarError(`⚠️ Error cargando idiomas: ${error.message}`);
      }
    }

    async function mostrarIdiomasAsignados() {
      try {
        const res = await fetch("http://localhost:3000/api/pelicula-idioma");
        const data = await res.json();
        
        listaIdiomas.innerHTML = "";

        const asignados = data.filter(item => item.id_pelicula === idPelicula);

        if (asignados.length === 0) {
          listaIdiomas.innerHTML = '<p class="empty-message">No hay idiomas asociados a esta película.</p>';
          return;
        }

        asignados.forEach(item => {
          const card = document.createElement("div");
          card.className = "idioma-card";

          const idiomaInfo = idiomasCargados[item.id_idioma] || {};

          card.innerHTML = `
            <div class="idioma-card-icon">
              <i class="fas fa-language"></i>
            </div>
            <div class="idioma-card-content">
              <h4>${idiomaInfo.nombre || 'Nombre desconocido'}</h4>
              <p>${item.titulo_pelicula || ''}</p>
            </div>
          `;

          listaIdiomas.appendChild(card);
        });
      } catch (error) {
        mostrarError(`⚠️ Error al mostrar idiomas: ${error.message}`);
      }
    }

    function mostrarError(texto) {
      mensaje.innerHTML = `<div class="error">${texto}</div>`;
    }

    function mostrarExito(texto) {
      mensaje.innerHTML = `<div class="success">${texto}</div>`;
    }

    document.getElementById("btnAgregarIdioma").addEventListener("click", async () => {
      const idiomaId = parseInt(selectIdioma.value);

      if (!idPelicula || !idiomaId) {
        mostrarError("⚠️ Selecciona un idioma válido.");
        return;
      }

      // Verificar si ya está asignado
      const cards = document.querySelectorAll(".idioma-card h4");
      const idiomaNombre = idiomasCargados[idiomaId]?.nombre;
      const yaExiste = Array.from(cards).some(el => el.textContent === idiomaNombre);
      
      if (yaExiste) {
        mostrarError("⚠️ Este idioma ya está asociado a la película.");
        return;
      }

      const payload = {
        id_pelicula: idPelicula,
        id_idioma: idiomaId
      };

      try {
        const res = await fetch("http://localhost:3000/api/pelicula-idioma", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          const errorText = await res.text();
          console.error("Error al agregar idioma:", errorText);
          mostrarError("Error al agregar idioma.");
          return;
        }

        mostrarExito("✅ Idioma agregado correctamente.");
        await mostrarIdiomasAsignados();
        selectIdioma.value = "";
      } catch (error) {
        mostrarError(`⚠️ Error al guardar el idioma: ${error.message}`);
      }
    });

    document.getElementById("btnFinalizar").addEventListener("click", () => {
      const modalExito = new bootstrap.Modal(document.getElementById("modalExito"));
      modalExito.show();

      setTimeout(() => {
        modalExito.hide();
        window.location.href = "consultar-peliculas.html";
      }, 2000);
    });

    if (idPelicula) {
      cargarIdiomas().then(() => mostrarIdiomasAsignados());
    } else {
      mostrarError("❌ No se proporcionó el ID de la película en la URL.");
    }
 