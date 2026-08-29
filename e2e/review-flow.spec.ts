import { expect, test } from '@playwright/test'

test('a session persists progress across a reload', async ({ page }) => {
  await page.goto('/')

  await page.getByTestId('start-session').click()
  await expect(page.getByTestId('card-front')).toBeVisible()

  const firstCard = await page.getByTestId('card-front').textContent()
  expect(firstCard?.trim().length).toBeGreaterThan(0)

  await expect(page.getByTestId('card-pinyin')).toHaveCount(0)
  await page.getByTestId('reveal').click()
  await expect(page.getByTestId('card-pinyin')).toBeVisible()
  await expect(page.getByTestId('card-meanings')).toBeVisible()

  // 'easy' graduates a card outright. 'good' would send it back into the
  // queue for another learning step, leaving the count unchanged.
  const before = await page.getByTestId('remaining').textContent()
  await page.getByTestId('grade-easy').click()
  await expect(page.getByTestId('remaining')).not.toHaveText(before ?? '')

  const stored = await page.evaluate(() =>
    localStorage.getItem('language-learner.progress.v1'),
  )
  expect(stored).not.toBeNull()

  await page.reload()
  const afterReload = await page.evaluate(() =>
    localStorage.getItem('language-learner.progress.v1'),
  )
  expect(afterReload).toBe(stored)
})

test('grading every card reaches the summary', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()

  await page.getByTestId('start-session').click()

  for (let i = 0; i < 200; i += 1) {
    if (await page.getByTestId('summary').isVisible().catch(() => false)) break
    await page.getByTestId('reveal').click()
    await page.getByTestId('grade-easy').click()
  }

  await expect(page.getByTestId('summary')).toBeVisible()
  await page.getByTestId('home').click()
  await expect(page.getByTestId('start-session')).toBeVisible()
})

test('progress survives an export and import round trip', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()

  // Make progress distinguishable from defaults: grade a card, change the limit.
  await page.getByTestId('start-session').click()
  await page.getByTestId('reveal').click()
  await page.getByTestId('grade-easy').click()

  // Reloading returns to Home; screen is ephemeral state, progress is not.
  await page.reload()
  await page.getByTestId('open-data').click()
  await page.getByTestId('new-per-day').fill('7')
  await page.getByTestId('new-per-day').blur()

  const downloadPromise = page.waitForEvent('download')
  await page.getByTestId('export').click()
  const download = await downloadPromise
  const exported = await download.path()
  expect(exported).not.toBeNull()

  const before = await page.evaluate(() =>
    localStorage.getItem('language-learner.progress.v1'),
  )

  // Wipe everything, then restore from the exported file alone.
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await page.getByTestId('open-data').click()
  await page.getByTestId('import').setInputFiles(exported!)

  await expect(page.getByTestId('import-error')).toHaveCount(0)
  await expect(page.getByTestId('new-per-day')).toHaveValue('7')

  const after = await page.evaluate(() =>
    localStorage.getItem('language-learner.progress.v1'),
  )
  expect(after).not.toBeNull()
  expect(JSON.parse(after!)).toEqual(JSON.parse(before!))
})

test('a malformed import is rejected and leaves progress intact', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()

  await page.getByTestId('start-session').click()
  await page.getByTestId('reveal').click()
  await page.getByTestId('grade-easy').click()
  await page.reload()

  const before = await page.evaluate(() =>
    localStorage.getItem('language-learner.progress.v1'),
  )

  await page.getByTestId('open-data').click()
  await page.getByTestId('import').setInputFiles({
    name: 'junk.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{ this is not progress'),
  })

  await expect(page.getByTestId('import-error')).toBeVisible()

  const after = await page.evaluate(() =>
    localStorage.getItem('language-learner.progress.v1'),
  )
  expect(after).toBe(before)
})

test('tapping anywhere on the card reveals it', async ({ page }) => {
  // A phone has no space bar, so the whole card must be the tap target rather
  // than a small button.
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await page.getByTestId('start-session').click()

  const card = await page.getByTestId('reveal').boundingBox()
  expect(card).not.toBeNull()
  expect(card!.height).toBeGreaterThan(200)

  await expect(page.getByTestId('card-pinyin')).toHaveCount(0)
  await page.mouse.click(card!.x + card!.width / 2, card!.y + card!.height / 2)
  await expect(page.getByTestId('card-pinyin')).toBeVisible()
})
