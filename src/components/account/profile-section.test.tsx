import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useAuth } from "@/components/auth/auth-provider";
import type { Profile } from "@/lib/db/profiles";
import { ProfileSection } from "./profile-section";

vi.mock("@/components/auth/auth-provider", () => ({ useAuth: vi.fn() }));

function makeProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    id: "u1",
    email: "me@example.com",
    displayName: "Alice",
    avatarUrl: "https://cdn.example.com/a.jpg",
    updatedAt: "2024-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function mockAuth(profile: Profile | null) {
  vi.mocked(useAuth).mockReturnValue({
    user: { id: "u1" },
    profile,
    updateProfile: vi.fn().mockResolvedValue(null),
    refreshProfile: vi.fn().mockResolvedValue(undefined),
  } as unknown as ReturnType<typeof useAuth>);
}

// The account page keys ProfileSection by profile id so it re-initializes when
// the profile arrives; the harness reproduces that composition exactly.
function Harness({ profile }: { profile: Profile | null }) {
  return <ProfileSection key={profile?.id} />;
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("ProfileSection", () => {
  it("populates the form once the profile loads asynchronously (#29)", () => {
    mockAuth(null);
    const view = render(<Harness profile={null} />);
    // Profile still loading -> the fields are empty.
    expect((screen.getByRole("textbox", { name: /display name/i }) as HTMLInputElement).value).toBe("");

    // The profile arrives; the parent's key change remounts the form so it
    // picks up the loaded values instead of the initial empty ones.
    mockAuth(makeProfile());
    view.rerender(<Harness profile={makeProfile()} />);

    expect((screen.getByRole("textbox", { name: /display name/i }) as HTMLInputElement).value).toBe("Alice");
    expect((screen.getByLabelText(/avatar/i) as HTMLInputElement).value).toBe("https://cdn.example.com/a.jpg");
  });

  it("keeps an in-progress edit when the profile object changes with the same id", () => {
    mockAuth(makeProfile());
    const view = render(<Harness profile={makeProfile()} />);
    const nameInput = screen.getByRole("textbox", { name: /display name/i }) as HTMLInputElement;
    expect(nameInput.value).toBe("Alice");

    fireEvent.change(nameInput, { target: { value: "Bob" } });
    expect(nameInput.value).toBe("Bob");

    // A same-id profile change (e.g. after a save) must not reset the field.
    view.rerender(<Harness profile={makeProfile({ displayName: "Alice" })} />);
    expect((screen.getByRole("textbox", { name: /display name/i }) as HTMLInputElement).value).toBe("Bob");
  });
});
