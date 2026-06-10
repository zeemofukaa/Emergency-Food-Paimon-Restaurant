/* ===========================
   CONFIG
=========================== */
const API = "";  // empty = same origin, e.g. http://localhost:5000


function showToast(message, isError = false) {
  const existing = document.getElementById('toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'toast';
  toast.innerHTML = message;
  toast.style.cssText = `
    position: fixed;
    bottom: 32px;
    left: 50%;
    transform: translateX(-50%);
    background: ${isError ? 'rgb(180, 60, 60)' : 'rgb(91, 70, 44)'};
    color: rgb(236, 210, 174);
    padding: 14px 28px;
    border-radius: 30px;
    font-size: 16px;
    border: 2px solid rgb(236, 210, 174);
    z-index: 9999;
    opacity: 0;
    transition: opacity 0.3s ease;
    font-family: 'Times New Roman', Times, serif;
    box-shadow: 0 4px 12px rgba(0,0,0,0.4);
  `;

  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.style.opacity = '1');
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}


/* ===========================
   AUTH STATE
=========================== */
let token = localStorage.getItem("token") || null;
let currentUser = JSON.parse(localStorage.getItem("user") || "null");
let isSignupMode = false;

function getHeaders() {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

function updateAuthButton() {
  const btn = document.getElementById("authBtn");
  if (currentUser) {
    btn.textContent = `Logout (${currentUser.name.split(" ")[0]})`;
  } else {
    btn.textContent = "Login";
  }
}

/* ===========================
   AUTH MODAL
=========================== */
function openAuthModal() {
  document.body.classList.add("modal-open");
  if (currentUser) {
    // already logged in — logout instead
    token = null;
    currentUser = null;
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    updateAuthButton();
    resetCartUI();
    cartQty.textContent = 0;
    return;
  }
  document.getElementById("authOverlay").classList.add("active");
  document.getElementById("authModal").classList.add("active");
}

function closeAuthModal() {
  document.body.classList.remove("modal-open");
  document.getElementById("authOverlay").classList.remove("active");
  document.getElementById("authModal").classList.remove("active");
  document.getElementById("authError").textContent = "";
}

document.getElementById('authPassword').addEventListener('keydown', e => {
  if (e.key === 'Enter') submitAuth();
});

document.getElementById('authEmail').addEventListener('keydown', e => {
  if (e.key === 'Enter') submitAuth();
});

document.getElementById('authName').addEventListener('keydown', e => {
  if (e.key === 'Enter') submitAuth();
});

function toggleAuthMode() {
  isSignupMode = !isSignupMode;
  document.getElementById("authTitle").textContent = isSignupMode ? "Sign Up" : "Login";
  document.getElementById("authName").style.display = isSignupMode ? "block" : "none";
  document.querySelector(".auth-submit-btn").textContent = isSignupMode ? "Sign Up" : "Login";
  document.querySelector(".auth-switch").innerHTML = isSignupMode
    ? `Already have an account? <span onclick="toggleAuthMode()">Login</span>`
    : `Don't have an account? <span onclick="toggleAuthMode()">Sign up</span>`;
  document.getElementById("authError").textContent = "";
}

async function submitAuth() {
  const email    = document.getElementById("authEmail").value.trim();
  const password = document.getElementById("authPassword").value;
  const name     = document.getElementById("authName").value.trim();
  const errorEl  = document.getElementById("authError");

  // basic presence check
  if (!email || !password) return (errorEl.textContent = "Please fill in all fields");
  if (isSignupMode && !name) return (errorEl.textContent = "Please enter your name");

  // email format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return (errorEl.textContent = "Please enter a valid email address");

  // password length check
  if (password.length < 6) return (errorEl.textContent = "Password must be at least 6 characters");

  // name sanity check (signup only)
  if (isSignupMode && name.length < 2) return (errorEl.textContent = "Please enter your full name");

  const url  = isSignupMode ? `${API}/api/auth/signup` : `${API}/api/auth/login`;
  const body = isSignupMode ? { name, email, password } : { email, password };

  try {
    const res  = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json();

    if (!res.ok) return (errorEl.textContent = data.error || "Something went wrong");

    token       = data.token;
    currentUser = data.user;
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(currentUser));

    updateAuthButton();
    closeAuthModal();
    loadCart(); // load their saved cart from DB
  } catch (err) {
    errorEl.textContent = "Network error, try again";
  }
}


