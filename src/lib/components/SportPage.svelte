<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { goto } from "$app/navigation";
  import API from "$lib/api/api.js";
  import Page from "$lib/components/Pages/Page.svelte";
  import { user } from "$lib/stores/user";
  import { get } from "svelte/store";

  export let sportId: string | number;

  // All interfaces and state from the original +page.svelte
  interface Sport {
    id: number;
    title: string;
    sport_id?: number;
    position?: number;
    created_at: string;
    updated_at?: string;
    pages?: Page[];
  }
  interface Story {
    id: number;
    title: string;
    summary?: string;
    body?: string;
    sport_id: number;
    created_at: string;
    updated_at?: string;
    pictures?: { image_url: string; cover: boolean }[];
  }
  interface Figure {
    id: number;
    title: string;
    summary?: string;
    sport_id: number;
    position?: number;
    created_at: string;
    updated_at?: string;
    pictures?: { image_url: string; cover: boolean }[];
  }
  interface SportRule {
    id: number;
    title: string;
    summary?: string;
    body?: string;
    sport_id: number;
    created_at: string;
    updated_at?: string;
  }
  interface Event {
    id: number;
    title: string;
    start_date: string;
    eventable_type: string;
    eventable_id: number;
    created_at: string;
    updated_at: string;
    end_date?: string;
  }
  interface Page {
    id: number;
    title: string;
    pageable_type: string;
    pageable_id: number;
    created_at: string;
    updated_at?: string;
    slug?: string;
    position?: number;
    level?: number;
    full_path?: string;
  }

  let sport: Sport | null = null;
  let stories: Story[] = [];
  let figures: Figure[] = [];
  let sportRules: SportRule[] = [];
  let events: Event[] = [];
  let pages: Page[] = [];
  let loading = true;
  let storiesLoading = false;
  let figuresLoading = false;
  let rulesLoading = false;
  let eventsLoading = false;
  let generatingEvent = false;
  let error: string | null = null;
  let pagesLoading = false;
  let creatingPage = false;
  let createPageError = "";

  // ... (all the rest of the state and functions from +page.svelte)
  // ... (copy all logic, markup, and styles)

  onMount(() => {
    loadSport();
  });

  async function loadSport() {
    loading = true;
    error = null;
    try {
      sport = await API.get(`/sports/${sportId}`);
      // ... (load related data as in original page)
    } catch (err) {
      error = "Failed to load sport";
      console.error(err);
    } finally {
      loading = false;
    }
  }

  // ... (rest of the logic)
</script>

<!-- Copy the entire markup from +page.svelte here, replacing $page.params.id with sportId where needed -->

<style>
  /* Copy all styles from +page.svelte */
</style>
