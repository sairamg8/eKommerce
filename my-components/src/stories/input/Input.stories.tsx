import type { Meta, StoryObj } from "@storybook/react-vite";
import type { Canvas } from "storybook/internal/types";
import Input from "./Input";
import { SiAnaconda } from "react-icons/si";
import { SiBluetooth } from "react-icons/si";
import { useEffect, useState } from "react";
import type { Props } from "./types";
import { fn, expect } from "storybook/test";

const selectInput = async (canvas: Canvas) => {
  const input = canvas.getByRole("textbox");

  return {
    input,
  };
};

const meta: Meta<typeof Input> = {
  title: "Form/Input",
  component: Input,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    inputProps: {
      placeholder: "Hello World",
      label: "Input",
    },
    value: "",
    onChange: fn(),
  },
  argTypes: {
    inputProps: {
      startIcon: {
        control: false,
      },
      endIcon: {
        control: false,
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof Input>;

const CInput = (args: Props) => {
  const [value, setValue] = useState(args.value);

  const { inputProps, ...rest } = args;

  useEffect(() => {
    setValue(args.value);
  }, [args.value]);

  return (
    <Input
      {...rest}
      value={value}
      onChange={(e) => {
        args.onChange?.(e);
        console.log(e);
        setValue(e.target.value);
      }}
      inputProps={{
        label: "Dummy Input",
        htmlFor: "With Start Icon",
        ...inputProps,
      }}
    />
  );
};

export const Default: Story = {
  render: (args) => {
    return <CInput {...args} />;
  },

  play: async ({ canvas, userEvent }) => {
    const { input } = await selectInput(canvas);
    await userEvent.type(input, "hello world!");
  },
};

export const WithStartIcon: Story = {
  args: {
    onStartIconClick: fn(),
    inputProps: {
      startIcon: (
        <SiAnaconda
          size={"23px"}
          color="#fff"
          title="Anaconda icon for start icon"
        />
      ),
    },
  },

  play: async ({ canvas, userEvent, args }) => {
    const startIcon = canvas.getByTestId("start_icon");

    await userEvent.click(startIcon);
    await expect(args.onStartIconClick).toHaveBeenCalled();
  },

  render: (args) => {
    return <CInput {...args} />;
  },
};

export const WithEndIcon: Story = {
  args: {
    onEndIconClick: fn(),
    inputProps: {
      endIcon: <SiBluetooth fontSize={"23px"} color="#fff" title="End icon" />,
      label: "Dummy Input",
    },
    value: "Hello World",
  },

  render: (args) => {
    return <CInput {...args} />;
  },

  play: async ({ canvas, userEvent, args }) => {
    const startIcon = canvas.getByTestId("end_icon");

    await userEvent.click(startIcon);
    await expect(args.onEndIconClick).toHaveBeenCalled();
  },
};

export const ControlledInput: Story = {
  args: {
    value: "Dummy Value",
    onChange: fn(),
    inputProps: {
      style: {
        background: "#f3f3f3",
        color: "#333",
      },
      label: "Dummy Input",
    },
  },
  argTypes: {
    value: {
      control: "text",
    },
    inputProps: {
      control: "object",
    },
  },
  render: (args) => {
    return <CInput {...args} />;
  },

  play: async ({ canvas, userEvent, args }) => {
    const input = canvas.getByRole("textbox");

    await userEvent.clear(input);
    await expect(input).toHaveValue("");
    await userEvent.type(input, "Hello world");

    await expect(args.onChange).toHaveBeenCalled();

    await expect(input).toHaveValue("Hello world");
  },
};

export const WithMessage: Story = {
  args: {
    msg: "No Data exist",
    inputProps: {
      label: "Dummy Input",
    },
  },
  render: (args) => {
    return <CInput {...args} />;
  },
};
