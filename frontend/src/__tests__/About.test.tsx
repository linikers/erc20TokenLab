import { render, screen } from "@testing-library/react";
import AboutPage from "@/app/about/page";
import { describe, it, expect } from "vitest";

describe("About Page", () => {
  it("renders the page title", () => {
    render(<AboutPage />);
    expect(
      screen.getByRole("heading", { name: /Sobre o Projeto/i }),
    ).toBeInTheDocument();
  });

  it("renders the technology badges", () => {
    render(<AboutPage />);
    const techs = [
      "Next.js 15+",
      "Tailwind CSS v4",
      "TypeScript",
      "Hardhat",
      "Ethers.js",
      "OpenZeppelin",
    ];
    for (const tech of techs) {
      expect(screen.getByText(tech)).toBeInTheDocument();
    }
  });

  it("renders the objectives section", () => {
    render(<AboutPage />);
    expect(
      screen.getByRole("heading", { name: /Objetivos/i }),
    ).toBeInTheDocument();
  });

  it("renders the footer credit text", () => {
    render(<AboutPage />);
    expect(
      screen.getByText(
        /Desenvolvido como projeto de portfólio/i,
      ),
    ).toBeInTheDocument();
  });
});
