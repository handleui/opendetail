interface AssistantInputProps {
  placeholder?: string;
}

export const AssistantInput = ({
  placeholder = "Assistant input scaffold",
}: AssistantInputProps) => (
  <form data-opendetail-placeholder="assistant-input">
    <label>
      <span className="sr-only">Ask a documentation question</span>
      <textarea defaultValue={placeholder} disabled name="question" />
    </label>
    <button disabled type="submit">
      Ask
    </button>
  </form>
);
