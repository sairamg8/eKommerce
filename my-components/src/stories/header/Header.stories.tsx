import type { Meta, StoryObj } from "@storybook/react-vite";
import Header from "./Header";
import type { HeaderProps } from "./types";
import styles from "./Header.module.css";

const meta: Meta<typeof Header> = {
  title: "Page/Header",
  component: Header,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    children: <h1>Rendered</h1>,
  },
};

export default meta;

type Story = StoryObj<typeof Header>;

const CHeader = (args: HeaderProps) => {
  return <Header {...args} />;
};

export const Default: Story = {
  render: () => {
    return <CHeader />;
  },
};

export const HeaderWithBrand: Story = {
  render: () => {
    return (
      <CHeader>
        <Header.Brand>
          <img
            src="https://logos-world.net/wp-content/uploads/2020/04/Amazon-Logo.png"
            alt="Bootstrap Logo"
          />
        </Header.Brand>
      </CHeader>
    );
  },
};

export const HeaderWithItem: Story = {
  render: () => {
    return (
      <CHeader>
        <Header.Item>Home</Header.Item>
        <Header.Item>About</Header.Item>
        <Header.Item>Our services</Header.Item>
      </CHeader>
    );
  },
};

export const HeaderWithBrandAndItems: Story = {
  render: () => {
    return (
      <CHeader>
        <Header.Brand>
          <img
            src="https://logos-world.net/wp-content/uploads/2020/04/Amazon-Logo.png"
            alt="Bootstrap Logo"
          />
        </Header.Brand>
        <Header.Item>Home</Header.Item>
        <Header.Item>About</Header.Item>
        <Header.Item>Our services</Header.Item>

        <Header.Item elementStyles={styles.loginBtn}>Login</Header.Item>
      </CHeader>
    );
  },
};
