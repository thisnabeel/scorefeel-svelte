<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/stores";
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

  let sportRule: SportRule | null = null;
  let loading = true;
  let error: string | null = null;

  async function loadSportRule() {
    try {
      sportRule = await API.get(`/sport_rules/${$page.params.id}`);
    } catch (err) {
      error = "Failed to load sport rule";
      console.error(err);
    } finally {
      loading = false;
    }
  }

  function goBack() {
    goto("/admin/sport-rules");
  }

  onMount(() => {
    loadSportRule();
  });
</script>

<svelte:head>
  <title>{sportRule?.title || "Sport Rule"} - ScoreFeel Admin</title>
</svelte:head>

<div class="sport-rule-view">
  <header class="page-header">
    <button class="back-btn" on:click={goBack}> ← Back to Sport Rules </button>
    <h1>Sport Rule Details</h1>
  </header>

  {#if loading}
    <div class="loading">Loading sport rule...</div>
  {:else if error}
    <div class="error">{error}</div>
  {:else if sportRule}
    <div class="rule-details">
      <div class="rule-header">
        <h2>{sportRule.title}</h2>
        <div class="rule-meta">
          <span class="meta-item">
            <strong>Sport ID:</strong>
            {sportRule.sport_id}
          </span>
          <span class="meta-item">
            <strong>Created:</strong>
            {new Date(sportRule.created_at).toLocaleDateString()}
          </span>
          {#if sportRule.updated_at}
            <span class="meta-item">
              <strong>Updated:</strong>
              {new Date(sportRule.updated_at).toLocaleDateString()}
            </span>
          {/if}
        </div>
      </div>

      {#if sportRule.summary}
        <div class="rule-section">
          <h3>Summary</h3>
          <p>{sportRule.summary}</p>
        </div>
      {/if}

      {#if sportRule.body}
        <div class="rule-section">
          <h3>Full Rules</h3>
          <div class="rule-body">
            {sportRule.body}
          </div>
        </div>
      {/if}

      <div class="action-buttons">
        <button
          class="btn-secondary"
          on:click={() => goto(`/admin/sport-rules/${sportRule!.id}/edit`)}
        >
          Edit Rule
        </button>
        <button
          class="btn-danger"
          on:click={() => {
            if (confirm("Are you sure you want to delete this sport rule?")) {
              // Handle delete
            }
          }}
        >
          Delete Rule
        </button>
      </div>
    </div>
  {:else}
    <div class="error">Sport rule not found</div>
  {/if}
</div>

<style>
  .sport-rule-view {
    min-height: 100vh;
    background-color: #f8f9fa;
  }

  .page-header {
    background-color: #6f42c1;
    color: white;
    padding: 2rem;
    position: relative;
  }

  .back-btn {
    background: none;
    border: 1px solid rgba(255, 255, 255, 0.3);
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
    margin-bottom: 1rem;
    transition: background-color 0.2s;
  }

  .back-btn:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }

  .page-header h1 {
    margin: 0;
    font-size: 2.5rem;
  }

  .loading {
    text-align: center;
    padding: 2rem;
    color: #666;
    font-size: 1.1rem;
  }

  .error {
    background-color: #fee;
    color: #c33;
    padding: 1rem;
    border-radius: 4px;
    margin: 2rem;
    text-align: center;
  }

  .rule-details {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
  }

  .rule-header {
    background-color: white;
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    margin-bottom: 2rem;
  }

  .rule-header h2 {
    margin: 0 0 1rem 0;
    color: #333;
    font-size: 2rem;
  }

  .rule-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .meta-item {
    background-color: #f8f9fa;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    font-size: 0.9rem;
  }

  .rule-section {
    background-color: white;
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    margin-bottom: 2rem;
  }

  .rule-section h3 {
    margin: 0 0 1rem 0;
    color: #333;
    font-size: 1.5rem;
    border-bottom: 2px solid #6f42c1;
    padding-bottom: 0.5rem;
  }

  .rule-body {
    line-height: 1.6;
    color: #444;
    white-space: pre-wrap;
  }

  .action-buttons {
    display: flex;
    gap: 1rem;
    justify-content: center;
    margin-top: 2rem;
  }

  .btn-secondary {
    background-color: #6c757d;
    color: white;
    border: none;
    padding: 0.8rem 1.5rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
    transition: background-color 0.2s;
  }

  .btn-secondary:hover {
    background-color: #5a6268;
  }

  .btn-danger {
    background-color: #dc3545;
    color: white;
    border: none;
    padding: 0.8rem 1.5rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
    transition: background-color 0.2s;
  }

  .btn-danger:hover {
    background-color: #c82333;
  }

  @media (max-width: 768px) {
    .rule-details {
      padding: 1rem;
    }

    .rule-header,
    .rule-section {
      padding: 1.5rem;
    }

    .rule-meta {
      flex-direction: column;
      gap: 0.5rem;
    }

    .action-buttons {
      flex-direction: column;
    }
  }
</style>
