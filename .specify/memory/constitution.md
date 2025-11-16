# Project Constitution

**Project**: Email Intelligence Workflow System
**Version**: 2.0.0
**Ratified**: 2025-11-14
**Last Amended**: 2025-11-15

## Purpose

This constitution defines the fundamental principles and governance model for the
Email Intelligence Workflow System. It ensures consistent decision-making, maintains
architectural integrity, and guides feature development toward the project's vision
of building a personal AI-augmented email operations engine using n8n's native
capabilities.

## Core Principles

### Principle 1: User-First Design

Every feature MUST deliver measurable user value with clear acceptance criteria.
No feature shall be implemented without defining how it improves the email
management experience, reduces manual effort, or increases accuracy.

**Rationale**: The system exists to serve users, not technology. Features without
clear user benefit add complexity without value.

### Principle 2: Test-Driven Development

All new functionality MUST have a defined test strategy before implementation.
Tests shall be written first when practical, and every user story MUST be
independently testable.

**Rationale**: Testing ensures reliability, prevents regressions, and validates
that features deliver their promised value.

### Principle 3: n8n-Native Architecture

The system MUST leverage n8n's native nodes and AI capabilities as the primary
implementation approach. Custom Python code nodes are permitted ONLY when native
n8n nodes are insufficient or unavailable.

**Core Requirements**:
- Use native AI Agent nodes for classification and decision-making
- Use native Embeddings nodes (OpenAI, HuggingFace, etc.) for vector generation
- Use native Vector Store nodes (Supabase, Pinecone, etc.) for similarity search
- Use native HTTP Request nodes for API integrations
- Use Code nodes only for data transformation and formatting
- Python/Execute Command nodes are last resort when no native alternative exists

**Rationale**: n8n's native nodes provide built-in error handling, credential
management, retry logic, and visual workflow representation. They are maintained
by the n8n team, more reliable, and easier to debug than custom code. The Swim Dad
Assistant workflow demonstrates this pattern successfully.

**Reference Architecture**: See Swim Dad Assistant workflow (ID: ykCnP0wqdrlmgtzq)
for examples of proper n8n-native patterns including AI Agent with Supabase Vector
Store and Embeddings OpenAI.

### Principle 4: Progressive Enhancement

Every feature MUST define an MVP with an incremental delivery path. Features
shall be deliverable in independent, valuable slices that can be tested and
deployed incrementally.

**Rationale**: Progressive enhancement reduces risk, enables faster feedback,
and ensures continuous delivery of value.

### Principle 5: Observable Systems

All workflows and processes MUST implement comprehensive logging and monitoring.
The system shall track classification accuracy, processing times, error rates,
and memory improvements using n8n's built-in execution logging and external
monitoring integrations.

**Rationale**: Observability enables debugging, performance optimization, and
data-driven improvements to the system. n8n provides execution history and
error tracking natively.

### Principle 6: Security by Design

Security considerations MUST be identified and addressed in the design phase.
API credentials, user data, and email content shall be handled with appropriate
security measures including n8n's credential vault, encryption, and access controls.

**Rationale**: Email contains sensitive information. Security breaches erode
user trust and may have legal implications. n8n's credential management provides
secure, encrypted storage.

### Principle 7: Documentation as Code

Documentation MUST be treated as a deliverable alongside workflows. Every feature
shall include user documentation, workflow descriptions, and implementation notes
maintained in version control.

**Rationale**: Documentation ensures maintainability, enables collaboration,
and preserves institutional knowledge. Visual workflow diagrams serve as
executable documentation.

### Principle 8: Memory-Driven Learning

The system MUST leverage native n8n Vector Store nodes with Supabase to continuously
improve. All classifications, corrections, and patterns shall be stored using
native vector operations and retrieved via n8n's AI tool integration.

**Implementation Approach**:
- Use Supabase Vector Store node in "insert" mode to store email embeddings
- Use Supabase Vector Store node in "retrieve-as-tool" mode for similarity search
- Connect Vector Store to AI Agent as a tool for context retrieval
- Use native Embeddings nodes for vector generation

**Rationale**: Continuous learning from user feedback and historical data is
essential for achieving the target 80%+ classification accuracy. Native vector
store integration provides optimized performance and maintainability.

## Architectural Boundaries

### Approved Technologies

