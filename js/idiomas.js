const apiUrl = "http://localhost:3000/api/idioma";
const contenedor = document.getElementById("listaIdiomas");
const modal = document.getElementById("modal");
const inputId = document.getElementById("item-id");
const inputNombre = document.getElementById("item-nombre");
const modalTitulo = document.getElementById("modalTitulo");
const btnGuardar = document.getElementById("btnGuardar");
const btnAgregar = document.getElementById("btnAgregar");
const btnCerrar = document.getElementById("btnCerrar");

btnAgregar.addEventListener("click", () => {
  inputId.value = "";
  inputNombre.value = "";
  modalTitulo.textContent = "Agregar Idioma";
  modal.classList.add("show");
});

btnCerrar.addEventListener("click", () => {
  modal.classList.remove("show");
});

btnGuardar.addEventListener("click", async () => {
  const id = inputId.value;
  const nombre = inputNombre.value.trim();

  if (!nombre) return alert("El nombre es obligatorio");

  const payload = { nombre };

  if (id) {
    await fetch(`${apiUrl}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  } else {
    await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  }

  modal.classList.remove("show");
  cargarIdiomas();
});

async function cargarIdiomas() {
  contenedor.innerHTML = "";
  const res = await fetch(apiUrl);
  const idiomas = await res.json();

  idiomas.forEach(idioma => {
    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `
      <div class="card-header">
        <h3>${idioma.nombre}</h3>
        <div class="botones">
          <button class="edit-btn-inline" onclick="editar(${idioma.id}, '${idioma.nombre}')">Editar</button>
          <button class="delete-btn-inline" onclick="eliminar(${idioma.id})">Eliminar</button>
        </div>
      </div>
    `;
    contenedor.appendChild(div);
  });
}

function editar(id, nombre) {
  inputId.value = id;
  inputNombre.value = nombre;
  modalTitulo.textContent = "Editar Idioma";
  modal.classList.add("show");
}

async function eliminar(id) {
  if (confirm("¿Estás seguro de eliminar este idioma?")) {
    await fetch(`${apiUrl}/${id}`, { method: "DELETE" });
    cargarIdiomas();
  }
}

cargarIdiomas();
