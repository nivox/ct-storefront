import 'bootstrap/dist/css/bootstrap.min.css';

import { ChangeEvent, useCallback, useContext, useEffect, useState } from 'react';
import { useCookies } from 'react-cookie';

import { Alert, Button, Col, Container, Form, Modal, Row, Spinner, Stack } from 'react-bootstrap';

import { CategoryTree, ProductTypeAttributes } from './utils';
import CategoryBar from './CategoryBar';
import FacetsPane from './FacetsPane';
import ProductsPane from './ProductsPane';
import SearchBar from './SearchBar';
import { ProjectContext, ProjectDetails } from './ProjectContext';
import { ProductPagedSearchResponse } from '@commercetools/platform-sdk';

function App() {
  const ctx = useContext(ProjectContext);

  const [cookies, setCookies] = useCookies(["config"]);
  const [categoryTree, setCategoryTree] = useState<CategoryTree | null>(null);
  const [productTypeAttributes, setProductTypeAttributes] = useState<ProductTypeAttributes | null>(null);
  const [languageList, setLanguageList] = useState<string[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);

  const [searchValue, setSearchValue] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [facets, setFacets] = useState({});
  const [searchResponse, setSearchResponse] = useState<ProductPagedSearchResponse | null>(null);
  const [page, setPage] = useState(1);
  const [facetsSelection, setFacetsSelection] = useState<Record<string, string[]> | null>(null);

  const [showFacetConfig, setShowFacetConfig] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentLang = selectedLanguage || "en";

  async function triggerSearch() {
    if (!ctx) {
      return
    }

    try {
      console.log('search triggered for search=' + searchValue);
      
      if (!productTypeAttributes) {
        return
      }

      let facets = await ctx.ct.productSearchFacets(searchValue, selectedCategoryId, selectedLanguage, productTypeAttributes, facetsSelection);
      const products: ProductPagedSearchResponse = await ctx.ct.productSearch(searchValue, selectedCategoryId, selectedLanguage, productTypeAttributes, facetsSelection, 0, 10);

      setFacetsSelection(null);
      setFacets(facets);
      setSearchResponse(products);
      setPage(0);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  const triggerSearchRefinement = useCallback(async () => {
    if (!ctx) {
      return
    }

    try {
      console.log('search refinement triggered');

      if (!productTypeAttributes) {
        return
      }
      
      let facets = await ctx.ct.productSearchFacets(searchValue, selectedCategoryId, selectedLanguage, productTypeAttributes, facetsSelection);
      const products: ProductPagedSearchResponse = await ctx.ct.productSearch(searchValue, selectedCategoryId, selectedLanguage, productTypeAttributes, facetsSelection, 0, 10);

      setFacets(facets);
      setSearchResponse(products);
      setPage(0);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [ctx, searchValue, selectedCategoryId, selectedLanguage, productTypeAttributes, facetsSelection]);

  async function triggerSearchPagination(newPage: number) {
    if (!ctx) {
      return
    }

    try {
      console.log('search pagination triggered for page=' + newPage);
      const products: ProductPagedSearchResponse = await ctx.ct.productSearch(searchValue, selectedCategoryId, selectedLanguage, productTypeAttributes, facetsSelection, newPage * 10, 10);

      setSearchResponse(products);
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

  const init = useCallback(async function (ctx: ProjectDetails) {
    try {
      const categoryTree = new CategoryTree(await ctx.ct.fetchCategories());
      const productTypeAttributes = new ProductTypeAttributes(await ctx.ct.fetchProductTypes());
      const languages = await ctx.ct.fetchLanguages();

      if (cookies.config && cookies.config.ignoredAttributes) {
        (cookies.config.ignoredAttributes[ctx.projectKey] || []).forEach((a: string) => productTypeAttributes.setIgnoreAttribute(a, true));
      }

      setCategoryTree(categoryTree);
      setProductTypeAttributes(productTypeAttributes);
      setLanguageList(languages);
      setSelectedLanguage(languages[0]);
      console.log(cookies);
      setCookies("config", { projectKey: ctx.projectKey, token: ctx.token, apiEndpoint: ctx.apiEndpoint, ignoredAttributes: (cookies.config && cookies.config.ignoredAttributes) || {} });
    } catch (e) {
      setError((e as Error).message);
    }
  }, [cookies, setCookies, setError, setSelectedLanguage, setLanguageList, setProductTypeAttributes, setCategoryTree])

  function handleIgnoreAttributes(e: ChangeEvent) {
    if (!ctx) {
      return
    }

    if (productTypeAttributes == null) {
      return
    }

    let ignoredAttributes: string[] = [];
    Array.from((e.target as HTMLSelectElement).options).forEach(o => {
      productTypeAttributes.setIgnoreAttribute(o.value, o.selected);
      if (o.selected) ignoredAttributes.push(o.value);
    });
    let config = {
      ignoredAttributes: {},
      ...(cookies.config || {}),
      projectKey: ctx.projectKey,
      token: ctx.token,
      apiEndpoint: ctx.apiEndpoint
    }
    config.ignoredAttributes[ctx.projectKey] = ignoredAttributes;

    setCookies("config", config);
    console.log(`Setting ignored attributes to ${ignoredAttributes}`);
  }

  useEffect(() => {
    if (ctx) triggerSearchRefinement();
  }, [facetsSelection, selectedCategoryId, ctx, triggerSearchRefinement]);

  useEffect(() => {
    if (ctx) {
      init(ctx)
    }
  }, [ctx])

  const errorAlert = error ? <Alert variant="danger" dismissible onClose={() => setError(null)}>{error}</Alert> : <></>;

  const facetsContent = productTypeAttributes ? <Row>
    <FacetsPane facets={facets} productTypeAttributes={productTypeAttributes} lang={selectedLanguage} facetsSelection={facetsSelection} setFacetSelection={setSingleFacetSelection} />
    <Modal show={showFacetConfig} onHide={() => setShowFacetConfig(false)}>
      <Modal.Header closeButton>
        <Modal.Title>Ingore attributes</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form.Select multiple onChange={handleIgnoreAttributes}>
          {
            (productTypeAttributes && productTypeAttributes.getAllAttributes()
              .map(a => <option key={a.name} value={a.name} selected={a.ignored}>{a.label[currentLang]} ({a.name})</option>)) || []
          }
        </Form.Select>
      </Modal.Body>
    </Modal>
  </Row> : <></>

  const content = ctx ? <div className="app">
    <>
      <Row>
        {errorAlert}
      </Row>
      <Row>
        <Col>
          <h1>{ctx.projectKey} storefront</h1>
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
              {categoryTree ? <CategoryBar selectedCategoryId={selectedCategoryId || undefined} setSelectedCategoryId={setSelectedCategoryId} categoryTree={categoryTree} lang={currentLang} /> :
                <></>}
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
                {facetsContent}
              </Container>
            </div>
          </Stack>
        </Col>
        <Col xs={8}>
          <h2>Results</h2>
          {searchResponse ? <ProductsPane searchResponse={searchResponse} lang={currentLang} page={page} triggerPagination={triggerSearchPagination} /> : <Spinner />}
        </Col>
      </Row>
    </>
  </div> : <div>Not logged in</div>

  return (
    <Container>
      <Row>
        {errorAlert}
      </Row>
      {content}
    </Container>
  );

}

export default App;
