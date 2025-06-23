import API from "$lib/api/api.js";

/** @type {import('./$types').PageLoad} */
export async function load({ params }) {
  try {
    const story = await API.get(`/stories/${params.id}`);
    return {
      story,
    };
  } catch (error) {
    console.error(`Failed to load story with id ${params.id}:`, error);
    // Correctly return an error object that SvelteKit understands
    return {
      status: 500,
      error: new Error("Could not load the story."),
    };
  }
}
