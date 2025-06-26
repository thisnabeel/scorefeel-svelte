<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import API from "$lib/api/api.js";
  import Page from "$lib/components/Pages/Page.svelte";
  import { user } from "$lib/stores/user";

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

  // Cover image states
  let storyCoverImages: Record<number, string> = {};
  let figureCoverImages: Record<number, string> = {};
  let eventCoverImages: Record<number, string> = {};
  let ruleCoverImages: Record<number, string> = {};

  // Add local state for move mode and image offset per figure
  let objectPositionY: Record<number, number> = {}; // percent, 0-100
  let moveMode: Record<number, boolean> = {};

  // Event creation form state
  let newEventTitle = "";
  let newEventDate = "";
  let newEventEndDate = "";
  let creatingEvent = false;
  let createEventError = "";

  // Countdown helper
  function getCountdown(targetDate: string, endDate?: string) {
    // If endDate is in the future, use that for countdown
    let target = new Date(targetDate).getTime();
    if (endDate) {
      const end = new Date(endDate).getTime();
      if (end > Date.now()) {
        target = end;
      }
    }
    const now = Date.now();
    let diff = target - now;
    if (diff <= 0) return null;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    diff -= days * 1000 * 60 * 60 * 24;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    diff -= hours * 1000 * 60 * 60;
    const minutes = Math.floor(diff / (1000 * 60));
    diff -= minutes * 1000 * 60;
    const seconds = Math.floor(diff / 1000);
    return { days, hours, minutes, seconds };
  }

  let countdowns: Record<
    number,
    { days: number; hours: number; minutes: number; seconds: number } | null
  > = {};
  let countdownInterval: any = null;

  function startCountdowns() {
    if (countdownInterval) clearInterval(countdownInterval);
    countdownInterval = setInterval(() => {
      if (!events) return;
      const now = Date.now();
      events.forEach((event) => {
        const startTime = new Date(event.start_date).getTime();
        const endTime = event.end_date
          ? new Date(event.end_date).getTime()
          : null;

        // If current date is between start_date and end_date, don't show countdown
        if (endTime && now >= startTime && now <= endTime) {
          countdowns[event.id] = null;
        } else {
          // Use end_date if present and in the future, else use start_date
          const target = endTime && endTime > now ? endTime : startTime;
          if (target > now) {
            countdowns[event.id] = getCountdown(
              event.start_date,
              event.end_date
            );
          } else {
            countdowns[event.id] = null;
          }
        }
      });
      countdowns = { ...countdowns };
    }, 1000);
  }

  async function loadSport() {
    loading = true;
    error = null;
    try {
      sport = await API.get(`/sports/${$page.params.id}`);
    } catch (err) {
      error = "Failed to load sport";
      console.error(err);
    } finally {
      loading = false;
    }
  }

  async function loadStories() {
    if (!sport) return;

    storiesLoading = true;
    try {
      stories = await API.get(`/sports/${sport.id}/stories`);
    } catch (err) {
      console.error("Failed to load stories:", err);
      stories = [];
    } finally {
      storiesLoading = false;
    }
  }

  async function loadFigures() {
    if (!sport) return;

    figuresLoading = true;
    try {
      figures = await API.get(`/sports/${sport.id}/figures`);
    } catch (err) {
      console.error("Failed to load figures:", err);
      figures = [];
    } finally {
      figuresLoading = false;
    }
  }

  async function loadSportRules() {
    if (!sport) return;

    rulesLoading = true;
    try {
      sportRules = await API.get(`/sports/${sport.id}/sport_rules`);
    } catch (err) {
      console.error("Error fetching sport rules:", err);
    } finally {
      rulesLoading = false;
    }
  }

  async function fetchEvents() {
    if (!sport) return;
    eventsLoading = true;
    try {
      events = await API.get(`/sports/${sport.id}/events`);
    } catch (err) {
      console.error("Error fetching events:", err);
    } finally {
      eventsLoading = false;
    }
  }

  async function generateEvent() {
    if (!sport) return;
    generatingEvent = true;
    try {
      const result = await API.post(`/sports/${sport.id}/generate_events`);
      // Add the new event to the list
      events = [result.event, ...events];
    } catch (err) {
      console.error("Error generating event:", err);
      error = "Error generating event";
    } finally {
      generatingEvent = false;
    }
  }

  async function createEvent() {
    if (!sport || !newEventTitle || !newEventDate) return;
    creatingEvent = true;
    createEventError = "";
    // Validate end_date >= date if provided
    if (newEventEndDate && newEventEndDate < newEventDate) {
      createEventError = "End date cannot be before start date.";
      creatingEvent = false;
      return;
    }
    try {
      await API.post("/events", {
        title: newEventTitle,
        eventable_type: "Sport",
        eventable_id: sport.id,
        start_date: newEventDate,
        end_date: newEventEndDate || undefined,
      });
      newEventTitle = "";
      newEventDate = "";
      newEventEndDate = "";
      await fetchEvents();
    } catch (err) {
      createEventError = "Failed to create event.";
      console.error("Failed to create event:", err);
    } finally {
      creatingEvent = false;
    }
  }

  // Drag and drop functions
  function handleDragOver(event: DragEvent) {
    event.preventDefault();
    (event.currentTarget as HTMLElement)?.classList.add("drag-over");
  }

  function handleDragLeave(event: DragEvent) {
    (event.currentTarget as HTMLElement)?.classList.remove("drag-over");
  }

  function handleDrop(
    event: DragEvent,
    type: string,
    id: number,
    title: string
  ) {
    event.preventDefault();
    (event.currentTarget as HTMLElement)?.classList.remove("drag-over");

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      console.log(`Dropped file(s) for ${type} ID ${id} - "${title}":`, files);

      // Get the first image file
      const file = files[0];
      if (file && file.type.startsWith("image/")) {
        const imageUrl = URL.createObjectURL(file);

        // Update the appropriate cover image state
        switch (type) {
          case "story":
            storyCoverImages[id] = imageUrl;
            storyCoverImages = { ...storyCoverImages }; // Trigger reactivity
            break;
          case "figure":
            figureCoverImages[id] = imageUrl;
            figureCoverImages = { ...figureCoverImages }; // Trigger reactivity
            // Send image to API for figures
            uploadFigureImage(id, file);
            break;
          case "event":
            eventCoverImages[id] = imageUrl;
            eventCoverImages = { ...eventCoverImages }; // Trigger reactivity
            break;
          case "sport_rule":
            ruleCoverImages[id] = imageUrl;
            ruleCoverImages = { ...ruleCoverImages }; // Trigger reactivity
            break;
        }
      }
    }
  }

  async function uploadFigureImage(figureId: number, file: File) {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const result = await API.post(
        `/figures/${figureId}/upload_picture`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      console.log("Image uploaded successfully:", result);
    } catch (err) {
      console.error("Error uploading image:", err);
      error = "Error uploading image";
    }
  }

  function handleStoryDrop(event: DragEvent, storyId: number, title: string) {
    handleDrop(event, "story", storyId, title);
  }

  function handleFigureDrop(event: DragEvent, figureId: number, title: string) {
    handleDrop(event, "figure", figureId, title);
  }

  function handleEventDrop(event: DragEvent, eventId: number, title: string) {
    handleDrop(event, "event", eventId, title);
  }

  function handleRuleDrop(event: DragEvent, ruleId: number, title: string) {
    handleDrop(event, "sport_rule", ruleId, title);
  }

  function goBack() {
    goto("/");
  }

  // Reactive statement to load stories and figures when sport changes
  $: if (sport) {
    loadStories();
    loadFigures();
    loadSportRules();
    fetchEvents();
    loadPages();
  }

  function startMove(event: MouseEvent | TouchEvent, figureId: number) {
    moveMode[figureId] = true;
    window.addEventListener("mousemove", (e) => onMove(e, figureId));
    window.addEventListener("mouseup", () => endMove(figureId));
    window.addEventListener("touchmove", (e) => onMove(e, figureId));
    window.addEventListener("touchend", () => endMove(figureId));
  }

  function onMove(event: MouseEvent | TouchEvent, figureId: number) {
    if (!moveMode[figureId]) return;
    const container = document.getElementById(
      `figure-img-container-${figureId}`
    );
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const y =
      event instanceof TouchEvent ? event.touches[0].clientY : event.clientY;
    let percent = ((y - rect.top) / rect.height) * 100;
    if (percent < 0) percent = 0;
    if (percent > 100) percent = 100;
    objectPositionY[figureId] = percent;
    objectPositionY = { ...objectPositionY };
  }

  function endMove(figureId: number) {
    moveMode[figureId] = false;
    moveMode = { ...moveMode };
  }

  // Reactive statement to load sport when $page.params.id changes
  $: if ($page.params.id) {
    loadSport();
  }

  // Reactive statement to start countdowns when events are loaded
  $: if (events && events.length > 0) {
    startCountdowns();
  }

  // Cleanup on destroy
  onDestroy(() => {
    if (countdownInterval) clearInterval(countdownInterval);
  });

  let deletingEvent: Record<number, boolean> = {};
  let deleteEventError: Record<number, string> = {};

  async function deleteEvent(eventId: number) {
    deletingEvent[eventId] = true;
    deleteEventError[eventId] = "";
    try {
      await API.delete(`/events/${eventId}`);
      await fetchEvents();
    } catch (err) {
      deleteEventError[eventId] = "Failed to delete event.";
      console.error("Failed to delete event:", err);
    } finally {
      deletingEvent[eventId] = false;
      deletingEvent = { ...deletingEvent };
      deleteEventError = { ...deleteEventError };
    }
  }

  let generatingRules = false;
  let generateRulesError = "";

  async function generateSportRules() {
    if (!sport) return;
    generatingRules = true;
    generateRulesError = "";
    try {
      const response = await API.post(
        `/sports/${sport.id}/generate_sport_rules`
      );
      if (response && response.sport_rules && response.sport_rules.length > 0) {
        sportRules = [...response.sport_rules, ...sportRules];
      }
    } catch (err) {
      generateRulesError = "Failed to generate sport rules.";
      console.error("Failed to generate sport rules:", err);
    } finally {
      generatingRules = false;
    }
  }

  async function loadPages() {
    if (!sport) return;
    pagesLoading = true;
    try {
      pages = await API.get(`/sports/${sport.id}/pages`);
    } catch (err) {
      pages = [];
      console.error("Failed to load pages:", err);
    } finally {
      pagesLoading = false;
    }
  }

  async function createPage() {
    if (!sport) return;
    const title = prompt("Enter new page title:");
    if (!title) return;
    creatingPage = true;
    createPageError = "";
    try {
      const response = await API.post("/pages", {
        title,
        pageable_type: "Sport",
        pageable_id: sport.id,
      });
      if (response && response.id) {
        sport = { ...sport, pages: [response, ...sport.pages] };
      }
    } catch (err) {
      createPageError = "Failed to create page.";
      console.error("Failed to create page:", err);
    } finally {
      creatingPage = false;
    }
  }

  let selectedPage: Page | null = null;
  let promptInput: string = "";
