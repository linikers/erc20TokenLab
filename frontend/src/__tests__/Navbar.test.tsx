import { render, screen } from "@testing-library/react";
import Navbar from "@/components/Navbar";
import { describe, it, expect, vi, beforeEach } from "vitest";
import * as Web3Context from "@/context/Web3Context";

// Mock next/navigation
const mockUsePathname = vi.fn();
vi.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
}));

// Mock next/link — render as a plain <a> with the href
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// Default mock return value for useWeb3
const defaultWeb3Mock = {
  account: null,
  balance: "0",
  chainId: 31337,
  networkName: "Local Hardhat",
  isConnected: false,
  loading: false,
  error: null,
  connect: vi.fn(),
  disconnect: vi.fn(),
  refreshBalance: vi.fn(),
  provider: null,
};

vi.mock("@/context/Web3Context", () => ({
  useWeb3: vi.fn(() => defaultWeb3Mock),
}));

describe("Navbar", () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue("/");
    vi.mocked(Web3Context.useWeb3).mockReturnValue(defaultWeb3Mock);
  });

  it("renders the brand name", () => {
    render(<Navbar />);
    expect(screen.getByText("ERC20 Token Lab")).toBeInTheDocument();
  });

  it("renders all navigation links (desktop + mobile)", () => {
    render(<Navbar />);
    const expectedLinks = [
      "Home",
      "Dashboard",
      "Token",
      "Transfer",
      "Approve",
      "Admin",
      "Como Usar",
      "Sobre",
    ];
    for (const link of expectedLinks) {
      // Each link appears twice (desktop nav + mobile menu)
      const elements = screen.getAllByText(link);
      expect(elements.length).toBe(2);
    }
  });

  it("highlights the active link based on pathname", () => {
    mockUsePathname.mockReturnValue("/about");
    render(<Navbar />);
    // Both desktop and mobile links for "Sobre" should have href="/about"
    const sobreLinks = screen.getAllByText("Sobre");
    for (const link of sobreLinks) {
      expect(link.closest("a")).toHaveAttribute("href", "/about");
    }
  });

  it("shows connect button when not connected", () => {
    render(<Navbar />);
    // Desktop "Conectar" button + mobile "Conectar MetaMask" button
    expect(screen.getByText("Conectar")).toBeInTheDocument();
    expect(screen.getByText("Conectar MetaMask")).toBeInTheDocument();
  });

  it("shows account info and disconnect button when connected", () => {
    const connectedMock = {
      ...defaultWeb3Mock,
      account: "0x1234567890abcdef1234567890abcdef12345678",
      balance: "100",
      isConnected: true,
    };
    vi.mocked(Web3Context.useWeb3).mockReturnValue(connectedMock);

    render(<Navbar />);
    // The truncated address appears twice (desktop + mobile)
    const addrElements = screen.getAllByText(/0x1234\.\.\.5678/);
    expect(addrElements.length).toBe(2);
    // "Sair" only appears once (desktop disconnect button)
    expect(screen.getByText("Sair")).toBeInTheDocument();
  });
});
