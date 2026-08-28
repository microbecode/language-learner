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
