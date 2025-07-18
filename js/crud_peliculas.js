const api = "http://localhost:3000/api/peliculas";
const tabla = document.getElementById("tabla");
const modal = document.getElementById("modal");

// NUEVOS SELECTS Y CONTENEDORES
const selectGeneros = document.getElementById("generos");
const selectCompanias = document.getElementById("companias");
const selectIdiomas = document.getElementById("idiomas");
const selectDirectores = document.getElementById("directores");
const actoresContainer = document.getElementById("actores-container");

let actoresOptions = [];

// Cargar opciones al abrir el modal
async function cargarOpcionesRelacion() {
  // Cargar géneros
  const generos = await fetch("http://localhost:3000/api/genero").then(r => r.json());
  selectGeneros.innerHTML = generos.map(g => `<option value="${g.id}">${g.nombre}</option>`).join("");

  // Cargar compañías
  const companias = await fetch("http://localhost:3000/api/compania").then(r => r.json());
  selectCompanias.innerHTML = companias.map(c => `<option value="${c.id}">${c.nombre}</option>`).join("");

  // Cargar idiomas
  const idiomas = await fetch("http://localhost:3000/api/idioma").then(r => r.json());
  selectIdiomas.innerHTML = idiomas.map(i => `<option value="${i.id}">${i.nombre}</option>`).join("");

  // Cargar directores
  const directores = await fetch("http://localhost:3000/api/directores").then(r => r.json());
  selectDirectores.innerHTML = directores.map(d => `<option value="${d.id}">${d.nombre}</option>`).join("");

  // Cargar actores (para selects individuales)
  actoresOptions = await fetch("http://localhost:3000/api/actores").then(r => r.json());
  // Si no hay ningún campo de actor, agregar uno por defecto
  if (actoresContainer.childElementCount === 0) agregarActorCampo();
}

function agregarActorCampo() {
  const row = document.createElement("div");
  row.className = "actor-personaje-row";
  // Select de actor
  const select = document.createElement("select");
  select.innerHTML = `<option value="">Seleccione actor</option>` + actoresOptions.map(a => `<option value="${a.id}">${a.nombre}</option>`).join("");
  // Input de personaje
  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "Personaje";
  // Botón eliminar
  const btn = document.createElement("button");
  btn.type = "button";
  btn.textContent = "Eliminar";
  btn.onclick = () => row.remove();
  row.appendChild(select);
  row.appendChild(input);
  row.appendChild(btn);
  actoresContainer.appendChild(row);
}

