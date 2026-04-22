# Commit Changes to GitHub

## Description
This skill guides you through the process of committing code changes to a GitHub repository. It ensures that changes are properly staged, committed with meaningful messages, and pushed to the remote repository.

## Scope
Workspace-scoped: This skill operates within the current Git workspace.

## Steps
1. **Check Repository Status**
   - Run `git status` to see current changes.
   - Identify modified, added, or deleted files.

2. **Stage Changes**
   - Use `git add .` to stage all changes, or `git add <file>` for specific files.
   - Verify staged changes with `git status`.

3. **Commit Changes**
   - Run `git commit -m "Descriptive commit message"`.
   - Ensure the message clearly describes the changes.

4. **Push to Remote**
   - Run `git push origin <branch>` to push to the remote repository.
   - Confirm the push was successful.

## Decision Points
- If there are no changes to commit, inform the user.
- If on a different branch, suggest switching or merging as needed.
- For large changes, consider breaking into smaller commits.

## Quality Criteria
- Commit messages should be concise but descriptive (under 50 characters for title).
- All relevant changes should be included in the commit.
- Push should succeed without conflicts.

## Example Usage
"Commit the recent changes to the veeda app with message 'Update UI components'."</content>
<parameter name="filePath">SKILL.md