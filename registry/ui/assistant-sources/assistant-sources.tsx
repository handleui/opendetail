interface AssistantSourcesProps {
  items?: string[];
}

export const AssistantSources = ({
  items = ["Assistant sources scaffold"],
}: AssistantSourcesProps) => (
  <ul
    aria-label="Assistant sources"
    data-opendetail-placeholder="assistant-sources"
  >
    {items.map((item) => (
      <li key={item}>{item}</li>
    ))}
  </ul>
);
