import type { Meta, StoryObj } from "@storybook/react-vite";
import { Badge } from "./badge";
import { sampleFor } from "./sample-text";
import { Table } from "./table";
import { Tabs } from "./tabs";

const meta: Meta = { title: "Display/Tabs and Table" };
export default meta;
type Story = StoryObj;

export const TabsStory: Story = {
  name: "Tabs",
  render: (_, context) => {
    const text = sampleFor(context);
    return (
      <Tabs
        label={text.title}
        dir={context.globals.direction === "ltr" ? "ltr" : "rtl"}
        items={[
          { value: "a", label: text.tabs[0], content: text.body },
          { value: "b", label: text.tabs[1], content: text.hint },
        ]}
      />
    );
  },
};

export const TableStory: Story = {
  name: "Table",
  render: (_, context) => {
    const text = sampleFor(context);
    const rows = [
      { id: "1", name: text.options[0], amount: 120 },
      { id: "2", name: text.options[1], amount: 250 },
      { id: "3", name: text.options[2], amount: 1800 },
    ];
    return (
      <Table
        caption={text.title}
        getRowKey={(row) => row.id}
        rows={rows}
        columns={[
          { id: "name", header: text.columns[0], cell: (row) => row.name },
          { id: "status", header: text.status, cell: () => <Badge tone="success">{text.status}</Badge> },
          { id: "amount", header: text.columns[1], numeric: true, cell: (row) => row.amount },
        ]}
      />
    );
  },
};
