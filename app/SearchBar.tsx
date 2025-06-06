import { Autocomplete, TextInput } from "@mantine/core";
import { KeyboardEvent, useCallback, useState } from "react"; 

function SearchBar(props: { suggestions: string[], onTriggerSearch: (value: string) => any, onKeyDown: (value: string) => any }) {
  const [query, setQuery] = useState<string>("");

  const handleKeyboard = useCallback(function handleSearch(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      console.log('triggering search');
      if (query) {
        props.onTriggerSearch(query);
      }
    } else {
      console.log(e.currentTarget.value)
      props.onKeyDown(e.currentTarget.value)
    }
  }, [query])

  return (
      <Autocomplete value={query} data={props.suggestions} onChange={(e) => setQuery(e)} onKeyUp={handleKeyboard} placeholder="Search..." />
  )
}

export default SearchBar;
