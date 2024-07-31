export class CategoryTree {
  constructor(categories) {
    this.categoryMap = {};
    this.childrenMap = {};
    this.roots = [];

    categories.forEach(c => {
      this.categoryMap[c.id] = c;
      if (!c.parent) {
        this.roots.push(c);
      } else {
        if (!this.childrenMap[c.parent.id]) {
          this.childrenMap[c.parent.id] = [];
        }
        this.childrenMap[c.parent.id].push(c);
      }
    });
    console.log(`Loaded ${categories.length} categories with ${this.roots.length} roots.`);
  }

  get(categoryId) {
    return this.categoryMap[categoryId];
  }

  getRoots() {
    return this.roots;
  }

  getChildren(categoryId) {
    return this.childrenMap[categoryId] || [];
  }

  getPathToRoot(categoryId) {
    let c = this.categoryMap[categoryId];
    if (c) {
      let path = c.ancestors ? c.ancestors.map(c => this.categoryMap[c.id]) : [];
      path.push(c);
      return path;
    } else return [];
  }
}

export class ProductTypeAttributes {
  constructor(productTypes) {
    this.productTypeMap = {};
    this.attributeMap = {};
    productTypes.forEach(pt => {
      this.productTypeMap[pt.id] = pt.attributes.filter(a => a.isSearchable === true);
      pt.attributes.forEach(a => {
        if (a.isSearchable) {
          this.attributeMap[a.name] = a;
        }
      });
    });

    console.log(`Loaded ${productTypes.length} product types with ${Object.keys(this.attributeMap).length} searchable attributes.`)
  }

  getAttributes(productTypeId) {
    return this.productTypeMap[productTypeId].filter(a => !a.ignored) || [];
  };

  getAttribute(attributeName) {
    return this.attributeMap[attributeName];
  }

  getAllAttributes() {
    return Object.values(this.attributeMap);
  }

  setIgnoreAttribute(attributeName, ignored) {
    this.attributeMap[attributeName].ignored = ignored;
  }
}

