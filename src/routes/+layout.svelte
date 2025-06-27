<script lang="ts">
  import "../app.css";
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import { onMount } from "svelte";
  import API from "$lib/api/api.js";
  import { user } from "$lib/stores/user.js";
  import { writable } from "svelte/store";

  interface Sport {
    id: number;
    title: string;
    sport_id?: number;
    position?: number;
    created_at: string;
    updated_at?: string;
  }

  let isSidebarOpen = false;
  let sports: Sport[] = [];
  let loading = false;
  let error: string | null = null;
  let showAuthModal = false;
  let authTab = "signIn";
  let signInEmail = "";
  let signInPassword = "";
  let signUpEmail = "";
  let signUpPassword = "";
  let signUpPasswordConfirmation = "";
  let signUpFirstName = "";
  let signUpLastName = "";
  let signUpBirthdate = "";
  let signUpTimezone = "";
  let authError = "";
  let authLoading = false;

  function closeSidebar() {
    isSidebarOpen = false;
  }

  $: console.log("user", $user);
  // $: if ($user) {
  //   user.set(null);
  // }

  function getSportEmoji(sportTitle: string): string {
    const title = sportTitle.toLowerCase();

    // Football/Soccer
    if (title.includes("football") || title.includes("soccer")) return "⚽";

    // Basketball
    if (title.includes("basketball")) return "🏀";

    // Baseball
    if (title.includes("baseball")) return "⚾";

    // Tennis
    if (title.includes("tennis")) return "🎾";

    // Golf
    if (title.includes("golf")) return "⛳";

    // Cricket
    if (title.includes("cricket")) return "🏏";

    // Rugby
    if (title.includes("rugby")) return "🏉";

    // American Football
    if (title.includes("american football") || title.includes("nfl"))
      return "🏈";

    // Hockey
    if (title.includes("hockey")) return "🏒";

    // Ice Hockey
    if (title.includes("ice hockey")) return "🏒";

    // Volleyball
    if (title.includes("volleyball")) return "🏐";

    // Swimming
    if (title.includes("swimming")) return "🏊";

    // Athletics/Track
    if (title.includes("athletics") || title.includes("track")) return "🏃";

    // Boxing
    if (title.includes("boxing")) return "🥊";

    // MMA
    if (title.includes("mma") || title.includes("ufc")) return "🥋";

    // Wrestling
    if (title.includes("wrestling")) return "🤼";

    // Cycling
    if (title.includes("cycling") || title.includes("bike")) return "🚴";

    // Motorsport
    if (
      title.includes("racing") ||
      title.includes("f1") ||
      title.includes("nascar")
    )
      return "🏎️";

    // Skiing
    if (title.includes("skiing") || title.includes("ski")) return "⛷️";

    // Snowboarding
    if (title.includes("snowboarding") || title.includes("snowboard"))
      return "🏂";

    // Surfing
    if (title.includes("surfing") || title.includes("surf")) return "🏄";

    // Skateboarding
    if (title.includes("skateboarding") || title.includes("skate")) return "🛹";

    // Gymnastics
    if (title.includes("gymnastics")) return "🤸";

    // Weightlifting
    if (title.includes("weightlifting") || title.includes("lifting"))
      return "🏋️";

    // Martial Arts
    if (
      title.includes("karate") ||
      title.includes("judo") ||
      title.includes("taekwondo")
    )
      return "🥋";

    // Badminton
    if (title.includes("badminton")) return "🏸";

    // Table Tennis
    if (title.includes("table tennis") || title.includes("ping pong"))
      return "🏓";

    // Squash
    if (title.includes("squash")) return "🎾";

    // Handball
    if (title.includes("handball")) return "🤾";

    // Water Polo
    if (title.includes("water polo")) return "🤽";

    // Rowing
    if (title.includes("rowing")) return "🚣";

    // Sailing
    if (title.includes("sailing")) return "⛵";

    // Climbing
    if (title.includes("climbing") || title.includes("rock climbing"))
      return "🧗";

    // Archery
    if (title.includes("archery")) return "🏹";

    // Shooting
    if (title.includes("shooting")) return "🎯";

    // Equestrian
    if (
      title.includes("equestrian") ||
      title.includes("horse") ||
      title.includes("riding")
    )
      return "🏇";

    // Fencing
    if (title.includes("fencing")) return "🤺";

    // Judo
    if (title.includes("judo")) return "🥋";

    // Taekwondo
    if (title.includes("taekwondo")) return "🥋";

    // Karate
    if (title.includes("karate")) return "🥋";

    // Wrestling
    if (title.includes("wrestling")) return "🤼";

    // Sumo
    if (title.includes("sumo")) return "🤼";

    // Lacrosse
    if (title.includes("lacrosse")) return "🥍";

    // Field Hockey
    if (title.includes("field hockey")) return "🏑";

    // Softball
    if (title.includes("softball")) return "🥎";

    // Ultimate Frisbee
    if (title.includes("ultimate") || title.includes("frisbee")) return "🥏";

    // Disc Golf
    if (title.includes("disc golf")) return "🥏";

    // Curling
    if (title.includes("curling")) return "🥌";

    // Bobsleigh
    if (title.includes("bobsleigh") || title.includes("bobsled")) return "🛷️";

    // Luge
    if (title.includes("luge")) return "🛷️";

    // Skeleton
    if (title.includes("skeleton")) return "🛷️";

    // Biathlon
    if (title.includes("biathlon")) return "🎿";

    // Cross-country skiing
    if (title.includes("cross-country") || title.includes("nordic"))
      return "🎿";

    // Alpine skiing
    if (title.includes("alpine")) return "⛷️";

    // Freestyle skiing
    if (title.includes("freestyle")) return "⛷️";

    // Snowboard
    if (title.includes("snowboard")) return "🏂";

    // Freestyle snowboarding
    if (title.includes("freestyle snowboard")) return "🏂";

    // Halfpipe
    if (title.includes("halfpipe")) return "🏂";

    // Slopestyle
    if (title.includes("slopestyle")) return "🏂";

    // Big air
    if (title.includes("big air")) return "🏂";

    // Slalom
    if (title.includes("slalom")) return "⛷️";

    // Giant slalom
    if (title.includes("giant slalom")) return "⛷️";

    // Super-G
    if (title.includes("super-g") || title.includes("super g")) return "⛷️";

    // Downhill
    if (title.includes("downhill")) return "⛷️";

    // Combined
    if (title.includes("combined")) return "⛷️";

    // Team sports
    if (title.includes("team")) return "👥";

    // Individual sports
    if (title.includes("individual")) return "👤";

    // Default fallback
    return "⚽";
  }

  async function loadSports() {
    loading = true;
    error = null;
    try {
      sports = await API.get("/sports");
    } catch (err) {
      error = "Failed to load sports";
      console.error(err);
    } finally {
      loading = false;
    }
  }

  function openAuthModal() {
    showAuthModal = true;
    authTab = "signIn";
    authError = "";
  }

  function closeAuthModal() {
    showAuthModal = false;
    authError = "";
  }

  async function handleSignIn() {
    authLoading = true;
    authError = "";
    try {
      const response = await API.post("/users/sign_in", {
        email: signInEmail,
        password: signInPassword,
      });
      user.set(response.user || response);
      closeAuthModal();
    } catch (err) {
      authError = "Sign in failed. Please check your credentials.";
      console.error(err);
    } finally {
      authLoading = false;
    }
  }

  async function handleSignUp() {
    authLoading = true;
    authError = "";
    try {
      const response = await API.post("/users/sign_up", {
        user: {
          email: signUpEmail,
          password: signUpPassword,
          password_confirmation: signUpPasswordConfirmation,
          first_name: signUpFirstName,
          last_name: signUpLastName,
          birthdate: signUpBirthdate,
          timezone: signUpTimezone,
          roles: [],
        },
      });
      user.set(response.user || response);
      closeAuthModal();
    } catch (err) {
      authError = "Sign up failed. Please check your details.";
      console.error(err);
    } finally {
      authLoading = false;
    }
  }

  onMount(() => {
    loadSports();
  });
