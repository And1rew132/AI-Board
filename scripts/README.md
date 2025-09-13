# AI-Board Scripts

This directory contains utility scripts for the AI-Board project.

## Issue Generation Scripts

### `create-ui-improvement-issues.js`

Node.js script that generates formatted GitHub issue content for UI/UX improvements based on Vue Router route analysis.

**Usage:**
```bash
node scripts/create-ui-improvement-issues.js
```

**Output:** Formatted issue content that can be copied and pasted into GitHub issues.

### `create-github-issues.sh`

Bash script that uses GitHub CLI to automatically create all UI/UX improvement issues.

**Prerequisites:**
1. Install GitHub CLI: https://cli.github.com/
2. Authenticate: `gh auth login`
3. Update the `ASSIGNEE` variable with the correct GitHub username

**Usage:**
```bash
# Make executable (first time only)
chmod +x scripts/create-github-issues.sh

# Run the script
./scripts/create-github-issues.sh
```

**Features:**
- Creates 10 GitHub issues automatically
- Assigns issues to specified user
- Adds appropriate labels for each issue
- Provides progress feedback

## Issue Summary

The scripts generate issues for the following Vue Router route improvements:

### High Priority Issues
1. **Split AgentManager into Focused Sub-Components** - Routes: `/agents/*`
2. **Split MCPManager into Specialized Integration Sections** - Routes: `/mcp/*`
3. **Split ProjectDetail into Dedicated Tab Views** - Routes: `/project/:id`

### Medium Priority Issues
4. **Enhance Home/Projects Section with Dedicated Views** - Routes: `/`, `/projects/*`
5. **Expand OrchestrationCenter Functionality** - Routes: `/orchestration/*`
6. **Create Dedicated Sub-Route Components** - All sub-routes currently reusing parent components
7. **Improve UI/UX Consistency Across All Sections** - All routes
8. **Enhance Navigation and User Experience** - All routes

### Low Priority Issues
9. **Add Dashboard and Analytics Functionality** - New routes: `/analytics/*`
10. **Add Settings and Configuration Pages** - New routes: `/settings/*`

## Related Documentation

- **UI Improvement Summary**: `docs/ui-improvement-issues-summary.md`
- **Contributing Guidelines**: `CONTRIBUTING.md`
- **Project README**: `README.md`

## Troubleshooting

### GitHub CLI Issues
- Ensure you're authenticated: `gh auth status`
- Check repository access: `gh repo view And1rew132/AI-Board`
- Verify issue creation permissions

### Script Permissions
- Make scripts executable: `chmod +x scripts/*.sh`
- Run from repository root directory

### Node.js Issues
- Ensure Node.js is installed: `node --version`
- Run from repository root: `cd /path/to/AI-Board && node scripts/...`