The following technologies constitute the approved stack:
- **Orchestration**: n8n with native AI/LangChain nodes
- **Email/Calendar**: Google Workspace APIs (via native Gmail/Calendar nodes)
- **Notifications**: Telegram Bot API (via native Telegram node)
- **AI Processing**: AI Agent, OpenAI Chat Model, Embeddings OpenAI (native nodes)
- **Memory**: Supabase Vector Store node (native integration)
- **Data Transformation**: Code nodes (JavaScript only, minimal usage)
- **Development**: GitHub Spec-Kit methodology

### Technology Decision Framework

When implementing a feature, follow this decision tree:

1. **Can it be done with native n8n nodes?** → Use native nodes (REQUIRED)
2. **Does it require data transformation?** → Use Code node (JavaScript)
3. **Does it require complex computation?** → Use AI Agent with tools
4. **Does native node exist but is limited?** → Submit feature request to n8n, use workaround
5. **No native alternative exists?** → Document justification, use Execute Command as last resort

### Code Node Usage Policy

Code nodes (JavaScript) are permitted for:
- Data formatting and transformation
- Complex conditional logic
- Parsing structured data
- Combining results from multiple nodes

Execute Command nodes (Python/shell) are permitted ONLY for:
- System integrations with no native node
- Documented cases where native nodes are insufficient
- Temporary solutions with migration plan to native nodes

**Each use MUST be justified in the implementation plan's Complexity Tracking section.**

### Complexity Limits

- Maximum 50 nodes per workflow (before splitting into sub-workflows)
- Maximum 3 parallel workflow branches per n8n flow
- Maximum 6 classification categories
- Maximum 10 seconds processing time per email
- Vector embeddings limited to 1536 dimensions (OpenAI Ada-002 standard)
- AI Agent tools limited to 5 per workflow (performance)

## Reference Architecture

### Swim Dad Assistant Pattern (Best Practice)

The Swim Dad Assistant workflow demonstrates proper n8n-native architecture:

**Components**:
1. **Gmail Trigger** → Native trigger for polling
2. **Get a message** → Native Gmail node for email retrieval
3. **AI Agent** → Native agent node for classification
4. **OpenAI Chat Model** → Connected to AI Agent
5. **Embeddings OpenAI** → Native embedding generation
6. **Supabase Vector Store (retrieve)** → Tool for similarity search
7. **Supabase Vector Store (insert)** → Store classified emails
8. **Default Data Loader** → Prepare documents for vector store
9. **Structured Output Parser** → Parse AI responses to JSON

**Key Patterns**:
- AI Agent uses Vector Store as a tool for context retrieval
- Embeddings node shared between insert and retrieve operations
- Structured output ensures reliable JSON responses
- No custom Python code - all native n8n nodes

**This pattern MUST be followed for all AI-powered workflows in this project.**

## Governance

### Amendment Process

1. Propose changes via pull request to `.specify/memory/constitution.md`
2. Document rationale for principle changes
3. Update version according to semantic versioning
4. Propagate changes to all dependent templates
5. Update existing implementations to comply with new principles
6. Obtain review from project maintainer

### Version Policy

Constitution versions follow semantic versioning:
- **MAJOR**: Removal or fundamental redefinition of principles (e.g., architecture changes)
- **MINOR**: Addition of new principles or sections
- **PATCH**: Clarifications, wording improvements, typo fixes

### Compliance Review

All features MUST pass the Constitution Check gate defined in the plan template
before proceeding to implementation. Violations may be permitted only with
explicit justification in the Complexity Tracking section.

**Required Checks**:
1. n8n-native nodes used wherever available
2. Custom code justified and documented
3. Reference architecture patterns followed
4. Complexity limits respected
5. All principles satisfied or exceptions documented

## Success Metrics

The constitution's effectiveness shall be measured by:
- 80%+ email classification accuracy
- <2 minute urgent alert delivery time
- Zero missed time-sensitive events
- 90% automatic handling of actionable emails
- Decreasing correction rate over time
- >90% native n8n nodes vs custom code ratio

## Exceptions

Violations of these principles are permitted only when:
1. The violation is temporary and a remediation plan exists
2. The violation is documented in the Complexity Tracking section
3. A simpler alternative has been explicitly evaluated and rejected
4. Native n8n node is demonstrably insufficient (with evidence)
5. The project maintainer has approved the exception

## Review Schedule

This constitution shall be reviewed:
- After every 5 major features
- Quarterly (every 3 months)
- When success metrics fall below targets
- Upon significant architectural changes
- When n8n releases new native nodes that replace custom code

---

*This constitution represents our commitment to building a reliable, user-focused,
and continuously improving email intelligence system using n8n's native capabilities.
It shall guide all architectural and implementation decisions, with preference for
platform-native solutions over custom code.*