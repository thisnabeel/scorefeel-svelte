<script lang="ts">
  import { onMount } from "svelte";
  import { user } from "$lib/stores/user";
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
    bullet_points?: BulletPoint[];
  }

  interface BulletPoint {
    id: number;
    body: string;
    bullet_pointable_type: string;
    bullet_pointable_id: number;
    position: number;
    created_at: string;
    updated_at: string;
  }

  export let selectedPage: Page | null;
  let value: string = "";
  let generating = false;
  let error = "";
  let localPage: Page | null = selectedPage;
  let deletingBullet: Record<number, boolean> = {};
  let deleteBulletError: Record<number, string> = {};
  import API from "$lib/api/api.js";

  onMount(async () => {
    getPage();
  });

  async function getPage() {
    localPage = await API.get(`/pages/${selectedPage.id}`);
  }

  $: if (selectedPage && (!localPage || selectedPage.id !== localPage.id)) {
    (async () => {
      getPage();
    })();
  }

  async function generateBulletPoints() {
    generating = true;
    error = "";
    try {
      if (!localPage) return;
      const response = await API.post(
        `/bullet_points/for/Page/${localPage.id}/wizard`,
        {
          prompt: value,
        }
      );
      if (response && response.bullet_points) {
        localPage = {
          ...localPage,
          bullet_points: response.bullet_points,
        };
      }
    } catch (err) {
      error = "Failed to generate bullet points.";
      console.error(err);
    } finally {
      generating = false;
    }
  }

  async function deleteBulletPoint(bulletId: number) {
    deletingBullet[bulletId] = true;
    deleteBulletError[bulletId] = "";
    try {
      await API.delete(`/bullet_points/${bulletId}`);
      if (localPage && localPage.bullet_points) {
        localPage = {
          ...localPage,
          bullet_points: localPage.bullet_points.filter(
            (bp) => bp.id !== bulletId
          ),
        };
      }
    } catch (err) {
      deleteBulletError[bulletId] = "Failed to delete bullet point.";
      console.error("Failed to delete bullet point:", err);
    } finally {
      deletingBullet[bulletId] = false;
      deletingBullet = { ...deletingBullet };
      deleteBulletError = { ...deleteBulletError };
    }
  }
</script>

<div class="page-content-section">
  {#if $user}
    {#if localPage}
      <h2>{localPage.title}</h2>
      <p>Slug: {localPage.slug}</p>
      <p>Position: {localPage.position}</p>
      <p>Level: {localPage.level}</p>
      <p>Full Path: {localPage.full_path}</p>
    {/if}

    <textarea
      rows="4"
      style="width:100%;margin-top:1.5rem;"
      bind:value
      placeholder="Type your prompt here..."
    ></textarea>

    <button
      class="generate-btn"
      on:click={generateBulletPoints}
      disabled={generating}
      style="margin-top: 1rem;"
    >
      {#if generating}
        <span class="loading-spinner-small"></span> Generating Bullet Points...
      {:else}
        Generate Bullet Points
      {/if}
    </button>
    {#if error}
      <div class="error-message">{error}</div>
    {/if}
  {/if}

  {#if localPage && localPage.bullet_points && localPage.bullet_points.length > 0}
    <ul class="bullet-points-list">
      {#each localPage.bullet_points as bp}
        <li class="bullet-point">
          {bp.body}
          {#if $user}
            <button
              class="delete-bullet-btn"
              title="Delete bullet point"
              on:click={() => deleteBulletPoint(bp.id)}
              disabled={deletingBullet[bp.id]}
            >
              {#if deletingBullet[bp.id]}
                <span class="loading-spinner-small"></span>
              {:else}
                🗑️
              {/if}
            </button>
          {/if}
          {#if deleteBulletError[bp.id]}
            <span class="error-message">{deleteBulletError[bp.id]}</span>
          {/if}
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .page-content-section {
    max-width: 700px;
    margin: 0 auto;
    display: block;
  }
  .generate-btn {
    background-color: #e53935;
    color: white;
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
    margin-bottom: 1rem;
  }
  .generate-btn:disabled {
    background-color: #e9ecef;
    cursor: not-allowed;
  }
  .loading-spinner-small {
    margin-right: 0.25rem;
    border: 2px solid rgba(255, 255, 255, 0.2);
    border-top: 2px solid white;
    border-radius: 50%;
    width: 0.75rem;
    height: 0.75rem;
    animation: spin 1s linear infinite;
  }
  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
  .error-message {
    color: #e53935;
    background-color: #ffebee;
    border: 1px solid #e53935;
    padding: 1rem;
    border-radius: 8px;
    margin-bottom: 1rem;
    margin-top: 1rem;
  }
  .bullet-points-list {
    list-style: disc inside;
    padding-left: 1.5em;
    margin: 1.5em 0 0 0;
  }
  .bullet-point {
    margin-bottom: 0.7em;
    font-size: 1.1rem;
    color: #333;
    line-height: 1.5;
    /* display: flex;  */
    align-items: center;
    justify-content: space-between;
  }
  .delete-bullet-btn {
    margin-left: 1em;
    background: #fff;
    border: none;
    border-radius: 50%;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
    cursor: pointer;
    font-size: 1.1rem;
    padding: 0.2em 0.5em;
    vertical-align: middle;
    transition: background 0.2s;
  }
  .delete-bullet-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
</style>
