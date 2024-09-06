import { MultiSelect, ComboboxItem } from '@mantine/core';
import Stack from 'react-bootstrap/Stack';
import { FacetsMap } from './App';
import { ProductTypeAttributes } from './utils';

function FacetEntry(props: { facetName: string, facetLabel: string, facetOptions: Map<string, number>, facetSelection: string[], setFacetSelection: (facetName: string, selections: string[]) => void }) {
  const { facetOptions, facetSelection, facetLabel, facetName, setFacetSelection } = props;
  const options = Array.from(facetOptions.entries()).map(([key, count]) => ({ label: `${key} (${count})`, value: key } as ComboboxItem));

  return (
    <MultiSelect
      label={facetLabel}
      placeholder={facetName}
      value={facetSelection}
      data={options}
      onChange={(value) => setFacetSelection(facetName, value)}
    />
  )
}

function FacetsPane(props: { facets: FacetsMap, facetsSelection: Record<string, string[]>, productTypeAttributes: ProductTypeAttributes, lang: string, setFacetSelection: (facetName: string, selections: string[]) => void }) {
  const { facets, lang, productTypeAttributes, facetsSelection, setFacetSelection } = props;
  const facetEntries = Array.from(facets.entries())
    .filter(([_, facetOptions]) => facetOptions.size > 0)
    .map(([facetName, facetOptions]) => {
      let facetLabel = productTypeAttributes.getAttribute(facetName).label[lang];
      let selection = (facetsSelection && facetsSelection[facetName]) || [];
      return <FacetEntry key={facetName} facetName={facetName} facetLabel={facetLabel} facetOptions={facetOptions} facetSelection={selection} setFacetSelection={setFacetSelection} />
    });


  return (
    <Stack direction="vertical" gap={3}>
      {facetEntries}
    </Stack>
  )
}

export default FacetsPane;
