<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import API from "$lib/api/api.js";

  interface SportRule {
    id: number;
    title: string;
    summary?: string;
    body?: string;
    sport_id: number;
    created_at: string;
    updated_at?: string;
  }

  let sportRules: SportRule[] = [];
  let loading = false;
  let error: string | null = null;
  let selectedRule: SportRule | null = null;
  let showForm = false;
  let formData = {
    title: "",
    summary: "",
    body: "",
    sport_id: "",
  };

  // Load all sport rules
  async function loadSportRules() {
    loading = true;
    error = null;
    try {
      sportRules = await API.get("/sport_rules");
    } catch (err) {
      error = "Failed to load sport rules";
      console.error(err);
    } finally {
      loading = false;
    }
  }

  // Create a new sport rule
  async function createSportRule() {
    try {
      const newRule = await API.post("/sport_rules", { sport_rule: formData });
      sportRules = [...sportRules, newRule];
      resetForm();
      showForm = false;
    } catch (err) {
      error = "Failed to create sport rule";
      console.error(err);
    }
  }

  // Update a sport rule
  async function updateSportRule(id: number) {
    try {
      const updatedRule = await API.put(`/sport_rules/${id}`, {
        sport_rule: formData,
      });
      sportRules = sportRules.map((r) => (r.id === id ? updatedRule : r));
      resetForm();
      showForm = false;
    } catch (err) {
      error = "Failed to update sport rule";
      console.error(err);
    }
  }

  // Delete a sport rule
  async function deleteSportRule(id: number) {
    if (confirm("Are you sure you want to delete this sport rule?")) {
      try {
        await API.delete(`/sport_rules/${id}`);
        sportRules = sportRules.filter((r) => r.id !== id);
      } catch (err) {
        error = "Failed to delete sport rule";
        console.error(err);
      }
    }
  }

  // Edit a sport rule
  function editSportRule(rule: SportRule) {
    selectedRule = rule;
    formData = {
      title: rule.title,
      summary: rule.summary || "",
      body: rule.body || "",
      sport_id: rule.sport_id.toString(),
    };
    showForm = true;
  }

  // Reset form
  function resetForm() {
    formData = { title: "", summary: "", body: "", sport_id: "" };
    selectedRule = null;
  }

  // Handle form submission
  function handleSubmit() {
    if (selectedRule) {
      updateSportRule(selectedRule.id);
    } else {
      createSportRule();
    }
  }

  onMount(() => {
    loadSportRules();
  });
</script>

<div class="sport-rules-manager">
  <h2>Sport Rules Management</h2>

  {#if error}
    <div class="error">{error}</div>
  {/if}

  <div class="action-buttons">
    <button
      on:click={() => {
        showForm = true;
        resetForm();
      }}
      class="btn-primary"
    >
      Add New Sport Rule
    </button>
  </div>

  {#if showForm}
    <div class="form-overlay">
      <div class="form-container">
        <h3>{selectedRule ? "Edit Sport Rule" : "Create New Sport Rule"}</h3>
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
            <label for="sport_id">Sport ID:</label>
            <input
              id="sport_id"
              type="number"
              bind:value={formData.sport_id}
              required
            />
          </div>

          <div class="form-group">
            <label for="summary">Summary:</label>
            <textarea id="summary" bind:value={formData.summary} rows="3"
            ></textarea>
          </div>

          <div class="form-group">
            <label for="body">Body:</label>
            <textarea id="body" bind:value={formData.body} rows="6"></textarea>
          </div>

          <div class="form-actions">
            <button type="submit" class="btn-primary">
              {selectedRule ? "Update" : "Create"}
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
    <div class="loading">Loading sport rules...</div>
  {:else}
    <div class="rules-list">
      {#each sportRules as rule (rule.id)}
        <div class="rule-card">
          <h4>{rule.title}</h4>
          <p><strong>Sport ID:</strong> {rule.sport_id}</p>
          <p>
            <strong>Summary:</strong>
            {rule.summary || "No summary available"}
          </p>
          <p>
            <strong>Body:</strong>
            {rule.body
              ? rule.body.length > 100
                ? rule.body.substring(0, 100) + "..."
                : rule.body
              : "No body content"}
          </p>
          <p>
            <strong>Created:</strong>
            {new Date(rule.created_at).toLocaleDateString()}
          </p>
          <div class="card-actions">
            <button
              on:click={() => goto(`/admin/sport-rules/${rule.id}`)}
              class="btn-primary view-btn"
            >
              View
            </button>
            <button on:click={() => editSportRule(rule)} class="btn-secondary"
              >Edit</button
            >
            <button on:click={() => deleteSportRule(rule.id)} class="btn-danger"
              >Delete</button
            >
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .sport-rules-manager {
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
    background-color: #6f42c1;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 4px;
    cursor: pointer;
  }

  .action-buttons {
    display: flex;
    gap: 1rem;
    margin-bottom: 20px;
    align-items: center;
  }

  .btn-primary.view-btn {
    background-color: #28a745;
    margin-bottom: 0;
    margin-right: 8px;
  }

  .btn-primary.view-btn:hover {
    background-color: #218838;
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

  .rules-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 20px;
    margin-top: 20px;
  }

  .rule-card {
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 20px;
    background-color: #f9f9f9;
  }

  .rule-card h4 {
    margin: 0 0 10px 0;
    color: #333;
  }

  .rule-card p {
    margin: 5px 0;
    color: #666;
    line-height: 1.4;
  }

  .card-actions {
    margin-top: 15px;
  }
</style>
