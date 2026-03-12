# Linear Project Setup Guide

A comprehensive guide for setting up Linear project management with consistent workflow standards across repositories.

---

## 1. Project Creation

### Create New Project
1. Go to Linear → Projects → Create Project
2. Fill in project details:

**Project Overview Template:**
```markdown
## Project Overview

**Mission:** [Your project mission statement]

**Platform:** [e.g., React + Vite + TypeScript + Tailwind CSS]

**Core Features:**
- [Feature 1]
- [Feature 2]
- [Feature 3]

**Tech Stack:**
- Frontend: React 18, TypeScript, Tailwind CSS, shadcn/ui
- Backend: [e.g., Supabase/Lovable Cloud]
- Payments: [e.g., Stripe]
- Email: [e.g., Resend]

**Integrations:**
- [Integration 1]
- [Integration 2]

**Production Domain:** [e.g., www.yourdomain.com]
```

---

## 2. Milestone Labels

Create these 15 milestone labels for Kanban card visibility:

| Label | Color | Hex Code | Purpose |
|-------|-------|----------|---------|
| M1: Foundation | Purple | `#7C3AED` | Core setup, architecture |
| M2: Database | Violet | `#8B5CF6` | Schema, migrations, RLS |
| M3: Auth | Indigo | `#6366F1` | Authentication, roles |
| M4: Products | Blue | `#3B82F6` | Product catalog, management |
| M5: Cart | Sky | `#0EA5E9` | Shopping cart functionality |
| M6: Wishlist | Cyan | `#06B6D4` | Wishlist features |
| M7: Checkout | Teal | `#14B8A6` | Checkout flow, payments |
| M8: Orders | Emerald | `#10B981` | Order management |
| M9: Subscriptions | Green | `#22C55E` | Subscription features |
| M10: Admin | Lime | `#84CC16` | Admin dashboards |
| M11: Analytics | Yellow | `#EAB308` | Analytics, reporting |
| M12: Email | Amber | `#F59E0B` | Email notifications |
| M13: SEO | Orange | `#F97316` | SEO, meta tags |
| M14: Performance | Red | `#EF4444` | Performance optimization |
| M15: Launch | Rose | `#F43F5E` | Launch preparation |

### Creating Labels in Linear
1. Go to Settings → Labels
2. Click "Create label"
3. Enter label name (e.g., "M1: Foundation")
4. Set the color using the hex code
5. Repeat for all 15 labels

---

## 3. Issue Workflow Standards

### Status Flow
```
Backlog → Todo → In Progress → Done (or Canceled)
```

### Status Definitions
| Status | Description |
|--------|-------------|
| **Backlog** | Identified but not yet prioritized |
| **Todo** | Ready to work on, prioritized |
| **In Progress** | Currently being worked on |
| **Done** | Completed and verified |
| **Canceled** | No longer needed |

### Critical Rules
1. **Always update issue status** when moving between stages
2. **Add detailed comments** when completing issues
3. **Link related issues** for dependencies
4. **Assign milestone labels** on creation

---

## 4. Issue Comment Template

When completing an issue, add a comment with this structure:

```markdown
## Completed ✓

### What was built:
- [Summary of implementation]

### Key files:
- `path/to/component.tsx` - [Description]
- `path/to/hook.ts` - [Description]
- `path/to/function.ts` - [Description]

### Technical notes:
- [Important implementation details]
- [Any gotchas or considerations]

### Database changes:
- [Tables created/modified]
- [RLS policies added]

### Integration points:
- [APIs connected]
- [External services integrated]
```

---

## 5. Issue Creation Standards

### Issue Title Format
```
[Action] [Feature/Component] - [Brief Description]
```

**Examples:**
- `Implement product search functionality`
- `Fix cart quantity update bug`
- `Add email notification for order status`

### Issue Description Template
```markdown
## Description
[Clear explanation of what needs to be done]

## Acceptance Criteria
- [ ] [Criterion 1]
- [ ] [Criterion 2]
- [ ] [Criterion 3]

## Technical Notes
[Any technical considerations or constraints]

## Related Issues
- #[issue-number] - [relationship]
```

### Required Fields
- **Title**: Clear, action-oriented
- **Description**: Detailed requirements
- **Label**: Appropriate milestone label (M1-M15)
- **Priority**: Urgent / High / Medium / Low / No priority
- **Estimate**: Story points or time estimate (optional)

---

## 6. Priority Definitions

| Priority | When to Use |
|----------|-------------|
| **Urgent** | Production issues, security vulnerabilities |
| **High** | Launch blockers, critical features |
| **Medium** | Important features, significant improvements |
| **Low** | Nice-to-haves, minor improvements |
| **No Priority** | Backlog items not yet evaluated |

---

## 7. Quick Reference Commands

### Starting Work on an Issue
1. Move issue to "In Progress"
2. Assign yourself if not already assigned
3. Create feature branch if using Git integration

### Completing an Issue
1. Add completion comment (use template above)
2. Move issue to "Done"
3. Link any related PRs or commits

### Creating New Issues
1. Use clear, action-oriented title
2. Add detailed description with acceptance criteria
3. Assign appropriate milestone label
4. Set priority level
5. Add estimate if known

---

## 8. Ongoing Management Best Practices

### Daily
- Review Kanban board for current sprint
- Update issue statuses as work progresses
- Add comments for significant progress

### Weekly
- Review backlog and prioritize
- Update milestone labels as needed
- Close completed issues with documentation
- Create new issues for discovered work

### Per Release
- Ensure all issues in milestone are Done or moved
- Document release in project updates
- Archive completed milestone issues

---

## 9. Integration with Development

### Linking Commits
Include issue ID in commit messages:
```
feat: implement product search [HEA-123]
fix: cart quantity bug [HEA-456]
```

### Branch Naming
```
feature/HEA-123-product-search
fix/HEA-456-cart-quantity
```

### PR Descriptions
Reference Linear issues in pull request descriptions:
```markdown
## Changes
- Implements product search functionality

## Linear Issue
Closes HEA-123
```

---

## 10. Team Collaboration

### Mentions
- Use `@username` to notify team members
- Use `@team` to notify entire team

### Comments
- Keep comments focused and actionable
- Use markdown for formatting
- Include screenshots for UI issues

### Sub-issues
- Break large issues into sub-issues
- Link parent ↔ child relationships
- Track progress through sub-issue completion

---

## Example: Creating a New Feature Issue

**Title:** `Implement customer wishlist functionality`

**Description:**
```markdown
## Description
Allow customers to save products to a wishlist for later viewing and easy access.

## Acceptance Criteria
- [ ] Heart icon on product cards to add/remove from wishlist
- [ ] Wishlist page showing all saved items
- [ ] Persist wishlist for logged-in users
- [ ] Add to cart from wishlist

## Technical Notes
- Store in Supabase with RLS policies
- Sync across devices for authenticated users

## Related Issues
- #HEA-100 - User authentication (dependency)
```

**Label:** `M6: Wishlist`
**Priority:** `Medium`
**Estimate:** `5 points`

---

## Quick Setup Checklist

- [ ] Create Linear project with overview
- [ ] Create all 15 milestone labels with colors
- [ ] Configure team access and permissions
- [ ] Set up Git integration (if applicable)
- [ ] Create initial backlog issues
- [ ] Assign milestone labels to issues
- [ ] Brief team on workflow standards

---

*This guide ensures consistent project management across all repositories using Linear.*
