import type { Meta, StoryObj } from "@storybook/react-vite";
import { Logo } from "./logo";

const meta: Meta<typeof Logo> = { title: "Brand/Logo", component: Logo };
export default meta;
type Story = StoryObj<typeof Logo>;

export const Default: Story = { args: { label: "Tafsila" } };

export const Large: Story = { args: { label: "Tafsila", className: "size-24" } };
