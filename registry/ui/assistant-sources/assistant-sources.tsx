interface AssistantSourcesProps {
  items?: string[];
}

export const AssistantSources = ({ items }: AssistantSourcesProps) => {
  if (!items?.length) {
    return null;
  }

  return (
    <ul
      aria-label="Assistant sources"
      data-opendetail-placeholder="assistant-sources"
    >
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
};
