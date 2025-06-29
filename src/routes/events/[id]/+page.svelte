<script lang="ts">
  import { onMount } from "svelte";
  import API from "$lib/api/api.js";
  import { page } from "$app/stores";

  let event: any = null;
  let loading = true;
  let error: string | null = null;

  onMount(async () => {
    loading = true;
    error = null;
    try {
      event = await API.get(`/events/${$page.params.id}`);
      console.log({ event });
    } catch (err) {
      error = "Failed to load event info";
      event = null;
    } finally {
      loading = false;
    }
  });
</script>

<div class="event-detail-page">
  {#if loading}
    <div class="loading">Loading event...</div>
  {:else if error}
    <div class="error">{error}</div>
  {:else if event}
    <div class="event-detail-card">
      <h2>{event.title}</h2>
      <p>
        <strong>Date:</strong>
        {new Date(event.start_date).toLocaleDateString()}
        {#if event.end_date && event.end_date !== event.start_date}
          - {new Date(event.end_date).toLocaleDateString()}
        {/if}
      </p>
      {#if event.duration_days}
        <p>
          <strong>Duration:</strong>
          {event.duration_days} day{event.duration_days !== 1 ? "s" : ""}
        </p>
      {/if}
      {#if event.eventable}
        <p><strong>Sport:</strong> {event.eventable.title}</p>
      {/if}
      <p>
        <strong>Created:</strong>
        {new Date(event.created_at).toLocaleString()}
      </p>
      <p>
        <strong>Updated:</strong>
        {new Date(event.updated_at).toLocaleString()}
      </p>
      {#if event.summary}
        <p><strong>Summary:</strong> {event.summary}</p>
      {/if}
      <!-- Add more fields as needed -->
    </div>
  {/if}
</div>

<style>
  .event-detail-page {
    max-width: 600px;
    margin: 2rem auto;
    padding: 2rem;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.07);
  }
  .event-detail-card h2 {
    margin-top: 0;
    color: #333;
  }
  .loading {
    text-align: center;
    color: #888;
    font-size: 1.2rem;
  }
  .error {
    color: #c33;
    background: #fee;
    padding: 1rem;
    border-radius: 6px;
    text-align: center;
  }
</style>
