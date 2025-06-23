import API from "$lib/api/api.js";

/** @type {import('./$types').PageLoad} */
export async function load({ params }) {
  try {
    const sport = await API.get(`/sports/${params.id}`);
    return {
      sport,
    };
  } catch (error) {
    console.error(`Failed to load sport with id ${params.id}:`, error);
    return {
      status: 500,
      error: new Error("Could not load the sport."),
    };
  }
}
