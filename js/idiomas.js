const apiUrl = "http://localhost:3000/api/idioma";
const contenedor = document.getElementById("contenedor");
const modal = document.getElementById("modal");
const inputId = document.getElementById("item-id");
const inputNombre = document.getElementById("item-nombre");
const modalTitulo = document.getElementById("modal-titulo");

const cargarItems = async () => {
  const res = await fetch(apiUrl);
  const items = (await res.json()).sort((a, b) => a.nombre.localeCompare(b.nombre));
  contenedor.innerHTML = "";

  items.forEach(item => {
    const card = document.createElement("div");
    card.className = "card";

    const nombre = document.createElement("h3");
    nombre.textContent = item.nombre;

    const btnEliminar = document.createElement("button");
    btnEliminar.className = "delete-btn";
    btnEliminar.textContent = "🗑️";
    btnEliminar.onclick = async (e) => {
      e.stopPropagation();
      if (confirm(`¿Eliminar \"${item.nombre}\"?`)) {
        await fetch(`${apiUrl}/${item.id}`, { method: "DELETE" });
        cargarItems();
      }
    };

    const btnEditar = document.createElement("button");
    btnEditar.className = "edit-btn";
    btnEditar.textContent = "✏️";
    btnEditar.onclick = () => abrirModal(item);

    card.appendChild(nombre);
    card.appendChild(btnEditar);
    card.appendChild(btnEliminar);
    contenedor.appendChild(card);
  });
};

const abrirModal = (item = null) => {
  if (item) {
    inputId.value = item.id;
    inputNombre.value = item.nombre;
    modalTitulo.textContent = "Editar Idioma";
  } else {
    inputId.value = "";
    inputNombre.value = "";
    modalTitulo.textContent = "Nuevo Idioma";
  }
  modal.style.display = "block";
};

const cerrarModal = () => {
  modal.style.display = "none";
};

const guardarItem = async () => {
  const id = inputId.value;
  const nombre = inputNombre.value.trim();
  if (!nombre) return alert("Completa el nombre");

  const method = id ? "PUT" : "POST";
  const url = id ? `${apiUrl}/${id}` : apiUrl;

  await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nombre })
  });

  cerrarModal();
  cargarItems();
};

window.onclick = (e) => {
  if (e.target === modal) cerrarModal();
};

cargarItems();