</script>

<div class="app-layout">
  <header class="mobile-header">
    <button
      class="hamburger-btn"
      on:click={() => (isSidebarOpen = !isSidebarOpen)}
      aria-label="Open menu"
    >
      <span class="bar"></span>
      <span class="bar"></span>
      <span class="bar"></span>
    </button>

    <div
      class="mobile-logo"
      on:click={() => {
        goto("/");
        closeSidebar();
      }}
    >
      <img src="/logo.png" alt="ScoreFeel Logo" />
    </div>
    <!-- <a href="/" class="join-btn-mobile">Join</a> -->
  </header>

  <aside class="sidebar" class:open={isSidebarOpen}>
    <div
      class="sidebar-header"
      on:click={() => {
        goto("/");
        closeSidebar();
      }}
    >
      <img
        src="/logo.png"
        alt="ScoreFeel Logo"
        style="height: 40px; margin: 0 auto; display: block;"
      />
    </div>

    <!-- <div class="upgrade-box">
      <h4>Upgrade to <span class="plus-text">+PLUS</span></h4>
      <p>No ads, unlimited game maps, free games, discounts and...</p>
      <button class="benefits-btn">See all the benefits</button>
    </div> -->

    <nav class="sidebar-nav">
      <a
        href="/"
        class:active={$page.url.pathname === "/"}
        on:click={closeSidebar}
      >
        <span class="icon">🏠</span> Home
      </a>
      {#if $user}
        {#if $user.admin}
          <a
            href="/admin"
            class:active={$page.url.pathname === "/admin"}
            on:click={closeSidebar}
          >
            <span class="icon"></span> Admin
          </a>
        {/if}
        <button
          class="join-btn"
          on:click={() => {
            user.set(null);
          }}>Log out</button
        >
      {:else}
        <button class="join-btn" on:click={openAuthModal}>Join / Log in</button>
      {/if}
      <!-- Search functionality not implemented yet
      <a
        href="/search"
        class:active={$page.url.pathname === "/search"}
        on:click={closeSidebar}
      >
        <span class="icon">🔍</span> Search
      </a>
      -->

      {#if loading}
        <div class="loading-sports">Loading sports...</div>
      {:else if error}
        <div class="error-sports">Failed to load sports</div>
      {:else}
        <div class="sports-section">
          <h4 class="sports-title">Sports</h4>
          {#each sports as sport (sport.id)}
            <button
              class="sport-nav-btn"
              class:active={$page.url.pathname === `/sports/${sport.id}`}
              on:click={() => {
                goto(`/sports/${sport.id}`);
                closeSidebar();
              }}
            >
              <span class="icon">{getSportEmoji(sport.title)}</span>
              {sport.title}
            </button>
          {/each}
        </div>
      {/if}
    </nav>
  </aside>

  {#if isSidebarOpen}
    <div class="sidebar-overlay" on:click={closeSidebar} />
  {/if}

  <div class="main-content">
    <slot />
  </div>

  {#if showAuthModal}
    <div class="modal-overlay" on:click={closeAuthModal}></div>
    <div class="auth-modal">
      <div class="auth-tabs">
        <button
          class:active={authTab === "signIn"}
          on:click={() => {
            authTab = "signIn";
            authError = "";
          }}>Sign In</button
        >
        <button
          class:active={authTab === "signUp"}
          on:click={() => {
            authTab = "signUp";
            authError = "";
          }}>Sign Up</button
        >
      </div>
      {#if authTab === "signIn"}
        <form on:submit|preventDefault={handleSignIn}>
          <input
            type="email"
            placeholder="Email"
            bind:value={signInEmail}
            required
          />
          <input
            type="password"
            placeholder="Password"
            bind:value={signInPassword}
            required
          />
          <button type="submit" disabled={authLoading}
            >{authLoading ? "Signing In..." : "Sign In"}</button
          >
        </form>
      {:else}
        <form on:submit|preventDefault={handleSignUp}>
          <input
            type="email"
            placeholder="Email"
            bind:value={signUpEmail}
            required
          />
          <input
            type="password"
            placeholder="Password"
            bind:value={signUpPassword}
            required
          />
          <input
            type="password"
            placeholder="Confirm Password"
            bind:value={signUpPasswordConfirmation}
            required
          />
          <input
            type="text"
            placeholder="First Name"
            bind:value={signUpFirstName}
            required
          />
          <input
            type="text"
            placeholder="Last Name"
            bind:value={signUpLastName}
            required
          />
          <input
            type="date"
            placeholder="Birthdate"
            bind:value={signUpBirthdate}
            required
          />
          <input
            type="text"
            placeholder="Timezone"
            bind:value={signUpTimezone}
            required
          />
          <button type="submit" disabled={authLoading}
            >{authLoading ? "Signing Up..." : "Sign Up"}</button
          >
        </form>
      {/if}
      {#if authError}
        <div class="auth-error">{authError}</div>
      {/if}
      <button class="close-modal" on:click={closeAuthModal}>×</button>
    </div>
  {/if}
</div>

<style>
  :global(body) {
    margin: 0;
    background-color: #f0f2f5;
  }

  .app-layout {
    display: flex;
  }

  .sidebar {
    width: 280px;
    min-height: 100vh;
    background-color: #ffffff;
    border-right: 1px solid #e0e0e0;
    display: flex;
    flex-direction: column;
    padding: 1.5rem;
    box-sizing: border-box;
    position: fixed;
    left: 0;
    top: 0;
    z-index: 1001;
    transition: transform 0.3s ease-in-out;
  }

  .sidebar-header {
    margin-bottom: 2rem;
    cursor: pointer;
  }

  .upgrade-box {
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 1rem;
    text-align: center;
    margin-bottom: 2rem;
  }

  .upgrade-box h4 {
    margin: 0 0 0.5rem 0;
    font-size: 1.1rem;
  }

  .plus-text {
    color: #e53935;
    font-weight: bold;
  }

  .upgrade-box p {
    font-size: 0.9rem;
    color: #666;
    margin: 0 0 1rem 0;
  }

  .benefits-btn {
    background: none;
    border: 1px solid #ccc;
    border-radius: 20px;
    padding: 0.5rem 1rem;
    width: 100%;
    cursor: pointer;
    font-weight: bold;
  }

  .sidebar-nav {
    flex-grow: 1;
    overflow-y: auto;
  }

  .sidebar-nav a {
    display: flex;
    align-items: center;
    padding: 0.8rem;
    text-decoration: none;
    color: #333;
    border-radius: 8px;
    margin-bottom: 0.5rem;
    font-weight: 500;
  }

  .sidebar-nav a.active {
    background-color: #f0f2f5;
    font-weight: bold;
  }

  .sidebar-nav a:hover {
    background-color: #f0f2f5;
  }

  .sidebar-nav a .icon {
    margin-right: 1rem;
    font-size: 1.2rem;
  }

  .sports-section {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid #e0e0e0;
  }

  .sports-title {
    margin: 0 0 0.5rem 0;
    font-size: 0.9rem;
    font-weight: bold;
    color: #666;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .loading-sports,
  .error-sports {
    padding: 0.8rem;
    text-align: center;
    font-size: 0.9rem;
    color: #666;
    background-color: #f8f9fa;
    border-radius: 8px;
    margin-top: 1rem;
  }

  .error-sports {
    color: #c33;
    background-color: #fee;
  }

  .sidebar-footer {
    margin-top: 2rem;
  }

  .join-btn {
    width: 100%;
    background-color: #1a1a1a;
    color: white;
    border: none;
    padding: 0.8rem;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: bold;
    cursor: pointer;
  }

  .main-content {
    flex-grow: 1;
    margin-left: 280px; /* Same as sidebar width */
    padding: 2rem;
    transition: margin-left 0.3s ease-in-out;
  }

  .mobile-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 60px;
    padding: 0 1rem;
    background-color: #fff;
    border-bottom: 1px solid #e0e0e0;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    box-sizing: border-box;
    z-index: 1000;
  }

  .mobile-logo {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    font-size: 1.5rem;
    font-weight: bold;
    color: #e53935;
    cursor: pointer;
    max-width: 160px;
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 2;
    pointer-events: auto;
  }

  .hamburger-btn {
    z-index: 3;
  }

  .join-btn-mobile {
    z-index: 3;
  }

  .sidebar-overlay {
    display: none;
  }

  .sport-nav-btn {
    display: flex;
    align-items: center;
    padding: 0.8rem;
    text-decoration: none;
    color: #333;
    border-radius: 8px;
    margin-bottom: 0.5rem;
    font-weight: 500;
    background: none;
    border: none;
    width: 100%;
    text-align: left;
    cursor: pointer;
    font-family: inherit;
    font-size: inherit;
  }

  .sport-nav-btn.active {
    background-color: #f0f2f5;
    font-weight: bold;
  }

  .sport-nav-btn:hover {
    background-color: #f0f2f5;
  }

  .sport-nav-btn .icon {
    margin-right: 1rem;
    font-size: 1.2rem;
  }

  @media (max-width: 768px) {
    .sidebar {
      transform: translateX(-100%);
    }

    .sidebar.open {
      transform: translateX(0);
    }

    .main-content {
      margin-left: 0;
      padding: 60px 1rem 1rem;
    }

    .mobile-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 60px;
      padding: 0 1rem;
      background-color: #fff;
      border-bottom: 1px solid #e0e0e0;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      box-sizing: border-box;
      z-index: 1000;
    }

    .hamburger-btn {
      background: none;
      border: none;
      cursor: pointer;
      padding: 0;
      z-index: 1002;
    }

    .hamburger-btn .bar {
      display: block;
      width: 25px;
      height: 3px;
      margin: 5px auto;
      background-color: #333;
      transition: all 0.3s ease-in-out;
    }

    .mobile-logo {
      font-size: 1.5rem;
      font-weight: bold;
      color: #e53935; /* IGN-like red */
      cursor: pointer;
      max-width: 160px;
      flex: 1;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .join-btn-mobile {
      background-color: #333;
      color: #fff;
      padding: 0.5rem 1rem;
      border-radius: 20px;
      text-decoration: none;
      font-weight: bold;
      font-size: 0.9rem;
    }

    .sidebar-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      z-index: 1000;
    }

    .sidebar-nav {
      -ms-overflow-style: none; /* IE and Edge */
      scrollbar-width: none; /* Firefox */
    }
    .sidebar-nav::-webkit-scrollbar {
      display: none; /* Chrome, Safari, Opera */
    }
  }

  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.4);
    z-index: 2000;
  }
  .auth-modal {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: #fff;
    padding: 2rem;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
    z-index: 2001;
    min-width: 320px;
    max-width: 95vw;
  }
  .auth-tabs {
    display: flex;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }
  .auth-tabs button {
    flex: 1;
    background: #f0f2f5;
    border: none;
    border-radius: 8px 8px 0 0;
    padding: 0.7rem 1rem;
    font-size: 1.1rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
  }
  .auth-tabs button.active {
    background: #e53935;
    color: #fff;
  }
  .auth-modal form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  .auth-modal input {
    padding: 0.7rem 1rem;
    border: 1px solid #ccc;
    border-radius: 6px;
    font-size: 1rem;
  }
  .auth-modal button[type="submit"] {
    background: #2d6d62;
    color: #fff;
    border: none;
    border-radius: 6px;
    padding: 0.7rem 1.2rem;
    font-size: 1rem;
    font-weight: bold;
    cursor: pointer;
    margin-top: 0.5rem;
    transition: background 0.2s;
  }
  .auth-modal button[type="submit"]:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
  .auth-error {
    color: #e53935;
    background: #ffebee;
    border: 1px solid #e53935;
    padding: 0.7rem 1rem;
    border-radius: 6px;
    margin-top: 1rem;
    text-align: center;
  }
  .close-modal {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    background: none;
    border: none;
    font-size: 2rem;
    color: #888;
    cursor: pointer;
    z-index: 10;
  }
</style>
