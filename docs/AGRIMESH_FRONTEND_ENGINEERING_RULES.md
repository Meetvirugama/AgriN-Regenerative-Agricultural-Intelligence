AgriMesh Frontend Engineering Rules

Document: Frontend Engineering Rulebook
Scope: React.js / TypeScript / Tailwind CSS / frontend UI
engineering
Rule Prefix: FE-XXX
Status: Mandatory unless explicitly exempted and documented

1. Purpose

These rules define the mandatory frontend engineering standards for the
AgriMesh application.

The rules are intended to keep the frontend:

consistent

maintainable

scalable

accessible

responsive

predictable

reviewable

production-ready

Every frontend developer should follow these rules during implementation
and code review.

2. Color Rules

FE-001 --- No Hardcoded Colors

Do not place raw color values directly inside React components.

Prohibited

<div className="bg-[#22C55E]" />

<div style={{ color: "#22C55E" }} />

Required

<div className="bg-success" />

Use the centralized design-token system.

FE-002 --- Design Tokens Only

All colors must come from the approved design-token system.

Approved semantic categories include:

primary

secondary

success

warning

danger

info

neutral

background

surface

border

text

muted

FE-003 --- No Arbitrary Tailwind Colors

Do not use arbitrary color syntax unless the color has been formally
approved and added to the design system.

Prohibited

