import { SearchFullTextExpression, SearchCompoundExpression, ByProjectKeyRequestBuilder, ProductSearchFacetDistinctExpression, ProductSearchFacetResultBucket, Category, ProductType, SearchQuery, SearchPrefixExpression } from "@commercetools/platform-sdk";
import { ProductAttribute, ProductTypeAttributes, effectiveTypeName } from "./utils";
import type { ProjectDetails } from "./projectContext";

export type SearchMode = "lexical" | "semantic";

function _productCriteria(searchText: string, lang: string, postFilter: SearchQuery | null, mode: SearchMode = "semantic"): SearchQuery {
  let query: SearchQuery;

  if (mode === "semantic") {
    query = {"fullText": { field: "semanticRepresentation", value: searchText, language: lang} } as SearchFullTextExpression;
  } else {
    query = {
      "or": [
        { "fullText": { field: "name", value: searchText, language: lang } } as SearchFullTextExpression,
        { "fullText": { field: "description", value: searchText, language: lang } } as SearchFullTextExpression,
        { "fullText": { field: "slug", value: searchText, language: lang } } as SearchFullTextExpression,
        { "prefix": { field: "key", value: searchText } } as SearchPrefixExpression,
        { "prefix": { field: "variants.key", value: searchText } } as SearchPrefixExpression,
        { "prefix": { field: "variants.sku", value: searchText } } as SearchPrefixExpression,
      ]
    };
  }

  if (postFilter) {
    return {
      "and": [
        query,
        postFilter
      ]
    }
  } else {
    return query
  }
}

function _productFacetsFilter(facetsValue: Record<string, string[]>, productTypeAttributes: ProductTypeAttributes, lang: string, targetFacet: string | null): SearchCompoundExpression | null {
  if (!facetsValue || !productTypeAttributes) return null;

  const validFacets = Object.entries(facetsValue)
    .filter(([facetName, _]) => facetName !== targetFacet)

  if (validFacets.length == 0) {
    return null;
  }

  const facetExpressions = validFacets.map(([facetName, values]) => {
    console.log(`Processing facet ${facetName} with values ${values}`)
    const attrDef = productTypeAttributes.getAttribute(facetName).definition;
    const etype = effectiveTypeName(attrDef.type);
    let exprLang = null;
    if (etype === "ltext" || etype === "lenum") exprLang = lang;

    let field = "variants.attributes." + facetName;
    if (etype === "enum" || etype === "lenum") {
      field = `variants.attributes.${facetName}.label`;
    }

    const attributeMatches = values.map(v => {
      return { "exact": { field: field, value: v, language: exprLang, fieldType: etype } }
    })

    return values.length == 1 ? attributeMatches[0] : {
      "or": attributeMatches
    }
  })

  return facetExpressions.length == 1 ? facetExpressions[0] : {
    "and": facetExpressions
  };
}

export async function productSearchFacets(api: ByProjectKeyRequestBuilder, searchText: string, categoryId: string | null, lang: string, productTypeAttributes: ProductTypeAttributes, facetsValues: Record<string, string[]>, searchMode: SearchMode = "semantic") {
  const criteria = [
    categoryId ? { "exact": { field: "categoriesSubTree", value: categoryId } } : null,
    searchText !== "" ? _productCriteria(searchText, lang, null, searchMode) : null
  ].filter(e => e !== null);

  var query = undefined;
  if (criteria.length >= 2) {
    query = { "and": criteria };
  } else if (criteria.length == 1) {
    query = criteria[0];
  }

  const postFilter = _productFacetsFilter(facetsValues, productTypeAttributes, lang, null);

  const productTypeFacetsResponse = await api.products().search().post({
    body: {
      query,
      postFilter: postFilter || undefined,
      facets: [
        { "distinct": { name: "productType", field: "productType" } } as ProductSearchFacetDistinctExpression
      ]
    }
  }).execute();

  const productTypes: string[] = (productTypeFacetsResponse.body.facets as ProductSearchFacetResultBucket[]).find(f => f.name === "productType")?.buckets.map(b => b.key) || [];

  const attributes: ProductAttribute[] = [];
  productTypes.forEach(pt =>
    attributes.push(...productTypeAttributes.getAttributes(pt))
  )

  const localizedTypes = new Set(['ltext', 'lenum']);

  const facets = attributes.map(a => {
    const etype = effectiveTypeName(a.definition.type);
    let field = "variants.attributes." + a.definition.name;
    if (etype === "enum" || etype === "lenum") {
      field = `variants.attributes.${a.definition.name}.label`;
    }
    const filter = _productFacetsFilter(facetsValues, productTypeAttributes, lang, a.definition.name);
    const isLocalized = localizedTypes.has(etype);
    return { "distinct": { name: a.definition.name, field: field, filter, language: isLocalized ? lang : undefined, fieldType: etype } } as ProductSearchFacetDistinctExpression
  });

  const facetsResponse = await api.products().search().post({ body: { query, postFilter: postFilter || undefined, limit: 0, offset: 0, facets } }).execute();

  var facetsMap: Map<string, Map<string, number>> = new Map();

  facetsResponse.body.facets.forEach(facet => {
    const bucketValues = new Map<string, number>();
    (facet as ProductSearchFacetResultBucket).buckets.forEach(bucket => {
      bucketValues.set(bucket.key, bucket.count)
    })
    facetsMap.set(facet.name, bucketValues)
  })

  return facetsMap;
}

