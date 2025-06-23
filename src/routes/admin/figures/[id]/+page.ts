import API from "$lib/api/api.js";
import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ params }) => {
  try {
    const figure = await API.get(`/figures/${params.id}`);
    return { figure };
  } catch (error: any) {
    return {
      error: {
        message: error.message || "Failed to load figure details",
      },
    };
  }
};