/* ===========================
   NAVBAR TOGGLE
=========================== */
const hamburger = document.querySelector(".hamburger");
const navMenu   = document.querySelector(".nav-menu");
const cartBtn   = document.querySelector("#btnCart");
const cartMenu  = document.querySelector(".cart-menu");

hamburger.addEventListener("click", () => {
  hamburger.classList.toggle("active");
  navMenu.classList.toggle("active");
});

document.querySelectorAll(".nav-link, #btnCart").forEach(link => {
  link.addEventListener("click", () => {
    hamburger.classList.remove("active");
    navMenu.classList.remove("active");
  });
});


/* ===========================
   CART TOGGLE
=========================== */
cartBtn.addEventListener("click", () => {
  cartBtn.classList.toggle("active");
  cartMenu.classList.toggle("active");
});

document.querySelectorAll(".nav-link, .hamburger, .buymoreBtn").forEach(el => {
  el.addEventListener("click", () => {
    cartBtn.classList.remove("active");
    cartMenu.classList.remove("active");
  });
});


/* ===========================
   SCROLL ACTIVE LINK
=========================== */
const sections = document.querySelectorAll("section");
const navLinks = document.querySelectorAll(".nav-link");

window.addEventListener("scroll", () => {
  const top = window.scrollY;
  sections.forEach(sec => {
    const offset = sec.offsetTop;
    const height = sec.offsetHeight;
    const id     = sec.getAttribute("id");
    if (top >= offset && top < offset + height) {
      navLinks.forEach(link => link.classList.remove("active"));
      const activeLink = document.querySelector(`.nav-link[href*="${id}"]`);
      if (activeLink) activeLink.classList.add("active");
    }
  });
});

/* ===========================
   SCROLL FADE-IN
=========================== */
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, { threshold: 0.15 });

document.querySelectorAll('.about_us_content, .menu_list_heading, .card')
  .forEach(el => {
    el.classList.add('fade-in');
    observer.observe(el);
  });

/* ===========================
   MENU FETCH + RENDER
=========================== */
fetch(`${API}/api/menu`)
  .then(res => res.json())
  .then(menu => buildMenu(menu))
  .catch(err => console.error("Menu load error:", err));

function buildMenu(menu) {
  const container = document.getElementById("menu-container");
  const categories = [...new Set(menu.map(item => item.category))];

  categories.forEach(category => {
    const section = document.createElement("div");
    section.id = category;
    section.innerHTML = `
      <h3 class="menu_list_heading">${formatCategoryName(category)}</h3>
      <div class="menu_div">
        <div class="left_menu"  data-category="${category}" data-side="left"></div>
        <div class="right_menu" data-category="${category}" data-side="right"></div>
      </div>
    `;
    container.appendChild(section);
  });

  renderCards(menu);

  document.querySelectorAll('.about_us_content, .menu_list_heading, .card')
    .forEach(el => {
      el.classList.add('fade-in');
      observer.observe(el);
    });
}

function renderCards(menu) {
  const categoryCounts = {};

  menu.forEach(item => {
    const cat = item.category;
    if (!categoryCounts[cat]) categoryCounts[cat] = 0;

    const side = categoryCounts[cat] % 2 === 0 ? "left" : "right";
    categoryCounts[cat]++;

    const column = document.querySelector(
      `[data-category="${cat}"][data-side="${side}"]`
    );
    if (!column) return;
    column.insertAdjacentHTML("beforeend", createMenuCard(item));
  });
}

function createMenuCard(item) {
  return `
    <div class="card">
      <div class="part2">
        <img src="${item.image}" alt="${item.name}">
        <div>
          <h4>${item.name}</h4>
          <p>${item.description}</p>
          <h4 class="price">Price: ${item.price}</h4>
          <button
            class="add_to_cart"
            data-id="${item._id}"
            data-name="${item.name}"
            data-price="${item.price}">
            Add to cart
          </button>
        </div>
      </div>
    </div>
  `;
}

function formatCategoryName(category) {
  if (category === "main") return "Main Course";
  return category.charAt(0).toUpperCase() + category.slice(1);
}


/* ===========================
   BUY MORE BUTTON
=========================== */
document.querySelector(".buymoreBtn").addEventListener("click", () => {
  document.querySelector("#menu")?.scrollIntoView({ behavior: "smooth" });
});


/* ===========================
   CART UI HELPERS
=========================== */
const cartItemsContainer = document.querySelector(".cart-items-js");
const cartQty            = document.querySelector(".cartQty");

function updateCartCount() {
  const quantities = document.querySelectorAll(".cart-item .quantity");
  let total = 0;
  quantities.forEach(qty => (total += parseInt(qty.textContent)));
  cartQty.textContent = total;
}

