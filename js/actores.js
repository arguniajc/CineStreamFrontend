const apiUrl = "http://localhost:3000/api/actores";
const contenedor = document.getElementById("contenedor-actores");
const modal = document.getElementById("modal");
const inputId = document.getElementById("actor-id");
const inputNombre = document.getElementById("actor-nombre");
const inputImagen = document.getElementById("actor-imagen");
const modalTitulo = document.getElementById("modal-titulo");

const cargarActores = async () => {
  const res = await fetch(apiUrl);
  const actores = await res.json();
  contenedor.innerHTML = "";

  actores.forEach(actor => {
    const card = document.createElement("div");
    card.className = "card";

    const img = document.createElement("img");
    img.src = actor.imagen_url || "https://via.placeholder.com/200x250?text=Sin+Imagen";
    img.alt = actor.nombre;

    const content = document.createElement("div");
    content.className = "card-content";

    const nombre = document.createElement("h3");
    nombre.textContent = actor.nombre;

    const btnEliminar = document.createElement("button");
    btnEliminar.className = "delete-btn";
    btnEliminar.textContent = "🗑️";
    btnEliminar.onclick = async (e) => {
      e.stopPropagation();
      if (confirm(`¿Eliminar al actor \"${actor.nombre}\"?`)) {
        await fetch(`${apiUrl}/${actor.id}`, { method: "DELETE" });
        cargarActores();
      }
    };

    const btnEditar = document.createElement("button");
    btnEditar.className = "edit-btn";
    btnEditar.textContent = "✏️";
    btnEditar.onclick = () => abrirModal(actor);

    content.appendChild(nombre);
    card.appendChild(img);
    card.appendChild(content);
    card.appendChild(btnEditar);
    card.appendChild(btnEliminar);
    contenedor.appendChild(card);
  });
};

const abrirModal = (actor = null) => {
  if (actor) {
    inputId.value = actor.id;
    inputNombre.value = actor.nombre;
    inputImagen.value = actor.imagen_url;
    modalTitulo.textContent = "Editar Actor";
  } else {
    inputId.value = "";
    inputNombre.value = "";
    inputImagen.value = "";
    modalTitulo.textContent = "Nuevo Actor";
  }
  modal.style.display = "block";
};

const cerrarModal = () => {
  modal.style.display = "none";
};

const guardarActor = async () => {
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
  cargarActores();
};

window.onclick = (e) => {
  if (e.target === modal) cerrarModal();
};

cargarActores();
