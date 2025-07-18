const API_BASE = "http://localhost:3000/api";
const lista = document.getElementById("lista");
const modal = document.getElementById("modal");
const selectPelicula = document.getElementById("selectPelicula");
const selectIdioma = document.getElementById("selectIdioma");
const mensajeError = document.getElementById("mensajeError");

document.getElementById("btnAgregar").addEventListener("click", abrirModal);
window.onclick = e => { if (e.target === modal) cerrarModal(); };

function abrirModal() {
  modal.style.display = "block";
  cargarListas();
}

function cerrarModal() {
  modal.style.display = "none";
}

async function cargarListas() {
  try {
    const [resPeliculas, resIdiomas] = await Promise.all([
      fetch(`${API_BASE}/peliculas`),
      fetch(`${API_BASE}/idioma`)
    ]);
    const peliculas = await resPeliculas.json();
    const idiomas = await resIdiomas.json();

    selectPelicula.innerHTML = peliculas.map(p =>
      `<option value="${p.id}">${p.titulo_espanol}</option>`).join("");

    selectIdioma.innerHTML = idiomas.map(i =>
      `<option value="${i.id}">${i.nombre}</option>`).join("");
  } catch (error) {
    console.error("Error al cargar listas:", error);
  }
}

async function cargarDatos() {
  try {
    const res = await fetch(`${API_BASE}/pelicula-idioma`);
    const data = await res.json();
    lista.innerHTML = "";

    data.forEach(item => {
      const div = document.createElement("div");
      div.className = "card";

      div.innerHTML = `
        <button class="btn-eliminar" onclick="eliminar(${item.id_pelicula}, ${item.id_idioma})">&#128465;</button>
        <div class="card-info">
          <p class="nombre">${item.nombre_idioma}</p>
          <p>${item.titulo_pelicula}</p>
        </div>
      `;
      lista.appendChild(div);
    });
  } catch (err) {
    console.error("Error al cargar datos:", err);
  }
}

async function guardar() {
  const id_pelicula = selectPelicula.value;
  const id_idioma = selectIdioma.value;

  if (!id_pelicula || !id_idioma) {
    alert("Selecciona todos los campos.");
    return;
  }

  const data = { id_pelicula, id_idioma };

  try {
    const res = await fetch(`${API_BASE}/pelicula-idioma`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    if (!res.ok) {
      const err = await res.json();
      mostrarMensaje(err.message || "Error al agregar relación");
      return;
    }

    cerrarModal();
    cargarDatos();
  } catch (err) {
    console.error(err);
    mostrarMensaje("Error al guardar relación");
  }
}

function eliminar(id_pelicula, id_idioma) {
  if (confirm("¿Eliminar esta relación?")) {
    fetch(`${API_BASE}/pelicula-idioma/${id_pelicula}/${id_idioma}`, {
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

cargarDatos();
