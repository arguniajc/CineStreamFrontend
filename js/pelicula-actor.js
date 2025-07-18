const API_BASE = "http://localhost:3000/api";
const lista = document.getElementById("lista");
const modal = document.getElementById("modal");
const selectActor = document.getElementById("selectActor");
const selectPelicula = document.getElementById("selectPelicula");
const inputPersonaje = document.getElementById("personaje");
const mensajeError = document.getElementById("mensajeError");

function abrirModal() {
  modal.style.display = "block";
  cargarListas();
}

function cerrarModal() {
  modal.style.display = "none";
  inputPersonaje.value = "";
}

async function cargarListas() {
  try {
    const [resActores, resPeliculas] = await Promise.all([
      fetch(`${API_BASE}/actores`),
      fetch(`${API_BASE}/peliculas`)
    ]);

    const actores = await resActores.json();
    const peliculas = await resPeliculas.json();

    selectActor.innerHTML = actores.map(a =>
      `<option value="${a.id}">${a.nombre}</option>`).join("");
    selectPelicula.innerHTML = peliculas.map(p =>
      `<option value="${p.id}">${p.titulo_espanol}</option>`).join("");
  } catch (error) {
    console.error("Error al cargar listas:", error);
  }
}

async function cargarDatos() {
  try {
    const response = await fetch(`${API_BASE}/pelicula-actor`);
    const data = await response.json();
    lista.innerHTML = "";

    data.sort((a, b) => {
      const tituloA = a.pelicula?.titulo_espanol || "";
      const tituloB = b.pelicula?.titulo_espanol || "";
      return tituloA.localeCompare(tituloB);
    });

    data.forEach(item => {
      const div = document.createElement("div");
      div.className = "card";

      const pelicula = item.pelicula || { titulo_espanol: "Desconocido" };

      div.innerHTML = `
        <button class="btn-eliminar" onclick="eliminar(${item.id_pelicula}, ${item.id_actor})">&#128465;</button>
        <img src="${item.actor?.imagen_url || 'https://via.placeholder.com/150'}" alt="Foto actor">
        <div class="card-info">
          <p class="nombre">${item.actor?.nombre || "Sin nombre"}</p>
          <p>Personaje : ${item.personaje}</p>
          <p>${pelicula.titulo_espanol}</p>
        </div>
      `;
      lista.appendChild(div);
    });
  } catch (error) {
    console.error("Error al cargar relaciones:", error);
  }
}

async function guardar() {
  const id_pelicula = selectPelicula.value;
  const id_actor = selectActor.value;
  const personaje = inputPersonaje.value;

  if (!id_pelicula || !id_actor || !personaje) {
    alert("Completa todos los campos.");
    return;
  }

  const data = { id_pelicula, id_actor, personaje };

  try {
    const res = await fetch(`${API_BASE}/pelicula-actor`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    if (!res.ok) {
      const err = await res.json();
      mostrarMensaje(err.detalle || "Error al agregar relación");
      return;
    }

    cerrarModal();
    cargarDatos();
  } catch (err) {
    console.error(err);
    mostrarMensaje("Error al guardar relación");
  }
}

function eliminar(id_pelicula, id_actor) {
  if (confirm("¿Eliminar esta relación?")) {
    fetch(`${API_BASE}/pelicula-actor/${id_pelicula}/${id_actor}`, {
      method: "DELETE"
    }).then(() => cargarDatos());
  }
}

function mostrarMensaje(mensaje) {
  mensajeError.textContent = mensaje;
  mensajeError.style.display = "block";
  setTimeout(() => {
    mensajeError.style.display = "none";
  }, 4000);
}

document.getElementById("btnAgregar").addEventListener("click", abrirModal);
window.onclick = e => { if (e.target === modal) cerrarModal(); };

cargarDatos();
