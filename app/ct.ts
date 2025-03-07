import { SearchOrExpression, SearchFullTextExpression, SearchExactExpression, SearchCompoundExpression, ByProjectKeyRequestBuilder, ProductSearchFacetDistinctExpression, _ProductSearchFacetResult, ProductSearchFacetResultBucket } from "@commercetools/platform-sdk";
import { ProductAttribute, ProductTypeAttributes } from "./utils";
import { FacetsMap } from "./App";

function _productSearchText(searchText: string, lang: string): SearchOrExpression {
  return {
    "or": [
      { "fullText": { field: "name", value: searchText, language: lang, mustMatch: 'any' } } as SearchFullTextExpression,
      { "fullText": { field: "description", value: searchText, language: lang, mustMatch: 'any' } } as SearchFullTextExpression,
      { "fullText": { field: "slug", value: searchText, language: lang, mustMatch: 'any' } } as SearchFullTextExpression,
      { "exact": { field: "key", value: searchText, language: lang, mustMatch: 'any' } } as SearchExactExpression,
      { "exact": { field: "variants.key", value: searchText, language: lang, mustMatch: 'any' } } as SearchExactExpression,
      { "exact": { field: "variants.sku", value: searchText, language: lang, mustMatch: 'any' } } as SearchExactExpression,
    ]
  }
}

function _productFacetsFilter(facetsValue: Record<string, string[]>, productTypeAttributes: ProductTypeAttributes, lang: string, targetFacet: string | null): SearchCompoundExpression | null {
  if (!facetsValue || !productTypeAttributes) return null;

  const validFacets = Object.entries(facetsValue)
    .filter(([facetName, _]) => facetName !== targetFacet)

  const facets = {
    "and": validFacets.map(([facetName, values]) => {
      console.log(`Processing facet ${facetName} with values ${values}`)
      const atype = productTypeAttributes.getAttribute(facetName).type.name;
      let exprLang = null;
      if (atype === "ltext" || atype === "lenum") exprLang = lang;

      let field = "variants.attributes." + facetName;
      if (atype === "enum" || atype === "lenum") {
        field = `variants.attributes.${facetName}.label`;
      }

      return {
        "or": values.map(v => {
          return { "exact": { field: field, value: v, language: exprLang, fieldType: atype } }
        }
        )
      }
    })
  };

  return validFacets.length > 0 ? facets : null;
}

export async function productSearchFacets(api: ByProjectKeyRequestBuilder, searchText: string, categoryId: string | null, lang: string, productTypeAttributes: ProductTypeAttributes | null, facetsValues: Record<string, string[]>) {
  const query = {
    "and": [
      categoryId ? { "exact": { field: "categoriesSubTree", value: categoryId } } : null,
      searchText !== "" ? _productSearchText(searchText, lang) : null
    ]
  };

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
    let field = "variants.attributes." + a.name;
    if (a.type.name === "enum" || a.type.name === "lenum") {
      field = `variants.attributes.${a.name}.label`;
    }
    const filter = _productFacetsFilter(facetsValues, productTypeAttributes, lang, a.name);
    return { "distinct": { name: a.name, field: field, filter, language: lang, fieldType: a.type.name } } as ProductSearchFacetDistinctExpression
  });

  const facetsResponse = await api.products().search().post({ body: { query, postFilter: postFilter || undefined, limit: 0, offset: 0, facets } }).execute();

  const facetsMap: FacetsMap = new Map(facetsResponse.body.facets.map(facet => {
    const facetValues = (facet as ProductSearchFacetResultBucket).buckets.map(bucket => {
      return { [bucket.key]: bucket.count }
    })
    return [facet.name, facetValues]
  }))
  
  return facetsMap;
}

export async function productSearch(api: ByProjectKeyRequestBuilder, searchText: string, categoryId: string | null, lang: string, productTypeAttributes: ProductTypeAttributes, facetsValues: Record<string, string[]>, offset: number, limit: number) {
  const query = {
    "and": [
      categoryId ? { "exact": { field: "categoriesSubTree", value: categoryId } } : null,
      searchText !== "" ? _productSearchText(searchText, lang) : null
    ]
  };

  const postFilter = _productFacetsFilter(facetsValues, productTypeAttributes, lang, null);
  console.log("query", JSON.stringify(query, null, 2));
  return await api.products().search().post({ body: { query, postFilter: postFilter || undefined, offset, limit } }).execute();
}

