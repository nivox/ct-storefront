import { MultiSelect, ComboboxItem, Title, SimpleGrid } from '@mantine/core';
import { FacetsMap } from './App';
import { ProductTypeAttributes } from './utils';

function FacetEntry(props: { facetName: string, facetLabel: string, facetOptions: Map<string, number>, facetSelection: string[], setFacetSelection: (facetName: string, selections: string[]) => void }) {
  const { facetOptions, facetSelection, facetLabel, facetName, setFacetSelection } = props;
  var options = Array.from(facetOptions.entries()).map(([key, count]) => ({ label: `${key} (${count})`, value: key } as ComboboxItem));

  if (facetName == "size") {
    let optionsMap = new Map(options.map(o => [o.value, o.label]));
    let sizes = ["XS", "S", "M", "L", "XL", "XXL"];
    sizes.forEach(size => {
      if (!optionsMap.has(size)) {
        optionsMap.set(size, size + " (forced)")
      }
    });

    options = Array.from(optionsMap.entries()).map(([value, label]) => ({ label, value } as ComboboxItem));
  }

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
  const facetsMap = facets as Map<string, Map<string, number>>

  const facetEntries = Array.from(facetsMap.entries())
    .filter(([_, facetOptions]) => facetOptions.size > 0)
    .map(([facetName, facetOptions]) => {
      let facetLabel = productTypeAttributes.getAttribute(facetName).definition.label[lang];
      let selection = (facetsSelection && facetsSelection[facetName]) || [];
      return <FacetEntry key={facetName} facetName={facetName} facetLabel={facetLabel} facetOptions={facetOptions} facetSelection={selection} setFacetSelection={setFacetSelection} />
    });

  return (
    <>
    <Title order={3}>Filter</Title>
    <SimpleGrid cols={4}>
      {facetEntries}
    </SimpleGrid>
  </>
  )
}

export default FacetsPane;
