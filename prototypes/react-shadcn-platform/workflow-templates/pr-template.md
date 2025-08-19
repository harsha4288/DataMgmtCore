# Pull Request Template

## PR Title Format
`[PHASE X] Task Y.Z: Brief Description`

Example: `[PHASE 1] Task 1.4: Entity System Integration`

---

## Description
Brief description of what this PR accomplishes.

## Related Task
- **Phase:** Phase X - [Phase Name]
- **Task:** Task Y.Z - [Task Name]
- **PROGRESS.md Reference:** Line XXX-XXX

## Changes Made
### Primary Changes
- [ ] Change 1
- [ ] Change 2
- [ ] Change 3

### Files Modified
- `path/to/file1.tsx` - [What was changed]
- `path/to/file2.ts` - [What was changed]
- `path/to/file3.css` - [What was changed]

## Quality Assurance

### Automated Checks
- [ ] ✅ ESLint (0 errors, 0 warnings)
- [ ] ✅ TypeScript (0 errors)
- [ ] ✅ Theme Validation
- [ ] ✅ Build Success
- [ ] ✅ All npm scripts pass

### Manual Testing
- [ ] Tested in development environment
- [ ] Tested theme switching
- [ ] Tested responsive design
- [ ] Tested accessibility features
- [ ] Cross-browser testing (if applicable)

### Performance Metrics
- **Bundle Size Impact:** +X KB / -X KB / No change
- **Theme Switch Time:** < 200ms ✅
- **Component Reusability:** XX%
- **First Contentful Paint:** X.Xs

## Screenshots/Videos
If applicable, add screenshots or videos showing:
- Before/After comparisons
- New features in action
- Bug fixes demonstrated

## Testing Instructions
1. Step to test feature/fix
2. Expected behavior
3. Edge cases to verify

## Checklist
### Code Quality
- [ ] Code follows project conventions
- [ ] No hardcoded values (especially colors)
- [ ] Components are reusable
- [ ] TypeScript types are properly defined
- [ ] No console.logs or debug code

### Documentation
- [ ] PROGRESS.md updated
- [ ] Task documentation created/updated
- [ ] README updated (if needed)
- [ ] CHANGELOG updated

### Review Ready
- [ ] Self-reviewed code
- [ ] Tested all changes locally
- [ ] Resolved merge conflicts
- [ ] Ready for review

## Additional Notes
Any additional context, future considerations, or follow-up tasks.

## Definition of Done
- [ ] All acceptance criteria met
- [ ] All quality gates passed
- [ ] Manual testing approved
- [ ] Documentation complete
- [ ] No regression in existing features

---

**Reviewer Guidelines:**
- Check theme system compliance
- Verify component reusability
- Test in both light/dark modes
- Validate TypeScript types
- Ensure no performance degradation