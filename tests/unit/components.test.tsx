// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { Breadcrumbs, Price, Stars, EmptyState } from "@/components/ui/primitives";

afterEach(cleanup);

describe("Price", () => {
  it("shows the AED price", () => {
    render(<Price price={19900} />);
    expect(screen.getByText("AED 199.00")).toBeTruthy();
  });
  it("shows the original price struck through with an accessible label when on sale", () => {
    const { container } = render(<Price price={15000} regular={20000} size="lg" />);
    expect(screen.getByText("AED 150.00")).toBeTruthy();
    expect(container.querySelector(".line-through")?.textContent).toContain("Was");
    expect(screen.getByText("Save 25%")).toBeTruthy();
  });
});

describe("Breadcrumbs", () => {
  it("renders an accessible trail with the current page marked and JSON-LD", () => {
    const { container } = render(<Breadcrumbs items={[{ name: "Shop", path: "/shop" }, { name: "Shawls", path: "/category/shawls" }]} />);
    expect(screen.getByRole("navigation", { name: "Breadcrumb" })).toBeTruthy();
    expect(screen.getByText("Shawls").getAttribute("aria-current")).toBe("page");
    expect(screen.getByRole("link", { name: "Home" }).getAttribute("href")).toBe("/");
    const ld = container.querySelector('script[type="application/ld+json"]');
    expect(JSON.parse(ld!.innerHTML)["@type"]).toBe("BreadcrumbList");
  });
});

describe("Stars & EmptyState", () => {
  it("exposes the rating to screen readers", () => {
    render(<Stars rating={4} />);
    expect(screen.getByRole("img", { name: "Rated 4 out of 5" })).toBeTruthy();
  });
  it("renders an action link", () => {
    render(<EmptyState title="Empty" action={{ href: "/shop", label: "Shop now" }} />);
    expect(screen.getByRole("link", { name: "Shop now" }).getAttribute("href")).toBe("/shop");
  });
});
