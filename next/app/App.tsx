'use client';

import 'bootstrap/dist/css/bootstrap.min.css';

import { ChangeEvent, useCallback, useEffect, useState } from 'react';
import { useCookies } from 'react-cookie';

import { Alert, Button, Col, Container, Form, Modal, Row, Stack } from 'react-bootstrap';

import { CategoryTree, ProductTypeAttributes } from './utils';
import CategoryBar from './CategoryBar';
import Ct from './ct.js';
import FacetsPane from './FacetsPane';
import ProductsPane from './ProductsPane';
import SearchBar from './SearchBar';

const apiEndpointDefault = "https://api.europe-west1.gcp.commercetools.com";

function App() {
  const [cookies, setCookies] = useCookies(["config"]);
  const [projectKey, setProjectKey] = useState(cookies.config ? cookies.config.projectKey : "");
  const [token, setToken] = useState(cookies.config ? cookies.config.token : "");
  const [apiEndpoint, setApiEndpoint] = useState(cookies.config ? cookies.config.apiEndpoint : apiEndpointDefault);
  const [ct, setCt] = useState<Ct | null>(null);
  const [categoryTree, setCategoryTree] = useState<CategoryTree | null>(null);
  const [productTypeAttributes, setProductTypeAttributes] = useState<ProductTypeAttributes | null>(null);
  const [languageList, setLanguageList] = useState<string[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);

  const [searchValue, setSearchValue] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [facets, setFacets] = useState({});
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [facetsSelection, setFacetsSelection] = useState<Record<string, string[]> | null>(null);

  const [showFacetConfig, setShowFacetConfig] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function triggerSearch() {
    if (ct == null) {
      return
    }

    try {
      console.log('search triggered for search=' + searchValue);
      let facets = await ct.productSearchFacets(searchValue, selectedCategoryId, selectedLanguage, productTypeAttributes, facetsSelection);
      let products = await ct.productSearch(searchValue, selectedCategoryId, selectedLanguage, productTypeAttributes, facetsSelection, 0, 10);

      setFacetsSelection(null);
      setFacets(facets);
      setProducts(products.results);
      setTotalProducts(products.total);
      setPage(0);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  const triggerSearchRefinement = useCallback(async () => {
    if (ct == null) {
      return
    }

    try {
      console.log('search refinement triggered');
      let facets = await ct.productSearchFacets(searchValue, selectedCategoryId, selectedLanguage, productTypeAttributes, facetsSelection);
      let products = await ct.productSearch(searchValue, selectedCategoryId, selectedLanguage, productTypeAttributes, facetsSelection, 0, 10);

      setFacets(facets);
      setProducts(products.results);
      setTotalProducts(products.total);
      setPage(0);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [ct, searchValue, selectedCategoryId, selectedLanguage, productTypeAttributes, facetsSelection]);
  
  async function triggerSearchPagination(newPage: number) {
    if (ct == null) {
      return
    }

    try {
      console.log('search pagination triggered for page=' + newPage);
      let products = await ct.productSearch(searchValue, selectedCategoryId, selectedLanguage, productTypeAttributes, facetsSelection, newPage * 10, 10);

      setProducts(products.results);
      setTotalProducts(products.total);
      setPage(newPage);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  function setSingleFacetSelection(facetName: string, selections: string[]) {
    const currentSelections = facetsSelection || {};
    if (!selections || selections.length === 0) {
      console.log(`Removing facet selection for ${facetName}`);
      const cleanedSelctions = { ...currentSelections } as Record<string, string[]>;
      delete cleanedSelctions[facetName];
      setFacetsSelection(cleanedSelctions);
    } else {
      console.log(`Setting facet selection for ${facetName} to ${selections}`);
      setFacetsSelection({ ...currentSelections, [facetName]: selections });
    }
  }

  async function init() {
    try {
      const ct = new Ct(token, projectKey, apiEndpoint);
      const categoryTree = new CategoryTree(await ct.fetchCategories());
      const productTypeAttributes = new ProductTypeAttributes(await ct.fetchProductTypes());
      const languages = await ct.fetchLanguages();

      if (cookies.config && cookies.config.ignoredAttributes) {
        (cookies.config.ignoredAttributes[projectKey] || []).forEach((a: string) => productTypeAttributes.setIgnoreAttribute(a, true));
      }

      setCt(ct);
      setCategoryTree(categoryTree);
      setProductTypeAttributes(productTypeAttributes);
      setLanguageList(languages);
      setSelectedLanguage(languages[0]);
      console.log(cookies);
      setCookies("config", { projectKey, token, apiEndpoint, ignoredAttributes: (cookies.config && cookies.config.ignoredAttributes) || {} });
    } catch (e) {
      setError((e as Error).message);
    }
  }

  function handleIgnoreAttributes(e: ChangeEvent) {
    if (productTypeAttributes == null) {
      return
    }

    let ignoredAttributes: string[] = [];
    Array.from((e.target as HTMLSelectElement).options).forEach( o => {
      productTypeAttributes.setIgnoreAttribute(o.value, o.selected); 
      if (o.selected) ignoredAttributes.push(o.value);
    });
    let config = {
      ignoredAttributes: {},
      ...(cookies.config || {}),
      projectKey,
      token,
      apiEndpoint
    }
    config.ignoredAttributes[projectKey] = ignoredAttributes;

    setCookies("config", config);
    console.log(`Setting ignored attributes to ${ignoredAttributes}`);
  }

  useEffect(() => {
    if(ct) triggerSearchRefinement();
  }, [facetsSelection, selectedCategoryId, ct, triggerSearchRefinement]);

  let errorAlert = null;
  if (error) {
    errorAlert = <Alert variant="danger" dismissible onClose={() => setError(null)}>{error}</Alert>
  }

  if (!ct) {
    return (
      <div className="App">
        <Container>
          <Row>
            {errorAlert}
          </Row>
          <Row>
            <Col>
              <Form.Control type="text" value={projectKey} onChange={e => setProjectKey(e.target.value)} placeholder="ProjectKey" />
            </Col>
          </Row>
          <Row>
            <Col>
              <Form.Control type="text" value={token} onChange={e => setToken(e.target.value)} placeholder="Token" />
            </Col>
          </Row>
          <Row>
            <Col>
              <Form.Control type="text" value={apiEndpoint} onChange={e => setApiEndpoint(e.target.value)} placeholder="Api Endpoint" />
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
            {errorAlert}
          </Row>
          <Row>
            <Col>
              <h1>{projectKey} storefront</h1>
            </Col>
            <Col>
              <Form.Select onChange={e => setSelectedLanguage(e.target.value)}>
                {languageList.map(l => <option key={l} value={l}>{l}</option>)}
              </Form.Select>
            </Col>
          </Row>
          <Row>
            <Col>
              <SearchBar searchValue={searchValue} setSearchValue={setSearchValue} onTriggerSearch={triggerSearch} />
            </Col>
          </Row>
          <Row>
            <Col>
              <Stack direction="vertical" gap={3}>
                <div>
                  <h2>Categories</h2>
                  {categoryTree ? <CategoryBar selectedCategoryId={selectedCategoryId || undefined} setSelectedCategoryId={setSelectedCategoryId} categoryTree={categoryTree} lang={selectedLanguage || "en"} /> : 
                  <></> }
                  
                </div>
                <div>
                  <Container>
                    <Row>
                      <Col>
                        <h2>Facets</h2>
                      </Col>
                      <Col>
                        <Button onClick={() => setShowFacetConfig(true)}>config</Button>
                      </Col>
                    </Row>
                    <Row>
                      <FacetsPane facets={facets} productTypeAttributes={productTypeAttributes} lang={selectedLanguage} facetsSelection={facetsSelection} setFacetSelection={setSingleFacetSelection} />
                      <Modal show={showFacetConfig} onHide={() => setShowFacetConfig(false)}>
                        <Modal.Header closeButton>
                          <Modal.Title>Ingore attributes</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                          <Form.Select multiple onChange={handleIgnoreAttributes}>
                            {
                              (productTypeAttributes && productTypeAttributes.getAllAttributes()
                              .map(a => <option key={a.name} value={a.name} selected={a.ignored}>{a.label[selectedLanguage || "en" ]} ({a.name})</option>)) || []
                            }
                          </Form.Select>
                        </Modal.Body>
                      </Modal>
                    </Row>
                  </Container>
                </div>
              </Stack>
            </Col>
            <Col xs={8}>
              <h2>Results</h2>
              <ProductsPane products={products} total={totalProducts} lang={selectedLanguage} page={page} triggerPagination={triggerSearchPagination} />
            </Col>
          </Row>
        </Container>
      </div>
    )
  }
}

export default App;
