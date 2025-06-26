<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { Editor } from "@tiptap/core";
  import StarterKit from "@tiptap/starter-kit";
  export let content: string = "";
  export let editable: boolean = true;
  let element: HTMLDivElement;
  let editor: Editor;

  function updateContent() {
    if (editor && content !== editor.getHTML()) {
      content = editor.getHTML();
    }
  }

  onMount(() => {
    editor = new Editor({
      element,
      extensions: [StarterKit],
      content,
      editable,
      onUpdate: ({ editor }) => {
        content = editor.getHTML();
      },
      onTransaction: () => {
        // force re-render so `editor.isActive` works as expected
        editor = editor;
      },
    });
  });

  $: if (editor && content !== editor.getHTML()) {
    editor.commands.setContent(content, false);
  }

  $: if (editor) {
    editor.setEditable(editable);
  }

  onDestroy(() => {
    if (editor) {
      editor.destroy();
    }
  });
</script>

{#if editor}
  <div class="tiptap-toolbar">
    <button
      on:click={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      class:active={editor.isActive("heading", { level: 1 })}
      type="button"
    >
      H1
    </button>
    <button
      on:click={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      class:active={editor.isActive("heading", { level: 2 })}
      type="button"
    >
      H2
    </button>
    <button
      on:click={() => editor.chain().focus().setParagraph().run()}
      class:active={editor.isActive("paragraph")}
      type="button"
    >
      P
    </button>
    <button
      on:click={() => editor.chain().focus().toggleBold().run()}
      class:active={editor.isActive("bold")}
      type="button"
    >
      Bold
    </button>
    <button
      on:click={() => editor.chain().focus().toggleItalic().run()}
      class:active={editor.isActive("italic")}
      type="button"
    >
      Italic
    </button>
    <button
      on:click={() => editor.chain().focus().toggleBulletList().run()}
      class:active={editor.isActive("bulletList")}
      type="button"
    >
      • List
    </button>
  </div>
{/if}
<div bind:this={element} class="tiptap-editor" />

<style>
  .tiptap-toolbar {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }
  .tiptap-toolbar button {
    background: #f0f2f5;
    border: none;
    border-radius: 6px;
    padding: 0.4em 1em;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.2s;
  }
  .tiptap-toolbar button.active {
    background: #2d6d62;
    color: #fff;
  }
  .tiptap-editor {
    min-height: 180px;
    border: 1px solid #ccc;
    border-radius: 8px;
    padding: 1rem;
    background: #fff;
    font-size: 1.1rem;
    line-height: 1.7;
    margin-bottom: 1rem;
  }
</style>
