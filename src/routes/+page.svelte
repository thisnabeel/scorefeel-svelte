<script lang="ts">
  import { onMount } from "svelte";
  import API from "$lib/api/api.js";

  interface Picture {
    id: number;
    image_url: string;
    cover: boolean;
  }

  interface Story {
    id: number;
    title: string;
    summary: string;
    pictures: Picture[];
  }

  let mainStory: Story | null = null;
  let secondaryStories: Story[] = [];
  let topStories: Story[] = [];
  let loading = true;
  let error: string | null = null;

  onMount(async () => {
    try {
      const stories: Story[] = await API.get("/stories");
      mainStory = stories[0] || null;
      secondaryStories = stories.slice(1, 3);
      topStories = stories.slice(3, 9);
    } catch (err: any) {
      error = "Failed to load stories. Please try again later.";
      console.error(err);
    } finally {
      loading = false;
    }
  });

  // Function to get a color for the card overlay based on index
  const getOverlayColor = (index: number) => {
    const colors = ["#881d20", "#56397f", "#2d6d62", "#b55a23"];
    return colors[index % colors.length];
  };
</script>

<svelte:head>
  <title>ScoreFeel - Your Daily Sports Briefing</title>
  <meta name="description" content="Svelte demo app" />
</svelte:head>

<div class="homepage">
  {#if loading}
    <p>Loading stories...</p>
  {:else if error}
    <div class="error-message">{error}</div>
  {:else}
    <!-- Main Story Section -->
    {#if mainStory}
      <section class="main-story-section">
        <a href="/stories/{mainStory.id}" class="main-story-card">
          <div class="main-story-image">
            <img
              src={mainStory.pictures?.find((p) => p.cover)?.image_url ||
                `https://placehold.co/800x450/1a1a1a/ffffff?text=${mainStory.title.split(" ").join("+")}`}
              alt={mainStory.title}
            />
          </div>
          <div class="main-story-content">
            <h2>{mainStory.title}</h2>
          </div>
        </a>
      </section>
    {/if}

    <!-- Ad Placeholder -->
    <div class="ad-placeholder">
      <div class="ad-text">
        <h3>The best way around Oahu? All the way around.</h3>
        <p>Find top-rated ways to explore the whole island.</p>
      </div>
    </div>

    <!-- Secondary Stories Section -->
    <section class="secondary-stories">
      {#each secondaryStories as story, i (story.id)}
        <a href="/stories/{story.id}" class="secondary-story-card">
          <img
            src={story.pictures?.find((p) => p.cover)?.image_url ||
              `https://placehold.co/400x600/1a1a1a/ffffff?text=${story.title.split(" ").join("+")}`}
            alt={story.title}
          />
          <div class="card-overlay">
            <h3>{story.title}</h3>
          </div>
        </a>
      {/each}
    </section>

    <!-- Today's Top Stories Section -->
    {#if topStories.length > 0}
      <section class="top-stories">
        <h2>Today's Top Stories</h2>
        <div class="top-stories-grid">
          {#each topStories as story (story.id)}
            <a href="/stories/{story.id}" class="top-story-card">
              <div class="card-image">
                <img
                  src={story.pictures?.find((p) => p.cover)?.image_url ||
                    `https://placehold.co/600x400/1a1a1a/ffffff?text=${story.title.split(" ").join("+")}`}
                  alt={story.title}
                />
              </div>
              <div class="card-content">
                <h4>{story.title}</h4>
              </div>
            </a>
          {/each}
        </div>
      </section>
    {/if}
  {/if}
</div>

<style>
  .homepage {
    width: 100%;
  }

  .main-story-section {
    margin-bottom: 1.5rem;
  }

  .main-story-card {
    display: block;
    text-decoration: none;
    color: white;
    background-color: #1a1a1a;
    border-radius: 12px;
    overflow: hidden;
    position: relative;
  }

  .main-story-image img {
    width: 100%;
    max-height: 300px;
    display: block;
    object-fit: contain;
  }

  .main-story-content {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 2rem;
    background: linear-gradient(to top, rgba(0, 0, 0, 0.9), transparent);
  }

  .main-story-content h2 {
    margin: 0;
    font-size: 2.5rem;
  }

  .ad-placeholder {
    background-color: #ec4899;
    color: #1a1a1a;
    border-radius: 12px;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
    text-align: center;
  }

  .ad-text h3 {
    margin: 0 0 0.5rem 0;
    font-size: 1.5rem;
  }
  .ad-text p {
    margin: 0;
    font-size: 1rem;
    opacity: 0.9;
  }

  .secondary-stories {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
    margin-bottom: 3rem;
  }

  .secondary-story-card {
    position: relative;
    border-radius: 12px;
    overflow: hidden;
    height: 400px;
    display: block;
    color: white;
    text-decoration: none;
  }

  .secondary-story-card img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
  }

  .secondary-story-card:hover img {
    transform: scale(1.05);
  }

  .card-overlay {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 1.5rem;
    background: linear-gradient(to top, rgba(0, 0, 0, 0.9), transparent);
  }

  .card-overlay h3 {
    margin: 0;
    font-size: 1.4rem;
    line-height: 1.3;
  }

  .top-stories h2 {
    font-size: 2rem;
    margin-bottom: 1.5rem;
    color: #1a1a1a;
  }

  .top-stories-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.5rem;
  }

  .top-story-card {
    background-color: white;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
    text-decoration: none;
    color: inherit;
    transition:
      transform 0.3s ease,
      box-shadow 0.3s ease;
  }

  .top-story-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 15px rgba(0, 0, 0, 0.1);
  }

  .top-story-card .card-image {
    height: 200px;
  }

  .top-story-card .card-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .top-story-card .card-content {
    padding: 1rem;
  }

  .top-story-card .card-content h4 {
    margin: 0;
    font-size: 1.1rem;
    line-height: 1.4;
  }

  .error-message {
    color: #e53935;
    background-color: #ffebee;
    border: 1px solid #e53935;
    padding: 1rem;
    border-radius: 8px;
  }

  @media (max-width: 768px) {
    .main-story-content h2 {
      font-size: 1.8rem;
    }

    .secondary-stories {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 480px) {
    .main-story-content {
      padding: 1rem;
    }
    .main-story-content h2 {
      font-size: 1.5rem;
    }

    .ad-text h3 {
      font-size: 1.2rem;
    }
    .ad-text p {
      font-size: 0.9rem;
    }

    .top-stories-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