const cargar = async () => {
  const res = await fetch(api);
  const data = await res.json();
  tabla.innerHTML = "";
  data.forEach(p => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${p.id}</td>
      <td>${p.titulo_espanol}</td>
      <td>${p.ano_estreno}</td>
      <td>${p.pais}</td>
      <td>
        <button onclick='editar(${JSON.stringify(p)})'>Editar</button>
        <button onclick='eliminar(${p.id})'>Eliminar</button>
      </td>
    `;
    tabla.appendChild(tr);
  });
};

let pasoActual = 1;
const totalPasos = 6;

function mostrarPaso(n) {
  document.querySelectorAll('.modal-step').forEach((step, i) => {
    step.classList.toggle('active', i === n - 1);
  });
  document.getElementById('btn-prev').style.display = n === 1 ? 'none' : '';
  document.getElementById('btn-next').style.display = n === totalPasos ? 'none' : '';
  document.getElementById('btn-crear').style.display = n === totalPasos ? '' : 'none';
}

let peliculaIdCreada = null;

async function cambiarPaso(dir) {
  // Antes de avanzar de cada paso, ejecuta la acción correspondiente
  if (dir === 1) {
    if (pasoActual === 1) {
      // Crear película y guardar id
      const datos = {
        titulo_espanol: titulo_espanol.value.trim(),
        titulo_original: titulo_original.value.trim(),
        ano_estreno: parseInt(ano_estreno.value),
        pais: pais.value.trim(),
        duracion: parseInt(duracion.value),
        calificacion: calificacion.value.trim(),
        fecha_estreno: fecha_estreno.value,
        imagen_portada: imagen_portada.value.trim(),
        trailer_url: trailer_url.value.trim(),
        sinopsis: sinopsis.value.trim(),
      };
      // Validar títulos
      if (!datos.titulo_espanol || !datos.titulo_original) {
        alert("Debes ingresar el título en español y el título original.");
        return;
      }
      // Validar campos obligatorios
      if (isNaN(datos.ano_estreno) || !datos.pais || isNaN(datos.duracion)) {
        alert("Completa todos los campos obligatorios: año, país y duración.");
        return;
      }
      console.log("Enviando datos para crear película:", datos);
      alert("JSON enviado al API:\n" + JSON.stringify(datos, null, 2));
      const response = await fetch(api, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos)
      });
      if (!response.ok) {
        let msg = "Error al guardar película";
        try {
          const err = await response.json();
          msg += ": " + JSON.stringify(err);
        } catch (e) {
          msg += ": " + response.status + " " + response.statusText;
        }
        alert(msg);
        console.error("Error al guardar película:", response);
        return;
      }
      const pelicula = await response.json();
      peliculaIdCreada = pelicula.id;
      console.log("Película creada con id:", peliculaIdCreada);
    }
    if (pasoActual === 2) {
      // Crear relaciones de actores
      const actores = Array.from(actoresContainer.children).map(row => {
        const [select, input] = row.querySelectorAll("select, input");
        return { id: select.value, personaje: input.value };
      }).filter(a => a.id && a.personaje);
      for (const actor of actores) {
        await fetch(`http://localhost:3000/api/pelicula-actor/${peliculaIdCreada}/${actor.id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ personaje: actor.personaje })
        });
      }
    }
    if (pasoActual === 3) {
      // Crear relaciones de directores
      const directores = Array.from(selectDirectores.selectedOptions).map(opt => opt.value);
      for (const directorId of directores) {
        await fetch(`http://localhost:3000/api/pelicula_director/${peliculaIdCreada}/${directorId}`, {
          method: "POST" });
      }
    }
    if (pasoActual === 4) {
      // Crear relaciones de compañías
      const companias = Array.from(selectCompanias.selectedOptions).map(opt => opt.value);
      for (const companiaId of companias) {
        await fetch(`http://localhost:3000/api/pelicula-compania/${peliculaIdCreada}/${companiaId}`, {
          method: "POST" });
      }
    }
    if (pasoActual === 5) {
      // Crear relaciones de géneros
      const generos = Array.from(selectGeneros.selectedOptions).map(opt => opt.value);
      for (const generoId of generos) {
        await fetch(`http://localhost:3000/api/pelicula-genero/${peliculaIdCreada}/${generoId}`, {
          method: "POST" });
      }
    }
    if (pasoActual === 6) {
      // Crear relaciones de idiomas
      const idiomas = Array.from(selectIdiomas.selectedOptions).map(opt => opt.value);
      for (const idiomaId of idiomas) {
        await fetch(`http://localhost:3000/api/pelicula-idioma/${peliculaIdCreada}/${idiomaId}`, {
          method: "POST" });
      }
    }
  }
  pasoActual += dir;
  if (pasoActual < 1) pasoActual = 1;
  if (pasoActual > totalPasos) pasoActual = totalPasos;
  mostrarPaso(pasoActual);
}

const abrirModal = () => {
  document.getElementById("modal-titulo").textContent = "Nueva Película";
  document.querySelectorAll("#modal input, #modal textarea").forEach(el => el.value = "");
  [selectGeneros, selectCompanias, selectIdiomas, selectDirectores].forEach(sel => sel.selectedIndex = -1);
  actoresContainer.innerHTML = "";
  cargarOpcionesRelacion();
  pasoActual = 1;
  mostrarPaso(pasoActual);
  document.getElementById('mensaje-exito').style.display = 'none';
  modal.style.display = "block";
};

const cerrarModal = () => {
  modal.style.display = "none";
};

