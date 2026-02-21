/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import App from "./App";

// Mock all data hooks to prevent real API calls
vi.mock("@/hooks/useAppData", () => ({
  useAppData: vi.fn(),
}));
vi.mock("@/hooks/useEntitySelection", () => ({
  useEntitySelection: vi.fn(),
}));
vi.mock("@/hooks/useUrlSync", () => ({
  useUrlSync: vi.fn(),
}));

// Mock heavy child components that render their own complex subtrees
vi.mock("@/components/forge/ForgePage", () => ({
  ForgePage: () => <div data-testid="forge-page">Forge Page</div>,
}));
vi.mock("@/components/scribe/ScribePanel", () => ({
  ScribePanel: () => <div data-testid="scribe-panel">Scribe Panel</div>,
}));
vi.mock("@/components/layout/AppLayout", () => ({
  AppLayout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="app-layout">{children}</div>
  ),
}));

import { useAppData } from "@/hooks/useAppData";
import { useEntitySelection } from "@/hooks/useEntitySelection";

const mockUseEntitySelection = {
  selectedUnit: null,
  unitData: null,
  isDirty: false,
  isCreating: false,
  restoredChange: null,
  handleSelectUnit: vi.fn(),
  handleCreateStart: vi.fn(),
  handleDuplicate: vi.fn(),
  handleCreateCancel: vi.fn(),
  handleEntityCreated: vi.fn(),
  handleClearSelection: vi.fn(),
  handleOpenInEditor: vi.fn(),
  setIsDirty: vi.fn(),
  setRestoredChange: vi.fn(),
  handleNavigation: vi.fn((cb: () => void) => cb()),
  dialogOpen: false,
  confirmAction: vi.fn(),
  cancelAction: vi.fn(),
};

describe("App", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useEntitySelection).mockReturnValue(mockUseEntitySelection);
  });

  it("renders the loading spinner while data is loading", () => {
    vi.mocked(useAppData).mockReturnValue({
      registry: {},
      items: [],
      pendingChanges: [],
      queuedIds: [],
      isLoading: true,
      fetchData: vi.fn(),
      fetchQueue: vi.fn(),
    } as any);

    render(<App />);

    expect(screen.getByText("Summoning Grimoire...")).toBeInTheDocument();
    expect(screen.queryByTestId("app-layout")).not.toBeInTheDocument();
  });

  it("renders the AppLayout when data has loaded", () => {
    vi.mocked(useAppData).mockReturnValue({
      registry: { units: { folder: "units" } },
      items: [],
      pendingChanges: [],
      queuedIds: [],
      isLoading: false,
      fetchData: vi.fn(),
      fetchQueue: vi.fn(),
    } as any);

    render(<App />);

    expect(screen.queryByText("Summoning Grimoire...")).not.toBeInTheDocument();
    expect(screen.getByTestId("app-layout")).toBeInTheDocument();
  });

  it("renders ForgePage by default (view=forge)", () => {
    vi.mocked(useAppData).mockReturnValue({
      registry: { units: {} },
      items: [],
      pendingChanges: [],
      queuedIds: [],
      isLoading: false,
      fetchData: vi.fn(),
      fetchQueue: vi.fn(),
    } as any);

    render(<App />);

    expect(screen.getByTestId("forge-page")).toBeInTheDocument();
    expect(screen.queryByTestId("scribe-panel")).not.toBeInTheDocument();
  });
});
