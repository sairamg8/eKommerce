import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import Input from "./Input";

const defaultProps = {
  dataTestId: "input",
};

describe("Input", () => {
  test("Render Input correctly", () => {
    render(<Input {...defaultProps} />);

    const inputEl = screen.getByTestId(defaultProps.dataTestId);
    expect(inputEl).toBeInTheDocument();
  });
});