function resetCartUI() {
  cartItemsContainer.innerHTML = "Your Cart is Empty!";
  cartItemsContainer.classList.add("empty");
  cartQty.textContent = 0;
}

function renderCartFromDB(cart) {
  if (!cart.items || cart.items.length === 0) {
    resetCartUI();
    return;
  }

  cartItemsContainer.innerHTML = "";
  cartItemsContainer.classList.remove("empty");

  cart.items.forEach(item => {
    const div = document.createElement("div");
    div.classList.add("cart-item");
    div.dataset.name   = item.name;
    div.dataset.cartid = item._id; // MongoDB subdocument _id

    div.innerHTML = `
      <div class="cart-left">
        <p>${item.name} - ₹${item.price}</p>
      </div>
      <div class="cart-controls">
        <button class="decrease-qty">-</button>
        <span class="quantity">${item.quantity}</span>
        <button class="increase-qty">+</button>
      </div>
      <button class="remove-item">Remove</button>
    `;

    cartItemsContainer.appendChild(div);
  });

  updateCartCount();
}


/* ===========================
   CART API CALLS
=========================== */
async function loadCart() {
  if (!token) return;
  try {
    const res  = await fetch(`${API}/api/cart`, { headers: getHeaders() });
    const cart = await res.json();
    renderCartFromDB(cart);
  } catch (err) {
    console.error("Failed to load cart:", err);
  }
}

async function addToCartAPI(menuItemId, name, price) {
  if (!token) {
    openAuthModal();
    return;
  }
  try {
    const res  = await fetch(`${API}/api/cart`, {
      method:  "POST",
      headers: getHeaders(),
      body:    JSON.stringify({ menuItemId, name, price, quantity: 1 }),
    });
    const cart = await res.json();
    renderCartFromDB(cart);
  } catch (err) {
    console.error("Failed to add to cart:", err);
  }
}

async function updateQtyAPI(cartItemId, quantity) {
  try {
    const res  = await fetch(`${API}/api/cart/${cartItemId}`, {
      method:  "PUT",
      headers: getHeaders(),
      body:    JSON.stringify({ quantity }),
    });
    const cart = await res.json();
    renderCartFromDB(cart);
  } catch (err) {
    console.error("Failed to update quantity:", err);
  }
}

async function removeFromCartAPI(cartItemId, itemName) {
  try {
    const res  = await fetch(`${API}/api/cart/${cartItemId}`, {
      method:  "DELETE",
      headers: getHeaders(),
    });
    const cart = await res.json();

    // reset button text for removed item
    document.querySelectorAll(".add_to_cart").forEach(btn => {
      if (btn.dataset.name === itemName) btn.textContent = "Add to cart";
    });

    renderCartFromDB(cart);
  } catch (err) {
    console.error("Failed to remove from cart:", err);
  }
}


/* ===========================
   ADD TO CART CLICK
=========================== */
document.addEventListener("click", e => {
  if (!e.target.classList.contains("add_to_cart")) return;

  const button = e.target;
  if (button.textContent === "Added") return;

  button.textContent = "Added";

  const { id, name, price } = button.dataset;
  addToCartAPI(id, name, parseFloat(price));
});


/* ===========================
   CART ITEM CONTROLS
=========================== */
cartItemsContainer.addEventListener("click", e => {
  const cartItem   = e.target.closest(".cart-item");
  if (!cartItem) return;

  const cartItemId = cartItem.dataset.cartid;
  const itemName   = cartItem.dataset.name;
  const qtyEl      = cartItem.querySelector(".quantity");
  const currentQty = parseInt(qtyEl.textContent);

  if (e.target.classList.contains("increase-qty")) {
    updateQtyAPI(cartItemId, currentQty + 1);
  }

  if (e.target.classList.contains("decrease-qty")) {
    if (currentQty <= 1) {
      removeFromCartAPI(cartItemId, itemName);
    } else {
      updateQtyAPI(cartItemId, currentQty - 1);
    }
  }

  if (e.target.classList.contains("remove-item")) {
    removeFromCartAPI(cartItemId, itemName);
  }
});


