

function _expr(type, field, text, lang=null, fieldType=null) {
  const expr = {
    field: field,
    value: text
  }

  if (lang) {
    expr.language = lang;
  }

  if (fieldType) {
    expr.fieldType = fieldType;
  }

  const res = {}
  res[type] = expr;
  return res;
}

function _compoundExpr(type, exprs) {
  const filteredExprs = exprs.filter(e => e !== null);
  if (filteredExprs.length === 1) {
    return filteredExprs[0]
  } else if (filteredExprs.length === 0) {
    return null
  } else{
    return {
      [type]: filteredExprs 
    }
  }
}

function _distinctFacet(name, field, filter=null, lang=null, fieldType=null) {
  return {
    "distinct": {
      name: name,
      field: field,
      fieldType: fieldType,
      language: lang,
      filter: filter
    }
  }
}

function extractFacets(facetResp) {
  const facets = {}
  facetResp.forEach(f => {
    const buckets = {};
    f.buckets.forEach(b => buckets[b.key] = b.count);
    facets[f.name] = buckets
  });

  return facets
}

function _productSearchText(searchText, lang) {
  return _compoundExpr("or", [
    _expr("fullText", "name", searchText, lang),
    _expr("fullText", "description", searchText, lang),
    _expr("fullText", "slug", searchText, lang),
    _expr("exact", "key", searchText),
    _expr("exact", "variants.key", searchText),
    _expr("exact", "variants.sku", searchText)
  ])
}

function _productFacetsFilter(facetsValue, productTypeAttributes, lang, targetFacet) {
  if (!facetsValue || !productTypeAttributes) return null;
  const validFacets = Object.entries(facetsValue)
      .filter(([facetName, _]) => facetName !== targetFacet)

  if (validFacets.length > 0) {
    return _compoundExpr("and", validFacets.map(([facetName, values]) => {
        console.log(`Processing facet ${facetName} with values ${values}`)
        const atype = productTypeAttributes.getAttribute(facetName).type.name;
        let exprLang = null;
        if (atype === "ltext" || atype === "lenum") exprLang = lang;

        let field = "variants.attributes." + facetName;
        if (atype === "enum" || atype === "lenum") {
          field = `variants.attributes.${facetName}.label`;
        }

        return _compoundExpr("or", values.map(v => _expr("exact", field, v, exprLang, atype)))
      }))
  } else return null;
}

class Ct { 
  constructor(token, projectKey, apiEndpoint) {
    this.token = token;
    this.projectKey = projectKey;
    this.apiEndpoint = apiEndpoint
  }

  async _doRequest(url, method="GET", jsonBody=null) {
    console.log(`Requesting ${url} with method ${method} and body ${JSON.stringify(jsonBody)}`);
    const contentTypeHeader = jsonBody ? { "Content-Type": "application/json" } : {};
    const response = await fetch(url, {
      method: method,
      body: jsonBody ? JSON.stringify(jsonBody) : null,
      headers: {
        Authorization: `Bearer ${this.token}`,
        ...contentTypeHeader
      }
    });
    console.log(`Response status: ${response.status}`);
    if (!response.ok) {
      const body = await response.text();
      console.log(`Response body: ${body}`);
      throw new Error(`Error performing request: status=${response.status}, body=${body}`);
    }

    return response.json();
  }

  async _query(api, size=-1) {
    let url = `${this.apiEndpoint}/${this.projectKey}/${api}`;
    console.log("Querying " + url);

    let offset = 0;

    const results = [];
    while (size<0 || results.length < size) {
      let limit = size >= 0 ? Math.min(500, size - results.length) : 500;
      let res = await this._doRequest(`${url}?offset=${offset}&limit=${limit}`)
      offset += res.count;
      results.push(...res.results);
      if (res.count < limit) break
    }

    return results;
  }
   
  async fetchLanguages() {
    const project = await this._doRequest(`${this.apiEndpoint}/${this.projectKey}`);
    return project.languages;
  }

  async fetchCategories() {
    return this._query("categories");
  }

  async fetchProductTypes() {
    return this._query("product-types");
  }

  async _productSearchRequest(query, postFilter, facets, offset, limit) {
    let url = `${this.apiEndpoint}/${this.projectKey}/products/search`;
    const req = {
      offset: offset,
      limit: limit,
      productProjectionParameters: {}
    }
    if (query) req.query = query;
    if (facets) req.facets = facets;
    if (postFilter) req.postFilter = postFilter;

    return this._doRequest(url, "POST", req)
  }



  async productSearchFacets(searchText, categoryId, lang, productTypeAttributes, facetsValues) {
    const query = _compoundExpr("and", [
      categoryId ? _expr("exact", "categoriesSubTree", categoryId) : null,
      searchText !== "" ? _productSearchText(searchText, lang) : null
    ]);

    const postFilter = _productFacetsFilter(facetsValues, productTypeAttributes, lang, null);

    const resp1 = await this._productSearchRequest(query, postFilter, [_distinctFacet("productType", "productType")], 0, 0);
  
    const productTypes = resp1.facets.find(f => f.name === "productType").buckets.map(b => b.key);
    const attributes = [];
    productTypes.forEach(pt => 
      attributes.push(...productTypeAttributes.getAttributes(pt))
    )

    const facets = attributes.map(a => {
      let field = "variants.attributes." + a.name;
      if (a.type.name === "enum" || a.type.name === "lenum") {
        field = `variants.attributes.${a.name}.label`;
      }
      const filter = _productFacetsFilter(facetsValues, productTypeAttributes, lang, a.name);
      return _distinctFacet(a.name, field, filter, lang, a.type.name)
    });

    const resp2 = await this._productSearchRequest(query, postFilter, facets, 0, 0);
    return extractFacets(resp2.facets);
  }

  async productSearch(searchText, categoryId, lang, productTypeAttributes, facetsValues, offset, limit) {
    const query = _compoundExpr("and", [
      categoryId ? _expr("exact", "categoriesSubTree", categoryId) : null,
      searchText !== "" ? _productSearchText(searchText, lang) : null
    ]);

    const postFilter = _productFacetsFilter(facetsValues, productTypeAttributes, lang, null);
    return this._productSearchRequest(query, postFilter, null, offset, limit);
  }
}

export default Ct;
