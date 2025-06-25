<script lang="ts">
  import API from "$lib/api/api.js";
  export let data;

  interface Figure {
    id: number;
    title: string;
    position: number;
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

  $: ({ sport, error } = data);

  let generatedFigures: Figure[] = [];
  let generatedRules: SportRule[] = [];
  let generating = false;
  let generatingRules = false;

  async function generateFigures() {
    if (!sport) return;
    generating = true;
    try {
      const response = await API.post(`/sports/${sport.id}/generate_figures`);
      if (response && response.figures) {
        generatedFigures = response.figures;
      }
    } catch (err) {
      console.error("Failed to generate figures:", err);
      // You can add a user-facing error message here if you want
    } finally {
      generating = false;
    }
  }

  async function generateSportRules() {
    if (!sport) return;
    generatingRules = true;
    try {
      const response = await API.post(
        `/sports/${sport.id}/generate_sport_rules`
      );
      if (response && response.length > 0) {
        generatedRules = response;
      }
    } catch (err) {
      console.error("Failed to generate sport rules:", err);
    } finally {
      generatingRules = false;
    }
  }
</script>

<svelte:head>
  <title>{sport ? sport.title : "Sport Details"} - ScoreFeel Admin</title>
</svelte:head>

<div class="sport-detail-page">
  {#if sport}
    <header class="page-header">
      <h1>{sport.title}</h1>
      <p>Sport ID: {sport.id}</p>
    </header>

    <div class="action-panel">
      <button class="action-button">
        <span class="icon">⚡️</span>
        Story
      </button>
      <button
        class="action-button"
        on:click={generateFigures}
        disabled={generating}
      >
        <span class="icon">⚡️</span>
        {#if generating}
          Generating...
        {:else}
          Figure
        {/if}
      </button>
      <button
        class="action-button"
        on:click={generateSportRules}
        disabled={generatingRules}
      >
        <span class="icon">⚡️</span>
        {#if generatingRules}
          Generating...
        {:else}
          Sport Rules
        {/if}
      </button>
      <button class="action-button">
        <span class="icon">⚡️</span>
        Event
      </button>
    </div>

    <div class="sport-info">
      <p><strong>Parent Sport ID:</strong> {sport.sport_id || "None"}</p>
      <p><strong>Position:</strong> {sport.position || "Not set"}</p>
      <p>
        <strong>Created:</strong>
        {new Date(sport.created_at).toLocaleDateString()}
      </p>
      <p>
        <strong>Updated:</strong>
        {new Date(sport.updated_at).toLocaleDateString()}
      </p>
    </div>

    {#if generatedFigures.length > 0}
      <section class="generated-items">
        <h2>Generated Figures</h2>
        <div class="items-grid">
          {#each generatedFigures as figure (figure.id)}
            <div class="item-card">
              <h4>{figure.title}</h4>
              <p><strong>Position:</strong> {figure.position}</p>
            </div>
          {/each}
        </div>
      </section>
    {/if}

    {#if generatedRules.length > 0}
      <section class="generated-items">
        <h2>Generated Sport Rules</h2>
        <div class="items-grid">
          {#each generatedRules as rule (rule.id)}
            <div class="item-card">
              <h4>{rule.title}</h4>
              {#if rule.summary}
                <p><strong>Summary:</strong> {rule.summary}</p>
              {/if}
            </div>
          {/each}
        </div>
      </section>
    {/if}
  {:else if error}
    <p class="error-message">{error.message}</p>
  {:else}
    <p>Loading sport details...</p>
  {/if}
</div>

<style>
  .sport-detail-page {
    max-width: 900px;
    margin: 0 auto;
    padding: 2rem;
  }

  .page-header {
    background-color: #28a745;
    color: white;
    padding: 2rem;
    border-radius: 12px;
    margin-bottom: 2rem;
    text-align: center;
  }

  .page-header h1 {
    font-size: 2.5rem;
    margin: 0 0 0.5rem 0;
  }

  .page-header p {
    opacity: 0.9;
    font-size: 1.1rem;
    margin: 0;
  }

  .action-panel {
    margin-bottom: 2rem;
    display: flex;
    justify-content: flex-end;
  }

  .action-panel button {
    margin-left: 1rem;
  }

  .action-button {
    background-color: #ffc107;
    color: #212529;
    border: none;
    padding: 0.8rem 1.5rem;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: bold;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: background-color 0.3s ease;
  }

  .action-button:hover:not(:disabled) {
    background-color: #e0a800;
  }

  .action-button:disabled {
    background-color: #e9ecef;
    cursor: not-allowed;
  }

  .icon {
    font-size: 1.2rem;
  }

  .sport-info {
    background-color: #fff;
    padding: 2rem;
    border-radius: 12px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  }

  .sport-info p {
    margin: 0 0 1rem 0;
    font-size: 1.1rem;
    line-height: 1.6;
  }

  .sport-info p:last-child {
    margin-bottom: 0;
  }

  .generated-items {
    margin-top: 2rem;
    background-color: #fff;
    padding: 2rem;
    border-radius: 12px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  }

  .generated-items h2 {
    font-size: 1.8rem;
    margin: 0 0 1.5rem 0;
    color: #333;
    border-bottom: 1px solid #eee;
    padding-bottom: 1rem;
  }

  .items-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
  }

  .item-card {
    background-color: #f8f9fa;
    border: 1px solid #e9ecef;
    border-radius: 8px;
    padding: 1.5rem;
  }

  .item-card h4 {
    margin: 0 0 0.5rem 0;
    font-size: 1.2rem;
  }

  .item-card p {
    margin: 0;
    color: #666;
  }

  .error-message {
    color: #e53935;
    background-color: #ffebee;
    border: 1px solid #e53935;
    padding: 1rem;
    border-radius: 8px;
  }
</style>
