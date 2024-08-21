interface CategoryReference {
  id: string
}

interface Category {
  id: string,
  name: Record<string, string>,
  parent?: CategoryReference,
  ancestors: CategoryReference[]
}

export class CategoryTree {
  categoryMap: Record<string, Category>;
  childrenMap: Record<string, Category[]>;
  roots: Category[];
  constructor(categories: Category[]) {
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

  get(categoryId: string) {
    return this.categoryMap[categoryId];
  }

  getRoots() {
    return this.roots;
  }

  getChildren(categoryId: string) {
    return this.childrenMap[categoryId] || [];
  }

  getPathToRoot(categoryId: string) {
    let c = this.categoryMap[categoryId];
    if (c) {
      let path = c.ancestors ? c.ancestors.map(c => this.categoryMap[c.id]) : [];
      path.push(c);
      return path;
    } else return [];
  }
}

interface ProductType {
  id: string,
  attributes: ProductAttribute[]
}

interface ProductAttribute {
  name: string,
  label: Record<string, string>,
  isSearchable: boolean
  ignored: boolean
}

export class ProductTypeAttributes {
  productTypeAttributeMap: Record<string, ProductAttribute[]>;
  attributeMap: Record<string, ProductAttribute>;
  constructor(productTypes: ProductType[]) {
    this.productTypeAttributeMap = {};
    this.attributeMap = {};
    productTypes.forEach(pt => {
      this.productTypeAttributeMap[pt.id] = pt.attributes.filter(a => a.isSearchable === true);
      pt.attributes.forEach(a => {
        if (a.isSearchable) {
          this.attributeMap[a.name] = a;
        }
      });
    });

    console.log(`Loaded ${productTypes.length} product types with ${Object.keys(this.attributeMap).length} searchable attributes.`)
  }

  getAttributes(productTypeId: string) {
    return this.productTypeAttributeMap[productTypeId].filter(a => !a.ignored) || [];
  };

  getAttribute(attributeName: string) {
    return this.attributeMap[attributeName];
  }

  getAllAttributes() {
    return Object.values(this.attributeMap);
  }

  setIgnoreAttribute(attributeName: string, ignored: boolean) {
    this.attributeMap[attributeName].ignored = ignored;
  }
}