export async function productSearch(api: ByProjectKeyRequestBuilder, searchText: string, categoryId: string | null, lang: string, productTypeAttributes: ProductTypeAttributes, facetsValues: Record<string, string[]>, offset: number, limit: number, searchMode: SearchMode = "semantic") {
  const criteria = [
    categoryId ? { "exact": { field: "categoriesSubTree", value: categoryId } } : null,
    searchText !== "" ? _productCriteria(searchText, lang, null, searchMode) : null
  ].filter(e => e !== null);

  var query = undefined;
  if (criteria.length >= 2) {
    query = { "and": criteria };
  } else if (criteria.length == 1) {
    query = criteria[0];
  }

  const postFilterCriteria = _productFacetsFilter(facetsValues, productTypeAttributes, lang, null);
  const postFilter = searchText != "" ? _productCriteria(searchText, lang, postFilterCriteria, searchMode) : postFilterCriteria;

  console.log("query", JSON.stringify(query, null, 2));
  return await api.products().search().post({ body: { query, postFilter: postFilter || undefined, offset, limit, productProjectionParameters: {}, markMatchingVariants: true } }).execute();
}

export interface ProductSuggestions {
  suggestions: string[]
}

export async function productSuggestions(projectContext: ProjectDetails, searchText: string, lang: string): Promise<ProductSuggestions> {
  const requestBody = {
    field: `name.${lang}`,
    query: searchText
  };

  const url = `${projectContext.apiEndpoint}/${projectContext.projectKey}/products/search/suggest`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `bearer ${projectContext.token}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error calling product suggestions endpoint: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`API request failed with status ${response.status}: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error calling product suggestions endpoint:", error);
    throw error;
  }
}

export async function fetchCategories(api: ByProjectKeyRequestBuilder): Promise<Category[]> {
  const limit = 500;
  let offset = 0;
  let allResults: Category[] = [];
  let total = Infinity;

  while (offset < total) {
    const response = await api.categories().get({ queryArgs: { limit, offset } }).execute();
    allResults.push(...response.body.results);
    total = response.body.total ?? response.body.results.length;
    offset += response.body.results.length;
    if (response.body.results.length < limit) break;
  }
  return allResults;
}

export async function fetchProductTypes(api: ByProjectKeyRequestBuilder): Promise<ProductType[]> {
  const limit = 500;
  let offset = 0;
  let allResults: ProductType[] = [];
  let total = Infinity;

  while (offset < total) {
    const response = await api.productTypes().get({ queryArgs: { limit, offset } }).execute();
    allResults.push(...response.body.results);
    total = response.body.total ?? response.body.results.length;
    offset += response.body.results.length;
    if (response.body.results.length < limit) break;
  }
  return allResults;
}

export async function fetchLanguages(api: ByProjectKeyRequestBuilder): Promise<string[]> {
  let response = await api.get().execute();
  return response.body.languages
}