/* ===========================
   CHECKOUT
=========================== */
document.querySelector(".checkoutBtn").addEventListener("click", async e => {
  e.preventDefault();

  if (!token) {
    openAuthModal();
    return;
  }

  try {
    const res   = await fetch(`${API}/api/orders`, {
      method:  "POST",
      headers: getHeaders(),
    });
    const order = await res.json();

    if (!res.ok) return showToast(order.error || "Checkout failed", true);

    showToast(`Order placed! Total: ₹${order.totalPrice}`);
    resetCartUI();

    // reset all Add to cart buttons
    document.querySelectorAll(".add_to_cart").forEach(btn => {
      btn.textContent = "Add to cart";
    });

  } catch (err) {
    showToast("Checkout failed, please try again", true);
  }
});


/* ===========================
   INIT
=========================== */
updateAuthButton();
if (token) loadCart(); // restore cart on page load if already logged in

/* ===========================
   RESERVATION
=========================== */
function openReservationModal() {
  document.body.classList.add("modal-open");
  if (!token) {
    showToast('Please login to make a reservation');
    openAuthModal();
    return;
  }

  // set minimum date to today
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('resDate').min = today;

  // prefill name if logged in
  if (currentUser) document.getElementById('resName').value = currentUser.name;

  document.getElementById('reservationOverlay').classList.add('active');
  document.getElementById('reservationModal').classList.add('active');
}

function closeReservationModal() {
  document.getElementById('reservationOverlay').classList.remove('active');
  document.getElementById('reservationModal').classList.remove('active');
  document.getElementById('reservationError').textContent = '';
  document.getElementById('myBookings').style.display = 'none';
  document.querySelector('.view-bookings-link').classList.remove('open');
  document.body.classList.remove("modal-open");
}

async function submitReservation() {
  const errorEl = document.getElementById('reservationError');
  const name    = document.getElementById('resName').value.trim();
  const date    = document.getElementById('resDate').value;
  const time    = document.getElementById('resTime').value;
  const guests  = document.getElementById('resGuests').value;
  const note    = document.getElementById('resNote').value.trim();

  if (!name || !date || !time || !guests) {
    return (errorEl.textContent = 'Please fill in all required fields');
  }

  if (parseInt(guests) < 1 || parseInt(guests) > 20) {
    return (errorEl.textContent = 'Guests must be between 1 and 20');
  }

  try {
    const res  = await fetch(`${API}/api/reservations`, {
      method:  'POST',
      headers: getHeaders(),
      body:    JSON.stringify({ name, date, time, guests, note }),
    });
    const data = await res.json();

    if (!res.ok) return (errorEl.textContent = data.error || 'Booking failed');

    closeReservationModal();
    showToast(`<div class="toast-content">
      Table booked for ${date} at ${time}
      <span class="material-symbols-outlined">restaurant</span>
    </div>`);

  } catch (err) {
    errorEl.textContent = 'Network error, try again';
  }
}

async function deleteReservation(id) {
  try {
    const res = await fetch(`${API}/api/reservations/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });

    const data = await res.json();

    if (!res.ok) {
      return showToast(data.error || 'Failed to cancel reservation', true);
    }

    showToast('Reservation cancelled!');

    // refresh bookings list
    toggleMyBookings();
    toggleMyBookings();

  } catch (err) {
    showToast('Network error', true);
  }
}

async function toggleMyBookings() {
  const container = document.getElementById('myBookings');
  const link      = document.querySelector('.view-bookings-link');

  if (container.style.display === 'flex') {
    container.style.display = 'none';
    link.classList.remove('open');
    return;
  }

  try {
    const res  = await fetch(`${API}/api/reservations`, { headers: getHeaders() });
    const data = await res.json();

    if (!data.length) {
      container.innerHTML = `<p style="color:rgba(236,210,174,0.6);text-align:center;font-size:13px">No bookings yet</p>`;
    } else {
      container.innerHTML = data.map(r => `
        <div class="booking-card">
          <strong>${r.name}</strong> · ${r.guests} guest${r.guests > 1 ? 's' : ''}

          <div class="booking-row">
            <span class="material-symbols-outlined booking-icon">
              calendar_month
            </span>
            <span>${r.date} at ${r.time}</span>
          </div>

          ${r.note ? `
            <div class="booking-row">
              <span class="material-symbols-outlined booking-icon">
                edit_note
              </span>
              <span>${r.note}</span>
            </div>
          ` : ''}
          <button
            class="delete-booking-btn"
            onclick="deleteReservation('${r._id}')"
          >
            Cancel Reservation
          </button>
        </div>
      `).join('');
    }

    container.style.display = 'flex';
    link.classList.add('open');
    

  } catch (err) {
    container.innerHTML = `<p style="color:#ff8a80;font-size:13px">Failed to load bookings</p>`;
    container.style.display = 'block';
  }
}