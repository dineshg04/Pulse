import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import IssuesPage from "./IssuesPage";

const { useIssuesMock } = vi.hoisted(() => ({
  useIssuesMock: vi.fn(),
}));

vi.mock("../hooks/useIssues", () => ({
  useIssues: useIssuesMock,
}));

const mockRefetch = vi.fn();

function renderIssuesPage() {
  return render(
    <MemoryRouter>
      <IssuesPage />
    </MemoryRouter>,
  );
}

describe("IssuesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    useIssuesMock.mockReturnValue({
      data: {
        data: [],
        pagination: {
          total: 0,
          totalPages: 1,
        },
      },
      isLoading: false,
      isError: false,
      refetch: mockRefetch,
    });
  });

  it("displays loading state", () => {
    useIssuesMock.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: mockRefetch,
    });

    const { container } = renderIssuesPage();

    expect(screen.getByText("All Issues")).toBeInTheDocument();
    expect(container.querySelectorAll(".animate-pulse")).toHaveLength(6);
  });

  it("displays empty state when no issues exist", () => {
    renderIssuesPage();

    expect(screen.getByText("No issues found")).toBeInTheDocument();
    expect(
      screen.getByText("Try changing your search or filters."),
    ).toBeInTheDocument();
  });

  it("displays issue information when issues exist", () => {
    useIssuesMock.mockReturnValue({
      data: {
        data: [
          {
            id: "issue-1",
            message: "Cannot read properties of undefined",
            errorType: "TypeError",
            status: "open",
            environments: ["production"],
            totalCount: 25,
            affectedUsers: 10,
            firstSeen: "2026-11-20T10:00:00.000Z",
            lastSeen: "2026-11-22T10:00:00.000Z",
          },
        ],
        pagination: {
          total: 1,
          totalPages: 1,
        },
      },
      isLoading: false,
      isError: false,
      refetch: mockRefetch,
    });

    renderIssuesPage();

    expect(
      screen.getByText("Cannot read properties of undefined"),
    ).toBeInTheDocument();

    expect(screen.getByText("TypeError")).toBeInTheDocument();
    expect(screen.getByText("PRODUCTION")).toBeInTheDocument();
    expect(screen.getByText("25")).toBeInTheDocument();
  });

  it("displays error state and allows retry", () => {
    useIssuesMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch: mockRefetch,
    });

    renderIssuesPage();

    expect(
      screen.getByText("Unable to load issues. Please try again."),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Retry" }));

    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });
});
