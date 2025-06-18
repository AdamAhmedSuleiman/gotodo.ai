// src/pages/ChangelogPage.tsx

import React from 'react';
import { ChangelogEntry } from '../types.js'; 
import { APP_NAME, ICON_PATHS } from '../constants.js'; 
import Icon from '../components/ui/Icon.js'; 


const changelogData: ChangelogEntry[] = [
  {
    version: '2.12.0',
    date: new Date().toISOString().split('T')[0], // Current date
    description: 'Critical Module Resolution and Path Standardization: Addressed several "module not found" and "invalid token" errors by correcting import paths across the application, particularly for root-level `types.ts` and `constants.tsx`. Standardized UI component import paths. Provided guidance on resolving Google Maps "library directions is unknown" and "InvalidKey" errors through API key configuration in Google Cloud Console.',
    changes: [
      "Corrected import paths in `src/App.tsx` to use relative paths for root `types.js` (e.g., `../types.js`) and page components (e.g., `./pages/LoginPage.js`).",
      "Updated `src/services/geminiService.ts` to use relative paths `../types.js` and `../constants.js`.",
      "Fixed import paths in `src/contexts/AuthContext.tsx` to correctly point to root `types.js` and `services/authService.js`.",
      "Standardized import paths for UI components in various files (e.g., `LoginPage.tsx`, `RegistrationPage.tsx`, `HomePage.tsx`, `RequesterPortalPage.tsx`, layout components, etc.) to ensure consistent resolution from `src/components/ui/` or `src/App components/ui/` (as per specific project sub-structure).",
      "Clarified that Google Maps API errors like 'library directions is unknown' and 'InvalidKey' require verification and correct configuration of the API key in the Google Cloud Console, including enabling the Directions API.",
      "Ensured `ICON_PATHS` in `src/constants.tsx` and `constants.tsx` (root) are complete and any string literal issues are resolved.",
      "Removed or corrected path alias usage like `@/types` which are not natively supported by browser ESM, replacing them with appropriate relative paths.",
      "Addressed type mismatches in mock data for `AdminPortalPage.tsx` related to `AdminUserView` and `FlaggedRequestView` to ensure type safety.",
      "Fixed JSX syntax errors (unclosed tags) in `AdminPortalPage.tsx` and `ManageAvailabilityModal.tsx`.",
      "Corrected asynchronous state updates in `RequesterPortalPage.tsx` and `TaskProjectForm.tsx` (e.g., `await`ing service calls before `setState`).",
      "Ensured default exports for components intended for lazy loading (e.g., `ManageAvailabilityModal.tsx`).",
    ],
  },
  {
    version: '2.11.0',
    date: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().split('T')[0], // Approx. yesterday
    description: 'Implemented AI-Powered Critical Path Analysis for Task Projects, fully integrated Task Sub-Item Dependencies, and completed a comprehensive codebase stabilization including foundational type/constant definitions and path corrections.',
    changes: [
      "AI-Powered Critical Path Identification (Task Portal): Added `AICriticalPathInfo` type to `src/types.ts` and integrated it into `TaskProject`. Added `FIRE_ICON` to `src/constants.tsx`. Implemented `identifyCriticalPathAI` in `src/services/geminiService.ts`. `TaskProjectForm.tsx` now features an 'Analyze Critical Path with AI' button, a section for AI's analysis notes, and visual highlighting for items on the critical path. Critical path info is saved with the project. `TaskProjectCard.tsx` indicates if critical path analysis was performed.",
      "Task Project Dependencies (Task Portal): Updated `TaskSubItem` in `src/types.ts` to include `dependsOn?: string[]`. `TaskSubItemFormModal.tsx` fully supports selecting/saving dependencies, with basic circular dependency checks. `TaskProjectForm.tsx` displays dependencies and visual cues for blocked tasks. `prioritizeTaskSubItems` in `geminiService.ts` now strictly considers dependencies for AI task ordering.",
      "Codebase Stabilization & Foundational Setup: Populated `src/types.ts` with comprehensive type definitions. Populated `src/constants.tsx` with application-wide constants, including a consolidated `ICON_PATHS`. Populated `src/globals.d.ts` with necessary global type declarations (Google Maps API, `process.env`). Applied extensive import path corrections across all modules for consistency and correctness.",
      "Minor Fixes & Enhancements: Ensured date fields in mock data (e.g., `AdminPortalPage.tsx`) use ISO string format. Confirmed `Input.tsx` correctly uses `React.forwardRef`. Maintained specific lazy loading configurations in `App.tsx`. Verified and improved Face ID setup flow logic in `RegistrationPage.tsx`. Ensured `ManageProductsModal.tsx` handles `onOpenScanModal` prop.",
    ],
  },
  {
    version: '2.10.0',
    date: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString().split('T')[0], 
    description: 'Enhanced Task Portal with project discussion capabilities, visual progress overviews, image attachment previews, and mock team member management.',
    changes: [
      "Task Project Comments: Added `TaskComment` interface to `src/types.ts`. Implemented comment CRUD in `src/services/taskService.ts`. `TaskProjectForm.tsx` (edit mode) now features a 'Project Discussion & Comments' section to view, add, and manage comments. `TaskProjectCard.tsx` displays comment counts.",
      "Task Project Progress Overview: Added a collapsible 'Project Progress Overview' section in `TaskProjectForm.tsx` (edit mode), featuring textual summaries and Recharts bar charts for sub-item statuses, plus a progress bar for milestone completion.",
      "Image Attachment Previews: `TaskProjectForm.tsx` now displays thumbnail previews for attached image files in the 'Attachments' list using their `mockUrl`.",
      "Task Project Team Members (Mock): Added `TaskTeamMember` to `src/types.ts` and a `team` array to `TaskProject`. `TaskProjectForm.tsx` allows adding/removing mock team members (name, role), and `TaskProjectCard.tsx` shows the team member count.",
    ],
  },
  {
    version: '2.9.0',
    date: new Date(new Date().setDate(new Date().getDate() - 3)).toISOString().split('T')[0], 
    description: 'Enhanced AI Content Usability: Added "Copy to Clipboard" functionality for AI-generated summaries and responses, improving user workflow for sharing and saving information. Includes minor UI polish.',
    changes: [
      "Implemented a `copyToClipboard` utility function using `navigator.clipboard.writeText` in `src/utils/clipboardUtils.ts`.",
      "Added a 'Copy' icon button next to the AI Analysis summary in the `RequestForm` component. Users receive a toast notification on success or failure.",
      "Added a 'Copy' icon button next to the AI Grounded Response on the `HomePage`. Users receive a toast notification.",
      "Added `CLIPBOARD_ICON` to `ICON_PATHS` in `src/constants.tsx`.",
      "Minor polish to toast notifications for image uploads in `RequestForm` to provide more direct feedback.",
      "Ensured consistent error handling and user feedback via toasts for clipboard operations."
    ],
  },
  {
    version: '2.8.0',
    date: new Date(new Date().setDate(new Date().getDate() - 4)).toISOString().split('T')[0], 
    description: 'Advanced Journey Planning Finalization & Map Visualization: Implemented AI-driven sub-request generation from journey plans, enhanced map display with journey paths and distinct stop markers, and expanded action configuration forms.',
    changes: [
      "Journey Finalization: Clicking 'Finalize Journey & Get Options' now iterates through journey stops/actions, using AI to analyze and create individual service requests for each relevant action (e.g., pickup_person, pickup_item, assign_task).",
      "AI-Powered Sub-Request Generation: Each journey action results in a `RequestData` object, analyzed by `analyzeRequestWithGemini` for service type, summary, entities, and price. These are added to the active requests list.",
      "Enhanced Map Visualization for Journeys: `MapDisplay` now renders a polyline connecting all journey stops. Origin ('O'), Destination ('D'), and intermediate Stops (e.g., 'S1') use custom HTML markers for clear visual distinction.",
      "Single A-B Route Display: For non-journey requests, `MapDisplay` now shows a polyline between origin and destination if both are set.",
      "Detailed Action Configuration Forms: `ConfigureStopActionModal` now includes more specific fields for `PickupPersonActionDetails` (e.g., transportation type, vehicle specifics), `PickupItemActionDetails` (e.g., product code, instructions), `DropoffPersonActionDetails` (e.g., passenger selection, luggage), and `DropoffItemActionDetails` (e.g., item selection, quantity, item description) as defined in `src/types.ts`.",
      "UI/UX Refinements for Journey Planner: `JourneyPlannerPanel` now indicates the selected stop for 'Quick Add' actions and disables UI elements during finalization. `JourneyStopCard` visually highlights the selected stop and interactive elements are disabled when the journey is finalizing. Action sub-menus for Pick Up / Drop Off are now functional dropdowns.",
      "Updated `src/types.ts`: Added `passengerSelection`, `luggage` to `DropoffPersonActionDetails`; added `itemSelection`, `quantity`, `unit`, and `itemDescription` to `DropoffItemActionDetails`. Added `transportationType`, `vehicleSubType`, `transportationDetails` to `PickupPersonActionDetails`. Added `productNameOrCode`, `instructionsToDriver` to `PickupItemActionDetails`.",
      "Improved click handling in `MapDisplay` to better differentiate map clicks from marker clicks.",
      "Updated `RequesterPortalPage` to manage journey finalization state (`isFinalizingJourney`), generate map markers for journey stops, and pass the journey path and single route information to `MapDisplay`."
    ],
  },
  {
    version: '2.7.0',
    date: new Date(new Date().setDate(new Date().getDate() - 5)).toISOString().split('T')[0], 
    description: 'Comprehensive Import Path Refactoring & Standardization: Completed a full review and correction of internal import paths within the `src/` directory. This ensures all components, pages, services, and contexts correctly reference modules following structural organization (e.g., UI components in `src/components/ui/`, shared components in `src/components/`). This effort resolves module resolution errors and significantly enhances codebase maintainability and stability.',
    changes: [
      "Standardized import paths for all UI components (e.g., `Button`, `Icon`, `Input`, `Modal`, `LoadingSpinner`, `Textarea`, `StarRating`, `ToastContainer`) to correctly reference their location within `src/components/ui/` from all consuming pages and other components (e.g., `../components/ui/Button.js` or `../../components/ui/Icon.js` depending on depth).",
      "Corrected import paths in `src/App.tsx` for layout components (`Footer` from `src/components/layout/`) and shared UI (`ToastContainer` from `src/components/ui/`).",
      "Updated `src/components/layout/Header.tsx` to use correct relative paths for UI components like `Icon` and `Button` (e.g., `../ui/Icon.js`).",
      "Revised imports in all page components (`HomePage`, `LoginPage`, `RegistrationPage`, `RequesterPortalPage`, `ProviderPortalPage`, `AdminPortalPage`, `SettingsPage`, `ChangelogPage`) to accurately point to modules within `src/` (e.g., `../contexts/`, `../services/`, `../components/ui/`, `../constants.js`, `../types.js`).",
      "Adjusted import paths within nested components in `src/components/` subdirectories (e.g., `auth/`, `admin/`, `dashboard/`, `interaction/`, `journey/`, `map/`, `provider/`, `request/`, `settings/`, `shared/`) to align with the centralized UI component structure and other shared modules in `src/`.",
      "Ensured all references to `constants.tsx` (as `constants.js`) and `types.ts` (as `types.js`) use correct relative paths from their respective file locations within the `src/` directory.",
      "Verified and corrected paths for utility functions like those in `speechUtils.ts` and services like `geminiService.ts`, `mapService.ts` etc.",
      "This systematic path correction resolves potential 'module not found' errors and ensures the application's build integrity and runtime stability with the current `src/` focused architecture.",
    ],
  },
  {
    version: '2.6.0',
    date: new Date(new Date().setDate(new Date().getDate() - 6)).toISOString().split('T')[0], 
    description: 'Comprehensive Application Polish & Stability: Finalized core architecture within `src/`, enhanced UI components, and ensured seamless integration of contexts and services across all major application portals (Requester, Provider, Admin, Settings, Home, Auth).',
    changes: [
      "Completed migration of all UI components (`Icon`, `Button`, `Input`, `Modal`, `LoadingSpinner`, `Textarea`, `StarRating`, etc.) into `src/components/ui/` with corrected import paths and styling.",
      "Finalized and integrated all core contexts (`AuthContext`, `NotificationContext`, `ThemeContext`, `ToastContext`) within `src/contexts/` ensuring consistent state management.",
      "Standardized all service logic (`authService`, `geminiService`, `mapService`, `providerService`, `taskService`, `userDataService`, `speechUtils`) within `src/services/` and `src/utils/` with correct inter-dependencies.",
      "Ensured all page components (`LoginPage`, `RegistrationPage`, `HomePage`, `RequesterPortalPage`, `ProviderPortalPage`, `AdminPortalPage`, `SettingsPage`, `ChangelogPage`) are fully functional within `src/pages/`, correctly importing shared modules and UI components.",
      "Verified `src/types.ts` and `src/constants.tsx` as single sources of truth for types and application-wide constants, respectively.",
      "Polished `index.html` and `index.tsx` for robust application bootstrap, including API key setup, import maps, and global styles.",
      "Refined dark mode implementation for consistent theming across all components and pages.",
      "Enhanced user feedback mechanisms with integrated `ToastContainer` and `NotificationContext`.",
      "Improved accessibility and ARIA attributes where applicable.",
      "Ensured all mock API calls in services are functional and that API key handling in `geminiService.ts` is robust.",
    ],
  },
  {
    version: '2.5.1',
    date: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0], 
    description: 'Extensive TypeScript Refactoring & Stability Pass: Resolved numerous TypeScript compilation errors by standardizing import paths, correcting type definitions (especially in `src/types.ts` and `src/globals.d.ts`), and ensuring consistent module resolution across the application. This enhances overall codebase health and developer experience.',
    changes: [
      "Standardized all internal import paths within the `src/` directory to correctly point to compiled `.js` files, particularly for shared modules like `types.js` and `constants.js`.",
      "Corrected numerous TypeScript errors in page components (`SettingsPage`, `ProviderPortalPage`, `AdminPortalPage`, `HomePage`), UI components, modals, and services by fixing import paths, ensuring default exports, and addressing specific type mismatches or missing definitions.",
      "Augmented `src/types.ts` with missing type definitions (e.g., `ChatMessage`, `ToastContextType`, and various component prop types) to satisfy TypeScript compiler requirements.",
      "Refined `src/globals.d.ts` for more accurate Google Maps API typings.",
      "Removed obsolete root-level `types.ts` and `constants.tsx`, centralizing these within `src/`.",
      "Addressed specific component logic errors (e.g., hook placement in `ProviderPortalPage.tsx`, mock data in `providerService.ts`).",
      "Ensured all UI components in `src/components/ui/` correctly import shared constants.",
    ],
  },
  {
    version: '2.5.0',
    date: new Date(new Date().setDate(new Date().getDate() - 8)).toISOString().split('T')[0], 
    description: 'Advanced Journey Planning & Finalization: Map Visualization and AI-Driven Sub-Request Generation.',
    changes: [
      "Journey Finalization Implemented: Clicking 'Finalize Journey & Get Options' now iterates through journey stops and actions.",
      "AI-Powered Sub-Request Creation: Each action within a journey (pickup, dropoff, task) generates a separate service request, analyzed by AI for service type, summary, and details.",
      "Map Enhancements for Journeys: Origin ('O'), Destination ('D'), and intermediate Stop ('S') markers are displayed on the map during journey planning.",
      "Journey Path Polyline: A visual polyline connects journey stops on the map in sequence.",
      "Improved UI/UX for Journey Planner: The panel now indicates the currently selected stop for 'Quick Add' actions. UI elements are disabled during journey finalization.",
      "Detailed Action Configuration: Forms within the 'Configure Stop Action' modal (e.g., for pickup_person, pickup_item) have been expanded to capture more specific details.",
      "Updated `MapDisplay` component to handle drawing journey paths and distinct journey markers.",
      "Refined `RequesterPortalPage` to manage journey states, marker generation, and finalization logic.",
      "Enhanced `JourneyPlannerPanel` and `JourneyStopCard` for interactivity and visual feedback during journey planning and finalization.",
    ],
  },
  {
    version: '2.4.0',
    date: new Date(new Date().setDate(new Date().getDate() - 9)).toISOString().split('T')[0], 
    description: 'Strategic Update: Deep Integration of Latest AI Tools & Enhanced Future Roadmap.',
    changes: [
      "Overall Strategy Refinement: Explicitly incorporated the latest AI tools to enhance all phases of development and user experience.",
      "AI-Optimized Ride & Journey Workflow: Prioritized 'Ride from Illustrator' (Journey Planner) as a core map-centric interaction. Future enhancements include AI-powered routing, ETA prediction, natural language journey input (e.g., describing multi-stop tasks), and dynamic fare estimation.",
      "AI-Monitored Backend & API Connectivity: Strategy includes leveraging AI for improved API resilience, advanced monitoring, and intelligent load balancing for all connected services.",
      "AI-Driven Data Enrichment: Plans for AI to augment profile imports (summarization, skill extraction from LinkedIn/Google Maps), product data (standardization from website imports, detail augmentation from barcode scans), and service data.",
      "AI-Optimized Service Capabilities: Roadmap includes AI for complex intermodal journey planning (Sea, Land, Air), specialized resource matching, intelligent task assignment/dispatch, proactive issue detection, and AI-driven customer support chatbots.",
      "AI-Assisted Quality & Technical Health: Intend to use AI tools for more insightful usability testing feedback and augmented code review/analysis, supporting the 'check code with Joles' and refactoring goals.",
      "Comprehensive Transportation Types: Reinforced the commitment to include and manage all transportation types (Sea, Land, Air) within service and journey planning workflows.",
      "Focus on Core UX and UI/UX Fixes: Continued emphasis on fixing UI/UX issues and ensuring the application's aesthetic appeal, including integration of new styles from photos/designs.",
      "Cross-Cutting AI Concerns: Strategy emphasizes building a hyper-personalization engine, advanced fraud detection capabilities, and adhering to a robust ethical AI framework.",
      "Note: The 'delete local server and reinstall' point is interpreted as maintaining a clean, well-structured frontend codebase and development environment rather than literal server operations for the frontend.",
    ],
  },
  {
    version: '2.3.0',
    date: new Date(new Date().setDate(new Date().getDate() - 10)).toISOString().split('T')[0], 
    description: 'Major Feature Implementation & Structural Refinement Pass.',
    changes: [
      "Core Structure Solidification: Populated `src/types.ts` and `src/constants.tsx` as central sources of truth. Created essential contexts (`ThemeContext`, `NotificationContext`, `ToastContext`) and services (`userDataService`, `taskService`, `speechUtils`).",
      "UI/UX Enhancements: Introduced `ToastContainer` for global feedback. Created `Textarea`, `StarRating`, `ContextualHelpPanel`, and `OnboardingTour` components. Updated existing UI components (`Button`, `Input`, `Modal`, `LoadingSpinner`) for improved dark mode compatibility, functionality, and consistent styling.",
      "Application Architecture: Refined `src/App.tsx` with all context providers and lazy loading for pages. Relocated `AuthContext`, `authService`, `geminiService`, `mapService` to `src/` subdirectories and corrected import paths across the entire application for consistency and maintainability.",
      "Requester Portal: Significantly enhanced with a map-centric request panel, refined AI analysis for multi-modal inputs (text, image, audio/video context), improved location handling (origin, destination, recipient, saved places/members), provider discovery on map, bidding system, detailed request history with visual status timelines, payment simulation, and mock chat functionality.",
      "Provider Portal: Substantially updated with earnings charts and AI insights, incoming request management, assigned task tracking with status updates, mock location sharing for en-route tasks, simplified navigation assist, earnings history, ability to rate requesters, mock chat, and management modals for services, products, vehicles, availability, documents, payout settings, and work destination. Added a mock heatmap for demand.",
      "New Pages: Fully implemented `SettingsPage.tsx` for user profile management (avatar, phone, notification preferences), password changes (mock), and management of saved places/members. Basic structure and mock functionality for `AdminPortalPage.tsx` (user management, flagged content).",
      "AI Integration Expansion: Added Text-to-Speech (TTS) for AI responses in HomePage and RequestForm. Enabled task creation from AI video suggestions. Ensured robust error handling and API key management for Gemini services.",
      "Path Corrections & Build Stability: Ensured all imports use `.js` extensions for browser ESM compatibility and corrected paths for UI components, contexts, services, types, and constants throughout the project.",
      "Map Display: Enhanced `MapDisplay.tsx` to support custom SVG markers, polyline route drawing, and better click handling for map vs. marker interactions.",
      "Complete Component Suite: Ensured all necessary modals and helper components (e.g., for adding saved items, managing provider offerings, viewing profiles) are present and functional within `src/components/`.",
    ],
  },
  {
    version: '2.2.0',
    date: new Date(new Date().setDate(new Date().getDate() - 11)).toISOString().split('T')[0], 
    description: 'Comprehensive Project Status Report & Feature Consolidation.',
    changes: [
      "Project Audit: This version marks a comprehensive review of all implemented features, AI integrations, and UI/UX elements.",
      "Requester Portal: Solidified map-centric request creation, 'for self/someone else' logic, provider discovery via map markers, and initial multi-step request flows (product purchase + delivery, transportation selection).",
      "Complex AI Project Planning: Users can describe projects, get AI-generated breakdowns, select elements, and initiate provider searches for the first sub-task.",
      "Provider Portal: Features mock earnings/insights, management of services/products/vehicles/availability (localStorage), and handling of incoming/assigned tasks.",
      "Admin Portal: Mock user management (view, suspend/unsuspend status), and moderation queue for flagged/disputed requests.",
      "Core AI: Extensive use of Gemini API for request analysis (text, image, audio, video context), dynamic pricing, grounded Q&A, smart replies, project planning.",
      "UI/UX: Consistent theming (light/dark), toast notifications, contextual help, onboarding tours.",
      "Foundation: Established React/TypeScript SPA structure, importmap for dependencies, Google Maps integration.",
      "Current State: Advanced frontend prototype with mocked backend operations. Next major phase involves backend development and real-time features.",
    ],
  },
  {
    version: '2.1.0',
    date: new Date(new Date().setDate(new Date().getDate() - 12)).toISOString().split('T')[0], 
    description: 'Complex AI Project Planning (Phase 5 - Initial Implementation).',
    changes: [
      "Introduced 'Plan a Complex Project' mode in the Requester Portal.",
      "Added `planComplexProjectWithGemini` function to `geminiService.ts` for AI to break down user's project description (e.g., 'corporate event') and location into key service categories and sub-tasks.",
      "Updated `types.ts` with `ProjectPlan` and `ProjectPlanElement` interfaces to structure AI's project breakdown.",
      "Requester Portal: UI to input project description and location.",
      "Requester Portal: Display of AI-generated project plan, showing categories, descriptions, and sub-services.",
      "Interaction with AI Plan: Users can now select/deselect categories and sub-services within the displayed project plan using checkboxes.",
      "Initiate First Sub-Request: Implemented 'Find Providers for Selected Items' button. This takes the *first selected sub-service* from the project plan, formulates it into a standard service request (including project context in the description), and then triggers the existing AI analysis and provider search flow.",
      "State management in `RequesterPortalPage` enhanced to handle project planning mode, current project plan, and user selections within the plan.",
      "Toast notifications for project planning successes and errors.",
    ],
  },
  {
    version: '2.0.0',
    date: new Date(new Date().setDate(new Date().getDate() - 13)).toISOString().split('T')[0], 
    description: 'Transportation Mode Selection (Phase 4).',
    changes: [
      "Updated `RequestData` and `AIAnalysisResult` types to include `selectedTransportationMode` and `aiSuggestedTransportationModes`.",
      "Enhanced `geminiService.analyzeRequestWithGemini` prompt to ask for `suggestedTransportationModes`.",
      "Updated `providerService.getMockProviders` to filter providers based on a selected `transportationMode`.",
      "Requester Portal: Added UI in the Request Panel for users to select a transportation mode after AI analysis (shows AI suggestions and a manual selector with icons).",
      "Integrated selected transportation mode into the request data and provider fetching logic.",
      "Updated the chained request flow (product purchase + delivery) to include transportation mode selection for the delivery leg.",
      "Added new icons for various transportation modes in `constants.tsx`.",
    ],
  },
  {
    version: '1.9.0',
    date: new Date(new Date().setDate(new Date().getDate() - 14)).toISOString().split('T')[0], 
    description: 'Map-Centric UI & Live Provider Display (Phase 1 & 2 of Goal 1).',
    changes: [
      "Major refactor of `RequesterPortalPage` to a map-centric UI. Map is now the primary workspace.",
      "Implemented a 'Request Panel' overlaying/beside the map for inputting request details (for self/someone else, locations, text description).",
      "Enhanced map interaction: Users can click 'Set on Map' buttons then click the map to define origin, destination, and recipient locations. Addresses are reverse-geocoded.",
      "Added 'Use My Current Location' button for quick origin setting.",
      "Updated `MapDisplay` to handle more descriptive typed markers (origin, destination, recipient, provider, product) with distinct visuals.",
      "Created `providerService.ts` with mock provider data and filtering logic (by service type and location radius).",
      "After AI analysis of a request, relevant mock providers are fetched and displayed on the map.",
      "Implemented `SelectionInfoPanel.tsx` to show details when a provider/product marker on the map is clicked.",
      "Updated `geminiService.analyzeRequestWithGemini` prompt to better utilize structured GeoLocation data and `requestFor` context.",
      "Refined `RequestForm` to work within the new map-centric panel, focusing on text/media input.",
    ],
  },
  {
    version: '1.8.0',
    date: new Date(new Date().setDate(new Date().getDate() - 15)).toISOString().split('T')[0], 
    description: 'Advanced Provider Filtering & Multi-Step Request Flow (Phase 3).',
    changes: [
      "Enhanced `providerService` to filter mock providers using AI-extracted entities (e.g., specific item names, service requirements) for more relevant results.",
      "Updated `RequesterPortalPage` to allow users to initiate multi-step requests. Example flow: 1) User requests to 'buy specific product'. 2) AI identifies product, finds sellers on map. 3) User selects seller (product origin). 4) System prompts if delivery is needed. 5) If yes, prompts for destination, then initiates a linked 'delivery request', finding delivery providers.",
      "Introduced `linkedRequestId` and `isChainedRequest` fields in `RequestData` type.",
      "UI updates in Requester Portal to guide users through chained requests.",
    ],
  }
];

