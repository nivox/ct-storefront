import { ChangeEvent, useCallback, useContext, useEffect, useState } from 'react';
import { useCookies } from 'react-cookie';

import { CategoryTree, ProductTypeAttributes } from './utils';
import CategoryBar from './CategoryBar';
import FacetsPane from './FacetsPane';
import ProductsPane from './ProductsPane';
import SearchBar from './SearchBar';
import { ProjectContext, ProjectDetails } from './ProjectContext';
import { ProductPagedSearchResponse } from '@commercetools/platform-sdk';
import { useQuery } from '@tanstack/react-query';
import { Alert, Button, ComboboxItem, Container, Loader, Modal, Select, SimpleGrid, Stack, Title } from '@mantine/core';
import { productSearch, productSearchFacets } from './ct';

export type FacetsMap = Map<string, object>

function App() {
  const ctx = useContext(ProjectContext);

  const [initDone, setInitDone] = useState<boolean>(false);
  const [cookies, setCookies] = useCookies(["config"]);
  const [categoryTree, setCategoryTree] = useState<CategoryTree | null>(null);
  const [productTypeAttributes, setProductTypeAttributes] = useState<ProductTypeAttributes | null>(null);
  const [languageList, setLanguageList] = useState<string[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(languageList[0]);

  const [searchValue, setSearchValue] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [facetsSelection, setFacetsSelection] = useState<Record<string, string[]> | null>(null);

  const [showFacetConfig, setShowFacetConfig] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const currentLang = selectedLanguage || "en";

  const getProducts = async function(): Promise<ProductPagedSearchResponse> {
    if (!productTypeAttributes) {
      return Promise.reject("attributes not set")
    }

    return ctx ? (await productSearch(ctx.projectClient, searchValue, selectedCategoryId, currentLang, productTypeAttributes, facetsSelection || {}, page * 10, 10)).body : Promise.reject("context not set")
  }

  const params = { page, searchValue, selectedCategoryId, selectedLanguage, facetsSelection };

  const productsQuery = useQuery({ queryKey: ['products', params], queryFn: getProducts })
  const products = productsQuery.data;

  const getFacets = async function(): Promise<FacetsMap> {
    return ctx ? await productSearchFacets(ctx.projectClient, params.searchValue, params.selectedCategoryId, currentLang, productTypeAttributes, params.facetsSelection || {}) : Promise.reject("context not set");
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

  const init = useCallback(async function(ctx: ProjectDetails) {
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

  const errorAlert = error ? <Alert variant="danger" onClose={() => setError(null)}>{error}</Alert> : <></>;

  const attributeOptions = (productTypeAttributes && productTypeAttributes.getAllAttributes()
    .map(a => <option key={a.name} value={a.name} selected={a.ignored}>{a.label[currentLang]} ({a.name})</option>)) || []

  const facetsError = facetsQuery.isError ? <Alert>{facetsQuery.error.message}</Alert> : <></>
  const facetsContent = productTypeAttributes && facetsData ? <Stack>
    <FacetsPane facets={facetsData} productTypeAttributes={productTypeAttributes} lang={currentLang} facetsSelection={facetsSelection || {}} setFacetSelection={setSingleFacetSelection} />
    <Modal opened={showFacetConfig} onClose={() => setShowFacetConfig(false)}>
      <Modal.Header>
        <Modal.Title>Ingore attributes</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Select label="attributes">
        </Select>
      </Modal.Body>
    </Modal>
  </Stack> : <></>

  const content = ctx ? <div className="app">
    <Stack>
      {errorAlert}
      <Title order={1}>{ctx.projectKey} storefront</Title>
      <SimpleGrid cols={2}>
        <SearchBar onTriggerSearch={(value: string) => {
          setSearchValue(value);
          productsQuery.refetch()
        }}
        />
        <Select value={selectedLanguage} data={languageList.map(l => { return { "label": l, "value": l } as ComboboxItem })} onChange={setSelectedLanguage}>
        </Select>
      </SimpleGrid>
      <Title order={2}>Categories</Title>
      {categoryTree ? <CategoryBar selectedCategoryId={selectedCategoryId || undefined} setSelectedCategoryId={setSelectedCategoryId} categoryTree={categoryTree} lang={currentLang} /> : <></>}
      <Title order={2}>Facets</Title>
      <Button onClick={() => setShowFacetConfig(true)}>config</Button>
      {facetsError}
      {facetsContent}
      <Title order={2}>Results</Title>
      {productsQuery.isError ? <Alert>{productsQuery.error?.message}</Alert> : <></>}
      {products ? <ProductsPane searchResponse={products} lang={currentLang} page={page} triggerPagination={(page) => setPage(page)} /> : <Loader />}
    </Stack>
  </div> : <div>Not logged in</div>

  return (
    <Container>
      {errorAlert}
      {content}
    </Container>
  );

}

export default App;
