const apiUrl = "http://localhost:3000/api/directores";
const contenedor = document.getElementById("contenedor");
const modal = document.getElementById("modal");
const inputId = document.getElementById("item-id");
const inputNombre = document.getElementById("item-nombre");
const inputImagen = document.getElementById("item-imagen");
const modalTitulo = document.getElementById("modal-titulo");

const cargarItems = async () => {
  const res = await fetch(apiUrl);
  const items = (await res.json()).sort((a, b) => a.nombre.localeCompare(b.nombre));
  contenedor.innerHTML = "";

  items.forEach(item => {
    const card = document.createElement("div");
    card.className = "card";

    const img = document.createElement("img");
    img.src = item.imagen_url || "https://via.placeholder.com/240x250?text=Sin+Imagen";
    img.alt = item.nombre;

    const content = document.createElement("div");
    content.className = "card-content";

    const nombre = document.createElement("h3");
    nombre.textContent = item.nombre;

    const btnEliminar = document.createElement("button");
    btnEliminar.className = "delete-btn";
    btnEliminar.textContent = "🗑️";
    btnEliminar.onclick = async (e) => {
      e.stopPropagation();
      if (confirm(`¿Eliminar a \"${item.nombre}\"?`)) {
        await fetch(`${apiUrl}/${item.id}`, { method: "DELETE" });
        cargarItems();
      }
    };

    const btnEditar = document.createElement("button");
    btnEditar.className = "edit-btn";
    btnEditar.textContent = "✏️";
    btnEditar.onclick = () => abrirModal(item);

    content.appendChild(nombre);
    card.appendChild(img);
    card.appendChild(content);
    card.appendChild(btnEditar);
    card.appendChild(btnEliminar);
    contenedor.appendChild(card);
  });
};

const abrirModal = (item = null) => {
  if (item) {
    inputId.value = item.id;
    inputNombre.value = item.nombre;
    inputImagen.value = item.imagen_url;
    modalTitulo.textContent = "Editar Director";
  } else {
    inputId.value = "";
    inputNombre.value = "";
    inputImagen.value = "";
    modalTitulo.textContent = "Nuevo Director";
  }
  modal.style.display = "block";
};

const cerrarModal = () => {
  modal.style.display = "none";
};

const guardarItem = async () => {
  const id = inputId.value;
  const nombre = inputNombre.value.trim();
  const imagen_url = inputImagen.value.trim();
  if (!nombre || !imagen_url) return alert("Completa todos los campos");

  const method = id ? "PUT" : "POST";
  const url = id ? `${apiUrl}/${id}` : apiUrl;

  await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nombre, imagen_url })
  });

  cerrarModal();
  cargarItems();
};

window.onclick = (e) => {
  if (e.target === modal) cerrarModal();
};

cargarItems();