const guardar = async () => {
  // 1. Datos de película
  const datos = {
    titulo_espanol: titulo_espanol.value,
    titulo_original: titulo_original.value,
    ano_estreno: parseInt(ano_estreno.value),
    pais: pais.value,
    duracion: parseInt(duracion.value),
    calificacion: calificacion.value,
    fecha_estreno: fecha_estreno.value,
    imagen_portada: imagen_portada.value,
    trailer_url: trailer_url.value,
    sinopsis: sinopsis.value,
  };

  const id = document.getElementById("id").value;
  const url = id ? `${api}/${id}` : api;
  const method = id ? "PUT" : "POST";

  // 2. Relaciones (obligatorio al menos 1)
  const generos = Array.from(selectGeneros.selectedOptions).map(opt => opt.value);
  const companias = Array.from(selectCompanias.selectedOptions).map(opt => opt.value);
  const idiomas = Array.from(selectIdiomas.selectedOptions).map(opt => opt.value);
  const directores = Array.from(selectDirectores.selectedOptions).map(opt => opt.value);
  // Actores y personajes
  const actores = Array.from(actoresContainer.children).map(row => {
    const [select, input] = row.querySelectorAll("select, input");
    return { id: select.value, personaje: input.value };
  }).filter(a => a.id && a.personaje);

  if (
    generos.length === 0 &&
    companias.length === 0 &&
    idiomas.length === 0 &&
    directores.length === 0 &&
    actores.length === 0
  ) {
    alert("Selecciona al menos un género, compañía, idioma, director o actor con personaje.");
    return;
  }

  // 3. Guardar película principal
  let peliculaId = id;
  let response;
  if (!id) {
    response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos)
    });
    if (!response.ok) {
      let msg = "Error al guardar película";
      try {
        const err = await response.json();
        if (err && (err.detalle || err.message)) msg += ": " + (err.detalle || err.message);
      } catch (e) {}
      alert(msg);
      // Mostrar detalles en consola
      console.error("Respuesta error película:", response);
      return;
    }
    const pelicula = await response.json();
    peliculaId = pelicula.id;
  } else {
    // Editar película (no se actualizan relaciones en este ejemplo)
    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos)
    });
  }

  // 4. Guardar relaciones (solo si es creación)
  if (!id) {
    // Géneros
    for (const generoId of generos) {
      await fetch(`http://localhost:3000/api/pelicula-genero`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_pelicula: peliculaId, id_genero: generoId })
      });
    }
    // Compañías
    for (const companiaId of companias) {
      await fetch(`http://localhost:3000/api/pelicula-compania`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_pelicula: peliculaId, id_compania: companiaId })
      });
    }
    // Idiomas
    for (const idiomaId of idiomas) {
      await fetch(`http://localhost:3000/api/pelicula-idioma`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_pelicula: peliculaId, id_idioma: idiomaId })
      });
    }
    // Directores
    for (const directorId of directores) {
      await fetch(`http://localhost:3000/api/pelicula_director`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_pelicula: peliculaId, id_director: directorId })
      });
    }
    // Actores y personajes
    for (const actor of actores) {
      await fetch(`http://localhost:3000/api/pelicula-actor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_pelicula: peliculaId, id_actor: actor.id, personaje: actor.personaje })
      });
    }
  }

  document.getElementById('mensaje-exito').style.display = 'block';
  setTimeout(() => {
    cerrarModal();
    cargar();
  }, 1200);
};

const editar = (p) => {
  document.getElementById("modal-titulo").textContent = "Editar Película";
  id.value = p.id;
  titulo_espanol.value = p.titulo_espanol || "";
  titulo_original.value = p.titulo_original || "";
  ano_estreno.value = p.ano_estreno || "";
  pais.value = p.pais || "";
  duracion.value = p.duracion || "";
  calificacion.value = p.calificacion || "";
  fecha_estreno.value = p.fecha_estreno || "";
  imagen_portada.value = p.imagen_portada || "";
  trailer_url.value = p.trailer_url || "";
  sinopsis.value = p.sinopsis || "";
  modal.style.display = "block";
};

const eliminar = async (id) => {
  if (confirm("¿Eliminar esta película?")) {
    await fetch(`${api}/${id}`, { method: "DELETE" });
    cargar();
  }
};

window.onclick = e => { if (e.target === modal) cerrarModal(); };

cargar();
