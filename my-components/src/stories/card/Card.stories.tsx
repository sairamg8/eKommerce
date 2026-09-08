import type { Meta, StoryObj } from "@storybook/react-vite";
import Card from "./Card";

const meta: Meta<typeof Card> = {
  title: "UI/Card",
  component: Card,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    children: "A Simple Card",
  },
};

export default meta;

type Story = StoryObj<typeof Card>;

export const Default: Story = {
  render: () => {
    return (
      <Card>
        <Card.Item>
          <h2>Header</h2>
        </Card.Item>
        <Card.Item>
          <h2>Header -1</h2>
        </Card.Item>
        <Card.Item>
          <h2>Header -2</h2>
        </Card.Item>
        <Card.Item>
          <h2>Header -3</h2>
        </Card.Item>
      </Card>
    );
  },
};
