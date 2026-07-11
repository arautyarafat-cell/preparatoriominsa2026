# Graph Report - ./preparatoriominsa2026-main  (2026-07-10)

## Corpus Check
- 413 files · ~322,545 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1322 nodes · 2329 edges · 94 communities (79 shown, 15 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 40 edges (avg confidence: 0.77)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Core App & Navigation|Core App & Navigation]]
- [[_COMMUNITY_Backend API Routes|Backend API Routes]]
- [[_COMMUNITY_AgKit Session Manager|AgKit Session Manager]]
- [[_COMMUNITY_Admin Panel Components|Admin Panel Components]]
- [[_COMMUNITY_Lesson Management|Lesson Management]]
- [[_COMMUNITY_AgKit CLI Utils|AgKit CLI Utils]]
- [[_COMMUNITY_AgKit API Client|AgKit API Client]]
- [[_COMMUNITY_AgKit Config System|AgKit Config System]]
- [[_COMMUNITY_Supabase Auth Service|Supabase Auth Service]]
- [[_COMMUNITY_AgKit Bash Utils|AgKit Bash Utils]]
- [[_COMMUNITY_Quiz & Knowledge Tests|Quiz & Knowledge Tests]]
- [[_COMMUNITY_Game Area Components|Game Area Components]]
- [[_COMMUNITY_Frontend Design Audit|Frontend Design Audit]]
- [[_COMMUNITY_AgKit Data Visualization|AgKit Data Visualization]]
- [[_COMMUNITY_AgKit Security Audit|AgKit Security Audit]]
- [[_COMMUNITY_Flashcard System|Flashcard System]]
- [[_COMMUNITY_Backend Lesson Service|Backend Lesson Service]]
- [[_COMMUNITY_Backend Game Service|Backend Game Service]]
- [[_COMMUNITY_Connection Game|Connection Game]]
- [[_COMMUNITY_AgKit Activity Monitor|AgKit Activity Monitor]]
- [[_COMMUNITY_Backend Middleware|Backend Middleware]]
- [[_COMMUNITY_AgKit Code Metrics|AgKit Code Metrics]]
- [[_COMMUNITY_Decipher Game|Decipher Game]]
- [[_COMMUNITY_Backend Analytics|Backend Analytics]]
- [[_COMMUNITY_AgKit Progress Tracker|AgKit Progress Tracker]]
- [[_COMMUNITY_Study Area|Study Area]]
- [[_COMMUNITY_AgKit Responsive Audit|AgKit Responsive Audit]]
- [[_COMMUNITY_Backend Auth Middleware|Backend Auth Middleware]]
- [[_COMMUNITY_AgKit UI Dialog|AgKit UI Dialog]]
- [[_COMMUNITY_AgKit Accessibility Audit|AgKit Accessibility Audit]]
- [[_COMMUNITY_Profile Component|Profile Component]]
- [[_COMMUNITY_Lesson Types|Lesson Types]]
- [[_COMMUNITY_Category Hub|Category Hub]]
- [[_COMMUNITY_AgKit UI Dropdown|AgKit UI Dropdown]]
- [[_COMMUNITY_AgKit API Dashboard|AgKit API Dashboard]]
- [[_COMMUNITY_AgKit Docs Layout|AgKit Docs Layout]]
- [[_COMMUNITY_AgKit Navbar|AgKit Navbar]]
- [[_COMMUNITY_AgKit Landing Page|AgKit Landing Page]]
- [[_COMMUNITY_AgKit Sidebar|AgKit Sidebar]]
- [[_COMMUNITY_AgKit Feature Cards|AgKit Feature Cards]]
- [[_COMMUNITY_AgKit Footer|AgKit Footer]]
- [[_COMMUNITY_AgKit Docs Components|AgKit Docs Components]]
- [[_COMMUNITY_Pricing Component|Pricing Component]]
- [[_COMMUNITY_Payment System|Payment System]]
- [[_COMMUNITY_Rich Text Editor|Rich Text Editor]]
- [[_COMMUNITY_PPTX Export|PPTX Export]]
- [[_COMMUNITY_PPTX Parser|PPTX Parser]]
- [[_COMMUNITY_Icon System|Icon System]]
- [[_COMMUNITY_How It Works|How It Works]]
- [[_COMMUNITY_Settings Service|Settings Service]]
- [[_COMMUNITY_Gemini AI Service|Gemini AI Service]]
- [[_COMMUNITY_Text Processor|Text Processor]]
- [[_COMMUNITY_UX Audit Scripts|UX Audit Scripts]]
- [[_COMMUNITY_Type Coverage|Type Coverage]]
- [[_COMMUNITY_Mobile Audit|Mobile Audit]]
- [[_COMMUNITY_AgKit Theme Provider|AgKit Theme Provider]]
- [[_COMMUNITY_Settings Routes|Settings Routes]]
- [[_COMMUNITY_AgKit Alert Component|AgKit Alert Component]]
- [[_COMMUNITY_AgKit Popover|AgKit Popover]]
- [[_COMMUNITY_AgKit Tabs|AgKit Tabs]]
- [[_COMMUNITY_Materials Migration|Materials Migration]]
- [[_COMMUNITY_Apply Materials Script|Apply Materials Script]]
- [[_COMMUNITY_Seed Game Cases|Seed Game Cases]]
- [[_COMMUNITY_AI Text-to-Speech|AI Text-to-Speech]]
- [[_COMMUNITY_Lighthouse Audit|Lighthouse Audit]]
- [[_COMMUNITY_AgKit Accordion|AgKit Accordion]]
- [[_COMMUNITY_Text-to-Speech Hook|Text-to-Speech Hook]]
- [[_COMMUNITY_AgKit Avatar|AgKit Avatar]]
- [[_COMMUNITY_Lesson Types Index|Lesson Types Index]]
- [[_COMMUNITY_React Quill Types|React Quill Types]]
- [[_COMMUNITY_DB Check Backend|DB Check Backend]]
- [[_COMMUNITY_Debug Questions|Debug Questions]]
- [[_COMMUNITY_DB Setup Check|DB Setup Check]]
- [[_COMMUNITY_Admin Confirmation|Admin Confirmation]]
- [[_COMMUNITY_AgKit Radio Group|AgKit Radio Group]]
- [[_COMMUNITY_ESLint Config|ESLint Config]]
- [[_COMMUNITY_Next.js Config|Next.js Config]]
- [[_COMMUNITY_PostCSS Config|PostCSS Config]]
- [[_COMMUNITY_AgKit Docs Config|AgKit Docs Config]]
- [[_COMMUNITY_Gemini Client|Gemini Client]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 258 edges
2. `supabase` - 28 edges
3. `Category` - 28 edges
4. `buildApp()` - 26 edges
5. `authService` - 20 edges
6. `authenticate()` - 19 edges
7. `API_URL` - 18 edges
8. `compilerOptions` - 16 edges
9. `compilerOptions` - 16 edges
10. `requireAdmin()` - 13 edges

## Surprising Connections (you probably didn't know these)
- `DecipherGameProps` --references--> `Category`  [EXTRACTED]
  components/DecipherGame.tsx → types.ts
- `GameAreaProps` --references--> `Category`  [EXTRACTED]
  components/GameArea.tsx → types.ts
- `CategoryHubProps` --references--> `Category`  [EXTRACTED]
  components/CategoryHub.tsx → types.ts
- `ConnectionGameProps` --references--> `Category`  [EXTRACTED]
  components/ConnectionGame.tsx → types.ts
- `FlashcardAreaProps` --references--> `Category`  [EXTRACTED]
  components/FlashcardArea.tsx → types.ts

## Import Cycles
- 1-file cycle: `.temp_ag_kit/web/src/components/ui/dialog.tsx -> .temp_ag_kit/web/src/components/ui/dialog.tsx`
- 1-file cycle: `.temp_ag_kit/web/src/components/ui/accordion.tsx -> .temp_ag_kit/web/src/components/ui/accordion.tsx`
- 1-file cycle: `.temp_ag_kit/web/src/components/ui/alert-dialog.tsx -> .temp_ag_kit/web/src/components/ui/alert-dialog.tsx`
- 1-file cycle: `.temp_ag_kit/web/src/components/ui/autocomplete.tsx -> .temp_ag_kit/web/src/components/ui/autocomplete.tsx`
- 1-file cycle: `.temp_ag_kit/web/src/components/ui/input.tsx -> .temp_ag_kit/web/src/components/ui/input.tsx`
- 1-file cycle: `.temp_ag_kit/web/src/components/ui/scroll-area.tsx -> .temp_ag_kit/web/src/components/ui/scroll-area.tsx`
- 1-file cycle: `.temp_ag_kit/web/src/components/ui/avatar.tsx -> .temp_ag_kit/web/src/components/ui/avatar.tsx`
- 1-file cycle: `.temp_ag_kit/web/src/components/ui/toast.tsx -> .temp_ag_kit/web/src/components/ui/toast.tsx`
- 1-file cycle: `.temp_ag_kit/web/src/components/ui/checkbox-group.tsx -> .temp_ag_kit/web/src/components/ui/checkbox-group.tsx`
- 1-file cycle: `.temp_ag_kit/web/src/components/ui/checkbox.tsx -> .temp_ag_kit/web/src/components/ui/checkbox.tsx`
- 1-file cycle: `.temp_ag_kit/web/src/components/ui/collapsible.tsx -> .temp_ag_kit/web/src/components/ui/collapsible.tsx`
- 1-file cycle: `.temp_ag_kit/web/src/components/ui/combobox.tsx -> .temp_ag_kit/web/src/components/ui/combobox.tsx`
- 1-file cycle: `.temp_ag_kit/web/src/components/ui/field.tsx -> .temp_ag_kit/web/src/components/ui/field.tsx`
- 1-file cycle: `.temp_ag_kit/web/src/components/ui/fieldset.tsx -> .temp_ag_kit/web/src/components/ui/fieldset.tsx`
- 1-file cycle: `.temp_ag_kit/web/src/components/ui/form.tsx -> .temp_ag_kit/web/src/components/ui/form.tsx`
- 1-file cycle: `.temp_ag_kit/web/src/components/ui/separator.tsx -> .temp_ag_kit/web/src/components/ui/separator.tsx`
- 1-file cycle: `.temp_ag_kit/web/src/components/ui/number-field.tsx -> .temp_ag_kit/web/src/components/ui/number-field.tsx`
- 1-file cycle: `.temp_ag_kit/web/src/components/ui/menu.tsx -> .temp_ag_kit/web/src/components/ui/menu.tsx`
- 1-file cycle: `.temp_ag_kit/web/src/components/ui/meter.tsx -> .temp_ag_kit/web/src/components/ui/meter.tsx`
- 1-file cycle: `.temp_ag_kit/web/src/components/ui/popover.tsx -> .temp_ag_kit/web/src/components/ui/popover.tsx`

## Communities (94 total, 15 thin omitted)

### Community 0 - "Core App & Navigation"
Cohesion: 0.06
Nodes (46): Card(), CardAction(), CardDescription(), CardFooter(), CardHeader(), CardPanel(), CardTitle(), Frame() (+38 more)

### Community 1 - "Backend API Routes"
Cohesion: 0.05
Nodes (42): BM25, detect_domain(), _load_csv(), BM25 ranking algorithm for text search, Lowercase, split, remove punctuation, filter short words, Build BM25 index from documents, Score all documents against query, Load CSV and return list of dicts (+34 more)

### Community 2 - "AgKit Session Manager"
Cohesion: 0.06
Nodes (49): datetime, Colors, main(), print_error(), print_final_report(), print_header(), print_step(), print_success() (+41 more)

### Community 3 - "Admin Panel Components"
Cohesion: 0.06
Nodes (30): AdminAreaProps, FileItem, BlockedUser, AdminDecipherTerms(), AdminDecipherTermsProps, DecipherTerm, AdminFreeLimit(), IPLimit (+22 more)

### Community 4 - "Lesson Management"
Cohesion: 0.06
Nodes (33): metadata, navSections, Footer(), DonateDialogProps, navSections, ThemeToggle(), Header(), Button() (+25 more)

### Community 5 - "AgKit CLI Utils"
Cohesion: 0.06
Nodes (41): ScrollArea(), ScrollBar(), SheetBackdrop(), SheetDescription(), SheetFooter(), SheetHeader(), SheetPanel(), SheetPopup() (+33 more)

### Community 6 - "AgKit API Client"
Cohesion: 0.08
Nodes (35): check_script_exists(), Colors, main(), print_error(), print_header(), print_step(), print_success(), print_summary() (+27 more)

### Community 7 - "AgKit Config System"
Cohesion: 0.08
Nodes (32): SearchGroup, searchGroups, SearchItem, AutocompleteClear(), AutocompleteCollection(), AutocompleteEmpty(), AutocompleteGroup(), AutocompleteGroupLabel() (+24 more)

### Community 8 - "Supabase Auth Service"
Cohesion: 0.10
Nodes (19): Checkbox(), CheckboxGroup(), Fieldset(), FieldsetLegend(), Form(), Group(), GroupSeparator(), GroupText() (+11 more)

### Community 9 - "AgKit Bash Utils"
Cohesion: 0.12
Nodes (24): ALPHABET, DecipherGameProps, GameAreaProps, LogEntry, cleanText(), extractSections(), fetchConnectionQuestions(), fetchDecipherTermsForGame() (+16 more)

### Community 10 - "Quiz & Knowledge Tests"
Cohesion: 0.06
Nodes (30): dependencies, axios, dompurify, @google/genai, jszip, pdfjs-dist, pptx-text-parser, pptxgenjs (+22 more)

### Community 11 - "Game Area Components"
Cohesion: 0.07
Nodes (29): dependencies, @base-ui/react, class-variance-authority, lucide-react, next, next-themes, react, react-dom (+21 more)

### Community 12 - "Frontend Design Audit"
Cohesion: 0.07
Nodes (28): author, dependencies, dotenv, fastify, @fastify/cors, @fastify/multipart, @fastify/static, @google/generative-ai (+20 more)

### Community 13 - "AgKit Data Visualization"
Cohesion: 0.07
Nodes (28): author, dependencies, dotenv, fastify, @fastify/cors, @fastify/multipart, @fastify/static, @google/generative-ai (+20 more)

### Community 14 - "AgKit Security Audit"
Cohesion: 0.07
Nodes (28): author, dependencies, dotenv, fastify, @fastify/cors, @fastify/multipart, @fastify/static, @google/generative-ai (+20 more)

### Community 15 - "Flashcard System"
Cohesion: 0.11
Nodes (18): CategoryHubProps, ConnectionGameProps, DEFAULT_QUESTIONS, Question, DashboardProps, FlashcardAreaProps, QuizAreaProps, StudyAreaProps (+10 more)

### Community 16 - "Backend Lesson Service"
Cohesion: 0.10
Nodes (17): App(), Login(), LoginProps, Preloader(), PreloaderProps, FlashcardSession, ProfileProps, QuizResult (+9 more)

### Community 17 - "Backend Game Service"
Cohesion: 0.15
Nodes (18): buildApp(), sanitizeBody(), adminLimitsRoutes(), blockingRoutes(), contentRoutes(), correctionRoutes(), decipherRoutes(), CATEGORY_MAP (+10 more)

### Community 18 - "Connection Game"
Cohesion: 0.16
Nodes (21): generateConversationalBlocks(), generateDigitalLesson(), generateFallbackBlocks(), generateFallbackSlides(), generateFlashcards(), generateGameIntegration(), generateQuizFeedback(), generateQuizQuestions() (+13 more)

### Community 19 - "AgKit Activity Monitor"
Cohesion: 0.19
Nodes (14): adminActionCounts, adminActionLimit(), checkNotBlocked(), DEFAULT_ADMIN_EMAILS, getAdminEmails(), requireAdmin(), requirePlan(), authenticate() (+6 more)

### Community 20 - "Backend Middleware"
Cohesion: 0.17
Nodes (7): supabase, __dirname, __filename, pump, UPLOAD_DIR, CATEGORY_NAME_MAP, getCategoryId()

### Community 21 - "AgKit Code Metrics"
Cohesion: 0.16
Nodes (13): openai, openai, openai, start(), config, aiRateLimiter(), CATEGORY_CONFIGS, gameRoutes() (+5 more)

### Community 22 - "Decipher Game"
Cohesion: 0.10
Nodes (12): ComboboxChips(), ComboboxContext, ComboboxEmpty(), ComboboxGroup(), ComboboxGroupLabel(), ComboboxInput(), ComboboxItem(), ComboboxList() (+4 more)

### Community 23 - "Backend Analytics"
Cohesion: 0.10
Nodes (19): aliases, components, hooks, lib, ui, utils, iconLibrary, registries (+11 more)

### Community 24 - "AgKit Progress Tracker"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 25 - "Study Area"
Cohesion: 0.14
Nodes (15): generateQualityReport(), isReadyForPublish(), LessonGenerationError, LessonValidationError, validateConversationalLesson(), validateFlashcards(), validateIdentification(), validateLesson() (+7 more)

### Community 26 - "AgKit Responsive Audit"
Cohesion: 0.12
Nodes (14): AdminLessonsManagerProps, ConversationalBlock, ConversationalLesson, Lesson, LessonFlashcard, LessonMiniQuiz, MiniQuizQuestion, QuizAlternative (+6 more)

### Community 27 - "Backend Auth Middleware"
Cohesion: 0.12
Nodes (16): LessonSelectorProps, SupplementaryMaterial, ConversationalLesson, DigitalLesson, GameIntegration, InteractionType, KeyPoint, LESSON_LEVELS (+8 more)

### Community 28 - "AgKit UI Dialog"
Cohesion: 0.15
Nodes (13): Field(), FieldDescription(), FieldError(), FieldItem(), FieldLabel(), InputGroup(), InputGroupAddon(), inputGroupAddonVariants (+5 more)

### Community 29 - "AgKit Accessibility Audit"
Cohesion: 0.21
Nodes (8): Header(), HeaderProps, HowItWorksProps, PaymentMethod, PaymentProps, PricingProps, AppSettings, settingsService

### Community 30 - "Profile Component"
Cohesion: 0.11
Nodes (17): compilerOptions, allowImportingTsExtensions, allowJs, experimentalDecorators, isolatedModules, jsx, lib, module (+9 more)

### Community 31 - "Lesson Types"
Cohesion: 0.23
Nodes (12): IconBadge(), IconBadgeProps, IconButton(), IconButtonProps, IconCircle(), IconCircleProps, ICON_NAMES, ICON_SIZE_CLASSES (+4 more)

### Community 32 - "Category Hub"
Cohesion: 0.14
Nodes (12): LessonAreaProps, LessonTab, SupplementaryMaterial, ConversationalBlock, LessonFlashcard, LessonProgress, LessonSlide, MiniQuizQuestion (+4 more)

### Community 33 - "AgKit UI Dropdown"
Cohesion: 0.19
Nodes (9): AdminTrilhas(), KnowledgeTestAreaProps, QUESTION_COUNT_OPTIONS, TrialLimitState, CATEGORIES, MOCK_STATS, MOCK_TOPICS, CategoryId (+1 more)

### Community 34 - "AgKit API Dashboard"
Cohesion: 0.20
Nodes (13): aiUsageStore, getAllowedOrigins(), getClientIP(), getRateLimitType(), isOriginAllowed(), isValidIP(), RATE_LIMITS, rateLimiter() (+5 more)

### Community 35 - "AgKit Docs Layout"
Cohesion: 0.15
Nodes (12): author, bugs, url, description, homepage, keywords, license, name (+4 more)

### Community 36 - "AgKit Navbar"
Cohesion: 0.29
Nodes (10): check_hardcoded_strings(), check_locale_completeness(), find_locale_files(), flatten_keys(), main(), Path, Flatten nested dict keys., Check for hardcoded strings in code files. (+2 more)

### Community 37 - "AgKit Landing Page"
Cohesion: 0.20
Nodes (6): Badge(), BadgeProps, badgeVariants, CollapsiblePanel(), CollapsibleTrigger(), PreviewCardPopup()

### Community 38 - "AgKit Sidebar"
Cohesion: 0.22
Nodes (8): Label(), NumberField(), NumberFieldContext, NumberFieldDecrement(), NumberFieldGroup(), NumberFieldIncrement(), NumberFieldInput(), NumberFieldScrubArea()

### Community 39 - "AgKit Feature Cards"
Cohesion: 0.22
Nodes (7): AlertDialogBackdrop(), AlertDialogDescription(), AlertDialogFooter(), AlertDialogHeader(), AlertDialogPopup(), AlertDialogTitle(), AlertDialogViewport()

### Community 40 - "AgKit Footer"
Cohesion: 0.39
Nodes (8): check_api_code(), check_openapi_spec(), find_api_files(), main(), Path, Find API-related files., Check OpenAPI/Swagger specification., Check API code for common issues.

### Community 41 - "AgKit Docs Components"
Cohesion: 0.39
Nodes (8): check_page(), find_web_pages(), is_page_file(), main(), Path, Check a single web page for GEO elements., Check if this file is likely a public-facing page., Find public-facing web pages only.

### Community 42 - "Pricing Component"
Cohesion: 0.22
Nodes (8): buildCommand, cleanUrls, framework, headers, outputDirectory, rewrites, $schema, trailingSlash

### Community 43 - "Payment System"
Cohesion: 0.39
Nodes (6): estimateDuration(), generateWithGoogleTTS(), tryResponsiveVoice(), tryStreamElements(), tryVoiceRSS(), VOICE_CONFIGS

### Community 44 - "Rich Text Editor"
Cohesion: 0.54
Nodes (7): get_project_root(), get_start_command(), is_running(), main(), start_server(), status_server(), stop_server()

### Community 45 - "PPTX Export"
Cohesion: 0.32
Nodes (3): metadata, CodeBlock(), CodeBlockProps

### Community 46 - "PPTX Parser"
Cohesion: 0.25
Nodes (5): BreadcrumbItem(), BreadcrumbLink(), BreadcrumbList(), BreadcrumbPage(), BreadcrumbSeparator()

### Community 47 - "Icon System"
Cohesion: 0.29
Nodes (7): Empty(), EmptyContent(), EmptyDescription(), EmptyHeader(), EmptyMedia(), emptyMediaVariants, EmptyTitle()

### Community 48 - "How It Works"
Cohesion: 0.29
Nodes (5): SelectItem(), SelectPopup(), SelectSeparator(), SelectTrigger(), SelectValue()

### Community 49 - "Settings Service"
Cohesion: 0.29
Nodes (4): BLOCKING_FILE, DATA_DIR, __dirname, __filename

### Community 51 - "Text Processor"
Cohesion: 0.67
Nodes (5): cleanText(), convertToMarkdown(), generateLocalSummary(), processDocument(), splitIntoSections()

### Community 53 - "Type Coverage"
Cohesion: 0.48
Nodes (6): check_python_coverage(), check_typescript_coverage(), main(), Path, Check TypeScript type coverage., Check Python type hints coverage.

### Community 55 - "AgKit Theme Provider"
Cohesion: 0.33
Nodes (4): geistMono, geistSans, metadata, ThemeProvider()

### Community 56 - "Settings Routes"
Cohesion: 0.33
Nodes (3): dataDir, __dirname, SETTINGS_FILE

### Community 57 - "AgKit Alert Component"
Cohesion: 0.40
Nodes (5): Alert(), AlertAction(), AlertDescription(), AlertTitle(), alertVariants

### Community 58 - "AgKit Popover"
Cohesion: 0.40
Nodes (3): PopoverDescription(), PopoverPopup(), PopoverTitle()

### Community 59 - "AgKit Tabs"
Cohesion: 0.40
Nodes (5): Tabs(), TabsList(), TabsPanel(), TabsTab(), TabsVariant

### Community 60 - "Materials Migration"
Cohesion: 0.40
Nodes (3): __dirname, __filename, supabase

### Community 61 - "Apply Materials Script"
Cohesion: 0.40
Nodes (3): __dirname, __filename, supabase

### Community 62 - "Seed Game Cases"
Cohesion: 0.50
Nodes (4): CASES, createTableIfNeeded(), seedCases(), supabase

### Community 63 - "AI Text-to-Speech"
Cohesion: 0.40
Nodes (3): AIAudioOptions, AIAudioState, audioCache

### Community 64 - "Lighthouse Audit"
Cohesion: 0.50
Nodes (4): get_summary(), Run Lighthouse audit on URL., Generate summary based on scores., run_lighthouse()

### Community 65 - "AgKit Accordion"
Cohesion: 0.50
Nodes (3): AccordionItem(), AccordionPanel(), AccordionTrigger()

### Community 67 - "AgKit Avatar"
Cohesion: 0.67
Nodes (3): Avatar(), AvatarFallback(), AvatarImage()

### Community 69 - "React Quill Types"
Cohesion: 0.50
Nodes (3): Quill, ReactQuill, ReactQuillProps

## Knowledge Gaps
- **346 isolated node(s):** `Colors`, `Colors`, `name`, `version`, `description` (+341 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **15 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Core App & Navigation` to `AgKit Accordion`, `AgKit Avatar`, `Lesson Management`, `AgKit Landing Page`, `AgKit Sidebar`, `AgKit Config System`, `AgKit Feature Cards`, `Supabase Auth Service`, `AgKit Radio Group`, `AgKit CLI Utils`, `PPTX Parser`, `Icon System`, `How It Works`, `Decipher Game`, `AgKit Alert Component`, `AgKit Popover`, `AgKit Tabs`, `AgKit UI Dialog`?**
  _High betweenness centrality (0.071) - this node is a cross-community bridge._
- **Why does `openai` connect `AgKit Code Metrics` to `Frontend Design Audit`?**
  _High betweenness centrality (0.009) - this node is a cross-community bridge._
- **Why does `dependencies` connect `AgKit Data Visualization` to `AgKit Code Metrics`?**
  _High betweenness centrality (0.008) - this node is a cross-community bridge._
- **Are the 22 inferred relationships involving `buildApp()` (e.g. with `rateLimiter()` and `sanitizeBody()`) actually correct?**
  _`buildApp()` has 22 INFERRED edges - model-reasoned connections that need verification._
- **What connects `BM25 ranking algorithm for text search`, `Lowercase, split, remove punctuation, filter short words`, `Build BM25 index from documents` to the rest of the system?**
  _409 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Core App & Navigation` be split into smaller, more focused modules?**
  _Cohesion score 0.06412583182093164 - nodes in this community are weakly interconnected._
- **Should `Backend API Routes` be split into smaller, more focused modules?**
  _Cohesion score 0.05263157894736842 - nodes in this community are weakly interconnected._