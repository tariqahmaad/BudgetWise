// Diagram locations and metadata for FAQ page
export const DIAGRAM_LOCATIONS = {
  AI_COMPONENTS: require("../assets/uml/AI Components Architecture.png"),
  CLASS_DIAGRAM: require("../assets/uml/Class Diagram.png"),
  COMPONENT_ARCHITECTURE: require("../assets/uml/Component Architecture.png"),
  DATA_FLOW: require("../assets/uml/Data Flow Architecture.png"),
  DIAGRAMS_OVERVIEW: require("../assets/uml/Diagrams.drawio.png"),
  ER_DIAGRAM: require("../assets/uml/ER diagram.png"),
  NAVIGATION_STRUCTURE: require("../assets/uml/Navigation Structure.png"),
  SEQUENCE_AI_CHAT: require("../assets/uml/Sequence AI Chat.png"),
  SEQUENCE_DEBT_MANAGEMENT: require("../assets/uml/Sequence Debt Management.png"),
  SEQUENCE_TRANSACTION_PROCESSING: require("../assets/uml/sequence Transaction Processing.png"),
  SETTINGS_MODULE: require("../assets/uml/Settings Module Architecture.png"),
  SYSTEM_ARCHITECTURE: require("../assets/uml/System Architecture.png"),
  USE_CASE: require("../assets/uml/Use Case.png"),
};

export const FAQ_SECTIONS = [
  {
    id: "1",
    title: "System Architecture",
    description:
      "Understanding BudgetWise's overall system design and architecture",
    diagrams: [
      {
        id: "system_arch",
        title: "System Architecture Overview",
        description:
          "High-level view of the BudgetWise system components and their interactions",
        image: DIAGRAM_LOCATIONS.SYSTEM_ARCHITECTURE,
      },
      {
        id: "component_arch",
        title: "Component Architecture",
        description:
          "Detailed breakdown of application components and their relationships",
        image: DIAGRAM_LOCATIONS.COMPONENT_ARCHITECTURE,
      },
    ],
  },
  {
    id: "2",
    title: "Navigation & User Flow",
    description: "How users navigate through the application",
    diagrams: [
      {
        id: "navigation",
        title: "Navigation Structure",
        description:
          "Complete navigation flow and screen relationships in BudgetWise",
        image: DIAGRAM_LOCATIONS.NAVIGATION_STRUCTURE,
      },
      {
        id: "use_case",
        title: "Use Case Diagram",
        description: "User interactions and system use cases",
        image: DIAGRAM_LOCATIONS.USE_CASE,
      },
    ],
  },
  {
    id: "3",
    title: "Data Management",
    description: "How BudgetWise handles and processes your financial data",
    diagrams: [
      {
        id: "er_diagram",
        title: "Entity Relationship Diagram",
        description:
          "Database structure and relationships between different data entities",
        image: DIAGRAM_LOCATIONS.ER_DIAGRAM,
      },
      {
        id: "data_flow",
        title: "Data Flow Architecture",
        description: "How data moves through the application",
        image: DIAGRAM_LOCATIONS.DATA_FLOW,
      },
      {
        id: "class_diagram",
        title: "Class Diagram",
        description: "Object-oriented design and class relationships",
        image: DIAGRAM_LOCATIONS.CLASS_DIAGRAM,
      },
    ],
  },
  {
    id: "4",
    title: "AI Features",
    description: "Understanding the AI-powered features in BudgetWise",
    diagrams: [
      {
        id: "ai_components",
        title: "AI Components Architecture",
        description: "How AI features are integrated into the application",
        image: DIAGRAM_LOCATIONS.AI_COMPONENTS,
      },
      {
        id: "ai_chat_sequence",
        title: "AI Chat Sequence",
        description: "Step-by-step process of AI chat interactions",
        image: DIAGRAM_LOCATIONS.SEQUENCE_AI_CHAT,
      },
    ],
  },
  {
    id: "5",
    title: "Transaction Processing",
    description: "How transactions are handled in the system",
    diagrams: [
      {
        id: "transaction_sequence",
        title: "Transaction Processing Sequence",
        description: "Complete flow of transaction creation and processing",
        image: DIAGRAM_LOCATIONS.SEQUENCE_TRANSACTION_PROCESSING,
      },
    ],
  },
  {
    id: "6",
    title: "Debt Management",
    description: "Understanding the debt tracking features",
    diagrams: [
      {
        id: "debt_sequence",
        title: "Debt Management Sequence",
        description: "How debt tracking and management works",
        image: DIAGRAM_LOCATIONS.SEQUENCE_DEBT_MANAGEMENT,
      },
    ],
  },
  {
    id: "7",
    title: "Settings & Configuration",
    description: "Settings module architecture and user preferences",
    diagrams: [
      {
        id: "settings_module",
        title: "Settings Module Architecture",
        description: "How user settings and preferences are managed",
        image: DIAGRAM_LOCATIONS.SETTINGS_MODULE,
      },
    ],
  },
  {
    id: "8",
    title: "Complete System Overview",
    description: "All diagrams and comprehensive system documentation",
    diagrams: [
      {
        id: "diagrams_overview",
        title: "Complete Diagrams Overview",
        description:
          "Comprehensive view of all system diagrams and documentation",
        image: DIAGRAM_LOCATIONS.DIAGRAMS_OVERVIEW,
      },
    ],
  },
];
