<script lang="ts">
  export let value: string = "";
</script>

<textarea
  rows="4"
  style="width:100%;margin-top:1.5rem;"
  bind:value
  placeholder="Type your prompt here..."
></textarea>
