<script>
  import { onMount } from "svelte";
  import API from "$lib/api/api.js";

  let events = [];
  let loading = false;
  let error = null;
  let selectedEvent = null;
  let showForm = false;
  let formData = {
    title: "",
    eventable_type: "",
    eventable_id: "",
  };

  // Load all events
  async function loadEvents() {
    loading = true;
    error = null;
    try {
      events = await API.get("/events");
    } catch (err) {
      error = "Failed to load events";
      console.error(err);
    } finally {
      loading = false;
    }
  }

  // Create a new event
  async function createEvent() {
    try {
      const newEvent = await API.post("/events", { event: formData });
      events = [...events, newEvent];
      resetForm();
      showForm = false;
    } catch (err) {
      error = "Failed to create event";
      console.error(err);
    }
  }

  // Update an event
  async function updateEvent(id) {
    try {
      const updatedEvent = await API.put(`/events/${id}`, { event: formData });
      events = events.map((e) => (e.id === id ? updatedEvent : e));
      resetForm();
      showForm = false;
    } catch (err) {
      error = "Failed to update event";
      console.error(err);
    }
  }

  // Delete an event
  async function deleteEvent(id) {
    if (confirm("Are you sure you want to delete this event?")) {
      try {
        await API.delete(`/events/${id}`);
        events = events.filter((e) => e.id !== id);
      } catch (err) {
        error = "Failed to delete event";
        console.error(err);
      }
    }
  }

  // Edit an event
  function editEvent(event) {
    selectedEvent = event;
    formData = { ...event };
    showForm = true;
  }

  // Reset form
  function resetForm() {
    formData = { title: "", eventable_type: "", eventable_id: "" };
    selectedEvent = null;
  }

  // Handle form submission
  function handleSubmit() {
    if (selectedEvent) {
      updateEvent(selectedEvent.id);
    } else {
      createEvent();
    }
  }

  // Format date for display
  function formatDate(dateString) {
    if (!dateString) return "No date set";
    return new Date(dateString).toLocaleDateString();
  }

  onMount(() => {
    loadEvents();
  });
</script>

<div class="events-manager">
  <h2>Events Management</h2>

  {#if error}
    <div class="error">{error}</div>
  {/if}

  <button
    on:click={() => {
      showForm = true;
      resetForm();
    }}
    class="btn-primary"
  >
    Add New Event
  </button>

  {#if showForm}
    <div class="form-overlay">
      <div class="form-container">
        <h3>{selectedEvent ? "Edit Event" : "Create New Event"}</h3>
        <form on:submit|preventDefault={handleSubmit}>
          <div class="form-group">
            <label for="title">Title:</label>
            <input
              id="title"
              type="text"
              bind:value={formData.title}
              required
            />
          </div>

          <div class="form-group">
            <label for="eventable_type">Eventable Type:</label>
            <input
              id="eventable_type"
              type="text"
              bind:value={formData.eventable_type}
              required
            />
          </div>

          <div class="form-group">
            <label for="eventable_id">Eventable ID:</label>
            <input
              id="eventable_id"
              type="number"
              bind:value={formData.eventable_id}
              required
            />
          </div>

          <div class="form-actions">
            <button type="submit" class="btn-primary">
              {selectedEvent ? "Update" : "Create"}
            </button>
            <button
              type="button"
              on:click={() => {
                showForm = false;
                resetForm();
              }}
              class="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  {/if}

  {#if loading}
    <div class="loading">Loading events...</div>
  {:else}
    <div class="events-list">
      {#each events as event (event.id)}
        <div class="event-card">
          <h4>{event.title}</h4>
          <p><strong>Eventable Type:</strong> {event.eventable_type}</p>
          <p><strong>Eventable ID:</strong> {event.eventable_id}</p>
          <p>
            <strong>Created:</strong>
            {new Date(event.created_at).toLocaleDateString()}
          </p>
          <p>
            <strong>Updated:</strong>
            {new Date(event.updated_at).toLocaleDateString()}
          </p>
          <div class="card-actions">
            <button on:click={() => editEvent(event)} class="btn-secondary"
              >Edit</button
            >
            <button on:click={() => deleteEvent(event.id)} class="btn-danger"
              >Delete</button
            >
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .events-manager {
    padding: 20px;
    max-width: 1200px;
    margin: 0 auto;
  }

  .error {
    background-color: #fee;
    color: #c33;
    padding: 10px;
    border-radius: 4px;
    margin-bottom: 20px;
  }

  .loading {
    text-align: center;
    padding: 20px;
    color: #666;
  }

  .btn-primary {
    background-color: #e83e8c;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 4px;
    cursor: pointer;
    margin-bottom: 20px;
  }

  .btn-secondary {
    background-color: #6c757d;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    margin-right: 8px;
  }

  .btn-danger {
    background-color: #dc3545;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
  }

  .form-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .form-container {
    background-color: white;
    padding: 30px;
    border-radius: 8px;
    min-width: 400px;
  }

  .form-group {
    margin-bottom: 15px;
  }

  .form-group label {
    display: block;
    margin-bottom: 5px;
    font-weight: bold;
  }

  .form-group input[type="text"],
  .form-group input[type="number"],
  .form-group input[type="datetime-local"],
  .form-group textarea {
    width: 100%;
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-family: inherit;
  }

  .form-group input[type="checkbox"] {
    margin-right: 8px;
  }

  .form-actions {
    display: flex;
    gap: 10px;
    margin-top: 20px;
  }

  .events-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 20px;
    margin-top: 20px;
  }

  .event-card {
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 20px;
    background-color: #f9f9f9;
  }

  .event-card h4 {
    margin: 0 0 10px 0;
    color: #333;
  }

  .event-card p {
    margin: 5px 0;
    color: #666;
    line-height: 1.4;
  }

  .card-actions {
    margin-top: 15px;
  }
</style>
