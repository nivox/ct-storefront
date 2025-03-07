import { SearchOrExpression, SearchFullTextExpression, SearchExactExpression, SearchCompoundExpression, ByProjectKeyRequestBuilder, ProductSearchFacetDistinctExpression, _ProductSearchFacetResult, ProductSearchFacetResultBucket, Category, ProductType, SearchQueryExpression} from "@commercetools/platform-sdk";
import { ProductAttribute, ProductTypeAttributes } from "./utils";

// TODO: what is the proper way to combine with the facet expressions?
function variantLevelExpression(searchText: string, lang: string, facetExpressions: SearchQueryExpression[] = []) {
  return {
    "or": [
      { "exact": { field: "variants.key", value: searchText, language: lang, mustMatch: 'any' } } as SearchExactExpression,
      { "exact": { field: "variants.sku", value: searchText, language: lang, mustMatch: 'any' } } as SearchExactExpression,
    ]
  }
}

function _productSearchText(searchText: string, lang: string): SearchOrExpression {
  return {
    "or": [
      {
        "or": [
          { "fullText": { field: "name", value: searchText, language: lang, mustMatch: 'any' } } as SearchFullTextExpression,
          { "fullText": { field: "description", value: searchText, language: lang, mustMatch: 'any' } } as SearchFullTextExpression,
          { "fullText": { field: "slug", value: searchText, language: lang, mustMatch: 'any' } } as SearchFullTextExpression,
          { "exact": { field: "key", value: searchText, language: lang, mustMatch: 'any' } } as SearchExactExpression,
        ]
      },
      variantLevelExpression(searchText, lang)
    ]
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
    const atype = productTypeAttributes.getAttribute(facetName).definition.type.name;
    let exprLang = null;
    if (atype === "ltext" || atype === "lenum") exprLang = lang;

    let field = "variants.attributes." + facetName;
    if (atype === "enum" || atype === "lenum") {
      field = `variants.attributes.${facetName}.label`;
    }

    const attributeMatches = values.map(v => {
      return { "exact": { field: field, value: v, language: exprLang, fieldType: atype } }
    })

    return values.length == 1 ? attributeMatches[0] : {
      "or": attributeMatches
    }
  })

  return facetExpressions.length == 1 ? facetExpressions[0] : {
    "and": facetExpressions
  };
}

export async function productSearchFacets(api: ByProjectKeyRequestBuilder, searchText: string, categoryId: string | null, lang: string, productTypeAttributes: ProductTypeAttributes, facetsValues: Record<string, string[]>) {
  const criteria = [
    categoryId ? { "exact": { field: "categoriesSubTree", value: categoryId } } : null,
    searchText !== "" ? _productSearchText(searchText, lang) : null
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

  const facets = attributes.map(a => {
    let field = "variants.attributes." + a.definition.name;
    if (a.definition.type.name === "enum" || a.definition.type.name === "lenum") {
      field = `variants.attributes.${a.definition.name}.label`;
    }
    const filter = _productFacetsFilter(facetsValues, productTypeAttributes, lang, a.definition.name);
    return { "distinct": { name: a.definition.name, field: field, filter, language: lang, fieldType: a.definition.type.name } } as ProductSearchFacetDistinctExpression
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

export async function productSearch(api: ByProjectKeyRequestBuilder, searchText: string, categoryId: string | null, lang: string, productTypeAttributes: ProductTypeAttributes, facetsValues: Record<string, string[]>, offset: number, limit: number) {
  const criteria = [
    categoryId ? { "exact": { field: "categoriesSubTree", value: categoryId } } : null,
    searchText !== "" ? _productSearchText(searchText, lang) : null
  ].filter(e => e !== null);

  var query = undefined;
  if (criteria.length >= 2) {
    query = { "and": criteria };
  } else if (criteria.length == 1) {
    query = criteria[0];
  }

  const postFilterFacetsExpression = _productFacetsFilter(facetsValues, productTypeAttributes, lang, null);

  // note:
  // the variant level expressions need to be repeated to have correct results with respect to matching variants from the query part
  const postFilter = postFilterFacetsExpression === null ? null : { "and": [postFilterFacetsExpression, variantLevelExpression(searchText, lang)] }

  console.log("query", JSON.stringify(query, null, 2));
  return await api.products().search().post({ body: { query, postFilter: postFilter || undefined, offset, limit, productProjectionParameters: {} } }).execute();
}

export async function fetchCategories(api: ByProjectKeyRequestBuilder): Promise<Category[]> {
  // we should iterate over the pagination
  let response = await api.categories().get().execute();
  return response.body.results
}

export async function fetchProductTypes(api: ByProjectKeyRequestBuilder): Promise<ProductType[]> {
  // we should iterate over the pagination
  let response = await api.productTypes().get().execute();
  return response.body.results
}

export async function fetchLanguages(api: ByProjectKeyRequestBuilder): Promise<string[]> {
  // we should iterate over the pagination
  let response = await api.get().execute();
  return response.body.languages
}
