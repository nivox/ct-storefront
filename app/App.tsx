import { useCallback, useContext, useEffect, useState } from 'react';
import { useCookies } from 'react-cookie';

import { CategoryTree, ProductTypeAttributes } from './utils';
import CategoryBar from './CategoryBar';
import FacetsPane from './FacetsPane';
import ProductsPane from './ProductsPane';
import SearchBar from './SearchBar';
import { ProjectContext, ProjectDetails } from './ProjectContext';
import { ProductPagedSearchResponse } from '@commercetools/platform-sdk';
import { useQuery } from '@tanstack/react-query';
import { Alert, Autocomplete, Button, ComboboxItem, Container, Loader, Modal, MultiSelect, Select, SimpleGrid, Stack, Title } from '@mantine/core';
import { fetchCategories, fetchLanguages, fetchProductTypes, productSearch, productSearchFacets, ProductSuggestions, productSuggestions } from './ct';

export type FacetsMap = Map<string, Map<string, number>>

function App() {
  const ctx = useContext(ProjectContext);

  const [initDone, setInitDone] = useState<boolean>(false);
  const [cookies, setCookies] = useCookies(["config"]);
  const [categoryTree, setCategoryTree] = useState<CategoryTree | null>(null);
  const [productTypeAttributes, setProductTypeAttributes] = useState<ProductTypeAttributes>(new ProductTypeAttributes([]));
  const [languageList, setLanguageList] = useState<string[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(languageList[0]);

  const [searchValue, setSearchValue] = useState("");
  const [suggestValue, setSuggestValue] = useState("");

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

  const getSuggestions = useCallback(async function(): Promise<ProductSuggestions> {
    return ctx ? await productSuggestions(ctx, suggestValue, currentLang) : Promise.reject("context not set")
  }, [suggestValue])

  const params = { page, searchValue, selectedCategoryId, selectedLanguage, facetsSelection };

  const productsQuery = useQuery({ queryKey: ['products', params], queryFn: getProducts, retry: false });
  const products = productsQuery.data;

  const suggestionsQuery = useQuery({ queryKey: ['suggestions', params], queryFn: getSuggestions, retry: false });
  const suggestions = suggestionsQuery.data;

  const getFacets = async function(): Promise<FacetsMap> {
    return ctx ? await productSearchFacets(ctx.projectClient, params.searchValue, params.selectedCategoryId, currentLang, productTypeAttributes || {}, params.facetsSelection || {}) : Promise.reject("context not set");
  }

  const facetsQuery = useQuery({ queryKey: ['facets', params], queryFn: getFacets, retry: false })
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
      const categoryTree = new CategoryTree(await fetchCategories(ctx.projectClient));
      const productTypeAttributes = new ProductTypeAttributes(await fetchProductTypes(ctx.projectClient));
      const languages = await fetchLanguages(ctx.projectClient);

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

  function handleIgnoreAttributes(ignoredAttributes: string[]) {
    if (!ctx) {
      return
    }

    if (productTypeAttributes == null) {
      return
    }

    productTypeAttributes.getAllAttributes().forEach(attribute => {
      productTypeAttributes.setIgnoreAttribute(attribute.definition.name, false);
    })

    ignoredAttributes.forEach(attribute => {
      productTypeAttributes.setIgnoreAttribute(attribute, true);
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
    .map(a => {return { label: a.definition.name, value: a.definition.name } }))  || []

  const facetsError = facetsQuery.isError ? <Alert>{facetsQuery.error.message}</Alert> : <></>
  const facetsContent = productTypeAttributes && facetsData ? <Stack>
    <FacetsPane facets={facetsData} productTypeAttributes={productTypeAttributes} lang={currentLang} facetsSelection={facetsSelection || {}} setFacetSelection={setSingleFacetSelection} />
    <Modal opened={showFacetConfig} onClose={() => setShowFacetConfig(false)}>
      <Modal.Header>
        <Modal.Title>Ingore attributes</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <MultiSelect label="attributes" data={attributeOptions} onChange={handleIgnoreAttributes}/>
      </Modal.Body>
    </Modal>
  </Stack> : <></>

  const content = ctx ? <div className="app">
    <Stack>
      {errorAlert}
      <Title order={1}>{ctx.projectKey} storefront</Title>
      <SimpleGrid cols={2}>
        <SearchBar suggestions={suggestions?.suggestions || []} onTriggerSearch={(value: string) => {
          setSearchValue(value);
          productsQuery.refetch()
        }} onKeyDown={(value: string) => { 
          setSuggestValue(value);
          suggestionsQuery.refetch()}}
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
