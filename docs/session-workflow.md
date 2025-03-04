# Session Workflow Guidelines

This document outlines the recommended workflow for development sessions on the Twisdom project. Following these guidelines ensures consistent documentation, knowledge preservation, and efficient development.

## Session Workflow Overview

1. **Session Start**: Review context from previous session
2. **Planning**: Define clear goals for the current session
3. **Development**: Implement features, fix issues, or refactor code
4. **Documentation**: Update documentation with changes and decisions
5. **Session End**: Summarize progress and prepare context for next session

## Session Start Template

```markdown
# Session: [YYYY-MM-DD] - [Brief Title]

## Session Goals
- [Goal 1]
- [Goal 2]
- [Goal 3]

## Context
[Brief description of the current state of the project and relevant context from previous sessions]

## Previous Session Summary
[Key points from the previous session's "Next Session Context" section]
```

## Session End Template

```markdown
## Work Completed
- [Task 1]: [Description and outcome]
- [Task 2]: [Description and outcome]
- [Task 3]: [Description and outcome]

## Decisions Made
- [Decision 1]: [Rationale and implications]
- [Decision 2]: [Rationale and implications]

## Technical Notes
- [Note 1]: [Technical details, implementation notes, or observations]
- [Note 2]: [Technical details, implementation notes, or observations]

## Next Steps
- [Task 1]: [Description and priority]
- [Task 2]: [Description and priority]
- [Task 3]: [Description and priority]

## Issues and Blockers
- [Issue 1]: [Description and potential solutions]
- [Issue 2]: [Description and potential solutions]

## Next Session Context
[Concise summary of the most important information needed for the next development session]
```

## Automatic Context Bridging

The project implements automatic context bridging to preserve knowledge between sessions:

1. At the end of each session, create a detailed "Next Session Context" section
2. This context should include:
   - Current state of the project
   - Key decisions made and their rationale
   - Outstanding issues and blockers
   - Next steps and priorities
3. At the beginning of the next session, this context is automatically loaded
4. This eliminates manual context transfer between sessions

## Documentation Update Guidelines

During each session, update the following documentation as needed:

### PRD Updates
- Update the PRD when feature requirements change
- Document new features or modifications to existing features
- Update technical specifications as the implementation evolves

### Architecture Decision Records
- Create a new ADR for each significant architectural decision
- Follow the ADR format in architecture-decisions.md
- Link ADRs to relevant session logs

### Active Issues
- Add new issues as they are discovered
- Update issue status as work progresses
- Close issues when they are resolved and verified
- Reference issues in session logs

## Best Practices

### During Development
1. **Atomic Commits**: Make small, focused commits with clear messages
2. **Test-Driven Development**: Write tests before implementing features
3. **Documentation-Driven Development**: Update documentation alongside code changes
4. **Progressive Enhancement**: Build features incrementally
5. **Continuous Integration**: Run tests and linting before committing

### During Documentation
1. **Be Specific**: Provide detailed explanations and context
2. **Include Code Snippets**: For important implementation details
3. **Link Related Documents**: Create connections between related documentation
4. **Focus on Why, Not Just What**: Explain the reasoning behind decisions
5. **Update All Relevant Docs**: Ensure consistency across documentation

## Session Frequency Guidelines

- **Regular Sessions**: Schedule regular development sessions (e.g., weekly)
- **Session Duration**: Aim for 2-4 hour focused sessions
- **Context Refresh**: If more than a week between sessions, spend extra time reviewing context
- **Emergency Sessions**: For critical issues, create abbreviated session logs focusing on the specific issue

## Documentation Maintenance

- Review and clean up documentation monthly
- Archive resolved issues quarterly
- Update the PRD with major releases
- Maintain a changelog of significant changes