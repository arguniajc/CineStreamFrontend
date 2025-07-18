const API_BASE = "http://localhost:3000/api";
const lista = document.getElementById("lista");
const modal = document.getElementById("modal");
const selectCompania = document.getElementById("selectCompania");
const selectPelicula = document.getElementById("selectPelicula");
const mensajeError = document.getElementById("mensajeError");

function abrirModal() {
  modal.style.display = "block";
  cargarListas();
}

function cerrarModal() {
  modal.style.display = "none";
}

async function cargarListas() {
  try {
    const [resCompanias, resPeliculas] = await Promise.all([
      fetch(`${API_BASE}/compania`),
      fetch(`${API_BASE}/peliculas`)
    ]);

    const companias = await resCompanias.json();
    const peliculas = await resPeliculas.json();

    selectCompania.innerHTML = companias.map(c =>
      `<option value="${c.id}">${c.nombre}</option>`).join("");
    selectPelicula.innerHTML = peliculas.map(p =>
      `<option value="${p.id}">${p.titulo_espanol}</option>`).join("");
  } catch (error) {
    console.error("Error al cargar listas:", error);
  }
}

async function cargarDatos() {
  try {
    const response = await fetch(`${API_BASE}/pelicula-compania`);
    const data = await response.json();
    lista.innerHTML = "";

    data.sort((a, b) => {
      const tituloA = a.titulo_pelicula || "";
      const tituloB = b.titulo_pelicula || "";
      return tituloA.localeCompare(tituloB);
    });

    data.forEach(item => {
      const div = document.createElement("div");
      div.className = "card";

      div.innerHTML = `
        <button class="btn-eliminar" onclick="eliminar(${item.id_pelicula}, ${item.id_compania})">&#128465;</button>
        <img src="${item.logo_compania || 'https://via.placeholder.com/150'}" alt="Logo compañia">
        <div class="card-info">
          <p class="nombre">${item.nombre_compania || "Sin nombre"}</p>
          <p>${item.titulo_pelicula || "Sin título"}</p>
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
  const id_compania = selectCompania.value;

  if (!id_pelicula || !id_compania) {
    alert("Completa todos los campos.");
    return;
  }

  const data = { id_pelicula, id_compania };

  try {
    const res = await fetch(`${API_BASE}/pelicula-compania`, {
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

function eliminar(id_pelicula, id_compania) {
  if (confirm("¿Eliminar esta relación?")) {
    fetch(`${API_BASE}/pelicula-compania/${id_pelicula}/${id_compania}`, {
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
