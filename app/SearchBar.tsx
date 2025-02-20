import { TextInput } from "@mantine/core";
import { KeyboardEvent, useState } from "react"; 

function SearchBar(props: { onTriggerSearch: (value: string) => any }) {
  const [query, setQuery] = useState<string>("");

  function handleSearch(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      console.log('triggering search');
      if (query) {
        props.onTriggerSearch(query);
      }
    }
  }

  return (
        <TextInput value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={handleSearch} placeholder="Search..." />
  )
}

export default SearchBar;