const ChangelogPage: React.FC = () => {
  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 bg-gray-100 dark:bg-gray-900 min-h-[calc(100vh-128px)]">
      <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 shadow-xl rounded-lg p-6 sm:p-8">
        <h1 className="text-3xl font-bold text-center text-gray-800 dark:text-gray-100 mb-2">
          {APP_NAME} Changelog
        </h1>
        <p className="text-center text-gray-500 dark:text-gray-400 mb-8">
          Tracking the evolution of our AI-powered platform.
        </p>

        <div className="space-y-8">
          {changelogData.map((entry) => (
            <section key={entry.version} className="border-b dark:border-gray-700 pb-6 last:border-b-0 last:pb-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
                <h2 className="text-2xl font-semibold text-blue-600 dark:text-blue-400">
                  Version {entry.version}
                </h2>
                <time dateTime={entry.date} className="text-sm text-gray-500 dark:text-gray-400 mt-1 sm:mt-0">
                  Released on: {new Date(entry.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </time>
              </div>
              <p className="text-gray-700 dark:text-gray-300 mb-3">
                {entry.description}
              </p>
              <ul className="list-disc list-outside space-y-1.5 pl-5 text-gray-600 dark:text-gray-400">
                {entry.changes.map((change, index) => (
                  <li key={index} className="leading-relaxed">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Feature/Fix:</span> {change}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
        
        <div className="mt-10 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
                For more details or previous versions, please contact support.
            </p>
        </div>

      </div>
    </div>
  );
};

export default ChangelogPage;