bg-[#123456]
text-[#18A73B]
border-[rgb(10,20,30)]

FE-004 --- No Component-Specific Colors

Components must not invent their own colors.

Prohibited

<DiseaseCard className="bg-red-500" />

Required

<DiseaseCard severity="critical" />

The severity system determines the correct visual treatment.

FE-005 --- Use Semantic Status Colors

AgriMesh status colors must communicate meaning.

Recommended semantic states:

healthy

attention

warning

critical

unknown

Do not create arbitrary states such as:

bad

veryBad

red

danger-ish

almostCritical

FE-006 --- Color Must Not Be the Only Signal

Never communicate important information through color alone.

Prohibited

Red circle = disease

Required

[Critical] High disease risk

Use appropriate combinations of:

color

icon

text

label

semantic state

FE-007 --- New Colors Require Design-System Approval

A developer must not introduce a new application color without adding it
to the centralized design-token system and documenting its purpose.

3. Component Rules

FE-008 --- One Component, One Primary Responsibility

Every component must have one clear primary responsibility.

A component should not simultaneously manage unrelated:

UI

API calls

business logic

maps

charts

forms

authentication

navigation

FE-009 --- Reuse Before Creating

Before creating a new component, check whether an existing component can
satisfy the requirement.

Prefer:

<Button variant="primary" />

over creating:

PrimaryButton
SaveButton
SubmitButton
ActionButton
GreenButton

FE-010 --- No Duplicate Components

Do not create multiple components that perform essentially the same UI
responsibility.

If two components differ only by appearance or content, prefer:

props

variants

composition

FE-011 --- Meaningful Component Names

Component names must describe their actual domain purpose.

Prohibited

Box
Card2
Thing
SectionNew
Container2
Component

Required examples

FieldHealthCard
WeatherRiskCard
CropStageCard
AdvisoryCard
DiseaseDiagnosisCard

FE-012 --- Avoid Giant Components

Avoid excessively large React components.

As a default engineering guideline, components approaching or exceeding
approximately 200 lines should be reviewed for extraction.

Split by responsibility rather than simply moving arbitrary code into
another file.

FE-013 --- Reusable Components Must Be Generic Enough

Shared UI components must not contain page-specific or feature-specific
business assumptions.

For example:

Button
Modal
Card
Input
Badge
Tabs

should remain reusable.

A field-specific rule belongs in a field-specific component.

FE-014 --- Use Variants Instead of Duplicated Components

If a component needs multiple visual or behavioral versions, prefer
variants.

Example:

<Button variant="primary" />
<Button variant="secondary" />
<Button variant="danger" />

Do not create three separate button components.

FE-015 --- Pages Compose Components

Pages should primarily compose existing components.

A page should not become a giant implementation file containing every
piece of UI logic.

FE-016 --- No Unrelated UI in One Component

Do not combine unrelated sections merely because they appear on the same
page.

For example:

FieldDashboard
├── FieldHeader
├── FieldHealth
├── Weather
├── Satellite
└── Advisory

Each major responsibility should have its own component.

FE-017 --- Props Must Be Explicit

Avoid meaningless generic props.

Avoid

<Card data={data} />

Prefer

<FieldHealthCard
  health={health}
  status={status}
  trend={trend}
/>

Props should communicate the component's contract.

4. Styling Rules

FE-018 --- No Arbitrary Spacing

Use the project's approved spacing scale.

Avoid arbitrary values such as:

mt-[13px]
px-[27px]
gap-[19px]

unless explicitly required by the design system.

FE-019 --- No Arbitrary Font Sizes

Use the approved typography scale.

Avoid random values such as:

text-[17px]
text-[23px]

unless formally defined as a design token.

FE-020 --- Consistent Border Radius

Use approved radius tokens.

Do not randomly introduce different radius values throughout the
application.

FE-021 --- Consistent Shadows

Use the application's approved shadow levels.

Do not create one-off complex shadows for individual components unless
the design requires them.

FE-022 --- No Unnecessary Inline Styles

Avoid inline styles for normal UI styling.

Avoid

<div style={{ padding: 12 }} />

Use the project's styling system instead.

Inline styles are acceptable only when technically necessary, such as
certain dynamically calculated values or third-party library
requirements.

FE-023 --- One Styling System

Do not introduce another styling methodology into a feature without an
explicit project-level decision.

The project should have one clearly defined styling strategy.

5. UI Consistency Rules

FE-024 --- Same Action, Same Visual Language

The same action should look and behave consistently throughout the
application.

For example, the primary action should not be:

green on one page

blue on another

outlined on another

icon-only somewhere else

without a deliberate design reason.

FE-025 --- Standard Loading Components

Use centralized loading components.

Do not create custom loading indicators for every feature.

FE-026 --- Standard Error Components

Use a consistent error presentation.

Errors must be understandable to the user and must not expose internal
implementation details.

FE-027 --- Standard Empty States

Empty states must use a consistent pattern.

Example:

No field data available

Satellite observations are not available yet.

[Try again]

FE-028 --- Standard Dialog System

Dialogs, confirmation modals, and destructive-action confirmations must
use the centralized dialog component.

FE-029 --- Centralized Notifications

Toast and notification behavior must be centralized.

Do not implement separate notification systems inside individual
features.

6. Responsive Design Rules

FE-030 --- Mobile First

Farmer-facing interfaces must be designed for mobile first.

Supported targets:

mobile

tablet

desktop

FE-031 --- No Desktop-Only Layout

Do not assume that a large screen exists.

Avoid fixed layouts such as:

width: 1200px;

when responsive behavior is required.

FE-032 --- No Unnecessary Horizontal Scrolling

The interface should not require horizontal scrolling on normal mobile
screens.

Exceptions are allowed for content that genuinely requires horizontal
space, such as some data tables or specialized maps.

FE-033 --- Touch-Friendly Controls

Interactive elements must have sufficiently large touch areas.

This is especially important for:

voice controls

camera controls

map controls

navigation

primary actions

FE-034 --- Critical Actions Must Remain Accessible

Important actions must not disappear simply because the viewport is
smaller.

FE-035 --- Responsive Text

Text must remain readable across supported screen sizes.

Do not rely on fixed dimensions that cause:

clipping

overflow

overlapping

unreadable text

7. Accessibility Rules

FE-036 --- Keyboard Accessibility

All interactive elements must be usable with keyboard navigation where
applicable.

FE-037 --- Accessible Button Names

Icon-only buttons must have meaningful accessible labels.

Required

<button aria-label="Ask AgriMesh by voice">
  <Mic />
</button>

FE-038 --- Form Labels Are Required

Every input must have an associated accessible label.

Placeholder text must not be treated as a replacement for a label.

FE-039 --- Image Accessibility

Images must use appropriate alt behavior.

Decorative images should be marked appropriately.

Meaningful images require meaningful alternative text.

FE-040 --- Focus States Must Remain Visible

Do not remove browser focus indicators unless an accessible replacement
is provided.

FE-041 --- Contrast

Text and important UI elements must maintain sufficient contrast.

FE-042 --- Color Is Not Accessibility Logic

Do not rely on color alone for:

errors

warnings

success

disease risk

field health

severity

FE-043 --- Dialog Accessibility

Dialogs and modals must correctly manage:

focus

keyboard interaction

escape behavior

accessible naming

8. Form Rules

FE-044 --- Every Input Has a Label

Inputs must have clear labels describing the information required.

FE-045 --- Validation Near the Field

Validation messages should appear close to the relevant input.

FE-046 --- Preserve Valid User Input

When validation fails, do not unnecessarily clear information the user
has already entered.

FE-047 --- Prevent Duplicate Submission

While a form submission is processing, prevent accidental duplicate
submissions.

FE-048 --- Consistent Validation

Use the application's standard validation patterns.

FE-049 --- Forms Must Handle States

Every important form must support:

initial

editing

validating

submitting

success

error

9. UI State Rules

FE-050 --- Loading State Required

Every asynchronous user-facing operation must have an intentional
loading state.

FE-051 --- Success State Required

Successful operations must provide appropriate confirmation when the
user needs confirmation.

FE-052 --- Empty State Required

Components displaying collections or optional information must define
what happens when there is no data.

FE-053 --- Error State Required

Asynchronous operations must have an error state.

FE-054 --- Disabled State

Controls that cannot currently be used must have an appropriate disabled
or unavailable state.

FE-055 --- Offline State

Features that depend on connectivity must handle loss of connectivity
gracefully.

FE-056 --- Permission State

Features requiring permissions must handle:

permission granted

permission denied

permission unavailable

10. Data Display Rules

FE-057 --- Never Display Raw API Errors

Do not expose:

AxiosError
500 Internal Server Error
stack traces
database errors

to users.

FE-058 --- Never Display Undefined or Null

The UI must never accidentally show:

undefined
null
NaN
[object Object]

FE-059 --- Consistent Date Formatting

Use centralized date formatting.

Do not format dates differently across unrelated screens.

FE-060 --- Consistent Number Formatting

Use centralized number formatting.

FE-061 --- Units Must Be Explicit

Values such as:

12
35
84

must include units when required:

12 mm
35 °C
84 %

FE-062 --- Missing Data Must Not Become Zero

Do not represent unavailable data as zero.

For example:

unknown ≠ 0

FE-063 --- Distinguish Stale Data

If data is old but still being displayed, the UI should communicate its
freshness where relevant.

FE-064 --- Do Not Invent Data

If data does not exist, do not create a visually plausible replacement
and present it as real.

Use:

Not available
Unknown
Awaiting observation

as appropriate.

11. AgriMesh-Specific Frontend Rules

FE-065 --- Field Is the Primary Context

Field-related screens must make the active field obvious.

The user should know:

which field

crop

stage

relevant status

they are currently viewing.

FE-066 --- Use Centralized Severity States

AgriMesh severity must use the approved state system:

healthy
attention
warning
critical
unknown

FE-067 --- Unknown Is a Valid State

The frontend must support unknown or inconclusive results.

Never force an unknown result into:

healthy
warning
critical

FE-068 --- AI Uncertainty Must Be Visible

AI-generated agricultural information must support uncertainty.

Examples:

High confidence
Moderate confidence
Low confidence
Unknown
Expert review recommended

FE-069 --- No Action Needed Is a Valid State

The UI must support:

No action needed today.

Do not force an alert or recommendation when there is no meaningful
action.

FE-070 --- Primary Action Comes First

For farmer-facing screens, prioritize:

Current condition

Most important issue

Recommended action

Timing

Monitoring

FE-071 --- No Raw Intelligence as Primary Farmer UX

Do not make raw metrics the main experience.

Avoid presenting:

NDVI: 0.483
Humidity: 84%
Rain probability: 72%

without contextual interpretation.

FE-072 --- Charts Must Communicate Meaning

Every chart must answer a useful question.

A chart should help the user understand something such as:

Is field health improving?
Is water stress increasing?
Did the condition change?
Is risk increasing?

Do not add charts merely for visual decoration.

FE-073 --- Technical Information Must Be Understandable

Farmer-facing screens must avoid requiring agricultural or technical
expertise to understand the primary action.

FE-074 --- Voice Controls Follow the Design System

Voice interaction must use the same visual and interaction principles as
other important actions.

FE-075 --- Language Must Not Break Layout

The UI must tolerate different string lengths and supported languages.

Do not assume that translated text will have the same length as English.

FE-076 --- Minimal Typing

Farmer-facing workflows should minimize typing wherever practical.

Prefer:

selection

voice

camera

map interaction

simple confirmation

where appropriate.

12. Image and Media Rules

FE-077 --- Optimize Images

Do not ship unnecessarily large images.

Use appropriate:

dimensions

formats

compression

loading strategies

FE-078 --- Preserve Image Aspect Ratio

Do not unintentionally distort images.

FE-079 --- Remote Image Loading

Remote images must handle:

loading

success

failure

unavailable content

FE-080 --- Crop Image Upload States

Crop-diagnosis uploads must support:

idle
selecting
uploading
processing
success
error
retry

13. Map Rules

FE-081 --- Standard Map Controls

Map controls must use a consistent placement and interaction pattern.

FE-082 --- Standard Map Markers

Markers must use standardized visual styles.

FE-083 --- Map Legends Required

Maps containing analytical layers must provide an understandable legend.

FE-084 --- Map Layers Must Be Distinguishable

Layers such as:

satellite

vegetation health

moisture

risk

field boundary

must remain visually distinguishable.

FE-085 --- Map Color Is Not the Only Signal

Risk or health information must not rely exclusively on map color.

FE-086 --- Touch Map Support

Maps must work correctly on touch devices.

FE-087 --- Map Loading and Failure

Map initialization and data-layer failures must have intentional UI
states.

14. Animation Rules

FE-088 --- Animation Must Have Purpose

Animation should communicate:

transition

hierarchy

state

feedback

Do not animate merely because it looks interesting.

FE-089 --- No Distracting Animation

Animation must not distract from important agricultural information or
actions.

FE-090 --- Respect Reduced Motion

Support user preferences for reduced motion.

FE-091 --- Essential Information Must Not Depend on Animation

Users must be able to understand and operate the interface without
waiting for animation.

15. Typography Rules

FE-092 --- Approved Font Family

Use the application's approved font family.

FE-093 --- Approved Typography Scale

Use predefined typography levels.

FE-094 --- Limited Font Weights

Use only approved font weights.

FE-095 --- Consistent Hierarchy

Heading, subheading, body, label, caption, and helper text must have
consistent visual hierarchy.

FE-096 --- Readable Farmer-Facing Text

Long agricultural explanations must be broken into readable sections.

Prefer:

What happened?

Why?

What should I do?

When?

What should I watch?

over a large paragraph.

16. UX Rules

FE-097 --- One Primary Purpose Per Screen

Every screen must have a clear primary purpose.

FE-098 --- One Primary Action

Important screens should have a visually obvious primary action.

FE-099 --- Minimize Navigation

Do not create unnecessary navigation steps.

FE-100 --- Do Not Ask for Known Information

If the application already knows something, do not unnecessarily ask the
user again.

FE-101 --- Avoid Repetitive User Actions

Do not make users repeatedly perform the same action when the
application can safely remember the relevant state.

FE-102 --- Confirm Destructive Actions

Destructive actions must require appropriate confirmation.

FE-103 --- Never Silently Discard Input

User-entered information must not disappear without explanation.

FE-104 --- Preserve User Context

Navigation should preserve relevant context such as:

selected field

selected crop

active filter

current workflow step

where appropriate.

17. Review Checklist

Before merging frontend code, reviewers should verify:

Design

FE-001 --- No hardcoded colors

FE-002 --- Design tokens used

FE-003 --- No arbitrary colors

FE-018 --- Approved spacing

FE-019 --- Approved typography

FE-020 --- Consistent radius

FE-021 --- Consistent shadows

Components

FE-008 --- One responsibility

FE-009 --- Reuse before creating

FE-010 --- No duplicate components

FE-011 --- Meaningful names

FE-012 --- Component size reviewed

FE-017 --- Explicit props

Responsive

FE-030 --- Mobile-first

FE-031 --- No desktop-only assumptions

FE-033 --- Touch-friendly

FE-034 --- Critical actions accessible

Accessibility

FE-036 --- Keyboard accessible

FE-037 --- Accessible button names

FE-038 --- Form labels

FE-040 --- Focus states

FE-041 --- Contrast

FE-042 --- Color not used alone

States

FE-050 --- Loading

FE-051 --- Success

FE-052 --- Empty

FE-053 --- Error

FE-054 --- Disabled

FE-055 --- Offline where applicable

AgriMesh

FE-065 --- Field context visible

FE-066 --- Centralized severity

FE-067 --- Unknown supported

FE-068 --- AI uncertainty visible

FE-069 --- No-action state supported

FE-070 --- Primary action prioritized

FE-071 --- Raw metrics not dominant

FE-072 --- Charts have purpose

FE-075 --- Multilingual layout supported

18. Rule Enforcement

These rules are classified as:

MUST

Mandatory. Code should not be merged if the rule is violated.

SHOULD

Strong recommendation. Deviation requires a valid engineering reason.

MAY

Optional depending on the feature.

For AgriMesh, the following are MUST rules by default:

FE-001  No hardcoded colors
FE-002  Design tokens only
FE-008  One component, one responsibility
FE-009  Reuse before creating
FE-010  No duplicate components
FE-011  Meaningful component names
FE-030  Mobile first
FE-036  Keyboard accessibility
FE-038  Form labels
FE-050  Loading state
FE-052  Empty state
FE-053  Error state
FE-057  No raw API errors
FE-058  No undefined/null/NaN
FE-064  No invented data
FE-065  Field context
FE-066  Centralized severity
FE-067  Unknown state
FE-068  AI uncertainty
FE-069  No-action state
FE-070  Primary action first
FE-072  Meaningful charts
FE-075  Multilingual layout
FE-097  One primary purpose per screen
FE-098  One primary action
FE-102  Destructive-action confirmation
FE-103  Never silently discard input

19. Core Principle

The AgriMesh frontend is a decision-support interface, not a
data-dumping interface.

Every important farmer-facing screen should make it easy to understand:

What is happening?
        ↓
Why does it matter?
        ↓
How serious is it?
        ↓
What should I do?
        ↓
When should I do it?
        ↓
What should I monitor?

The frontend should make agricultural intelligence clear, trustworthy,
accessible, and actionable without inventing or altering the
underlying intelligence.