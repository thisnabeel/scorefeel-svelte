<script>
  import { page } from "$app/stores";
  import SportPage from "../sports/[id]/+page.svelte";

  const { slug } = $page.params;
</script>

{#if slug}
  <SportPage {slug} />
{:else}
  <div>
    <h1>Page not found</h1>
    <p>The page you are looking for does not exist.</p>
  </div>
{/if}
