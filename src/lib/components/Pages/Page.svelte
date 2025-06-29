<script lang="ts">
  import { onMount } from "svelte";
  import { user } from "$lib/stores/user";
  import Tiptap from "$lib/components/Tiptap.svelte";
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
    isNew?: boolean;
  }

  export let selectedPage: Page | null;
  let value: string = "";
  let generating = false;
  let error = "";
  let localPage: Page | null = selectedPage;
  let deletingBullet: Record<number, boolean> = {};
  let deleteBulletError: Record<number, string> = {};
  let editingBullet: Record<number, boolean> = {};
  let editingContent: Record<number, string> = {};
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

  async function updateBulletPoint(bulletId: number) {
    try {
      const updated = await API.put(`/bullet_points/${bulletId}`, {
        body: editingContent[bulletId],
      });
      if (localPage && localPage.bullet_points) {
        localPage = {
          ...localPage,
          bullet_points: localPage.bullet_points.map((bp) =>
            bp.id === bulletId ? { ...bp, body: updated.body } : bp
          ),
        };
      }
      editingBullet[bulletId] = false;
    } catch (err) {
      error = "Failed to update bullet point.";
      console.error(err);
    }
  }

  function insertBulletPoint(index: number) {
    if (!localPage) return;
    const newId = Date.now(); // Temporary unique id for new bullet
    const newBullet = {
      id: newId,
      body: "",
      bullet_pointable_type: "Page",
      bullet_pointable_id: localPage.id,
      position: index + 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      isNew: true,
    };
    localPage = {
      ...localPage,
      bullet_points: [
        ...localPage.bullet_points.slice(0, index + 1),
        newBullet,
        ...localPage.bullet_points.slice(index + 1),
      ],
    };
    editingBullet[newId] = true;
    editingContent[newId] = "";
  }

  async function saveNewBulletPoint(bulletId: number) {
    if (!localPage) return;
    try {
      const res = await API.post(`/bullet_points`, {
        body: editingContent[bulletId],
        bullet_pointable_type: "Page",
        bullet_pointable_id: localPage.id,
        position:
          localPage.bullet_points.findIndex((bp) => bp.id === bulletId) + 1,
      });
      localPage = {
        ...localPage,
        bullet_points: localPage.bullet_points.map((bp) =>
          bp.id === bulletId ? res : bp
        ),
      };
      editingBullet[bulletId] = false;
      delete editingContent[bulletId];
    } catch (err) {
      error = "Failed to save new bullet point.";
      console.error(err);
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
      {#each localPage.bullet_points as bp, i (bp.id)}
        <li class="bullet-point-wrapper">
          {#if $user && $user.admin}
            <div class="bullet-hr-container top">
              <hr class="bullet-hr" />
              <button
                class="add-bullet-btn"
                title="Add bullet above"
                on:click={() => insertBulletPoint(i - 1)}
                ><i class="fa fa-plus"></i></button
              >
            </div>
          {/if}
          <div class="bullet-point">
            {#if editingBullet[bp.id]}
              <Tiptap bind:content={editingContent[bp.id]} />
              {#if bp.isNew}
                <button
                  class="edit-bullet-btn"
                  on:click={() => saveNewBulletPoint(bp.id)}>Add</button
                >
                <button
                  class="cancel-bullet-btn"
                  on:click={() => {
                    editingBullet[bp.id] = false;
                    localPage.bullet_points = localPage.bullet_points.filter(
                      (b) => b.id !== bp.id
                    );
                  }}>Cancel</button
                >
              {:else}
                <button
                  class="edit-bullet-btn"
                  on:click={() => updateBulletPoint(bp.id)}>Edit</button
                >
                <button
                  class="cancel-bullet-btn"
                  on:click={() => (editingBullet[bp.id] = false)}>Cancel</button
                >
              {/if}
            {:else}
              {@html bp.body}
              {#if $user && $user.admin}
                <button
                  class="edit-bullet-btn"
                  title="Edit bullet point"
                  on:click={() => {
                    editingBullet[bp.id] = true;
                    editingContent[bp.id] = bp.body;
                  }}
                >
                  ✏️
                </button>
              {/if}
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
            {/if}
          </div>
          {#if $user && $user.admin}
            <div class="bullet-hr-container bottom">
              <hr class="bullet-hr" />
              <button
                class="add-bullet-btn"
                title="Add bullet below"
                on:click={() => insertBulletPoint(i)}
                ><i class="fa fa-plus"></i></button
              >
            </div>
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
    padding-bottom: 2rem;
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
  .bullet-point-wrapper {
    position: relative;
    margin-bottom: 1.5em;
    list-style: none;
  }
  .bullet-hr-container {
    position: relative;
    height: 2.2em;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .bullet-hr {
    border: none;
    border-top: 6px solid #e0e0e0;
    width: 100%;
    margin: 0.2em 0;
    border-radius: 3px;
    transition: background 0.2s;
  }
  .add-bullet-btn {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    background: #fff;
    border: 2px solid #e53935;
    color: #e53935;
    border-radius: 50%;
    width: 2.2em;
    height: 2.2em;
    font-size: 1.2em;
    display: none;
    align-items: center;
    justify-content: center;
    z-index: 2;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.07);
    cursor: pointer;
    transition:
      background 0.2s,
      color 0.2s;
  }
  .bullet-hr-container:hover .add-bullet-btn {
    display: flex;
  }
  .add-bullet-btn:hover {
    background: #e53935;
    color: #fff;
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
  .edit-bullet-btn {
    margin-left: 0.5em;
    background: #fffbe7;
    border: none;
    border-radius: 50%;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
    cursor: pointer;
    font-size: 1.1rem;
    padding: 0.2em 0.5em;
    vertical-align: middle;
    transition: background 0.2s;
  }
  .edit-bullet-btn:hover {
    background: #ffe082;
  }
  .cancel-bullet-btn {
    margin-left: 0.5em;
    background: #eee;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 1rem;
    padding: 0.2em 0.8em;
    vertical-align: middle;
    transition: background 0.2s;
  }
  .cancel-bullet-btn:hover {
    background: #e57373;
    color: #fff;
  }
</style>
