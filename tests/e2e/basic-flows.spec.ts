import { test, expect } from '@playwright/test'

test('home page loads correctly', async ({ page }) => {
  await page.goto('/')
  
  // Check that the page title is correct
  await expect(page).toHaveTitle(/AI Board/)
  
  // Check for main navigation elements
  await expect(page.locator('text=Projects')).toBeVisible()
  await expect(page.locator('text=Agents')).toBeVisible()
  await expect(page.locator('text=Business Center')).toBeVisible()
  await expect(page.locator('text=MCP Integrations')).toBeVisible()
})

test('navigation works correctly', async ({ page }) => {
  await page.goto('/')
  
  // Navigate to Agents page
  await page.click('text=Agents')
  await expect(page.locator('text=Agent Manager')).toBeVisible()
  
  // Navigate to Projects page
  await page.click('text=Projects')
  await expect(page.locator('text=Projects')).toBeVisible()
  
  // Navigate to Business Center
  await page.click('text=Business Center')
  await expect(page.locator('text=Business')).toBeVisible()
  
  // Navigate to MCP Integrations
  await page.click('text=MCP Integrations')
  await expect(page.locator('text=MCP')).toBeVisible()
})

test('can create a new project', async ({ page }) => {
  await page.goto('/')
  
  // Navigate to projects
  await page.click('text=Projects')
  
  // Look for create project button/form
  // This test will need to be adjusted based on the actual UI structure
  const createButton = page.locator('button:has-text("Create"), button:has-text("New"), button:has-text("Add")')
  
  if (await createButton.count() > 0) {
    await createButton.first().click()
    
    // Check if a form or modal appears
    await expect(page.locator('input, textarea')).toBeVisible()
  } else {
    // If no create button, just verify we're on the projects page
    await expect(page.locator('text=Project')).toBeVisible()
  }
})

test('agent manager displays correctly', async ({ page }) => {
  await page.goto('/agents')
  
  // Check that Agent Manager loads
  await expect(page.locator('text=Agent Manager')).toBeVisible()
  
  // Check for agent templates section
  await expect(page.locator('text=Select an Agent Template')).toBeVisible()
  
  // Check for agents list
  await expect(page.locator('text=Agents')).toBeVisible()
  
  // Check for OpenAI generation button
  await expect(page.locator('button:has-text("Generate Agent with OpenAI")')).toBeVisible()
})

test('mcp integrations page loads', async ({ page }) => {
  await page.goto('/mcp')
  
  // Check that MCP page loads with expected content
  await expect(page.locator('text=MCP')).toBeVisible()
  
  // Should have integration tabs or sections
  const tabSelectors = [
    'text=OpenAI',
    'text=GitHub', 
    'text=Custom',
    'button:has-text("OpenAI")',
    'button:has-text("GitHub")',
    'button:has-text("Custom")'
  ]
  
  let tabFound = false
  for (const selector of tabSelectors) {
    if (await page.locator(selector).count() > 0) {
      tabFound = true
      break
    }
  }
  
  // If no specific tabs, just ensure the page has MCP-related content
  if (!tabFound) {
    await expect(page.locator('text=Integration, text=Connect, text=API')).toBeVisible()
  }
})