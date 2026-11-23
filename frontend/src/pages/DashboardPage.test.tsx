
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import DashboardPage from "./DashboardPage";

const { useOverviewMock, useTimeseriesMock, useTopIssuesMock } = vi.hoisted(
  () => ({
    useOverviewMock: vi.fn(),
    useTimeseriesMock: vi.fn(),
    useTopIssuesMock: vi.fn(),
  }),
);

vi.mock("../hooks/useDashboard", () => ({
  useOverview: useOverviewMock,
  useTimeseries: useTimeseriesMock,
  useTopIssues: useTopIssuesMock,
}));

function renderDashboardPage() {
  return render(
    <MemoryRouter>
      <DashboardPage />
    </MemoryRouter>,
  );
}

describe("DashboardPage", () => {
  beforeEach(() => {
    useOverviewMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    useTimeseriesMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    useTopIssuesMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
  });

  it("shows 24 hours as the default time range", () => {
    renderDashboardPage();

    expect(screen.getByLabelText("Time Range")).toHaveValue("24h");

    expect(screen.queryByLabelText("From")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("To")).not.toBeInTheDocument();

    expect(
      screen.queryByRole("button", { name: "Apply" }),
    ).not.toBeInTheDocument();
  });

  it("shows custom date inputs only when custom range is selected", () => {
    renderDashboardPage();

    fireEvent.change(screen.getByLabelText("Time Range"), {
      target: { value: "custom" },
    });

    expect(screen.getByLabelText("Time Range")).toHaveValue("custom");
    expect(screen.getByLabelText("From")).toBeInTheDocument();
    expect(screen.getByLabelText("To")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Time Range"), {
      target: { value: "7d" },
    });

    expect(screen.getByLabelText("Time Range")).toHaveValue("7d");
    expect(screen.queryByLabelText("From")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("To")).not.toBeInTheDocument();
  });
});