</script>

<svelte:head>
  <title>{sport?.title || "Sport"} - ScoreFeel</title>
</svelte:head>

<div class="sport-page">
  <header class="page-header">
    <!-- <button class="back-btn" on:click={goBack}> ← Back to Home </button> -->
    <h1>{sport?.title}</h1>
  </header>

  <!-- 
       Pills Section -->
  {#if pagesLoading}
    <div class="loading">Loading pages...</div>
  {:else}
    <div class="pages-pills-section sport-content">
      {#if selectedPage}
        <span class="page-pill go-home" on:click={() => (selectedPage = null)}
          >{"<-"} {sport?.title} Home</span
        >
      {/if}
      {#each sport?.pages || [] as page (page.id)}
        <span
          class="page-pill{selectedPage && selectedPage.id === page.id
            ? ' active'
            : ''}"
          on:click={() => (selectedPage = page)}>{(page as Page).title}</span
        >
      {/each}
      {#if $user}
        <button
          class="page-pill add-pill"
          on:click={createPage}
          disabled={creatingPage}
          title="Add Page"
        >
          {#if creatingPage}
            <span class="loading-spinner-small"></span>
          {:else}
            +
          {/if}
        </button>
      {/if}
    </div>
    {#if createPageError}
      <div class="error-message">{createPageError}</div>
    {/if}
  {/if}

  {#if selectedPage}
    <Page {selectedPage}></Page>
  {:else}
    <!-- Main sport content -->
    {#if loading}
      <div class="loading">Loading sport information...</div>
    {:else if error}
      <div class="error">{error}</div>
    {:else if sport}
      <div class="sport-content">
        <div class="sport-header">
          <div class="sport-meta">
            {#if events.length > 0}
              {#each events as event}
                {@const countdown = countdowns[event.id]}
                <span class="meta-item">
                  <strong>
                    {event.title}
                  </strong>
                  <i class="fa-solid fa-calendar-days"></i>
                  <p>
                    {new Date(event.start_date).toLocaleDateString()}
                    {#if event.end_date}
                      <i class="fa-solid fa-calendar-days"></i>
                      {new Date(event.end_date).toLocaleDateString()}
                    {/if}
                  </p>
                  <div class="countdown">
                    <span class="countdown-value">
                      {#if countdown}
                        {countdown.days}d {countdown.hours}h {countdown.minutes}m
                        {countdown.seconds}s
                      {/if}
                    </span>
                  </div>
                </span>
              {/each}
            {/if}
          </div>
        </div>
        {#if $user}
          <!-- Replace Generate Events Button with Event Form -->
          <div class="action-section">
            <form class="event-form" on:submit|preventDefault={createEvent}>
              <input
                class="event-title-input"
                type="text"
                placeholder="Event Title"
                bind:value={newEventTitle}
                required
              />
              <input
                class="event-date-input"
                type="date"
                bind:value={newEventDate}
                required
              />
              <input
                class="event-end-date-input"
                type="date"
                bind:value={newEventEndDate}
                min={newEventDate}
                placeholder="End Date (optional)"
              />
              <button
                class="create-event-btn"
                type="submit"
                disabled={creatingEvent}
              >
                {#if creatingEvent}
                  <span class="loading-spinner-small"></span> Creating Event...
                {:else}
                  ➕ Create Event
                {/if}
              </button>
            </form>
            {#if createEventError}
              <div class="error-message">{createEventError}</div>
            {/if}
          </div>
        {/if}
        <!-- Events Section -->

        <div class="sport-sections">
          <div class="section">
            <h3>Latest Stories</h3>
            {#if storiesLoading}
              <div class="loading">Loading stories...</div>
            {:else if stories.length > 0}
              <div class="stories-grid">
                {#each stories as story (story.id)}
                  <a
                    href="/stories/{story.id}"
                    class="story-card"
                    on:dragover={handleDragOver}
                    on:dragleave={handleDragLeave}
                    on:drop={(e) => handleStoryDrop(e, story.id, story.title)}
                  >
                    <div class="card-image">
                      <img
                        src={story?.pictures?.find((p) => p.cover)?.image_url ||
                          `https://placehold.co/600x400/1a1a1a/ffffff?text=${story.title.split(" ").join("+")}`}
                        alt={story.title}
                      />
                    </div>
                    <div class="card-content">
                      <h4 class="story-title">{story.title}</h4>
                      {#if story.summary}
                        <p class="story-summary">{story.summary}</p>
                      {/if}
                      <div class="story-meta">
                        <span class="story-date">
                          {new Date(story.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </a>
                {/each}
              </div>
            {:else}
              <p>No stories available yet for {sport.title}.</p>
            {/if}
          </div>

          <div class="section">
            <h3>Sport Figures</h3>
            {#if figuresLoading}
              <div class="loading">Loading figures...</div>
            {:else if figures.length > 0}
              <div class="figures-grid">
                {#each figures as figure (figure.id)}
                  <a
                    href="/figures/{figure.id}"
                    class="figure-card"
                    on:dragover={handleDragOver}
                    on:dragleave={handleDragLeave}
                    on:drop={(e) =>
                      handleFigureDrop(e, figure.id, figure.title)}
                    style="position: relative;"
                  >
                    <div
                      class="move-btn"
                      title="Move image"
                      style="left: 12px; right: auto;"
                      on:mousedown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        startMove(e, figure.id);
                      }}
                      on:touchstart={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        startMove(e, figure.id);
                      }}
                    >
                      <i class="fa-solid fa-up-down"></i>
                    </div>
                    <div
                      class="card-image"
                      id={"figure-img-container-" + figure.id}
                      style="overflow: hidden; height: 200px; position: relative;"
                    >
                      <img
                        src={figure.pictures?.find((p) => p.cover)?.image_url ||
                          `https://placehold.co/600x400/1a1a1a/ffffff?text=${figure.title.split(" ").join("+")}`}
                        alt={figure.title}
                        draggable="false"
                        style="width: 100%; height: 100%; object-fit: cover; object-position: 50% {objectPositionY[
                          figure.id
                        ] || 50}%"
                      />
                    </div>
                    <div class="card-content">
                      <h4 class="figure-title">{figure.title}</h4>
                      {#if figure.summary}
                        <p class="figure-summary">{figure.summary}</p>
                      {/if}
                      <div class="figure-meta">
                        <!-- <span class="figure-position">
                          Position: {figure.position || "Not set"}
                        </span> -->
                        <!-- <span class="figure-date">
                          {new Date(figure.created_at).toLocaleDateString()}
                        </span> -->
                      </div>
                    </div>
                  </a>
                {/each}
              </div>
            {:else}
              <p>No figures available yet for {sport.title}.</p>
            {/if}
          </div>

          <div class="section">
            <h3>Sport Rules</h3>
            <button
              class="create-event-btn"
              on:click={generateSportRules}
              disabled={generatingRules}
              style="margin-bottom: 1rem;"
            >
              {#if generatingRules}
                <span class="loading-spinner-small"></span> Generating Sport Rules...
              {:else}
                ➕ Generate Sport Rules
              {/if}
            </button>
            {#if generateRulesError}
              <div class="error-message">{generateRulesError}</div>
            {/if}
            {#if rulesLoading}
              <div class="loading">Loading sport rules...</div>
            {:else if sportRules.length > 0}
              <div class="rules-grid">
                {#each sportRules as rule (rule.id)}
                  <div
                    class="rule-card"
                    on:dragover={handleDragOver}
                    on:dragleave={handleDragLeave}
                    on:drop={(e) => handleRuleDrop(e, rule.id, rule.title)}
                  >
                    {#if ruleCoverImages[rule.id]}
                      <div class="card-image">
                        <img src={ruleCoverImages[rule.id]} alt={rule.title} />
                      </div>
                    {/if}
                    <h4 class="rule-title">{rule.title}</h4>
                    {#if rule.summary}
                      <p class="rule-summary">{rule.summary}</p>
                    {/if}
                  </div>
                {/each}
              </div>
            {:else}
              <p>No sport rules available yet for {sport.title}.</p>
            {/if}
          </div>
        </div>
      </div>
    {:else}
      <div class="error">Sport not found</div>
    {/if}
  {/if}
</div>

<style>
  .go-home {
    position: absolute;
    top: 140px;
    background: #fbff99;
  }

  .sport-page {
    min-height: 100vh;
    background-color: #f8f9fa;
  }

  .page-header {
    background-color: #e53935;
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

  .sport-content {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
  }

  .sport-header {
    background-color: white;
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    margin-bottom: 2rem;
  }

  .sport-header h2 {
    margin: 0 0 1rem 0;
    color: #333;
    font-size: 2rem;
  }

  .sport-meta {
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

  .sport-sections {
    display: grid;
    gap: 2rem;
  }

  .section {
    background-color: white;
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .section h3 {
    margin: 0 0 1rem 0;
    color: #333;
    font-size: 1.5rem;
    border-bottom: 2px solid #e53935;
    padding-bottom: 0.5rem;
  }

  .section p {
    line-height: 1.6;
    color: #444;
    margin: 0;
  }

  .stories-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.5rem;
    margin-top: 1rem;
  }

  .story-card {
    background-color: white;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
    text-decoration: none;
    color: inherit;
    transition:
      transform 0.3s ease,
      box-shadow 0.3s ease;
    display: block;
  }

  .story-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 15px rgba(0, 0, 0, 0.1);
  }

  .story-card .card-image {
    height: 200px;
  }

  .story-card .card-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .story-card .card-content {
    padding: 1rem;
  }

  .story-title {
    margin: 0 0 0.5rem 0;
    font-size: 1.1rem;
    line-height: 1.4;
    color: #333;
    font-weight: 600;
  }

  .story-summary {
    color: #666;
    line-height: 1.5;
    margin: 0 0 1rem 0;
    font-size: 0.9rem;
  }

  .story-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 1rem;
  }

  .story-date {
    font-size: 0.85rem;
    color: #888;
  }

  .read-more-btn {
    background-color: #e53935;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9rem;
    font-weight: 500;
    transition: background-color 0.2s;
  }

  .read-more-btn:hover {
    background-color: #c62828;
  }

  .figures-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.5rem;
    margin-top: 1rem;
  }

  .figure-card {
    background-color: white;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
    text-decoration: none;
    color: inherit;
    transition:
      transform 0.3s ease,
      box-shadow 0.3s ease;
    display: block;
  }

  .figure-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 15px rgba(0, 0, 0, 0.1);
  }

  .figure-card .card-image {
    height: 200px;
  }

  .figure-card .card-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .figure-card .card-content {
    padding: 1rem;
  }

  .figure-title {
    margin: 0 0 0.5rem 0;
    font-size: 1.1rem;
    line-height: 1.4;
    color: #333;
    font-weight: 600;
  }

  .figure-summary {
    color: #666;
    line-height: 1.5;
    margin: 0 0 1rem 0;
    font-size: 0.9rem;
  }

  .figure-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 1rem;
  }

  .figure-position {
    font-size: 0.85rem;
    color: #888;
  }

  .figure-date {
    font-size: 0.85rem;
    color: #888;
  }

  .read-more-btn {
    background-color: #e53935;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9rem;
    font-weight: 500;
    transition: background-color 0.2s;
  }

  .read-more-btn:hover {
    background-color: #c62828;
  }

  .rules-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.5rem;
    margin-top: 1rem;
  }

  .rule-card {
    background-color: #f8f9fa;
    border: 1px solid #e9ecef;
    border-radius: 12px;
    padding: 1.5rem;
    transition:
      transform 0.3s ease,
      box-shadow 0.3s ease;
  }

  .rule-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 15px rgba(0, 0, 0, 0.1);
  }

  .rule-title {
    margin: 0 0 0.5rem 0;
    font-size: 1.2rem;
    line-height: 1.4;
    color: #333;
    font-weight: 600;
  }

  .rule-summary {
    color: #666;
    line-height: 1.5;
    margin: 0 0 1rem 0;
    font-size: 0.95rem;
  }

  .rule-body {
    color: #444;
    line-height: 1.6;
    margin: 0 0 1rem 0;
    font-size: 0.9rem;
    white-space: pre-wrap;
  }

  .rule-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 1rem;
  }

  .rule-date {
    font-size: 0.85rem;
    color: #888;
  }

  .action-section {
    margin: 2rem 0;
    text-align: center;
  }

  .event-form {
    display: flex;
    gap: 1rem;
    align-items: center;
    flex-wrap: wrap;
  }

  .event-title-input,
  .event-date-input,
  .event-end-date-input {
    padding: 0.5em 1em;
    border: 1px solid #ccc;
    border-radius: 6px;
    font-size: 1rem;
  }

  .create-event-btn {
    background: #2d6d62;
    color: #fff;
    border: none;
    border-radius: 6px;
    padding: 0.6em 1.2em;
    font-size: 1rem;
    font-weight: bold;
    cursor: pointer;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
    transition: background 0.2s;
  }

  .create-event-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .loading-spinner-small {
    width: 16px;
    height: 16px;
    border: 2px solid transparent;
    border-top: 2px solid white;
    border-radius: 50%;
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

  .events-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.5rem;
    margin-top: 1rem;
  }

  .event-card {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-radius: 12px;
    padding: 1.5rem;
    transition:
      transform 0.3s ease,
      box-shadow 0.3s ease;
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.2);
    position: relative;
  }

  .event-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
  }

  .event-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1rem;
  }

  .event-header h3 {
    margin: 0;
    font-size: 1.2rem;
    font-weight: 600;
    line-height: 1.4;
    flex: 1;
  }

  .event-date {
    background: rgba(255, 255, 255, 0.2);
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    font-size: 0.85rem;
    font-weight: 500;
    white-space: nowrap;
    margin-left: 1rem;
  }

  .event-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.85rem;
    opacity: 0.9;
  }

  .event-id {
    background: rgba(255, 255, 255, 0.1);
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
  }

  .event-type {
    background: rgba(255, 255, 255, 0.1);
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
  }

  .event-card .card-image,
  .rule-card .card-image {
    height: 200px;
    overflow: hidden;
    border-radius: 12px 12px 0 0;
  }

  .event-card .card-image img,
  .rule-card .card-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .event-card .event-header {
    padding: 1.5rem 1.5rem 0 1.5rem;
  }

  .event-card .event-meta {
    padding: 0 1.5rem 1.5rem 1.5rem;
  }

  .rule-card .rule-title {
    padding: 1.5rem 1.5rem 0 1.5rem;
    margin: 0 0 0.5rem 0;
  }

  .rule-card .rule-summary,
  .rule-card .rule-body {
    padding: 0 1.5rem;
  }

  .rule-card .rule-meta {
    padding: 0 1.5rem 1.5rem 1.5rem;
  }

  /* Drag and drop styles */
  .story-card.drag-over,
  .figure-card.drag-over,
  .event-card.drag-over,
  .rule-card.drag-over {
    transform: scale(1.02);
    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
    border: 3px dashed #667eea !important;
    background-color: rgba(102, 126, 234, 0.05);
  }

  .story-card,
  .figure-card,
  .event-card,
  .rule-card {
    transition: all 0.3s ease;
    border: 2px solid transparent;
  }

  .story-card:hover,
  .figure-card:hover,
  .event-card:hover,
  .rule-card:hover {
    cursor: pointer;
  }

  @media (max-width: 768px) {
    .sport-content {
      padding: 1rem;
    }

    .sport-header,
    .section {
      padding: 1.5rem;
    }

    .sport-meta {
      flex-direction: column;
      gap: 0.5rem;
    }
  }

  .move-btn {
    position: absolute;
    top: 12px;
    left: 12px;
    right: auto;
    z-index: 2;
    background: white;
    border-radius: 50%;
    padding: 0.3em;
    cursor: grab;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
  }
  .move-btn:active {
    cursor: grabbing;
  }

  .countdown {
    display: flex;
    align-items: center;
    gap: 0.5em;
    background: #f0f2f5;
    color: #2d6d62;
    border-radius: 999px;
    padding: 0.2em 0.9em;
    font-size: 0.98rem;
    font-weight: 500;
    margin-top: 0.5em;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  }
  .countdown-label {
    font-weight: 600;
    color: #b55a23;
  }
  .countdown-value {
    font-family: "JetBrains Mono", monospace;
    font-size: 1.05em;
  }

  .delete-event-btn {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    background: #fff;
    border: none;
    border-radius: 50%;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
    cursor: pointer;
    font-size: 1.2rem;
    padding: 0.3em 0.5em;
    z-index: 2;
    transition: background 0.2s;
  }
  .delete-event-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .pages-pills-section {
    display: flex;
    gap: 0.5rem;

    flex-wrap: wrap;
    align-items: center;
    padding-bottom: 0;
  }
  .page-pill {
    display: inline-block;
    background: #f0f2f5;
    color: #2d6d62;
    border-radius: 999px;
    padding: 0.4em 1.2em;
    font-size: 1rem;
    font-weight: 500;
    margin-bottom: 0.3em;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    transition:
      background 0.2s,
      color 0.2s;
    border: none;
    cursor: pointer;
  }
  .page-pill.add-pill {
    background: #e53935;
    color: #fff;
    font-weight: bold;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.4em 1em;
    font-size: 1.2rem;
  }
  .page-pill.add-pill:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .page-pill.active {
    background: #2d6d62;
    color: #fff;
    font-weight: bold;
    box-shadow: 0 2px 8px rgba(45, 109, 98, 0.1);
    border: 2px solid #2d6d62;
  }
</style>
