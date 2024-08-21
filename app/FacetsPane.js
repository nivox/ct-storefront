import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Stack from 'react-bootstrap/Stack';

function FacetEntry({facetName, facetLabel, facetOptions, facetSelection, setFacetSelection}) {

  const options = Object.entries(facetOptions).map(([key, count]) => {
    if (facetSelection.includes(key)) {
      return <option key={key} value={key} selected>{key} ({count})</option> 
    } else {
      return <option key={key} value={key}>{key} ({count})</option>
    }
  });
  
  function handleSelect(e) {
    const selections=[];
    Array.from(e.target.options).forEach( o => {
      if (o.selected) selections.push(o.value);
    });
    console.log(`Setting facet selection for ${facetName} to ${selections} via ${setFacetSelection}`);
    setFacetSelection(facetName, selections);
  }

  return (
    <Form.Group>
      <Form.Label>{facetLabel}</Form.Label>
      <Col>
        <Form.Select key={facetName} multiple onChange={handleSelect}> {options} </Form.Select>
      </Col>
    </Form.Group>
  )
}


function FacetsPane({facets, facetsSelection, productTypeAttributes, lang, setFacetSelection}) {
  const facetEntries = Object.entries(facets)
    .filter(([_, facetOptions]) => Object.keys(facetOptions).length > 0)
    .map(([facetName, facetOptions]) => {
      let facetLabel = productTypeAttributes.getAttribute(facetName).label[lang];
      let selection = (facetsSelection && facetsSelection[facetName]) || [];
      return <FacetEntry key={facetName} facetName={facetName} facetLabel={facetLabel} facetOptions={facetOptions} facetSelection={selection} setFacetSelection={setFacetSelection}/>
    });


  return (
    <Stack direction="vertical" gap={3}>
    {facetEntries}
    </Stack>
  )
}

export default FacetsPane;
