/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { describe, it, expect, vi } from "vitest";
import { ConsumableEditor } from "./ConsumableEditor";
import type { EditorField } from "./TableEditor";

// Mock TableEditor to a stub that renders field labels directly — avoids needing real RHF internals
vi.mock("@/components/editors/TableEditor", () => ({
  TableEditor: ({ fields }: { fields: EditorField[] }) => (
    <div data-testid="table-editor">
      {fields.map((f) => (
        <label key={f.name}>{f.label}</label>
      ))}
    </div>
  ),
}));

vi.mock("@/hooks/useEditorForm", () => ({
  useEditorForm: () => ({
    form: {
      handleSubmit: vi.fn(() => vi.fn()),
      formState: { isDirty: false },
      getValues: vi.fn(() => ({})),
      setValue: vi.fn(),
      watch: vi.fn(() => ""),
      reset: vi.fn(),
      register: vi.fn(),
      control: {},
    },
    baseData: undefined,
    displayIcon: null,
    generatedFilename: "new_item.json",
    watchedName: "Test Item",
    editorActions: {
      handleDelete: vi.fn(),
      isSaving: false,
      preview: null,
      closePreview: vi.fn(),
      handleClientValidation: vi.fn(),
    },
    handleSaveAction: vi.fn(),
    handleQueueAction: vi.fn(),
    handleQuickQueueAction: vi.fn(),
    handleReset: vi.fn(),
  }),
}));

vi.mock("@/hooks/useKeyboardShortcuts", () => ({
  useKeyboardShortcuts: vi.fn(),
}));

vi.mock("@/components/editors/panels/UnitHeaderPanel", () => ({
  UnitHeaderPanel: ({ unitName }: { unitName?: string }) => (
    <div data-testid="unit-header">{unitName}</div>
  ),
}));
vi.mock("@/components/editors/panels/EntityHistoryPanel", () => ({
  EntityHistoryPanel: () => <div data-testid="history-panel" />,
}));
vi.mock("@/components/editors/panels/MechanicsPanel", () => ({
  MechanicsPanel: () => <div data-testid="mechanics-panel" />,
}));
vi.mock("@/components/editors/dialogs/SavePreviewDialog", () => ({
  SavePreviewDialog: () => null,
}));

describe("ConsumableEditor", () => {
  const defaultProps = {
    filename: "potion.json",
    initialData: {
      id: "potion_1",
      name: "Health Potion",
      effect_type: "Heal" as const,
      value: 50,
      duration: 0,
      stack_size: 5,
      description: "Restores health.",
    },
  };

  it("renders without crashing", () => {
    const { container } = render(<ConsumableEditor {...defaultProps} />);
    expect(container).toBeDefined();
  });

  it("renders the UnitHeaderPanel with the mocked watchedName", () => {
    render(<ConsumableEditor {...defaultProps} />);
    expect(screen.getByTestId("unit-header")).toBeInTheDocument();
    expect(screen.getByTestId("unit-header").textContent).toBe("Test Item");
  });

  it("renders the MechanicsPanel (from CONSUMABLE_EDITOR_CONFIG.extraPanels)", () => {
    render(<ConsumableEditor {...defaultProps} />);
    expect(screen.getByTestId("mechanics-panel")).toBeInTheDocument();
  });

  it("renders core consumable field labels from the schema config", () => {
    render(<ConsumableEditor {...defaultProps} />);
    // CONSUMABLE_FIELD_CONFIG defines these label overrides. TableEditor stub renders labels directly.
    expect(screen.getByText("Effect")).toBeInTheDocument(); // effect_type → 'Effect'
    expect(screen.getByText("Max Stack")).toBeInTheDocument(); // stack_size  → 'Max Stack'
    expect(screen.getByText("Description")).toBeInTheDocument(); // description
    expect(screen.getByText("Value")).toBeInTheDocument(); // value
  });

  it("does not render excluded system field names as labels", () => {
    render(<ConsumableEditor {...defaultProps} />);
    // 'id', '$schema', 'mechanics', 'tags' are all in SYSTEM_FIELDS exclusion list
    expect(screen.queryByText("$schema")).not.toBeInTheDocument();
    expect(screen.queryByText("Id")).not.toBeInTheDocument();
  });
});
