import { Combobox, TextInput, useCombobox } from "@mantine/core";
import { KeyboardEvent, useCallback, useState } from "react";

function SearchBar(props: { suggestions: string[], onTriggerSearch: (value: string) => any, onKeyDown: (value: string) => any }) {
  const [query, setQuery] = useState<string>("");
  const { suggestions, onTriggerSearch, onKeyDown } = props;
  const [opened, setOpened] = useState(false);
  const combobox = useCombobox({ opened: opened });

  const onSelectOption = useCallback((newQuery: string) => {
    setQuery(newQuery);
    setOpened(false);
    onTriggerSearch(newQuery);
  }, [])

  const options = suggestions.map((item) => (
    <Combobox.Option value={item} key={item} onClick={() => onSelectOption(item)}>
      {item}
    </Combobox.Option>
  ));

  const handleKeyboard = useCallback(function handleSearch(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      if (query) {
        onTriggerSearch(query);
        setOpened(false);
      }
    } else {
      onKeyDown(e.currentTarget.value);
      setOpened(true);
    }
  }, [query, onTriggerSearch, onKeyDown]);

  const searchBar = <Combobox store={combobox}>
    <Combobox.Target>
      <TextInput
        value={query}
        placeholder="Search..."
        onChange={(e) => setQuery(e.target.value)}
        onKeyUp={handleKeyboard}
      />
    </Combobox.Target>

    <Combobox.Dropdown>
      <Combobox.Options>{options}</Combobox.Options>
    </Combobox.Dropdown>
  </Combobox>

  return searchBar
}

export default SearchBar;
