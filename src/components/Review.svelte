<script lang="ts">
  import type { AppStore } from '../lib/app/store.svelte'
  import type { Grade } from '../lib/scheduler/types'

  let { app }: { app: AppStore } = $props()

  const GRADE_KEYS: Record<string, Grade> = {
    '1': 'again',
    '2': 'hard',
    '3': 'good',
    '4': 'easy',
  }

  function onKeydown(event: KeyboardEvent) {
    if (event.key === ' ') {
      event.preventDefault()
      if (!app.revealed) app.reveal()
      return
    }
    const grade = GRADE_KEYS[event.key]
    if (grade && app.revealed) app.grade(grade)
  }
</script>

<svelte:window onkeydown={onKeydown} />

{#if app.current}
  <p class="muted" data-testid="remaining">{app.remaining} left</p>

  <div class="hanzi" data-testid="card-front">{app.current.word.simplified}</div>

  {#if app.revealed}
    <div class="pinyin" data-testid="card-pinyin">{app.current.word.pinyin}</div>
    <div class="meanings" data-testid="card-meanings">
      {app.current.word.meanings.join('; ')}
    </div>

    {#if app.current.word.origin === 'component'}
      <p class="muted origin-note" data-testid="card-origin">
        A character the HSK list uses but never teaches on its own.
      </p>
    {/if}

    {#if app.currentAppearsIn.length > 0}
      <p class="muted appears-in" data-testid="card-appears-in">
        appears in {app.currentAppearsIn.join(' · ')}
      </p>
    {/if}

    {#if app.currentComponents.length > 0}
      <ul class="components" data-testid="card-components">
        {#each app.currentComponents as part}
          <li>
            <span class="component-char">{part.character}</span>
            {#if part.gloss}
              <span class="component-gloss">{part.gloss}</span>
            {:else}
              <span class="component-gloss muted-em">not taught alone</span>
            {/if}
            {#if part.alsoIn.length > 0}
              <span class="component-also">also in {part.alsoIn.join(' · ')}</span>
            {/if}
          </li>
        {/each}
      </ul>
    {/if}
    <div class="grades">
      <button data-testid="grade-again" onclick={() => app.grade('again')}>Again</button>
      <button data-testid="grade-hard" onclick={() => app.grade('hard')}>Hard</button>
      <button data-testid="grade-good" onclick={() => app.grade('good')}>Good</button>
      <button data-testid="grade-easy" onclick={() => app.grade('easy')}>Easy</button>
    </div>
    <p class="muted">Keys 1–4 grade. Space reveals.</p>
  {:else}
    <p style="text-align: center">
      <button data-testid="reveal" onclick={() => app.reveal()}>Reveal</button>
    </p>
  {/if}
{/if}
