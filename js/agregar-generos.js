const urlParams = new URLSearchParams(window.location.search);
const idPelicula = parseInt(urlParams.get("peliculaId"));


const selectGenero = document.getElementById("selectGenero");
const listaGeneros = document.getElementById("listaGeneros");
const mensaje = document.getElementById("mensaje");
const generosCargados = {};

async function cargarGeneros() {
  try {
    const res = await fetch("https://reelstormbackend.onrender.com/api/genero");
    const data = await res.json();

    data.forEach(genero => {
      generosCargados[genero.id] = genero;
      const option = document.createElement("option");
      option.value = genero.id;
      option.textContent = genero.nombre;
      selectGenero.appendChild(option);
    });
  } catch (error) {
    mostrarError(`⚠️ Error cargando géneros: ${error.message}`);
  }
}

async function mostrarGenerosAsignados() {
  try {
    const res = await fetch("https://reelstormbackend.onrender.com/api/pelicula-genero");
    const data = await res.json();
    
    listaGeneros.innerHTML = "";

    const asignados = data.filter(item => item.id_pelicula === idPelicula);

    if (asignados.length === 0) {
      listaGeneros.innerHTML = '<p class="empty-message">No hay géneros asociados a esta película.</p>';
      return;
    }

    asignados.forEach(item => {
      const card = document.createElement("div");
      card.className = "genero-card";

      const generoInfo = generosCargados[item.id_genero] || {};

      card.innerHTML = `
        <div class="genero-card-icon">
          <i class="fas fa-film"></i>
        </div>
        <div class="genero-card-content">
          <h4>${generoInfo.nombre || 'Nombre desconocido'}</h4>
          <p>${item.titulo_pelicula || ''}</p>
        </div>
      `;

      listaGeneros.appendChild(card);
    });
  } catch (error) {
    mostrarError(`⚠️ Error al mostrar géneros: ${error.message}`);
  }
}

function mostrarError(texto) {
  mensaje.innerHTML = `<div class="error">${texto}</div>`;
}

function mostrarExito(texto) {
  mensaje.innerHTML = `<div class="success">${texto}</div>`;
}

document.getElementById("btnAgregarGenero").addEventListener("click", async () => {
  const generoId = parseInt(selectGenero.value);

  if (!idPelicula || !generoId) {
    mostrarError("⚠️ Selecciona un género válido.");
    return;
  }

  // Verificar si ya está asignado
  const cards = document.querySelectorAll(".genero-card h4");
  const generoNombre = generosCargados[generoId]?.nombre;
  const yaExiste = Array.from(cards).some(el => el.textContent === generoNombre);
  
  if (yaExiste) {
    mostrarError("⚠️ Este género ya está asociado a la película.");
    return;
  }

  const payload = {
    id_pelicula: idPelicula,
    id_genero: generoId
  };

  try {
    const res = await fetch("https://reelstormbackend.onrender.com/api/pelicula-genero", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const responseBody = await res.json();

    if (!res.ok) {
      mostrarError(`❌ Error: ${responseBody.error || 'Error inesperado.'}`);
      return;
    }

    mostrarExito("✅ Género agregado correctamente.");
    await mostrarGenerosAsignados();
    selectGenero.value = "";
  } catch (error) {
    mostrarError(`⚠️ Error al guardar el género: ${error.message}`);
  }
});

document.getElementById("btnSiguiente").addEventListener("click", () => {
  if (idPelicula) {
    window.location.href = `agregar-idiomas.html?peliculaId=${idPelicula}`;
  } else {
    mostrarError("⚠️ No se encontró el ID de la película.");
  }
});

if (idPelicula) {
  cargarGeneros().then(() => mostrarGenerosAsignados());
} else {
  mostrarError("❌ No se proporcionó el ID de la película en la URL.");
}
