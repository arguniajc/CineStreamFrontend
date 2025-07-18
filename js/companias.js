const apiUrl = "http://localhost:3000/api/compania";

const contenedor = document.getElementById("contenedor");
const modal = document.getElementById("modal");
const inputId = document.getElementById("item-id");
const inputNombre = document.getElementById("item-nombre");
const inputLogo = document.getElementById("item-logo");
const modalTitulo = document.getElementById("modal-titulo");

const cargarItems = async () => {
  try {
    const res = await fetch(apiUrl);
    const items = await res.json();
    console.log("📦 Compañías recibidas:", items); // para depurar

    contenedor.innerHTML = "";

    items.forEach(item => {
      const card = document.createElement("div");
      card.className = "card";

      const img = document.createElement("img");
      img.src = item.logo_url || "https://via.placeholder.com/200x150?text=Sin+Logo";
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
        if (confirm(`¿Eliminar \"${item.nombre}\"?`)) {
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
  } catch (error) {
    console.error("Error al cargar compañías:", error);
    contenedor.innerHTML = "<p>Error al cargar compañías</p>";
  }
};

const abrirModal = (item = null) => {
  if (item) {
    inputId.value = item.id;
    inputNombre.value = item.nombre;
    inputLogo.value = item.logo_url;
    modalTitulo.textContent = "Editar Compañía";
  } else {
    inputId.value = "";
    inputNombre.value = "";
    inputLogo.value = "";
    modalTitulo.textContent = "Nueva Compañía";
  }
  modal.style.display = "block";
};

const cerrarModal = () => {
  modal.style.display = "none";
};

const guardarItem = async () => {
  const id = inputId.value;
  const nombre = inputNombre.value.trim();
  const logo_url = inputLogo.value.trim();
  if (!nombre || !logo_url) return alert("Completa todos los campos");

  const method = id ? "PUT" : "POST";
  const url = id ? `${apiUrl}/${id}` : apiUrl;

  await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nombre, logo_url })
  });

  cerrarModal();
  cargarItems();
};

window.onclick = (e) => {
  if (e.target === modal) cerrarModal();
};

cargarItems();
