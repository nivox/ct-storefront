import './App.css';
import SearchBar from './SearchBar';
import Ct from './ct.js';
import { CategoryTree, ProductTypeAttributes } from './utils';
import CategoryBar from './CategoryBar';
import FacetsPane from './FacetsPane';
import ProductsPane from './ProductsPane';
import { useState, useEffect } from 'react';
import { Button, Container, Row, Col, Stack, Form } from 'react-bootstrap';

const apiEndpoint = "https://api.europe-west1.gcp.commercetools.com";

function App() {

  const [projectKey, setProjectKey] = useState("");
  const [token, setToken] = useState("");
  const [ct, setCt] = useState(null);
  const [categoryTree, setCategoryTree] = useState(null);
  const [productTypeAttributes, setProductTypeAttributes] = useState(null);
  const [languageList, setLanguageList] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState(null);

  const [searchValue, setSearchValue] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [facets, setFacets] = useState({});
  const [products, setProducts] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [facetsSelection, setFacetsSelection] = useState(null);

  async function triggerSearch() {
    console.log('search triggered for search=' + searchValue);
    let facets = await ct.productSearchFacets(searchValue, selectedCategoryId, selectedLanguage, productTypeAttributes, facetsSelection);
    let products = await ct.productSearch(searchValue, selectedCategoryId, selectedLanguage, productTypeAttributes, facetsSelection, 0, 10);

    setFacetsSelection(null);
    setFacets(facets);
    setProducts(products.results);
    setTotalProducts(products.total);
  }

  async function triggerSearchRefinement() {
    console.log('search refinement triggered');
    let facets = await ct.productSearchFacets(searchValue, selectedCategoryId, selectedLanguage, productTypeAttributes, facetsSelection);
    let products = await ct.productSearch(searchValue, selectedCategoryId, selectedLanguage, productTypeAttributes, facetsSelection, 0, 10);

    setFacets(facets);
    setProducts(products.results);
    setTotalProducts(products.total);
  }

  function setSingleFacetSelection(facetName, selections) {
    const currentSelections = facetsSelection || {};
    if (!selections || selections.length === 0) {
      console.log(`Removing facet selection for ${facetName}`);
      const cleanedSelctions = {...currentSelections};
      delete cleanedSelctions[facetName];
      setFacetsSelection(cleanedSelctions);
    } else {
      console.log(`Setting facet selection for ${facetName} to ${selections}`);
      setFacetsSelection({...currentSelections, [facetName]: selections});
    }
  }

  async function init() {
      const ct = new Ct(token, projectKey, apiEndpoint);
      const categoryTree = new CategoryTree(await ct.fetchCategories());
      const productTypeAttributes = new ProductTypeAttributes(await ct.fetchProductTypes());
      const languages = await ct.fetchLanguages();

      setCt(ct);
      setCategoryTree(categoryTree);
      setProductTypeAttributes(productTypeAttributes);
      setLanguageList(languages);
      setSelectedLanguage(languages[0]);
  }

  useEffect(() => {
    if (facetsSelection || selectedCategoryId) triggerSearchRefinement();
  }, [facetsSelection, selectedCategoryId]);

  if (!ct) {
    return (
      <div className="App">
      <Container>
        <Row>
          <Col>
              <Form.Control type="text" value={projectKey} onChange={e => setProjectKey(e.target.value)}placeholder="ProjectKey" />
          </Col>
        </Row>
        <Row>
          <Col>
              <Form.Control type="text" value={token} onChange={e => setToken(e.target.value)} placeholder="Token" />
          </Col>
        </Row>
        <Row>
          <Button onClick={_ => init()}>Apply</Button>
        </Row>
      </Container>
      </div>
    );
  } else {
    return (
      <div className="App">
      <Container>
        <Row>
          <Col>
            <h1>{projectKey} storefront</h1>
          </Col>
          <Col>
            <Form.Select onChange={e => setSelectedLanguage(e.target.value)}>
              {languageList.map( l => <option key={l} value={l}>{l}</option>)}
            </Form.Select>
          </Col>
        </Row>
        <Row>
          <Col>
            <SearchBar searchValue={searchValue} setSearchValue={setSearchValue} onTriggerSearch={triggerSearch}/>
          </Col> 
        </Row>
        <Row>
          <Col>
            <Stack direction="vertical" gap={3}>
              <div>
                <h2>Categories</h2>
                <CategoryBar selectedCategoryId={selectedCategoryId} setSelectedCategoryId={setSelectedCategoryId} categoryTree={categoryTree} lang={selectedLanguage}/>
              </div>
              <div>
                <h2>Facets</h2>
                <FacetsPane facets={facets} productTypeAttributes={productTypeAttributes} lang={selectedLanguage} facetsSelection={facetsSelection} setFacetSelection={setSingleFacetSelection} /> 
              </div>
            </Stack>
          </Col>
          <Col xs={8}>
            <h2>Results</h2>
              <ProductsPane products={products} total={totalProducts} lang={selectedLanguage} />
          </Col>
        </Row>
      </Container>
      </div>
    )
  }
}

export default App;
