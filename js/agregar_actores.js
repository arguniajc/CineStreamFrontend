
const urlParams = new URLSearchParams(window.location.search);
const peliculaId = urlParams.get("peliculaId");

if (!peliculaId) {
  alert("ID de película no encontrado. Redirigiendo...");
  window.location.href = "crud_peliculas.html"; // o a donde quieras llevarlo
}

const actorSelect = document.getElementById("actorSelect");
const personajeInput = document.getElementById("personajeInput");
const listaActores = document.getElementById("listaActores");
const mensaje = document.getElementById("mensaje");

const actoresCargados = {};


async function cargarActores() {
  try {
    const response = await fetch("http://localhost:3000/api/actores");
    const actores = await response.json();

    actores.forEach(actor => {
      actoresCargados[actor.id] = actor;
      const option = document.createElement("option");
      option.value = actor.id;
      option.textContent = actor.nombre;
      actorSelect.appendChild(option);
    });
  } catch (err) {
    mostrarError(`⚠️ Error cargando actores: ${err.message}`);
  }
}

async function cargarActoresDePelicula(peliculaId) {
  try {
    const response = await fetch("http://localhost:3000/api/pelicula-actor");
    const datos = await response.json();

    const relacionesFiltradas = datos.filter(item => item.id_pelicula == peliculaId);

    listaActores.innerHTML = "";

    if (relacionesFiltradas.length === 0) {
      listaActores.innerHTML = '<p class="empty-message">No hay actores asociados a esta película.</p>';
      return;
    }

    relacionesFiltradas.forEach(item => {
      const card = document.createElement("div");
      card.className = "actor-card";

      const actorInfo = actoresCargados[item.id_actor] || {};
      const imagen = actorInfo.imagen_url || "https://via.placeholder.com/300x250/1f2937/9ca3af?text=Sin+Imagen";

      card.innerHTML = `
        <img src="${imagen}" alt="${item.actor?.nombre || 'Actor'}">
        <div class="actor-card-content">
          <h4>${item.actor?.nombre || 'Nombre desconocido'}</h4>
          <p class="personaje">Personaje: ${item.personaje}</p>
        </div>
      `;

      listaActores.appendChild(card);
    });

  } catch (err) {
    mostrarError(`⚠️ Error al consultar actores de la película: ${err.message}`);
  }
}

function mostrarError(texto) {
  mensaje.innerHTML = `<div class="error">${texto}</div>`;
}

function mostrarExito(texto) {
  mensaje.innerHTML = `<div class="success">${texto}</div>`;
}

document.getElementById("btnAgregarActor").addEventListener("click", async () => {
  const actorId = actorSelect.value;
  const personaje = personajeInput.value.trim();

  if (!peliculaId || !actorId || !personaje) {
    mostrarError("❌ Debes seleccionar un actor y escribir un personaje.");
    return;
  }

  const payload = {
    id_pelicula: parseInt(peliculaId),
    id_actor: parseInt(actorId),
    personaje
  };

  try {
    const response = await fetch("http://localhost:3000/api/pelicula-actor/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (!response.ok) {
      mostrarError(`❌ Error: ${result.error || 'Error inesperado.'}`);
      return;
    }

    mostrarExito("✅ Actor agregado correctamente.");
    await cargarActoresDePelicula(peliculaId);
    limpiarFormulario();
  } catch (err) {
    mostrarError(`⚠️ Error al agregar actor: ${err.message}`);
  }
});

function limpiarFormulario() {
  actorSelect.value = "";
  personajeInput.value = "";
  personajeInput.focus();
}

function irADirectores() {
  if (!peliculaId) {
    mostrarError("❌ No se puede continuar: Falta el ID de la película.");
    return;
  }
  window.location.href = `agregar-directores.html?peliculaId=${peliculaId}`;
}

if (peliculaId) {
  cargarActores().then(() => cargarActoresDePelicula(peliculaId));
} else {
  mostrarError("❌ No se proporcionó el ID de la película en la URL.");
}
