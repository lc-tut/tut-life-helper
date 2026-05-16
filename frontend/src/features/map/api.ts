export async function fetchBuildings() {
  try {
    const res = await fetch('http://localhost:8000/api/buildings');
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    const data = await res.json();
    return data;
  } catch (err) {
    console.error("Failed to fetch buildings:", err);
    throw err;
  }
}
