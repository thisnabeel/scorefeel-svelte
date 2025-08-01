<script lang="ts">
  import EventCard from "./EventCard.svelte";
  import { goto } from "$app/navigation";
  import { user } from "$lib/stores/user";
  export let event: any;
  export let countdowns: Record<number, any> = {};

  export let deletingEvent: Record<number, boolean> = {};
  export let deleteEventError: Record<number, string> = {};
  export let deleteEvent: (id: number) => void = () => {};
  export let selectParentEventId: (id: number) => void = () => {};
  export let selectedParentEventId: number | null = null;
  export let parent: any = null;
  // For child events, pass down all props except event

  function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    if (!parent) {
      // Top-level event: show year
      return date.toLocaleDateString();
    } else {
      // Child event: show only month and day
      return date.toLocaleDateString(undefined, {
        month: "numeric",
        day: "numeric",
      });
    }
  }
</script>

<!-- {@const countdown = countdowns[event.id]} -->
<span
  class="meta-item"
  class:selected={selectedParentEventId === event.id}
  class:child={parent}
  class:not-child={!parent}
>
  {#if $user && $user.admin}
    <i
      class="fa fa-circle event-hook"
      on:click={() => {
        selectParentEventId(event.id);
      }}
    ></i>
    <i class="fa fa-trash event-destroy" on:click={() => deleteEvent(event.id)}
    ></i>
  {/if}
  <strong>
    {#if event.id}
      <a
        href="#"
        on:click|preventDefault={() => goto(`/events/${event.id}`)}
        style="color:inherit;text-decoration:underline;cursor:pointer;"
        >{event.title}</a
      >
    {:else}
      {event.title}
    {/if}
  </strong>
  <i class="fa-solid fa-calendar-days"></i>
  <p>
    {formatDate(event.start_date)}
    {#if event.end_date && event.end_date !== event.start_date}
      {"-"}
      <i class="fa-solid fa-calendar-days"></i>
      {formatDate(event.end_date)}
    {/if}
  </p>

  {#if event.events && event.events.length > 0}
    <!-- <hr /> -->
    <div class="sport-meta" class:not-child={!parent} class:child={parent}>
      {#each event.events as childEvent (childEvent.id)}
        {@const countdown = countdowns[childEvent.id]}
        <EventCard event={childEvent} {selectedParentEventId} parent={event} />
      {/each}
    </div>
  {/if}
</span>

<style>
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
    margin-bottom: 1rem;
  }
  .event-card .event-card {
    background: rgba(255, 255, 255, 0.08);
    color: #222;
    margin-top: 0.5rem;
    box-shadow: none;
    padding: 1rem;
  }
  .event-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1rem;
  }
  .event-header h4 {
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
  .sport-meta {
    display: flex;
    flex-wrap: nowrap;
    gap: 1rem;
    overflow-x: auto;
    overflow-y: hidden;
    padding-bottom: 0.5rem;
    scrollbar-width: thin;
    scrollbar-color: #e53935 #f8f9fa;
  }
  .sport-meta.child {
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    gap: 1rem;
    overflow-x: auto;
    overflow-y: hidden;
    padding-bottom: 0.5rem;
    scrollbar-width: thin;
    scrollbar-color: #e53935 #f8f9fa;
  }
  .meta-item {
    background-color: #f8f9fa;
    color: #222;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    font-size: 0.9rem;
    position: relative;
  }
  .selected.meta-item {
    background-color: #c8ff85;
  }

  .sport-meta .meta-item {
    position: relative;
  }

  .selected.meta-item {
    background-color: #c8ff85;
  }

  .event-hook {
    position: absolute;
    top: -4px;
    right: 1px;
    z-index: 99999;
    width: 10px;
    cursor: pointer;
    color: #eee;
  }

  .event-destroy {
    position: absolute;
    top: -4px;
    right: -14px;
    z-index: 99999;
    width: 10px;
    cursor: pointer;
    color: #eee;
  }

  .countdown {
    margin: 0.5rem 0;
    font-size: 0.95rem;
    font-weight: 500;
  }
  .child-events {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid rgba(255, 255, 255, 0.2);
  }
  .child-events h5 {
    margin: 0 0 0.75rem 0;
    font-size: 0.9rem;
    font-weight: 600;
    opacity: 0.9;
  }
  .child-events-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .event-actions {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid rgba(255, 255, 255, 0.2);
  }
  .delete-event-btn {
    background: rgba(220, 53, 69, 0.8);
    color: white;
    border: none;
    border-radius: 6px;
    padding: 0.4rem 0.8rem;
    font-size: 0.85rem;
    cursor: pointer;
    transition: background 0.2s;
  }
  .delete-event-btn:hover:not(:disabled) {
    background: rgba(220, 53, 69, 1);
  }
  .delete-event-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .child {
    display: inline-block;
    border: 6px solid #eee;
  }

  @media (max-width: 768px) {
    .sport-meta.not-child {
      display: block;
      overflow-x: scroll;
      width: 100%;
      text-wrap-mode: nowrap;
    }

    .child {
      display: inline-block;
    }
  }

  .sport-meta::-webkit-scrollbar,
  .sport-meta.child::-webkit-scrollbar {
    height: 8px;
  }
  .sport-meta::-webkit-scrollbar-thumb,
  .sport-meta.child::-webkit-scrollbar-thumb {
    background: #e53935;
    border-radius: 4px;
  }
  .sport-meta::-webkit-scrollbar-track,
  .sport-meta.child::-webkit-scrollbar-track {
    background: #f8f9fa;
  }
</style>
