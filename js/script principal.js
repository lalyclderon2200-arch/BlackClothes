document.addEventListener('DOMContentLoaded', () => {

  /* ==========================================================================
     1. DATOS Y PERSISTENCIA (LOCALSTORAGE)
     ========================================================================== */
  let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
  let favoritos = JSON.parse(localStorage.getItem('favoritos')) || [];
  let usuarioActual = JSON.parse(localStorage.getItem('usuarioActual')) || null;
  let baseUsuarios = JSON.parse(localStorage.getItem('baseUsuarios')) || [];

  const badgeCart = document.getElementById('badgeCart');
  const badgeFavs = document.getElementById('badgeFavs');

  const guardarLocal = () => {
    localStorage.setItem('carrito', JSON.stringify(carrito));
    localStorage.setItem('favoritos', JSON.stringify(favoritos));
    localStorage.setItem('usuarioActual', JSON.stringify(usuarioActual));
    localStorage.setItem('baseUsuarios', JSON.stringify(baseUsuarios));
    actualizarInterfaz();
  };

  const actualizarInterfaz = () => {
    if (badgeCart) badgeCart.textContent = carrito.length;
    if (badgeFavs) badgeFavs.textContent = favoritos.length;

    document.querySelectorAll('.btn-agregar').forEach(btn => {
      const id = btn.getAttribute('data-id');
      const existe = carrito.some(item => item.id === id);
      if (existe) {
        btn.textContent = "Quitar del carrito ❌";
        btn.style.backgroundColor = "#e74c3c";
      } else {
        btn.textContent = "Añadir al carrito 🛒";
        btn.style.backgroundColor = "#2980b9";
      }
    });

    document.querySelectorAll('.btn-fav').forEach(btn => {
      const id = btn.getAttribute('data-id');
      const existe = favoritos.some(item => item.id === id);
      if (existe) btn.classList.add('active');
      else btn.classList.remove('active');
    });
  };

  /* ==========================================================================
     2. ACCIONES DE PRODUCTOS (CARRITO Y FAVORITOS)
     ========================================================================== */
  document.querySelectorAll('.btn-agregar').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const el = e.currentTarget;
      const id = el.getAttribute('data-id');
      const index = carrito.findIndex(item => item.id === id);

      if (index !== -1) {
        carrito.splice(index, 1);
      } else {
        carrito.push({
          id: id,
          nombre: el.getAttribute('data-nombre'),
          precio: el.getAttribute('data-precio'),
          imagen: el.getAttribute('data-imagen')
        });
      }
      guardarLocal();
    });
  });

  document.querySelectorAll('.btn-fav').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const el = e.currentTarget;
      const id = el.getAttribute('data-id');
      const index = favoritos.findIndex(item => item.id === id);

      if (index !== -1) {
        favoritos.splice(index, 1);
      } else {
        favoritos.push({
          id: id,
          nombre: el.getAttribute('data-nombre'),
          precio: el.getAttribute('data-precio'),
          imagen: el.getAttribute('data-imagen')
        });
      }
      guardarLocal();
    });
  });

  /* ==========================================================================
     3. BUSCADOR CON MODAL FLUIDO
     ========================================================================== */
  const inputBusqueda = document.getElementById('inputBusqueda');
  const btnBusqueda = document.getElementById('btnBusqueda');
  const modalBusqueda = document.getElementById('modalBusqueda');
  const busquedaResultadosContainer = document.getElementById('busquedaResultadosContainer');

  const ejecutarBusquedaModal = () => {
    const query = inputBusqueda.value.toLowerCase().trim();
    if (!query) return;

    const tarjetas = document.querySelectorAll('.tarjeta-producto');
    let resultados = [];

    tarjetas.forEach(card => {
      const nombre = card.getAttribute('data-nombre').toLowerCase();
      if (nombre.includes(query)) {
        resultados.push({
          id: card.getAttribute('data-id'),
          nombre: card.getAttribute('data-nombre'),
          precio: card.getAttribute('data-precio'),
          imagen: card.getAttribute('data-imagen'),
          tipo: card.getAttribute('data-tipo'),
          detalles: card.getAttribute('data-detalles')
        });
      }
    });

    if (resultados.length > 0) {
      let html = '<div class="search-results-grid">';
      resultados.forEach(item => {
        html += `
          <div class="tarjeta-producto" style="cursor:pointer;" onclick="abrirDetalleDesdeBusqueda('${item.id}', '${item.nombre}', '${item.precio}', '${item.imagen}', '${item.tipo}', '${item.detalles}')">
            <div class="multimedia"><img src="${item.imagen}" alt="${item.nombre}"></div>
            <div class="info" style="padding: 10px;">
              <h3 style="font-size:1rem;">${item.nombre}</h3>
              <p class="precio" style="font-size:1.1rem; margin-bottom:10px;">$${parseInt(item.precio).toLocaleString()}</p>
            </div>
          </div>
        `;
      });
      html += '</div>';
      busquedaResultadosContainer.innerHTML = html;
    } else {
      busquedaResultadosContainer.innerHTML = `
        <div style="text-align:center; padding: 30px; color:#666;">
          <i class="bi bi-search" style="font-size: 3rem; color: #ccc;"></i>
          <h3 style="margin-top: 15px; color: #333;">Producto no encontrado</h3>
          <p style="font-size: 14px; margin-top: 5px;">No encontramos coincidencias para "${query}". Intenta con otro término.</p>
        </div>
      `;
    }

    modalBusqueda.classList.add('open');
  };

  if (btnBusqueda) btnBusqueda.addEventListener('click', ejecutarBusquedaModal);
  if (inputBusqueda) {
    inputBusqueda.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') ejecutarBusquedaModal();
    });
  }

  // Función global para abrir el detalle directamente desde el modal de búsqueda
  window.abrirDetalleDesdeBusqueda = (id, nombre, precio, imagen, tipo, detalles) => {
    modalBusqueda.classList.remove('open');
    productoSeleccionadoActual = { id, nombre, precio, imagen, tipo };

    document.getElementById('detailTitle').textContent = nombre;
    document.getElementById('detailImg').src = imagen;
    document.getElementById('detailCategory').textContent = `Categoría: ${tipo.toUpperCase()}`;
    document.getElementById('detailDesc').textContent = detalles;
    document.getElementById('detailPrice').textContent = `$${parseInt(precio).toLocaleString()}`;

    const enCarrito = carrito.some(i => i.id === id);
    const btnDetailCart = document.getElementById('detailBtnCart');
    if (enCarrito) {
      btnDetailCart.textContent = "Quitar del carrito ❌";
      btnDetailCart.style.backgroundColor = "#e74c3c";
    } else {
      btnDetailCart.textContent = "Añadir al carrito 🛒";
      btnDetailCart.style.backgroundColor = "#2980b9";
    }

    document.getElementById('modalProductDetail').classList.add('open');
  };


  /* ==========================================================================
     4. MODAL DE DETALLE DE PRODUCTO
     ========================================================================== */
  let productoSeleccionadoActual = null;

  document.querySelectorAll('.tarjeta-producto').forEach(card => {
    card.addEventListener('click', () => {
      const id = card.getAttribute('data-id');
      const nombre = card.getAttribute('data-nombre');
      const precio = card.getAttribute('data-precio');
      const imagen = card.getAttribute('data-imagen');
      const tipo = card.getAttribute('data-tipo');
      const detalles = card.getAttribute('data-detalles');

      productoSeleccionadoActual = { id, nombre, precio, imagen, tipo };

      document.getElementById('detailTitle').textContent = nombre;
      document.getElementById('detailImg').src = imagen;
      document.getElementById('detailCategory').textContent = `Categoría: ${tipo.toUpperCase()}`;
      document.getElementById('detailDesc').textContent = detalles;
      document.getElementById('detailPrice').textContent = `$${parseInt(precio).toLocaleString()}`;

      const enCarrito = carrito.some(i => i.id === id);
      const btnDetailCart = document.getElementById('detailBtnCart');
      if (enCarrito) {
        btnDetailCart.textContent = "Quitar del carrito ❌";
        btnDetailCart.style.backgroundColor = "#e74c3c";
      } else {
        btnDetailCart.textContent = "Añadir al carrito 🛒";
        btnDetailCart.style.backgroundColor = "#2980b9";
      }

      document.getElementById('modalProductDetail').classList.add('open');
    });
  });

  document.getElementById('detailBtnCart').addEventListener('click', () => {
    if (!productoSeleccionadoActual) return;
    const { id, nombre, precio, imagen } = productoSeleccionadoActual;
    const index = carrito.findIndex(i => i.id === id);

    if (index !== -1) {
      carrito.splice(index, 1);
    } else {
      carrito.push({ id, nombre, precio, imagen });
    }
    guardarLocal();

    const btnDetailCart = document.getElementById('detailBtnCart');
    if (carrito.some(i => i.id === id)) {
      btnDetailCart.textContent = "Quitar del carrito ❌";
      btnDetailCart.style.backgroundColor = "#e74c3c";
    } else {
      btnDetailCart.textContent = "Añadir al carrito 🛒";
      btnDetailCart.style.backgroundColor = "#2980b9";
    }
  });

  document.getElementById('detailBtnBuy').addEventListener('click', () => {
    document.getElementById('modalProductDetail').classList.remove('open');
    verificarSesionYComprar();
  });


  /* ==========================================================================
     5. CONTROL DE MODALES Y NAVEGACIÓN
     ========================================================================== */
  const modalAuth = document.getElementById('modalAuth');
  const modalFavs = document.getElementById('modalFavs');
  const modalCart = document.getElementById('modalCart');

  document.getElementById('btnAuth').addEventListener('click', () => {
    actualizarVistaAuthModal();
    modalAuth.classList.add('open');
  });

  document.getElementById('btnFavs').addEventListener('click', () => {
    renderListModal('favsListContainer', favoritos, 'favoritos');
    modalFavs.classList.add('open');
  });

  document.getElementById('btnCart').addEventListener('click', () => {
    renderCartModal();
    modalCart.classList.add('open');
  });

  document.querySelectorAll('.close-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const modalId = e.currentTarget.getAttribute('data-close');
      document.getElementById(modalId).classList.remove('open');
    });
  });

  window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
      e.target.classList.remove('open');
    }
  });


  /* ==========================================================================
     6. AUTENTICACIÓN (LOGIN Y REGISTRO)
     ========================================================================== */
  let modoRegistro = false;

  const tabLoginBtn = document.getElementById('tabLoginBtn');
  const tabRegisterBtn = document.getElementById('tabRegisterBtn');
  const authModalTitle = document.getElementById('authModalTitle');
  const nameGroup = document.getElementById('nameGroup');
  const authSubmitBtn = document.getElementById('authSubmitBtn');
  const authMessage = document.getElementById('authMessage');
  const formAuth = document.getElementById('formAuth');
  const userLoggedInfo = document.getElementById('userLoggedInfo');
  const loggedUserName = document.getElementById('loggedUserName');

  tabLoginBtn.addEventListener('click', () => {
    modoRegistro = false;
    tabLoginBtn.classList.add('active');
    tabRegisterBtn.classList.remove('active');
    authModalTitle.textContent = "Iniciar Sesión";
    nameGroup.style.display = 'none';
    authSubmitBtn.textContent = "Ingresar";
    authMessage.style.display = 'none';
  });

  tabRegisterBtn.addEventListener('click', () => {
    modoRegistro = true;
    tabRegisterBtn.classList.add('active');
    tabLoginBtn.classList.remove('active');
    authModalTitle.textContent = "Registrar Cuenta";
    nameGroup.style.display = 'block';
    authSubmitBtn.textContent = "Registrarse";
    authMessage.style.display = 'none';
  });

  const mostrarMensajeAuth = (texto, tipo) => {
    authMessage.textContent = texto;
    authMessage.className = `auth-message ${tipo}`;
    authMessage.style.display = 'block';
  };

  const actualizarVistaAuthModal = () => {
    authMessage.style.display = 'none';
    if (usuarioActual) {
      formAuth.style.display = 'none';
      document.querySelector('.auth-tabs').style.display = 'none';
      userLoggedInfo.style.display = 'block';
      loggedUserName.textContent = usuarioActual.nombre;
    } else {
      formAuth.style.display = 'block';
      document.querySelector('.auth-tabs').style.display = 'flex';
      userLoggedInfo.style.display = 'none';
    }
  };

  formAuth.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('authEmail').value.trim();
    const password = document.getElementById('authPassword').value.trim();
    const nombre = document.getElementById('authName').value.trim();

    if (!email || !password || (modoRegistro && !nombre)) {
      mostrarMensajeAuth("Por favor, completa todos los campos requeridos.", "error");
      return;
    }

    if (modoRegistro) {
      const existe = baseUsuarios.some(u => u.email === email);
      if (existe) {
        mostrarMensajeAuth("Este correo ya se encuentra registrado.", "error");
        return;
      }
      const nuevoUsuario = { nombre, email, password };
      baseUsuarios.push(nuevoUsuario);
      usuarioActual = nuevoUsuario;
      guardarLocal();
      mostrarMensajeAuth("¡Registro exitoso! Sesión iniciada.", "success");
      setTimeout(() => {
        modalAuth.classList.remove('open');
        actualizarVistaAuthModal();
      }, 1200);
    } else {
      const usuarioEncontrado = baseUsuarios.find(u => u.email === email);
      if (!usuarioEncontrado) {
        mostrarMensajeAuth("El correo electrónico no está registrado.", "error");
        return;
      }
      if (usuarioEncontrado.password !== password) {
        mostrarMensajeAuth("Contraseña incorrecta. Inténtalo de nuevo.", "error");
        return;
      }
      usuarioActual = usuarioEncontrado;
      guardarLocal();
      mostrarMensajeAuth("¡Inicio de sesión correcto!", "success");
      setTimeout(() => {
        modalAuth.classList.remove('open');
        actualizarVistaAuthModal();
      }, 1000);
    }
  });

  document.getElementById('btnLogout').addEventListener('click', () => {
    usuarioActual = null;
    guardarLocal();
    actualizarVistaAuthModal();
  });


  /* ==========================================================================
     7. FLUJO DE COMPRA Y VERIFICACIÓN DE SESIÓN
     ========================================================================== */
  const verificarSesionYComprar = () => {
    if (!usuarioActual) {
      alert("Debes iniciar sesión para realizar la compra.");
      actualizarVistaAuthModal();
      modalAuth.classList.add('open');
    } else {
      alert(`¡Compra realizada con éxito, ${usuarioActual.nombre}! Gracias por tu pedido.`);
      carrito = [];
      guardarLocal();
      document.getElementById('modalCart').classList.remove('open');
    }
  };

  document.getElementById('btnCheckout').addEventListener('click', () => {
    document.getElementById('modalCart').classList.remove('open');
    verificarSesionYComprar();
  });


  /* ==========================================================================
     8. RENDERIZAR LISTAS EN MODALES DE FAVORITOS Y CARRITO
     ========================================================================== */
  const renderListModal = (containerId, lista, tipo) => {
    const container = document.getElementById(containerId);
    if (lista.length === 0) {
      container.innerHTML = '<p style="text-align:center; color:#777; padding:15px;">No hay elementos guardados.</p>';
      return;
    }

    let html = '';
    lista.forEach((item) => {
      html += `
        <div class="modal-item">
          <img src="${item.imagen}" alt="${item.nombre}">
          <div class="modal-item-info">
            <div class="modal-item-title">${item.nombre}</div>
            <div class="modal-item-price">$${parseInt(item.precio).toLocaleString()}</div>
          </div>
          <button class="btn-remove" onclick="eliminarDelModal('${item.id}', '${tipo}')">
            <i class="bi bi-trash-fill"></i>
          </button>
        </div>
      `;
    });
    container.innerHTML = html;
  };

  const renderCartModal = () => {
    renderListModal('cartListContainer', carrito, 'carrito');
    const checkoutContainer = document.getElementById('cartCheckoutContainer');
    if (carrito.length > 0) {
      checkoutContainer.style.display = 'block';
    } else {
      checkoutContainer.style.display = 'none';
    }
  };

  window.eliminarDelModal = (id, tipo) => {
    if (tipo === 'carrito') {
      carrito = carrito.filter(i => i.id !== id);
      renderCartModal();
    } else {
      favoritos = favoritos.filter(i => i.id !== id);
      renderListModal('favsListContainer', favoritos, 'favoritos');
    }
    guardarLocal();
  };


  /* ==========================================================================
     9. CARRUSEL INTERACTIVO
     ========================================================================== */
  const slidesWrapper = document.getElementById('slidesWrapper');
  const indicators = document.querySelectorAll('.indicator');
  let currentSlide = 0;

  function showSlide(index) {
    if (index < 0) currentSlide = 2;
    else if (index > 2) currentSlide = 0;
    else currentSlide = index;

    if (slidesWrapper) slidesWrapper.style.transform = `translateX(-${currentSlide * 100}%)`;
    indicators.forEach((ind, i) => ind.classList.toggle('active', i === currentSlide));
  }

  document.getElementById('btnNext')?.addEventListener('click', () => showSlide(currentSlide + 1));
  document.getElementById('btnPrev')?.addEventListener('click', () => showSlide(currentSlide - 1));
  setInterval(() => showSlide(currentSlide + 1), 6000);

  document.querySelectorAll('.carousel-link').forEach(slide => {
    slide.addEventListener('click', () => {
      const urlDestino = slide.getAttribute('data-url');
      window.location.href = urlDestino; // Conecta con el módulo correspondiente
    });
  });


  /* ==========================================================================
     10. CHAT INTERACTIVO MEJORADO
     ========================================================================== */
  const chatPanel = document.getElementById('chat');
  const chatToggleBtn = document.getElementById('chatToggle');
  const cerrarChatBtn = document.getElementById('cerrar');
  const enviarMsgBtn = document.getElementById('enviar');
  const userInput = document.getElementById('user-input');
  const chatBody = document.getElementById('chat-body');

  if (chatToggleBtn && chatPanel) {
    chatToggleBtn.addEventListener('click', () => {
      chatPanel.classList.toggle('open');
    });
  }

  if (cerrarChatBtn && chatPanel) {
    cerrarChatBtn.addEventListener('click', () => {
      chatPanel.classList.remove('open');
    });
  }

  const enviarMensajeChat = () => {
    const texto = userInput.value.trim();
    if (texto !== '') {
      // Mensaje del usuario
      const userMsg = document.createElement('div');
      userMsg.className = 'message msg-user';
      userMsg.textContent = texto;
      chatBody.appendChild(userMsg);

      userInput.value = '';
      chatBody.scrollTop = chatBody.scrollHeight;

      // Simulación de respuesta automática inteligente del bot
      setTimeout(() => {
        const botMsg = document.createElement('div');
        botMsg.className = 'message msg-bot';
        botMsg.textContent = '¡Gracias por tu mensaje! Un asesor de Blackclothes revisará tu duda y te contactará en breve.';
        chatBody.appendChild(botMsg);
        chatBody.scrollTop = chatBody.scrollHeight;
      }, 1000);
    }
  };

  if (enviarMsgBtn) enviarMsgBtn.addEventListener('click', enviarMensajeChat);
  if (userInput) {
    userInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') enviarMensajeChat();
    });
  }

  // Inicialización global
  actualizarInterfaz();
});