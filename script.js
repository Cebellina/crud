const API = "https://crud-api-uvfv.onrender.com";

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

    if (!res.ok) {
      throw new Error(`Fel ${res.status}: ${res.statusText}`);
    }

    if (res.status === 204) return null;

    return await res.json();
  } catch (err) {
    console.error(err);
    errorMsg.textContent = `Fel vid API-anrop: ${err.message}`;
    setTimeout(() => (errorMsg.textContent = ""), 5000);
    return null;
  }
}

async function loadHotels() {
  if (hotelCache.length) return hotelCache;

  const data = await apiFetch("/hotels");
  if (!data) return [];

  hotelCache = data;

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
    option1.value = String(h.id);
    option1.textContent = `${h.name} (${h.stars}★)`;
    hotelSelect.appendChild(option1);

    const option2 = document.createElement("option");
    option2.value = String(h.id);
    option2.textContent = `${h.name} (${h.stars}★)`;
    filterHotel.appendChild(option2);
  });

  return hotelCache;
}

async function getDestinations() {
  try {
    const destinations = await apiFetch("/destinations");
    const hotels = await loadHotels();

    if (!destinations) return;

    const filterId = filterHotel.value;

    const filtered = filterId
      ? destinations.filter(d => String(d.hotelId) === String(filterId))
      : destinations;

    container.innerHTML = "";

    if (!filtered.length) {
      const msg = document.createElement("div");
      msg.className = "no-results";
      msg.textContent = "Inga resor matchar valet.";
      container.appendChild(msg);
      return;
    }

    filtered.forEach(dest => {
      const hotel = hotels.find(h => String(h.id) === String(dest.hotelId));

      const card = document.createElement("div");
      card.classList.add("card");

      const h3 = document.createElement("h3");
      h3.textContent = dest.name;

      const pCountry = document.createElement("p");
      pCountry.textContent = dest.country;

      const pPrice = document.createElement("p");
      pPrice.textContent = `${dest.price} kr`;

      const pHotel = document.createElement("p");
      pHotel.textContent = hotel
        ? `Hotell: ${hotel.name} (${hotel.stars}★)`
        : "Hotell: Okänt";

      const editBtn = document.createElement("button");
      editBtn.textContent = "Redigera";
      editBtn.onclick = () => editDestination(dest.id);

      const viewBtn = document.createElement("button");
      viewBtn.textContent = "Visa";
      viewBtn.onclick = () => viewDestination(dest.id);

      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "Ta bort";
      deleteBtn.onclick = () => deleteDestination(dest.id);

      card.append(h3, pCountry, pPrice, pHotel, editBtn, viewBtn, deleteBtn);
      container.appendChild(card);
    });
  } catch (err) {
    console.error(err);
  }
}

async function viewDestination(id) {
  const dest = await apiFetch(`/destinations/${id}`);
  const hotels = await loadHotels();

  if (!dest) return;

  const hotel = hotels.find(h => String(h.id) === String(dest.hotelId));

  modalTitle.textContent = dest.name;
  modalCountry.textContent = `Land: ${dest.country}`;
  modalPrice.textContent = `Pris: ${dest.price} kr`;
  modalHotel.textContent = hotel
    ? `Hotell: ${hotel.name} (${hotel.stars}★)`
    : "Hotell: Okänt";

  modal.classList.remove("hidden");
}

closeModal.onclick = () => modal.classList.add("hidden");
modal.onclick = e => {
  if (e.target === modal) modal.classList.add("hidden");
};

form.addEventListener("submit", async e => {
  e.preventDefault();

  const destination = {
    name: nameInput.value.trim(),
    country: countryInput.value.trim(),
    price: Number(priceInput.value),
    hotelId: String(hotelSelect.value)
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
  if (!data) return;

  idInput.value = data.id;
  nameInput.value = data.name;
  countryInput.value = data.country;
  priceInput.value = data.price;
  hotelSelect.value = String(data.hotelId);

  form.querySelector("button").textContent = "Uppdatera resa";
}

async function deleteDestination(id) {
  if (!confirm("Är du säker på att du vill ta bort resan?")) return;

  await apiFetch(`/destinations/${id}`, { method: "DELETE" });
  getDestinations();
}

filterHotel.addEventListener("change", getDestinations);

(async function init() {
  await loadHotels();
  await getDestinations();
})();