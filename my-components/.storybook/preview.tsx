import type { Preview } from "@storybook/react-vite";
import { configure } from "storybook/test";
import {
  withThemeByClassName,
  withThemeByDataAttribute,
} from "@storybook/addon-themes";

import "../src/assets/font.css";
import "../src/assets/colors.css";

configure({
  testIdAttribute: "data-test-id",
});

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },

  decorators: [
    withThemeByClassName({
      defaultTheme: "light",
      themes: {
        light: "light",
        dark: "dark",
      },
      parentSelector: "html",
    }),

    withThemeByDataAttribute({
      defaultTheme: "light",
      themes: {
        light: "light",
        dark: "dark",
      },
      parentSelector: "html",
      attributeName: "data-theme",
    }),
  ],
};

export default preview;
