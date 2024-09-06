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
import { useQuery } from '@tanstack/react-query';

export type FacetsMap = Map<string, Map<string, number>>

function App() {
  const ctx = useContext(ProjectContext);

  const [initDone, setInitDone] = useState<boolean>(false);
  const [cookies, setCookies] = useCookies(["config"]);
  const [categoryTree, setCategoryTree] = useState<CategoryTree | null>(null);
  const [productTypeAttributes, setProductTypeAttributes] = useState<ProductTypeAttributes | null>(null);
  const [languageList, setLanguageList] = useState<string[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);

  const [searchValue, setSearchValue] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [facetsSelection, setFacetsSelection] = useState<Record<string, string[]> | null>(null);

  const [showFacetConfig, setShowFacetConfig] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const currentLang = selectedLanguage || "en";

  const getProducts = async function (): Promise<ProductPagedSearchResponse> {
    if (!productTypeAttributes) {
      return Promise.reject("attributes not set")
    }

    return ctx ? ctx.ct.productSearch(searchValue, selectedCategoryId, selectedLanguage, productTypeAttributes, facetsSelection, page * 10, 10) : Promise.reject("context not set")
  }

  const params = { page, searchValue, selectedCategoryId, selectedLanguage, facetsSelection };

  const productsQuery = useQuery({ queryKey: ['products', params], queryFn: getProducts })
  const products = productsQuery.data;

  const getFacets = async function (): Promise<FacetsMap> {
    return ctx ? await ctx.ct.productSearchFacets(params.searchValue, params.selectedCategoryId, params.selectedLanguage, productTypeAttributes, params.facetsSelection) as FacetsMap : Promise.reject("context not set");
  }

  const facetsQuery = useQuery({ queryKey: ['facets', params], queryFn: getFacets })
  const facetsData = facetsQuery.data;

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
      setCookies("config", {
        projectKey: ctx.projectKey,
        clientId: ctx.clientId,
        clientSecret: ctx.clientSecret,
        token: ctx.token,
        apiEndpoint: ctx.apiEndpoint,
        authEndpoint: ctx.authEndpoint,
        ignoredAttributes: (cookies.config && cookies.config.ignoredAttributes) || {}
      });
    } catch (e) {
      setError("init error: " + (e as Error).message);
    }
  }, [cookies, setCookies, setError, setSelectedLanguage, setLanguageList, setProductTypeAttributes, setCategoryTree])

  useEffect(() => {
    if (ctx && !initDone) {
      setInitDone(true)
      init(ctx)
    }
  }, [ctx, init, initDone])

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

  const errorAlert = error ? <Alert variant="danger" dismissible onClose={() => setError(null)}>{error}</Alert> : <></>;

  const facetsError = facetsQuery.isError ? <Alert>{facetsQuery.error.message}</Alert> : <></>
  const facetsContent = productTypeAttributes && facetsData ? <Row>
    <FacetsPane facets={facetsData} productTypeAttributes={productTypeAttributes} lang={currentLang} facetsSelection={facetsSelection || {}} setFacetSelection={setSingleFacetSelection} />
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
      <Row className='mb-2 mt-2'>
        <Col md="10">
          <h1>{ctx.projectKey} storefront</h1>
        </Col>
        <Col md="2" xs="3" sm="3" >
          <Form.Select onChange={e => setSelectedLanguage(e.target.value)}>
            {languageList.map(l => <option key={l} value={l}>{l}</option>)}
          </Form.Select>
        </Col>
      </Row>
      <Row>
        <Col>
          <SearchBar searchValue={searchValue} setSearchValue={setSearchValue} onTriggerSearch={() => productsQuery.refetch()} />
        </Col>
      </Row>
      <Row className='mt-2'>
        <Col>
          <Stack direction="vertical" gap={3}>
            <h2>Categories</h2>
            <Row>
              {categoryTree ? <CategoryBar selectedCategoryId={selectedCategoryId || undefined} setSelectedCategoryId={setSelectedCategoryId} categoryTree={categoryTree} lang={currentLang} /> : <></>}
            </Row>
            <Row>
              <Col>
                <h2>Facets</h2>
              </Col>
              <Col>
                <Button onClick={() => setShowFacetConfig(true)}>config</Button>
              </Col>
            </Row>
            <Row>{facetsError}</Row>
            <Row>{facetsContent}</Row>
          </Stack>
        </Col>
        <Col xs={8}>
          <h2>Results</h2>
          {productsQuery.isError ? <Alert>{productsQuery.error?.message}</Alert> : <></>}
          {products ? <ProductsPane searchResponse={products} lang={currentLang} page={page} triggerPagination={(page) => setPage(page)} /> : <Spinner />}
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
