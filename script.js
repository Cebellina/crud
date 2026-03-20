const API = "https://crud-api.onrender.com";

const modal = document.getElementById("modal");
const closeModal = document.getElementById("closeModal");
const modalTitle = document.getElementById("modalTitle");
const modalCountry = document.getElementById("modalCountry");
const modalPrice = document.getElementById("modalPrice");
const modalHotel = document.getElementById("modalHotel");

const container = document.getElementById("destinations");
const errorMsg = document.getElementById("error");
const form = document.getElementById("form");
const idInput = document.getElementById("id");
const nameInput = document.getElementById("name");
const countryInput = document.getElementById("country");
const priceInput = document.getElementById("price");
const hotelSelect = document.getElementById("hotelSelect");
const filterHotel = document.getElementById("filterHotel");

let hotelCache = [];

async function apiFetch(endpoint, options = {}) {
  try {
    const res = await fetch(`${API}${endpoint}`, options);
    if (!res.ok) throw new Error(`Fel ${res.status}: ${res.statusText}`);
    if (res.status !== 204) return await res.json();
    return null;
  } catch (err) {
    errorMsg.textContent = `Fel vid API-anrop: ${err.message}`;
    setTimeout(() => (errorMsg.textContent = ""), 5000);
    throw err;
  }
}

async function loadHotels() {
  if (hotelCache.length) return hotelCache;
  hotelCache = await apiFetch("/hotels");
  hotelSelect.innerHTML = "";
  filterHotel.innerHTML = "";

  const defaultOption1 = document.createElement("option");
  defaultOption1.value = "";
  defaultOption1.textContent = "Välj hotell";
  hotelSelect.appendChild(defaultOption1);

  const defaultOption2 = document.createElement("option");
  defaultOption2.value = "";
  defaultOption2.textContent = "Alla hotell";
  filterHotel.appendChild(defaultOption2);

  hotelCache.forEach(h => {
    const option1 = document.createElement("option");
    option1.value = h.id;
    option1.textContent = `${h.name} (${h.stars}★)`;
    hotelSelect.appendChild(option1);

    const option2 = document.createElement("option");
    option2.value = h.id;
    option2.textContent = `${h.name} (${h.stars}★)`;
    filterHotel.appendChild(option2);
  });

  return hotelCache;
}

async function getDestinations() {
  const [destinations, hotels] = await Promise.all([apiFetch("/destinations"), loadHotels()]);

  const filterId = filterHotel.value;
  const filtered = filterId ? destinations.filter(d => d.hotelId === filterId) : destinations;

  container.innerHTML = "";

  if (!filtered.length) {
    const msg = document.createElement("div");
    msg.className = "no-results";
    msg.textContent = "Inga resor matchar valet.";
    container.appendChild(msg);
    return;
  }

  filtered.forEach(dest => {
    const hotel = hotels.find(h => h.id === dest.hotelId);

    const card = document.createElement("div");
    card.classList.add("card");

    const h3 = document.createElement("h3");
    h3.textContent = dest.name;

    const pCountry = document.createElement("p");
    pCountry.textContent = dest.country;

    const pPrice = document.createElement("p");
    pPrice.textContent = `${dest.price} kr`;

    const pHotel = document.createElement("p");
    pHotel.textContent = hotel ? `Hotell: ${hotel.name} (${hotel.stars}★)` : "Hotell: Okänt";

    const editBtn = document.createElement("button");
    editBtn.textContent = "Redigera";
    editBtn.addEventListener("click", () => editDestination(dest.id));

    const viewBtn = document.createElement("button");
    viewBtn.textContent = "Visa";
    viewBtn.addEventListener("click", () => viewDestination(dest.id));

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Ta bort";
    deleteBtn.addEventListener("click", () => deleteDestination(dest.id));

    card.append(h3, pCountry, pPrice, pHotel, editBtn, viewBtn, deleteBtn);
    container.appendChild(card);
  });
}

async function viewDestination(id) {
  const [dest, hotels] = await Promise.all([apiFetch(`/destinations/${id}`), loadHotels()]);
  const hotel = hotels.find(h => h.id === dest.hotelId);

  modalTitle.textContent = dest.name;
  modalCountry.textContent = `Land: ${dest.country}`;
  modalPrice.textContent = `Pris: ${dest.price} kr`;
  modalHotel.textContent = hotel ? `Hotell: ${hotel.name} (${hotel.stars}★)` : "Hotell: Okänt";

  modal.classList.remove("hidden");
}

closeModal.addEventListener("click", () => modal.classList.add("hidden"));
modal.addEventListener("click", e => { if (e.target === modal) modal.classList.add("hidden"); });

form.addEventListener("submit", async e => {
  e.preventDefault();

  const destination = {
    name: nameInput.value.trim(),
    country: countryInput.value.trim(),
    price: Number(priceInput.value),
    hotelId: hotelSelect.value
  };

  if (!destination.name || !destination.country || isNaN(destination.price) || !destination.hotelId) {
    errorMsg.textContent = "Alla fält måste fyllas i korrekt.";
    setTimeout(() => (errorMsg.textContent = ""), 5000);
    return;
  }

  if (idInput.value) {
    await apiFetch(`/destinations/${idInput.value}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(destination)
    });
  } else {
    destination.id = Date.now().toString();
    await apiFetch("/destinations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(destination)
    });
  }

  form.reset();
  idInput.value = "";
  form.querySelector("button").textContent = "Lägg till resa";
  getDestinations();
});

async function editDestination(id) {
  const data = await apiFetch(`/destinations/${id}`);
  idInput.value = data.id;
  nameInput.value = data.name;
  countryInput.value = data.country;
  priceInput.value = data.price;
  hotelSelect.value = data.hotelId;
  form.querySelector("button").textContent = "Uppdatera resa";
}

async function deleteDestination(id) {
  if (!confirm("Är du säker på att du vill ta bort resan?")) return;
  await apiFetch(`/destinations/${id}`, { method: "DELETE" });
  getDestinations();
}

filterHotel.addEventListener("change", getDestinations);

loadHotels().then(() => getDestinations());